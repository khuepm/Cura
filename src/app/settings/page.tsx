"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/hooks/useSettings";
import FormatSelection from "@/components/FormatSelection";
import type { AppSettings, FormatConfig } from "@/lib/types";

export default function SettingsPage() {
  const { settings, loading, error, saveSettings } = useSettings();
  const [formData, setFormData] = useState<AppSettings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings && formData) {
      const changed = JSON.stringify(settings) !== JSON.stringify(formData);
      setHasChanges(changed);
    }
  }, [settings, formData]);

  const handleBrowseFolder = async () => {
    try {
      // TODO: Implement folder selection dialog when Tauri plugin is available
      const selected = prompt("Enter thumbnail cache directory path:");

      if (selected && formData) {
        setFormData({
          ...formData,
          thumbnailCachePath: selected,
        });
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaveError(null);
      setSaveSuccess(false);
      await saveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDiscard = () => {
    if (settings) {
      setFormData(settings);
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <div className="text-red-500">Failed to load settings: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center py-2">
      <div className="flex w-full max-w-[1200px] gap-8 flex-col md:flex-row">
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-xl font-bold px-3">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-3">
              Configure your workspace
            </p>
          </div>
          <nav className="flex flex-col gap-1">
            <a
              className="bg-primary text-white flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors"
              href="#storage"
            >
              <span className="material-symbols-outlined">database</span>
              <span>Storage</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#ai"
            >
              <span className="material-symbols-outlined">psychology</span>
              <span>AI Model</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#sync"
            >
              <span className="material-symbols-outlined">cloud_sync</span>
              <span>Cloud Sync</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#formats"
            >
              <span className="material-symbols-outlined">description</span>
              <span>File Formats</span>
            </a>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col gap-8 w-full max-w-[800px]">
          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                {saveError}
              </p>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                Settings saved successfully!
              </p>
            </div>
          )}

          <section id="storage" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Storage
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure thumbnail cache location for efficient asset management.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Thumbnail Cache Directory
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                    <div className="flex items-center justify-center pl-3 text-slate-400">
                      <span className="material-symbols-outlined">folder</span>
                    </div>
                    <input
                      className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white px-3"
                      value={formData.thumbnailCachePath}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thumbnailCachePath: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    onClick={handleBrowseFolder}
                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Browse
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  This directory will be used for caching thumbnails and offline image
                  processing.
                </p>
              </div>
            </div>
          </section>

          <section id="ai" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Model Selection
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose the AI model for image classification.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="aiModel"
                    value="mobilenet"
                    checked={formData.aiModel === "mobilenet"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aiModel: e.target.value as "clip" | "mobilenet",
                      })
                    }
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      MobileNet
                    </p>
                    <p className="text-xs text-slate-500">
                      Fast and efficient, good for general classification
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="aiModel"
                    value="clip"
                    checked={formData.aiModel === "clip"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aiModel: e.target.value as "clip" | "mobilenet",
                      })
                    }
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      CLIP
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports semantic search with natural language queries
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section id="sync" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cloud Sync Preferences
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure automatic synchronization with Google Drive.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Enable Cloud Sync
                  </p>
                  <p className="text-xs text-slate-500">
                    Automatically backup images to Google Drive
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.syncConfig.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        syncConfig: {
                          ...formData.syncConfig,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-800 pt-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Auto Sync
                  </p>
                  <p className="text-xs text-slate-500">
                    Sync automatically at regular intervals
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.syncConfig.autoSync}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        syncConfig: {
                          ...formData.syncConfig,
                          autoSync: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.syncConfig.syncInterval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      syncConfig: {
                        ...formData.syncConfig,
                        syncInterval: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Upload Quality
                </label>
                <select
                  value={formData.syncConfig.uploadQuality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      syncConfig: {
                        ...formData.syncConfig,
                        uploadQuality: e.target.value as "original" | "high" | "medium",
                      },
                    })
                  }
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="original">Original</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>
          </section>

          <section id="formats" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                File Format Configuration
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select which image and video formats to import when scanning folders.
              </p>
            </div>
            <div className="p-6">
              <FormatSelection
                currentConfig={formData.formatConfig || {
                  imageFormats: ["jpg", "jpeg", "png", "heic", "raw", "cr2", "nef", "dng", "arw", "webp", "gif", "bmp", "tiff"],
                  videoFormats: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v", "mpg", "mpeg", "3gp"],
                }}
                onConfigChange={(config: FormatConfig) => {
                  setFormData({
                    ...formData,
                    formatConfig: config,
                  });
                }}
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 mb-10">
            <button
              onClick={handleDiscard}
              disabled={!hasChanges}
              className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-8 py-2.5 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
