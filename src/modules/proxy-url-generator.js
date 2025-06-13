/**
 * Proxy URL Generator Module
 * 
 * Transforms article URLs into proxied versions using institutional proxy patterns.
 * Supports various proxy formats including EZProxy, LibGuides, and custom patterns.
 */

/**
 * Known proxy pattern types
 */
const PROXY_TYPES = {
  EZPROXY_PREFIX: 'ezproxy_prefix',
  EZPROXY_SUFFIX: 'ezproxy_suffix',
  LIBKEY: 'libkey',
  CUSTOM_PATTERN: 'custom_pattern'
};

/**
 * Generates a proxied URL using a prefix-based proxy
 * @param {string} url Original article URL
 * @param {string} proxyPrefix Proxy prefix URL
 * @returns {string} Proxied URL
 */
function generatePrefixProxyUrl(url, proxyPrefix) {
  if (!url || !proxyPrefix) return url;
  
  // Ensure the proxy prefix ends with a slash if it doesn't contain a placeholder
  let prefix = proxyPrefix;
  if (!prefix.includes('{url}') && !prefix.endsWith('/')) {
    prefix += '/';
  }
  
  // Handle case where proxy already contains a placeholder
  if (prefix.includes('{url}')) {
    return prefix.replace('{url}', encodeURIComponent(url));
  }
  
  return prefix + url;
}

/**
 * Generates a proxied URL using a suffix-based proxy
 * @param {string} url Original article URL
 * @param {string} proxySuffix Proxy suffix (e.g., .proxy.example.edu)
 * @returns {string} Proxied URL
 */
function generateSuffixProxyUrl(url, proxySuffix) {
  if (!url || !proxySuffix) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Ensure the proxy suffix starts with a dot
    const suffix = proxySuffix.startsWith('.') ? proxySuffix : '.' + proxySuffix;
    
    // Insert the proxy suffix after the hostname
    return url.replace(urlObj.hostname, urlObj.hostname + suffix);
  } catch (e) {
    console.error('Invalid URL format:', e);
    return url;
  }
}

/**
 * Generates a proxied URL using LibKey's proxy format
 * @param {string} url Original article URL
 * @param {string} libKeyId Institution's LibKey ID
 * @returns {string} Proxied URL via LibKey
 */
function generateLibKeyUrl(url, libKeyId) {
  if (!url || !libKeyId) return url;
  
  return `https://libkey.io/libraries/${libKeyId}/openurl?url=${encodeURIComponent(url)}`;
}

/**
 * Generates a proxied URL using a custom pattern
 * @param {string} url Original article URL
 * @param {string} pattern Custom proxy pattern with {url}, {hostname}, {path}, {protocol} placeholders
 * @returns {string} Proxied URL based on the custom pattern
 */
function generateCustomPatternUrl(url, pattern) {
  if (!url || !pattern) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Extract components that can be used in the pattern
    const components = {
      url: url,
      encodedUrl: encodeURIComponent(url),
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search + urlObj.hash,
      protocol: urlObj.protocol.replace(':', ''),
      origin: urlObj.origin
    };
    
    // Replace placeholders in the pattern
    let result = pattern;
    for (const [key, value] of Object.entries(components)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    return result;
  } catch (e) {
    console.error('Error generating custom proxy URL:', e);
    return url;
  }
}

/**
 * Determines if a URL is already proxied
 * @param {string} url URL to check
 * @param {Object} proxyConfig Proxy configuration
 * @returns {boolean} Whether the URL is already proxied
 */
function isAlreadyProxied(url, proxyConfig) {
  if (!url || !proxyConfig) return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check for prefix-based proxy
    if (proxyConfig.type === PROXY_TYPES.EZPROXY_PREFIX && 
        proxyConfig.url && 
        url.startsWith(proxyConfig.url)) {
      return true;
    }
    
    // Check for suffix-based proxy
    if (proxyConfig.type === PROXY_TYPES.EZPROXY_SUFFIX && 
        proxyConfig.suffix && 
        urlObj.hostname.includes(proxyConfig.suffix)) {
      return true;
    }
    
    // Check for LibKey proxy
    if (proxyConfig.type === PROXY_TYPES.LIBKEY && 
        urlObj.hostname === 'libkey.io' && 
        urlObj.pathname.includes('/libraries/')) {
      return true;
    }
    
    // For custom patterns, check if the URL matches the expected output
    if (proxyConfig.type === PROXY_TYPES.CUSTOM_PATTERN && 
        proxyConfig.pattern) {
      const expectedProxied = generateCustomPatternUrl(url, proxyConfig.pattern);
      return url === expectedProxied;
    }
    
    return false;
  } catch (e) {
    console.error('Error checking if URL is already proxied:', e);
    return false;
  }
}

/**
 * Extracts the original URL from a proxied URL
 * @param {string} proxiedUrl Proxied URL
 * @param {Object} proxyConfig Proxy configuration
 * @returns {string|null} Original URL if extraction successful, null otherwise
 */
