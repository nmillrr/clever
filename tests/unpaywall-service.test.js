/**
 * Unit tests for Unpaywall API service
 */

import { createUnpaywallService, findOpenAccessUrl } from '../src/modules/unpaywall-service';

// Mock fetch API
global.fetch = jest.fn();

// Helper to mock a successful fetch response
const mockFetchResponse = (data) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
};

// Helper to mock a failed fetch response
const mockFetchError = (status, statusText) => {
  return Promise.resolve({
    ok: false,
    status,
    statusText
  });
};

describe('Unpaywall Service', () => {
  let unpaywallService;
  
  beforeEach(() => {
    // Create a new service for each test
    unpaywallService = createUnpaywallService({
      email: 'test@example.com',
      logging: { enabled: false }
    });
    
    // Clear mock implementation and history
    fetch.mockClear();
  });
  
  describe('findOpenAccessPdf', () => {
    it('should return open access URL when available', async () => {
      // Mock API response for article with OA availability
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true,
        oa_locations: [
          {
            url_for_pdf: 'https://example.com/pdf/article.pdf',
            url: 'https://example.com/article',
            host_type: 'publisher',
            version: 'publishedVersion',
            license: 'cc-by'
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      // Check that fetch was called with the correct URL
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.unpaywall.org/v2/10.1234%2Fexample.12345'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      
      // Check result
      expect(result).not.toBeNull();
      expect(result.url).toBe('https://example.com/pdf/article.pdf');
      expect(result.isPdf).toBe(true);
      expect(result.hostType).toBe('publisher');
      expect(result.version).toBe('publishedVersion');
      expect(result.license).toBe('cc-by');
    });
    
    it('should return null for non-open access article', async () => {
      // Mock API response for non-OA article
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: false,
        oa_locations: []
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(result).toBeNull();
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error response
      fetch.mockImplementationOnce(() => mockFetchError(404, 'Not Found'));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(result).toBeNull();
    });
    
    it('should handle network errors gracefully', async () => {
      // Mock network error
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(result).toBeNull();
    });
    
    it('should handle timeout errors gracefully', async () => {
      // Mock abort error (timeout)
      fetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(result).toBeNull();
    });
    
    it('should throw error for missing DOI', async () => {
      await expect(unpaywallService.findOpenAccessPdf()).rejects.toThrow('DOI is required');
      await expect(unpaywallService.findOpenAccessPdf('')).rejects.toThrow('DOI is required');
    });
  });
  
  describe('Location scoring', () => {
    it('should prioritize publisher-hosted PDFs', async () => {
      // Mock API response with multiple OA locations
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true,
        oa_locations: [
          {
            url: 'https://repository.example.edu/article',
            host_type: 'repository',
            version: 'acceptedVersion',
            license: null
          },
          {
            url_for_pdf: 'https://publisher.example.com/pdf/article.pdf',
            url: 'https://publisher.example.com/article',
            host_type: 'publisher',
            version: 'publishedVersion',
            license: 'cc-by'
          },
          {
            url_for_pdf: 'https://arxiv.org/pdf/2101.12345.pdf',
            url: 'https://arxiv.org/abs/2101.12345',
            host_type: 'repository',
            version: 'submittedVersion',
            license: null
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      // Should choose the publisher version
      expect(result.url).toBe('https://publisher.example.com/pdf/article.pdf');
      expect(result.hostType).toBe('publisher');
      expect(result.version).toBe('publishedVersion');
    });
    
    it('should prefer PDFs over landing pages', async () => {
      // Mock API response with PDF and non-PDF options
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true,
        oa_locations: [
          {
            url: 'https://repository.example.edu/article',
            host_type: 'repository',
            version: 'publishedVersion',
            license: 'cc-by'
          },
          {
            url_for_pdf: 'https://arxiv.org/pdf/2101.12345.pdf',
            url: 'https://arxiv.org/abs/2101.12345',
            host_type: 'repository',
            version: 'submittedVersion',
            license: null
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      // Should choose the option with PDF
      expect(result.url).toBe('https://arxiv.org/pdf/2101.12345.pdf');
      expect(result.isPdf).toBe(true);
    });
    
    it('should prefer open licenses', async () => {
      // Mock API response with different license types
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true,
        oa_locations: [
          {
            url_for_pdf: 'https://repo1.example.edu/pdf/article.pdf',
            url: 'https://repo1.example.edu/article',
            host_type: 'repository',
            version: 'publishedVersion',
            license: null
          },
          {
            url_for_pdf: 'https://repo2.example.edu/pdf/article.pdf',
            url: 'https://repo2.example.edu/article',
            host_type: 'repository',
            version: 'publishedVersion',
            license: 'cc-by'
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      // Should choose the option with CC-BY license
      expect(result.url).toBe('https://repo2.example.edu/pdf/article.pdf');
      expect(result.license).toBe('cc-by');
    });
  });
  
  describe('API configuration', () => {
    it('should use the provided email in API requests', async () => {
      const customService = createUnpaywallService({
        email: 'custom@example.com'
      });
      
      fetch.mockImplementationOnce(() => mockFetchResponse({ is_oa: false }));
      
      await customService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('email=custom%40example.com'),
        expect.any(Object)
      );
    });
    
    it('should use the API key if provided', async () => {
      const customService = createUnpaywallService({
        email: 'test@example.com',
        apiKey: 'test-api-key'
      });
      
      fetch.mockImplementationOnce(() => mockFetchResponse({ is_oa: false }));
      
      await customService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=test-api-key'),
        expect.any(Object)
      );
    });
    
    it('should allow updating the configuration', async () => {
      unpaywallService.updateConfig({
        email: 'updated@example.com',
        apiKey: 'new-api-key'
      });
      
      fetch.mockImplementationOnce(() => mockFetchResponse({ is_oa: false }));
      
      await unpaywallService.findOpenAccessPdf('10.1234/example.12345');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('email=updated%40example.com'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=new-api-key'),
        expect.any(Object)
      );
    });
  });
  
  describe('getArticleMetadata', () => {
    it('should return full article metadata', async () => {
      const mockData = {
        doi: '10.1234/example.12345',
        title: 'Example Article Title',
        journal_name: 'Journal of Examples',
        year: 2023,
        authors: [
          { given: 'John', family: 'Doe' },
          { given: 'Jane', family: 'Smith' }
        ],
        is_oa: true,
        oa_locations: [
          {
            url_for_pdf: 'https://example.com/pdf/article.pdf',
            url: 'https://example.com/article',
            host_type: 'publisher',
            version: 'publishedVersion',
            license: 'cc-by'
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.getArticleMetadata('10.1234/example.12345');
      
      expect(result).toEqual(mockData);
    });
    
    it('should handle API errors gracefully', async () => {
      fetch.mockImplementationOnce(() => mockFetchError(404, 'Not Found'));
      
      const result = await unpaywallService.getArticleMetadata('10.1234/example.12345');
      
      expect(result).toBeNull();
    });
  });
  
  describe('isOpenAccess', () => {
    it('should return true for open access articles', async () => {
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.isOpenAccess('10.1234/example.12345');
      
      expect(result).toBe(true);
    });
    
    it('should return false for non-open access articles', async () => {
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: false
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await unpaywallService.isOpenAccess('10.1234/example.12345');
      
      expect(result).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      
      const result = await unpaywallService.isOpenAccess('10.1234/example.12345');
      
      expect(result).toBe(false);
    });
  });
  
  describe('findOpenAccessUrl (simplified helper)', () => {
    it('should return URL when available', async () => {
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: true,
        oa_locations: [
          {
            url_for_pdf: 'https://example.com/pdf/article.pdf',
            url: 'https://example.com/article',
            host_type: 'publisher',
            version: 'publishedVersion'
          }
        ]
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await findOpenAccessUrl('10.1234/example.12345', 'test@example.com');
      
      expect(result).toBe('https://example.com/pdf/article.pdf');
    });
    
    it('should return null when no OA version is available', async () => {
      const mockData = {
        doi: '10.1234/example.12345',
        is_oa: false,
        oa_locations: []
      };
      
      fetch.mockImplementationOnce(() => mockFetchResponse(mockData));
      
      const result = await findOpenAccessUrl('10.1234/example.12345', 'test@example.com');
      
      expect(result).toBeNull();
    });
    
    it('should handle errors gracefully', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      
      const result = await findOpenAccessUrl('10.1234/example.12345', 'test@example.com');
      
      expect(result).toBeNull();
    });
  });
});