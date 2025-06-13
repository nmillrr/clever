#!/bin/bash
# Academic Access Extension build script for Chrome Web Store submission

# Display header
echo "========================================"
echo "Academic Access Extension Build Script"
echo "========================================"
echo

# Set variables
BUILD_DIR="dist"
RELEASE_DIR="release"
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
RELEASE_FILE="academic-access-extension-v$VERSION.zip"

# Check if necessary tools are installed
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required but not installed. Aborting."; exit 1; }

# Cleanup previous builds
echo "Cleaning up previous builds..."
rm -rf $BUILD_DIR $RELEASE_DIR
mkdir -p $RELEASE_DIR

# Install dependencies
echo "Installing dependencies..."
npm install

# Run linting (if applicable)
# echo "Running linting..."
# npm run lint

# Run tests
echo "Running tests..."
npm test || { echo "Tests failed. Aborting build."; exit 1; }

# Build the extension
echo "Building extension..."
npm run build

# Verify manifest.json is in the build directory
if [ ! -f "$BUILD_DIR/manifest.json" ]; then
    echo "manifest.json not found in build directory. Check your webpack configuration."
    exit 1
fi

# Check for console.log statements
echo "Checking for console.log statements..."
grep -r "console.log" $BUILD_DIR && { 
    echo "Warning: console.log statements found in production build."
    echo "Do you want to continue? (y/n)"
    read answer
    if [ "$answer" != "y" ]; then
        echo "Build aborted."
        exit 1
    fi
}

# Create ZIP file for Chrome Web Store
echo "Creating ZIP file for Chrome Web Store..."
cd $BUILD_DIR
zip -r ../$RELEASE_DIR/$RELEASE_FILE *
cd ..

echo
echo "========================================"
echo "Build completed successfully!"
echo "Release file created at: $RELEASE_DIR/$RELEASE_FILE"
echo "Version: $VERSION"
echo
echo "Next steps:"
echo "1. Review the SUBMISSION_CHECKLIST.md file"
echo "2. Upload the ZIP file to the Chrome Web Store"
echo "3. Complete the store listing information"
echo "========================================"