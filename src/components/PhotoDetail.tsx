"use client";

import React, { useState } from "react";

export interface PhotoMetadata {
  captureDate?: string;
  cameraMake?: string;
  cameraModel?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  fileModified: string;
}

export interface PhotoTag {
  label: string;
  confidence: number;
}

export interface PhotoDetailData {
  id: number;
  path: string;
  thumbnailMedium: string;
  metadata: PhotoMetadata;
  tags: PhotoTag[];
}

interface PhotoDetailProps {
  photo: PhotoDetailData;
  onClose?: () => void;
}

export default function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullRes, setShowFullRes] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Image viewer */}
      <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden relative">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={photo.thumbnailMedium}
          alt={`Photo ${photo.id}`}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setImageLoaded(true)}
        />
        {imageLoaded && (
          <button
            onClick={() => setShowFullRes(!showFullRes)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showFullRes ? "zoom_out" : "zoom_in"}
            </span>
            <span className="text-sm font-medium">
              {showFullRes ? "Zoom Out" : "View Full Resolution"}
            </span>
          </button>
        )}
      </div>

      {/* Metadata panel */}
      <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto">
        {/* Basic info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Photo Information
          </h3>
          <div className="space-y-3">
            <InfoRow
              icon="image"
              label="Dimensions"
              value={`${photo.metadata.dimensions.width} × ${photo.metadata.dimensions.height}`}
            />
            <InfoRow
              icon="storage"
              label="File Size"
              value={formatFileSize(photo.metadata.fileSize)}
            />
            {photo.metadata.captureDate && (
              <InfoRow
                icon="calendar_today"
                label="Captured"
                value={formatDate(photo.metadata.captureDate)}
              />
            )}
            <InfoRow
              icon="schedule"
              label="Modified"
              value={formatDate(photo.metadata.fileModified)}
            />
          </div>
        </div>

        {/* Camera info */}
        {(photo.metadata.cameraMake || photo.metadata.cameraModel) && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Camera
            </h3>
            <div className="space-y-3">
              {photo.metadata.cameraMake && (
                <InfoRow
                  icon="photo_camera"
                  label="Make"
                  value={photo.metadata.cameraMake}
                />
              )}
              {photo.metadata.cameraModel && (
                <InfoRow
                  icon="camera"
                  label="Model"
                  value={photo.metadata.cameraModel}
                />
              )}
            </div>
          </div>
        )}

        {/* Location */}
        {photo.metadata.gpsCoordinates && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Location
            </h3>
            <div className="space-y-3">
              <InfoRow
                icon="location_on"
                label="Coordinates"
                value={`${photo.metadata.gpsCoordinates.latitude.toFixed(6)}, ${photo.metadata.gpsCoordinates.longitude.toFixed(6)}`}
              />
              <div className="mt-3 h-48 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  Map view (to be implemented)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Tags */}
        {photo.tags.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              AI-Generated Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {photo.tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full"
                >
                  <span className="text-sm font-medium">{tag.label}</span>
                  <span className="text-xs opacity-70">
                    {Math.round(tag.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-slate-400 text-[20px] mt-0.5">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
