// University library access data
const UNIVERSITY_DATA = [
    // Boston University
    { university: 'Boston University', domain: 'wsj.com', proxyUrl: 'https://ezproxy.bu.edu/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'Boston University', domain: 'nytimes.com', proxyUrl: 'https://ezproxy.bu.edu/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'Boston University', domain: 'economist.com', proxyUrl: 'https://ezproxy.bu.edu/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'Boston University', domain: 'theatlantic.com', proxyUrl: 'https://ezproxy.bu.edu/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    { university: 'Boston University', domain: 'ft.com', proxyUrl: 'https://ezproxy.bu.edu/login?url=https://www.ft.com/', displayName: 'Financial Times' },
    
    // NYU
    { university: 'NYU', domain: 'wsj.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'NYU', domain: 'nytimes.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'NYU', domain: 'economist.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'NYU', domain: 'theatlantic.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    { university: 'NYU', domain: 'ft.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.ft.com/', displayName: 'Financial Times' },
    { university: 'NYU', domain: 'washingtonpost.com', proxyUrl: 'https://proxy.library.nyu.edu/login?url=https://www.washingtonpost.com/', displayName: 'Washington Post' },
    
    // Stanford
    { university: 'Stanford', domain: 'wsj.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'Stanford', domain: 'nytimes.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'Stanford', domain: 'economist.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'Stanford', domain: 'theatlantic.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    { university: 'Stanford', domain: 'ft.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.ft.com/', displayName: 'Financial Times' },
    { university: 'Stanford', domain: 'washingtonpost.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.washingtonpost.com/', displayName: 'Washington Post' },
    { university: 'Stanford', domain: 'nature.com', proxyUrl: 'https://stanford.idm.oclc.org/login?url=https://www.nature.com/', displayName: 'Nature' },
    
    // UConn
    { university: 'UConn', domain: 'wsj.com', proxyUrl: 'https://search.lib.uconn.edu/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'UConn', domain: 'nytimes.com', proxyUrl: 'https://search.lib.uconn.edu/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'UConn', domain: 'economist.com', proxyUrl: 'https://search.lib.uconn.edu/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'UConn', domain: 'theatlantic.com', proxyUrl: 'https://search.lib.uconn.edu/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    
    // USC
    { university: 'USC', domain: 'wsj.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'USC', domain: 'nytimes.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'USC', domain: 'economist.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'USC', domain: 'theatlantic.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    { university: 'USC', domain: 'ft.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.ft.com/', displayName: 'Financial Times' },
    { university: 'USC', domain: 'washingtonpost.com', proxyUrl: 'https://libproxy.usc.edu/login?url=https://www.washingtonpost.com/', displayName: 'Washington Post' },
    
    // Yale
    { university: 'Yale', domain: 'wsj.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.wsj.com/', displayName: 'Wall Street Journal' },
    { university: 'Yale', domain: 'nytimes.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.nytimes.com/', displayName: 'New York Times' },
    { university: 'Yale', domain: 'economist.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.economist.com/', displayName: 'The Economist' },
    { university: 'Yale', domain: 'theatlantic.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.theatlantic.com/', displayName: 'The Atlantic' },
    { university: 'Yale', domain: 'ft.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.ft.com/', displayName: 'Financial Times' },
    { university: 'Yale', domain: 'washingtonpost.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.washingtonpost.com/', displayName: 'Washington Post' },
    { university: 'Yale', domain: 'nature.com', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.nature.com/', displayName: 'Nature' },
    { university: 'Yale', domain: 'science.org', proxyUrl: 'https://proxy.library.yale.edu/login?url=https://www.science.org/', displayName: 'Science' }
];

// Function to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return null;
    }
}

// Function to check if user has access to current site
function checkAccess(userSchool, currentDomain) {
    return UNIVERSITY_DATA.find(entry => 
        entry.university === userSchool && entry.domain === currentDomain
    );
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkAccess') {
        chrome.storage.sync.get(['selectedSchool'], function(result) {
            if (result.selectedSchool) {
                const domain = extractDomain(request.url);
                if (domain) {
                    const accessInfo = checkAccess(result.selectedSchool.name, domain);
                    sendResponse({ 
                        hasAccess: !!accessInfo, 
                        accessInfo: accessInfo,
                        school: result.selectedSchool 
                    });
                } else {
                    sendResponse({ hasAccess: false });
                }
            } else {
                sendResponse({ hasAccess: false, needsSetup: true });
            }
        });
        return true; // Required for async response
    }
});