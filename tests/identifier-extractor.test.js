/**
 * Unit tests for identifier extractor module
 */

import { 
  extractBestIdentifier,
  extractAllIdentifiers,
  extractDOI,
  extractPMID,
  extractArXivID,
  extractCanonicalURL,
  normalizeDOI,
  isValidDOI
} from '../src/modules/identifier-extractor';

// Mock DOMParser
global.DOMParser = class {
  parseFromString(html) {
    return {
      documentElement: {
        outerHTML: html
      },
      querySelector: jest.fn().mockImplementation(selector => {
        // Simple mock implementation
        if (selector.includes('citation_doi')) {
          return { getAttribute: () => '10.1234/example.12345' };
        }
        if (selector.includes('citation_pmid')) {
          return { getAttribute: () => '12345678' };
        }
        if (selector.includes('citation_arxiv_id')) {
          return { getAttribute: () => '2101.12345' };
        }
        if (selector.includes('canonical')) {
          return { getAttribute: () => 'https://example.com/canonical' };
        }
        if (selector.includes('citation_title')) {
          return { getAttribute: () => 'Example Article Title' };
        }
        return null;
      }),
      querySelectorAll: jest.fn().mockImplementation(selector => {
        if (selector.includes('doi')) {
          return [{ getAttribute: () => '10.1234/example.12345' }];
        }
        return [];
      }),
      location: {
        href: 'https://example.com/article/12345'
      },
      body: {
        textContent: 'Example text with DOI: 10.1234/example.12345 and PMID: 12345678'
      }
    };
  }
};

