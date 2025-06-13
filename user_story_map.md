# Academic Access Extension: User Story Map

## User Activities
| **Account Setup** | **Discovering Content** | **Accessing Articles** | **Managing Resources** | **Extension Configuration** |
|-------------------|-------------------------|------------------------|------------------------|----------------------------|
| As a user, I want to set up my extension quickly to start accessing articles | As a user, I want to find academic content through various channels | As a user, I want seamless access to subscribed content | As a user, I want to organize and cite articles I've accessed | As a user, I want to customize how the extension works |

## User Stories by Activity

### 1. Account Setup

#### Main Stories
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| HIGH | As a new user, I want to set up my institutional affiliation so I can access subscribed content | - User can select institution from searchable list<br>- Common institutions appear first<br>- Success confirmation shown when configured |
| HIGH | As a user with institutional credentials, I want to securely connect my library account | - OAuth or institutional SSO integration<br>- Clear security explanations<br>- Authentication persistence options |
| MEDIUM | As a user affiliated with multiple institutions, I want to configure all my access options | - Support for adding multiple institutions<br>- Easy switching between institutions<br>- Visual indication of active institution |
| MEDIUM | As a returning user, I want my settings to persist across browser sessions | - Settings saved securely in browser storage<br>- Sync across devices if browser sync enabled |

#### Edge Cases
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| LOW | As a user whose institution isn't listed, I want to manually configure my proxy settings | - Custom proxy URL pattern input<br>- Testing mechanism for validation<br>- Clear instructions for finding proxy information |
| LOW | As a user with expired credentials, I want to be notified and guided to reauthenticate | - Detect authentication failures<br>- Clear error messages<br>- One-click reauthentication flow |
| LOW | As a user changing institutions, I want to update my affiliation without losing settings | - Institution switch without full reconfiguration<br>- Option to retain or reset other preferences |

### 2. Discovering Content

#### Main Stories
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| HIGH | As a researcher, I want the extension to detect when I'm viewing a paywalled article | - Accurate detection across major publishers<br>- Visual indicator in browser toolbar<br>- Non-intrusive notification |
| HIGH | As a student, I want to know immediately if my institution provides access to the current article | - Quick subscription check<br>- Clear visual indication (green/red)<br>- Estimated confidence level |
| MEDIUM | As a user browsing search results, I want indicators showing which results are accessible | - Integration with Google Scholar/PubMed/etc.<br>- Small visual badges on search results<br>- Hover details for access method |

#### Edge Cases
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| MEDIUM | As a user on an unknown site, I want to manually trigger access checking | - Context menu option to check access<br>- Support for non-standard article pages<br>- Feedback when site format is unrecognized |
| LOW | As a user on a preprint server, I want to know if the final version is available through my institution | - Match preprints to published versions<br>- Show both versions when available<br>- Clear indication of version differences |
| LOW | As a user viewing conference proceedings, I want proper detection of these specialized formats | - Support for conference-specific formats<br>- Recognition of proceedings as distinct content type |

### 3. Accessing Articles

#### Main Stories
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| HIGH | As a student, I want one-click redirection to the proxied version of an article | - Seamless redirect with loading indicator<br>- Preservation of article URL structure<br>- Return option if redirect fails |
| HIGH | As a researcher, I want to be automatically authenticated when redirected to my institution | - Handling of authentication cookies/tokens<br>- Minimal authentication prompts<br>- Support for various SSO systems |
| MEDIUM | As a user without institutional access to a specific article, I want alternative access options | - Search for open access versions<br>- Link to preprint repositories<br>- Integration with services like Unpaywall |
| MEDIUM | As a user wanting citation information, I want to extract metadata even before accessing the full text | - Parse and display citation data<br>- Copy formatted citation option<br>- Export to reference managers |

