# Clever - University Library Access Extension

A browser extension that helps students access academic content through their university's library subscriptions, bypassing paywalls for resources they already have access to.

## How it Works

When you encounter a paywall on sites like The Wall Street Journal, New York Times, or The Economist, Clever automatically checks if your university provides free student access to that resource. If access is available, it shows a convenient button to redirect you through your university's library proxy.

## Supported Universities (MVP)

- Boston University (BU)
- Northeastern University (NEU)
- New York University (NYU) 
- University of Connecticut (UConn)
- University of Massachusetts (UMass)
- University of Southern California (USC)

## Supported Sites

- Wall Street Journal
- New York Times
- The Economist
- The Atlantic
- Financial Times
- Washington Post
- Nature
- Science

## Installation

### For Development/Testing

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `clever` folder
5. The Clever extension should now appear in your extensions

### Usage

1. **First Time Setup**: Click the Clever extension icon and select your university
2. **Automatic Detection**: When you visit a site with a paywall, Clever will automatically detect it and show an access button if your university has a subscription
3. **One-Click Access**: Click the "Access via [University] Library" button to be redirected to the free version

## File Structure

```
clever/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles  
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Page content detection
├── content.css           # Content script styles
├── data.csv              # University access data
└── README.md             # This file
```

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension format
- **Responsive Design**: Optimized for standard browser extension dimensions (320px width)
- **Storage**: Uses Chrome's sync storage to remember your university selection
- **Content Detection**: Automatically detects paywalls using keyword and element analysis
- **Cross-Site Support**: Works across all major news and academic sites

## Future Enhancements

- Support for more universities through web scraping
- Additional academic databases and journals
- Improved paywall detection algorithms
- Usage analytics and favorite resources

## Development

The extension is built with vanilla JavaScript, HTML, and CSS. No build process required - just load the files directly into Chrome.

To add more universities or sites, update `master_databases.csv` with the new proxy URLs.