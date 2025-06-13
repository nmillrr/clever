/**
 * Proxy Redirect Module
 * 
 * Provides functions for redirecting users to proxied versions of articles
 * through their institutional proxy servers.
 */

/**
 * Known proxy pattern types
 */
const PROXY_TYPES = {
  PREFIX: 'prefix',   // e.g., https://proxy.university.edu/login?url=
  SUFFIX: 'suffix',   // e.g., .proxy.university.edu
  HOSTNAME: 'hostname', // e.g., proxy.university.edu/url=
  COMPLEX: 'complex'  // e.g., https://login.university.edu?qurl={url}
};

/**
 * Default logging settings
 */
const DEFAULT_LOGGING = {
  enabled: false,
  level: 'error' // 'debug', 'info', 'warn', 'error'
};

/**
 * Create a ProxyRedirector instance
 * @param {Object} options Configuration options
 * @returns {Object} ProxyRedirector methods
 */
function createProxyRedirector(options = {}) {
  const config = {
    logging: { ...DEFAULT_LOGGING, ...(options.logging || {}) },
    trackRedirects: options.trackRedirects !== undefined ? options.trackRedirects : true,
    allowAutoRedirect: options.allowAutoRedirect !== undefined ? options.allowAutoRedirect : true
  };
  
  /**
   * Logger function that respects config settings
   * @param {string} level Log level
   * @param {...any} args Arguments to log
   */
  function log(level, ...args) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(config.logging.level);
    const messageLevelIndex = levels.indexOf(level);
    
    if (config.logging.enabled && messageLevelIndex >= configLevelIndex) {
      console[level]('[ProxyRedirector]', ...args);
    }
  }
  
  /**
   * Detect the type of proxy from a proxy string
   * @param {string} proxyString Proxy URL or pattern
   * @returns {Object} Proxy type and normalized value
   */
  function detectProxyType(proxyString) {
    if (!proxyString) {
      return { type: null, value: null };
    }
    
    // Clean up the proxy string
    const proxy = proxyString.trim();
    
    // Check for prefix-type proxies (most common)
    if (proxy.startsWith('http') && (proxy.includes('?url=') || proxy.endsWith('/'))) {
      return { type: PROXY_TYPES.PREFIX, value: proxy.endsWith('/') ? proxy : proxy + '/' };
    }
    
    // Check for suffix-type proxies
    if (proxy.startsWith('.') || (!proxy.startsWith('http') && !proxy.includes('/'))) {
      // Ensure it starts with a dot
      const value = proxy.startsWith('.') ? proxy : `.${proxy}`;
      return { type: PROXY_TYPES.SUFFIX, value };
    }
    
    // Check for hostname-type proxies
    if (proxy.includes('.') && !proxy.startsWith('http') && proxy.includes('/')) {
      return { type: PROXY_TYPES.HOSTNAME, value: proxy };
    }
    
    // Default to complex type that requires custom handling
    if (proxy.includes('{') && proxy.includes('}')) {
      return { type: PROXY_TYPES.COMPLEX, value: proxy };
    }
    
    // If we can't determine the type, assume it's a prefix
    log('warn', `Could not determine proxy type for "${proxy}", assuming prefix`);
    return { type: PROXY_TYPES.PREFIX, value: proxy };
  }
  
  /**
   * Check if a URL is already proxied
   * @param {string} url URL to check
   * @param {Object} proxyInfo Proxy information
   * @returns {boolean} Whether the URL is already proxied
   */
  function isAlreadyProxied(url, proxyInfo) {
    if (!url || !proxyInfo || !proxyInfo.type) {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      
      switch (proxyInfo.type) {
        case PROXY_TYPES.PREFIX:
          // Check if URL starts with the proxy prefix
          return url.startsWith(proxyInfo.value);
          
        case PROXY_TYPES.SUFFIX:
          // Check if hostname contains the proxy suffix
          return urlObj.hostname.includes(proxyInfo.value);
          
        case PROXY_TYPES.HOSTNAME:
          // Check if hostname matches the proxy hostname
          const proxyParts = proxyInfo.value.split('/');
          const proxyHostname = proxyParts[0];
          return urlObj.hostname === proxyHostname;
          
        case PROXY_TYPES.COMPLEX:
          // We can't easily check complex patterns
          // A more robust implementation would need to parse the pattern
          return false;
          
        default:
          return false;
      }
    } catch (e) {
      log('error', 'Error checking if URL is already proxied:', e);
      return false;
    }
  }
  
  /**
   * Extract the original URL from a proxied URL
   * @param {string} proxiedUrl Proxied URL
   * @param {Object} proxyInfo Proxy information
   * @returns {string|null} Original URL if extraction successful, null otherwise
   */
  function extractOriginalUrl(proxiedUrl, proxyInfo) {
    if (!proxiedUrl || !proxyInfo || !proxyInfo.type) {
      return null;
    }
    
    try {
      const urlObj = new URL(proxiedUrl);
      
      switch (proxyInfo.type) {
        case PROXY_TYPES.PREFIX:
          // Remove the proxy prefix
          if (proxiedUrl.startsWith(proxyInfo.value)) {
            return proxiedUrl.substring(proxyInfo.value.length);
          }
          // Check for query parameter style
          if (urlObj.searchParams.has('url')) {
            return urlObj.searchParams.get('url');
          }
          // Check for path style (e.g., /proxy/https://example.com)
          const pathMatch = urlObj.pathname.match(/^\/[^/]+\/(?:https?:\/\/)?(.*)/);
          if (pathMatch) {
            return `https://${pathMatch[1]}`;
          }
          break;
          
        case PROXY_TYPES.SUFFIX:
          // Remove the proxy suffix from hostname
          if (urlObj.hostname.includes(proxyInfo.value)) {
            const originalHostname = urlObj.hostname.replace(proxyInfo.value, '');
            return proxiedUrl.replace(urlObj.hostname, originalHostname);
          }
          break;
          
        case PROXY_TYPES.HOSTNAME:
          // Extract from search parameters
          for (const [key, value] of urlObj.searchParams.entries()) {
            if (value.startsWith('http') || key === 'url' || key === 'qurl') {
              return value;
            }
          }
          break;
          
        case PROXY_TYPES.COMPLEX:
          // We would need specific pattern handling for complex types
          break;
      }
      
      return null;
    } catch (e) {
      log('error', 'Error extracting original URL:', e);
      return null;
    }
  }
  
  /**
   * Generate a proxied URL
   * @param {string} url URL to proxy
   * @param {Object} proxyInfo Proxy information
   * @returns {string|null} Proxied URL or null if generation failed
   */
  function generateProxiedUrl(url, proxyInfo) {
    if (!url || !proxyInfo || !proxyInfo.type) {
      log('error', 'Missing URL or proxy information');
      return null;
    }
    
    // If URL is already proxied, return it as is
    if (isAlreadyProxied(url, proxyInfo)) {
      log('info', 'URL is already proxied, returning as is');
      return url;
    }
    
    try {
      // Ensure URL is properly formatted
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(normalizedUrl);
      
      switch (proxyInfo.type) {
        case PROXY_TYPES.PREFIX:
          // Simple concatenation, ensuring no double slashes
          if (proxyInfo.value.endsWith('/') && normalizedUrl.startsWith('http')) {
            return `${proxyInfo.value}${normalizedUrl}`;
          } else if (proxyInfo.value.includes('?url=')) {
            // Handle query parameter style
            const baseUrl = proxyInfo.value.split('?')[0];
            const params = new URLSearchParams(proxyInfo.value.split('?')[1] || '');
            params.set('url', normalizedUrl);
            return `${baseUrl}?${params.toString()}`;
          } else {
            return `${proxyInfo.value}${normalizedUrl}`;
          }
          
        case PROXY_TYPES.SUFFIX:
          // Insert the suffix after the hostname
          return normalizedUrl.replace(urlObj.hostname, urlObj.hostname + proxyInfo.value);
          
        case PROXY_TYPES.HOSTNAME:
          // Construct URL with the proxy hostname
          const proxyParts = proxyInfo.value.split('/');
          const proxyHostname = proxyParts[0];
          const proxyPath = proxyParts.slice(1).join('/');
          
          // Create the new URL
          const proxiedUrl = new URL(`https://${proxyHostname}`);
          proxiedUrl.pathname = proxyPath || '';
          proxiedUrl.searchParams.set('url', normalizedUrl);
          return proxiedUrl.toString();
          
        case PROXY_TYPES.COMPLEX:
          // Handle complex patterns with placeholders
          return proxyInfo.value
            .replace('{url}', encodeURIComponent(normalizedUrl))
            .replace('{hostname}', urlObj.hostname)
            .replace('{pathname}', urlObj.pathname)
            .replace('{protocol}', urlObj.protocol.replace(':', ''));
          
        default:
          log('error', 'Unknown proxy type');
          return null;
      }
    } catch (e) {
      log('error', 'Error generating proxied URL:', e);
      return null;
    }
  }
  
  /**
   * Redirect to a proxied version of the URL
   * @param {string} url URL to proxy
   * @param {Object} institution Institution object with proxy information
   * @param {Object} options Additional options
   * @returns {Promise<Object>} Result of the redirection attempt
   */
  async function redirectToProxy(url, institution, options = {}) {
    if (!url) {
      return { success: false, error: 'Missing URL' };
    }
    
    if (!institution || !institution.proxy) {
      return { success: false, error: 'Missing institution or proxy information' };
    }
    
    const redirectOptions = {
      tabId: options.tabId,
      trackRedirect: options.trackRedirect !== undefined ? options.trackRedirect : config.trackRedirects,
      openInNewTab: options.openInNewTab || false
    };
    
    try {
      // Detect proxy type from institution
      const proxyInfo = institution.proxyType && institution.proxyValue 
        ? { type: institution.proxyType, value: institution.proxyValue }
        : detectProxyType(institution.proxy);
      
      log('debug', 'Detected proxy type:', proxyInfo);
      
      // Generate the proxied URL
      const proxiedUrl = generateProxiedUrl(url, proxyInfo);
      
      if (!proxiedUrl) {
        return { success: false, error: 'Failed to generate proxied URL' };
      }
      
      // Record the redirect if tracking is enabled
      if (redirectOptions.trackRedirect && typeof options.recordRedirect === 'function') {
        options.recordRedirect({
          originalUrl: url,
          proxiedUrl,
          institution: institution.name || 'Unknown institution',
          timestamp: Date.now()
        });
      }
      
      // Perform the redirection
      if (typeof chrome !== 'undefined' && chrome.tabs && redirectOptions.tabId) {
        // If we're in a browser extension context
        if (redirectOptions.openInNewTab) {
          await chrome.tabs.create({ url: proxiedUrl });
        } else {
          await chrome.tabs.update(redirectOptions.tabId, { url: proxiedUrl });
        }
      } else if (typeof window !== 'undefined') {
        // If we're in a browser context
        if (redirectOptions.openInNewTab) {
          window.open(proxiedUrl, '_blank');
        } else {
          window.location.href = proxiedUrl;
        }
      } else {
        // Cannot redirect, return the URL instead
        return { 
          success: true, 
          redirected: false, 
          proxiedUrl
        };
      }
      
      return { success: true, redirected: true, proxiedUrl };
    } catch (e) {
      log('error', 'Error redirecting to proxy:', e);
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Parse institution data to extract proxy information
   * @param {Object} institution Institution data
   * @returns {Object} Standardized institution object with proxy info
   */
  function parseInstitution(institution) {
    if (!institution) {
      return null;
    }
    
    const result = {
      name: institution.name || 'Unknown institution',
      id: institution.id
    };
    
    // Handle different institution data formats
    if (institution.proxy) {
      // Simple proxy string
      const proxyInfo = detectProxyType(institution.proxy);
      result.proxy = institution.proxy;
      result.proxyType = proxyInfo.type;
      result.proxyValue = proxyInfo.value;
    } else if (institution.proxyUrl) {
      // Explicit proxy URL
      const proxyInfo = detectProxyType(institution.proxyUrl);
      result.proxy = institution.proxyUrl;
      result.proxyType = proxyInfo.type;
      result.proxyValue = proxyInfo.value;
    } else if (institution.proxySuffix) {
      // Suffix-style proxy
      result.proxy = institution.proxySuffix;
      result.proxyType = PROXY_TYPES.SUFFIX;
      result.proxyValue = institution.proxySuffix.startsWith('.') 
        ? institution.proxySuffix 
        : `.${institution.proxySuffix}`;
    } else if (institution.proxyPattern) {
      // Complex proxy pattern
      result.proxy = institution.proxyPattern;
      result.proxyType = PROXY_TYPES.COMPLEX;
      result.proxyValue = institution.proxyPattern;
    } else {
      // No proxy information available
      log('warn', 'No proxy information found in institution data');
      return null;
    }
    
    return result;
  }
  
  /**
   * Toggle the logging configuration
   * @param {boolean} enabled Whether logging is enabled
   * @param {string} level Log level ('debug', 'info', 'warn', 'error')
   */
  function setLogging(enabled, level = 'info') {
    config.logging.enabled = enabled;
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      config.logging.level = level;
    }
  }
  
  // Return the public API
  return {
    redirectToProxy,
    generateProxiedUrl,
    isAlreadyProxied,
    extractOriginalUrl,
    parseInstitution,
    setLogging,
    PROXY_TYPES
  };
}

