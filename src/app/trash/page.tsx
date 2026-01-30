import ImageCard from "@/components/ImageCard";
import Link from "next/link";

const deletedImages = [
  {
    title: "old_draft_01.jpg",
    fileSize: "1.2 MB",
    fileType: "JPG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHYK0AfNW7NYqLX1On_6F55b7fKDwdXpURp1UMEOh0fTEJirIFRwccg2JYYmD_xwpIXxEfdKvwDuyRbSeJC68CqPNvQ-w1VVqP_sRBIT6dHik0SzWUT4Y1-CXMqRhK65BgJloO19NN-5j9AO2f9cXz-6x_K0oR6juKXIYCpD7UEcRF9sh6GaMppPIguMTM6R4El5noyhZpFPV11qdq0q0CX7w4FywzIXkt7x0ZeS4sKJIkXHlCR14DmEmwTz1R_89YhRAki792Wms",
    alt: "Blurred red abstract background",
  },
  {
    title: "outdated_logo.png",
    fileSize: "500 KB",
    fileType: "PNG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ5acqLHgn2JStn_XCh0DUoNzqHx6rEK94DruSZZFSlBVDuO7eTleJZcQZYIVDgCwPTRs6e6mTihcuguaSbfZQXS51B3Of3rHRZBmExd0FSLEIGJGLaJD8wXhjBpqtv8eoMBfRE-YYxEQTYNFwhxCezx8sY9mxHUMKNkgU-FMDXdJS02XXm_PWcAo6zi9i0bvFcEYMux2rBvejVt9NXMwowYMl5Wy7WLYyAgKVnS5QSILWLl-C97cuEQ8hD0lUBXTe5T8bEpJcLt8",
    alt: "Purple digital waves",
  },
];

export default function TrashPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Trash
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Items in trash will be permanently deleted after 30 days.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95">
          <span className="material-symbols-outlined text-[20px]">
            delete_forever
          </span>
          <span>Empty Trash</span>
        </button>
      </div>

      {/* Toolbar (Simplified for Trash) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">
                search
              </span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm transition-all outline-none"
              placeholder="Search in trash..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap">
              <span>Date Deleted</span>
              <span className="material-symbols-outlined text-[18px]">
                expand_more
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
              <input
                className="form-checkbox w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                type="checkbox"
              />
              Select All
            </label>
            <span className="text-xs text-slate-400 px-2 border-l border-slate-200 dark:border-slate-700">
              2 items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                restore
              </span>
              <span className="hidden sm:inline">Restore</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                delete_forever
              </span>
              <span className="hidden sm:inline">Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {deletedImages.map((img, idx) => (
          <ImageCard key={idx} {...img} />
        ))}
        {deletedImages.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 text-slate-200 dark:text-slate-800">
              delete_outline
            </span>
            <p className="text-lg font-medium">Trash is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
