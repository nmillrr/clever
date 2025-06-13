/**
 * Paywall Detector Module
 * 
 * Detects paywalls on academic and media publisher websites using pattern matching
 * and content analysis.
 */

/**
 * Publisher definitions with detection patterns
 */
const PUBLISHERS = {
  // Academic Publishers
  'jstor': {
    domains: ['jstor.org'],
    articlePatterns: [
      /^https?:\/\/www\.jstor\.org\/stable\/(\d+)/i,
      /^https?:\/\/www\.jstor\.org\/stable\/pdf\/(\d+)\.pdf/i
    ],
    paywallSelectors: [
      '.purchase-access',
      '.access-options',
      '.accessProblem',
      '.pdfNotAvailable'
    ],
    paywallPhrases: [
      'Access to this content requires a subscription',
      'You do not currently have access to this content',
      'Your access is provided by',
      'Access provided by'
    ],
    metadataExtractors: {
      doi: /data-doi="([^"]+)"/i,
      title: /<h1[^>]*>([^<]+)<\/h1>/i,
      authors: /<div class="contrib"[^>]*>([^<]+)<\/div>/ig
    }
  },
  'elsevier': {
    domains: ['sciencedirect.com', 'elsevier.com'],
    articlePatterns: [
      /^https?:\/\/www\.sciencedirect\.com\/science\/article\/(?:pii|abs)\/([A-Z0-9]+)/i,
      /^https?:\/\/www\.sciencedirect\.com\/science\/article\/am\/pii\/([A-Z0-9]+)/i
    ],
    paywallSelectors: [
      '.accessContent',
      '#paywall',
      '.accessOptions',
      '.article-purchase'
    ],
    paywallPhrases: [
      'Purchase PDF',
      'Get Access',
      'Subscribe to access',
      'Purchase access to this article'
    ],
    metadataExtractors: {
      doi: /data-doi="([^"]+)"/i,
      title: /<span class="title-text">([^<]+)<\/span>/i,
      journal: /<a[^>]+class="publication-title-link"[^>]*>([^<]+)<\/a>/i
    }
  },
  'springer': {
    domains: ['springer.com', 'springerlink.com'],
    articlePatterns: [
      /^https?:\/\/link\.springer\.com\/article\/([^\/]+\/[^\/]+)/i,
      /^https?:\/\/link\.springer\.com\/chapter\/([^\/]+\/[^\/]+)/i
    ],
    paywallSelectors: [
      '.c-article-access-provider',
      '.c-article__access-options',
      '.c-download-button--disabled'
    ],
    paywallPhrases: [
      'Buy article',
      'Access options',
      'Get Access',
      'Access via your institution'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*data-test="article-title"[^>]*>([^<]+)<\/h1>/i,
      authors: /<meta name="citation_author" content="([^"]+)">/ig
    }
  },
  'wiley': {
    domains: ['wiley.com', 'onlinelibrary.wiley.com'],
    articlePatterns: [
      /^https?:\/\/onlinelibrary\.wiley\.com\/doi\/([^\/]+\/[^\/]+)/i,
      /^https?:\/\/onlinelibrary\.wiley\.com\/doi\/abs\/([^\/]+\/[^\/]+)/i
    ],
    paywallSelectors: [
      '.paywall-wrapper',
      '.access-options-overlay',
      '.accessDeniedMessage'
    ],
    paywallPhrases: [
      'You currently have no access to this article',
      'Purchase Options',
      'Request access through your institution',
      'Institutional Login'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*class="citation__title"[^>]*>([^<]+)<\/h1>/i
    }
  },
  'taylor_francis': {
    domains: ['tandfonline.com', 'taylorandfrancis.com'],
    articlePatterns: [
      /^https?:\/\/www\.tandfonline\.com\/doi\/([^\/]+\/[^\/]+)/i,
      /^https?:\/\/www\.tandfonline\.com\/doi\/abs\/([^\/]+\/[^\/]+)/i
    ],
    paywallSelectors: [
      '.accessDeniedMessage',
      '.accessOptionsWrapper',
      '.publication-tabs-price'
    ],
    paywallPhrases: [
      'Add to cart',
      'You do not have access to this content',
      'Access via your institution',
      'Your access options'
    ],
    metadataExtractors: {
      doi: /<meta name="dc.Identifier" content="(https?:\/\/doi.org\/[^"]+)">/i,
      title: /<h1[^>]*class="NLM_article-title"[^>]*>([^<]+)<\/h1>/i
    }
  },
  'oxford': {
    domains: ['oxfordjournals.org', 'academic.oup.com'],
    articlePatterns: [
      /^https?:\/\/academic\.oup\.com\/([^\/]+)\/article\/([^\/]+)\/([^\/]+)/i,
      /^https?:\/\/academic\.oup\.com\/([^\/]+)\/article-abstract\/([^\/]+)\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.oup-paywall',
      '.subscription-panel',
      '.purchaseAccessPanel'
    ],
    paywallPhrases: [
      'Sign in to access this article',
      'Purchase a subscription',
      'You do not currently have access to this article',
      'Access through your institution'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*data-widgetname="OUP\.TitlebarWidget"[^>]*>([^<]+)<\/h1>/i
    }
  },
  'sage': {
    domains: ['sagepub.com'],
    articlePatterns: [
      /^https?:\/\/journals\.sagepub\.com\/doi\/([^\/]+\/[^\/]+)/i,
      /^https?:\/\/journals\.sagepub\.com\/doi\/abs\/([^\/]+\/[^\/]+)/i
    ],
    paywallSelectors: [
      '.accessDeniedMessage',
      '.purchaseContent',
      '.section-access'
    ],
    paywallPhrases: [
      'Sign in or purchase',
      'You do not currently have access to this article',
      'Access through your institution',
      'Request access'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*class="publicationContentTitle"[^>]*>([^<]+)<\/h1>/i
    }
  },
  'ieee': {
    domains: ['ieeexplore.ieee.org'],
    articlePatterns: [
      /^https?:\/\/ieeexplore\.ieee\.org\/document\/(\d+)/i,
      /^https?:\/\/ieeexplore\.ieee\.org\/abstract\/document\/(\d+)/i
    ],
    paywallSelectors: [
      '.icon-access-subscribed',
      '.paywall-panel',
      '.purchase-btn-container'
    ],
    paywallPhrases: [
      'Subscribers and purchase options',
      'Subscribe to unlock access',
      'Purchase via Publisher',
      'Purchase this article'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<meta name="citation_title" content="([^"]+)">/i
    }
  },
  'acm': {
    domains: ['dl.acm.org', 'acm.org'],
    articlePatterns: [
      /^https?:\/\/dl\.acm\.org\/doi\/([^\/]+\/[^\/]+)/i,
      /^https?:\/\/dl\.acm\.org\/doi\/abs\/([^\/]+\/[^\/]+)/i
    ],
    paywallSelectors: [
      '.paywall-section',
      '.purchaseAccessPanel',
      '[data-test="purchase-block"]'
    ],
    paywallPhrases: [
      'Purchase options',
      'Get Access',
      'You do not currently have access to this article',
      'Sign in or purchase'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*class="citation__title"[^>]*>([^<]+)<\/h1>/i
    }
  },

  // News & Media Publications
  'economist': {
    domains: ['economist.com'],
    articlePatterns: [
      /^https?:\/\/www\.economist\.com\/([^\/]+)\/([^\/]+)\/(\d+)\/([^\/]+)/i,
      /^https?:\/\/www\.economist\.com\/([^\/]+)\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.paywall',
      '.subscription-proposition',
      '.paywall-wrapper'
    ],
    paywallPhrases: [
      'Subscribe to unlock this article',
      'You\'ve reached your article limit',
      'Register now to continue reading',
      'Subscribe and get unlimited access'
    ],
    metadataExtractors: {
      title: /<h1[^>]*>([^<]+)<\/h1>/i,
      date: /<time[^>]*datetime="([^"]+)"[^>]*>/i
    }
  },
  'wall_street_journal': {
    domains: ['wsj.com'],
    articlePatterns: [
      /^https?:\/\/www\.wsj\.com\/articles\/([^\/]+)/i,
      /^https?:\/\/www\.wsj\.com\/news\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.wsj-snippet-login',
      '.snippet-promotion',
      '.paywall',
      '.sign-in-container'
    ],
    paywallPhrases: [
      'Subscribe to continue reading',
      'Sign in to continue reading',
      'To continue reading, subscribe or sign in',
      'Subscriber-only article'
    ],
    metadataExtractors: {
      title: /<h1[^>]*class="article-headline"[^>]*>([^<]+)<\/h1>/i,
      date: /<time[^>]*datetime="([^"]+)"[^>]*>/i
    }
  },
  'new_york_times': {
    domains: ['nytimes.com'],
    articlePatterns: [
      /^https?:\/\/www\.nytimes\.com\/(\d+)\/(\d+)\/(\d+)\/([^\/]+)\/([^\/]+)\.html/i,
      /^https?:\/\/www\.nytimes\.com\/(\d+)\/(\d+)\/(\d+)\/([^\/]+)\.html/i
    ],
    paywallSelectors: [
      '.css-mcm29f',  // This may change frequently
      '#gateway-content',
      '.pz-meter-fadeout'
    ],
    paywallPhrases: [
      'You\'ve reached your free article limit',
      'Subscribe for unlimited access',
      'Create your free account or log in to continue reading',
      'Subscribe now for unlimited access'
    ],
    metadataExtractors: {
      title: /<h1[^>]*class="css-[^"]+"[^>]*>([^<]+)<\/h1>/i,
      date: /<meta property="article:published_time" content="([^"]+)">/i
    }
  },
  'financial_times': {
    domains: ['ft.com'],
    articlePatterns: [
      /^https?:\/\/www\.ft\.com\/content\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.o-barrier',
      '.n-paywall',
      '.subscription-panel'
    ],
    paywallPhrases: [
      'Subscribe to the FT to read',
      'You have reached your article limit',
      'Subscribe to continue reading',
      'Start your trial to continue reading'
    ],
    metadataExtractors: {
      title: /<h1[^>]*class="o-headline[^"]*"[^>]*>([^<]+)<\/h1>/i,
      date: /<time[^>]*data-o-component="o-date"[^>]*datetime="([^"]+)"[^>]*>/i
    }
  },
  'harvard_business_review': {
    domains: ['hbr.org'],
    articlePatterns: [
      /^https?:\/\/hbr\.org\/(\d+)\/(\d+)\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.hbr-paywall',
      '.non-subscriber-message',
      '.subscription-callout'
    ],
    paywallPhrases: [
      'Register as a Premium Subscriber',
      'You\'ve reached your monthly limit',
      'Subscribe to continue reading',
      'Register now for unlimited access'
    ],
    metadataExtractors: {
      title: /<h1[^>]*class="article-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      date: /<meta property="article:published_time" content="([^"]+)">/i
    }
  },
  'washington_post': {
    domains: ['washingtonpost.com'],
    articlePatterns: [
      /^https?:\/\/www\.washingtonpost\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)\/(\d+)\/(\d+)\/([^\/]+)_story\.html/i
    ],
    paywallSelectors: [
      '.paywall-overlay',
      '.regwall-overlay',
      '.metering-modal'
    ],
    paywallPhrases: [
      'Subscribe today',
      'You have reached your free article limit',
      'Continue reading for just',
      'Sign in to continue reading'
    ],
    metadataExtractors: {
      title: /<h1[^>]*data-qa="headline"[^>]*>([^<]+)<\/h1>/i,
      date: /<meta property="article:published_time" content="([^"]+)">/i
    }
  },
  'nature': {
    domains: ['nature.com'],
    articlePatterns: [
      /^https?:\/\/www\.nature\.com\/articles\/([^\/]+)/i
    ],
    paywallSelectors: [
      '.c-article-access-provider',
      '.c-article-access-options'
    ],
    paywallPhrases: [
      'Subscribe to access this article',
      'Purchase or subscribe to access the full text',
      'Access through your institution',
      'Subscribe to Nature'
    ],
    metadataExtractors: {
      doi: /<meta name="citation_doi" content="([^"]+)">/i,
      title: /<h1[^>]*data-test="article-title"[^>]*>([^<]+)<\/h1>/i,
      authors: /<meta name="citation_author" content="([^"]+)">/ig
    }
  }
};

