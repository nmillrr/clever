# Academic Access Extension: Data Structure Specification

## 1. Overview

This document defines the data structures used to store user configuration, institutional settings, access history, and other persistent data for the Academic Access Extension. The extension uses browser storage mechanisms (Local Storage and IndexedDB) to maintain state across browser sessions.

## 2. Storage Mechanisms

### 2.1. Browser Local Storage
- Used for small, frequently accessed configuration data
- Limited to approximately 5MB per origin
- Synchronous access
- Key-value pairs (strings only)

### 2.2. IndexedDB
- Used for larger datasets (access history, article metadata)
- Supports structured data with indexes
- Asynchronous API
- Transaction-based operations
- Can store complex JavaScript objects

## 3. Data Schema

### 3.1. User Configuration (Local Storage)

```json
{
  "user": {
    "id": "unique-user-id",
    "createdAt": "2023-06-13T12:00:00Z",
    "lastLogin": "2023-06-13T12:00:00Z",
    "preferences": {
      "enableAutoRedirect": true,
      "notificationDuration": 5000,
      "notificationPosition": "bottom-right",
      "defaultCitationFormat": "apa",
      "theme": "light",
      "enableAnalytics": false,
      "openAccessPriority": ["unpaywall", "oadoi", "arxiv"]
    }
  }
}
```

### 3.2. Institutions Configuration (Local Storage)

```json
{
  "institutions": {
    "active": "inst-123",
    "list": [
      {
        "id": "inst-123",
        "name": "University of Example",
        "domain": "example.edu",
        "logoUrl": "https://example.edu/logo.png",
        "proxy": {
          "type": "ezproxy",
          "url": "https://proxy.example.edu/login?url=",
          "pattern": "https://proxy.example.edu/login?url={url}",
          "suffixPattern": ".example.edu.proxy.example.edu",
          "requiresAuth": true,
          "authMethod": "shibboleth"
        },
        "additionalProxies": [
          {
            "type": "alternative",
            "url": "https://alt-proxy.example.edu/",
            "pattern": "https://alt-proxy.example.edu/{url}"
          }
        ],
        "authStatus": {
          "isAuthenticated": true,
          "lastAuthenticated": "2023-06-13T12:00:00Z",
          "expiresAt": "2023-06-13T14:00:00Z"
        }
      },
      {
        "id": "inst-456",
        "name": "Another University",
        "domain": "another.edu",
        "logoUrl": "https://another.edu/logo.png",
        "proxy": {
          "type": "ezproxy",
          "url": "https://proxy.another.edu/login?url=",
          "pattern": "https://proxy.another.edu/login?url={url}",
          "suffixPattern": ".another.edu.proxy.another.edu",
          "requiresAuth": true,
          "authMethod": "oauth"
        },
        "authStatus": {
          "isAuthenticated": false,
          "lastAuthenticated": null,
          "expiresAt": null
        }
      }
    ],
    "custom": {
      "id": "custom-proxy",
      "name": "Custom Proxy Configuration",
      "proxy": {
        "type": "custom",
        "pattern": "{custom-pattern}",
        "notes": "User-defined proxy configuration"
      }
    }
  }
}
```

### 3.3. Access Tokens (Local Storage - Encrypted)

```json
{
  "tokens": {
    "inst-123": {
      "type": "bearer",
      "value": "ENCRYPTED_TOKEN_VALUE",
      "expiresAt": "2023-06-13T14:00:00Z"
    },
    "inst-456": {
      "type": "cookie",
      "value": "ENCRYPTED_COOKIE_VALUE",
      "expiresAt": "2023-06-14T12:00:00Z"
    }
  }
}
```

### 3.4. Recent URL Cache (Local Storage)

```json
{
  "recentUrls": {
    "https://example.com/article/12345": {
      "checkedAt": "2023-06-13T12:00:00Z",
      "accessStatus": "available",
      "viaInstitution": "inst-123",
      "proxiedUrl": "https://proxy.example.edu/login?url=https://example.com/article/12345",
      "doi": "10.1234/example.12345",
      "expiresAt": "2023-06-13T13:00:00Z"
    },
    "https://publisher.com/journal/article/67890": {
      "checkedAt": "2023-06-13T11:30:00Z",
      "accessStatus": "unavailable",
      "checkedInstitutions": ["inst-123", "inst-456"],
      "openAccessUrl": "https://arxiv.org/pdf/2101.12345.pdf",
      "doi": "10.5678/publisher.67890",
      "expiresAt": "2023-06-13T12:30:00Z"
    }
  }
}
```

### 3.5. Access History Database (IndexedDB)

#### Object Stores

1. **articles**
```typescript
interface Article {
  id: string;               // Primary key (URL or DOI)
  url: string;              // Original article URL
  title: string;            // Article title
  authors: string[];        // List of authors
  journal: string;          // Journal name
  year: number;             // Publication year
  doi: string;              // Digital Object Identifier
  abstract: string;         // Abstract text
  keywords: string[];       // Keywords
  accessedAt: Date;         // When the article was accessed
  via: string;              // Access method (proxy, open access)
  institutionId: string;    // Which institution provided access
  proxiedUrl: string;       // URL used to access
  pdfUrl: string;           // Direct PDF link if available
  openAccessVersion: string; // URL to open access version
  citationData: Object;     // Structured citation data
  collectionIds: string[];  // User collections this article belongs to
}
```

