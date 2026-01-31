# Release Process Guide

This document provides step-by-step instructions for creating and distributing Cura Photo Manager releases.

## Table of Contents

1. [Pre-Release Preparation](#pre-release-preparation)
2. [Building Release Artifacts](#building-release-artifacts)
3. [Testing on Clean Systems](#testing-on-clean-systems)
4. [Creating GitHub Release](#creating-github-release)
5. [Post-Release Tasks](#post-release-tasks)

## Pre-Release Preparation

### 1. Version Planning

Decide on the version number following [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Example: `1.0.0`, `1.1.0`, `1.1.1`

### 2. Update Version Numbers

Update version in the following files:

**package.json:**
```json
{
  "version": "1.0.0"
}
```

**src-tauri/tauri.conf.json:**
```json
{
  "version": "1.0.0"
}
```

**src-tauri/Cargo.toml:**
```toml
[package]
version = "1.0.0"
```

### 3. Update Documentation

- Update CHANGELOG.md with changes since last release
- Review and update README.md if needed
- Update any version-specific documentation

### 4. Run All Tests

Ensure all tests pass before building:

```bash
npm test
```

For Rust tests:

```bash
cd src-tauri
cargo test
```

### 5. Commit Changes

```bash
git add .
git commit -m "chore: bump version to 1.0.0"
git push origin main
```

## Building Release Artifacts

### Automated Build (Recommended)

Use the release preparation scripts to automate the entire process:

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
3. Copy installers to release directory
4. Generate checksums
5. Create release notes
6. Create testing checklist

### Manual Build

If you need to build manually:

**Windows:**
```powershell
.\scripts\build-release.ps1
```

**macOS/Linux:**
```bash
./scripts/build-release.sh
```

### Build Output

After building, you'll find installers in:

**Windows:**
- `src-tauri/target/release/bundle/msi/*.msi`
- `src-tauri/target/release/bundle/nsis/*-setup.exe`

**macOS:**
- `src-tauri/target/release/bundle/dmg/*.dmg`

**Linux:**
- `src-tauri/target/release/bundle/deb/*.deb`
- `src-tauri/target/release/bundle/appimage/*.AppImage`
- `src-tauri/target/release/bundle/rpm/*.rpm`

## Testing on Clean Systems

### Why Test on Clean Systems?

Testing on clean systems ensures:
- All dependencies are properly bundled
- Installation process works correctly
- No conflicts with existing software
- Accurate representation of user experience

### Setting Up Test Environments

#### Windows

**Option 1: Virtual Machine**
1. Download Windows 10/11 ISO from Microsoft
2. Create VM using VirtualBox, VMware, or Hyper-V
3. Install Windows with default settings
4. Do NOT install development tools

**Option 2: Windows Sandbox**
1. Enable Windows Sandbox feature
2. Copy installer to sandbox
3. Test installation

#### macOS

**Option 1: Virtual Machine**
1. Use VMware Fusion or Parallels Desktop
2. Install clean macOS
3. Do NOT install Xcode or development tools

**Option 2: Separate User Account**
1. Create new user account
2. Test installation as new user
3. Delete account after testing

#### Linux

**Option 1: Virtual Machine**
1. Download Ubuntu/Fedora ISO
2. Create VM using VirtualBox or VMware
3. Install with default settings

**Option 2: Docker Container**
```bash
# Ubuntu
docker run -it --rm ubuntu:22.04 /bin/bash

# Fedora
docker run -it --rm fedora:38 /bin/bash
```

### Testing Procedure

Use the generated `TESTING_CHECKLIST.md` in the release directory:

1. **Installation Testing**
   - Run installer
   - Verify shortcuts created
   - Check installation directory
   - Test uninstaller

2. **Functional Testing**
   - Launch application
   - Test core features
   - Verify no errors

3. **Performance Testing**
   - Measure startup time
   - Test with large datasets
   - Monitor resource usage

4. **Security Testing**
   - Verify code signature (Windows/macOS)
   - Check for security warnings
   - Verify secure credential storage

### Common Issues and Solutions

**Windows:**
- **SmartScreen Warning**: Sign with EV certificate or build reputation
- **WebView2 Missing**: Installer should download automatically
- **Antivirus False Positive**: Submit to antivirus vendors

**macOS:**
- **Gatekeeper Warning**: Sign and notarize the app
- **"App is damaged"**: Check code signature
- **Permission Denied**: Verify entitlements

**Linux:**
- **Missing Dependencies**: Check package dependencies
- **AppImage Won't Run**: Install FUSE or use `--appimage-extract-and-run`
- **Desktop Entry Missing**: Check .desktop file installation

## Creating GitHub Release

### 1. Create Git Tag

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 2. Automated Release (GitHub Actions)

If you have GitHub Actions configured, pushing a tag will automatically:
1. Build for all platforms
2. Create GitHub release
3. Upload installers
4. Generate checksums

### 3. Manual Release

If creating manually:

1. Go to GitHub repository
2. Click "Releases" → "Draft a new release"
3. Choose the tag you created
4. Set release title: "Cura Photo Manager v1.0.0"
5. Copy content from `RELEASE_NOTES.md`
6. Upload installers:
   - Windows: MSI and NSIS installers
   - macOS: DMG files (Intel and Apple Silicon)
   - Linux: DEB, RPM, and AppImage
7. Upload `checksums.txt`
8. Mark as "Latest release"
9. Publish release

### Release Checklist

Before publishing:
- [ ] All installers uploaded
- [ ] Checksums verified
- [ ] Release notes complete
- [ ] Version numbers correct
- [ ] All tests passed
- [ ] Clean system testing done
- [ ] Code signing verified (Windows/macOS)

## Post-Release Tasks

### 1. Update Auto-Update Manifest

Update the auto-update server with new version information:

```json
{
  "version": "1.0.0",
  "notes": "See release notes for details",
  "pub_date": "2026-01-31T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../cura-photo-manager_1.0.0_x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../cura-photo-manager_1.0.0_x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://github.com/.../cura-photo-manager_1.0.0_aarch64.dmg"
    }
  }
}
```

### 2. Update Website

- Update download links
- Update version numbers
- Publish release announcement
- Update documentation

### 3. Announce Release

**Social Media:**
- Twitter/X
- LinkedIn
- Reddit (r/selfhosted, r/opensource)
- Hacker News

**Email:**
- Send newsletter to subscribers
- Notify beta testers

**Community:**
- Post in Discord/Slack
- Update forum threads
- Notify contributors

### 4. Monitor Feedback

**First 24 Hours:**
- Monitor GitHub issues
- Watch social media mentions
- Check download statistics
- Respond to user questions

**First Week:**
- Track crash reports
- Monitor update adoption
- Collect user feedback
- Plan hotfix if needed

### 5. Update Documentation

- Add release to changelog
- Update version in docs
- Archive old documentation
- Update FAQ if needed

## Hotfix Process

If critical bugs are found after release:

### 1. Create Hotfix Branch

```bash
git checkout -b hotfix/1.0.1 v1.0.0
```

### 2. Fix the Bug

- Make minimal changes
- Add tests
- Update version to 1.0.1

### 3. Test Thoroughly

- Run all tests
- Test on clean systems
- Verify fix works

### 4. Release Hotfix

```bash
git commit -m "fix: critical bug in feature X"
git tag -a v1.0.1 -m "Hotfix release 1.0.1"
git push origin hotfix/1.0.1
git push origin v1.0.1
```

### 5. Merge Back

```bash
git checkout main
git merge hotfix/1.0.1
git push origin main
```

## Rollback Procedure

If a release has critical issues:

### 1. Immediate Actions

- Mark GitHub release as "Pre-release"
- Update auto-update manifest to previous version
- Post warning on website/social media

### 2. Investigate

- Identify root cause
- Determine scope of impact
- Plan fix or rollback

### 3. Communicate

- Notify users of issue
- Provide workaround if available
- Set expectations for fix timeline

### 4. Fix and Re-Release

- Fix the issue
- Increment patch version
- Follow full release process
- Announce fix

## Release Metrics

Track these metrics for each release:

### Download Statistics
- Total downloads
- Downloads by platform
- Downloads by installer type

### Update Adoption
- Percentage of users updated
- Time to 50% adoption
- Time to 90% adoption

### Quality Metrics
- Number of bugs reported
- Critical bugs
- Time to first bug report
- Time to fix critical bugs

### User Feedback
- GitHub stars
- Social media sentiment
- User reviews
- Support tickets

## Continuous Improvement

After each release:

1. **Retrospective**
   - What went well?
   - What could be improved?
   - What should we do differently?

2. **Update Process**
   - Update this document
   - Improve automation
   - Add new checks

3. **Plan Next Release**
   - Set version number
   - Plan features
   - Set timeline

## Appendix

### Useful Commands

**Check installer signature (Windows):**
```powershell
Get-AuthenticodeSignature .\installer.exe
```

**Check app signature (macOS):**
```bash
codesign -dv --verbose=4 "Cura Photo Manager.app"
```

**Verify notarization (macOS):**
```bash
spctl -a -vv "Cura Photo Manager.app"
```

**Check package dependencies (Linux):**
```bash
# DEB
dpkg -I cura-photo-manager.deb

# RPM
rpm -qpR cura-photo-manager.rpm
```

### Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Code Signing Guide](../CODE_SIGNING.md)
- [Auto-Update Guide](../AUTO_UPDATE.md)

### Support

For questions about the release process:
- Open an issue on GitHub
- Contact the release team
- Check the documentation

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
