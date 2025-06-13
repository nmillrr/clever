/**
 * Academic Access Extension - Background Script
 * 
 * This background script handles global extension state and coordinates
 * between the popup UI and content scripts.
 */

// Storage keys
const STORAGE_KEYS = {
  INSTITUTION: 'institution',
  HISTORY: 'access_history',
  SETTINGS: 'settings'
};

// Default settings
const DEFAULT_SETTINGS = {
  enableAutoRedirect: true,
  showNotifications: true,
  notificationDuration: 5000,
  checkOpenAccess: true,
  trackHistory: true,
  historyLimit: 100
};

/**
 * Initialize the extension
 */
function initExtension() {
  console.log('Academic Access Extension: Initializing background script');
  
  // Load or create settings
  loadSettings();
  
  // Set up context menu
  createContextMenu();
  
  // Set up message listeners
  setupMessageListeners();
  
  // Set up navigation listeners
  setupNavigationListeners();
}

/**
 * Load settings from storage or create defaults
 */
function loadSettings() {
  chrome.storage.local.get([STORAGE_KEYS.SETTINGS], function(result) {
    const savedSettings = result[STORAGE_KEYS.SETTINGS];
    
    // If no settings exist, create defaults
    if (!savedSettings) {
      chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
      });
    }
  });
}

/**
 * Create extension context menu items
 */
function createContextMenu() {
  chrome.contextMenus.create({
    id: 'accessViaProxy',
    title: 'Access via Institution',
    contexts: ['page', 'link']
  });
  
  chrome.contextMenus.create({
    id: 'checkOpenAccess',
    title: 'Find Open Access Version',
    contexts: ['page', 'link']
  });
  
  chrome.contextMenus.create({
    id: 'openOptions',
    title: 'Extension Settings',
    contexts: ['action']
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(handleContextMenu);
}

/**
 * Handle context menu clicks
 * @param {Object} info Context menu info
 * @param {Object} tab Tab where the click occurred
 */
function handleContextMenu(info, tab) {
  switch (info.menuItemId) {
    case 'accessViaProxy':
      // Get the URL to proxy (either link or page URL)
      const url = info.linkUrl || info.pageUrl;
      redirectToProxy(url, tab.id);
      break;
      
    case 'checkOpenAccess':
      // Find open access version
      findOpenAccess(info.linkUrl || info.pageUrl, tab.id);
      break;
      
    case 'openOptions':
      // Open extension options
      chrome.runtime.openOptionsPage();
      break;
  }
}

/**
 * Redirect a URL through the user's institutional proxy
 * @param {string} url URL to redirect
 * @param {number} tabId Tab ID
 */
function redirectToProxy(url, tabId) {
  chrome.storage.local.get([STORAGE_KEYS.INSTITUTION], function(result) {
    const institution = result[STORAGE_KEYS.INSTITUTION];
    
    if (!institution) {
      // No institution configured
      notifyUser('No institution configured. Please set up your institution first.', tabId);
      return;
    }
    
    // Generate proxied URL based on institution type
    let proxiedUrl;
    
    if (institution.type === 'prefix') {
      // Handle prefix-type proxy (e.g., https://proxy.example.edu/login?url=)
      proxiedUrl = `${institution.proxy}${url}`;
    } else if (institution.type === 'suffix') {
      // Handle suffix-type proxy (e.g., .proxy.example.edu)
      try {
        const urlObj = new URL(url);
        const suffix = institution.proxy.startsWith('.') 
          ? institution.proxy 
          : `.${institution.proxy}`;
        
        proxiedUrl = url.replace(urlObj.hostname, urlObj.hostname + suffix);
      } catch (e) {
        console.error('Error generating proxied URL:', e);
        notifyUser('Error generating proxied URL', tabId);
        return;
      }
    } else {
      notifyUser('Unknown proxy type', tabId);
      return;
    }
    
    // Record in history
    recordAccess({
      originalUrl: url,
      proxiedUrl: proxiedUrl,
      timestamp: Date.now(),
      institution: institution.name,
      type: 'manual'
    });
    
    // Redirect the tab
    chrome.tabs.update(tabId, { url: proxiedUrl });
  });
}

/**
 * Find open access version of an article
 * @param {string} url Article URL
 * @param {number} tabId Tab ID
 */
function findOpenAccess(url, tabId) {
  // In a real implementation, this would use the Unpaywall API
  // For this example, we'll just show a notification
  notifyUser('Finding open access version is not implemented yet', tabId);
}

/**
 * Send a notification to a specific tab
 * @param {string} message Message to display
 * @param {number} tabId Tab ID
 * @param {string} type Notification type (info, success, warning)
 */
function notifyUser(message, tabId, type = 'info') {
  chrome.tabs.sendMessage(tabId, {
    action: 'showNotification',
    message,
    type
  });
}

/**
 * Record an access attempt in history
 * @param {Object} accessData Access data to record
 */
function recordAccess(accessData) {
  chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.HISTORY], function(result) {
    const settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
    
    // Only record if tracking is enabled
    if (!settings.trackHistory) {
      return;
    }
    
    let history = result[STORAGE_KEYS.HISTORY] || [];
    
    // Add new entry
    history.unshift(accessData);
    
    // Limit history size
    if (history.length > settings.historyLimit) {
      history = history.slice(0, settings.historyLimit);
    }
    
    // Save updated history
    chrome.storage.local.set({
      [STORAGE_KEYS.HISTORY]: history
    });
  });
}