describe('Identifier Extractor', () => {
  describe('DOI Validation', () => {
    it('should validate properly formatted DOIs', () => {
      const validDOIs = [
        '10.1234/journal.article.12345',
        '10.5555/12345678',
        '10.1002/1234-5678(200101)1:1<1::AID-XYZ1>3.0.CO;2-M'
      ];
      
      validDOIs.forEach(doi => {
        expect(isValidDOI(doi)).toBe(true);
      });
    });
    
    it('should reject invalid DOIs', () => {
      const invalidDOIs = [
        '',
        null,
        undefined,
        'not-a-doi',
        '11.1234/example.12345', // Prefix must be 10.
        '10/1234/example.12345', // Missing dot after 10
        '10.1234', // Missing suffix
        'doi:10.1234/example.12345', // Should not include prefix
        'https://doi.org/10.1234/example.12345' // Should not include URL
      ];
      
      invalidDOIs.forEach(doi => {
        expect(isValidDOI(doi)).toBe(false);
      });
    });
  });
  
  describe('normalizeDOI', () => {
    it('should normalize DOIs with prefixes', () => {
      expect(normalizeDOI('doi:10.1234/example.12345')).toBe('10.1234/example.12345');
      expect(normalizeDOI('https://doi.org/10.1234/example.12345')).toBe('10.1234/example.12345');
    });
    
    it('should normalize DOIs with extra whitespace', () => {
      expect(normalizeDOI(' 10.1234/example.12345 ')).toBe('10.1234/example.12345');
      expect(normalizeDOI('10.1234/example.12345  ')).toBe('10.1234/example.12345');
    });
    
    it('should handle invalid DOIs gracefully', () => {
      expect(normalizeDOI('')).toBeNull();
      expect(normalizeDOI(null)).toBeNull();
      
      // Should return original if not valid after normalization
      expect(normalizeDOI('not-a-doi')).toBe('not-a-doi');
    });
  });
  
  describe('extractDOI', () => {
    it('should extract DOI from meta tags', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_doi" content="10.1234/example.12345" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractDOI(mockDoc);
      
      expect(result.doi).toBe('10.1234/example.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('citation_doi');
    });
    
    it('should extract DOI from dc.identifier meta tag', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="dc.identifier" content="doi:10.1234/example.12345" />
          </head>
          <body></body>
        </html>
      `);
      
      // Mock querySelector specifically for this test
      mockDoc.querySelector = jest.fn().mockImplementation(selector => {
        if (selector.includes('dc.identifier')) {
          return { getAttribute: () => 'doi:10.1234/example.12345' };
        }
        return null;
      });
      
      const result = extractDOI(mockDoc);
      
      expect(result.doi).toBe('doi:10.1234/example.12345');
      expect(result.normalized).toBe('10.1234/example.12345');
      expect(result.isValid).toBe(true);
    });
    
    it('should extract DOI from URL path', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Override location
      mockDoc.location = {
        href: 'https://doi.org/10.1234/example.12345'
      };
      
      // Clear querySelector mock
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      
      const result = extractDOI(mockDoc);
      
      expect(result.doi).toBe('10.1234/example.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('url_doi_path');
    });
    
    it('should extract DOI from page content', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has a DOI: 10.1234/example.12345 which should be extracted.
          </body>
        </html>
      `);
      
      // Clear querySelector mock and location
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { href: 'https://example.com/article' };
      
      const result = extractDOI(mockDoc);
      
      expect(result.doi).toBe('10.1234/example.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('doi_text');
    });
    
    it('should return null for no DOI found', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has no DOI.
          </body>
        </html>
      `);
      
      // Clear all mocks
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.querySelectorAll = jest.fn().mockReturnValue([]);
      mockDoc.location = { href: 'https://example.com/article' };
      mockDoc.body.textContent = 'This article has no DOI.';
      
      const result = extractDOI(mockDoc);
      
      expect(result.doi).toBeNull();
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('extractPMID', () => {
    it('should extract PMID from meta tags', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_pmid" content="12345678" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractPMID(mockDoc);
      
      expect(result.pmid).toBe('12345678');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('citation_pmid');
    });
    
    it('should extract PMID from URL', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Override location
      mockDoc.location = {
        href: 'https://pubmed.ncbi.nlm.nih.gov/12345678/'
      };
      
      // Clear querySelector mock
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      
      const result = extractPMID(mockDoc);
      
      expect(result.pmid).toBe('12345678');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('url_pmid');
    });
    
    it('should extract PMID from page content', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has a PMID: 12345678 which should be extracted.
          </body>
        </html>
      `);
      
      // Clear querySelector mock and location
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { href: 'https://example.com/article' };
      
      const result = extractPMID(mockDoc);
      
      expect(result.pmid).toBe('12345678');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('pmid_text');
    });
    
    it('should return null for no PMID found', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has no PMID.
          </body>
        </html>
      `);
      
      // Clear all mocks
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { href: 'https://example.com/article' };
      mockDoc.body.textContent = 'This article has no PMID.';
      
      const result = extractPMID(mockDoc);
      
      expect(result.pmid).toBeNull();
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('extractArXivID', () => {
    it('should extract arXiv ID from meta tags', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_arxiv_id" content="2101.12345" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractArXivID(mockDoc);
      
      expect(result.arxivId).toBe('2101.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('citation_arxiv_id');
    });
    
    it('should extract arXiv ID from URL', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Override location
      mockDoc.location = {
        href: 'https://arxiv.org/abs/2101.12345'
      };
      
      // Clear querySelector mock
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      
      const result = extractArXivID(mockDoc);
      
      expect(result.arxivId).toBe('2101.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('url_arxiv_id');
    });
    
    it('should extract arXiv ID from page content', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has an arXiv ID: 2101.12345 which should be extracted.
          </body>
        </html>
      `);
      
      // Clear querySelector mock and location
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { href: 'https://example.com/article' };
      mockDoc.body.textContent = 'This article has an arXiv ID: 2101.12345 which should be extracted.';
      
      const result = extractArXivID(mockDoc);
      
      expect(result.arxivId).toBe('2101.12345');
      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('arxiv_text');
    });
    
    it('should return null for no arXiv ID found', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body>
            This article has no arXiv ID.
          </body>
        </html>
      `);
      
      // Clear all mocks
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { href: 'https://example.com/article' };
      mockDoc.body.textContent = 'This article has no arXiv ID.';
      
      const result = extractArXivID(mockDoc);
      
      expect(result.arxivId).toBeNull();
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('extractCanonicalURL', () => {
    it('should extract canonical URL from link tag', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractCanonicalURL(mockDoc);
      
      expect(result.url).toBe('https://example.com/canonical');
      expect(result.strategy).toBe('link_canonical');
    });
    
    it('should extract canonical URL from og:url', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta property="og:url" content="https://example.com/og-url" />
          </head>
          <body></body>
        </html>
      `);
      
      // Override querySelector to return canonical first, then og:url
      mockDoc.querySelector = jest.fn().mockImplementation(selector => {
        if (selector.includes('canonical')) {
          return null;
        }
        if (selector.includes('og:url')) {
          return { getAttribute: () => 'https://example.com/og-url' };
        }
        return null;
      });
      
      const result = extractCanonicalURL(mockDoc);
      
      expect(result.url).toBe('https://example.com/og-url');
      expect(result.strategy).toBe('og_url');
    });
    
    it('should use current URL as fallback', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Clear querySelector mock and set location
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.location = { 
        href: 'https://example.com/article?param=value#section',
        origin: 'https://example.com',
        pathname: '/article',
        searchParams: {
          has: () => false,
          get: () => null
        }
      };
      
      // Mock URL constructor
      global.URL = class {
        constructor(url) {
          this.href = url;
          this.origin = 'https://example.com';
          this.pathname = '/article';
          this.searchParams = {
            has: jest.fn().mockReturnValue(false),
            get: jest.fn().mockReturnValue(null),
            set: jest.fn()
          };
        }
        toString() {
          return 'https://example.com/article';
        }
      };
      
      const result = extractCanonicalURL(mockDoc);
      
      expect(result.url).toBe('https://example.com/article');
      expect(result.strategy).toBe('current_url');
    });
    
    it('should handle missing URL gracefully', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Clear querySelector mock and location
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      delete mockDoc.location;
      mockDoc.URL = undefined;
      
      const result = extractCanonicalURL(mockDoc);
      
      expect(result.url).toBeNull();
    });
  });
  
  describe('extractAllIdentifiers', () => {
    it('should extract all available identifiers', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_doi" content="10.1234/example.12345" />
            <meta name="citation_pmid" content="12345678" />
            <meta name="citation_arxiv_id" content="2101.12345" />
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractAllIdentifiers(mockDoc);
      
      expect(result.doi.doi).toBe('10.1234/example.12345');
      expect(result.doi.isValid).toBe(true);
      expect(result.pmid.pmid).toBe('12345678');
      expect(result.pmid.isValid).toBe(true);
      expect(result.arxivId.arxivId).toBe('2101.12345');
      expect(result.arxivId.isValid).toBe(true);
      expect(result.canonicalUrl.url).toBe('https://example.com/canonical');
    });
    
    it('should handle missing identifiers gracefully', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Clear all mocks
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.querySelectorAll = jest.fn().mockReturnValue([]);
      mockDoc.location = { href: 'https://example.com/article' };
      mockDoc.body.textContent = 'This article has no identifiers.';
      
      const result = extractAllIdentifiers(mockDoc);
      
      expect(result.doi.doi).toBeNull();
      expect(result.doi.isValid).toBe(false);
      expect(result.pmid.pmid).toBeNull();
      expect(result.pmid.isValid).toBe(false);
      expect(result.arxivId.arxivId).toBeNull();
      expect(result.arxivId.isValid).toBe(false);
      // canonicalUrl might still have a value from the current URL
    });
    
    it('should handle HTML string input', () => {
      const htmlString = `
        <html>
          <head>
            <meta name="citation_doi" content="10.1234/example.12345" />
          </head>
          <body></body>
        </html>
      `;
      
      const result = extractAllIdentifiers(htmlString);
      
      expect(result.doi.doi).toBe('10.1234/example.12345');
      expect(result.doi.isValid).toBe(true);
    });
  });
  
  describe('extractBestIdentifier', () => {
    it('should prioritize DOI over other identifiers', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_doi" content="10.1234/example.12345" />
            <meta name="citation_pmid" content="12345678" />
            <meta name="citation_arxiv_id" content="2101.12345" />
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      const result = extractBestIdentifier(mockDoc);
      
      expect(result.type).toBe('doi');
      expect(result.value).toBe('10.1234/example.12345');
      expect(result.confidence).toBe('high');
    });
    
    it('should fall back to PMID if no DOI is available', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_pmid" content="12345678" />
            <meta name="citation_arxiv_id" content="2101.12345" />
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      // Clear DOI mock
      mockDoc.querySelector = jest.fn().mockImplementation(selector => {
        if (selector.includes('citation_doi')) {
          return null;
        }
        if (selector.includes('citation_pmid')) {
          return { getAttribute: () => '12345678' };
        }
        if (selector.includes('citation_arxiv_id')) {
          return { getAttribute: () => '2101.12345' };
        }
        if (selector.includes('canonical')) {
          return { getAttribute: () => 'https://example.com/canonical' };
        }
        return null;
      });
      
      const result = extractBestIdentifier(mockDoc);
      
      expect(result.type).toBe('pmid');
      expect(result.value).toBe('12345678');
      expect(result.confidence).toBe('medium');
    });
    
    it('should fall back to arXiv ID if no DOI or PMID is available', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <meta name="citation_arxiv_id" content="2101.12345" />
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      // Clear DOI and PMID mocks
      mockDoc.querySelector = jest.fn().mockImplementation(selector => {
        if (selector.includes('citation_doi') || selector.includes('citation_pmid')) {
          return null;
        }
        if (selector.includes('citation_arxiv_id')) {
          return { getAttribute: () => '2101.12345' };
        }
        if (selector.includes('canonical')) {
          return { getAttribute: () => 'https://example.com/canonical' };
        }
        return null;
      });
      
      const result = extractBestIdentifier(mockDoc);
      
      expect(result.type).toBe('arxiv');
      expect(result.value).toBe('2101.12345');
      expect(result.confidence).toBe('medium');
    });
    
    it('should fall back to URL if no other identifier is available', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head>
            <link rel="canonical" href="https://example.com/canonical" />
          </head>
          <body></body>
        </html>
      `);
      
      // Clear all identifier mocks
      mockDoc.querySelector = jest.fn().mockImplementation(selector => {
        if (selector.includes('citation_doi') || 
            selector.includes('citation_pmid') || 
            selector.includes('citation_arxiv_id')) {
          return null;
        }
        if (selector.includes('canonical')) {
          return { getAttribute: () => 'https://example.com/canonical' };
        }
        return null;
      });
      
      const result = extractBestIdentifier(mockDoc);
      
      expect(result.type).toBe('url');
      expect(result.value).toBe('https://example.com/canonical');
      expect(result.confidence).toBe('low');
    });
    
    it('should return null when no identifiers are found', () => {
      const mockDoc = new DOMParser().parseFromString(`
        <html>
          <head></head>
          <body></body>
        </html>
      `);
      
      // Clear all mocks
      mockDoc.querySelector = jest.fn().mockReturnValue(null);
      mockDoc.querySelectorAll = jest.fn().mockReturnValue([]);
      delete mockDoc.location;
      mockDoc.URL = undefined;
      mockDoc.body.textContent = 'This article has no identifiers.';
      
      const result = extractBestIdentifier(mockDoc);
      
      expect(result.type).toBeNull();
      expect(result.value).toBeNull();
      expect(result.confidence).toBe('none');
    });
  });
});