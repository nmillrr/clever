document.addEventListener('DOMContentLoaded', function() {
    const screens = {
        landing: document.getElementById('landing'),
        schoolSelection: document.getElementById('schoolSelection'),
        confirmation: document.getElementById('confirmation')
    };

    const elements = {
        selectSchoolBtn: document.getElementById('selectSchoolBtn'),
        schoolOptions: document.querySelectorAll('.school-option'),
        changeSchoolBtn: document.getElementById('changeSchoolBtn'),
        selectedLogo: document.getElementById('selectedLogo'),
        selectedName: document.getElementById('selectedName'),
        confirmationFullText: document.getElementById('confirmationFullText')
    };

    function showScreen(screenName) {
        const currentScreen = document.querySelector('.screen.active');
        
        if (currentScreen && currentScreen !== screens[screenName]) {
            // Fade out current screen
            currentScreen.classList.add('fade-out');
            
            // After fade out completes, switch screens
            setTimeout(() => {
                // Clean up ALL screens first
                Object.values(screens).forEach(screen => {
                    screen.classList.remove('active', 'fade-out', 'fade-in');
                    screen.style.display = 'none';
                });
                
                // Show new screen and start fade in immediately
                screens[screenName].classList.add('active');
                screens[screenName].style.display = 'flex';
                
                // Small delay to ensure display change takes effect before fade in
                requestAnimationFrame(() => {
                    screens[screenName].classList.add('fade-in');
                    
                    // Clean up fade-in class after animation
                    setTimeout(() => {
                        screens[screenName].classList.remove('fade-in');
                    }, 300);
                });
            }, 300);
        } else if (!currentScreen) {
            // First screen load
            screens[screenName].classList.add('active');
        }
    }
    

    function saveSchool(schoolData) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ selectedSchool: schoolData }, function() {
                console.log('School saved:', schoolData);
            });
        } else {
            // For testing outside extension environment
            localStorage.setItem('selectedSchool', JSON.stringify(schoolData));
            console.log('School saved to localStorage:', schoolData);
        }
    }

    function loadSavedSchool() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['selectedSchool'], function(result) {
                if (result.selectedSchool) {
                    showConfirmation(result.selectedSchool);
                    showScreen('confirmation');
                }
            });
        }
        // In test mode, just start with landing page (no action needed)
    }

    function showConfirmation(schoolData) {
        // Clear any inline styles that might interfere
        const confirmationContent = document.querySelector('.confirmation-content');
        if (confirmationContent) {
            confirmationContent.style.display = '';
            confirmationContent.style.opacity = '';
        }
        
        // Populate confirmation data
        elements.selectedLogo.className = `confirmation-logo ${schoolData.logoClass}`;
        elements.selectedLogo.innerHTML = `<img src="${schoolData.svgPath}" alt="${schoolData.displayName} Logo" class="confirmation-svg">`;
        elements.selectedName.textContent = schoolData.displayName;
        elements.confirmationFullText.textContent = `when you encounter an online paywall, clever will check ${schoolData.name}'s library to see if you have free student access.`;
        
        // Ensure change school handler is set up
        setupChangeSchoolHandler();
    }
    

    // School database - easy to add new schools
    const SCHOOLS = [
        {
            name: 'Boston University',
            displayName: 'BU',
            logoClass: 'bu-logo',
            svgPath: 'assets/school-logos/bu.svg'
        },
        {
            name: 'Northeastern University',
            displayName: 'Northeastern',
            logoClass: 'northeastern-logo',
            svgPath: 'assets/school-logos/northeastern.svg'
        },
        {
            name: 'NYU',
            displayName: 'NYU',
            logoClass: 'nyu-logo',
            svgPath: 'assets/school-logos/nyu.svg'
        },
        {
            name: 'UConn',
            displayName: 'UConn',
            logoClass: 'uconn-logo',
            svgPath: 'assets/school-logos/uconn.svg'
        },
        {
            name: 'UMass',
            displayName: 'UMass',
            logoClass: 'umass-logo',
            svgPath: 'assets/school-logos/umass.svg'
        },
        {
            name: 'USC',
            displayName: 'USC',
            logoClass: 'usc-logo',
            svgPath: 'assets/school-logos/usc.svg'
        }
    ];
    
    function getSchoolData(schoolName) {
        return SCHOOLS.find(school => school.name === schoolName || school.displayName === schoolName);
    }
    
    function generateSchoolsHTML() {
        // Sort schools alphabetically by display name
        const sortedSchools = [...SCHOOLS].sort((a, b) => a.displayName.localeCompare(b.displayName));
        
        const schoolsContainer = document.querySelector('.schools-scrollable');
        if (schoolsContainer) {
            schoolsContainer.innerHTML = sortedSchools.map(school => `
                <div class="school-option" data-school="${school.name}">
                    <div class="school-logo ${school.logoClass}">
                        <img src="${school.svgPath}" alt="${school.displayName} Logo" class="school-svg">
                    </div>
                    <div class="school-name">${school.displayName}</div>
                </div>
            `).join('');
        }
    }


    // Set up event handlers using proper event delegation
    function setupEventHandlers() {
        // School selection click handler
        document.addEventListener('click', handleSchoolClick);
        
        // Select school button
        if (elements.selectSchoolBtn) {
            elements.selectSchoolBtn.addEventListener('click', handleSelectSchoolClick);
        }
        
        // Change school button - set up when the confirmation screen shows
        setupChangeSchoolHandler();
    }
    
    function handleSchoolClick(e) {
        const schoolOption = e.target.closest('.school-option');
        if (schoolOption) {
            const schoolName = schoolOption.dataset.school;
            const schoolData = getSchoolData(schoolName);
            
            if (schoolData) {
                saveSchool(schoolData);
                showConfirmation(schoolData);
                showScreen('confirmation');
            }
        }
    }
    
    function handleSelectSchoolClick() {
        showScreen('schoolSelection');
    }
    
    function handleChangeSchoolClick() {
        resetSchoolSelection();
        showScreen('schoolSelection');
    }
    
    function resetSchoolSelection() {
        const schoolsScrollable = document.querySelector('.schools-scrollable');
        const confirmationContent = document.querySelector('.confirmation-content');
        
        // Make sure schools are visible
        if (schoolsScrollable) {
            schoolsScrollable.style.display = 'grid';
            schoolsScrollable.style.opacity = '1';
        }
        
        // Hide confirmation content
        if (confirmationContent) {
            confirmationContent.style.display = 'none';
            confirmationContent.style.opacity = '0';
        }
    }
    
    function setupChangeSchoolHandler() {
        if (elements.changeSchoolBtn) {
            elements.changeSchoolBtn.removeEventListener('click', handleChangeSchoolClick);
            elements.changeSchoolBtn.addEventListener('click', handleChangeSchoolClick);
        }
    }
    

    // Initialize application
    function init() {
        generateSchoolsHTML();
        setupEventHandlers();
        loadSavedSchool();
    }
    
    // Start the application when DOM is ready
    init();
});