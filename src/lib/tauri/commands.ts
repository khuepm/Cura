import { invoke } from '@tauri-apps/api/core';

// Rust backend types
export type MediaType = 'image' | 'video';

export interface MediaFile {
  path: string;
  media_type: MediaType;
}

export interface ScanResult {
  media_files: MediaFile[];
  total_count: number;
  image_count: number;
  video_count: number;
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  message: string;
}

export interface FormatConfig {
  image_formats: string[];
  video_formats: string[];
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
 * Scan a folder for media files (images and videos)
 * @param folderPath - Path to the folder to scan
 * @param config - Optional format configuration
 * @returns ScanResult with discovered media files and errors
 */
export async function scanFolder(
  folderPath: string,
  config?: FormatConfig
): Promise<ScanResult> {
  try {
    const result = await invoke<ScanResult>('scan_folder', {
      folderPath,
      config: config || null,
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

/**
 * Save tags for an image
 * @param imageId - Database ID of the image
 * @param tags - Array of [label, confidence] tuples
 */
export async function saveTags(
  imageId: number,
  tags: Array<[string, number]>
): Promise<void> {
  try {
    await invoke('save_tags', {
      imageId,
      tags,
    });
  } catch (error) {
    throw new Error(`Failed to save tags: ${error}`);
  }
}

/**
 * Search images with filters
 * @param filters - Search filters
 * @returns Array of matching image records
 */
export async function searchImages(filters: {
  text?: string;
  tags?: string[];
  dateStart?: string;
  dateEnd?: string;
  cameraModel?: string;
}): Promise<RustImageRecord[]> {
  try {
    const result = await invoke<RustImageRecord[]>('search_images', {
      text: filters.text || null,
      tags: filters.tags || null,
      dateStart: filters.dateStart || null,
      dateEnd: filters.dateEnd || null,
      cameraModel: filters.cameraModel || null,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to search images: ${error}`);
  }
}

/**
 * Get tags for an image
 * @param imageId - Database ID of the image
 * @returns Array of tags with labels and confidence scores
 */
export async function getImageTags(imageId: number): Promise<RustTag[]> {
  try {
    const result = await invoke<RustTag[]>('get_image_tags', {
      imageId,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get image tags: ${error}`);
  }
}

/**
 * Get an image by ID
 * @param imageId - Database ID of the image
 * @returns Image record or null if not found
 */
export async function getImageById(imageId: number): Promise<RustImageRecord | null> {
  try {
    const result = await invoke<RustImageRecord | null>('get_image_by_id', {
      imageId,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get image: ${error}`);
  }
}

// Rust types from database
export interface RustImageRecord {
  id: number;
  path: string;
  thumbnail_small: string;
  thumbnail_medium: string;
  checksum: string;
  capture_date: string | null;
  camera_make: string | null;
  camera_model: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  width: number;
  height: number;
  file_size: number;
  file_modified: string;
  created_at: string;
  synced_at: string | null;
  sync_status: string;
}

export interface RustTag {
  id: number;
  image_id: number;
  label: string;
  confidence: number;
  created_at: string;
}

/**
 * Save an embedding for an image
 * @param imageId - Database ID of the image
 * @param embedding - Embedding vector
 * @param modelVersion - Model version string
 */
export async function saveEmbedding(
  imageId: number,
  embedding: number[],
  modelVersion: string
): Promise<void> {
  try {
    await invoke('save_embedding', {
      imageId,
      embedding,
      modelVersion,
    });
  } catch (error) {
    throw new Error(`Failed to save embedding: ${error}`);
  }
}

/**
 * Get all embeddings from the database
 * @returns Array of [imageId, embedding] tuples
 */
export async function getAllEmbeddings(): Promise<Array<[number, number[]]>> {
  try {
    const result = await invoke<Array<[number, number[]]>>('get_all_embeddings');
    return result;
  } catch (error) {
    throw new Error(`Failed to get embeddings: ${error}`);
  }
}
