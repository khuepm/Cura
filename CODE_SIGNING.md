# Code Signing Configuration Guide

This document provides instructions for setting up code signing for Cura Photo Manager on Windows and macOS platforms.

## Overview

Code signing ensures that users can verify the authenticity and integrity of the application installers. It's essential for:
- Building trust with users
- Avoiding security warnings during installation
- Meeting platform requirements for distribution

## Windows Code Signing

### Prerequisites

1. **Obtain a Code Signing Certificate**
   - Purchase a certificate from a trusted Certificate Authority (CA) such as:
     - DigiCert
     - Sectigo (formerly Comodo)
     - GlobalSign
   - Certificate types: Standard Code Signing or EV (Extended Validation) Code Signing

2. **Install the Certificate**
   - Import the certificate into the Windows Certificate Store
   - Ensure the certificate is installed in the "Personal" store

### Configuration

#### Option 1: Using Certificate Thumbprint (Recommended)

1. Find your certificate thumbprint:
   ```powershell
   Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object {$_.Subject -like "*Your Company Name*"}
   ```

2. Update `tauri.conf.json`:
   ```json
   "windows": {
     "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT_HERE",
     "digestAlgorithm": "sha256",
     "timestampUrl": "http://timestamp.digicert.com"
   }
   ```

#### Option 2: Using Environment Variables

Set environment variables before building:
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "path/to/certificate.pfx"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your_certificate_password"
```

### Timestamp Server URLs

Use one of these trusted timestamp servers:
- DigiCert: `http://timestamp.digicert.com`
- Sectigo: `http://timestamp.sectigo.com`
- GlobalSign: `http://timestamp.globalsign.com`

### Building Signed Installers

```bash
npm run tauri build
```

The build process will automatically sign the executables and installers.

### Verification

Verify the signature on Windows:
```powershell
Get-AuthenticodeSignature "path\to\installer.exe"
```

## macOS Code Signing

### Prerequisites

1. **Apple Developer Account**
   - Enroll in the Apple Developer Program ($99/year)
   - Create a Developer ID Application certificate

2. **Install Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **Create Developer ID Certificate**
   - Log in to Apple Developer Portal
   - Navigate to Certificates, Identifiers & Profiles
   - Create a "Developer ID Application" certificate
   - Download and install the certificate in Keychain Access

### Configuration

1. Find your signing identity:
   ```bash
   security find-identity -v -p codesigning
   ```

2. Update `tauri.conf.json`:
   ```json
   "macOS": {
     "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
     "providerShortName": "YOUR_TEAM_ID",
     "entitlements": "entitlements.plist"
   }
   ```

3. Create `src-tauri/entitlements.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>com.apple.security.cs.allow-jit</key>
     <true/>
     <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
     <true/>
     <key>com.apple.security.cs.disable-library-validation</key>
     <true/>
     <key>com.apple.security.files.user-selected.read-write</key>
     <true/>
     <key>com.apple.security.network.client</key>
     <true/>
   </dict>
   </plist>
   ```

### Notarization

For distribution outside the Mac App Store, you must notarize your app:

1. **Set up App-Specific Password**
   - Go to appleid.apple.com
   - Generate an app-specific password for notarization

2. **Store Credentials**
   ```bash
   xcrun notarytool store-credentials "cura-notarization" \
     --apple-id "your@email.com" \
     --team-id "YOUR_TEAM_ID" \
     --password "app-specific-password"
   ```

3. **Configure Tauri for Notarization**
   
   Set environment variables:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

4. **Build and Notarize**
   ```bash
   npm run tauri build
   ```

   Tauri will automatically submit the app for notarization after signing.

### Verification

Verify the signature and notarization:
```bash
codesign -dv --verbose=4 "path/to/Cura Photo Manager.app"
spctl -a -vv "path/to/Cura Photo Manager.app"
xcrun stapler validate "path/to/Cura Photo Manager.app"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm install
      - name: Build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.WINDOWS_CERTIFICATE }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: npm run tauri build

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm install
      - name: Import Certificate
        env:
          CERTIFICATE_BASE64: ${{ secrets.MACOS_CERTIFICATE }}
          CERTIFICATE_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PASSWORD }}
        run: |
          echo $CERTIFICATE_BASE64 | base64 --decode > certificate.p12
          security create-keychain -p actions build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p actions build.keychain
          security import certificate.p12 -k build.keychain -P $CERTIFICATE_PASSWORD -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k actions build.keychain
      - name: Build
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run tauri build
```

## Security Best Practices

1. **Never commit certificates or passwords to version control**
2. **Use environment variables or secure secret management**
3. **Rotate certificates before expiration**
4. **Keep private keys secure and backed up**
5. **Use EV certificates for Windows when possible (no SmartScreen warnings)**
6. **Test signed builds on clean systems before distribution**

## Troubleshooting

### Windows

**Issue**: "The specified certificate is not valid for signing"
- Solution: Ensure the certificate is installed in the Personal store and has a private key

**Issue**: Timestamp server timeout
- Solution: Try a different timestamp server URL

### macOS

**Issue**: "No identity found"
- Solution: Verify the certificate is installed in Keychain Access and is valid

**Issue**: Notarization fails
- Solution: Check that all entitlements are correct and the app is properly signed

**Issue**: "Developer cannot be verified" warning
- Solution: Ensure the app is notarized and stapled

## Testing Signed Builds

### Windows
1. Build the installer
2. Run on a clean Windows VM
3. Verify no SmartScreen warnings (for EV certificates)
4. Check certificate details in installer properties

### macOS
1. Build the DMG
2. Run on a clean macOS system
3. Verify no Gatekeeper warnings
4. Check signature with `codesign` and `spctl`

## Resources

- [Tauri Code Signing Documentation](https://tauri.app/v1/guides/distribution/sign-windows)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Windows Authenticode Documentation](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/authenticode)
