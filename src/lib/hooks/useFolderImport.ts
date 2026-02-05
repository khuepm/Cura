import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppState } from '../store/AppContext';
import { useTauriCommands } from './useTauriCommands';
import { listenToScanProgress } from '../tauri/events';
import type { ImageRecord } from '../types';

/**
 * Hook for folder selection and image import flow
 */
export function useFolderImport() {
  const dispatch = useAppDispatch();
  const { scanning } = useAppState();
  const { scan, processImage } = useTauriCommands();
  const [error, setError] = useState<string | null>(null);

  // Listen to scan progress events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listenToScanProgress((progress) => {
        dispatch({
          type: 'SET_SCAN_PROGRESS',
          payload: {
            count: progress.count,
            currentFile: progress.current_file,
          },
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [dispatch]);

  /**
   * Open folder selection dialog
   * For now, we'll use a simple prompt. In production, this would use Tauri's dialog plugin.
   */
  const selectFolder = useCallback(async (): Promise<string | null> => {
    try {
      // TODO: Replace with Tauri dialog plugin when npm package is installed
      // For now, use a simple prompt for testing
      const folderPath = prompt('Enter folder path to scan:');
      return folderPath;
    } catch (error) {
      setError('Failed to open folder selection dialog');
      console.error('Folder selection error:', error);
      return null;
    }
  }, []);

  /**
   * Import images from a folder
   */
  const importFolder = useCallback(
    async (folderPath?: string): Promise<void> => {
      try {
        setError(null);

        // If no folder path provided, open selection dialog
        const selectedPath = folderPath || (await selectFolder());
        if (!selectedPath) {
          return;
        }

        // Scan the folder
        const scanResult = await scan(selectedPath);
        if (!scanResult) {
          setError('Failed to scan folder');
          return;
        }

        // Check for errors
        if (scanResult.errors.length > 0) {
          console.warn('Scan completed with errors:', scanResult.errors);
        }

        // Process images in batches
        const batchSize = 10;
        const images: ImageRecord[] = [];

        for (let i = 0; i < scanResult.media_files.length; i += batchSize) {
          const batch = scanResult.media_files.slice(i, i + batchSize);

          // Process batch in parallel
          const processedBatch = await Promise.all(
            batch.map((mediaFile, index) =>
              processImage(mediaFile.path, i + index + 1).then(img => 
                img ? { ...img, mediaType: mediaFile.media_type } : null
              )
            )
          );

          // Filter out failed images and add to results
          const validImages = processedBatch.filter(
            (img): img is ImageRecord =>
              img !== null &&
              img.id !== undefined &&
              img.path !== undefined &&
              img.mediaType !== undefined &&
              img.thumbnailSmall !== undefined &&
              img.thumbnailMedium !== undefined &&
              img.metadata !== undefined
          ) as ImageRecord[];

          images.push(...validImages);

          // Update state with processed images
          if (validImages.length > 0) {
            dispatch({ type: 'ADD_IMAGES', payload: validImages });
          }

          // Update progress
          dispatch({
            type: 'SET_SCAN_PROGRESS',
            payload: {
              count: i + batch.length,
              currentFile: batch[batch.length - 1]?.path || '',
            },
          });
        }

        // Complete scanning
        dispatch({ type: 'SET_IS_SCANNING', payload: false });

        console.log(
          `Import complete: ${images.length} images processed successfully`
        );
      } catch (error) {
        dispatch({ type: 'SET_IS_SCANNING', payload: false });
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to import folder';
        setError(errorMessage);
        console.error('Import error:', error);
      }
    },
    [selectFolder, scan, processImage, dispatch]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectFolder,
    importFolder,
    isScanning: scanning.isScanning,
    scanProgress: scanning.progress,
    error,
    clearError,
  };
}
