import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppState } from '../store/AppContext';
import { useTauriCommands } from './useTauriCommands';
import { listenToScanProgress } from '../tauri/events';
import type { ImageRecord } from '../types';

// Tauri dialog API
async function openFolderDialog(): Promise<string | null> {
  try {
    // Use Tauri's dialog API
    const { open } = await import('@tauri-apps/api/dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select a folder to scan for images',
    });

    if (selected && typeof selected === 'string') {
      return selected;
    }

    return null;
  } catch (error) {
    console.error('Failed to open folder dialog:', error);
    return null;
  }
}

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
   */
  const selectFolder = useCallback(async (): Promise<string | null> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a folder to scan for images',
      });

      if (selected && typeof selected === 'string') {
        return selected;
      }

      return null;
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

        for (let i = 0; i < scanResult.images.length; i += batchSize) {
          const batch = scanResult.images.slice(i, i + batchSize);

          // Process batch in parallel
          const processedBatch = await Promise.all(
            batch.map((imagePath, index) =>
              processImage(imagePath, i + index + 1)
            )
          );

          // Filter out failed images and add to results
          const validImages = processedBatch.filter(
            (img): img is ImageRecord =>
              img !== null &&
              img.id !== undefined &&
              img.path !== undefined &&
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
              currentFile: batch[batch.length - 1] || '',
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
