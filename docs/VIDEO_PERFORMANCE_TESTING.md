# Video Performance Testing Guide

## Overview

This document describes the performance testing suite for video thumbnail extraction in Cura Photo Manager. The tests verify that video processing meets performance targets across various codecs, video sizes, and usage scenarios.

**Task**: 30.2 Write performance tests for video processing  
**Requirements**: 10.1, 10.2 (extended)

## Performance Targets

### Primary Targets

| Metric | Target | Description |
|--------|--------|-------------|
| Video Thumbnail Extraction | ≤ 500ms | Average time to extract and generate thumbnails from a video |
| Cached Thumbnail Retrieval | ≤ 50ms | Time to retrieve existing thumbnails from cache |
| Throughput | ≥ 2 videos/sec | Number of videos that can be processed per second |
| Success Rate | ≥ 99% | Percentage of successful thumbnail extractions |

### Codec-Specific Targets

| Codec | Expected Time | Notes |
|-------|---------------|-------|
| H.264 (libx264) | 200-300ms | Most common codec, well-optimized |
| H.265/HEVC (libx265) | 300-500ms | Newer codec, more complex |
| VP9 (libvpx-vp9) | 250-400ms | WebM format |
| MPEG-4 (mpeg4) | 200-350ms | Older format |

### Video Size Targets

| Resolution | Target | Notes |
|------------|--------|-------|
| SD (640x480) | ≤ 300ms | Smaller videos process faster |
| HD (1280x720) | ≤ 500ms | Standard target |
| Full HD (1920x1080) | ≤ 800ms | Larger videos allowed 2x target |
| 4K (3840x2160) | ≤ 1000ms | Very large videos allowed 2x target |

## Test Suite

### 1. Benchmark Tests (Criterion)

Located in: `src-tauri/benches/video_performance.rs`

Run with: `cargo bench --bench video_performance`

#### Benchmarks Included

1. **Single Video Extraction** (`bench_single_video_extraction`)
   - Measures time to extract thumbnail from a single H.264 video
   - Forces cache regeneration each iteration
   - Provides baseline performance measurement

2. **Cached Video Extraction** (`bench_cached_video_extraction`)
   - Measures time to retrieve cached thumbnails
   - Verifies caching effectiveness
   - Should be <50ms

3. **Different Codecs** (`bench_different_codecs`)
   - Tests H.264, H.265, VP9, and MPEG-4 codecs
   - Compares performance across codecs
   - Identifies codec-specific bottlenecks

4. **Different Sizes** (`bench_different_sizes`)
   - Tests SD, HD, Full HD, and 4K resolutions
   - Measures impact of video size on performance
   - Verifies scaling behavior

5. **Throughput** (`bench_throughput`)
   - Processes 10 videos sequentially
   - Measures overall throughput
   - Verifies batch processing performance

6. **Short Videos** (`bench_short_videos`)
   - Tests videos shorter than 5 seconds
   - Verifies first-frame extraction performance
   - Should be faster than 5-second extraction

#### Running Benchmarks

```bash
# Run all benchmarks
cd src-tauri
cargo bench --bench video_performance

# Run specific benchmark
cargo bench --bench video_performance -- single_video

# Save baseline for comparison
cargo bench --bench video_performance -- --save-baseline main

# Compare against baseline
cargo bench --bench video_performance -- --baseline main
```

#### Benchmark Output

Criterion provides detailed statistics:
- Mean execution time
- Standard deviation
- Median
- Confidence intervals
- Performance regression detection

Example output:
```
video_thumbnail_extraction_single
                        time:   [245.32 ms 248.91 ms 252.84 ms]
                        change: [-2.1234% +0.5432% +3.2145%] (p = 0.45 > 0.05)
                        No change in performance detected.
```

### 2. Integration Tests

Located in: `src-tauri/tests/video_performance_tests.rs`

Run with: `cargo test --test video_performance_tests`

#### Tests Included

1. **Performance Target Verification** (`test_video_thumbnail_performance_target`)
   - Verifies average extraction time ≤ 500ms
   - Runs 5 samples and calculates average
   - Displays codec performance metrics
   - **Critical test** - must pass for release

2. **Cached Performance** (`test_cached_thumbnail_performance`)
   - Verifies cached retrieval ≤ 50ms
   - Tests cache effectiveness
   - Ensures idempotence

3. **Codec Performance Comparison** (`test_codec_performance_comparison`)
   - Tests multiple codecs
   - Verifies all meet performance targets
   - Checks success rates ≥ 99%

