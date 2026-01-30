"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppState, useAppDispatch } from "@/lib/store/AppContext";
import { useSearch } from "@/lib/hooks/useSearch";
import type { SearchQuery } from "@/lib/types";

interface SearchBarProps {
  onSearch?: (query: SearchQuery) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const { search, settings } = useAppState();
  const dispatch = useAppDispatch();
  const { performSearch, isSearching, searchTime } = useSearch();

  const [textInput, setTextInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [cameraModel, setCameraModel] = useState("");
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [textInput, selectedTags, dateRange, cameraModel, useSemanticSearch]);

  const handleSearch = useCallback(async () => {
    const query: SearchQuery = {};

    if (textInput.trim()) {
      query.text = textInput.trim();
      query.semantic = useSemanticSearch;
    }

    if (selectedTags.length > 0) {
      query.tags = selectedTags;
    }

    if (dateRange.start && dateRange.end) {
      query.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      };
    }

    if (cameraModel.trim()) {
      query.cameraModel = cameraModel.trim();
    }

    dispatch({ type: "SET_SEARCH_QUERY", payload: query });

    // Perform the actual search
    await performSearch(query);

    if (onSearch) {
      onSearch(query);
    }
  }, [textInput, selectedTags, dateRange, cameraModel, useSemanticSearch, dispatch, performSearch, onSearch]);

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      setSelectedTags([...selectedTags, tag.trim()]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleClearFilters = () => {
    setTextInput("");
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
    setCameraModel("");
    setUseSemanticSearch(false);
  };

  const hasActiveFilters =
    textInput.trim() ||
    selectedTags.length > 0 ||
    dateRange.start ||
    dateRange.end ||
    cameraModel.trim();

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Main search input */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Search photos..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${showFilters
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search results info */}
        {search.results.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Found {search.results.length} {search.results.length === 1 ? "photo" : "photos"}
            {searchTime > 0 && ` in ${searchTime}ms`}
          </div>
        )}

        {/* Loading indicator */}
        {isSearching && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Searching...
          </div>
        )}

        {/* Filter chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                <span className="material-symbols-outlined text-sm">label</span>
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
            {/* Semantic search toggle (only show if CLIP model is enabled) */}
            {settings.aiModel === "clip" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="semantic-search"
                  checked={useSemanticSearch}
                  onChange={(e) => setUseSemanticSearch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="semantic-search"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  Use semantic search (natural language)
                </label>
              </div>
            )}

            {/* Tag input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Filter by tags
              </label>
              <input
                type="text"
                placeholder="Type a tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Camera model */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Camera model
              </label>
              <input
                type="text"
                value={cameraModel}
                onChange={(e) => setCameraModel(e.target.value)}
                placeholder="e.g., Canon EOS 5D"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
