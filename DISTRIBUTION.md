# Distribution Guide

This document provides instructions for building and distributing Cura Photo Manager installers.

## Quick Links

- **[Release Process Guide](docs/RELEASE_PROCESS.md)** - Complete step-by-step release process
- **[Release Artifacts Guide](docs/RELEASE_ARTIFACTS.md)** - Information about installers and packages
- **[Code Signing Guide](CODE_SIGNING.md)** - Code signing setup and procedures
- **[Auto-Update Guide](AUTO_UPDATE.md)** - Auto-update configuration

## Quick Start

To create a complete release with all artifacts:

**Windows:**
```powershell
.\scripts\prepare-release.ps1 -Version "1.0.0"
```

**macOS/Linux:**
```bash
./scripts/prepare-release.sh 1.0.0
```

This will:
1. Run all tests
2. Build release artifacts
3. Generate checksums
4. Create release notes
5. Create testing checklist

## Prerequisites

### All Platforms

1. **Node.js and npm**
   - Install Node.js 18 or later
   - Verify: `node --version` and `npm --version`

2. **Rust**
   - Install from https://rustup.rs/
   - Verify: `rustc --version` and `cargo --version`

3. **Project Dependencies**
   ```bash
   npm install
   ```

### Windows-Specific

1. **Visual Studio Build Tools**
   - Install Visual Studio 2019 or later with C++ build tools
   - Or install Build Tools for Visual Studio separately

2. **WiX Toolset** (for .msi installers)
   - Download from https://wixtoolset.org/
   - Add to PATH

3. **NSIS** (for .exe installers)
   - Download from https://nsis.sourceforge.io/
   - Add to PATH

### macOS-Specific

1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Apple Developer Account** (for distribution)
   - Required for code signing and notarization
   - Enroll at https://developer.apple.com/

### Linux-Specific

1. **Build Dependencies**
   ```bash
   # Debian/Ubuntu
   sudo apt-get install libwebkit2gtk-4.0-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev

   # Fedora
   sudo dnf install webkit2gtk4.0-devel \
     openssl-devel \
     curl \
     wget \
     file \
     libappindicator-gtk3-devel \
     librsvg2-devel

   # Arch
   sudo pacman -S webkit2gtk \
     base-devel \
     curl \
     wget \
     file \
     openssl \
     appmenu-gtk-module \
     gtk3 \
     libappindicator-gtk3 \
     librsvg
   ```

## Building Release Artifacts

### Build Command

```bash
npm run tauri build
```

This command:
1. Builds the Next.js frontend in production mode
2. Compiles the Rust backend with optimizations
3. Creates platform-specific installers
4. Generates checksums for verification

### Build Output Locations

**Windows:**
- MSI installer: `src-tauri/target/release/bundle/msi/cura-photo-manager_0.1.0_x64_en-US.msi`
- NSIS installer: `src-tauri/target/release/bundle/nsis/cura-photo-manager_0.1.0_x64-setup.exe`
- Portable executable: `src-tauri/target/release/cura-photo-manager.exe`

**macOS:**
- DMG: `src-tauri/target/release/bundle/dmg/cura-photo-manager_0.1.0_x64.dmg`
- App bundle: `src-tauri/target/release/bundle/macos/Cura Photo Manager.app`
- Apple Silicon DMG: `src-tauri/target/release/bundle/dmg/cura-photo-manager_0.1.0_aarch64.dmg`

**Linux:**
- Debian package: `src-tauri/target/release/bundle/deb/cura-photo-manager_0.1.0_amd64.deb`
- AppImage: `src-tauri/target/release/bundle/appimage/cura-photo-manager_0.1.0_amd64.AppImage`
- RPM package: `src-tauri/target/release/bundle/rpm/cura-photo-manager-0.1.0-1.x86_64.rpm`

## Generating Checksums

Create checksums for installer verification:

### Windows (PowerShell)

```powershell
# SHA-256 checksums
Get-FileHash -Algorithm SHA256 src-tauri/target/release/bundle/msi/*.msi | Format-List
Get-FileHash -Algorithm SHA256 src-tauri/target/release/bundle/nsis/*.exe | Format-List

# Save to file
Get-FileHash -Algorithm SHA256 src-tauri/target/release/bundle/msi/*.msi | 
  Select-Object Hash, Path | 
  Out-File -FilePath checksums-windows.txt
```

### macOS/Linux

```bash
# SHA-256 checksums
shasum -a 256 src-tauri/target/release/bundle/dmg/*.dmg
shasum -a 256 src-tauri/target/release/bundle/deb/*.deb
shasum -a 256 src-tauri/target/release/bundle/appimage/*.AppImage

# Save to file
shasum -a 256 src-tauri/target/release/bundle/**/* > checksums.txt
```

## Release Notes Template

Create a `RELEASE_NOTES.md` file for each version:

