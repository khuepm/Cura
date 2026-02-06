'use client';

import React, { useState, useEffect } from 'react';
import {
  getCodecPerformanceMetrics,
  resetCodecPerformanceMetrics,
  formatCodecMetrics,
  getFastestCodec,
  getProblematicCodecs,
  getOverallStats,
  type CodecPerformanceMetrics,
} from '@/lib/tauri/videoOptimization';

/**
 * Component to display and monitor video codec performance metrics
 * 
 * This component shows real-time performance data for video thumbnail extraction,
 * helping users understand which codecs perform best and identify potential issues.
 */
export default function CodecPerformanceMonitor() {
  const [metrics, setMetrics] = useState<CodecPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCodecPerformanceMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetCodecPerformanceMetrics();
      setMetrics([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset metrics');
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading && metrics.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">Loading codec performance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={loadMetrics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          No codec performance data available yet. Import some videos to see metrics.
        </p>
        <button
          onClick={loadMetrics}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  const fastest = getFastestCodec(metrics);
  const problematic = getProblematicCodecs(metrics);
  const stats = getOverallStats(metrics);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video Codec Performance</h2>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Videos</p>
          <p className="text-2xl font-bold">{stats.totalSamples}</p>
        </div>
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Extraction Time</p>
          <p className="text-2xl font-bold">{stats.avgExtractionTime.toFixed(0)}ms</p>
        </div>
        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
          <p className="text-2xl font-bold">{(stats.overallSuccessRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Codecs</p>
          <p className="text-2xl font-bold">{stats.codecCount}</p>
        </div>
      </div>

      {/* Fastest Codec */}
      {fastest && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            🏆 Fastest Codec
          </h3>
          <p className="text-green-700 dark:text-green-300">
            <strong>{fastest.codec_name}</strong> - {fastest.avg_extraction_time_ms.toFixed(0)}ms average
            ({fastest.sample_count} samples, {(fastest.success_rate * 100).toFixed(1)}% success)
          </p>
        </div>
      )}

      {/* Problematic Codecs */}
      {problematic.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
            ⚠️ Codecs with Issues
          </h3>
          <ul className="space-y-1">
            {problematic.map((codec) => (
              <li key={codec.codec_name} className="text-red-700 dark:text-red-300">
                <strong>{codec.codec_name}</strong> - {(codec.success_rate * 100).toFixed(1)}% success rate
                ({codec.sample_count} samples)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Codec</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Avg Time</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Samples</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Success Rate</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...metrics]
              .sort((a, b) => a.avg_extraction_time_ms - b.avg_extraction_time_ms)
              .map((metric) => (
                <tr key={metric.codec_name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-mono text-sm">{metric.codec_name}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {metric.avg_extraction_time_ms.toFixed(0)}ms
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{metric.sample_count}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span
                      className={
                        metric.success_rate >= 0.9
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {(metric.success_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (1 - metric.avg_extraction_time_ms / 1000) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Raw Data (for debugging) */}
      <details className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <summary className="cursor-pointer font-semibold">Raw Data (JSON)</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </details>
    </div>
  );
}
