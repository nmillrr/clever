/**
 * Academic Access Extension - Popup Script
 * 
 * Handles the UI interactions for the extension popup interface.
 */

// University proxy data
const UNIVERSITIES = {
  michigan: {
    name: 'University of Michigan',
    proxy: 'https://proxy.lib.umich.edu/login?url=',
    type: 'prefix'
  },
  harvard: {
    name: 'Harvard University',
    proxy: '.ezp-prod1.hul.harvard.edu',
    type: 'suffix'
  },
  stanford: {
    name: 'Stanford University',
    proxy: 'https://stanford.idm.oclc.org/login?url=',
    type: 'prefix'
  },
  mit: {
    name: 'Massachusetts Institute of Technology',
    proxy: 'https://libproxy.mit.edu/login?url=',
    type: 'prefix'
  },
  berkeley: {
    name: 'UC Berkeley',
    proxy: 'https://search.ebscohost.com/login.aspx?direct=true&site=eds-live&scope=site&type=0&custid=s1226370&authtype=ip,guest&groupid=main&profile=eds&bquery=',
    type: 'prefix'
  },
  oxford: {
    name: 'University of Oxford',
    proxy: 'https://ezproxy.bodleian.ox.ac.uk/login?url=',
    type: 'prefix'
  },
  cambridge: {
    name: 'University of Cambridge',
    proxy: '.ezp.lib.cam.ac.uk',
    type: 'suffix'
  },
  yale: {
    name: 'Yale University',
    proxy: 'https://yale.idm.oclc.org/login?url=',
    type: 'prefix'
  },
  princeton: {
    name: 'Princeton University',
    proxy: 'https://princeton.idm.oclc.org/login?url=',
    type: 'prefix'
  }
};

// Storage keys
const STORAGE_KEYS = {
  INSTITUTION: 'institution',
  CUSTOM_INSTITUTIONS: 'custom_institutions'
};

// DOM Elements
const elements = {
  universitySelect: document.getElementById('university-select'),
  customForm: document.getElementById('custom-form'),
  customName: document.getElementById('custom-name'),
  customProxy: document.getElementById('custom-proxy'),
  saveButton: document.getElementById('save-button'),
  editButton: document.getElementById('edit-button'),
  resetButton: document.getElementById('reset-button'),
  universitySelectContainer: document.getElementById('university-select-container'),
  successMessage: document.getElementById('success-message'),
  savedInstitutionName: document.getElementById('saved-institution-name'),
  savedInstitutionProxy: document.getElementById('saved-institution-proxy'),
  alertBox: document.getElementById('alert-box'),
  alertMessage: document.getElementById('alert-message')
};

/**
 * Initialize the popup interface
 */
function initPopup() {
  // Load saved institution
  loadSavedInstitution();
  
  // Event listeners
  elements.universitySelect.addEventListener('change', handleUniversityChange);
  elements.saveButton.addEventListener('click', handleSave);
  elements.editButton.addEventListener('click', handleEdit);
  elements.resetButton.addEventListener('click', handleReset);
}

/**
 * Load the saved institution from storage
 */
function loadSavedInstitution() {
  chrome.storage.local.get([STORAGE_KEYS.INSTITUTION], function(result) {
    const savedInstitution = result[STORAGE_KEYS.INSTITUTION];
    
    if (savedInstitution) {
      // Display the success message with saved institution
      elements.savedInstitutionName.textContent = savedInstitution.name;
      elements.savedInstitutionProxy.textContent = 
        savedInstitution.type === 'prefix' 
          ? `Prefix: ${savedInstitution.proxy}` 
          : `Suffix: ${savedInstitution.proxy}`;
      
      // Show success view, hide form view
      elements.universitySelectContainer.classList.add('hidden');
      elements.successMessage.classList.remove('hidden');
    } else {
      // Show form view, hide success view
      elements.universitySelectContainer.classList.remove('hidden');
      elements.successMessage.classList.add('hidden');
    }
  });
}

/**
 * Handle university selection change
 */
function handleUniversityChange() {
  const selectedValue = elements.universitySelect.value;
  
  if (selectedValue === 'custom') {
    // Show custom institution form
    elements.customForm.classList.remove('hidden');
  } else {
    // Hide custom institution form
    elements.customForm.classList.add('hidden');
  }
}

