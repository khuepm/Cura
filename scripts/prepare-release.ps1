# PowerShell script to prepare a complete release
# Usage: .\scripts\prepare-release.ps1 -Version "1.0.0"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Cura Photo Manager Release Preparation ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: $Version" -ForegroundColor Green
Write-Host "Platform: Windows" -ForegroundColor Green
Write-Host ""

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "✗ Invalid version format. Expected: X.Y.Z (e.g., 1.0.0)" -ForegroundColor Red
    exit 1
}

# Create release directory
$releaseDir = "release-$Version"
if (Test-Path $releaseDir) {
    Write-Host "Cleaning existing release directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $releaseDir
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null
Write-Host "✓ Created release directory: $releaseDir" -ForegroundColor Green
Write-Host ""

# Run tests unless skipped
if (-not $SkipTests) {
    Write-Host "Running tests..." -ForegroundColor Yellow
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Tests failed. Fix tests before releasing." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ All tests passed" -ForegroundColor Green
    Write-Host ""
}

# Build release unless skipped
if (-not $SkipBuild) {
    Write-Host "Building release artifacts..." -ForegroundColor Yellow
    & .\scripts\build-release.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Copy installers to release directory
Write-Host "Copying installers to release directory..." -ForegroundColor Yellow

$bundleDir = "src-tauri\target\release\bundle"
$installers = @()

# MSI installer
$msiFiles = Get-ChildItem -Path "$bundleDir\msi\*.msi" -ErrorAction SilentlyContinue
if ($msiFiles) {
    foreach ($msi in $msiFiles) {
        $newName = "cura-photo-manager_${Version}_x64_en-US.msi"
        Copy-Item $msi.FullName -Destination "$releaseDir\$newName"
        $installers += @{Path = "$releaseDir\$newName"; Name = $newName}
        Write-Host "  ✓ Copied MSI: $newName" -ForegroundColor Green
    }
}

# NSIS installer
$nsisFiles = Get-ChildItem -Path "$bundleDir\nsis\*-setup.exe" -ErrorAction SilentlyContinue
if ($nsisFiles) {
    foreach ($nsis in $nsisFiles) {
        $newName = "cura-photo-manager_${Version}_x64-setup.exe"
        Copy-Item $nsis.FullName -Destination "$releaseDir\$newName"
        $installers += @{Path = "$releaseDir\$newName"; Name = $newName}
        Write-Host "  ✓ Copied NSIS: $newName" -ForegroundColor Green
    }
}

if ($installers.Count -eq 0) {
    Write-Host "✗ No installers found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Generate checksums
Write-Host "Generating checksums..." -ForegroundColor Yellow

$checksumFile = "$releaseDir\checksums.txt"
$checksumContent = @()

foreach ($installer in $installers) {
    $hash = Get-FileHash -Algorithm SHA256 -Path $installer.Path
    $checksumContent += "$($hash.Hash)  $($installer.Name)"
    Write-Host "  $($installer.Name)" -ForegroundColor Cyan
    Write-Host "  SHA-256: $($hash.Hash)" -ForegroundColor Gray
}

$checksumContent | Out-File -FilePath $checksumFile -Encoding UTF8
Write-Host ""
Write-Host "✓ Checksums saved to checksums.txt" -ForegroundColor Green
Write-Host ""

# Generate release notes
Write-Host "Generating release notes..." -ForegroundColor Yellow

$releaseNotesTemplate = Get-Content "RELEASE_NOTES_TEMPLATE.md" -Raw
$releaseNotes = $releaseNotesTemplate -replace '\[VERSION\]', $Version
$releaseNotes = $releaseNotes -replace '\[DATE\]', (Get-Date -Format "MMMM dd, yyyy")

# Replace checksums in release notes
foreach ($installer in $installers) {
    $hash = Get-FileHash -Algorithm SHA256 -Path $installer.Path
    if ($installer.Name -like "*setup.exe") {
        $releaseNotes = $releaseNotes -replace 'Windows \(NSIS\): \[CHECKSUM\]', "Windows (NSIS): $($hash.Hash)"
    }
    if ($installer.Name -like "*.msi") {
        $releaseNotes = $releaseNotes -replace 'Windows \(MSI\):  \[CHECKSUM\]', "Windows (MSI):  $($hash.Hash)"
    }
}

$releaseNotes | Out-File -FilePath "$releaseDir\RELEASE_NOTES.md" -Encoding UTF8
Write-Host "✓ Release notes saved to RELEASE_NOTES.md" -ForegroundColor Green
Write-Host ""

# Create testing checklist
Write-Host "Creating testing checklist..." -ForegroundColor Yellow

$testingChecklist = @"
# Testing Checklist for v$Version

## Pre-Release Testing

### Windows Testing

#### Installation Testing
- [ ] Test MSI installer on Windows 10
- [ ] Test MSI installer on Windows 11
- [ ] Test NSIS installer on Windows 10
- [ ] Test NSIS installer on Windows 11
- [ ] Verify Start Menu shortcut created
- [ ] Verify Desktop shortcut created (if selected)
- [ ] Verify installation directory is correct
- [ ] Test uninstaller (MSI)
- [ ] Test uninstaller (NSIS)

#### Code Signing Verification
- [ ] Verify digital signature on MSI installer
- [ ] Verify digital signature on NSIS installer
- [ ] Verify no SmartScreen warnings (if EV signed)
- [ ] Check certificate details are correct

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
- [ ] Update check runs on startup
- [ ] Update notification appears (if update available)
- [ ] Update download works
- [ ] Update installation works
- [ ] Application restarts after update

#### Performance Testing
- [ ] Application starts within 3 seconds
- [ ] Scanning 1000 images completes in reasonable time
- [ ] UI remains responsive during operations
- [ ] Memory usage is reasonable (<500MB idle)
- [ ] No memory leaks during extended use

#### Clean System Testing
- [ ] Test on clean Windows 10 VM
- [ ] Test on clean Windows 11 VM
- [ ] Verify WebView2 installs automatically
- [ ] Verify all dependencies are bundled

### Cross-Platform Verification (if applicable)

#### macOS Testing (if built)
- [ ] Test on Intel Mac
- [ ] Test on Apple Silicon Mac
- [ ] Verify no Gatekeeper warnings
- [ ] Verify app signature
- [ ] Test auto-update

#### Linux Testing (if built)
- [ ] Test DEB on Ubuntu 22.04
- [ ] Test RPM on Fedora 38
- [ ] Test AppImage on multiple distributions
- [ ] Verify desktop entry created

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
- [ ] Installers signed
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

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Version: $Version
Platform: Windows
Tester: _______________

"@

$testingChecklist | Out-File -FilePath "$releaseDir\TESTING_CHECKLIST.md" -Encoding UTF8
Write-Host "✓ Testing checklist saved to TESTING_CHECKLIST.md" -ForegroundColor Green
Write-Host ""

# Create installation test script
$installTestScript = @"
# Installation Test Script
# Run this on a clean Windows system to verify the installer

Write-Host "=== Cura Photo Manager Installation Test ===" -ForegroundColor Cyan
Write-Host ""

# Check system requirements
Write-Host "Checking system requirements..." -ForegroundColor Yellow

`$osVersion = [System.Environment]::OSVersion.Version
if (`$osVersion.Major -lt 10) {
    Write-Host "✗ Windows 10 or later required" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Windows version: `$(`$osVersion.Major).`$(`$osVersion.Minor)" -ForegroundColor Green

`$memory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
if (`$memory -lt 4) {
    Write-Host "⚠ Less than 4 GB RAM detected (`$([math]::Round(`$memory, 2)) GB)" -ForegroundColor Yellow
} else {
    Write-Host "✓ RAM: `$([math]::Round(`$memory, 2)) GB" -ForegroundColor Green
}