```markdown
# Cura Photo Manager v1.0.0

Release Date: January 31, 2026

## What's New

### Features
- AI-powered image classification with CLIP and MobileNet models
- Automatic metadata extraction from EXIF data
- Dual thumbnail generation for optimal performance
- Natural language search with semantic similarity
- Google Drive cloud synchronization
- Auto-update mechanism

### Improvements
- Optimized thumbnail generation with caching
- Parallel image processing using all CPU cores
- Virtual scrolling for large photo collections
- Responsive UI with dark mode support

### Bug Fixes
- Fixed orientation handling for rotated images
- Improved error handling for corrupt files
- Fixed memory leaks in AI worker threads

## System Requirements

### Windows
- Windows 10 or later (64-bit)
- 4 GB RAM minimum, 8 GB recommended
- 500 MB free disk space
- WebView2 runtime (automatically installed)

### macOS
- macOS 10.13 (High Sierra) or later
- 4 GB RAM minimum, 8 GB recommended
- 500 MB free disk space
- Apple Silicon and Intel supported

### Linux
- Ubuntu 20.04 or later / Fedora 35 or later / Arch Linux
- 4 GB RAM minimum, 8 GB recommended
- 500 MB free disk space
- WebKit2GTK 4.0 or later

## Installation

### Windows
1. Download `cura-photo-manager_1.0.0_x64-setup.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS
1. Download `cura-photo-manager_1.0.0_x64.dmg` (Intel) or `cura-photo-manager_1.0.0_aarch64.dmg` (Apple Silicon)
2. Open the DMG file
3. Drag "Cura Photo Manager" to Applications folder
4. Launch from Applications

### Linux
**Debian/Ubuntu:**
```bash
sudo dpkg -i cura-photo-manager_1.0.0_amd64.deb
```

**Fedora/RHEL:**
```bash
sudo rpm -i cura-photo-manager-1.0.0-1.x86_64.rpm
```

**AppImage:**
```bash
chmod +x cura-photo-manager_1.0.0_amd64.AppImage
./cura-photo-manager_1.0.0_amd64.AppImage
```

## Checksums

Verify your download integrity:

```
SHA-256 Checksums:
Windows (EXE): [CHECKSUM_HERE]
Windows (MSI): [CHECKSUM_HERE]
macOS (Intel): [CHECKSUM_HERE]
macOS (Apple Silicon): [CHECKSUM_HERE]
Linux (DEB): [CHECKSUM_HERE]
Linux (AppImage): [CHECKSUM_HERE]
```

## Known Issues

- Auto-update not supported on Linux (manual updates required)
- HEIC support requires additional codecs on some Linux distributions
- First-time AI model loading may take 30-60 seconds

## Upgrade Notes

If upgrading from a previous version:
1. Your database and settings will be preserved
2. Thumbnail cache will be regenerated if needed
3. AI models will be re-downloaded if model version changed

## Support

- Documentation: https://docs.cura-photo-manager.com
- Issues: https://github.com/cura/photo-manager/issues
- Email: support@cura-photo-manager.com

## License

Copyright © 2026 Cura Photo Manager Team. All rights reserved.
```

## Testing Installers

### Pre-Release Testing Checklist

Test each installer on a clean system:

#### Windows Testing
- [ ] Install on Windows 10
- [ ] Install on Windows 11
- [ ] Verify Start Menu shortcut created
- [ ] Verify Desktop shortcut created
- [ ] Test uninstaller
- [ ] Verify no SmartScreen warnings (if EV signed)
- [ ] Test auto-update mechanism
- [ ] Verify app data directory created correctly

#### macOS Testing
- [ ] Install on Intel Mac
- [ ] Install on Apple Silicon Mac
- [ ] Verify no Gatekeeper warnings (if notarized)
- [ ] Test drag-to-Applications installation
- [ ] Verify app signature: `codesign -dv --verbose=4 "Cura Photo Manager.app"`
- [ ] Test auto-update mechanism
- [ ] Verify app data directory created correctly

#### Linux Testing
- [ ] Install on Ubuntu 22.04
- [ ] Install on Fedora 38
- [ ] Test AppImage on multiple distributions
- [ ] Verify desktop entry created
- [ ] Test application menu integration
- [ ] Verify app data directory created correctly

### Functional Testing

After installation, verify:
- [ ] Application launches successfully
- [ ] Folder selection and scanning works
- [ ] Thumbnails generate correctly
- [ ] Metadata extraction works
- [ ] AI classification runs
- [ ] Search functionality works
- [ ] Settings persist across restarts
- [ ] Google Drive authentication works
- [ ] Cloud sync uploads files
- [ ] Auto-update check works

## Distribution Channels

### Official Website

Upload installers to your hosting:
```
https://releases.cura-photo-manager.com/
├── v1.0.0/
│   ├── windows/
│   │   ├── cura-photo-manager_1.0.0_x64-setup.exe
│   │   ├── cura-photo-manager_1.0.0_x64_en-US.msi
│   │   └── checksums.txt
│   ├── macos/
│   │   ├── cura-photo-manager_1.0.0_x64.dmg
│   │   ├── cura-photo-manager_1.0.0_aarch64.dmg
│   │   └── checksums.txt
│   └── linux/
│       ├── cura-photo-manager_1.0.0_amd64.deb
│       ├── cura-photo-manager_1.0.0_amd64.AppImage
│       ├── cura-photo-manager-1.0.0-1.x86_64.rpm
│       └── checksums.txt
└── latest/
    └── [symlinks to latest version]
