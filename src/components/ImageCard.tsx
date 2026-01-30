import React from "react";

interface ImageCardProps {
  title: string;
  fileSize: string;
  fileType: string;
  imageUrl: string;
  alt: string;
  selected?: boolean;
}

export default function ImageCard({
  title,
  fileSize,
  fileType,
  imageUrl,
  alt,
  selected = false,
}: ImageCardProps) {
  return (
    <div
      className={`group relative bg-white dark:bg-[#1e293b] rounded-xl border ${selected ? "border-2 border-primary" : "border-slate-200 dark:border-slate-700"
        } overflow-hidden shadow-sm hover:shadow-lg transition-all hover:border-primary/50`}
    >
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {selected && (
          <div className="absolute inset-0 bg-primary/10 z-10"></div>
        )}
        <img
          alt={alt}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          src={imageUrl}
        />
        <div
          className={`absolute top-3 left-3 z-20 ${selected ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"
            }`}
        >
          <input
            checked={selected}
            readOnly
            className="form-checkbox w-5 h-5 text-primary rounded border-white focus:ring-primary shadow-sm cursor-pointer"
            type="checkbox"
          />
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3
            className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-2"
            title={title}
          >
            {title}
          </h3>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined text-[18px]">
              more_vert
            </span>
          </button>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>{fileSize}</span>
          <span>{fileType}</span>
        </div>
      </div>
    </div>
  );
}