`$disk = (Get-PSDrive C).Free / 1GB
if (`$disk -lt 0.5) {
    Write-Host "⚠ Less than 500 MB free disk space" -ForegroundColor Yellow
} else {
    Write-Host "✓ Free disk space: `$([math]::Round(`$disk, 2)) GB" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Installation Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run the installer (MSI or NSIS)" -ForegroundColor White
Write-Host "2. Follow the installation wizard" -ForegroundColor White
Write-Host "3. Launch the application" -ForegroundColor White
Write-Host "4. Verify all features work" -ForegroundColor White
Write-Host "5. Fill out the testing checklist" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
`$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
"@

$installTestScript | Out-File -FilePath "$releaseDir\test-installation.ps1" -Encoding UTF8
Write-Host "✓ Installation test script saved to test-installation.ps1" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "=== Release Preparation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Release Directory: $releaseDir" -ForegroundColor Green
Write-Host ""
Write-Host "Contents:" -ForegroundColor Yellow
Get-ChildItem $releaseDir | ForEach-Object {
    $size = if ($_.PSIsContainer) { "DIR" } else { "$([math]::Round($_.Length / 1MB, 2)) MB" }
    Write-Host "  $($_.Name) ($size)" -ForegroundColor White
}
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review RELEASE_NOTES.md and update with actual changes" -ForegroundColor White
Write-Host "2. Test installers using TESTING_CHECKLIST.md" -ForegroundColor White
Write-Host "3. Sign installers if not already signed" -ForegroundColor White
Write-Host "4. Create GitHub release and upload files" -ForegroundColor White
Write-Host "5. Update auto-update manifest" -ForegroundColor White
Write-Host "6. Announce the release" -ForegroundColor White
Write-Host ""

Write-Host "Release preparation completed successfully! 🎉" -ForegroundColor Green
