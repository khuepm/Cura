"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white dark:bg-[#151f2b] border-r border-slate-200 dark:border-slate-800 h-full overflow-y-auto py-4">
      <div className="px-4 mb-6">
        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all">
          <span className="material-symbols-outlined">folder_open</span>
          <span>Select Folder</span>
        </button>
      </div>
      <div className="flex flex-col gap-1 px-2">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Library
        </div>

        {/* Import Photos */}
        <Link
          href="/import"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/import")
            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive("/import") ? "fill-1" : ""}`}>
            upload_file
          </span>
          <span className="text-sm font-medium">Import Photos</span>
        </Link>

        {/* Photo Grid View */}
        <Link
          href="/gallery/grid"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/gallery/grid")
            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive("/gallery/grid") ? "fill-1" : ""}`}>
            photo_library
          </span>
          <span className="text-sm font-medium">Photo Grid</span>
        </Link>

        {/* Smart Filters */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/")
            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive("/") ? "fill-1" : ""}`}>
            filter_alt
          </span>
          <span className="text-sm font-medium">Smart Filters</span>
        </Link>

        <div className="my-2 border-t border-slate-200 dark:border-slate-700 mx-3"></div>
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Cloud & Storage
        </div>
        <a
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Google Drive</span>
            <span className="text-xs text-slate-400">Not connected</span>
          </div>
        </a>
        <Link
          href="/trash"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/trash")
            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive("/trash") ? "fill-1" : ""}`}>
            delete
          </span>
          <span className="text-sm font-medium">Trash</span>
        </Link>
      </div>
    </aside>
  );
}
