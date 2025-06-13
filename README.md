# Academic Access Extension

![Academic Access Extension](assets/banner.png)

A browser extension that detects paywalled academic and media articles and checks whether your university provides access via a library proxy. If access is available, it redirects you to the proxied version of the article. The extension also provides fallback to open access repositories when institutional access is unavailable.

## Features

- **Paywall Detection**: Automatically identifies paywalled content across major academic publishers and news sites.
- **Institutional Access**: Seamlessly redirects to your university's proxy server for accessing subscribed content.
- **Multiple Proxy Support**: Works with various proxy systems (EZProxy, prefix URLs, domain suffixes, etc.).
- **Open Access Fallback**: Searches for free, legal alternatives via Unpaywall when institutional access is unavailable.
- **Article Metadata Extraction**: Identifies DOIs, PMIDs, arXiv IDs, and other academic identifiers.
- **Access History**: Keeps track of your accessed articles for easy reference.
- **Multi-Institution Support**: Configure multiple institutional affiliations and easily switch between them.

## Supported Publishers

The extension works with a wide range of academic publishers and media sites, including:

### Academic Publishers
- JSTOR
- Elsevier (ScienceDirect)
- Springer
- Wiley
- Taylor & Francis
- Oxford University Press
- SAGE
- IEEE Xplore
- ACM Digital Library
- Nature
- and more...

### Media Publications
- The Economist
- Wall Street Journal
- New York Times
- Financial Times
- Harvard Business Review
- Washington Post
- and more...

## Installation

### From Browser Extension Store

*Coming soon to Chrome Web Store, Firefox Add-ons, and Edge Add-ons.*

### Manual Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/academic-access-extension.git
   cd academic-access-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
   This will install all required dependencies, including Radix UI for theming.

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in your browser:
   - **Chrome/Edge**:
     - Go to `chrome://extensions/` or `edge://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked" and select the `dist` folder

   - **Firefox**:
     - Go to `about:debugging#/runtime/this-firefox`
     - Click "Load Temporary Add-on..."
     - Select any file in the `dist` folder

## Usage

1. After installation, click on the extension icon in your browser toolbar.
2. Select your institution from the dropdown or enter custom proxy details.
3. When you encounter a paywalled article, the extension will:
   - Display a notification if institutional access is available
   - Provide a button to redirect through your institution's proxy
   - Offer alternative open access sources if available

## Development

### Project Structure

```
academic-access-extension/
├── src/
│   ├── modules/             # Core functionality modules
│   │   ├── paywall-detector.js
│   │   ├── identifier-extractor.js
│   │   ├── proxy-redirect.js
│   │   └── unpaywall-service.js
│   ├── content-scripts/     # Content scripts injected into pages
│   │   ├── content.js
│   │   ├── content.css
│   │   └── access-button.js
│   ├── popup/               # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── background.js        # Background service worker
├── assets/                  # Images and other assets
├── tests/                   # Unit and integration tests
├── manifest.json            # Extension manifest
└── package.json             # Project dependencies and scripts
```

### UI Framework

This extension uses [Radix UI](https://www.radix-ui.com/themes) for consistent, accessible UI components. Radix UI provides:

- Professionally designed, customizable UI components
- First-class accessibility support
- Responsive design system
- Dark/light mode support
- Seamless theming capabilities

### Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

### Testing

The project uses Jest for unit and integration testing:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/proxy-url-generator.test.js

# Run tests with coverage report
npm test -- --coverage
```

## Configuration

### Configuring Your Institution

1. Click the extension icon in your browser toolbar.
2. Select your institution from the dropdown list of common universities.
3. If your institution isn't listed, select "Custom Institution..." and enter:
   - Institution Name
   - Proxy URL or Suffix

### Proxy Format Examples

- **Prefix-style proxies** (most common):
  ```
  https://proxy.university.edu/login?url=
  ```

- **Suffix-style proxies**:
  ```
  .proxy.university.edu
  ```

- **Complex pattern proxies**:
  ```
  https://login.university.edu?qurl={url}
  ```

### Extension Settings

Access additional settings through the options page:

- **Auto-redirect**: Automatically redirect to proxied version when paywalls are detected
- **Open Access Check**: Enable/disable searching for open access alternatives
- **Notifications**: Customize notification behavior
- **History**: Manage access history and export citations

## Privacy

The extension:
- Does not collect any personal data
- Only stores your institutional settings and access history locally
- Makes API requests to Unpaywall for finding open access alternatives
- Does not track your browsing history outside of academic publisher sites

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Unpaywall](https://unpaywall.org/) for their open access API
- All the universities and libraries providing proxy access to academic resources
- The academic community for promoting open access to research