# Permissions Justification for Academic Access Extension

This document explains the permissions requested by the Academic Access Extension and why each is necessary for the extension's functionality.

## 1. `storage`

**Description**: Allows the extension to store data in the browser's local storage.

**Justification**: This permission is essential for storing:
- User's institution settings and proxy configuration
- Article access history
- User preferences

Without this permission, the extension would be unable to remember the user's institution between sessions and could not provide access history functionality.

## 2. `tabs`

**Description**: Allows the extension to interact with the browser's tabs system.

**Justification**: This permission is required to:
- Redirect the current tab to the institutional proxy URL
- Get the current tab's URL to generate the proxied version
- Create new tabs when opening articles in a new tab

This is core to the extension's functionality of providing institutional access to academic articles.

## 3. `webNavigation`

**Description**: Allows the extension to monitor web page navigation events.

**Justification**: This permission is used to:
- Detect when a user navigates to a potential paywall page
- Identify the appropriate time to show access options
- Monitor redirects to ensure successful proxy access

Without this permission, the extension would be unable to automatically detect paywalls and offer assistance at the right moment.

## 4. `scripting`

**Description**: Allows the extension to execute scripts in the context of web pages.

**Justification**: This permission is necessary to:
- Inject the access button UI onto paywalled pages
- Extract article metadata (DOIs, titles) from page content
- Detect paywalls by analyzing page content and structure

This permission is essential for the core functionality of identifying paywalls and offering access solutions.

## 5. `contextMenus`

**Description**: Allows the extension to add items to the browser's context menu.

**Justification**: This permission is used to:
- Add a right-click option to "Access via Institution" for article links
- Provide quick access to extension functionality while browsing
- Enable users to access articles without navigating to them first

This enhances user experience by providing convenient access to the extension's features.

## Host Permissions

**Description**: The extension requests access to specific academic publisher domains.

**Justification**: These permissions are necessary to:
- Detect paywalls on publisher websites
- Extract article metadata
- Inject the access button UI

The extension only requests access to known academic publisher domains where institutional access might be relevant, not to all websites.

## Data Usage and Privacy

All data collected using these permissions is:
- Stored locally on the user's device
- Never transmitted to our servers
- Used solely for providing the extension's functionality
- Subject to our privacy policy

## Conclusion

Each permission requested is directly tied to core functionality of the Academic Access Extension. We request the minimum permissions necessary to provide a seamless institutional access experience for academic research.