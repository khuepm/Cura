"use client";

import React from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/lib/store/AppContext";
import type { MediaType } from "@/lib/types";

export interface PhotoGridItem {
  id: number;
  thumbnailSmall: string;
  captureDate?: string;
  width: number;
  height: number;
  mediaType: MediaType;
}

interface PhotoGridProps {
  photos?: PhotoGridItem[];
  isLoading?: boolean;
}

const COLUMN_WIDTH = 250;
const ROW_HEIGHT = 250;
const GAP = 16;

export default function PhotoGrid({ photos: propPhotos, isLoading = false }: PhotoGridProps) {
  const router = useRouter();
  const { images, scanning } = useAppState();
  const dispatch = useAppDispatch();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  // Use photos from props if provided, otherwise use photos from state
  const allPhotos = React.useMemo(() => {
    if (propPhotos) {
      return propPhotos;
    }

    // Convert state images to PhotoGridItem format
    return Array.from(images.items.values()).map((image) => ({
      id: image.id,
      thumbnailSmall: image.thumbnailSmall,
      captureDate: image.metadata.captureDate?.toISOString(),
      width: image.metadata.dimensions.width,
      height: image.metadata.dimensions.height,
      mediaType: image.mediaType,
    }));
  }, [propPhotos, images.items]);

  // Filter photos based on media type filter
  const photos = React.useMemo(() => {
    if (images.mediaTypeFilter === 'all') {
      return allPhotos;
    }
    return allPhotos.filter(photo => photo.mediaType === images.mediaTypeFilter);
  }, [allPhotos, images.mediaTypeFilter]);

  const actualIsLoading = isLoading || scanning.isScanning;

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

  const handleMediaTypeFilterChange = (filter: 'all' | 'image' | 'video') => {
    dispatch({ type: 'SET_MEDIA_TYPE_FILTER', payload: filter });
  };

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= photos.length) return null;

    const photo = photos[index];
    const isVideo = photo.mediaType === 'video';

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
          className="relative w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
        >
          <img
            src={photo.thumbnailSmall}
            alt={isVideo ? `Video ${photo.id}` : `Photo ${photo.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Video indicator overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 rounded-full p-3">
                <span className="material-symbols-outlined text-white text-4xl">
                  play_circle
                </span>
              </div>
            </div>
          )}
          {/* Date overlay on hover */}
          {photo.captureDate && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(photo.captureDate).toLocaleDateString()}
            </div>
          )}
          {/* Media type badge */}
          {isVideo && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              VIDEO
            </div>
          )}
        </div>
      </div>
    );
  };

  if (actualIsLoading) {
    return <PhotoGridSkeleton />;
  }

  if (allPhotos.length === 0) {
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
    <div className="flex flex-col h-full">
      {/* Media type filter */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Show:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleMediaTypeFilterChange('all')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${images.mediaTypeFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
          >
            All ({allPhotos.length})
          </button>
          <button
            onClick={() => handleMediaTypeFilterChange('image')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${images.mediaTypeFilter === 'image'
                ? 'bg-primary text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
          >
            Images ({allPhotos.filter(p => p.mediaType === 'image').length})
          </button>
          <button
            onClick={() => handleMediaTypeFilterChange('video')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${images.mediaTypeFilter === 'video'
                ? 'bg-primary text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
          >
            Videos ({allPhotos.filter(p => p.mediaType === 'video').length})
          </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} className="flex-1">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
              {images.mediaTypeFilter === 'video' ? 'videocam' : 'photo'}
            </span>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No {images.mediaTypeFilter === 'all' ? 'media' : images.mediaTypeFilter + 's'} found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try changing the filter or import more files
            </p>
          </div>
        ) : dimensions.width > 0 && dimensions.height > 0 ? (
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
        ) : null}
      </div>
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
