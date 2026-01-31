# Release Artifacts Guide

This document explains the release artifacts generated for Cura Photo Manager and how to use them.

## Artifact Types

### Windows

#### NSIS Installer (.exe)
- **File**: `cura-photo-manager_X.Y.Z_x64-setup.exe`
- **Recommended**: Yes
- **Size**: ~80-100 MB
- **Features**:
  - Modern installer UI
  - Per-user or per-machine installation
  - Automatic WebView2 installation
  - Desktop and Start Menu shortcuts
  - Uninstaller included
  - Supports silent installation

**Installation:**
```cmd
cura-photo-manager_1.0.0_x64-setup.exe
```

**Silent Installation:**
```cmd
cura-photo-manager_1.0.0_x64-setup.exe /S
```

#### MSI Installer (.msi)
- **File**: `cura-photo-manager_X.Y.Z_x64_en-US.msi`
- **Recommended**: For enterprise deployments
- **Size**: ~80-100 MB
- **Features**:
  - Windows Installer technology
  - Group Policy deployment support
  - Repair and modify options
  - Automatic WebView2 installation
  - Uninstaller included

**Installation:**
```cmd
msiexec /i cura-photo-manager_1.0.0_x64_en-US.msi
```

**Silent Installation:**
```cmd
msiexec /i cura-photo-manager_1.0.0_x64_en-US.msi /quiet
```

**Uninstallation:**
```cmd
msiexec /x cura-photo-manager_1.0.0_x64_en-US.msi /quiet
```

### macOS

#### DMG (Intel)
- **File**: `cura-photo-manager_X.Y.Z_x64.dmg`
- **Architecture**: Intel (x86_64)
- **Size**: ~80-100 MB
- **Features**:
  - Drag-and-drop installation
  - Code signed and notarized
  - No Gatekeeper warnings
  - Universal binary support

**Installation:**
1. Open the DMG file
2. Drag "Cura Photo Manager" to Applications folder
3. Launch from Applications

**Verification:**
```bash
codesign -dv --verbose=4 "/Applications/Cura Photo Manager.app"
spctl -a -vv "/Applications/Cura Photo Manager.app"
```

#### DMG (Apple Silicon)
- **File**: `cura-photo-manager_X.Y.Z_aarch64.dmg`
- **Architecture**: Apple Silicon (ARM64)
- **Size**: ~80-100 MB
- **Features**:
  - Native Apple Silicon performance
  - Code signed and notarized
  - No Rosetta required
  - Optimized for M1/M2/M3 chips

**Installation:**
Same as Intel DMG

### Linux

#### Debian Package (.deb)
- **File**: `cura-photo-manager_X.Y.Z_amd64.deb`
- **Distributions**: Ubuntu, Debian, Linux Mint, Pop!_OS
- **Size**: ~80-100 MB
- **Features**:
  - Automatic dependency resolution
  - Desktop entry integration
  - System package manager integration
  - Easy updates

**Installation:**
```bash
sudo dpkg -i cura-photo-manager_1.0.0_amd64.deb
sudo apt-get install -f  # Install dependencies if needed
```

**Uninstallation:**
```bash
sudo apt-get remove cura-photo-manager
```

**Check Installation:**
```bash
dpkg -l | grep cura-photo-manager
```

#### RPM Package (.rpm)
- **File**: `cura-photo-manager-X.Y.Z-1.x86_64.rpm`
- **Distributions**: Fedora, RHEL, CentOS, openSUSE
- **Size**: ~80-100 MB
- **Features**:
  - Automatic dependency resolution
  - Desktop entry integration
  - System package manager integration
  - Easy updates

**Installation:**
```bash
# Fedora/RHEL/CentOS
sudo rpm -i cura-photo-manager-1.0.0-1.x86_64.rpm

# Or with dnf
sudo dnf install cura-photo-manager-1.0.0-1.x86_64.rpm
```

**Uninstallation:**
```bash
sudo rpm -e cura-photo-manager
# Or
sudo dnf remove cura-photo-manager
```

**Check Installation:**
```bash
rpm -qa | grep cura-photo-manager
```

#### AppImage (.AppImage)
- **File**: `cura-photo-manager_X.Y.Z_amd64.AppImage`
- **Distributions**: Universal (all Linux distributions)
- **Size**: ~100-120 MB
- **Features**:
  - No installation required
  - Portable (run from anywhere)
  - No root access needed
  - All dependencies bundled
  - Works on any Linux distribution

**Usage:**
```bash
# Make executable
chmod +x cura-photo-manager_1.0.0_amd64.AppImage

# Run
./cura-photo-manager_1.0.0_amd64.AppImage
```

**Desktop Integration:**
```bash
# Extract and integrate
./cura-photo-manager_1.0.0_amd64.AppImage --appimage-extract
sudo mv squashfs-root /opt/cura-photo-manager
sudo ln -s /opt/cura-photo-manager/AppRun /usr/local/bin/cura-photo-manager
```

