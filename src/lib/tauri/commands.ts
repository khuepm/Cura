import { invoke } from '@tauri-apps/api/core';

// Rust backend types
export interface ScanResult {
  images: string[];
  total_count: number;
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  message: string;
}

export interface RustImageMetadata {
  path: string;
  capture_date: string | null;
  camera_make: string | null;
  camera_model: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  width: number;
  height: number;
  file_size: number;
  file_modified: string;
}

export interface ThumbnailPaths {
  small: string;
  medium: string;
}

/**
 * Scan a folder for images
 * @param folderPath - Path to the folder to scan
 * @returns ScanResult with discovered images and errors
 */
export async function scanFolder(folderPath: string): Promise<ScanResult> {
  try {
    const result = await invoke<ScanResult>('scan_folder', {
      folderPath,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to scan folder: ${error}`);
  }
}

/**
 * Extract metadata from an image
 * @param imagePath - Path to the image file
 * @returns ImageMetadata with EXIF and file system data
 */
export async function extractMetadata(
  imagePath: string
): Promise<RustImageMetadata> {
  try {
    const result = await invoke<RustImageMetadata>('extract_metadata', {
      imagePath,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error}`);
  }
}

/**
 * Generate thumbnails for an image
 * @param imagePath - Path to the image file
 * @returns ThumbnailPaths with paths to small and medium thumbnails
 */
export async function generateThumbnails(
  imagePath: string
): Promise<ThumbnailPaths> {
  try {
    const result = await invoke<ThumbnailPaths>('generate_thumbnails', {
      imagePath,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to generate thumbnails: ${error}`);
  }
}