function extractOriginalUrl(proxiedUrl, proxyConfig) {
  if (!proxiedUrl || !proxyConfig) return null;
  
  try {
    const urlObj = new URL(proxiedUrl);
    
    // Handle prefix-based proxy
    if (proxyConfig.type === PROXY_TYPES.EZPROXY_PREFIX && proxyConfig.url) {
      if (proxiedUrl.startsWith(proxyConfig.url)) {
        // If proxy uses a placeholder, we need a more complex extraction
        if (proxyConfig.url.includes('{url}')) {
          // This is a complex case that depends on the specific proxy implementation
          // We'll need to implement specific extractors for known proxy patterns
          return null;
        }
        
        // Simple case: URL is appended to the proxy prefix
        return proxiedUrl.substring(proxyConfig.url.length);
      }
    }
    
    // Handle suffix-based proxy
    if (proxyConfig.type === PROXY_TYPES.EZPROXY_SUFFIX && proxyConfig.suffix) {
      const suffix = proxyConfig.suffix.startsWith('.') ? proxyConfig.suffix : '.' + proxyConfig.suffix;
      if (urlObj.hostname.includes(suffix)) {
        const originalHostname = urlObj.hostname.replace(suffix, '');
        return proxiedUrl.replace(urlObj.hostname, originalHostname);
      }
    }
    
    // Handle LibKey proxy
    if (proxyConfig.type === PROXY_TYPES.LIBKEY && 
        urlObj.hostname === 'libkey.io' && 
        urlObj.pathname.includes('/libraries/')) {
      const urlParam = urlObj.searchParams.get('url');
      if (urlParam) {
        return decodeURIComponent(urlParam);
      }
    }
    
    // Custom pattern extraction is generally not reliable without specific knowledge
    // of the pattern and its inverse
    
    return null;
  } catch (e) {
    console.error('Error extracting original URL:', e);
    return null;
  }
}

/**
 * Main function to generate a proxied URL based on the proxy configuration
 * @param {string} url Original article URL
 * @param {Object} proxyConfig Proxy configuration object
 * @returns {string} Proxied URL
 */
function generateProxyUrl(url, proxyConfig) {
  if (!url) return url;
  if (!proxyConfig) return url;
  
  // Check if URL is already proxied
  if (isAlreadyProxied(url, proxyConfig)) {
    return url;
  }
  
  switch (proxyConfig.type) {
    case PROXY_TYPES.EZPROXY_PREFIX:
      return generatePrefixProxyUrl(url, proxyConfig.url);
      
    case PROXY_TYPES.EZPROXY_SUFFIX:
      return generateSuffixProxyUrl(url, proxyConfig.suffix);
      
    case PROXY_TYPES.LIBKEY:
      return generateLibKeyUrl(url, proxyConfig.libKeyId);
      
    case PROXY_TYPES.CUSTOM_PATTERN:
      return generateCustomPatternUrl(url, proxyConfig.pattern);
      
    default:
      return url;
  }
}

/**
 * Simplified function to generate a proxied URL using just a suffix
 * @param {string} url Original article URL
 * @param {string} proxySuffix Proxy suffix (e.g., .proxy.example.edu)
 * @returns {string} Proxied URL
 */
function appendProxySuffix(url, proxySuffix) {
  return generateSuffixProxyUrl(url, proxySuffix);
}

/**
 * Simplified function to generate a proxied URL using just a prefix
 * @param {string} url Original article URL
 * @param {string} proxyPrefix Proxy prefix URL
 * @returns {string} Proxied URL
 */
function prependProxyPrefix(url, proxyPrefix) {
  return generatePrefixProxyUrl(url, proxyPrefix);
}

/**
 * Creates a proxy configuration object from institutional information
 * @param {Object} institution Institution details
 * @returns {Object|null} Proxy configuration object or null if invalid
 */
function createProxyConfig(institution) {
  if (!institution) return null;
  
  // Handle EZProxy prefix format (most common)
  if (institution.proxyUrl && !institution.proxyUrl.includes('{')) {
    return {
      type: PROXY_TYPES.EZPROXY_PREFIX,
      url: institution.proxyUrl
    };
  }
  
  // Handle EZProxy suffix format
  if (institution.proxySuffix) {
    return {
      type: PROXY_TYPES.EZPROXY_SUFFIX,
      suffix: institution.proxySuffix
    };
  }
  
  // Handle LibKey format
  if (institution.libKeyId) {
    return {
      type: PROXY_TYPES.LIBKEY,
      libKeyId: institution.libKeyId
    };
  }
  
  // Handle custom pattern format
  if (institution.proxyPattern) {
    return {
      type: PROXY_TYPES.CUSTOM_PATTERN,
      pattern: institution.proxyPattern
    };
  }
  
  return null;
}

export {
  generateProxyUrl,
  appendProxySuffix,
  prependProxyPrefix,
  createProxyConfig,
  isAlreadyProxied,
  extractOriginalUrl,
  PROXY_TYPES
};