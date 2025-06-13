/**
 * Unpaywall Service Module
 * 
 * Provides access to the Unpaywall API to find open access versions of academic articles.
 * https://unpaywall.org/products/api
 */

/**
 * Default configuration for Unpaywall API
 */
const DEFAULT_CONFIG = {
  baseUrl: 'https://api.unpaywall.org/v2/',
  email: null, // Required by Unpaywall API terms of service
  apiKey: null, // Optional, for higher rate limits
  timeout: 5000 // 5 seconds timeout
};

/**
 * Source quality rankings
 * Higher is better
 */
const SOURCE_RANKINGS = {
  'publisher': 10,
  'journal': 9,
  'repository': 8,
  'aggregator': 7,
  'preprint_repository': 6,
  'unknown': 0
};

/**
 * Format rankings by version status
 * Higher is better
 */
const VERSION_RANKINGS = {
  'publishedVersion': 10,
  'acceptedVersion': 8,
  'submittedVersion': 6,
  'unknown': 0
};

/**
 * Host domain rankings (partial list)
 * Higher is better
 */
const HOST_RANKINGS = {
  'europepmc.org': 9,
  'ncbi.nlm.nih.gov': 9,
  'arxiv.org': 8,
  'researchgate.net': 6,
  'academia.edu': 5,
  'zenodo.org': 8,
  'figshare.com': 7,
  'osf.io': 7,
  'biorxiv.org': 8,
  'medrxiv.org': 8,
  'ssrn.com': 6
};

/**
 * Create a new Unpaywall service instance
 * @param {Object} config Configuration options
 * @returns {Object} Unpaywall service methods
 */
function createUnpaywallService(config = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!mergedConfig.email) {
    console.warn('Unpaywall API requires an email address. Please set one in the configuration.');
  }
  
  /**
   * Format the URL for the Unpaywall API
   * @param {string} doi DOI to query
   * @returns {string} Formatted URL
   */
  function formatUrl(doi) {
    if (!doi) return null;
    
    // Ensure DOI is properly formatted
    const formattedDoi = doi.replace(/^(doi:|https?:\/\/doi\.org\/)/, '');
    let url = `${mergedConfig.baseUrl}${encodeURIComponent(formattedDoi)}?`;
    
    // Add required email parameter
    if (mergedConfig.email) {
      url += `email=${encodeURIComponent(mergedConfig.email)}`;
    }
    
    // Add optional API key if available
    if (mergedConfig.apiKey) {
      url += `&api_key=${encodeURIComponent(mergedConfig.apiKey)}`;
    }
    
    return url;
  }
  
  /**
   * Calculate a quality score for an OA location
   * @param {Object} location Location object from Unpaywall
   * @returns {number} Quality score (higher is better)
   */
  function calculateLocationScore(location) {
    if (!location) return 0;
    
    let score = 0;
    
    // Source type score
    const sourceType = location.host_type || 'unknown';
    score += SOURCE_RANKINGS[sourceType] || 0;
    
    // Version score
    const version = location.version || 'unknown';
    score += VERSION_RANKINGS[version] || 0;
    
    // Host domain score
    const hostDomain = location.url ? new URL(location.url).hostname : '';
    for (const [domain, ranking] of Object.entries(HOST_RANKINGS)) {
      if (hostDomain.includes(domain)) {
        score += ranking;
        break;
      }
    }
    
    // PDF availability bonus
    if (location.url_for_pdf) {
      score += 5;
    }
    
    // URL for landing page bonus
    if (location.url_for_landing_page) {
      score += 2;
    }
    
    // License score
    if (location.license) {
      // Open licenses get higher scores
      if (['cc-by', 'cc0', 'pd'].some(l => location.license.toLowerCase().includes(l))) {
        score += 4;
      } else if (location.license.toLowerCase().includes('cc')) {
        score += 2;
      } else {
        score += 1;
      }
    }
    
    return score;
  }
  
  /**
   * Get the best OA URL from Unpaywall data
   * @param {Object} data Unpaywall API response data
   * @returns {Object|null} Best OA location with URL and metadata, or null if none found
   */
  function getBestOaLocation(data) {
    if (!data || !data.oa_locations || data.oa_locations.length === 0) {
      return null;
    }
    
    // Calculate scores for all locations
    const scoredLocations = data.oa_locations.map(location => ({
      ...location,
      score: calculateLocationScore(location)
    }));
    
    // Sort by score (descending)
    scoredLocations.sort((a, b) => b.score - a.score);
    
    // Return the highest scored location
    const bestLocation = scoredLocations[0];
    
    // Determine the best URL to use (prefer PDF if available)
    const url = bestLocation.url_for_pdf || bestLocation.url || bestLocation.url_for_landing_page;
    
    if (!url) return null;
    
    return {
      url,
      isPdf: !!bestLocation.url_for_pdf,
      hostType: bestLocation.host_type,
      version: bestLocation.version,
      license: bestLocation.license,
      source: bestLocation.repository_institution || bestLocation.host_type,
      score: bestLocation.score
    };
  }
  
  /**
   * Query the Unpaywall API for a DOI
   * @param {string} doi DOI to query
   * @returns {Promise<Object>} Unpaywall API response
   */
  async function queryUnpaywall(doi) {
    if (!doi) {
      throw new Error('DOI is required');
    }
    
    const url = formatUrl(doi);
    if (!url) {
      throw new Error('Invalid DOI format');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Unpaywall API returned ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Unpaywall API request timed out');
      }
      throw error;
    }
  }
  
  /**
   * Find open access version of an article by DOI
   * @param {string} doi DOI to search for
   * @returns {Promise<Object|null>} Best OA location information or null if not found
   */
  async function findOpenAccessPdf(doi) {
    try {
      const data = await queryUnpaywall(doi);
      
      // Check if the article is open access according to Unpaywall
      if (!data.is_oa) {
        return null;
      }
      
      return getBestOaLocation(data);
    } catch (error) {
      console.error('Error querying Unpaywall API:', error);
      return null;
    }
  }
  
  /**
   * Get full article metadata from Unpaywall
   * @param {string} doi DOI to query
   * @returns {Promise<Object|null>} Article metadata or null if not found
   */
  async function getArticleMetadata(doi) {
    try {
      return await queryUnpaywall(doi);
    } catch (error) {
      console.error('Error querying Unpaywall API for metadata:', error);
      return null;
    }
  }
  
  /**
   * Check if an article is available via open access
   * @param {string} doi DOI to check
   * @returns {Promise<boolean>} Whether the article is available via OA
   */
  async function isOpenAccess(doi) {
    try {
      const data = await queryUnpaywall(doi);
      return !!data.is_oa;
    } catch (error) {
      console.error('Error checking OA status:', error);
      return false;
    }
  }
  
  /**
   * Update the service configuration
   * @param {Object} newConfig New configuration options
   */
  function updateConfig(newConfig) {
    Object.assign(mergedConfig, newConfig);
  }
  
  // Return the public API
  return {
    findOpenAccessPdf,
    getArticleMetadata,
    isOpenAccess,
    updateConfig
  };
}

/**
 * Simple function to find an open access PDF for a DOI
 * @param {string} doi DOI to search for
 * @param {string} email Email address for API usage
 * @returns {Promise<string|null>} URL to open access version or null if not found
 */
async function findOpenAccessUrl(doi, email) {
  const service = createUnpaywallService({ email });
  const result = await service.findOpenAccessPdf(doi);
  return result ? result.url : null;
}

export {
  createUnpaywallService,
  findOpenAccessUrl
};