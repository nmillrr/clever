# Chrome Web Store Submission Preparation

## Required Assets

1. **ZIP Package**
   - Run `npm run build` to create the production build
   - Create a ZIP file of the `dist` directory contents (not the directory itself)
   - Ensure manifest.json is at the root level of the ZIP

2. **Store Listing Assets**
   - **Icon**: 128x128 PNG icon (already in `assets/icon128.png`)
   - **Screenshots**: 1280x800 or 640x400 screenshots (at least 1, max 5)
   - **Promotional Images**:
     - Small promotional tile: 440x280 PNG/JPEG
     - Large promotional tile: 920x680 PNG/JPEG
     - Marquee promotional tile: 1400x560 PNG/JPEG (optional)

3. **Privacy Policy**
   - Create a privacy policy HTML document
   - Host it on a publicly accessible URL
   - Must include data collection, usage, and sharing practices

## Store Listing Information

1. **Basic Information**
   - **Extension Name**: "Academic Access Extension"
   - **Summary**: Brief 132-character description
   - **Detailed Description**: Up to 16,000 characters explaining features and benefits
   - **Category**: "Productivity" and "Education"
   - **Language**: English (default)

2. **Contact Information**
   - Developer email address
   - Support website URL

## Permissions and Requirements

1. **Permissions Justification**
   - For each permission in the manifest, document why it's needed:
     - `storage`: Storing user institution settings
     - `tabs`: Redirecting to institutional access
     - `webNavigation`: Monitoring page loads for paywall detection
     - `scripting`: Injecting the access button UI
     - `contextMenus`: Right-click menu for article access

2. **Content Security Policy**
   - Review the CSP in manifest.json
   - Ensure it complies with Chrome's requirements
   - Justify any unsafe-eval or remote script inclusions

3. **Third-Party Code**
   - Document all third-party libraries (Radix UI)
   - Ensure proper licensing for all components

## Compliance Requirements

1. **User Data Privacy**
   - Ensure compliance with Chrome's User Data Policy
   - Document what data is collected, how it's used, and how long it's retained
   - Include opt-out mechanisms if needed

2. **User Experience Requirements**
   - Extension functionality must be clearly described
   - No hidden features or unexpected behavior
   - UI elements should be clearly branded

3. **Technical Requirements**
   - Ensure Manifest V3 compliance
   - No eval() or remote code execution
   - No obfuscated code
   - Proper error handling
   - No browser fingerprinting

## Pre-Submission Checklist

1. **Testing**
   - Functionality testing on Chrome stable, beta, and dev channels
   - Performance testing (memory usage, CPU usage)
   - Security testing (no data leaks, proper permission usage)
   - Cross-platform testing (Windows, Mac, Linux)

2. **Code Review**
   - Clean up any debugging code
   - Remove console.log statements
   - Check for hardcoded credentials or sensitive data
   - Ensure proper error handling

3. **Documentation**
   - Update README.md with final instructions
   - Include troubleshooting section
   - Add version history

4. **Version Management**
   - Set proper version number in manifest.json
   - Document changes in a CHANGELOG.md file

## Developer Dashboard Preparation

1. **Account Setup**
   - Google Developer account ($5 one-time registration fee)
   - Payment method for registration fee

2. **Verification Requirements**
   - Verify identity with Google
   - Set up two-factor authentication
   - Complete any required tax forms

3. **Store Listing Draft**
   - Prepare all content in a document before starting submission
   - Review all content for spelling and grammar

## Post-Submission Preparation

1. **Support Plan**
   - Plan for user support (email, GitHub issues, etc.)
   - Create templates for common support responses
   - Set up monitoring for reviews and feedback

2. **Update Plan**
   - Schedule for regular updates
   - Process for security patches
   - Beta testing program for major updates

3. **Marketing Plan**
   - Social media announcements
   - Academic communities outreach
   - University library partnerships