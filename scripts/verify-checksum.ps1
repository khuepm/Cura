# PowerShell script to verify installer checksums
# Usage: .\scripts\verify-checksum.ps1 -InstallerPath "path\to\installer.exe" -ChecksumFile "checksums.txt"

param(
    [Parameter(Mandatory=$true)]
    [string]$InstallerPath,
    
    [Parameter(Mandatory=$true)]
    [string]$ChecksumFile
)

$ErrorActionPreference = "Stop"

Write-Host "=== Cura Photo Manager Checksum Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check if installer exists
if (-not (Test-Path $InstallerPath)) {
    Write-Host "✗ Installer not found: $InstallerPath" -ForegroundColor Red
    exit 1
}

# Check if checksum file exists
if (-not (Test-Path $ChecksumFile)) {
    Write-Host "✗ Checksum file not found: $ChecksumFile" -ForegroundColor Red
    exit 1
}

$installerName = Split-Path $InstallerPath -Leaf
Write-Host "Installer: $installerName" -ForegroundColor White
Write-Host ""

# Calculate actual checksum
Write-Host "Calculating SHA-256 checksum..." -ForegroundColor Yellow
$actualHash = (Get-FileHash -Algorithm SHA256 -Path $InstallerPath).Hash
Write-Host "Actual:   $actualHash" -ForegroundColor White

# Read expected checksum from file
$checksumContent = Get-Content $ChecksumFile
$expectedHash = $null

foreach ($line in $checksumContent) {
    if ($line -match "^([a-fA-F0-9]{64})\s+(.+)$") {
        $hash = $matches[1]
        $file = $matches[2]
        
        if ($file -eq $installerName) {
            $expectedHash = $hash
            break
        }
    }
}

if ($null -eq $expectedHash) {
    Write-Host "✗ No checksum found for $installerName in $ChecksumFile" -ForegroundColor Red
    exit 1
}

Write-Host "Expected: $expectedHash" -ForegroundColor White
Write-Host ""

# Compare checksums
if ($actualHash -eq $expectedHash) {
    Write-Host "✓ Checksum verification PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "The installer is authentic and has not been tampered with." -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Checksum verification FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "WARNING: The installer may have been corrupted or tampered with!" -ForegroundColor Red
    Write-Host "Do NOT install this file. Download a fresh copy from the official source." -ForegroundColor Red
    exit 1
}