/**
 * Detects if the current page is a paywalled academic or media article
 * @param {Object} options Configuration options
 * @param {string} options.url Current URL to check
 * @param {string} options.html HTML content of the page
 * @param {Document} [options.document] Document object (if running in browser context)
 * @returns {Object} Detection result with publisher info and metadata
 */
function detectPaywall({ url, html, document }) {
  const result = {
    isPaywalled: false,
    publisher: null,
    articleInfo: {},
    confidence: 0,
    metadata: {}
  };

  if (!url) {
    return result;
  }

  // Determine which publisher this URL belongs to
  const hostname = extractHostname(url);
  let matchedPublisher = null;
  let publisherKey = null;

  // Find matching publisher by domain
  for (const [key, publisher] of Object.entries(PUBLISHERS)) {
    if (publisher.domains.some(domain => hostname.includes(domain))) {
      matchedPublisher = publisher;
      publisherKey = key;
      break;
    }
  }

  if (!matchedPublisher) {
    return result; // No matching publisher found
  }

  result.publisher = {
    key: publisherKey,
    name: publisherKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };

  // Check if URL matches article patterns
  const isArticleUrl = matchedPublisher.articlePatterns.some(pattern => pattern.test(url));
  if (!isArticleUrl) {
    return result; // Not an article URL
  }

  result.articleInfo.isArticleUrl = true;
  result.confidence += 0.3; // 30% confidence that it's an article based on URL

  // If we have HTML content or document, analyze it
  if (html || document) {
    // Extract metadata
    const metadata = extractMetadata(matchedPublisher, html, document);
    if (Object.keys(metadata).length > 0) {
      result.metadata = metadata;
      result.confidence += 0.2; // 20% more confidence with metadata
    }
    
    // Check for paywall selectors in the document
    if (document) {
      const hasPaywallElements = checkForPaywallElements(matchedPublisher, document);
      if (hasPaywallElements) {
        result.isPaywalled = true;
        result.articleInfo.paywalledByElements = true;
        result.confidence += 0.3; // 30% more confidence
      }
    }
    
    // Check for paywall phrases in the HTML
    if (html) {
      const hasPaywallPhrases = checkForPaywallPhrases(matchedPublisher, html);
      if (hasPaywallPhrases) {
        result.isPaywalled = true;
        result.articleInfo.paywalledByPhrases = true;
        result.confidence += 0.2; // 20% more confidence
      }
    }
  }

  return result;
}