2. **accessEvents**
```typescript
interface AccessEvent {
  id: string;               // Auto-generated primary key
  articleId: string;        // Reference to article
  timestamp: Date;          // When the event occurred
  eventType: string;        // Type of event (visit, download, citation)
  institutionId: string;    // Institution used for access
  proxiedUrl: string;       // URL used
  success: boolean;         // Whether access was successful
  failureReason: string;    // If failed, why
  ipAddress: string;        // User's IP at time of access (if tracking enabled)
  userAgent: string;        // Browser info (if tracking enabled)
}
```

3. **collections**
```typescript
interface Collection {
  id: string;               // Primary key
  name: string;             // Collection name
  description: string;      // Collection description
  createdAt: Date;          // Creation date
  updatedAt: Date;          // Last modified date
  articleIds: string[];     // Articles in this collection
  color: string;            // User-assigned color
  icon: string;             // User-assigned icon
}
```

4. **publishers**
```typescript
interface Publisher {
  id: string;               // Primary key
  name: string;             // Publisher name
  domains: string[];        // Associated domains
  articlePattern: string;   // Regex to identify article pages
  paywallPattern: string;   // Regex to identify paywall elements
  logoUrl: string;          // Publisher logo
  detectionRules: Object;   // Custom rules for this publisher
}
```

5. **institutionSubscriptions**
```typescript
interface InstitutionSubscription {
  id: string;               // Primary key
  institutionId: string;    // Reference to institution
  publisherId: string;      // Reference to publisher
  journalName: string;      // Name of journal
  coverage: {               // Coverage details
    startYear: number;
    endYear: number;
    startVolume: number;
    endVolume: number;
  },
  lastVerified: Date;       // When subscription was last confirmed
  confidence: number;       // Confidence level (0-1)
}
```

### 3.6. Database Indexes

1. **articles**
   - `url`: Non-unique index
   - `doi`: Non-unique index
   - `accessedAt`: Non-unique index
   - `institutionId`: Non-unique index
   - `collectionIds`: Multi-entry index

2. **accessEvents**
   - `articleId`: Non-unique index
   - `timestamp`: Non-unique index
   - `institutionId`: Non-unique index

3. **publishers**
   - `domains`: Multi-entry index

4. **institutionSubscriptions**
   - `institutionId`: Non-unique index
   - `publisherId`: Non-unique index
   - `[institutionId, publisherId]`: Compound index

## 4. Data Lifecycle Management

### 4.1. Data Expiration

- **Recent URL Cache**: Entries expire after 1 hour (configurable)
- **Access Tokens**: Expire based on institution policies
- **Access Events**: Retained for 90 days by default (configurable)

### 4.2. Data Sync (if enabled)

```json
{
  "sync": {
    "enabled": true,
    "lastSynced": "2023-06-13T12:00:00Z",
    "devices": [
      {
        "id": "device-123",
        "name": "Work Browser",
        "lastActive": "2023-06-13T12:00:00Z"
      }
    ],
    "syncItems": [
      "preferences",
      "institutions",
      "collections"
    ]
  }
}
```

### 4.3. Export/Import Format

```json
{
  "version": "1.0.0",
  "exportedAt": "2023-06-13T12:00:00Z",
  "user": { /* user config */ },
  "institutions": { /* institutions config */ },
  "collections": [ /* collections data */ ],
  "articles": [ /* articles data */ ]
}
```

## 5. Storage Quotas and Optimization

### 5.1. Storage Limits

- Local Storage: 5MB limit
- IndexedDB: Browser-dependent, typically 50MB-250MB

### 5.2. Optimization Strategies

1. **Lazy Loading**
   - Load only essential data on startup
   - Load additional data on demand

2. **Data Pruning**
   - Remove oldest access events when approaching storage limits
   - Implement configurable retention policies

3. **Compression**
   - Compress large text fields (abstracts, etc.)
   - Use minimal representation for common fields

4. **Caching Strategy**
   - Cache frequently accessed data in memory
   - Implement LRU (Least Recently Used) cache eviction

## 6. Migration Strategy

### 6.1. Version Management

```json
{
  "schemaVersion": "1.2.0",
  "lastMigration": "2023-06-01T12:00:00Z",
  "migrationHistory": [
    {
      "from": "1.0.0",
      "to": "1.1.0",
      "date": "2023-05-01T12:00:00Z"
    },
    {
      "from": "1.1.0",
      "to": "1.2.0",
      "date": "2023-06-01T12:00:00Z"
    }
  ]
}
```

### 6.2. Migration Process

1. Check current schema version against extension version
2. If mismatch, execute migration scripts in sequence
3. Update schema version after successful migration
4. Provide fallback for failed migrations

## 7. Security Considerations

### 7.1. Sensitive Data Handling

- Encrypt all authentication tokens before storage
- Use browser's storage.session for temporary sensitive data
- Never store raw passwords

### 7.2. Data Segregation

- Use separate storage areas for different security levels
- Implement principle of least privilege for data access

## 8. Example Queries

### 8.1. Finding Articles by DOI

```javascript
const getArticleByDOI = async (doi) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['articles'], 'readonly');
    const store = transaction.objectStore('articles');
    const index = store.index('doi');
    const request = index.get(doi);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
```

### 8.2. Getting Recent Access History

```javascript
const getRecentAccess = async (limit = 10) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['accessEvents'], 'readonly');
    const store = transaction.objectStore('accessEvents');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    
    const results = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
```

### 8.3. Checking Institution Access for Publisher

```javascript
const checkInstitutionAccess = async (institutionId, publisherId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['institutionSubscriptions'], 'readonly');
    const store = transaction.objectStore('institutionSubscriptions');
    const index = store.index('institutionId, publisherId');
    const request = index.get([institutionId, publisherId]);
    
    request.onsuccess = (event) => {
      resolve(event.target.result !== undefined);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
```