/**
 * Handle save button click
 */
function handleSave() {
  const selectedValue = elements.universitySelect.value;
  
  if (!selectedValue) {
    showAlert('Please select an institution', 'info');
    return;
  }
  
  let institution;
  
  if (selectedValue === 'custom') {
    // Get custom institution details
    const name = elements.customName.value.trim();
    const proxy = elements.customProxy.value.trim();
    
    if (!name) {
      showAlert('Please enter institution name', 'info');
      return;
    }
    
    if (!proxy) {
      showAlert('Please enter proxy URL or suffix', 'info');
      return;
    }
    
    // Determine if it's a prefix or suffix type
    const type = proxy.startsWith('http') || !proxy.startsWith('.') 
      ? 'prefix' 
      : 'suffix';
    
    institution = {
      name,
      proxy,
      type,
      isCustom: true
    };
    
    // Save to custom institutions list
    saveCustomInstitution(institution);
  } else {
    // Get institution from predefined list
    institution = {
      ...UNIVERSITIES[selectedValue],
      id: selectedValue
    };
  }
  
  // Save institution to storage
  chrome.storage.local.set({
    [STORAGE_KEYS.INSTITUTION]: institution
  }, function() {
    // Display success message
    elements.savedInstitutionName.textContent = institution.name;
    elements.savedInstitutionProxy.textContent = 
      institution.type === 'prefix' 
        ? `Prefix: ${institution.proxy}` 
        : `Suffix: ${institution.proxy}`;
    
    // Show success view, hide form view
    elements.universitySelectContainer.classList.add('hidden');
    elements.successMessage.classList.remove('hidden');
  });
}

/**
 * Save a custom institution to the list
 * @param {Object} institution Custom institution object
 */
function saveCustomInstitution(institution) {
  chrome.storage.local.get([STORAGE_KEYS.CUSTOM_INSTITUTIONS], function(result) {
    const customInstitutions = result[STORAGE_KEYS.CUSTOM_INSTITUTIONS] || [];
    
    // Generate a unique ID
    institution.id = 'custom_' + Date.now();
    
    // Add to list
    customInstitutions.push(institution);
    
    // Save updated list
    chrome.storage.local.set({
      [STORAGE_KEYS.CUSTOM_INSTITUTIONS]: customInstitutions
    });
  });
}

/**
 * Handle edit button click
 */
function handleEdit() {
  // Show form view, hide success view
  elements.universitySelectContainer.classList.remove('hidden');
  elements.successMessage.classList.add('hidden');
  
  // Load current institution for editing
  chrome.storage.local.get([STORAGE_KEYS.INSTITUTION], function(result) {
    const savedInstitution = result[STORAGE_KEYS.INSTITUTION];
    
    if (savedInstitution) {
      if (savedInstitution.isCustom) {
        // Select custom option and fill form
        elements.universitySelect.value = 'custom';
        elements.customForm.classList.remove('hidden');
        elements.customName.value = savedInstitution.name;
        elements.customProxy.value = savedInstitution.proxy;
      } else if (savedInstitution.id) {
        // Select predefined institution
        elements.universitySelect.value = savedInstitution.id;
        elements.customForm.classList.add('hidden');
      }
    }
  });
}

/**
 * Handle reset button click
 */
function handleReset() {
  if (confirm('Are you sure you want to reset your institution settings?')) {
    // Clear institution from storage
    chrome.storage.local.remove([STORAGE_KEYS.INSTITUTION], function() {
      // Reset form
      elements.universitySelect.value = '';
      elements.customName.value = '';
      elements.customProxy.value = '';
      elements.customForm.classList.add('hidden');
      
      // Show form view, hide success view
      elements.universitySelectContainer.classList.remove('hidden');
      elements.successMessage.classList.add('hidden');
      
      showAlert('Your settings have been reset', 'info');
    });
  }
}

/**
 * Show an alert message
 * @param {string} message Message to display
 * @param {string} type Alert type (info, success, etc.)
 */
function showAlert(message, type = 'info') {
  elements.alertMessage.textContent = message;
  elements.alertBox.className = `alert alert-${type}`;
  elements.alertBox.classList.remove('hidden');
  
  // Hide after 5 seconds
  setTimeout(() => {
    elements.alertBox.classList.add('hidden');
  }, 5000);
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);