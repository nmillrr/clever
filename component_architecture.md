# Academic Access Extension: Component Architecture

## 1. Architecture Overview

The extension follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                     │
├─────────────────────────────────────────────────────────────┤
│                        Application Layer                     │
├─────────────────────────────────────────────────────────────┤
│                         Domain Layer                         │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                     │
└─────────────────────────────────────────────────────────────┘
```

## 2. Layer Breakdown

### 2.1. Presentation Layer

Responsible for UI components and user interactions.

#### Components:
- **BrowserActionUI**: The popup interface when clicking the extension icon
- **ContentScriptUI**: Injected UI elements on article pages (notifications, access buttons)
- **OptionsPageUI**: Extension configuration interface
- **NotificationManager**: Handles system notifications

#### Services:
- **UIStateManager**: Manages UI state and transitions
- **EventHandler**: Processes user interactions

### 2.2. Application Layer

Coordinates between presentation and domain layers, orchestrates workflows.

#### Services:
- **ArticleAccessService**: Orchestrates the article access workflow
- **InstitutionManager**: Handles institution selection and switching
- **ConfigurationService**: Manages user preferences
- **AuthenticationService**: Coordinates user authentication processes

#### Use Cases:
- **DetectPaywallUseCase**: Initiates paywall detection flow
- **CheckAccessUseCase**: Determines access availability
- **RedirectToProxyUseCase**: Handles proxy redirection
- **FindOpenAccessUseCase**: Searches for open access alternatives

### 2.3. Domain Layer

Contains core business logic and entities.

#### Entities:
- **Article**: Represents article metadata and access status
- **Institution**: Institution details and proxy configuration
- **AccessCredentials**: User authentication tokens
- **AccessRecord**: Record of accessed articles

#### Services:
- **PaywallDetectionService**: Core logic for identifying paywalls
- **InstitutionalAccessResolver**: Determines if institution provides access
- **ProxyUrlGenerator**: Generates proxied URLs based on institution rules
- **OpenAccessLocator**: Core logic for finding OA alternatives

### 2.4. Infrastructure Layer

Handles external communication, data persistence, and platform integration.

#### Data Access:
- **StorageRepository**: Interface for browser storage
- **SettingsRepository**: Stores user preferences
- **HistoryRepository**: Manages access history
- **InstitutionRepository**: Stores institution data

#### External Services:
- **HttpClient**: Wrapper for network requests
- **UnpaywallAdapter**: Integration with Unpaywall API
- **LibKeyAdapter**: Integration with LibKey API
- **OAButtonAdapter**: Integration with Open Access Button
- **DOIResolver**: Resolves DOIs to metadata

#### Platform Services:
- **BrowserExtensionAPI**: Wrapper for browser extension APIs
- **CookieManager**: Handles browser cookies for authentication
- **TabController**: Manages browser tabs for redirects

## 3. Core Modules

### 3.1. Paywall Detection Module

```
┌─────────────────────────────────────────────────────────────┐
│                    PaywallDetectionModule                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│ │ PatternDetector │ │ ContentParser │ │ ResponseAnalyzer │  │
│ └─────────────────┘ └───────────────┘ └──────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐   │
│ │              PublisherRulesetRepository               │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **PatternDetector**: Identifies paywall patterns in URLs and DOM
- **ContentParser**: Extracts article metadata from page content
- **ResponseAnalyzer**: Analyzes HTTP responses for paywall indicators
- **PublisherRulesetRepository**: Stores publisher-specific detection rules

### 3.2. Institutional Access Module