#### Edge Cases
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| MEDIUM | As a user encountering a failed proxy redirect, I want fallback options | - Clear error explanation<br>- Alternative access methods presented<br>- Troubleshooting steps |
| MEDIUM | As a user accessing content from off-campus, I want VPN integration hints | - Detection of off-campus access<br>- VPN connection suggestions when relevant<br>- Instructions for institutional VPN setup |
| LOW | As a user hitting an unexpected paywall after redirect, I want recovery options | - Detection of post-redirect paywalls<br>- Alternative proxy attempt<br>- Report mechanism for fixing in future |
| LOW | As a user reaching article access limits, I want notification before being blocked | - Track access frequency against known limits<br>- Warning when approaching limits<br>- Suggestions for legitimate access alternatives |

### 4. Managing Resources

#### Main Stories
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| MEDIUM | As a researcher, I want to save articles I've accessed for future reference | - History of accessed articles<br>- Basic metadata storage<br>- Search/filter capabilities |
| MEDIUM | As a student writing a paper, I want to export citations in my preferred format | - Multiple citation format support<br>- Integration with Zotero/Mendeley/EndNote<br>- Copy to clipboard functionality |
| LOW | As a user working on multiple projects, I want to organize accessed articles into collections | - Create/edit/delete collections<br>- Add articles to multiple collections<br>- Export collection bibliography |

#### Edge Cases
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| LOW | As a privacy-conscious user, I want to clear my access history | - Complete history deletion option<br>- Selective history clearing<br>- Automatic history expiration settings |
| LOW | As a user with corrupted article metadata, I want to manually edit saved citations | - Edit metadata interface<br>- Validation of edited fields<br>- Restore default option |
| LOW | As a user switching devices, I want my saved articles available everywhere | - Optional sync across devices<br>- Clear privacy implications<br>- Export/import functionality |

### 5. Extension Configuration

#### Main Stories
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| HIGH | As a user, I want to enable/disable automatic redirect to control my browsing experience | - Simple toggle setting<br>- Site-specific exceptions<br>- Remember preference |
| MEDIUM | As a user concerned about privacy, I want to control what data the extension collects | - Granular privacy settings<br>- Clear explanation of data usage<br>- Option to disable all tracking |
| MEDIUM | As a user with specific workflow needs, I want to customize notification behavior | - Notification style options<br>- Duration/position settings<br>- Option to disable specific notifications |

#### Edge Cases
| **Priority** | **Story** | **Acceptance Criteria** |
|--------------|-----------|-------------------------|
| LOW | As a user with accessibility needs, I want to customize the extension's appearance | - High contrast mode<br>- Keyboard shortcut configuration<br>- Screen reader compatibility |
| LOW | As a user in a shared computer environment, I want to temporarily disable the extension | - Quick disable toggle<br>- Optional password protection<br>- Auto-reenable option |
| LOW | As a power user, I want to import/export my extension configuration | - Configuration backup file<br>- Import validation<br>- Merge or replace options |
| LOW | As a user experiencing conflicts with other extensions, I want troubleshooting options | - Conflict detection<br>- Compatibility mode<br>- Detailed logs for support |

## User Journey Examples

### Primary Journey: New Student
1. Discovers extension through university library recommendation
2. Installs extension and selects university from dropdown
3. Authenticates with institutional credentials
4. Searches for articles on Google Scholar for an assignment
5. Clicks on a paywalled article and is automatically redirected to accessible version through library proxy
6. Exports citation to reference manager
7. Completes assignment with properly cited sources

### Alternative Journey: Researcher with Multiple Affiliations
1. Configures extension with primary institution
2. Adds secondary institution affiliation
3. Encounters article not available through primary institution
4. Extension detects availability through secondary institution and offers switch
5. Switches institution with one click and accesses article
6. Saves article to personal collection for research project
7. Returns to primary institution setting for subsequent searches

### Edge Case Journey: No Institutional Access
1. Encounters article with no subscription access at configured institutions
2. Extension checks for open access alternatives
3. Finds preprint version on arXiv and presents as alternative
4. User reviews preprint and decides to request full version through interlibrary loan
5. Uses extension's metadata extraction to populate ILL request form
6. Receives notification when full article becomes available