/**
 * Set up message listeners for communication with popup and content scripts
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'getInstitution') {
      // Return the user's institution
      chrome.storage.local.get([STORAGE_KEYS.INSTITUTION], function(result) {
        sendResponse(result[STORAGE_KEYS.INSTITUTION] || null);
      });
      return true; // Indicates async response
    }
    
    if (message.action === 'getSettings') {
      // Return extension settings
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], function(result) {
        sendResponse(result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS);
      });
      return true;
    }
    
    if (message.action === 'getHistory') {
      // Return access history
      chrome.storage.local.get([STORAGE_KEYS.HISTORY], function(result) {
        sendResponse(result[STORAGE_KEYS.HISTORY] || []);
      });
      return true;
    }
    
    if (message.action === 'clearHistory') {
      // Clear access history
      chrome.storage.local.remove([STORAGE_KEYS.HISTORY], function() {
        sendResponse({ success: true });
      });
      return true;
    }
    
    if (message.action === 'saveSettings') {
      // Save new settings
      chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: message.settings
      }, function() {
        sendResponse({ success: true });
      });
      return true;
    }
    
    if (message.action === 'redirectToProxy') {
      // Redirect a URL through proxy
      redirectToProxy(message.url, sender.tab.id);
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'paywallDetected') {
      // A content script has detected a paywall
      handlePaywallDetection(message.url, sender.tab.id, message.articleInfo);
      sendResponse({ success: true });
      return true;
    }
  });
}

/**
 * Handle detection of a paywall
 * @param {string} url URL of the paywalled article
 * @param {number} tabId Tab ID where the paywall was detected
 * @param {Object} articleInfo Information about the article
 */
function handlePaywallDetection(url, tabId, articleInfo) {
  chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.INSTITUTION], function(result) {
    const settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
    const institution = result[STORAGE_KEYS.INSTITUTION];
    
    // Record the paywall detection
    recordAccess({
      originalUrl: url,
      timestamp: Date.now(),
      institution: institution ? institution.name : null,
      type: 'paywall_detected',
      articleInfo
    });
    
    // If auto-redirect is enabled and we have an institution, redirect
    if (settings.enableAutoRedirect && institution) {
      // In a real implementation, we might first check if the institution 
      // has access to this specific resource
      redirectToProxy(url, tabId);
    } else if (settings.showNotifications) {
      // Otherwise just show a notification if enabled
      chrome.tabs.sendMessage(tabId, {
        action: 'showProxyButton'
      });
    }
  });
}

/**
 * Set up listeners for tab navigation events
 */
function setupNavigationListeners() {
  // Listen for completed navigation events
  chrome.webNavigation.onCompleted.addListener(function(details) {
    // Only handle main frame navigation
    if (details.frameId !== 0) return;
    
    // Check if the URL matches known publisher patterns
    const isPublisherUrl = isKnownPublisherUrl(details.url);
    
    if (isPublisherUrl) {
      // Send message to content script to check for paywall
      chrome.tabs.sendMessage(details.tabId, {
        action: 'checkPaywall'
      });
    }
  });
}

/**
 * Check if a URL is from a known academic publisher
 * @param {string} url URL to check
 * @returns {boolean} Whether the URL is from a known publisher
 */
function isKnownPublisherUrl(url) {
  // List of known publisher domains
  const publisherDomains = [
    'jstor.org',
    'sciencedirect.com',
    'springer.com',
    'wiley.com',
    'tandfonline.com',
    'academic.oup.com',
    'sagepub.com',
    'ieeexplore.ieee.org',
    'dl.acm.org',
    'nature.com',
    'economist.com',
    'wsj.com',
    'nytimes.com',
    'ft.com',
    'hbr.org',
    'washingtonpost.com'
  ];
  
  try {
    const hostname = new URL(url).hostname;
    return publisherDomains.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Initialize extension when loaded
initExtension();