```
┌─────────────────────────────────────────────────────────────┐
│                 InstitutionalAccessModule                    │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────────────────┐     │
│ │ SubscriptionCheck │ │ InstitutionProxyConfiguration │     │
│ └───────────────────┘ └───────────────────────────────┘     │
│ ┌─────────────────────┐ ┌──────────────────────────┐        │
│ │ AuthenticationAgent │ │ CredentialStoreEncrypted │        │
│ └─────────────────────┘ └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

- **SubscriptionCheck**: Verifies if institution subscribes to resource
- **InstitutionProxyConfiguration**: Manages proxy settings per institution
- **AuthenticationAgent**: Handles institution authentication flows
- **CredentialStoreEncrypted**: Securely stores authentication tokens

### 3.3. Proxy Redirection Module

```
┌─────────────────────────────────────────────────────────────┐
│                    ProxyRedirectionModule                    │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌──────────────────┐                 │
│ │ URLTransformEngine │ │ RedirectHandler  │                 │
│ └────────────────────┘ └──────────────────┘                 │
│ ┌────────────────────┐ ┌──────────────────┐                 │
│ │ SessionManager     │ │ ProxyHealthCheck │                 │
│ └────────────────────┘ └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

- **URLTransformEngine**: Converts article URLs to proxied versions
- **RedirectHandler**: Manages browser redirections
- **SessionManager**: Maintains proxy session state
- **ProxyHealthCheck**: Verifies proxy availability

### 3.4. Open Access Finder Module

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenAccessFinderModule                   │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│ │ OASearchStrategy │ │ SourceRanking  │ │ ResultMerger   │  │
│ └──────────────────┘ └────────────────┘ └────────────────┘  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │                  APIClientFactory                      │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **OASearchStrategy**: Implements search strategies for OA content
- **SourceRanking**: Ranks alternative sources by quality/reliability
- **ResultMerger**: Combines results from multiple sources
- **APIClientFactory**: Creates clients for different OA APIs

## 4. Cross-Cutting Concerns

### 4.1. Security Module

```
┌─────────────────────────────────────────────────────────────┐
│                        SecurityModule                        │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│ │ Encryption     │ │ TokenManager    │ │ SecureStorage   │  │
│ └────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **Encryption**: Handles encryption/decryption of sensitive data
- **TokenManager**: Manages authentication tokens securely
- **SecureStorage**: Interface for secure storage mechanisms

### 4.2. Logging and Analytics Module

```
┌─────────────────────────────────────────────────────────────┐
│                  LoggingAndAnalyticsModule                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌────────────────┐ ┌───────────────────┐    │
│ │ Logger      │ │ ErrorReporter  │ │ AnalyticsTracker  │    │
│ └─────────────┘ └────────────────┘ └───────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

- **Logger**: Handles debug and error logging
- **ErrorReporter**: Reports errors to monitoring service
- **AnalyticsTracker**: Tracks usage analytics (opt-in)

### 4.3. Sync Module

```
┌─────────────────────────────────────────────────────────────┐
│                         SyncModule                           │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐   │
│ │ SyncManager   │ │ ConflictResolver│ │ ChangeDetector   │   │
│ └───────────────┘ └────────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **SyncManager**: Manages data synchronization across devices
- **ConflictResolver**: Resolves sync conflicts
- **ChangeDetector**: Detects local changes for syncing

## 5. Integration and Data Flow

### 5.1. Initialization Flow

```
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│ Extension    │────>│ Configuration  │────>│ Publisher Rules │
│ Bootstrap    │     │ Loader         │     │ Loader          │
└──────────────┘     └────────────────┘     └─────────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│ Content      │     │ Background     │     │ Institution     │
│ Scripts      │     │ Service        │     │ Data            │
└──────────────┘     └────────────────┘     └─────────────────┘
```

### 5.2. Article Access Flow

```
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│ Paywall      │────>│ Access         │────>│ Proxy           │
│ Detection    │     │ Verification   │     │ Redirection     │
└──────────────┘     └────────────────┘     └─────────────────┘
                            │
                            │ (if no access)
                            ▼
                     ┌────────────────┐
                     │ Open Access    │
                     │ Search         │
                     └────────────────┘
```

## 6. API Integration Points

### 6.1. External API Adapters

```
┌────────────────────────────────────────────────────────────┐
│                      APIAdapterFactory                      │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│ │ UnpaywallAPI   │ │ LibKeyAPI      │ │ OAButtonAPI     │  │
│ └────────────────┘ └────────────────┘ └─────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│ │ CrossRefAPI    │ │ ScopusAPI      │ │ GoogleScholarAPI│  │
│ └────────────────┘ └────────────────┘ └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Each adapter implements a common interface for:
- Authentication
- Request formatting
- Response parsing
- Error handling
- Rate limiting

