'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface UpdateInfo {
  version: string;
  current_version: string;
  date: string;
  body: string;
}

interface UpdateStatus {
  available: boolean;
  info?: UpdateInfo;
  error?: string;
}

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Listen for update-available event from backend
    const unlisten = listen<UpdateStatus>('update-available', (event) => {
      if (event.payload.available && event.payload.info) {
        setUpdateAvailable(true);
        setUpdateInfo(event.payload.info);
        setShowNotification(true);
      }
    });

    // Listen for download progress
    const unlistenProgress = listen<number>('update-download-progress', (event) => {
      setDownloadProgress(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenProgress.then((fn) => fn());
    };
  }, []);

  const handleCheckForUpdates = async () => {
    try {
      const status = await invoke<UpdateStatus>('check_for_updates');

      if (status.available && status.info) {
        setUpdateAvailable(true);
        setUpdateInfo(status.info);
        setShowNotification(true);
      } else if (status.error) {
        console.error('Update check failed:', status.error);
      } else {
        alert('You are running the latest version!');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateAvailable) return;

    setIsInstalling(true);
    setDownloadProgress(0);

    try {
      await invoke('install_update');
      // The app will restart automatically after installation
    } catch (error) {
      console.error('Failed to install update:', error);
      alert('Failed to install update. Please try again later.');
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !updateInfo) {
    return (
      <button
        onClick={handleCheckForUpdates}
        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        Check for Updates
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-blue-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Update Available
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Version {updateInfo.version} is now available (you have {updateInfo.current_version})
        </p>
        {updateInfo.date && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
            Released: {new Date(updateInfo.date).toLocaleDateString()}
          </p>
        )}
        {updateInfo.body && (
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
            {updateInfo.body}
          </div>
        )}
      </div>

      {isInstalling && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Downloading update...</span>
            <span>{Math.round(downloadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleInstallUpdate}
          disabled={isInstalling}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isInstalling ? 'Installing...' : 'Install Update'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={isInstalling}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
