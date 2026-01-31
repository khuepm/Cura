"use client";

import React from "react";
import SearchBar from "@/components/SearchBar";
import PhotoGrid from "@/components/PhotoGrid";
import { useAppState } from "@/lib/store/AppContext";

export default function SearchPage() {
  const { search, images } = useAppState();

  // Get images that match search results
  const searchResultImages = React.useMemo(() => {
    if (search.results.length === 0) {
      return [];
    }

    return search.results
      .map((id) => images.items.get(id))
      .filter((img) => img !== undefined)
      .map((img) => ({
        id: img!.id,
        thumbnailSmall: img!.thumbnailSmall,
        captureDate: img!.metadata.captureDate?.toISOString(),
        width: img!.metadata.dimensions.width,
        height: img!.metadata.dimensions.height,
      }));
  }, [search.results, images.items]);

  return (
    <div className="flex flex-col h-screen">
      <SearchBar />
      <div className="flex-1 overflow-hidden">
        {search.results.length === 0 && !search.isSearching ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
              search
            </span>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Search your photos
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Use the search bar above to find photos by tags, date, or camera model
            </p>
          </div>
        ) : (
          <PhotoGrid photos={searchResultImages} isLoading={search.isSearching} />
        )}
      </div>
    </div>
  );
}
