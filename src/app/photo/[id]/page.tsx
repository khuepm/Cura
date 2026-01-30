"use client";

import { useParams, useRouter } from "next/navigation";
import PhotoDetail, { PhotoDetailData } from "@/components/PhotoDetail";
import { useState, useEffect } from "react";

export default function PhotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const photoId = params.id as string;
  const [photo, setPhoto] = useState<PhotoDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - will be replaced with Tauri backend call
    // Simulating async data fetch
    setTimeout(() => {
      setPhoto({
        id: parseInt(photoId),
        path: "/path/to/photo.jpg",
        thumbnailMedium: "https://via.placeholder.com/600",
        metadata: {
          captureDate: "2024-01-15T10:30:00Z",
          cameraMake: "Canon",
          cameraModel: "EOS R5",
          gpsCoordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
          dimensions: {
            width: 4096,
            height: 2731,
          },
          fileSize: 5242880,
          fileModified: "2024-01-15T10:30:00Z",
        },
        tags: [
          { label: "landscape", confidence: 0.95 },
          { label: "nature", confidence: 0.87 },
          { label: "mountains", confidence: 0.82 },
        ],
      });
      setIsLoading(false);
    }, 500);
  }, [photoId]);

  return (
    <div className="h-full flex flex-col">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Grid
        </button>
      </div>

      {/* Photo detail content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photo ? (
          <PhotoDetail photo={photo} onClose={() => router.back()} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-500">Photo not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
