/**
 * Academic Access Extension - Content Script
 * 
 * This script runs on supported publisher websites to detect paywalls
 * and offer institutional access alternatives.
 * Uses Radix UI for consistent theming.
 */

import '@radix-ui/themes/styles.css';

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
      elements.container.className = 'academic-access-container radix-themes';
      elements.container.setAttribute('data-theme', 'light');
      document.body.appendChild(elements.container);
    }
    
    // Create notification
    elements.notification = document.createElement('div');
    elements.notification.className = 'academic-access-notification rt-Card';
    
    // Generate proxied URL
    const proxiedUrl = generateProxiedUrl();
    
    if (proxiedUrl) {
      // Create notification content
      elements.notification.innerHTML = `
        <div class="rt-Flex direction="column" gap="2">
          <div class="rt-Flex align="center" gap="2">
            <div class="academic-access-logo"></div>
            <span class="rt-Text weight="bold" size="3">Academic Access</span>
          </div>
          <div class="rt-Text size="2">
            You may have access to this article through ${state.institution.name}.
          </div>
          <div class="rt-Flex justify="between" align="center" mt="2">
            <a href="${proxiedUrl}" class="rt-Button" target="_blank">
              Access via Institution
            </a>
            <button class="rt-IconButton variant="ghost" academic-access-dismiss">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </button>
          </div>
        </div>
      `;
      
      // Add to container
      elements.container.appendChild(elements.notification);
      
      // Add event listeners
      const dismissButton = elements.notification.querySelector('[academic-access-dismiss]');
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