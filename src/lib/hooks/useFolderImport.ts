import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
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
  const { scan } = useTauriCommands();
  const [error, setError] = useState<string | null>(null);

  // Listen to scan progress events (emitted during scanFolder Tauri call)
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listenToScanProgress((progress) => {
        dispatch({
          type: 'SET_SCAN_PROGRESS',
          payload: {
            count: progress.total_count,
            imageCount: progress.image_count,
            videoCount: progress.video_count,
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
        title: 'Select folder to import',
      });

      return selected as string | null;
    } catch (err) {
      setError('Failed to open folder selection dialog');
      console.error('Folder selection error:', err);
      return null;
    }
  }, []);

  /**
   * Import images from a folder.
   *
   * Strategy: skip ALL per-file Tauri processing. After the folder scan
   * (which is near-instant), every media file is added to state immediately
   * as a lightweight stub:
   *   - Images: thumbnailSmall = convertFileSrc(path) — the browser loads the
   *     original file directly via Tauri's asset protocol, no Rust processing.
   *   - Videos: thumbnailSmall = '' — PhotoGrid shows the movie icon instead.
   *
   * This makes the grid appear in milliseconds regardless of folder size.
   */
  const importFolder = useCallback(
    async (folderPath?: string): Promise<void> => {
      try {
        setError(null);

        // Open folder selection dialog if no path provided
        const selectedPath = folderPath || (await selectFolder());
        if (!selectedPath) {
          return;
        }

        // Scan the folder — fast, returns list of file paths + media types
        const scanResult = await scan(selectedPath);
        if (!scanResult) {
          setError('Failed to scan folder');
          return;
        }

        if (scanResult.errors.length > 0) {
          console.warn('Scan completed with errors:', scanResult.errors);
        }

        // Build record stubs for all files — zero per-file Tauri calls
        const stubs: ImageRecord[] = scanResult.media_files.map((mediaFile, index) => ({
          id: index + 1,
          path: mediaFile.path,
          mediaType: mediaFile.media_type,
          // Images: use convertFileSrc so the browser loads from disk directly
          // Videos: empty string → PhotoGrid renders the movie icon placeholder
          thumbnailSmall: mediaFile.media_type === 'video' ? '' : convertFileSrc(mediaFile.path),
          thumbnailMedium: mediaFile.media_type === 'video' ? '' : convertFileSrc(mediaFile.path),
          checksum: '',
          metadata: {
            dimensions: { width: 0, height: 0 },
            fileSize: 0,
            fileModified: new Date(),
          },
          tags: [],
          syncStatus: 'pending',
        }));

        // Dispatch all records in one shot — grid renders immediately
        dispatch({ type: 'ADD_IMAGES', payload: stubs });
        dispatch({ type: 'SET_IS_SCANNING', payload: false });

        console.log(
          `Import complete: ${stubs.length} files added ` +
          `(${scanResult.image_count} images, ${scanResult.video_count} videos)`
        );
      } catch (err) {
        dispatch({ type: 'SET_IS_SCANNING', payload: false });
        const errorMessage = err instanceof Error ? err.message : 'Failed to import folder';
        setError(errorMessage);
        console.error('Import error:', err);
      }
    },
    [selectFolder, scan, dispatch]
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
