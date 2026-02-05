"use client";

import { useParams, useRouter } from "next/navigation";
import PhotoDetail, { PhotoDetailData } from "@/components/PhotoDetail";
import { useState, useEffect } from "react";
import { getImageById, getImageTags } from "@/lib/tauri/commands";
import type { RustImageRecord, RustTag } from "@/lib/tauri/commands";

// Allow dynamic params at runtime
export const dynamicParams = true;

export default function PhotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const photoId = params.id as string;
  const [photo, setPhoto] = useState<PhotoDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhoto() {
      try {
        setIsLoading(true);
        setError(null);

        const id = parseInt(photoId);
        if (isNaN(id)) {
          setError("Invalid photo ID");
          setIsLoading(false);
          return;
        }

        // Fetch image record and tags from backend
        const [imageRecord, tags] = await Promise.all([
          getImageById(id),
          getImageTags(id).catch(() => [] as RustTag[]), // Fallback to empty array if tags fail
        ]);

        if (!imageRecord) {
          setError("Photo not found");
          setIsLoading(false);
          return;
        }

        // Convert Rust types to frontend types
        const photoData: PhotoDetailData = {
          id: imageRecord.id,
          path: imageRecord.path,
          mediaType: imageRecord.media_type,
          thumbnailMedium: imageRecord.thumbnail_medium,
          metadata: {
            captureDate: imageRecord.capture_date || undefined,
            cameraMake: imageRecord.camera_make || undefined,
            cameraModel: imageRecord.camera_model || undefined,
            gpsCoordinates:
              imageRecord.gps_latitude !== null && imageRecord.gps_longitude !== null
                ? {
                  latitude: imageRecord.gps_latitude,
                  longitude: imageRecord.gps_longitude,
                }
                : undefined,
            dimensions: {
              width: imageRecord.width,
              height: imageRecord.height,
            },
            durationSeconds: imageRecord.duration_seconds || undefined,
            videoCodec: imageRecord.video_codec || undefined,
            fileSize: imageRecord.file_size,
            fileModified: imageRecord.file_modified,
          },
          tags: tags.map((tag) => ({
            label: tag.label,
            confidence: tag.confidence,
          })),
        };

        setPhoto(photoData);
      } catch (err) {
        console.error("Failed to load photo:", err);
        setError(err instanceof Error ? err.message : "Failed to load photo");
      } finally {
        setIsLoading(false);
      }
    }

    loadPhoto();
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
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">
              error_outline
            </span>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : photo ? (
          <PhotoDetail photo={photo} onClose={() => router.back()} />
        ) : null}
      </div>
    </div>
  );
}
