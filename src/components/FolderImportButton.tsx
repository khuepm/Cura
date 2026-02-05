'use client';

import { useFolderImport } from '@/lib/hooks/useFolderImport';

export default function FolderImportButton() {
  const { importFolder, isScanning, scanProgress, error, clearError } =
    useFolderImport();

  const handleImport = async () => {
    await importFolder();
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleImport}
        disabled={isScanning}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isScanning ? 'hourglass_empty' : 'folder_open'}
        </span>
        {isScanning ? 'Scanning...' : 'Import Folder'}
      </button>

      {isScanning && (
        <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
            <span>
              Scanned {scanProgress.count} media files
              {scanProgress.imageCount !== undefined && scanProgress.videoCount !== undefined && (
                <span className="ml-1 text-slate-500 dark:text-slate-500">
                  ({scanProgress.imageCount} images, {scanProgress.videoCount} videos)
                </span>
              )}
            </span>
          </div>
          {scanProgress.currentFile && (
            <div className="truncate max-w-xs" title={scanProgress.currentFile}>
              {scanProgress.currentFile}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-200 rounded-lg">
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">
            error
          </span>
          <div className="flex-1">
            <p>{error}</p>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/40 rounded p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
