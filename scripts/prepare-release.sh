#!/bin/bash
# Shell script to prepare a complete release
# Usage: ./scripts/prepare-release.sh <version>

set -e

# Parse arguments
VERSION=$1
SKIP_BUILD=${SKIP_BUILD:-false}
SKIP_TESTS=${SKIP_TESTS:-false}

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/prepare-release.sh <version>"
    echo "Example: ./scripts/prepare-release.sh 1.0.0"
    exit 1
fi

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "✗ Invalid version format. Expected: X.Y.Z (e.g., 1.0.0)"
    exit 1
fi

echo "=== Cura Photo Manager Release Preparation ==="
echo ""
echo "Version: $VERSION"

# Detect platform
PLATFORM=$(uname -s)
echo "Platform: $PLATFORM"
echo ""

# Create release directory
RELEASE_DIR="release-$VERSION"
if [ -d "$RELEASE_DIR" ]; then
    echo "Cleaning existing release directory..."
    rm -rf "$RELEASE_DIR"
fi
mkdir -p "$RELEASE_DIR"
echo "✓ Created release directory: $RELEASE_DIR"
echo ""

# Run tests unless skipped
if [ "$SKIP_TESTS" != "true" ]; then
    echo "Running tests..."
    npm test
    echo "✓ All tests passed"
    echo ""
fi

# Build release unless skipped
if [ "$SKIP_BUILD" != "true" ]; then
    echo "Building release artifacts..."
    ./scripts/build-release.sh
    echo ""
fi

# Copy installers to release directory
echo "Copying installers to release directory..."

BUNDLE_DIR="src-tauri/target/release/bundle"
INSTALLERS=()

