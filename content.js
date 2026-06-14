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
    
    const resourceName = accessInfo.database_name || extractDomainFromUrl(accessInfo.real_url);

    // Build the popup with DOM APIs (not innerHTML) so untrusted CSV values
    // are inserted as text and can never inject markup or break out of handlers.
    cleverPopupIcon = document.createElement('div');
    cleverPopupIcon.id = 'clever-popup-icon';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'clever-icon-container';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/clever-popup-icon.png');
    icon.alt = 'Clever';
    icon.className = 'clever-icon';
    icon.addEventListener('click', () => window.open(accessInfo.guide_url, '_blank'));

    const closeBtn = document.createElement('button');
    closeBtn.className = 'clever-close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', cleanup);

    iconContainer.append(icon, closeBtn);

    const tooltip = document.createElement('div');
    tooltip.className = 'clever-tooltip';

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'clever-tooltip-content';

    const header = document.createElement('div');
    header.className = 'clever-tooltip-header';
    const headerStrong = document.createElement('strong');
    headerStrong.textContent = 'clever';
    header.appendChild(headerStrong);

    const text = document.createElement('div');
    text.className = 'clever-tooltip-text';
    const schoolStrong = document.createElement('strong');
    schoolStrong.textContent = school.displayName;
    const resourceStrong = document.createElement('strong');
    resourceStrong.textContent = resourceName;
    text.append(schoolStrong, ' students have free access to ', resourceStrong);

    const accessBtn = document.createElement('button');
    accessBtn.className = 'clever-access-btn';
    accessBtn.textContent = `Access via ${school.displayName} Library →`;
    accessBtn.addEventListener('click', () => window.open(accessInfo.guide_url, '_blank'));

    tooltipContent.append(header, text, accessBtn);
    tooltip.appendChild(tooltipContent);
    cleverPopupIcon.append(iconContainer, tooltip);

    document.body.appendChild(cleverPopupIcon);
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