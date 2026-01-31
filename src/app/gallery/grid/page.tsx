"use client";

import PhotoGrid, { PhotoGridItem } from "@/components/PhotoGrid";
import { useState } from "react";

export default function GalleryGrid() {
  // Mock data for demonstration - will be replaced with real data from Tauri backend
  const [photos] = useState<PhotoGridItem[]>([]);
  const [isLoading] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Photo Grid
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse all your photos in a grid layout
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <PhotoGrid photos={photos} isLoading={isLoading} />
      </div>
    </div>
  );
}
