import { useCallback } from 'react';
import { useAppDispatch } from '../store/AppContext';
import {
  scanFolder,
  extractMetadata,
  extractVideoMetadata,
  generateThumbnails,
  generateVideoThumbnails,
  type ScanResult,
  type RustImageMetadata,
  type ThumbnailPaths,
  type MediaType,
} from '../tauri/commands';
import { handleError } from '../utils/errorHandler';
import type { ImageRecord, ImageMetadata } from '../types';

/**
 * Hook for using Tauri commands with state management
 */
export function useTauriCommands() {
  const dispatch = useAppDispatch();

  /**
   * Convert Rust metadata to frontend ImageMetadata type
   */
  const convertMetadata = useCallback(
    (rustMetadata: RustImageMetadata): ImageMetadata => {
      return {
        captureDate: rustMetadata.capture_date
          ? new Date(rustMetadata.capture_date)
          : undefined,
        cameraMake: rustMetadata.camera_make ?? undefined,
        cameraModel: rustMetadata.camera_model ?? undefined,
        gpsCoordinates:
          rustMetadata.gps_latitude !== null &&
          rustMetadata.gps_longitude !== null
            ? {
                latitude: rustMetadata.gps_latitude,
                longitude: rustMetadata.gps_longitude,
              }
            : undefined,
        dimensions: {
          width: rustMetadata.width,
          height: rustMetadata.height,
        },
        durationSeconds: undefined, // Not available from extract_metadata
        videoCodec: undefined, // Not available from extract_metadata
        fileSize: rustMetadata.file_size,
        fileModified: new Date(rustMetadata.file_modified),
      };
    },
    []
  );

  /**
   * Scan a folder for images
   */
  const scan = useCallback(
    async (folderPath: string): Promise<ScanResult | null> => {
      try {
        dispatch({ type: 'SET_IS_SCANNING', payload: true });
        dispatch({
          type: 'SET_SCAN_PROGRESS',
          payload: { count: 0, imageCount: 0, videoCount: 0, currentFile: '' },
        });

        const result = await scanFolder(folderPath);

        dispatch({ type: 'SET_IS_SCANNING', payload: false });
        dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderPath });

        return result;
      } catch (error) {
        dispatch({ type: 'SET_IS_SCANNING', payload: false });
        const errorMessage = handleError(error, 'Scan Folder');
        throw new Error(errorMessage);
      }
    },
    [dispatch]
  );

  /**
   * Extract metadata from an image
   */
  const getMetadata = useCallback(
    async (imagePath: string): Promise<ImageMetadata | null> => {
      try {
        const rustMetadata = await extractMetadata(imagePath);
        return convertMetadata(rustMetadata);
      } catch (error) {
        const errorMessage = handleError(error, 'Extract Metadata');
        throw new Error(errorMessage);
      }
    },
    [convertMetadata]
  );

  /**
   * Extract metadata from a video
   */
  const getVideoMetadata = useCallback(
    async (videoPath: string): Promise<ImageMetadata | null> => {
      try {
        const rustMetadata = await extractVideoMetadata(videoPath);
        return convertMetadata(rustMetadata);
      } catch (error) {
        const errorMessage = handleError(error, 'Extract Video Metadata');
        throw new Error(errorMessage);
      }
    },
    [convertMetadata]
  );

  /**
   * Generate thumbnails for an image
   */
  const getThumbnails = useCallback(
    async (imagePath: string): Promise<ThumbnailPaths | null> => {
      try {
        const thumbnails = await generateThumbnails(imagePath);
        return thumbnails;
      } catch (error) {
        const errorMessage = handleError(error, 'Generate Thumbnails');
        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Generate thumbnails for a video
   */
  const getVideoThumbnails = useCallback(
    async (videoPath: string): Promise<ThumbnailPaths | null> => {
      try {
        const thumbnails = await generateVideoThumbnails(videoPath);
        return thumbnails;
      } catch (error) {
        const errorMessage = handleError(error, 'Generate Video Thumbnails');
        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Process a single media file: extract metadata and generate thumbnails
   * Handles both images and videos
   */
  const processImage = useCallback(
    async (
      mediaPath: string,
      mediaId: number,
      mediaType: MediaType = 'image'
    ): Promise<Partial<ImageRecord> | null> => {
      try {
        // Extract metadata and generate thumbnails in parallel
        // Use appropriate functions based on media type
        const [metadata, thumbnails] = await Promise.all([
          mediaType === 'video' ? getVideoMetadata(mediaPath) : getMetadata(mediaPath),
          mediaType === 'video' ? getVideoThumbnails(mediaPath) : getThumbnails(mediaPath),
        ]);

        if (!metadata || !thumbnails) {
          return null;
        }

        return {
          id: mediaId,
          path: mediaPath,
          mediaType,
          thumbnailSmall: thumbnails.small,
          thumbnailMedium: thumbnails.medium,
          metadata,
          tags: [],
          syncStatus: 'pending',
        };
      } catch (error) {
        const errorMessage = handleError(error, 'Process Media');
        console.error(`Failed to process ${mediaType} ${mediaPath}:`, errorMessage);
        return null;
      }
    },
    [getMetadata, getVideoMetadata, getThumbnails, getVideoThumbnails]
  );

  return {
    scan,
    getMetadata,
    getVideoMetadata,
    getThumbnails,
    getVideoThumbnails,
    processImage,
  };
}