```

### GitHub Releases

1. Create a new release on GitHub
2. Tag the release (e.g., `v1.0.0`)
3. Upload all installer files
4. Include checksums in release notes
5. Attach `RELEASE_NOTES.md`

### Package Managers

#### Homebrew (macOS)

Create a Homebrew cask:
```ruby
cask "cura-photo-manager" do
  version "1.0.0"
  sha256 "CHECKSUM_HERE"

  url "https://releases.cura-photo-manager.com/v#{version}/macos/cura-photo-manager_#{version}_x64.dmg"
  name "Cura Photo Manager"
  desc "AI-powered photo management and organization"
  homepage "https://cura-photo-manager.com"

  app "Cura Photo Manager.app"
end
```

#### Chocolatey (Windows)

Create a Chocolatey package:
```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>cura-photo-manager</id>
    <version>1.0.0</version>
    <title>Cura Photo Manager</title>
    <authors>Cura Team</authors>
    <description>AI-powered photo management and organization</description>
    <projectUrl>https://cura-photo-manager.com</projectUrl>
  </metadata>
  <files>
    <file src="tools\**" target="tools" />
  </files>
</package>
```

#### Snap (Linux)

Create a snapcraft.yaml:
```yaml
name: cura-photo-manager
version: '1.0.0'
summary: AI-powered photo management
description: |
  Cura is a desktop photo management application that helps you organize,
  search, and backup your photo collections.

grade: stable
confinement: strict

apps:
  cura-photo-manager:
    command: cura-photo-manager
    plugs:
      - home
      - network
      - desktop

parts:
  cura:
    plugin: dump
    source: .
    stage-packages:
      - libwebkit2gtk-4.0-37
```

## Continuous Deployment

### GitHub Actions Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.id }}
      upload_url: ${{ steps.create-release.outputs.upload_url }}
    steps:
      - uses: actions/checkout@v3
      - name: Create Release
        id: create-release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: true
          prerelease: false

  build-windows:
    needs: create-release
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run tauri build
      - name: Upload MSI
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./src-tauri/target/release/bundle/msi/cura-photo-manager_0.1.0_x64_en-US.msi
          asset_name: cura-photo-manager_${{ github.ref_name }}_x64_en-US.msi
          asset_content_type: application/octet-stream

  build-macos:
    needs: create-release
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run tauri build
      - name: Upload DMG
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./src-tauri/target/release/bundle/dmg/cura-photo-manager_0.1.0_x64.dmg
          asset_name: cura-photo-manager_${{ github.ref_name }}_x64.dmg
          asset_content_type: application/octet-stream

  build-linux:
    needs: create-release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
          npm install
      - name: Build
        run: npm run tauri build
      - name: Upload DEB
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./src-tauri/target/release/bundle/deb/cura-photo-manager_0.1.0_amd64.deb
          asset_name: cura-photo-manager_${{ github.ref_name }}_amd64.deb
          asset_content_type: application/octet-stream
```

## Post-Release Tasks

After releasing:

1. **Update Documentation**
   - Update version numbers in docs
   - Add release to changelog
   - Update download links

2. **Announce Release**
   - Blog post
   - Social media
   - Email newsletter
   - Community forums

3. **Monitor Feedback**
   - Watch for bug reports
   - Monitor download statistics
   - Track update adoption rates

4. **Update Auto-Update Server**
   - Upload new installers
   - Update manifest JSON
   - Test update flow from previous version

## Troubleshooting Build Issues

### Windows

**Issue**: WiX not found
- Solution: Install WiX Toolset and add to PATH

**Issue**: NSIS not found
- Solution: Install NSIS and add to PATH

### macOS

**Issue**: Code signing fails
- Solution: Verify certificate is installed in Keychain

**Issue**: Notarization fails
- Solution: Check entitlements and ensure app is properly signed

### Linux

**Issue**: Missing dependencies
- Solution: Install all required development libraries

**Issue**: AppImage doesn't run
- Solution: Ensure FUSE is installed: `sudo apt-get install fuse`

## Security Considerations

1. **Sign all releases** with valid certificates
2. **Verify checksums** before distribution
3. **Scan installers** for malware before release
4. **Use HTTPS** for all download links
5. **Keep signing keys secure** and backed up
6. **Test on clean systems** to avoid bundling malware
7. **Monitor for compromised builds** in the wild

## Support and Maintenance

- Maintain installers for at least 2 major versions
- Provide security updates for 1 year after release
- Archive old versions for reference
- Keep build documentation up to date