/**
 * Extracts hostname from URL
 * @param {string} url URL to process
 * @returns {string} Hostname
 */
function extractHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    // If URL parsing fails, try a simple regex approach
    const match = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Checks if document contains any of the paywall selector elements
 * @param {Object} publisher Publisher configuration
 * @param {Document} document Document to check
 * @returns {boolean} True if paywall elements found
 */
function checkForPaywallElements(publisher, document) {
  if (!publisher.paywallSelectors || !document) {
    return false;
  }

  return publisher.paywallSelectors.some(selector => {
    try {
      return document.querySelector(selector) !== null;
    } catch (e) {
      return false; // Invalid selector
    }
  });
}

/**
 * Checks if HTML contains any of the paywall phrases
 * @param {Object} publisher Publisher configuration
 * @param {string} html HTML content to check
 * @returns {boolean} True if paywall phrases found
 */
function checkForPaywallPhrases(publisher, html) {
  if (!publisher.paywallPhrases || !html) {
    return false;
  }

  return publisher.paywallPhrases.some(phrase => html.includes(phrase));
}

/**
 * Extracts metadata from HTML or document using publisher's extractors
 * @param {Object} publisher Publisher configuration
 * @param {string} html HTML content
 * @param {Document} document Document object
 * @returns {Object} Extracted metadata
 */