4. **Video Size Performance** (`test_video_size_performance`)
   - Tests SD, HD, and Full HD resolutions
   - Verifies scaling behavior
   - Allows 2x target for larger videos

5. **Throughput Performance** (`test_throughput_performance`)
   - Processes 5 videos sequentially
   - Verifies average time per video
   - Calculates videos/second throughput

6. **Short Video Performance** (`test_short_video_performance`)
   - Tests videos < 5 seconds
   - Verifies first-frame extraction
   - Should meet standard target

7. **Codec Metrics Tracking** (`test_codec_metrics_tracking`)
   - Verifies performance metrics collection
   - Tests sample counting
   - Validates success rate tracking

#### Running Integration Tests

```bash
# Run all performance tests
cd src-tauri
cargo test --test video_performance_tests

# Run specific test
cargo test --test video_performance_tests test_video_thumbnail_performance_target

# Run with output
cargo test --test video_performance_tests -- --nocapture

# Run in release mode (faster, more realistic)
cargo test --release --test video_performance_tests
```

#### Test Output

Tests display detailed performance information:

```
=== Video Thumbnail Performance Test ===
Target: 500 ms
Average extraction time: 245 ms
Individual times: [248, 243, 246, 244, 244]

Codec Performance Metrics:
  h264: avg=245.20ms, samples=5, success_rate=100.00%

✅ Performance target met: 245ms <= 500ms
```

## Prerequisites

### FFmpeg Installation

Performance tests require FFmpeg to be installed and available in PATH.

**Check FFmpeg availability:**
```bash
ffmpeg -version
```

**Installation:**
- **Windows**: Download from https://www.gyan.dev/ffmpeg/builds/
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian)

### Test Video Generation

Tests automatically generate test videos using FFmpeg's `testsrc` filter:
- Various codecs (H.264, H.265, VP9, MPEG-4)
- Various resolutions (SD, HD, Full HD, 4K)
- Various durations (2s, 10s)

No manual test video preparation is required.

## Performance Profiling

### Codec Performance Metrics

The system automatically tracks codec performance during normal operation:

```rust
// Get codec performance metrics
let metrics = get_codec_performance_metrics();

for metric in metrics {
    println!("{}: avg={:.2}ms, samples={}, success_rate={:.2}%",
             metric.codec_name,
             metric.avg_extraction_time_ms,
             metric.sample_count,
             metric.success_rate * 100.0);
}
```

### Frontend Monitoring

Use the `CodecPerformanceMonitor` component to view real-time metrics:

```typescript
import { CodecPerformanceMonitor } from '@/components/CodecPerformanceMonitor';

// In your component
<CodecPerformanceMonitor autoRefresh={true} refreshInterval={5000} />
```

### Tauri Commands

```typescript
// Get codec performance metrics
const metrics = await invoke('get_codec_performance_metrics');

// Reset metrics
await invoke('reset_codec_performance_metrics');
```

## Interpreting Results

### Good Performance Indicators

✅ Average extraction time < 400ms  
✅ Cached retrieval < 20ms  
✅ Success rate = 100%  
✅ Consistent times across samples (low std dev)  
✅ Throughput > 2 videos/second

### Performance Issues

⚠️ Average extraction time > 500ms  
⚠️ High variance in extraction times  
⚠️ Success rate < 99%  
⚠️ Cached retrieval > 50ms  
⚠️ Throughput < 1 video/second

### Common Causes of Poor Performance

1. **FFmpeg Not Optimized**
   - Solution: Use optimized FFmpeg build
   - Check: `ffmpeg -version` for build flags

2. **Slow Disk I/O**
   - Solution: Use SSD for cache directory
   - Check: Disk read/write speeds

3. **CPU Bottleneck**
   - Solution: Ensure FFmpeg uses hardware acceleration
   - Check: CPU usage during extraction

4. **Memory Pressure**
   - Solution: Reduce concurrent operations
   - Check: Available RAM during tests

5. **Network Storage**
   - Solution: Use local storage for cache
   - Check: Cache directory location

## Continuous Integration

### CI Performance Tests

Include performance tests in CI pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install FFmpeg
        run: sudo apt-get install -y ffmpeg
      
      - name: Run performance tests
        run: |
          cd src-tauri
          cargo test --release --test video_performance_tests
      
      - name: Run benchmarks
        run: |
          cd src-tauri
          cargo bench --bench video_performance -- --save-baseline ci
