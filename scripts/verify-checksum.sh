#!/bin/bash
# Shell script to verify installer checksums
# Usage: ./scripts/verify-checksum.sh <installer-path> <checksum-file>

set -e

INSTALLER_PATH=$1
CHECKSUM_FILE=$2

if [ -z "$INSTALLER_PATH" ] || [ -z "$CHECKSUM_FILE" ]; then
    echo "Usage: ./scripts/verify-checksum.sh <installer-path> <checksum-file>"
    echo "Example: ./scripts/verify-checksum.sh cura-photo-manager_1.0.0_x64.dmg checksums.txt"
    exit 1
fi

echo "=== Cura Photo Manager Checksum Verification ==="
echo ""

# Check if installer exists
if [ ! -f "$INSTALLER_PATH" ]; then
    echo "✗ Installer not found: $INSTALLER_PATH"
    exit 1
fi

# Check if checksum file exists
if [ ! -f "$CHECKSUM_FILE" ]; then
    echo "✗ Checksum file not found: $CHECKSUM_FILE"
    exit 1
fi

INSTALLER_NAME=$(basename "$INSTALLER_PATH")
echo "Installer: $INSTALLER_NAME"
echo ""

# Calculate actual checksum
echo "Calculating SHA-256 checksum..."
ACTUAL_HASH=$(shasum -a 256 "$INSTALLER_PATH" | awk '{print $1}')
echo "Actual:   $ACTUAL_HASH"

# Read expected checksum from file
EXPECTED_HASH=$(grep "$INSTALLER_NAME" "$CHECKSUM_FILE" | awk '{print $1}')

if [ -z "$EXPECTED_HASH" ]; then
    echo "✗ No checksum found for $INSTALLER_NAME in $CHECKSUM_FILE"
    exit 1
fi

echo "Expected: $EXPECTED_HASH"
echo ""

# Compare checksums
if [ "$ACTUAL_HASH" = "$EXPECTED_HASH" ]; then
    echo "✓ Checksum verification PASSED"
    echo ""
    echo "The installer is authentic and has not been tampered with."
    exit 0
else
    echo "✗ Checksum verification FAILED"
    echo ""
    echo "WARNING: The installer may have been corrupted or tampered with!"
    echo "Do NOT install this file. Download a fresh copy from the official source."
    exit 1
fi
