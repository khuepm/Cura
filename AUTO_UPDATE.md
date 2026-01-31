# Auto-Update System Documentation

This document describes the auto-update mechanism implemented in Cura Photo Manager.

## Overview

The auto-update system uses Tauri's built-in updater plugin to check for and install application updates automatically. Updates are checked on application startup and can also be triggered manually by the user.

## Architecture

### Backend (Rust)

The update logic is implemented in `src-tauri/src/updater.rs`:

- `check_for_updates()`: Checks if a new version is available
- `install_update()`: Downloads and installs an available update
- `check_updates_on_startup()`: Automatically checks for updates 5 seconds after app startup

### Frontend (React)

The UI is implemented in `src/components/UpdateNotification.tsx`:

- Displays a notification when an update is available
- Shows update version, release date, and release notes
- Provides "Install Update" and "Later" buttons
- Shows download progress during installation
- Automatically restarts the app after installation

## Configuration

### Tauri Configuration

The updater is configured in `src-tauri/tauri.conf.json`:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://releases.cura-photo-manager.com/{{target}}/{{arch}}/{{current_version}}"
  ],
  "dialog": true,
  "pubkey": "YOUR_PUBLIC_KEY_HERE",
  "windows": {
    "installMode": "passive"
  }
}
```

### Update Server Endpoint

The endpoint URL uses placeholders that Tauri replaces automatically:
- `{{target}}`: Platform (windows, darwin, linux)
- `{{arch}}`: Architecture (x86_64, aarch64)
- `{{current_version}}`: Current app version

Example: `https://releases.cura-photo-manager.com/windows/x86_64/0.1.0`

## Update Server Setup

### Server Requirements

The update server must serve JSON files with the following structure:

```json
{
  "version": "1.0.0",
  "notes": "Release notes in markdown format",
  "pub_date": "2026-01-31T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "BASE64_SIGNATURE",
      "url": "https://releases.cura-photo-manager.com/downloads/cura-1.0.0-x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "BASE64_SIGNATURE",
      "url": "https://releases.cura-photo-manager.com/downloads/cura-1.0.0-x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "BASE64_SIGNATURE",
      "url": "https://releases.cura-photo-manager.com/downloads/cura-1.0.0-aarch64.dmg"
    }
  }
}
```

### Generating Signatures

Updates must be signed for security. Generate a keypair:

```bash
# Install Tauri CLI if not already installed
npm install -g @tauri-apps/cli

# Generate keypair
tauri signer generate -w ~/.tauri/cura-updater.key
```

This generates:
- Private key: `~/.tauri/cura-updater.key` (keep secret!)
- Public key: Printed to console (add to tauri.conf.json)

### Signing Updates

Sign each release artifact:

```bash
# Sign Windows installer
tauri signer sign ~/.tauri/cura-updater.key path/to/cura-1.0.0-x64-setup.exe

# Sign macOS DMG
tauri signer sign ~/.tauri/cura-updater.key path/to/cura-1.0.0-x64.dmg
```

The signature is printed to console - add it to the update manifest JSON.

## Update Flow

### Automatic Check on Startup

1. App starts and initializes
2. After 5 seconds, `check_updates_on_startup()` is called
3. If an update is available, an `update-available` event is emitted
4. Frontend displays the update notification

### Manual Check

1. User clicks "Check for Updates" button
2. Frontend calls `check_for_updates()` command
3. If update available, notification is shown
4. If no update, user sees "You are running the latest version!" message

### Installing Update

1. User clicks "Install Update" button
2. Frontend calls `install_update()` command
3. Backend downloads the update with progress events
4. Frontend displays download progress bar
5. After download completes, update is installed
6. App automatically restarts with new version

## Platform-Specific Behavior

### Windows

- Uses passive install mode (no user interaction required)
- Installer runs silently in the background
- App restarts automatically after installation

### macOS

- Downloads DMG file
- Mounts DMG and replaces app bundle
- App restarts automatically after installation
- Requires app to be signed and notarized

### Linux

- Auto-update is not supported on Linux
- Users must update manually through their package manager
- Update check returns an error message explaining this

## Testing Updates

### Local Testing

1. Build a release with version 0.1.0
2. Install and run the app
3. Build another release with version 0.2.0
4. Set up a local update server serving the manifest
5. Update the endpoint in tauri.conf.json to point to localhost
6. Trigger update check in the app

### Test Server Setup

```javascript
// Simple Node.js test server
const express = require('express');
const app = express();

app.get('/windows/x86_64/:version', (req, res) => {
  res.json({
    version: '0.2.0',
    notes: 'Test update',
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature: 'YOUR_SIGNATURE_HERE',
        url: 'http://localhost:3001/downloads/cura-0.2.0-setup.exe'
      }
    }
  });
});

app.listen(3001, () => console.log('Update server running on port 3001'));
```

## Security Considerations

1. **Always sign updates**: Never disable signature verification in production
2. **Use HTTPS**: Update server must use HTTPS in production
3. **Keep private key secure**: Never commit the private key to version control
4. **Verify signatures**: Tauri automatically verifies signatures before installing
5. **Code signing**: Updates should be code-signed for the platform (Authenticode for Windows, notarization for macOS)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Release and Update

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    strategy:
      matrix:
        platform: [windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run tauri build
      
      - name: Sign update
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
        run: |
          echo "$TAURI_PRIVATE_KEY" > private.key
          tauri signer sign private.key src-tauri/target/release/bundle/**/*
          rm private.key
      
      - name: Upload to release server
        run: |
          # Upload artifacts and update manifest
          # Implementation depends on your hosting solution
```

## Troubleshooting

### Update Check Fails

- Verify the update server is accessible
- Check the endpoint URL in tauri.conf.json
- Ensure the manifest JSON is valid
- Check network connectivity

### Signature Verification Fails

- Ensure the public key in tauri.conf.json matches the private key used for signing
- Verify the signature in the manifest is correct
- Re-sign the update artifact if needed

### Update Download Fails

- Check the download URL in the manifest
- Ensure the file is accessible and not behind authentication
- Verify sufficient disk space for download

### App Doesn't Restart After Update

- Check app permissions
- Verify the update was installed successfully
- Check logs for errors

## Monitoring and Analytics

Consider tracking:
- Update check frequency
- Update success/failure rates
- Time to download and install
- Version adoption rates
- Error types and frequencies

This data helps improve the update experience and identify issues early.

## Future Enhancements

Potential improvements:
- Delta updates (only download changed files)
- Background downloads (download while app is running)
- Scheduled update checks (daily, weekly)
- Update channels (stable, beta, nightly)
- Rollback mechanism for failed updates
- Update size optimization
