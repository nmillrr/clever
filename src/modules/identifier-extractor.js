/**
 * Identifier Extractor Module
 * 
 * Extracts identifiers like DOI, PMID, arXiv ID, or canonical URLs from academic article pages.
 * These identifiers are essential for checking institutional access and finding open access alternatives.
 */

/**
 * Priority-ordered strategies for extracting DOIs
 */
const DOI_EXTRACTION_STRATEGIES = [
  // Metadata tags
  {
    name: 'citation_doi',
    extract: doc => getMetaContent(doc, 'citation_doi')
  },
  {
    name: 'dc_identifier',
    extract: doc => {
      const dcId = getMetaContent(doc, 'dc.identifier');
      if (dcId && dcId.toLowerCase().startsWith('doi:')) {
        return dcId.substring(4).trim();
      }
      return null;
    }
  },
  {
    name: 'prism_doi',
    extract: doc => getMetaContent(doc, 'prism.doi')
  },
  {
    name: 'og_url',
    extract: doc => {
      const ogUrl = getMetaContent(doc, 'og:url');
      if (ogUrl) {
        const doiMatch = ogUrl.match(/doi\.org\/([^\/&?\s]+\/[^\/&?\s]+)$/i);
        return doiMatch ? doiMatch[1] : null;
      }
      return null;
    }
  },
  // URL path extraction
  {
    name: 'url_doi_path',
    extract: doc => {
      const url = doc.location?.href || doc.URL || '';
      const doiPathMatches = [
        // Match doi.org URLs
        /doi\.org\/([^\/&?\s]+\/[^\/&?\s]+)$/i,
        // Match /doi/ path segment
        /\/doi\/(?:abs\/|full\/|pdf\/)?([^\/&?\s]+\/[^\/&?\s]+)(?:[/?#]|$)/i,
        // Match /doi: parameter
        /[\/?&]doi[:=]([^\/&?\s]+\/[^\/&?\s]+)(?:[/?#&]|$)/i
      ];
      
      for (const pattern of doiPathMatches) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }
  },
  // HTML content extraction
  {
    name: 'data_doi_attribute',
    extract: doc => {
      const elements = doc.querySelectorAll('[data-doi]');
      if (elements.length > 0) {
        return elements[0].getAttribute('data-doi');
      }
      return null;
    }
  },
  {
    name: 'doi_text',
    extract: doc => {
      // Common DOI display patterns in the text
      const patterns = [
        /doi:\s*([^\/&?\s]+\/[^\/&?\s]+)(?:[/?#&]|$)/i,
        /doi\.org\/([^\/&?\s]+\/[^\/&?\s]+)(?:[/?#&]|$)/i,
        /digital\s+object\s+identifier:?\s*([^\/&?\s]+\/[^\/&?\s]+)(?:[/?#&]|$)/i
      ];
      
      const text = doc.body ? doc.body.textContent : '';
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Try to find DOI in specific sections
      const doiSections = Array.from(doc.querySelectorAll('.doi, .article-doi, #doi, [id*="doi"], [class*="doi"]'));
      for (const section of doiSections) {
        const sectionText = section.textContent;
        for (const pattern of patterns) {
          const match = sectionText.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
      
      return null;
    }
  }
];

/**
 * Strategies for extracting PubMed IDs (PMID)
 */
const PMID_EXTRACTION_STRATEGIES = [
  {
    name: 'citation_pmid',
    extract: doc => getMetaContent(doc, 'citation_pmid')
  },
  {
    name: 'url_pmid',
    extract: doc => {
      const url = doc.location?.href || doc.URL || '';
      const pmidMatches = [
        /ncbi\.nlm\.nih\.gov\/pubmed\/(\d+)/i,
        /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i,
        /pmid[:=](\d+)/i,
        /[/?&]pmid=(\d+)/i
      ];
      
      for (const pattern of pmidMatches) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }
  },
  {
    name: 'pmid_text',
    extract: doc => {
      const patterns = [
        /pmid:?\s*(\d+)/i,
        /pubmed\s+id:?\s*(\d+)/i
      ];
      
      const text = doc.body ? doc.body.textContent : '';
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return null;
    }
  }
];

/**
 * Strategies for extracting arXiv IDs
 */
const ARXIV_EXTRACTION_STRATEGIES = [
  {
    name: 'citation_arxiv_id',
    extract: doc => getMetaContent(doc, 'citation_arxiv_id')
  },
  {
    name: 'url_arxiv_id',
    extract: doc => {
      const url = doc.location?.href || doc.URL || '';
      const arxivMatches = [
        /arxiv\.org\/abs\/([^\/&?\s]+)(?:[/?#&]|$)/i,
        /arxiv\.org\/pdf\/([^\/&?\s]+)(?:\.[a-z]+)?(?:[/?#&]|$)/i,
        /[/?&]arxiv=([^\/&?\s]+)(?:[/?#&]|$)/i
      ];
      
      for (const pattern of arxivMatches) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }
  },
  {
    name: 'arxiv_text',
    extract: doc => {
      const patterns = [
        /arxiv:?\s*([^\/&?\s]+)(?:[/?#&]|$)/i,
        /arxiv\.org\/abs\/([^\/&?\s]+)(?:[/?#&]|$)/i
      ];
      
      const text = doc.body ? doc.body.textContent : '';
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return null;
    }
  }
];

/**
 * Strategies for extracting canonical URLs
 */
const CANONICAL_URL_STRATEGIES = [
  {
    name: 'link_canonical',
    extract: doc => {
      const canonicalLink = doc.querySelector('link[rel="canonical"]');
      return canonicalLink ? canonicalLink.getAttribute('href') : null;
    }
  },
  {
    name: 'og_url',
    extract: doc => getMetaContent(doc, 'og:url')
  },
  {
    name: 'twitter_url',
    extract: doc => getMetaContent(doc, 'twitter:url')
  },
  {
    name: 'citation_fulltext_html_url',
    extract: doc => getMetaContent(doc, 'citation_fulltext_html_url')
  },
  {
    name: 'current_url',
    extract: doc => {
      // Clean the current URL to remove query parameters, fragments, etc.
      const url = doc.location?.href || doc.URL || '';
      try {
        const urlObj = new URL(url);
        // For some sites, we want to keep certain query parameters
        // that are essential for the article identity
        const essentialParams = ['doi', 'pmid', 'pii'];
        const cleanUrl = new URL(urlObj.origin + urlObj.pathname);
        
        for (const param of essentialParams) {
          if (urlObj.searchParams.has(param)) {
            cleanUrl.searchParams.set(param, urlObj.searchParams.get(param));
          }
        }
        
        return cleanUrl.toString();
      } catch (e) {
        return url.split('?')[0].split('#')[0];
      }
    }
  }
];

/**
 * Utility function to get content from a meta tag
 * @param {Document} doc Document object
 * @param {string} name Meta tag name or property
 * @returns {string|null} Meta tag content or null if not found
 */
function getMetaContent(doc, name) {
  const selector = `meta[name="${name}"], meta[property="${name}"]`;
  const meta = doc.querySelector(selector);
  return meta ? meta.getAttribute('content') : null;
}

/**
 * Validates if a string is a properly formatted DOI
 * @param {string} doi DOI string to validate
 * @returns {boolean} Whether the DOI is valid
 */
function isValidDOI(doi) {
  if (!doi) return false;
  
  // Basic DOI format validation
  const doiRegex = /^10\.\d{4,}(?:\.\d+)*\/[-._;()/:a-zA-Z0-9]+$/;
  return doiRegex.test(doi);
}

/**
 * Normalizes a DOI by removing common prefixes and extra spaces
 * @param {string} doi DOI string to normalize
 * @returns {string} Normalized DOI
 */
function normalizeDOI(doi) {
  if (!doi) return null;
  
  // Remove common prefixes
  let normalized = doi.trim()
    .replace(/^(?:doi:|https?:\/\/doi\.org\/)/i, '')
    .replace(/\s+/g, ' ');
  
  // Check if the normalized DOI is valid
  return isValidDOI(normalized) ? normalized : doi;
}

/**
 * Validates if a string is a properly formatted PMID
 * @param {string} pmid PMID string to validate
 * @returns {boolean} Whether the PMID is valid
 */
function isValidPMID(pmid) {
  if (!pmid) return false;
  
  // PMIDs are typically 1-8 digits
  const pmidRegex = /^\d{1,8}$/;
  return pmidRegex.test(pmid);
}

/**
 * Validates if a string is a properly formatted arXiv ID
 * @param {string} arxivId arXiv ID string to validate
 * @returns {boolean} Whether the arXiv ID is valid
 */
function isValidArXivID(arxivId) {
  if (!arxivId) return false;
  
  // Old arXiv ID format: math/0701238
  // New arXiv ID format: 1501.00001
  const oldArxivRegex = /^\d{2}[0-1]\d\.\d{4,5}(?:v\d+)?$/;
  const newArxivRegex = /^[a-z-]+(?:\.[A-Z]{2})?\/\d{2}[0-1]\d\d{3}(?:v\d+)?$/;
  
  return oldArxivRegex.test(arxivId) || newArxivRegex.test(arxivId);
}

/**
 * Extracts DOI from a document
 * @param {Document} doc Document object
 * @returns {Object} Extraction result with DOI and metadata
 */
function extractDOI(doc) {
  const result = {
    doi: null,
    strategy: null,
    normalized: null,
    isValid: false
  };
  
  for (const strategy of DOI_EXTRACTION_STRATEGIES) {
    try {
      const extracted = strategy.extract(doc);
      if (extracted) {
        result.doi = extracted;
        result.strategy = strategy.name;
        result.normalized = normalizeDOI(extracted);
        result.isValid = isValidDOI(result.normalized);
        
        // If we have a valid DOI, stop looking
        if (result.isValid) break;
      }
    } catch (e) {
      console.error(`Error in DOI extraction strategy ${strategy.name}:`, e);
    }
  }
  
  return result;
}

/**
 * Extracts PMID from a document
 * @param {Document} doc Document object
 * @returns {Object} Extraction result with PMID and metadata
 */
function extractPMID(doc) {
  const result = {
    pmid: null,
    strategy: null,
    isValid: false
  };
  
  for (const strategy of PMID_EXTRACTION_STRATEGIES) {
    try {
      const extracted = strategy.extract(doc);
      if (extracted) {
        result.pmid = extracted;
        result.strategy = strategy.name;
        result.isValid = isValidPMID(extracted);
        
        // If we have a valid PMID, stop looking
        if (result.isValid) break;
      }
    } catch (e) {
      console.error(`Error in PMID extraction strategy ${strategy.name}:`, e);
    }
  }
  
  return result;
}

/**
 * Extracts arXiv ID from a document
 * @param {Document} doc Document object
 * @returns {Object} Extraction result with arXiv ID and metadata
 */
function extractArXivID(doc) {
  const result = {
    arxivId: null,
    strategy: null,
    isValid: false
  };
  
  for (const strategy of ARXIV_EXTRACTION_STRATEGIES) {
    try {
      const extracted = strategy.extract(doc);
      if (extracted) {
        result.arxivId = extracted;
        result.strategy = strategy.name;
        result.isValid = isValidArXivID(extracted);
        
        // If we have a valid arXiv ID, stop looking
        if (result.isValid) break;
      }
    } catch (e) {
      console.error(`Error in arXiv ID extraction strategy ${strategy.name}:`, e);
    }
  }
  
  return result;
}

/**
 * Extracts canonical URL from a document
 * @param {Document} doc Document object
 * @returns {Object} Extraction result with URL and metadata
 */
function extractCanonicalURL(doc) {
  const result = {
    url: null,
    strategy: null
  };
  
  for (const strategy of CANONICAL_URL_STRATEGIES) {
    try {
      const extracted = strategy.extract(doc);
      if (extracted) {
        result.url = extracted;
        result.strategy = strategy.name;
        
        // For canonical URLs, we continue checking to find the best one
        // But we break early for link[rel="canonical"] as it's the most authoritative
        if (strategy.name === 'link_canonical') {
          break;
        }
      }
    } catch (e) {
      console.error(`Error in canonical URL extraction strategy ${strategy.name}:`, e);
    }
  }
  
  return result;
}

/**
 * Extracts all possible identifiers from a document, in order of reliability
 * @param {Document} doc Document object or HTML string
 * @returns {Object} All extracted identifiers with associated metadata
 */
function extractAllIdentifiers(doc) {
  // If doc is a string, parse it into a Document
  let document = doc;
  if (typeof doc === 'string') {
    const parser = new DOMParser();
    document = parser.parseFromString(doc, 'text/html');
  }
  
  return {
    doi: extractDOI(document),
    pmid: extractPMID(document),
    arxivId: extractArXivID(document),
    canonicalUrl: extractCanonicalURL(document)
  };
}

/**
 * Extracts the best identifier for looking up library access or open access alternatives
 * Prioritizes DOI > PMID > arXiv ID > canonical URL
 * @param {Document|string} doc Document object or HTML string
 * @returns {Object} Best identifier with type and value
 */
function extractBestIdentifier(doc) {
  const allIdentifiers = extractAllIdentifiers(doc);
  
  // Return the first valid identifier found, in priority order
  if (allIdentifiers.doi.isValid) {
    return {
      type: 'doi',
      value: allIdentifiers.doi.normalized || allIdentifiers.doi.doi,
      confidence: 'high'
    };
  }
  
  if (allIdentifiers.pmid.isValid) {
    return {
      type: 'pmid',
      value: allIdentifiers.pmid.pmid,
      confidence: 'medium'
    };
  }
  
  if (allIdentifiers.arxivId.isValid) {
    return {
      type: 'arxiv',
      value: allIdentifiers.arxivId.arxivId,
      confidence: 'medium'
    };
  }
  
  if (allIdentifiers.canonicalUrl.url) {
    return {
      type: 'url',
      value: allIdentifiers.canonicalUrl.url,
      confidence: 'low',
      strategy: allIdentifiers.canonicalUrl.strategy
    };
  }
  
  // No identifier found
  return {
    type: null,
    value: null,
    confidence: 'none'
  };
}

export {
  extractBestIdentifier,
  extractAllIdentifiers,
  extractDOI,
  extractPMID,
  extractArXivID,
  extractCanonicalURL,
  normalizeDOI,
  isValidDOI,
  isValidPMID,
  isValidArXivID
};