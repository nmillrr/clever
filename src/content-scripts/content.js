/**
 * Academic Access Extension - Content Script
 * 
 * This script runs on supported publisher websites to detect paywalls
 * and offer institutional access alternatives.
 */

(function() {
  // Extension state
  const state = {
    initialized: false,
    isPaywalled: false,
    institution: null,
    articleInfo: null
  };

  // Configuration
  const config = {
    notificationDuration: 5000,
    retryDelay: 1000,
    maxRetries: 3
  };

  // DOM elements that will be created
  let elements = {
    container: null,
    notification: null,
    accessButton: null
  };

  /**
   * Initialize the content script
   */
  function init() {
    if (state.initialized) return;
    
    console.log('Academic Access Extension: Initializing content script');
    
    // Load user's institution from storage
    chrome.storage.local.get(['institution'], function(result) {
      state.institution = result.institution;
      
      // Only proceed if we have an institution configured
      if (state.institution) {
        // Check if we're on a paywall page
        detectPaywall();
      } else {
        console.log('Academic Access Extension: No institution configured');
      }
    });
    
    state.initialized = true;
  }

  /**
   * Detect if the current page has a paywall
   */
  function detectPaywall() {
    // Use the URL and page content to detect if this is a paywalled article
    const url = window.location.href;
    const html = document.documentElement.outerHTML;
    
    // Simple detection logic - this would be replaced by the more robust 
    // paywall detection module in a real implementation
    const isArticlePage = detectIfArticlePage(url);
    
    if (!isArticlePage) {
      // Not an article page, no need to continue
      return;
    }
    
    // Look for paywall indicators in the page
    const paywalledByContent = detectPaywallContent(html);
    const paywalledByElements = detectPaywallElements();
    
    state.isPaywalled = paywalledByContent || paywalledByElements;
    
    if (state.isPaywalled) {
      console.log('Academic Access Extension: Paywall detected');
      
      // Extract article information
      extractArticleInfo();
      
      // Show UI elements
      showPaywallNotification();
    } else {
      console.log('Academic Access Extension: No paywall detected');
    }
  }

  /**
   * Simple check if the current URL is likely an article page
   * @param {string} url URL to check
   * @returns {boolean} Whether this is likely an article page
   */
  function detectIfArticlePage(url) {
    // Simple checks for common article URL patterns
    const articlePatterns = [
      /\/article\//i,
      /\/articles\//i,
      /\/abstract\//i,
      /\/full\//i,
      /\/doi\//i,
      /\/document\//i,
      /\/stable\//i,
      /\/content\//i,
      /\.pdf$/i
    ];
    
    return articlePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Detect paywall content in HTML
   * @param {string} html Page HTML
   * @returns {boolean} Whether paywall content was detected
   */
  function detectPaywallContent(html) {
    // Common paywall phrases
    const paywallPhrases = [
      'subscribe to continue',
      'subscription required',
      'subscribers only',
      'to continue reading',
      'purchase this article',
      'access options',
      'sign in to access',
      'get access',
      'institutional access',
      'access through your institution'
    ];
    
    return paywallPhrases.some(phrase => 
      html.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  /**
   * Detect paywall elements in the DOM
   * @returns {boolean} Whether paywall elements were detected
   */
  function detectPaywallElements() {
    // Common paywall selectors
    const paywallSelectors = [
      '.paywall',
      '.subscription',
      '.access-options',
      '.purchase-options',
      '.signin-container',
      '.access-container',
      '[id*="paywall"]',
      '[class*="paywall"]',
      '[id*="subscribe"]',
      '[class*="subscribe"]',
      '[id*="access"]',
      '[class*="access"]',
      '[id*="purchase"]',
      '[class*="purchase"]'
    ];
    
    return paywallSelectors.some(selector => {
      try {
        return document.querySelector(selector) !== null;
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Extract article information from the page
   */
  function extractArticleInfo() {
    // This would call into our identifier-extractor module in a real implementation
    // For now, we'll just do basic extraction
    
    // Extract DOI
    let doi = null;
    const doiMeta = document.querySelector('meta[name="citation_doi"], meta[name="dc.identifier"]');
    if (doiMeta) {
      doi = doiMeta.getAttribute('content');
      if (doi.startsWith('doi:')) {
        doi = doi.substring(4);
      }
    }
    
    // Extract title
    let title = null;
    const titleMeta = document.querySelector('meta[name="citation_title"], meta[property="og:title"]');
    if (titleMeta) {
      title = titleMeta.getAttribute('content');
    } else {
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
    }
    
    // Extract URL
    const url = window.location.href;
    
    state.articleInfo = {
      doi,
      title,
      url
    };
    
    console.log('Academic Access Extension: Article info', state.articleInfo);
  }

  /**
   * Generate a proxied URL for the current article
   * @returns {string|null} Proxied URL or null if not possible
   */
  function generateProxiedUrl() {
    if (!state.institution || !state.articleInfo) {
      return null;
    }
    
    const articleUrl = state.articleInfo.url;
    const institution = state.institution;
    
    // Handle different proxy types
    if (institution.type === 'prefix') {
      // Handle prefix-type proxy (e.g., https://proxy.example.edu/login?url=)
      return `${institution.proxy}${articleUrl}`;
    } else if (institution.type === 'suffix') {
      // Handle suffix-type proxy (e.g., .proxy.example.edu)
      try {
        const urlObj = new URL(articleUrl);
        const suffix = institution.proxy.startsWith('.') 
          ? institution.proxy 
          : `.${institution.proxy}`;
        
        return articleUrl.replace(urlObj.hostname, urlObj.hostname + suffix);
      } catch (e) {
        console.error('Error generating proxied URL:', e);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Create and show the paywall notification
   */
  function showPaywallNotification() {
    // Create container if it doesn't exist
    if (!elements.container) {
      elements.container = document.createElement('div');
      elements.container.className = 'academic-access-container';
      document.body.appendChild(elements.container);
    }
    
    // Create notification
    elements.notification = document.createElement('div');
    elements.notification.className = 'academic-access-notification';
    
    // Generate proxied URL
    const proxiedUrl = generateProxiedUrl();
    
    if (proxiedUrl) {
      // Create notification content
      elements.notification.innerHTML = `
        <div class="academic-access-logo"></div>
        <div class="academic-access-message">
          <strong>Academic Access:</strong> 
          You may have access to this article through ${state.institution.name}.
        </div>
        <div class="academic-access-actions">
          <a href="${proxiedUrl}" class="academic-access-button" target="_blank">
            Access via Institution
          </a>
          <button class="academic-access-dismiss">✕</button>
        </div>
      `;
      
      // Add to container
      elements.container.appendChild(elements.notification);
      
      // Add event listeners
      const dismissButton = elements.notification.querySelector('.academic-access-dismiss');
      if (dismissButton) {
        dismissButton.addEventListener('click', function() {
          elements.notification.remove();
        });
      }
      
      // Auto-hide after duration
      setTimeout(() => {
        if (elements.notification && elements.notification.parentNode) {
          elements.notification.classList.add('academic-access-notification-hide');
          setTimeout(() => {
            if (elements.notification && elements.notification.parentNode) {
              elements.notification.remove();
            }
          }, 500); // Animation duration
        }
      }, config.notificationDuration);
    }
  }

  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkPaywall') {
      detectPaywall();
      sendResponse({ isPaywalled: state.isPaywalled });
    } else if (message.action === 'showProxyButton') {
      showPaywallNotification();
      sendResponse({ shown: true });
    }
    return true;
  });
})();