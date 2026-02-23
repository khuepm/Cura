/**
 * Video Thumbnail Optimization API
 * 
 * This module provides access to video thumbnail optimization features including
 * FFmpeg codec performance profiling and metrics.
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Performance metrics for a specific video codec
 */
export interface CodecPerformanceMetrics {
  /** Name of the video codec (e.g., "h264", "hevc", "vp9") */
  codec_name: string;
  
  /** Average extraction time in milliseconds */
  avg_extraction_time_ms: number;
  
  /** Number of videos processed with this codec */
  sample_count: number;
  
  /** Success rate (0.0 to 1.0) for thumbnail extraction */
  success_rate: number;
}

/**
 * Get performance metrics for all video codecs encountered
 * 
 * This function returns profiling data collected during video thumbnail extraction.
 * The metrics help identify which codecs perform best and which may have issues.
 * 
 * @returns Array of codec performance metrics
 * 
 * @example
 * ```typescript
 * const metrics = await getCodecPerformanceMetrics();
 * metrics.forEach(metric => {
 *   console.log(`${metric.codec_name}: ${metric.avg_extraction_time_ms}ms (${metric.success_rate * 100}% success)`);
 * });
 * ```
 */
export async function getCodecPerformanceMetrics(): Promise<CodecPerformanceMetrics[]> {
  return await invoke<CodecPerformanceMetrics[]>('get_codec_performance_metrics');
}

/**
 * Reset all codec performance metrics
 * 
 * This clears all collected profiling data. Useful for starting fresh measurements
 * or after making system changes that might affect performance.
 * 
 * @example
 * ```typescript
 * await resetCodecPerformanceMetrics();
 * console.log('Performance metrics reset');
 * ```
 */
export async function resetCodecPerformanceMetrics(): Promise<void> {
  await invoke('reset_codec_performance_metrics');
}

/**
 * Format codec performance metrics for display
 * 
 * @param metrics - Array of codec performance metrics
 * @returns Formatted string for display
 */
export function formatCodecMetrics(metrics: CodecPerformanceMetrics[]): string {
  if (metrics.length === 0) {
    return 'No codec performance data available yet.';
  }

  // Sort by average extraction time (fastest first)
  const sorted = [...metrics].sort((a, b) => a.avg_extraction_time_ms - b.avg_extraction_time_ms);

  let output = 'Codec Performance Metrics:\n\n';
  output += 'Codec'.padEnd(15) + 'Avg Time'.padEnd(12) + 'Samples'.padEnd(10) + 'Success Rate\n';
  output += '-'.repeat(50) + '\n';

  sorted.forEach(metric => {
    const codec = metric.codec_name.padEnd(15);
    const avgTime = `${metric.avg_extraction_time_ms.toFixed(0)}ms`.padEnd(12);
    const samples = metric.sample_count.toString().padEnd(10);
    const successRate = `${(metric.success_rate * 100).toFixed(1)}%`;
    output += `${codec}${avgTime}${samples}${successRate}\n`;
  });

  return output;
}

/**
 * Get the fastest codec from metrics
 * 
 * @param metrics - Array of codec performance metrics
 * @returns The codec with the lowest average extraction time, or null if no data
 */
export function getFastestCodec(metrics: CodecPerformanceMetrics[]): CodecPerformanceMetrics | null {
  if (metrics.length === 0) return null;
  
  return metrics.reduce((fastest, current) => 
    current.avg_extraction_time_ms < fastest.avg_extraction_time_ms ? current : fastest
  );
}

/**
 * Get codecs with low success rates (potential issues)
 * 
 * @param metrics - Array of codec performance metrics
 * @param threshold - Success rate threshold (default: 0.9 = 90%)
 * @returns Array of codecs with success rate below threshold
 */
export function getProblematicCodecs(
  metrics: CodecPerformanceMetrics[],
  threshold: number = 0.9
): CodecPerformanceMetrics[] {
  return metrics.filter(metric => metric.success_rate < threshold);
}

/**
 * Calculate overall performance statistics
 * 
 * @param metrics - Array of codec performance metrics
 * @returns Overall statistics
 */
export function getOverallStats(metrics: CodecPerformanceMetrics[]): {
  totalSamples: number;
  avgExtractionTime: number;
  overallSuccessRate: number;
  codecCount: number;
} {
  if (metrics.length === 0) {
    return {
      totalSamples: 0,
      avgExtractionTime: 0,
      overallSuccessRate: 0,
      codecCount: 0,
    };
  }

  const totalSamples = metrics.reduce((sum, m) => sum + m.sample_count, 0);
  const totalSuccesses = metrics.reduce((sum, m) => sum + (m.sample_count * m.success_rate), 0);
  const weightedAvgTime = metrics.reduce(
    (sum, m) => sum + (m.avg_extraction_time_ms * m.sample_count),
    0
  ) / totalSamples;

  return {
    totalSamples,
    avgExtractionTime: weightedAvgTime,
    overallSuccessRate: totalSuccesses / totalSamples,
    codecCount: metrics.length,
  };
}