if [ "$PLATFORM" = "Darwin" ]; then
    # macOS DMG files
    if ls $BUNDLE_DIR/dmg/*.dmg 1> /dev/null 2>&1; then
        for dmg in $BUNDLE_DIR/dmg/*.dmg; do
            FILENAME=$(basename "$dmg")
            # Determine architecture from filename
            if [[ "$FILENAME" == *"x64"* ]]; then
                NEW_NAME="cura-photo-manager_${VERSION}_x64.dmg"
            elif [[ "$FILENAME" == *"aarch64"* ]]; then
                NEW_NAME="cura-photo-manager_${VERSION}_aarch64.dmg"
            else
                NEW_NAME="cura-photo-manager_${VERSION}.dmg"
            fi
            cp "$dmg" "$RELEASE_DIR/$NEW_NAME"
            INSTALLERS+=("$RELEASE_DIR/$NEW_NAME")
            echo "  ✓ Copied DMG: $NEW_NAME"
        done
    fi
elif [ "$PLATFORM" = "Linux" ]; then
    # Linux packages
    if ls $BUNDLE_DIR/deb/*.deb 1> /dev/null 2>&1; then
        for deb in $BUNDLE_DIR/deb/*.deb; do
            NEW_NAME="cura-photo-manager_${VERSION}_amd64.deb"
            cp "$deb" "$RELEASE_DIR/$NEW_NAME"
            INSTALLERS+=("$RELEASE_DIR/$NEW_NAME")
            echo "  ✓ Copied DEB: $NEW_NAME"
        done
    fi
    
    if ls $BUNDLE_DIR/appimage/*.AppImage 1> /dev/null 2>&1; then
        for appimage in $BUNDLE_DIR/appimage/*.AppImage; do
            NEW_NAME="cura-photo-manager_${VERSION}_amd64.AppImage"
            cp "$appimage" "$RELEASE_DIR/$NEW_NAME"
            chmod +x "$RELEASE_DIR/$NEW_NAME"
            INSTALLERS+=("$RELEASE_DIR/$NEW_NAME")
            echo "  ✓ Copied AppImage: $NEW_NAME"
        done
    fi
    
    if ls $BUNDLE_DIR/rpm/*.rpm 1> /dev/null 2>&1; then
        for rpm in $BUNDLE_DIR/rpm/*.rpm; do
            NEW_NAME="cura-photo-manager-${VERSION}-1.x86_64.rpm"
            cp "$rpm" "$RELEASE_DIR/$NEW_NAME"
            INSTALLERS+=("$RELEASE_DIR/$NEW_NAME")
            echo "  ✓ Copied RPM: $NEW_NAME"
        done
    fi
fi

if [ ${#INSTALLERS[@]} -eq 0 ]; then
    echo "✗ No installers found"
    exit 1
fi

echo ""

# Generate checksums
echo "Generating checksums..."

CHECKSUM_FILE="$RELEASE_DIR/checksums.txt"
rm -f "$CHECKSUM_FILE"

for installer in "${INSTALLERS[@]}"; do
    FILENAME=$(basename "$installer")
    HASH=$(shasum -a 256 "$installer" | awk '{print $1}')
    
    echo "  $FILENAME"
    echo "  SHA-256: $HASH"
    
    echo "$HASH  $FILENAME" >> "$CHECKSUM_FILE"
done

echo ""
echo "✓ Checksums saved to checksums.txt"
echo ""

# Generate release notes
echo "Generating release notes..."

RELEASE_NOTES_TEMPLATE=$(cat RELEASE_NOTES_TEMPLATE.md)
RELEASE_NOTES="${RELEASE_NOTES_TEMPLATE//\[VERSION\]/$VERSION}"
RELEASE_NOTES="${RELEASE_NOTES//\[DATE\]/$(date '+%B %d, %Y')}"

# Replace checksums in release notes
for installer in "${INSTALLERS[@]}"; do
    FILENAME=$(basename "$installer")
    HASH=$(shasum -a 256 "$installer" | awk '{print $1}')
    
    if [[ "$FILENAME" == *".dmg" ]] && [[ "$FILENAME" == *"x64"* ]]; then
        RELEASE_NOTES="${RELEASE_NOTES//macOS (Intel):  \[CHECKSUM\]/macOS (Intel):  $HASH}"
    elif [[ "$FILENAME" == *".dmg" ]] && [[ "$FILENAME" == *"aarch64"* ]]; then
        RELEASE_NOTES="${RELEASE_NOTES//macOS (Apple Silicon): \[CHECKSUM\]/macOS (Apple Silicon): $HASH}"
    elif [[ "$FILENAME" == *".deb" ]]; then
        RELEASE_NOTES="${RELEASE_NOTES//Linux (DEB):    \[CHECKSUM\]/Linux (DEB):    $HASH}"
    elif [[ "$FILENAME" == *".AppImage" ]]; then
        RELEASE_NOTES="${RELEASE_NOTES//Linux (AppImage): \[CHECKSUM\]/Linux (AppImage): $HASH}"
    elif [[ "$FILENAME" == *".rpm" ]]; then
        RELEASE_NOTES="${RELEASE_NOTES//Linux (RPM):    \[CHECKSUM\]/Linux (RPM):    $HASH}"
    fi
done

echo "$RELEASE_NOTES" > "$RELEASE_DIR/RELEASE_NOTES.md"
echo "✓ Release notes saved to RELEASE_NOTES.md"
echo ""

# Create testing checklist
echo "Creating testing checklist..."

cat > "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
# Testing Checklist for v$VERSION

## Pre-Release Testing

### $PLATFORM Testing

#### Installation Testing
EOF

if [ "$PLATFORM" = "Darwin" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Test DMG on Intel Mac
- [ ] Test DMG on Apple Silicon Mac
- [ ] Verify drag-to-Applications works
- [ ] Verify no Gatekeeper warnings (if notarized)
- [ ] Test application launch from Applications
- [ ] Verify app signature: \`codesign -dv --verbose=4 "Cura Photo Manager.app"\`
- [ ] Test uninstallation (drag to Trash)
EOF
elif [ "$PLATFORM" = "Linux" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Test DEB on Ubuntu 22.04
- [ ] Test DEB on Ubuntu 24.04
- [ ] Test RPM on Fedora 38
- [ ] Test RPM on Fedora 40
- [ ] Test AppImage on Ubuntu
- [ ] Test AppImage on Fedora
- [ ] Test AppImage on Arch Linux
- [ ] Verify desktop entry created
- [ ] Verify application menu integration
- [ ] Test uninstallation (package manager)
EOF
fi

cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF

#### Functional Testing
- [ ] Application launches successfully
- [ ] No error dialogs on first launch
- [ ] Folder selection works
- [ ] Image scanning works
- [ ] Thumbnails generate correctly
- [ ] Metadata extraction works
- [ ] AI classification runs
- [ ] Search functionality works
- [ ] Settings persist across restarts
- [ ] Google Drive authentication works (if configured)
- [ ] Cloud sync uploads files (if configured)

#### Auto-Update Testing
EOF

if [ "$PLATFORM" = "Darwin" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Update check runs on startup
- [ ] Update notification appears (if update available)
- [ ] Update download works
- [ ] Update installation works
- [ ] Application restarts after update
EOF
elif [ "$PLATFORM" = "Linux" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Note: Auto-update not supported on Linux
- [ ] Manual update instructions are clear
EOF
fi

cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF

#### Performance Testing
- [ ] Application starts within 3 seconds
- [ ] Scanning 1000 images completes in reasonable time
- [ ] UI remains responsive during operations
- [ ] Memory usage is reasonable (<500MB idle)
- [ ] No memory leaks during extended use

#### Clean System Testing
EOF

if [ "$PLATFORM" = "Darwin" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Test on clean macOS 13 (Ventura)
- [ ] Test on clean macOS 14 (Sonoma)
- [ ] Test on clean macOS 15 (Sequoia)
- [ ] Verify all dependencies are bundled
EOF
elif [ "$PLATFORM" = "Linux" ]; then
    cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF
- [ ] Test on clean Ubuntu 22.04 VM
- [ ] Test on clean Ubuntu 24.04 VM
- [ ] Test on clean Fedora 38 VM
- [ ] Test on clean Fedora 40 VM
- [ ] Verify all dependencies are bundled (DEB/RPM)
- [ ] Verify AppImage runs without system dependencies
EOF
fi

cat >> "$RELEASE_DIR/TESTING_CHECKLIST.md" << EOF

## Post-Installation Verification

### Data Integrity
- [ ] Database created correctly
- [ ] Settings file created
- [ ] Thumbnail cache directory created
- [ ] Log files created

### Security
- [ ] No sensitive data in logs
- [ ] Credentials stored securely (keychain)
- [ ] File permissions are correct

### Documentation
- [ ] README is accurate
- [ ] Installation instructions work
- [ ] Troubleshooting guide is helpful

## Release Checklist

### Pre-Release
- [ ] All tests passed
- [ ] Version numbers updated
- [ ] Release notes completed
- [ ] Checksums generated
- [ ] Installers signed (macOS)
- [ ] Documentation updated

### Release
- [ ] Create GitHub release
- [ ] Upload all installers
- [ ] Upload checksums
- [ ] Publish release notes
- [ ] Tag repository

### Post-Release
- [ ] Update website download links
- [ ] Update auto-update manifest
- [ ] Announce on social media
- [ ] Monitor for issues
- [ ] Respond to user feedback

## Notes

Date: $(date '+%Y-%m-%d %H:%M:%S')
Version: $VERSION
Platform: $PLATFORM
Tester: _______________

EOF

echo "✓ Testing checklist saved to TESTING_CHECKLIST.md"
echo ""

# Create installation test script
cat > "$RELEASE_DIR/test-installation.sh" << 'EOF'
#!/bin/bash
# Installation Test Script
# Run this on a clean system to verify the installer

echo "=== Cura Photo Manager Installation Test ==="
echo ""

# Check system requirements
echo "Checking system requirements..."

PLATFORM=$(uname -s)
echo "✓ Platform: $PLATFORM"

if [ "$PLATFORM" = "Darwin" ]; then
    OS_VERSION=$(sw_vers -productVersion)
    echo "✓ macOS version: $OS_VERSION"
    
    MEMORY=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    if (( $(echo "$MEMORY < 4" | bc -l) )); then
        echo "⚠ Less than 4 GB RAM detected ($MEMORY GB)"
    else
        echo "✓ RAM: $MEMORY GB"
    fi
elif [ "$PLATFORM" = "Linux" ]; then
    OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
    echo "✓ Linux distribution: $OS_INFO"
    
    MEMORY=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY" -lt 4 ]; then
        echo "⚠ Less than 4 GB RAM detected ($MEMORY GB)"
    else
        echo "✓ RAM: $MEMORY GB"
    fi
fi

DISK=$(df -h . | awk 'NR==2 {print $4}')
echo "✓ Free disk space: $DISK"

echo ""
echo "=== Installation Instructions ==="
echo ""

if [ "$PLATFORM" = "Darwin" ]; then
    echo "1. Open the DMG file"
    echo "2. Drag 'Cura Photo Manager' to Applications folder"
    echo "3. Launch from Applications"
    echo "4. Verify all features work"
    echo "5. Fill out the testing checklist"
elif [ "$PLATFORM" = "Linux" ]; then
    echo "For DEB (Debian/Ubuntu):"
    echo "  sudo dpkg -i cura-photo-manager_*.deb"
    echo ""
    echo "For RPM (Fedora/RHEL):"
    echo "  sudo rpm -i cura-photo-manager-*.rpm"
    echo ""
    echo "For AppImage:"
    echo "  chmod +x cura-photo-manager_*.AppImage"
    echo "  ./cura-photo-manager_*.AppImage"
    echo ""
    echo "Then:"
    echo "1. Launch the application"
    echo "2. Verify all features work"
    echo "3. Fill out the testing checklist"
fi

echo ""
echo "Press Enter to continue..."
read
EOF

chmod +x "$RELEASE_DIR/test-installation.sh"
echo "✓ Installation test script saved to test-installation.sh"
echo ""

# Display summary
echo "=== Release Preparation Complete ==="
echo ""
echo "Release Directory: $RELEASE_DIR"
echo ""
echo "Contents:"
ls -lh "$RELEASE_DIR" | tail -n +2 | awk '{printf "  %s (%s)\n", $9, $5}'
echo ""

echo "=== Next Steps ==="
echo ""
echo "1. Review RELEASE_NOTES.md and update with actual changes"
echo "2. Test installers using TESTING_CHECKLIST.md"

if [ "$PLATFORM" = "Darwin" ]; then
    echo "3. Sign and notarize the DMG files"
    echo "4. Staple notarization ticket to DMG"
fi

echo "5. Create GitHub release and upload files"
echo "6. Update auto-update manifest"
echo "7. Announce the release"
echo ""

echo "Release preparation completed successfully! 🎉"
