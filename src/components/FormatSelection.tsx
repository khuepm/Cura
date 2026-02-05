"use client";

import React, { useState, useEffect } from "react";
import type { FormatConfig } from "@/lib/types";

interface FormatSelectionProps {
  currentConfig: FormatConfig;
  onConfigChange: (config: FormatConfig) => void;
}

interface FormatInfo {
  extension: string;
  description: string;
}

const IMAGE_FORMATS: FormatInfo[] = [
  { extension: "jpg", description: "JPEG Image" },
  { extension: "jpeg", description: "JPEG Image" },
  { extension: "png", description: "PNG Image" },
  { extension: "heic", description: "HEIC/HEIF Image" },
  { extension: "raw", description: "RAW Image" },
  { extension: "cr2", description: "Canon RAW" },
  { extension: "nef", description: "Nikon RAW" },
  { extension: "dng", description: "Adobe DNG" },
  { extension: "arw", description: "Sony RAW" },
  { extension: "webp", description: "WebP Image" },
  { extension: "gif", description: "GIF Image" },
  { extension: "bmp", description: "Bitmap Image" },
  { extension: "tiff", description: "TIFF Image" },
];

const VIDEO_FORMATS: FormatInfo[] = [
  { extension: "mp4", description: "MP4 Video" },
  { extension: "mov", description: "QuickTime Video" },
  { extension: "avi", description: "AVI Video" },
  { extension: "mkv", description: "Matroska Video" },
  { extension: "webm", description: "WebM Video" },
  { extension: "flv", description: "Flash Video" },
  { extension: "wmv", description: "Windows Media Video" },
  { extension: "m4v", description: "M4V Video" },
  { extension: "mpg", description: "MPEG Video" },
  { extension: "mpeg", description: "MPEG Video" },
  { extension: "3gp", description: "3GP Video" },
];

export default function FormatSelection({
  currentConfig,
  onConfigChange,
}: FormatSelectionProps) {
  const [imageFormats, setImageFormats] = useState<Set<string>>(
    new Set(currentConfig.imageFormats)
  );
  const [videoFormats, setVideoFormats] = useState<Set<string>>(
    new Set(currentConfig.videoFormats)
  );

  // Update local state when currentConfig changes
  useEffect(() => {
    setImageFormats(new Set(currentConfig.imageFormats));
    setVideoFormats(new Set(currentConfig.videoFormats));
  }, [currentConfig]);

  // Notify parent of changes
  useEffect(() => {
    onConfigChange({
      imageFormats: Array.from(imageFormats),
      videoFormats: Array.from(videoFormats),
    });
  }, [imageFormats, videoFormats, onConfigChange]);

  const handleImageFormatToggle = (format: string) => {
    setImageFormats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        // Don't allow deselecting the last format
        if (newSet.size > 1) {
          newSet.delete(format);
        }
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const handleVideoFormatToggle = (format: string) => {
    setVideoFormats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        // Don't allow deselecting the last format
        if (newSet.size > 1) {
          newSet.delete(format);
        }
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const handleSelectAllImages = () => {
    setImageFormats(new Set(IMAGE_FORMATS.map((f) => f.extension)));
  };

  const handleDeselectAllImages = () => {
    // Keep at least one format selected (the first one)
    setImageFormats(new Set([IMAGE_FORMATS[0].extension]));
  };

  const handleSelectAllVideos = () => {
    setVideoFormats(new Set(VIDEO_FORMATS.map((f) => f.extension)));
  };

  const handleDeselectAllVideos = () => {
    // Keep at least one format selected (the first one)
    setVideoFormats(new Set([VIDEO_FORMATS[0].extension]));
  };

  const imageCount = imageFormats.size;
  const videoCount = videoFormats.size;
  const totalImageFormats = IMAGE_FORMATS.length;
  const totalVideoFormats = VIDEO_FORMATS.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Image Formats Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Image Formats
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {imageCount} of {totalImageFormats} image formats selected
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAllImages}
              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllImages}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMAGE_FORMATS.map((format) => {
            const isSelected = imageFormats.has(format.extension);
            const isLastSelected = imageFormats.size === 1 && isSelected;

            return (
              <label
                key={format.extension}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  } ${isLastSelected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleImageFormatToggle(format.extension)}
                  disabled={isLastSelected}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    .{format.extension}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {format.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg mt-0.5">
            info
          </span>
          <div className="flex-1">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Examples:</strong> .jpg, .jpeg, .png, .heic, .raw, .cr2, .nef, .dng, .arw, .webp, .gif, .bmp, .tiff
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              At least one image format must be selected.
            </p>
          </div>
        </div>
      </div>

      {/* Video Formats Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Video Formats
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {videoCount} of {totalVideoFormats} video formats selected
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAllVideos}
              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllVideos}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VIDEO_FORMATS.map((format) => {
            const isSelected = videoFormats.has(format.extension);
            const isLastSelected = videoFormats.size === 1 && isSelected;

            return (
              <label
                key={format.extension}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  } ${isLastSelected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleVideoFormatToggle(format.extension)}
                  disabled={isLastSelected}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    .{format.extension}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {format.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg mt-0.5">
            info
          </span>
          <div className="flex-1">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Examples:</strong> .mp4, .mov, .avi, .mkv, .webm, .flv, .wmv, .m4v, .mpg, .mpeg, .3gp
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              At least one video format must be selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
