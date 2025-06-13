/**
 * Academic Access Extension - Access Button
 * 
 * Creates and manages the floating "Access via your library" button
 * that appears on paywalled pages.
 * Uses Radix UI for consistent theming.
 */

import { accessViaLibrary } from '../modules/proxy-redirect.js';
import '@radix-ui/themes/styles.css';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  buttonPosition: 'bottom-right',  // 'bottom-right', 'top-right', 'bottom-left', 'top-left'
  autoHide: true,                  // Whether to automatically hide the button after a delay
  autoHideDelay: 5000,             // Time in ms before auto-hiding
  displayType: 'button',           // 'button' or 'notification'
  showIcon: true,                  // Whether to show the icon
  colorScheme: 'light',            // 'light' or 'dark'
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
      this.elements.container.className = 'academic-access-container radix-themes';
      this.elements.container.setAttribute('data-theme', this.config.colorScheme);
      this.elements.container.style.cssText = `
        position: fixed;
        ${this.config.buttonPosition.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${this.config.buttonPosition.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: ${this.config.zIndex};
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
    this.elements.button.className = 'academic-access-button rt-Button';
    this.elements.button.setAttribute('aria-label', 'Access via your library');
    
    this.elements.button.style.cssText = `
      display: ${this.state.isVisible ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      box-shadow: var(--shadow-3);
    `;
    
    // Create button content
    const buttonContent = document.createElement('span');
    buttonContent.textContent = 'Access via your library';
    
    // Add icon if enabled
    if (this.config.showIcon) {
      const icon = document.createElement('span');
      icon.classList.add('rt-Icon');
      icon.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: currentColor;
        mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTMuNS03Yy45NCAwIDEuNy0uNzYgMS43LTEuN3MtLjc2LTEuNy0xLjctMS43LTEuNy43Ni0xLjcgMS43LjQyIDEuNyAxLjcgMS43em0tNy01LjNjLS45NCAwLTEuNy43Ni0xLjcgMS43cy43NiAxLjcgMS43IDEuNyAxLjctLjc2IDEuNy0xLjdjMC0xLjExLS43Ni0xLjctMS43LTEuN3ptMS43IDguOFY5LjdoLjdWNi40M2MwLS4zOS0uMy0uNjMtLjctLjYzLS4yNSAwLS41LjE1LS42LjM0bC0zLjEgNS4wOWMtLjE1LjI0LS4xLjYuMi44LjIuMTUuNC4yLjUuMmgydi44YzAgLjQwMi4zMDIuNy43LjcuNDEgMCAuNy0uMyA3LS42OTV6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=');
        -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTMuNS03Yy45NCAwIDEuNy0uNzYgMS43LTEuN3MtLjc2LTEuNy0xLjctMS43LTEuNy43Ni0xLjcgMS43LjQyIDEuNyAxLjcgMS43em0tNy01LjNjLS45NCAwLTEuNy43Ni0xLjcgMS43cy43NiAxLjcgMS43IDEuNyAxLjctLjc2IDEuNy0xLjdjMC0xLjExLS43Ni0xLjctMS43LTEuN3ptMS43IDguOFY5LjdoLjdWNi40M2MwLS4zOS0uMy0uNjMtLjctLjYzLS4yNSAwLS41LjE1LS42LjM0bC0zLjEgNS4wOWMtLjE1LjI0LS4xLjYuMi44LjIuMTUuNC4yLjUuMmgydi44YzAgLjQwMi4zMDIuNy43LjcuNDEgMCAuNy0uMyA3LS42OTV6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=');
        -webkit-mask-size: cover;
        mask-size: cover;
      `;
      this.elements.button.appendChild(icon);
    }
    
    this.elements.button.appendChild(buttonContent);
    this.elements.container.appendChild(this.elements.button);
  }

  /**
   * Create a notification-style UI
   */
  createNotification() {
    this.elements.notification = document.createElement('div');
    this.elements.notification.className = 'academic-access-notification rt-Card';
    this.elements.notification.style.cssText = `
      display: ${this.state.isVisible ? 'flex' : 'none'};
      flex-direction: column;
      gap: var(--space-3);
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
    
    // Create notification content using Radix UI classes
    const content = document.createElement('div');
    content.className = 'rt-Flex direction="column" gap="2"';
    
    // Add title with icon
    const title = document.createElement('div');
    title.className = 'rt-Flex align="center" gap="2"';
    
    if (this.config.showIcon) {
      const icon = document.createElement('div');
      icon.className = 'academic-access-logo';
      title.appendChild(icon);
    }
    
    const titleText = document.createElement('span');
    titleText.className = 'rt-Text weight="bold" size="3"';
    titleText.textContent = 'Academic Access';
    title.appendChild(titleText);
    
    // Add message
    const message = document.createElement('div');
    message.className = 'rt-Text size="2"';
    message.textContent = 'You may have access to this content through your institution.';
    
    // Add institution name if available
    if (this.state.institution && this.state.institution.name) {
      const institutionInfo = document.createElement('div');
      institutionInfo.className = 'rt-Text size="1" color="gray"';
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
    actions.className = 'rt-Flex justify="between" align="center" mt="2"';
    
    // Access button
    const accessButton = document.createElement('button');
    accessButton.className = 'rt-Button';
    accessButton.textContent = 'Access via Institution';
    
    // Dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.className = 'rt-IconButton variant="ghost"';
    dismissButton.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>';
    
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