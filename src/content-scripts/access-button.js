/**
 * Academic Access Extension - Access Button
 * 
 * Creates and manages the floating "Access via your library" button
 * that appears on paywalled pages.
 */

import { accessViaLibrary } from '../modules/proxy-redirect.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  buttonPosition: 'bottom-right',  // 'bottom-right', 'top-right', 'bottom-left', 'top-left'
  autoHide: true,                  // Whether to automatically hide the button after a delay
  autoHideDelay: 5000,             // Time in ms before auto-hiding
  displayType: 'button',           // 'button' or 'notification'
  showIcon: true,                  // Whether to show the icon
  textColor: '#ffffff',            // Text color
  backgroundColor: '#2c6bed',      // Background color
  hoverColor: '#1d5cdb',           // Background color on hover
  zIndex: 2147483646               // z-index to ensure visibility (max - 1)
};

/**
 * AccessButton class for managing the UI element
 */
class AccessButton {
  /**
   * Create a new AccessButton instance
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.elements = {
      container: null,
      button: null,
      notification: null
    };
    this.timeouts = {
      autoHide: null
    };
    this.state = {
      isVisible: false,
      institution: null,
      currentUrl: null,
      pageMetadata: {}
    };
  }

  /**
   * Initialize the access button
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Load institution from storage
      await this.loadInstitution();
      
      // Create DOM elements
      this.createElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('Error initializing AccessButton:', error);
      return false;
    }
  }

  /**
   * Load the user's institution from storage
   * @returns {Promise<Object|null>} Institution object or null if not found
   */
  async loadInstitution() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['institution'], (result) => {
        this.state.institution = result.institution || null;
        resolve(this.state.institution);
      });
    });
  }

  /**
   * Create DOM elements for the button
   */
  createElements() {
    // Create container if it doesn't exist
    if (!this.elements.container) {
      this.elements.container = document.createElement('div');
      this.elements.container.className = 'academic-access-container';
      this.elements.container.style.cssText = `
        position: fixed;
        ${this.config.buttonPosition.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${this.config.buttonPosition.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: ${this.config.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        box-sizing: border-box;
      `;
      document.body.appendChild(this.elements.container);
    }

    // Create the button based on display type
    if (this.config.displayType === 'button') {
      this.createFloatingButton();
    } else {
      this.createNotification();
    }
  }

  /**
   * Create a floating button UI
   */
  createFloatingButton() {
    this.elements.button = document.createElement('button');
    this.elements.button.className = 'academic-access-button';
    this.elements.button.setAttribute('aria-label', 'Access via your library');
    
    this.elements.button.style.cssText = `
      display: ${this.state.isVisible ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      gap: 8px;
      background-color: ${this.config.backgroundColor};
      color: ${this.config.textColor};
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: background-color 0.2s ease;
    `;
    
    // Create button content
    const buttonContent = document.createElement('span');
    buttonContent.textContent = 'Access via your library';
    
    // Add icon if enabled
    if (this.config.showIcon) {
      const icon = document.createElement('span');
      icon.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: ${this.config.textColor};
        mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTMuNS03Yy45NCAwIDEuNy0uNzYgMS43LTEuN3MtLjc2LTEuNy0xLjctMS43LTEuNy43Ni0xLjcgMS43LjQyIDEuNyAxLjcgMS43em0tNy01LjNjLS45NCAwLTEuNy43Ni0xLjcgMS43cy43NiAxLjcgMS43IDEuNyAxLjctLjc2IDEuNy0xLjdjMC0xLjExLS43Ni0xLjctMS43LTEuN3ptMS43IDguOFY5LjdoLjdWNi40M2MwLS4zOS0uMy0uNjMtLjctLjYzLS4yNSAwLS41LjE1LS42LjM0bC0zLjEgNS4wOWMtLjE1LjI0LS4xLjYuMi44LjIuMTUuNC4yLjUuMmgydi44YzAgLjQwMi4zMDIuNy43LjcuNDEgMCAuNy0uMyA3LS42OTV6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=');
        -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTMuNS03Yy45NCAwIDEuNy0uNzYgMS43LTEuN3MtLjc2LTEuNy0xLjctMS43LTEuNy43Ni0xLjcgMS43LjQyIDEuNyAxLjcgMS43em0tNy01LjNjLS45NCAwLTEuNy43Ni0xLjcgMS43cy43NiAxLjcgMS43IDEuNyAxLjctLjc2IDEuNy0xLjdjMC0xLjExLS43Ni0xLjctMS43LTEuN3ptMS43IDguOFY5LjdoLjdWNi40M2MwLS4zOS0uMy0uNjMtLjctLjYzLS4yNSAwLS41LjE1LS42LjM0bC0zLjEgNS4wOWMtLjE1LjI0LS4xLjYuMi44LjIuMTUuNC4yLjUuMmgydi44YzAgLjQwMi4zMDIuNy43LjcuNDEgMCAuNy0uMyA3LS42OTV6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=');
        -webkit-mask-size: cover;
        mask-size: cover;
      `;
      this.elements.button.appendChild(icon);
    }
    
    this.elements.button.appendChild(buttonContent);
    this.elements.container.appendChild(this.elements.button);
    
    // Add hover effect
    this.elements.button.addEventListener('mouseenter', () => {
      this.elements.button.style.backgroundColor = this.config.hoverColor;
    });
    
    this.elements.button.addEventListener('mouseleave', () => {
      this.elements.button.style.backgroundColor = this.config.backgroundColor;
    });
  }

  /**
   * Create a notification-style UI
   */
  createNotification() {
    this.elements.notification = document.createElement('div');
    this.elements.notification.className = 'academic-access-notification';
    this.elements.notification.style.cssText = `
      display: ${this.state.isVisible ? 'flex' : 'none'};
      flex-direction: column;
      gap: 12px;
      background-color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      border-left: 4px solid ${this.config.backgroundColor};
      max-width: 320px;
      animation: academic-access-slide-in 0.3s ease;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes academic-access-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .academic-access-notification-hide {
        opacity: 0;
        transform: translateY(20px);
      }
    `;
    document.head.appendChild(style);
    
    // Create notification content
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    // Add title with icon
    const title = document.createElement('div');
    title.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #333;
    `;
    
    if (this.config.showIcon) {
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: ${this.config.backgroundColor};
        border-radius: 50%;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSI1MCIgZmlsbD0iIzJjNmJlZCIvPjxwYXRoIGQ9Ik0zMCA3MEg3ME02NSAzMEw1MCA3ME0zNSAzMEw1MCA3MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      `;
      title.appendChild(icon);
    }
    
    const titleText = document.createElement('span');
    titleText.textContent = 'Academic Access';
    title.appendChild(titleText);
    
    // Add message
    const message = document.createElement('div');
    message.style.cssText = `
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    `;
    message.textContent = 'You may have access to this content through your institution.';
    
    // Add institution name if available
    if (this.state.institution && this.state.institution.name) {
      const institutionInfo = document.createElement('div');
      institutionInfo.style.cssText = `
        font-size: 13px;
        color: #666;
      `;
      institutionInfo.textContent = `Using: ${this.state.institution.name}`;
      content.appendChild(title);
      content.appendChild(message);
      content.appendChild(institutionInfo);
    } else {
      content.appendChild(title);
      content.appendChild(message);
    }
    
    this.elements.notification.appendChild(content);
    
    // Add action buttons
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    `;
    
    // Access button
    const accessButton = document.createElement('button');
    accessButton.className = 'academic-access-action-button';
    accessButton.textContent = 'Access via Institution';
    accessButton.style.cssText = `
      background-color: ${this.config.backgroundColor};
      color: ${this.config.textColor};
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;
    
    // Dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.className = 'academic-access-dismiss';
    dismissButton.textContent = '✕';
    dismissButton.style.cssText = `
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effects
    accessButton.addEventListener('mouseenter', () => {
      accessButton.style.backgroundColor = this.config.hoverColor;
    });
    
    accessButton.addEventListener('mouseleave', () => {
      accessButton.style.backgroundColor = this.config.backgroundColor;
    });
    
    dismissButton.addEventListener('mouseenter', () => {
      dismissButton.style.backgroundColor = '#f1f1f1';
    });
    
    dismissButton.addEventListener('mouseleave', () => {
      dismissButton.style.backgroundColor = 'transparent';
    });
    
    actions.appendChild(accessButton);
    actions.appendChild(dismissButton);
    this.elements.notification.appendChild(actions);
    
    this.elements.container.appendChild(this.elements.notification);
    
    // Store references for event handling
    this.elements.accessButton = accessButton;
    this.elements.dismissButton = dismissButton;
  }

  /**
   * Set up event listeners for button interactions
   */
  setupEventListeners() {
    // Handle click on the floating button
    if (this.elements.button) {
      this.elements.button.addEventListener('click', () => {
        this.handleAccess();
      });
    }
    
    // Handle click on the notification access button
    if (this.elements.accessButton) {
      this.elements.accessButton.addEventListener('click', () => {
        this.handleAccess();
      });
    }
    
    // Handle click on the dismiss button
    if (this.elements.dismissButton) {
      this.elements.dismissButton.addEventListener('click', () => {
        this.hide();
      });
    }
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updateInstitution') {
        this.state.institution = message.institution;
        sendResponse({ success: true });
      } else if (message.action === 'showAccessButton') {
        this.show(message.url, message.metadata);
        sendResponse({ success: true });
      } else if (message.action === 'hideAccessButton') {
        this.hide();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Show the access button
   * @param {string} url URL of the current page
   * @param {Object} metadata Metadata about the current page
   */
  show(url, metadata = {}) {
    // Update state
    this.state.isVisible = true;
    this.state.currentUrl = url || window.location.href;
    this.state.pageMetadata = metadata;
    
    // Show the appropriate UI element
    if (this.config.displayType === 'button' && this.elements.button) {
      this.elements.button.style.display = 'flex';
    } else if (this.elements.notification) {
      this.elements.notification.style.display = 'flex';
    }
    
    // Set up auto-hide if enabled
    if (this.config.autoHide) {
      // Clear any existing timeout
      if (this.timeouts.autoHide) {
        clearTimeout(this.timeouts.autoHide);
      }
      
      // Set new timeout
      this.timeouts.autoHide = setTimeout(() => {
        this.hide();
      }, this.config.autoHideDelay);
    }
  }

  /**
   * Hide the access button
   */
  hide() {
    // Update state
    this.state.isVisible = false;
    
    // Hide the appropriate UI element
    if (this.config.displayType === 'button' && this.elements.button) {
      this.elements.button.style.display = 'none';
    } else if (this.elements.notification) {
      // Add hide animation class
      this.elements.notification.classList.add('academic-access-notification-hide');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (this.elements.notification) {
          this.elements.notification.style.display = 'none';
          this.elements.notification.classList.remove('academic-access-notification-hide');
        }
      }, 300); // Animation duration
    }
    
    // Clear any auto-hide timeout
    if (this.timeouts.autoHide) {
      clearTimeout(this.timeouts.autoHide);
      this.timeouts.autoHide = null;
    }
  }

  /**
   * Handle click on the access button
   */
  async handleAccess() {
    if (!this.state.institution) {
      // No institution configured, show message or redirect to options
      chrome.runtime.sendMessage({
        action: 'openOptions'
      });
      return;
    }
    
    try {
      // Use the proxy-redirect module to handle the redirection
      const url = this.state.currentUrl || window.location.href;
      
      // Get current tab ID
      let tabId = null;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab.id;
      }
      
      // Record access attempt
      chrome.runtime.sendMessage({
        action: 'recordAccess',
        data: {
          url,
          institution: this.state.institution.name,
          timestamp: Date.now(),
          metadata: this.state.pageMetadata
        }
      });
      
      // Redirect using the accessViaLibrary function
      const result = await accessViaLibrary(url, this.state.institution, {
        tabId,
        openInNewTab: false
      });
      
      if (!result.success) {
        console.error('Failed to redirect:', result.error);
        // Show error message
        this.showError(result.error);
      }
    } catch (error) {
      console.error('Error accessing via library:', error);
      this.showError('Failed to redirect to institutional access');
    }
  }

  /**
   * Show an error message
   * @param {string} message Error message to display
   */
  showError(message) {
    // Implementation depends on UI framework or notification system
    console.error('Access error:', message);
    
    // For now, just alert the user
    alert(`Error: ${message}`);
  }

  /**
   * Clean up resources when the instance is no longer needed
   */
  destroy() {
    // Clear any timeouts
    if (this.timeouts.autoHide) {
      clearTimeout(this.timeouts.autoHide);
    }
    
    // Remove DOM elements
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
    
    // Reset state
    this.state.isVisible = false;
  }
}

/**
 * Create and initialize an AccessButton
 * @param {Object} options Configuration options
 * @returns {Promise<AccessButton>} Initialized AccessButton instance
 */
async function createAccessButton(options = {}) {
  const button = new AccessButton(options);
  await button.initialize();
  return button;
}

// Export the AccessButton class and factory function
export {
  AccessButton,
  createAccessButton
};