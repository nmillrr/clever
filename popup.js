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
        schoolNameText: document.getElementById('schoolNameText')
    };

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    function saveSchool(schoolData) {
        chrome.storage.sync.set({ selectedSchool: schoolData }, function() {
            console.log('School saved:', schoolData);
        });
    }

    function loadSavedSchool() {
        chrome.storage.sync.get(['selectedSchool'], function(result) {
            if (result.selectedSchool) {
                showConfirmation(result.selectedSchool);
                showScreen('confirmation');
            }
        });
    }

    function showConfirmation(schoolData) {
        elements.selectedLogo.className = `school-logo ${schoolData.logoClass}`;
        elements.selectedLogo.textContent = schoolData.logoText;
        elements.selectedName.textContent = schoolData.displayName;
        elements.schoolNameText.textContent = schoolData.name;
    }

    function getSchoolData(schoolName) {
        const schoolConfigs = {
            'Boston University': {
                name: 'Boston University',
                displayName: 'BU',
                logoClass: 'bu-logo',
                logoText: 'BU'
            },
            'NYU': {
                name: 'NYU',
                displayName: 'NYU',
                logoClass: 'nyu-logo',
                logoText: '🔥'
            },
            'Stanford': {
                name: 'Stanford',
                displayName: 'Stanford',
                logoClass: 'stanford-logo',
                logoText: 'S'
            },
            'UConn': {
                name: 'UConn',
                displayName: 'UConn',
                logoClass: 'uconn-logo',
                logoText: '🐺'
            },
            'USC': {
                name: 'USC',
                displayName: 'USC',
                logoClass: 'usc-logo',
                logoText: 'SC'
            },
            'Yale': {
                name: 'Yale',
                displayName: 'Yale',
                logoClass: 'yale-logo',
                logoText: 'Y'
            }
        };
        
        return schoolConfigs[schoolName];
    }

    // Event listeners
    elements.selectSchoolBtn.addEventListener('click', function() {
        showScreen('schoolSelection');
    });

    elements.schoolOptions.forEach(option => {
        option.addEventListener('click', function() {
            const schoolName = this.dataset.school;
            const schoolData = getSchoolData(schoolName);
            
            if (schoolData) {
                saveSchool(schoolData);
                showConfirmation(schoolData);
                showScreen('confirmation');
            }
        });
    });

    elements.changeSchoolBtn.addEventListener('click', function() {
        showScreen('schoolSelection');
    });

    // Initialize
    loadSavedSchool();
});