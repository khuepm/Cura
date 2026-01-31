# Cura Photo Manager v[VERSION]

Release Date: [DATE]

## What's New

### Features
- [List new features added in this release]
- [Feature 2]
- [Feature 3]

### Improvements
- [List improvements to existing features]
- [Improvement 2]
- [Improvement 3]

### Bug Fixes
- [List bugs fixed in this release]
- [Bug fix 2]
- [Bug fix 3]

### Performance
- [List performance improvements]
- [Performance improvement 2]

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

**Option 1: NSIS Installer (Recommended)**
1. Download `cura-photo-manager_[VERSION]_x64-setup.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**Option 2: MSI Installer**
1. Download `cura-photo-manager_[VERSION]_x64_en-US.msi`
2. Double-click to install
3. Follow the installation wizard
4. Launch from Start Menu

### macOS

**Intel Macs:**
1. Download `cura-photo-manager_[VERSION]_x64.dmg`
2. Open the DMG file
3. Drag "Cura Photo Manager" to Applications folder
4. Launch from Applications

**Apple Silicon Macs:**
1. Download `cura-photo-manager_[VERSION]_aarch64.dmg`
2. Open the DMG file
3. Drag "Cura Photo Manager" to Applications folder
4. Launch from Applications

### Linux

**Debian/Ubuntu:**
```bash
sudo dpkg -i cura-photo-manager_[VERSION]_amd64.deb
```

**Fedora/RHEL:**
```bash
sudo rpm -i cura-photo-manager-[VERSION]-1.x86_64.rpm
```

**AppImage (Universal):**
```bash
chmod +x cura-photo-manager_[VERSION]_amd64.AppImage
./cura-photo-manager_[VERSION]_amd64.AppImage
```

## Checksums

Verify your download integrity using SHA-256:

```
Windows (NSIS): [CHECKSUM]
Windows (MSI):  [CHECKSUM]
macOS (Intel):  [CHECKSUM]
macOS (ARM64):  [CHECKSUM]
Linux (DEB):    [CHECKSUM]
Linux (RPM):    [CHECKSUM]
Linux (AppImage): [CHECKSUM]
```

To verify on Windows (PowerShell):
```powershell
Get-FileHash -Algorithm SHA256 cura-photo-manager_[VERSION]_x64-setup.exe
```

To verify on macOS/Linux:
```bash
shasum -a 256 cura-photo-manager_[VERSION]_x64.dmg
```

## Known Issues

- [List any known issues in this release]
- [Issue 2]
- [Issue 3]

## Upgrade Notes

If upgrading from a previous version:
- Your database and settings will be preserved
- Thumbnail cache will be regenerated if needed
- AI models will be re-downloaded if model version changed
- [Any other upgrade-specific notes]

## Breaking Changes

[If applicable, list any breaking changes that require user action]

## Deprecation Notices

[If applicable, list any features that are deprecated and will be removed in future versions]

## Documentation

- User Guide: https://docs.cura-photo-manager.com/user-guide
- API Documentation: https://docs.cura-photo-manager.com/api
- FAQ: https://docs.cura-photo-manager.com/faq
- Troubleshooting: https://docs.cura-photo-manager.com/troubleshooting

## Support

- GitHub Issues: https://github.com/cura/photo-manager/issues
- Discussions: https://github.com/cura/photo-manager/discussions
- Email: support@cura-photo-manager.com
- Discord: https://discord.gg/cura-photo-manager

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## Acknowledgments

Thanks to all contributors who helped make this release possible:
- [Contributor 1]
- [Contributor 2]
- [Contributor 3]

## License

Copyright © 2026 Cura Photo Manager Team. All rights reserved.

[Include license information or link to LICENSE file]

---

**Full Changelog**: https://github.com/cura/photo-manager/compare/v[PREVIOUS_VERSION]...v[VERSION]
