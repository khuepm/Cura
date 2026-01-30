"use client";

import React from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { useRouter } from "next/navigation";

export interface PhotoGridItem {
  id: number;
  thumbnailSmall: string;
  captureDate?: string;
  width: number;
  height: number;
}

interface PhotoGridProps {
  photos: PhotoGridItem[];
  isLoading?: boolean;
}

const COLUMN_WIDTH = 250;
const ROW_HEIGHT = 250;
const GAP = 16;

export default function PhotoGrid({ photos, isLoading = false }: PhotoGridProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const columnCount = Math.max(1, Math.floor(dimensions.width / (COLUMN_WIDTH + GAP)));
  const rowCount = Math.ceil(photos.length / columnCount);

  const handlePhotoClick = (photoId: number) => {
    router.push(`/photo/${photoId}`);
  };

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= photos.length) return null;

    const photo = photos[index];

    return (
      <div
        style={{
          ...style,
          left: (style.left as number) + GAP / 2,
          top: (style.top as number) + GAP / 2,
          width: (style.width as number) - GAP,
          height: (style.height as number) - GAP,
        }}
      >
        <div
          onClick={() => handlePhotoClick(photo.id)}
          className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
        >
          <img
            src={photo.thumbnailSmall}
            alt={`Photo ${photo.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {photo.captureDate && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(photo.captureDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
          photo_library
        </span>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          No photos yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Select a folder to start importing your photos
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={COLUMN_WIDTH + GAP}
          height={dimensions.height}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT + GAP}
          width={dimensions.width}
        >
          {Cell}
        </Grid>
      )}
    </div>
  );
}

function PhotoGridSkeleton() {
  const skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {skeletonItems.map((i) => (
        <div
          key={i}
          className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
