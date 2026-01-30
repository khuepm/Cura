# PowerShell script to build release artifacts for Windows
# Usage: .\scripts\build-release.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Cura Photo Manager Release Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Get version from package.json
$packageJson = Get-Content -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "Building version: $version" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18 or later." -ForegroundColor Red
    exit 1
}

# Check Rust
try {
    $rustVersion = rustc --version
    Write-Host "✓ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Rust not found. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build release
Write-Host "Building release artifacts..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

# Generate checksums
Write-Host "Generating checksums..." -ForegroundColor Yellow

$bundleDir = "src-tauri\target\release\bundle"
$checksumFile = "checksums-windows-$version.txt"

# Remove old checksum file if exists
if (Test-Path $checksumFile) {
    Remove-Item $checksumFile
}

# Create checksums for all installers
$installers = @()

# MSI installer
$msiPath = Get-ChildItem -Path "$bundleDir\msi\*.msi" -ErrorAction SilentlyContinue
if ($msiPath) {
    $installers += $msiPath
}

# NSIS installer
$nsisPath = Get-ChildItem -Path "$bundleDir\nsis\*-setup.exe" -ErrorAction SilentlyContinue
if ($nsisPath) {
    $installers += $nsisPath
}

if ($installers.Count -eq 0) {
    Write-Host "✗ No installers found" -ForegroundColor Red
    exit 1
}

foreach ($installer in $installers) {
    $hash = Get-FileHash -Algorithm SHA256 -Path $installer.FullName
    $fileName = $installer.Name
    $hashValue = $hash.Hash
    
    # Write to console
    Write-Host "  $fileName" -ForegroundColor Cyan
    Write-Host "  SHA-256: $hashValue" -ForegroundColor Gray
    Write-Host ""
    
    # Write to file
    Add-Content -Path $checksumFile -Value "$hashValue  $fileName"
}

Write-Host "✓ Checksums saved to $checksumFile" -ForegroundColor Green
Write-Host ""

# Display build artifacts
Write-Host "=== Build Artifacts ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installers:" -ForegroundColor Yellow
foreach ($installer in $installers) {
    $size = [math]::Round($installer.Length / 1MB, 2)
    Write-Host "  $($installer.Name) ($size MB)" -ForegroundColor White
    Write-Host "  Location: $($installer.FullName)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Checksums:" -ForegroundColor Yellow
Write-Host "  $checksumFile" -ForegroundColor White
Write-Host ""

# Display next steps
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test the installers on clean Windows systems" -ForegroundColor White
Write-Host "2. Sign the installers with your code signing certificate" -ForegroundColor White
Write-Host "3. Upload to release server or GitHub Releases" -ForegroundColor White
Write-Host "4. Update the auto-update manifest" -ForegroundColor White
Write-Host "5. Announce the release" -ForegroundColor White
Write-Host ""

Write-Host "Build completed successfully! 🎉" -ForegroundColor Green
