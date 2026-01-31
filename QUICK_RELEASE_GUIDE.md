# Quick Release Guide

This is a quick reference for creating releases. For detailed information, see [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md).

## Prerequisites

- [ ] All tests passing
- [ ] Version numbers updated in:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
- [ ] CHANGELOG.md updated
- [ ] Changes committed to main branch

## Step 1: Create Release Artifacts

**Windows:**
```powershell
.\scripts\prepare-release.ps1 -Version "1.0.0"
```

**macOS:**
```bash
./scripts/prepare-release.sh 1.0.0
```

**Linux:**
```bash
./scripts/prepare-release.sh 1.0.0
```

This creates a `release-1.0.0/` directory with:
- Installers (renamed with version)
- checksums.txt
- RELEASE_NOTES.md (edit this!)
- TESTING_CHECKLIST.md
- test-installation script

## Step 2: Edit Release Notes

Edit `release-1.0.0/RELEASE_NOTES.md`:
- Add actual features, improvements, and bug fixes
- Remove placeholder text
- Verify checksums are embedded

## Step 3: Test on Clean Systems

Use the testing checklist:
```bash
# Windows
cd release-1.0.0
.\test-installation.ps1

# macOS/Linux
cd release-1.0.0
./test-installation.sh
```

Follow `TESTING_CHECKLIST.md` and check off items as you test.

## Step 4: Sign Installers (if not already signed)

**Windows:**
- Sign with Authenticode certificate
- See [CODE_SIGNING.md](CODE_SIGNING.md)

**macOS:**
- Sign with Apple Developer ID
- Notarize with Apple
- Staple notarization ticket
- See [CODE_SIGNING.md](CODE_SIGNING.md)

## Step 5: Create GitHub Release

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Then on GitHub:
1. Go to Releases → Draft a new release
2. Choose tag: `v1.0.0`
3. Title: `Cura Photo Manager v1.0.0`
4. Copy content from `RELEASE_NOTES.md`
5. Upload all files from `release-1.0.0/`
6. Publish release

## Step 6: Post-Release

- [ ] Update auto-update manifest
- [ ] Update website download links
- [ ] Announce on social media
- [ ] Monitor GitHub issues
- [ ] Respond to user feedback

## Quick Commands

### Run Tests
```bash
npm test
cd src-tauri && cargo test
```

### Build Only (no release prep)
```bash
# Windows
.\scripts\build-release.ps1

# macOS/Linux
./scripts/build-release.sh
```

### Verify Checksum
```bash
# Windows
.\scripts\verify-checksum.ps1 -InstallerPath "installer.exe" -ChecksumFile "checksums.txt"

# macOS/Linux
./scripts/verify-checksum.sh installer.dmg checksums.txt
```

### Skip Tests (if already run)
```bash
# Windows
.\scripts\prepare-release.ps1 -Version "1.0.0" -SkipTests

# macOS/Linux
SKIP_TESTS=true ./scripts/prepare-release.sh 1.0.0
```

### Skip Build (use existing artifacts)
```bash
# Windows
.\scripts\prepare-release.ps1 -Version "1.0.0" -SkipBuild

# macOS/Linux
SKIP_BUILD=true ./scripts/prepare-release.sh 1.0.0
```

## Troubleshooting

### Build Fails
- Check Node.js and Rust versions
- Run `npm install` and `cargo clean`
- Check error logs

### Tests Fail
- Fix failing tests before releasing
- Never skip tests for production releases

### Installer Won't Run
- Verify code signing
- Check system requirements
- Test on clean system

### Checksum Mismatch
- Rebuild artifacts
- Don't modify files after checksum generation

## Emergency Hotfix

For critical bugs after release:

```bash
# Create hotfix branch
git checkout -b hotfix/1.0.1 v1.0.0

# Fix bug, update version to 1.0.1
# ... make changes ...

# Test and release
git commit -m "fix: critical bug"
git tag -a v1.0.1 -m "Hotfix release 1.0.1"
git push origin hotfix/1.0.1
git push origin v1.0.1

# Merge back to main
git checkout main
git merge hotfix/1.0.1
git push origin main
```

## Resources

- [Full Release Process](docs/RELEASE_PROCESS.md)
- [Release Artifacts Info](docs/RELEASE_ARTIFACTS.md)
- [Distribution Guide](DISTRIBUTION.md)
- [Code Signing Guide](CODE_SIGNING.md)
- [Auto-Update Guide](AUTO_UPDATE.md)

---

**Last Updated:** January 31, 2026