```

### Performance Regression Detection

Use Criterion's baseline comparison:

```bash
# Save baseline before changes
cargo bench --bench video_performance -- --save-baseline before

# Make changes...

# Compare after changes
cargo bench --bench video_performance -- --baseline before
```

Criterion will detect performance regressions and report them.

## Optimization Tips

### 1. FFmpeg Command Optimization

Current optimizations:
- `-ss` before `-i`: Seek before decoding (faster)
- `-threads 1`: Single thread for single frame (less overhead)
- `-vframes 1`: Extract exactly one frame (stop immediately)
- `-f image2pipe`: Pipe output (no disk I/O)

### 2. Caching Strategy

- Use SHA-256 checksums for unique identification
- Check modification times before regeneration
- Store thumbnails in fast storage (SSD)

### 3. Parallel Processing

- Process multiple videos in parallel using Rayon
- Limit concurrency to avoid memory pressure
- Use thread pool for FFmpeg operations

### 4. Hardware Acceleration

Consider enabling FFmpeg hardware acceleration:

```bash
# NVIDIA GPU
ffmpeg -hwaccel cuda -ss 5 -i video.mp4 -vframes 1 -f image2pipe -

# macOS VideoToolbox
ffmpeg -hwaccel videotoolbox -ss 5 -i video.mp4 -vframes 1 -f image2pipe -

# Intel Quick Sync
ffmpeg -hwaccel qsv -ss 5 -i video.mp4 -vframes 1 -f image2pipe -
```

## Troubleshooting

### Tests Fail with "FFmpeg not available"

**Problem**: FFmpeg is not installed or not in PATH

**Solution**:
1. Install FFmpeg (see Prerequisites)
2. Verify: `ffmpeg -version`
3. Add FFmpeg to PATH if needed

### Tests Fail with Performance Target Exceeded

**Problem**: Extraction time > 500ms

**Solutions**:
1. Check CPU usage - ensure not throttled
2. Check disk I/O - use SSD for cache
3. Check FFmpeg build - use optimized version
4. Run in release mode: `cargo test --release`
5. Close other applications to free resources

### Inconsistent Test Results

**Problem**: High variance in extraction times

**Solutions**:
1. Run tests in release mode
2. Close background applications
3. Disable CPU throttling
4. Use dedicated test machine
5. Increase sample count for more stable averages

### Codec-Specific Failures

**Problem**: Specific codec fails or is very slow

**Solutions**:
1. Check FFmpeg codec support: `ffmpeg -codecs`
2. Update FFmpeg to latest version
3. Try different encoder (e.g., `libx264` vs `h264`)
4. Check codec-specific FFmpeg options

## Performance Monitoring in Production

### Enable Performance Tracking

Performance metrics are automatically collected during normal operation:

```rust
// Metrics are tracked in CODEC_PERFORMANCE global state
// Access via Tauri commands
```

### View Metrics in UI

Use the CodecPerformanceMonitor component:

```typescript
<CodecPerformanceMonitor 
  autoRefresh={true} 
  refreshInterval={5000}
  showDetails={true}
/>
```

### Export Metrics

```typescript
const metrics = await getCodecPerformanceMetrics();
const stats = getOverallStats(metrics);

console.log(`Average extraction time: ${stats.avgTime}ms`);
console.log(`Total samples: ${stats.totalSamples}`);
console.log(`Overall success rate: ${stats.successRate}%`);
```

## Conclusion

The video performance testing suite provides comprehensive coverage of:

✅ **Performance Target Verification**: Ensures extraction ≤ 500ms  
✅ **Codec Testing**: Tests H.264, H.265, VP9, MPEG-4  
✅ **Size Testing**: Tests SD, HD, Full HD, 4K  
✅ **Throughput Testing**: Verifies batch processing performance  
✅ **Caching Testing**: Verifies cache effectiveness  
✅ **Metrics Tracking**: Monitors performance in production

These tests ensure that video thumbnail extraction meets performance requirements across all supported codecs and video sizes, providing a smooth user experience even with large video collections.

## References

- [Task 30.1 Summary](./TASK_30.1_SUMMARY.md) - Video thumbnail optimization
- [Video Thumbnail Optimization Guide](./VIDEO_THUMBNAIL_OPTIMIZATION.md) - Optimization details
- [FFmpeg Installation Guide](./FFMPEG_INSTALLATION.md) - FFmpeg setup
- [Criterion Documentation](https://bheisler.github.io/criterion.rs/book/) - Benchmarking framework
