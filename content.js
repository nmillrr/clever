let cleverPopupIcon = null;
let isChecking = false;
let schoolDomains = [];

// Helper function to extract domain name from URL
function extractDomainFromUrl(url) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain.charAt(0).toUpperCase() + domain.slice(1).replace('.com', '');
    } catch (e) {
        return 'this resource';
    }
}

// Function to get school domains from background
function loadSchoolDomains() {
    chrome.runtime.sendMessage({
        action: 'getSchoolDomains'
    }, function(response) {
        if (response && response.domains) {
            schoolDomains = response.domains;
            console.log('Loaded school domains:', schoolDomains);
        }
    });
}

// Function to check if current domain is in school's database
function isSchoolDomain() {
    const currentDomain = window.location.hostname.replace('www.', '');
    return schoolDomains.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
}

// Function to create and show the Clever popup icon
function showCleverIcon(accessInfo, school) {
    // Remove existing icon if present
    if (cleverPopupIcon) {
        cleverPopupIcon.remove();
    }
    
    // Create popup icon
    cleverPopupIcon = document.createElement('div');
    cleverPopupIcon.id = 'clever-popup-icon';
    cleverPopupIcon.innerHTML = `
        <div class="clever-icon-container">
            <img src="${chrome.runtime.getURL('assets/clever-popup-icon.png')}" alt="Clever" class="clever-icon">
            <button class="clever-close-btn" onclick="this.closest('#clever-popup-icon').remove()">×</button>
        </div>
        <div class="clever-tooltip">
            <div class="clever-tooltip-content">
                <div class="clever-tooltip-header">
                    <strong>clever</strong>
                </div>
                <div class="clever-tooltip-text">
                    <strong>${school.displayName}</strong> students have free access to <strong>${accessInfo.database_name || extractDomainFromUrl(accessInfo.real_url)}</strong>
                </div>
                <button class="clever-access-btn" onclick="window.open('${accessInfo.guide_url}', '_blank')">
                    Access via ${school.displayName} Library →
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cleverPopupIcon);
    
    // Add click handler for the icon (not the close button)
    cleverPopupIcon.querySelector('.clever-icon-container .clever-icon').addEventListener('click', function() {
        window.open(accessInfo.guide_url, '_blank');
    });
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
            showCleverIcon(response.accessInfo, response.school);
        }
    });
}

// Function to initialize clever functionality
function initClever() {
    // Load school domains first
    loadSchoolDomains();
    
    // Small delay to ensure domains are loaded
    setTimeout(() => {
        // Only run on sites that are in the school's database
        if (isSchoolDomain()) {
            checkAccessWithBackground();
        }
    }, 500);
}

// Function to clean up when navigating away
function cleanup() {
    if (cleverPopupIcon) {
        cleverPopupIcon.remove();
        cleverPopupIcon = null;
    }
}

// Wait for page to load then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClever);
} else {
    initClever();
}

// Handle navigation changes (for SPAs)
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
    if (currentUrl !== window.location.href) {
        cleanup();
        currentUrl = window.location.href;
        setTimeout(initClever, 1000);
    }
});

urlObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Clean up when page unloads
window.addEventListener('beforeunload', cleanup);