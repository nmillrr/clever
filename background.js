// CSV parsing functionality
let universityDatabases = [];

// Function to parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        // Only include rows with valid real_url
        if (row.real_url && row.real_url !== '') {
            data.push(row);
        }
    }
    
    return data;
}

// Function to load CSV data
async function loadCSVData() {
    try {
        const response = await fetch(chrome.runtime.getURL('master_databases.csv'));
        const csvText = await response.text();
        universityDatabases = parseCSV(csvText);
        console.log('Loaded university databases:', universityDatabases.length, 'entries');
    } catch (error) {
        console.error('Error loading CSV data:', error);
        universityDatabases = [];
    }
}

// Function to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return null;
    }
}

// Map frontend school names to CSV university codes
function getUniversityCode(schoolName) {
    const schoolMapping = {
        'Northeastern University': 'NEU',
        'UConn': 'UConn',
        'Boston University': 'BU',
        'NYU': 'NYU', 
        'UMass': 'UMass',
        'USC': 'USC'
    };
    return schoolMapping[schoolName] || schoolName;
}

// Function to check if user has access to current site
function checkAccess(userSchool, currentDomain) {
    const universityCode = getUniversityCode(userSchool);
    // Find matching database entry using 'university' column for multi-school support
    return universityDatabases.find(entry => {
        if (entry.university !== universityCode) return false;
        
        // Extract domain from real_url
        const entryDomain = extractDomain(entry.real_url);
        if (!entryDomain) return false;
        
        // Check for exact domain match or subdomain match
        return currentDomain === entryDomain || 
               currentDomain.endsWith('.' + entryDomain) ||
               entryDomain.endsWith('.' + currentDomain);
    });
}

// Function to get all domains for a user's school
function getSchoolDomains(userSchool) {
    const universityCode = getUniversityCode(userSchool);
    return universityDatabases
        .filter(entry => entry.university === universityCode)
        .map(entry => extractDomain(entry.real_url))
        .filter(domain => domain !== null)
        .filter((domain, index, self) => self.indexOf(domain) === index); // Remove duplicates
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
    
    if (request.action === 'getSchoolDomains') {
        chrome.storage.sync.get(['selectedSchool'], function(result) {
            if (result.selectedSchool) {
                const domains = getSchoolDomains(result.selectedSchool.name);
                sendResponse({ domains: domains });
            } else {
                sendResponse({ domains: [] });
            }
        });
        return true;
    }
});

// Load CSV data when extension starts
chrome.runtime.onStartup.addListener(loadCSVData);
chrome.runtime.onInstalled.addListener(loadCSVData);

// Load data immediately if extension is already running
loadCSVData();