### 6.2. Extension API Abstractions

```
┌────────────────────────────────────────────────────────────┐
│                   BrowserExtensionAPI                       │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│ │ StorageAPI     │ │ TabsAPI        │ │ CookiesAPI      │  │
│ └────────────────┘ └────────────────┘ └─────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│ │ WebRequestAPI  │ │ ContextMenuAPI │ │ NotificationsAPI│  │
│ └────────────────┘ └────────────────┘ └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Provides platform-agnostic abstractions to support:
- Chrome
- Firefox
- Safari
- Edge

## 7. Data Models

### 7.1. Core Data Models

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Article       │     │ Institution   │     │ User          │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ doi           │     │ id            │     │ id            │
│ title         │     │ name          │     │ institutions  │
│ authors       │     │ domain        │     │ preferences   │
│ publisher     │     │ proxyPattern  │     │ history       │
│ accessStatus  │     │ authMethod    │     │ collections   │
│ accessOptions │     │ subscriptions │     └───────────────┘
└───────────────┘     └───────────────┘
```

### 7.2. Storage Schema

```
┌────────────────────┐
│ LocalStorage       │
├────────────────────┤
│ user.preferences   │
│ user.institutions  │
│ article.history    │
└────────────────────┘

┌────────────────────┐
│ SecureStorage      │
├────────────────────┤
│ credentials        │
│ tokens             │
└────────────────────┘

┌────────────────────┐
│ SyncStorage        │
├────────────────────┤
│ collections        │
│ sharedPreferences  │
└────────────────────┘
```

## 8. Extension Entry Points

### 8.1. Background Script

- Initialization and lifecycle management
- Message routing between components
- Long-running processes
- API request coordination

### 8.2. Content Scripts

- Publisher-specific DOM manipulation
- Paywall detection
- UI injection
- Page interaction

### 8.3. Popup Interface

- Institution selection
- Quick actions
- Status display
- Settings access

### 8.4. Options Page

- Detailed configuration
- Institution management
- History and collections
- Advanced settings

## 9. Deployment Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   Browser Extension                        │
└───────────────────────────────────────────────────────────┘
               │                   │
               ▼                   ▼
┌────────────────────┐     ┌────────────────────┐
│ Extension Updates  │     │ Publisher Ruleset  │
│ Server             │     │ Update Server      │
└────────────────────┘     └────────────────────┘
               │                   │
               └─────────┬─────────┘
                         ▼
              ┌────────────────────┐
              │ Analytics & Error  │
              │ Reporting (opt-in) │
              └────────────────────┘
```

## 10. Extension Package Structure

```
extension/
├── manifest.json
├── package.json
├── webpack.config.js
├── node_modules/
│   └── @radix-ui/
│       └── themes/
├── background/
│   ├── index.js
│   ├── services/
│   └── repositories/
├── content/
│   ├── index.js
│   ├── publishers/
│   └── ui/
├── popup/
│   ├── index.html
│   ├── index.js
│   └── components/
├── options/
│   ├── index.html
│   ├── index.js
│   └── components/
├── shared/
│   ├── models/
│   ├── services/
│   └── utils/
└── assets/
    ├── images/
    └── styles/
```

## 11. UI Framework

The extension uses Radix UI as its component library and styling system, providing several advantages:

### 11.1 Radix UI Integration

```
┌────────────────────────────────────────────────────────────┐
│                     Radix UI Components                     │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│ │ Themes         │ │ Components     │ │ Layout System   │  │
│ └────────────────┘ └────────────────┘ └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Themes**: Provides consistent design tokens and color schemes
- **Components**: Accessible, customizable UI primitives
- **Layout System**: Responsive flex layouts with consistent spacing

### 11.2 Benefits

- **Accessibility**: First-class accessibility support built-in
- **Theming**: Dark/light mode with minimal configuration
- **Consistency**: Uniform design language across all UI elements
- **Responsiveness**: Adapts to different screen sizes and contexts
- **Maintainability**: Reduced CSS complexity and improved component reuse