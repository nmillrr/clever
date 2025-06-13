/**
 * Unit tests for proxy URL generator module
 */

import { createProxyRedirector, PROXY_TYPES } from '../src/modules/proxy-redirect';

// Mock chrome API
global.chrome = {
  tabs: {
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({})
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        callback({});
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) callback();
      })
    }
  }
};

describe('Proxy URL Generator', () => {
  let redirector;
  
  beforeEach(() => {
    // Create a fresh redirector for each test
    redirector = createProxyRedirector({
      logging: { enabled: false }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('detectProxyType', () => {
    // Access the private function for testing
    const detectProxyType = (proxyString) => {
      // Create a redirector just for this test
      const tempRedirector = createProxyRedirector({
        logging: { enabled: false }
      });
      
      // Call parseInstitution which uses detectProxyType internally
      const institution = tempRedirector.parseInstitution({
        name: 'Test Institution',
        proxy: proxyString
      });
      
      return {
        type: institution.proxyType,
        value: institution.proxyValue
      };
    };
    
    it('should detect prefix-type proxy URLs', () => {
      const prefixProxies = [
        'https://proxy.example.edu/login?url=',
        'https://ezproxy.lib.example.edu/',
        'https://login.proxy.example.edu/proxy?url='
      ];
      
      prefixProxies.forEach(proxy => {
        const result = detectProxyType(proxy);
        expect(result.type).toBe(PROXY_TYPES.PREFIX);
      });
    });
    
    it('should detect suffix-type proxy URLs', () => {
      const suffixProxies = [
        '.proxy.example.edu',
        '.ezproxy.example.edu',
        'proxy.example.edu'
      ];
      
      suffixProxies.forEach(proxy => {
        const result = detectProxyType(proxy);
        expect(result.type).toBe(PROXY_TYPES.SUFFIX);
        expect(result.value.startsWith('.')).toBeTruthy();
      });
    });
    
    it('should detect complex proxy patterns', () => {
      const complexProxies = [
        'https://login.example.edu?qurl={url}&param=value',
        '{protocol}://{hostname}.proxy.example.edu{pathname}'
      ];
      
      complexProxies.forEach(proxy => {
        const result = detectProxyType(proxy);
        expect(result.type).toBe(PROXY_TYPES.COMPLEX);
      });
    });
    
    it('should handle empty or null proxy strings', () => {
      const emptyProxies = ['', null, undefined];
      
      emptyProxies.forEach(proxy => {
        const result = detectProxyType(proxy);
        expect(result.type).toBeNull();
        expect(result.value).toBeNull();
      });
    });
  });
  
  describe('isAlreadyProxied', () => {
    it('should detect URLs that are already proxied with prefix', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const alreadyProxiedUrl = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      const regularUrl = 'https://jstor.org/article/123456';
      
      expect(redirector.isAlreadyProxied(alreadyProxiedUrl, proxyInfo)).toBe(true);
      expect(redirector.isAlreadyProxied(regularUrl, proxyInfo)).toBe(false);
    });
    
    it('should detect URLs that are already proxied with suffix', () => {
      const proxyInfo = {
        type: PROXY_TYPES.SUFFIX,
        value: '.proxy.example.edu'
      };
      
      const alreadyProxiedUrl = 'https://jstor.org.proxy.example.edu/article/123456';
      const regularUrl = 'https://jstor.org/article/123456';
      
      expect(redirector.isAlreadyProxied(alreadyProxiedUrl, proxyInfo)).toBe(true);
      expect(redirector.isAlreadyProxied(regularUrl, proxyInfo)).toBe(false);
    });
    
    it('should handle invalid URLs gracefully', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      expect(redirector.isAlreadyProxied('not-a-url', proxyInfo)).toBe(false);
      expect(redirector.isAlreadyProxied('', proxyInfo)).toBe(false);
      expect(redirector.isAlreadyProxied(null, proxyInfo)).toBe(false);
    });
    
    it('should handle missing proxy info gracefully', () => {
      const url = 'https://jstor.org/article/123456';
      
      expect(redirector.isAlreadyProxied(url, null)).toBe(false);
      expect(redirector.isAlreadyProxied(url, {})).toBe(false);
      expect(redirector.isAlreadyProxied(url, { type: null })).toBe(false);
    });
  });
  
  describe('generateProxiedUrl', () => {
    it('should generate proxied URLs with prefix-type proxies', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const url = 'https://jstor.org/article/123456';
      const expected = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      
      expect(redirector.generateProxiedUrl(url, proxyInfo)).toBe(expected);
    });
    
    it('should generate proxied URLs with suffix-type proxies', () => {
      const proxyInfo = {
        type: PROXY_TYPES.SUFFIX,
        value: '.proxy.example.edu'
      };
      
      const url = 'https://jstor.org/article/123456';
      const expected = 'https://jstor.org.proxy.example.edu/article/123456';
      
      expect(redirector.generateProxiedUrl(url, proxyInfo)).toBe(expected);
    });
    
    it('should generate proxied URLs with complex proxy patterns', () => {
      const proxyInfo = {
        type: PROXY_TYPES.COMPLEX,
        value: 'https://login.example.edu?qurl={url}'
      };
      
      const url = 'https://jstor.org/article/123456';
      const expected = 'https://login.example.edu?qurl=https%3A%2F%2Fjstor.org%2Farticle%2F123456';
      
      expect(redirector.generateProxiedUrl(url, proxyInfo)).toBe(expected);
    });
    
    it('should handle URLs that are already proxied', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const alreadyProxiedUrl = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      
      expect(redirector.generateProxiedUrl(alreadyProxiedUrl, proxyInfo)).toBe(alreadyProxiedUrl);
    });
    
    it('should add protocol to URLs without one', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const urlWithoutProtocol = 'jstor.org/article/123456';
      const expected = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      
      expect(redirector.generateProxiedUrl(urlWithoutProtocol, proxyInfo)).toBe(expected);
    });
    
    it('should handle invalid inputs gracefully', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      expect(redirector.generateProxiedUrl('', proxyInfo)).toBeNull();
      expect(redirector.generateProxiedUrl(null, proxyInfo)).toBeNull();
      expect(redirector.generateProxiedUrl('https://jstor.org/article/123456', null)).toBeNull();
      expect(redirector.generateProxiedUrl('https://jstor.org/article/123456', {})).toBeNull();
    });
  });
  
  describe('extractOriginalUrl', () => {
    it('should extract original URL from prefix-proxied URL', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const proxiedUrl = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      const expected = 'https://jstor.org/article/123456';
      
      expect(redirector.extractOriginalUrl(proxiedUrl, proxyInfo)).toBe(expected);
    });
    
    it('should extract original URL from suffix-proxied URL', () => {
      const proxyInfo = {
        type: PROXY_TYPES.SUFFIX,
        value: '.proxy.example.edu'
      };
      
      const proxiedUrl = 'https://jstor.org.proxy.example.edu/article/123456';
      const expected = 'https://jstor.org/article/123456';
      
      expect(redirector.extractOriginalUrl(proxiedUrl, proxyInfo)).toBe(expected);
    });
    
    it('should handle query parameter style proxies', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const proxiedUrl = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456&other=param';
      const expected = 'https://jstor.org/article/123456';
      
      // This test might fail due to how URL search params are handled
      // The real function might need special handling for this case
      const result = redirector.extractOriginalUrl(proxiedUrl, proxyInfo);
      expect(result).toBe(expected);
    });
    
    it('should return null for unproxied URLs', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      const regularUrl = 'https://jstor.org/article/123456';
      
      expect(redirector.extractOriginalUrl(regularUrl, proxyInfo)).toBeNull();
    });
    
    it('should handle invalid inputs gracefully', () => {
      const proxyInfo = {
        type: PROXY_TYPES.PREFIX,
        value: 'https://proxy.example.edu/login?url='
      };
      
      expect(redirector.extractOriginalUrl('', proxyInfo)).toBeNull();
      expect(redirector.extractOriginalUrl(null, proxyInfo)).toBeNull();
      expect(redirector.extractOriginalUrl('https://jstor.org/article/123456', null)).toBeNull();
      expect(redirector.extractOriginalUrl('https://jstor.org/article/123456', {})).toBeNull();
    });
  });
  
  describe('parseInstitution', () => {
    it('should parse institution with proxy property', () => {
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      
      const result = redirector.parseInstitution(institution);
      
      expect(result.name).toBe('University of Example');
      expect(result.proxy).toBe('https://proxy.example.edu/login?url=');
      expect(result.proxyType).toBe(PROXY_TYPES.PREFIX);
      expect(result.proxyValue).toBe('https://proxy.example.edu/login?url=/');
    });
    
    it('should parse institution with proxyUrl property', () => {
      const institution = {
        name: 'University of Example',
        proxyUrl: 'https://proxy.example.edu/login?url='
      };
      
      const result = redirector.parseInstitution(institution);
      
      expect(result.proxy).toBe('https://proxy.example.edu/login?url=');
      expect(result.proxyType).toBe(PROXY_TYPES.PREFIX);
    });
    
    it('should parse institution with proxySuffix property', () => {
      const institution = {
        name: 'University of Example',
        proxySuffix: 'proxy.example.edu'
      };
      
      const result = redirector.parseInstitution(institution);
      
      expect(result.proxy).toBe('proxy.example.edu');
      expect(result.proxyType).toBe(PROXY_TYPES.SUFFIX);
      expect(result.proxyValue).toBe('.proxy.example.edu');
    });
    
    it('should parse institution with proxyPattern property', () => {
      const institution = {
        name: 'University of Example',
        proxyPattern: 'https://login.example.edu?qurl={url}'
      };
      
      const result = redirector.parseInstitution(institution);
      
      expect(result.proxy).toBe('https://login.example.edu?qurl={url}');
      expect(result.proxyType).toBe(PROXY_TYPES.COMPLEX);
    });
    
    it('should return null for invalid institution data', () => {
      expect(redirector.parseInstitution(null)).toBeNull();
      expect(redirector.parseInstitution({})).toBeNull();
      expect(redirector.parseInstitution({ name: 'University of Example' })).toBeNull();
    });
  });
  
  describe('redirectToProxy', () => {
    it('should redirect to proxy URL using chrome.tabs.update', async () => {
      const url = 'https://jstor.org/article/123456';
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      const tabId = 123;
      
      const result = await redirector.redirectToProxy(url, institution, { tabId });
      
      expect(result.success).toBe(true);
      expect(result.redirected).toBe(true);
      expect(chrome.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'https://proxy.example.edu/login?url=https://jstor.org/article/123456'
      });
    });
    
    it('should open in new tab when openInNewTab is true', async () => {
      const url = 'https://jstor.org/article/123456';
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      
      const result = await redirector.redirectToProxy(url, institution, { openInNewTab: true });
      
      expect(result.success).toBe(true);
      expect(result.redirected).toBe(true);
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://proxy.example.edu/login?url=https://jstor.org/article/123456'
      });
    });
    
    it('should record redirect if tracking is enabled', async () => {
      const url = 'https://jstor.org/article/123456';
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      const recordRedirect = jest.fn();
      
      await redirector.redirectToProxy(url, institution, {
        trackRedirect: true,
        recordRedirect
      });
      
      expect(recordRedirect).toHaveBeenCalledWith(expect.objectContaining({
        originalUrl: url,
        proxiedUrl: expect.any(String),
        institution: institution.name
      }));
    });
    
    it('should handle URLs that are already proxied', async () => {
      const alreadyProxiedUrl = 'https://proxy.example.edu/login?url=https://jstor.org/article/123456';
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      const tabId = 123;
      
      const result = await redirector.redirectToProxy(alreadyProxiedUrl, institution, { tabId });
      
      expect(result.success).toBe(true);
      expect(chrome.tabs.update).toHaveBeenCalledWith(tabId, {
        url: alreadyProxiedUrl
      });
    });
    
    it('should return error for invalid URL', async () => {
      const institution = {
        name: 'University of Example',
        proxy: 'https://proxy.example.edu/login?url='
      };
      
      const result = await redirector.redirectToProxy('', institution);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing URL');
      expect(chrome.tabs.update).not.toHaveBeenCalled();
    });
    
    it('should return error for invalid institution', async () => {
      const url = 'https://jstor.org/article/123456';
      
      const result = await redirector.redirectToProxy(url, null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing institution or proxy information');
      expect(chrome.tabs.update).not.toHaveBeenCalled();
    });
  });
});