**Troubleshooting:**
If AppImage doesn't run, try:
```bash
# Option 1: Install FUSE
sudo apt-get install fuse  # Debian/Ubuntu
sudo dnf install fuse      # Fedora

# Option 2: Extract and run
./cura-photo-manager_1.0.0_amd64.AppImage --appimage-extract-and-run
```

## Checksum Verification

All releases include a `checksums.txt` file with SHA-256 checksums for verification.

### Why Verify Checksums?

- Ensure file integrity (not corrupted during download)
- Verify authenticity (not tampered with)
- Security best practice

### Verification Methods

#### Windows (PowerShell)

**Using provided script:**
```powershell
.\scripts\verify-checksum.ps1 -InstallerPath "cura-photo-manager_1.0.0_x64-setup.exe" -ChecksumFile "checksums.txt"
```

**Manual verification:**
```powershell
Get-FileHash -Algorithm SHA256 cura-photo-manager_1.0.0_x64-setup.exe
```

Compare the output with the checksum in `checksums.txt`.

#### macOS/Linux

**Using provided script:**
```bash
./scripts/verify-checksum.sh cura-photo-manager_1.0.0_x64.dmg checksums.txt
```

**Manual verification:**
```bash
shasum -a 256 cura-photo-manager_1.0.0_x64.dmg
```

Compare the output with the checksum in `checksums.txt`.

## File Sizes

Approximate sizes for reference:

| Platform | Installer Type | Size |
|----------|---------------|------|
| Windows | NSIS (.exe) | ~90 MB |
| Windows | MSI (.msi) | ~90 MB |
| macOS | DMG (Intel) | ~95 MB |
| macOS | DMG (ARM64) | ~95 MB |
| Linux | DEB | ~85 MB |
| Linux | RPM | ~85 MB |
| Linux | AppImage | ~110 MB |

Note: Sizes may vary between versions.

## System Requirements

### Windows
- **OS**: Windows 10 or later (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 500 MB free space
- **Runtime**: WebView2 (automatically installed)

### macOS
- **OS**: macOS 10.13 (High Sierra) or later
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 500 MB free space
- **Architecture**: Intel or Apple Silicon

### Linux
- **OS**: Ubuntu 20.04+, Fedora 35+, or equivalent
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 500 MB free space
- **Dependencies**: WebKit2GTK 4.0 (usually pre-installed)

## Installation Locations

### Windows
- **Program Files**: `C:\Program Files\Cura Photo Manager\`
- **User Data**: `%APPDATA%\com.cura.photomanager\`
- **Thumbnails**: `%APPDATA%\cura\thumbnails\`
- **Logs**: `%APPDATA%\cura\logs\`

### macOS
- **Application**: `/Applications/Cura Photo Manager.app`
- **User Data**: `~/Library/Application Support/com.cura.photomanager/`
- **Thumbnails**: `~/Library/Application Support/cura/thumbnails/`
- **Logs**: `~/Library/Logs/cura/`

### Linux
- **Application**: `/usr/bin/cura-photo-manager` (DEB/RPM)
- **User Data**: `~/.local/share/com.cura.photomanager/`
- **Thumbnails**: `~/.local/share/cura/thumbnails/`
- **Logs**: `~/.local/share/cura/logs/`

## Upgrade vs Clean Install

### Upgrade (Recommended)
- Preserves all data and settings
- Automatic with installers
- No manual steps required

### Clean Install
If you need a fresh start:

**Windows:**
1. Uninstall current version
2. Delete `%APPDATA%\com.cura.photomanager\`
3. Install new version

**macOS:**
1. Delete app from Applications
2. Delete `~/Library/Application Support/com.cura.photomanager/`
3. Install new version

**Linux:**
1. Uninstall package
2. Delete `~/.local/share/com.cura.photomanager/`
3. Install new version

## Troubleshooting

### Windows

**Issue**: SmartScreen warning
- **Solution**: Click "More info" → "Run anyway"
- **Note**: Signed installers reduce warnings

**Issue**: WebView2 installation fails
- **Solution**: Download WebView2 manually from Microsoft

**Issue**: Antivirus blocks installer
- **Solution**: Temporarily disable antivirus or add exception

### macOS

**Issue**: "App is damaged" message
- **Solution**: Run `xattr -cr "/Applications/Cura Photo Manager.app"`

**Issue**: Gatekeeper blocks app
- **Solution**: Right-click app → Open → Confirm

**Issue**: Permission denied
- **Solution**: Check app has necessary permissions in System Preferences

### Linux

**Issue**: Missing dependencies (DEB/RPM)
- **Solution**: `sudo apt-get install -f` or `sudo dnf install <package>`

**Issue**: AppImage won't run
- **Solution**: Install FUSE or use `--appimage-extract-and-run`

**Issue**: Desktop entry not created
- **Solution**: Manually create .desktop file in `~/.local/share/applications/`

## Support

For installation issues:
- Check [Troubleshooting Guide](https://docs.cura-photo-manager.com/troubleshooting)
- Open an issue on [GitHub](https://github.com/cura/photo-manager/issues)
- Email: support@cura-photo-manager.com

## License

All release artifacts are distributed under the same license as the source code.
See LICENSE file for details.

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
