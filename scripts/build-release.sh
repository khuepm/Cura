#!/bin/bash
# Shell script to build release artifacts for macOS and Linux
# Usage: ./scripts/build-release.sh

set -e

echo "=== Cura Photo Manager Release Build Script ==="
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Building version: $VERSION"
echo ""

# Detect platform
PLATFORM=$(uname -s)
echo "Platform: $PLATFORM"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js: $NODE_VERSION"
else
    echo "✗ Node.js not found. Please install Node.js 18 or later."
    exit 1
fi

# Check Rust
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✓ Rust: $RUST_VERSION"
else
    echo "✗ Rust not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

echo ""

# Platform-specific dependency checks
if [ "$PLATFORM" = "Linux" ]; then
    echo "Checking Linux dependencies..."
    
    # Check for required libraries
    MISSING_DEPS=()
    
    if ! pkg-config --exists webkit2gtk-4.0; then
        MISSING_DEPS+=("webkit2gtk-4.0")
    fi
    
    if ! pkg-config --exists gtk+-3.0; then
        MISSING_DEPS+=("gtk+-3.0")
    fi
    
    if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
        echo "✗ Missing dependencies: ${MISSING_DEPS[*]}"
        echo ""
        echo "Install them with:"
        echo "  Ubuntu/Debian: sudo apt-get install libwebkit2gtk-4.0-dev libgtk-3-dev"
        echo "  Fedora: sudo dnf install webkit2gtk4.0-devel gtk3-devel"
        echo "  Arch: sudo pacman -S webkit2gtk gtk3"
        exit 1
    fi
    
    echo "✓ All Linux dependencies found"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Build release
echo "Building release artifacts..."
echo "This may take several minutes..."
npm run tauri build
echo "✓ Build completed"
echo ""

# Generate checksums
echo "Generating checksums..."

BUNDLE_DIR="src-tauri/target/release/bundle"
CHECKSUM_FILE="checksums-${PLATFORM,,}-${VERSION}.txt"

# Remove old checksum file if exists
rm -f "$CHECKSUM_FILE"

# Find all installers
INSTALLERS=()

if [ "$PLATFORM" = "Darwin" ]; then
    # macOS DMG files
    if ls $BUNDLE_DIR/dmg/*.dmg 1> /dev/null 2>&1; then
        INSTALLERS+=($BUNDLE_DIR/dmg/*.dmg)
    fi
elif [ "$PLATFORM" = "Linux" ]; then
    # Linux packages
    if ls $BUNDLE_DIR/deb/*.deb 1> /dev/null 2>&1; then
        INSTALLERS+=($BUNDLE_DIR/deb/*.deb)
    fi
    if ls $BUNDLE_DIR/appimage/*.AppImage 1> /dev/null 2>&1; then
        INSTALLERS+=($BUNDLE_DIR/appimage/*.AppImage)
    fi
    if ls $BUNDLE_DIR/rpm/*.rpm 1> /dev/null 2>&1; then
        INSTALLERS+=($BUNDLE_DIR/rpm/*.rpm)
    fi
fi

if [ ${#INSTALLERS[@]} -eq 0 ]; then
    echo "✗ No installers found"
    exit 1
fi

# Generate checksums
for installer in "${INSTALLERS[@]}"; do
    FILENAME=$(basename "$installer")
    HASH=$(shasum -a 256 "$installer" | awk '{print $1}')
    
    echo "  $FILENAME"
    echo "  SHA-256: $HASH"
    echo ""
    
    echo "$HASH  $FILENAME" >> "$CHECKSUM_FILE"
done

echo "✓ Checksums saved to $CHECKSUM_FILE"
echo ""

# Display build artifacts
echo "=== Build Artifacts ==="
echo ""
echo "Installers:"
for installer in "${INSTALLERS[@]}"; do
    FILENAME=$(basename "$installer")
    SIZE=$(du -h "$installer" | awk '{print $1}')
    echo "  $FILENAME ($SIZE)"
    echo "  Location: $installer"
    echo ""
done

echo "Checksums:"
echo "  $CHECKSUM_FILE"
echo ""

# Display next steps
echo "=== Next Steps ==="
echo ""
if [ "$PLATFORM" = "Darwin" ]; then
    echo "1. Test the DMG on clean macOS systems (Intel and Apple Silicon)"
    echo "2. Sign the app with your Apple Developer ID"
    echo "3. Notarize the app with Apple"
    echo "4. Staple the notarization ticket to the DMG"
    echo "5. Upload to release server or GitHub Releases"
    echo "6. Update the auto-update manifest"
    echo "7. Announce the release"
elif [ "$PLATFORM" = "Linux" ]; then
    echo "1. Test the packages on different Linux distributions"
    echo "2. Upload to release server or GitHub Releases"
    echo "3. Consider publishing to package repositories (Snap, Flatpak, AUR)"
    echo "4. Update documentation with installation instructions"
    echo "5. Announce the release"
fi
echo ""

echo "Build completed successfully! 🎉"
