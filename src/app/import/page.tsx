'use client';

import FolderImportButton from '@/components/FolderImportButton';
import PhotoGrid from '@/components/PhotoGrid';

export default function ImportPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight">
            Import Photos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl">
            Select a folder to scan and import your photos. The system will
            automatically extract metadata and generate thumbnails.
          </p>
        </div>
        <FolderImportButton />
      </div>

      {/* Photo Grid */}
      <div className="flex-1 min-h-0">
        <PhotoGrid />
      </div>
    </div>
  );
}
