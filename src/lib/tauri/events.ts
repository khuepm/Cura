import { listen, UnlistenFn } from '@tauri-apps/api/event';

// Event payload types
export interface ScanProgressPayload {
  image_count: number;
  video_count: number;
  total_count: number;
  current_file: string;
}

export interface SyncProgressPayload {
  current: number;
  total: number;
  current_file: string;
}

/**
 * Listen for scan progress events from the backend
 * @param callback - Function to call when progress is updated
 * @returns Unlisten function to stop listening
 */
export async function listenToScanProgress(
  callback: (progress: ScanProgressPayload) => void
): Promise<UnlistenFn> {
  return await listen<ScanProgressPayload>('scan-progress', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for sync progress events from the backend
 * @param callback - Function to call when progress is updated
 * @returns Unlisten function to stop listening
 */
export async function listenToSyncProgress(
  callback: (progress: SyncProgressPayload) => void
): Promise<UnlistenFn> {
  return await listen<SyncProgressPayload>('sync-progress', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for error events from the backend
 * @param callback - Function to call when an error occurs
 * @returns Unlisten function to stop listening
 */
export async function listenToErrors(
  callback: (error: { message: string; component: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ message: string; component: string }>(
    'error',
    (event) => {
      callback(event.payload);
    }
  );
}
