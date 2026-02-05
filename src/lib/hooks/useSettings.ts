import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../types';

interface UseSettingsReturn {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  saveSettings: (newSettings: AppSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

/**
 * Hook for managing application settings
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoke<AppSettings>('get_settings');
      
      // Convert snake_case from Rust to camelCase for TypeScript
      const formattedSettings: AppSettings = {
        thumbnailCachePath: (result as any).thumbnail_cache_path || '',
        aiModel: (result as any).ai_model || 'mobilenet',
        syncConfig: {
          enabled: (result as any).sync_config?.enabled || false,
          autoSync: (result as any).sync_config?.auto_sync || false,
          syncInterval: (result as any).sync_config?.sync_interval || 60,
          uploadQuality: (result as any).sync_config?.upload_quality || 'high',
          excludePatterns: (result as any).sync_config?.exclude_patterns || [],
        },
        formatConfig: {
          imageFormats: (result as any).format_config?.image_formats || [],
          videoFormats: (result as any).format_config?.video_formats || [],
        },
      };
      
      setSettings(formattedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      setError(null);
      
      // Convert camelCase to snake_case for Rust
      const rustSettings = {
        thumbnail_cache_path: newSettings.thumbnailCachePath,
        ai_model: newSettings.aiModel,
        sync_config: {
          enabled: newSettings.syncConfig.enabled,
          auto_sync: newSettings.syncConfig.autoSync,
          sync_interval: newSettings.syncConfig.syncInterval,
          upload_quality: newSettings.syncConfig.uploadQuality,
          exclude_patterns: newSettings.syncConfig.excludePatterns,
        },
        format_config: {
          image_formats: newSettings.formatConfig?.imageFormats || [],
          video_formats: newSettings.formatConfig?.videoFormats || [],
        },
      };
      
      await invoke('save_settings', { newSettings: rustSettings });
      
      // Update local state
      setSettings(newSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    refreshSettings,
  };
}
