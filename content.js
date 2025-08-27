// Paywall detection keywords and patterns
const PAYWALL_INDICATORS = [
    'subscribe', 'subscription', 'paywall', 'premium', 'member', 'sign up',
    'free trial', 'unlimited access', 'digital subscription', 'continue reading',
    'create account', 'register now', 'unlock', 'exclusive content'
];

// Sites that commonly have paywalls
const PAYWALL_SITES = [
    'wsj.com', 'nytimes.com', 'economist.com', 'theatlantic.com',
    'ft.com', 'washingtonpost.com', 'nature.com', 'science.org'
];

let cleverButton = null;
let isChecking = false;

// Function to check if current site has paywall indicators
function detectPaywall() {
    const currentDomain = window.location.hostname.replace('www.', '');
    
    // Check if it's a known paywall site
    if (!PAYWALL_SITES.includes(currentDomain)) {
        return false;
    }
    
    // Look for paywall-related text in the page
    const bodyText = document.body.innerText.toLowerCase();
    const hasPaywallText = PAYWALL_INDICATORS.some(keyword => 
        bodyText.includes(keyword.toLowerCase())
    );
    
    // Look for common paywall UI elements
    const paywallSelectors = [
        '[class*="paywall"]',
        '[class*="subscription"]',
        '[class*="premium"]',
        '[id*="paywall"]',
        '[data-testid*="paywall"]',
        '.meter-count',
        '.article-count'
    ];
    
    const hasPaywallElements = paywallSelectors.some(selector => 
        document.querySelector(selector) !== null
    );
    
    return hasPaywallText || hasPaywallElements;
}

// Function to create and show the Clever access button
function showCleverButton(accessInfo, school) {
    // Remove existing button if present
    if (cleverButton) {
        cleverButton.remove();
    }
    
    // Create button container
    cleverButton = document.createElement('div');
    cleverButton.id = 'clever-access-button';
    cleverButton.innerHTML = `
        <div class="clever-popup">
            <div class="clever-header">
                <div class="clever-logo">clever</div>
                <button class="clever-close" onclick="this.closest('#clever-access-button').remove()">×</button>
            </div>
            <div class="clever-content">
                <p><strong>${school.displayName}</strong> students have free access to <strong>${accessInfo.displayName}</strong></p>
                <button class="clever-access-btn" onclick="window.open('${accessInfo.proxyUrl}', '_blank')">
                    Access via ${school.displayName} Library
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cleverButton);
}

// Function to check access with background script
function checkAccessWithBackground() {
    if (isChecking) return;
    isChecking = true;
    
    chrome.runtime.sendMessage({
        action: 'checkAccess',
        url: window.location.href
    }, function(response) {
        isChecking = false;
        
        if (response && response.hasAccess && response.accessInfo) {
            showCleverButton(response.accessInfo, response.school);
        }
    });
}

// Function to initialize clever functionality
function initClever() {
    // Only run on sites that might have paywalls
    const currentDomain = window.location.hostname.replace('www.', '');
    if (!PAYWALL_SITES.includes(currentDomain)) {
        return;
    }
    
    // Check for paywalls and show button if access is available
    if (detectPaywall()) {
        checkAccessWithBackground();
    }
    
    // Also check periodically in case paywall appears dynamically
    setInterval(() => {
        if (detectPaywall() && !cleverButton) {
            checkAccessWithBackground();
        }
    }, 3000);
}

// Wait for page to load then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClever);
} else {
    initClever();
}

// Re-check when page content changes (for SPAs)
const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldCheck = true;
        }
    });
    
    if (shouldCheck && detectPaywall() && !cleverButton) {
        setTimeout(checkAccessWithBackground, 1000);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});