function extractMetadata(publisher, html, document) {
  const metadata = {};
  
  if (!publisher.metadataExtractors) {
    return metadata;
  }

  const content = html || (document ? document.documentElement.outerHTML : '');
  if (!content) {
    return metadata;
  }

  // Extract each metadata field using the defined regex patterns
  for (const [field, extractor] of Object.entries(publisher.metadataExtractors)) {
    if (field === 'authors') {
      // Special handling for authors that may have multiple matches
      const authors = [];
      let match;
      while ((match = extractor.exec(content)) !== null) {
        if (match[1]) {
          authors.push(match[1].trim());
        }
      }
      if (authors.length > 0) {
        metadata.authors = authors;
      }
    } else {
      const match = content.match(extractor);
      if (match && match[1]) {
        metadata[field] = match[1].trim();
      }
    }
  }

  return metadata;
}

/**
 * Gets information about all supported publishers
 * @returns {Array} Array of publisher information
 */
function getSupportedPublishers() {
  return Object.entries(PUBLISHERS).map(([key, publisher]) => ({
    key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    domains: publisher.domains,
    type: key.includes('journal') || 
          ['jstor', 'elsevier', 'springer', 'wiley', 'taylor_francis', 'oxford', 'sage', 'ieee', 'acm', 'nature'].includes(key) 
          ? 'academic' : 'media'
  }));
}

/**
 * Checks if a URL is likely an article URL for any supported publisher
 * @param {string} url URL to check
 * @returns {boolean} True if URL matches article patterns
 */
function isLikelyArticleUrl(url) {
  if (!url) return false;
  
  const hostname = extractHostname(url);
  
  for (const publisher of Object.values(PUBLISHERS)) {
    if (publisher.domains.some(domain => hostname.includes(domain))) {
      if (publisher.articlePatterns.some(pattern => pattern.test(url))) {
        return true;
      }
    }
  }
  
  return false;
}

export {
  detectPaywall,
  getSupportedPublishers,
  isLikelyArticleUrl,
  PUBLISHERS
};