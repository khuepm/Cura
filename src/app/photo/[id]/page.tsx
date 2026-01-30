"use client";

import { useParams, useRouter } from "next/navigation";

export default function PhotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const photoId = params.id as string;

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

      {/* Photo detail content will be implemented in subtask 7.3 */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Photo ID: {photoId}</p>
      </div>
    </div>
  );
}