/**
 * Simplified function to generate a proxied URL and redirect
 * This is the main function that would be called from the UI
 * @param {string} url The URL to redirect
 * @param {Object} institution The institution object with proxy info
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Result of the redirection
 */
async function accessViaLibrary(url, institution, options = {}) {
  // Get the current tab ID if we're in an extension context
  let tabId = null;
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = activeTab.id;
    } catch (e) {
      console.error('Error getting active tab:', e);
    }
  }
  
  // Create the redirector
  const redirector = createProxyRedirector({
    logging: { enabled: true, level: 'error' },
    trackRedirects: true
  });
  
  // Record the redirect if we have the storage API
  const recordRedirect = async (redirectData) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        // Get existing history
        const result = await chrome.storage.local.get(['access_history']);
        let history = result.access_history || [];
        
        // Add new entry
        history.unshift({
          ...redirectData,
          type: 'library_access'
        });
        
        // Limit history size
        if (history.length > 100) {
          history = history.slice(0, 100);
        }
        
        // Save updated history
        await chrome.storage.local.set({ access_history: history });
      } catch (e) {
        console.error('Error recording redirect:', e);
      }
    }
  };
  
  // Parse the institution data
  const parsedInstitution = redirector.parseInstitution(institution);
  
  if (!parsedInstitution) {
    return { success: false, error: 'Invalid institution data' };
  }
  
  // Redirect to the proxy
  return redirector.redirectToProxy(url, parsedInstitution, {
    tabId,
    recordRedirect,
    openInNewTab: options.openInNewTab || false
  });
}

// Export both the factory function and the simplified helper
export {
  createProxyRedirector,
  accessViaLibrary
};