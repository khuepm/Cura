/// Performance benchmarks for video thumbnail extraction
/// 
/// Task 30.2: Write performance tests for video processing
/// Requirements: 10.1, 10.2 (extended)
/// 
/// This benchmark suite tests:
/// - Video thumbnail extraction throughput
/// - Performance with various video codecs and sizes
/// - Verification of performance targets

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;
use tempfile::TempDir;

// Import the thumbnail module from the app library
use app_lib::thumbnail::{generate_video_thumbnails, get_codec_performance_metrics, reset_codec_performance_metrics};

/// Performance target: Video thumbnail extraction should complete within 500ms on average
const PERFORMANCE_TARGET_MS: u128 = 500;

/// Create a test video file using FFmpeg
/// Returns None if FFmpeg is not available
fn create_test_video(
    output_path: &Path,
    codec: &str,
    duration_secs: u32,
    resolution: &str,
) -> Result<(), String> {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        return Err("FFmpeg not available".to_string());
    }

    // Create a test video with the specified codec and resolution
    // Use testsrc to generate a test pattern
    let output = Command::new("ffmpeg")
        .arg("-f")
        .arg("lavfi")
        .arg("-i")
        .arg(format!("testsrc=duration={}:size={}", duration_secs, resolution))
        .arg("-c:v")
        .arg(codec)
        .arg("-pix_fmt")
        .arg("yuv420p")
        .arg("-y")
        .arg(output_path)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg failed to create test video: {}", stderr));
    }

    Ok(())
}

/// Benchmark video thumbnail extraction for a single video
fn bench_single_video_extraction(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping video performance benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a test video (H.264, 10 seconds, 1280x720)
    let video_path = temp_dir.path().join("test_video.mp4");
    
    match create_test_video(&video_path, "libx264", 10, "1280x720") {
        Ok(_) => {
            c.bench_function("video_thumbnail_extraction_single", |b| {
                b.iter(|| {
                    // Reset cache to force regeneration each time
                    let _ = fs::remove_dir_all(&cache_dir);
                    let _ = fs::create_dir_all(&cache_dir);
                    
                    let result = generate_video_thumbnails(
                        black_box(video_path.to_str().unwrap()),
                        black_box(&cache_dir),
                    );
                    
                    assert!(result.is_ok(), "Thumbnail generation failed: {:?}", result.err());
                });
            });
        }
        Err(e) => {
            println!("Failed to create test video: {}", e);
        }
    }
}

/// Benchmark video thumbnail extraction with caching
fn bench_cached_video_extraction(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping cached video benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a test video
    let video_path = temp_dir.path().join("test_video.mp4");
    
    match create_test_video(&video_path, "libx264", 10, "1280x720") {
        Ok(_) => {
            // Generate thumbnails once to populate cache
            let _ = generate_video_thumbnails(
                video_path.to_str().unwrap(),
                &cache_dir,
            );

            c.bench_function("video_thumbnail_extraction_cached", |b| {
                b.iter(|| {
                    let result = generate_video_thumbnails(
                        black_box(video_path.to_str().unwrap()),
                        black_box(&cache_dir),
                    );
                    
                    assert!(result.is_ok(), "Cached thumbnail retrieval failed: {:?}", result.err());
                });
            });
        }
        Err(e) => {
            println!("Failed to create test video: {}", e);
        }
    }
}

/// Benchmark video thumbnail extraction with different codecs
fn bench_different_codecs(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping codec benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Test different codecs
    let codecs = vec![
        ("libx264", "h264"),      // H.264 - most common
        ("libx265", "h265"),      // H.265/HEVC - newer, more efficient
        ("libvpx-vp9", "vp9"),    // VP9 - WebM format
        ("mpeg4", "mpeg4"),       // MPEG-4 - older format
    ];

    let mut group = c.benchmark_group("video_codecs");
    
    for (encoder, codec_name) in codecs {
        let video_path = temp_dir.path().join(format!("test_{}.mp4", codec_name));
        
        // Try to create test video with this codec
        match create_test_video(&video_path, encoder, 10, "1280x720") {
            Ok(_) => {
                group.bench_with_input(
                    BenchmarkId::from_parameter(codec_name),
                    &video_path,
                    |b, path| {
                        b.iter(|| {
                            // Reset cache to force regeneration
                            let codec_cache = cache_dir.join(codec_name);
                            let _ = fs::remove_dir_all(&codec_cache);
                            let _ = fs::create_dir_all(&codec_cache);
                            
                            let result = generate_video_thumbnails(
                                black_box(path.to_str().unwrap()),
                                black_box(&codec_cache),
                            );
                            
                            assert!(result.is_ok(), "Thumbnail generation failed for {}: {:?}", 
                                    codec_name, result.err());
                        });
                    },
                );
            }
            Err(e) => {
                println!("Skipping codec {} (encoder {}): {}", codec_name, encoder, e);
            }
        }
    }
    
    group.finish();
}

/// Benchmark video thumbnail extraction with different video sizes
fn bench_different_sizes(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping size benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Test different video resolutions
    let sizes = vec![
        ("640x480", "sd"),        // SD
        ("1280x720", "hd"),       // HD
        ("1920x1080", "fhd"),     // Full HD
        ("3840x2160", "4k"),      // 4K
    ];

    let mut group = c.benchmark_group("video_sizes");
    
    for (resolution, size_name) in sizes {
        let video_path = temp_dir.path().join(format!("test_{}.mp4", size_name));
        
        // Create test video with this resolution
        match create_test_video(&video_path, "libx264", 10, resolution) {
            Ok(_) => {
                group.bench_with_input(
                    BenchmarkId::from_parameter(size_name),
                    &video_path,
                    |b, path| {
                        b.iter(|| {
                            // Reset cache to force regeneration
                            let size_cache = cache_dir.join(size_name);
                            let _ = fs::remove_dir_all(&size_cache);
                            let _ = fs::create_dir_all(&size_cache);
                            
                            let result = generate_video_thumbnails(
                                black_box(path.to_str().unwrap()),
                                black_box(&size_cache),
                            );
                            
                            assert!(result.is_ok(), "Thumbnail generation failed for {}: {:?}", 
                                    size_name, result.err());
                        });
                    },
                );
            }
            Err(e) => {
                println!("Skipping size {} ({}): {}", size_name, resolution, e);
            }
        }
    }
    
    group.finish();
}

/// Benchmark video thumbnail extraction throughput (multiple videos)
fn bench_throughput(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping throughput benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create multiple test videos
    let video_count = 10;
    let mut video_paths = Vec::new();
    
    for i in 0..video_count {
        let video_path = temp_dir.path().join(format!("test_video_{}.mp4", i));
        
        match create_test_video(&video_path, "libx264", 10, "1280x720") {
            Ok(_) => {
                video_paths.push(video_path);
            }
            Err(e) => {
                println!("Failed to create test video {}: {}", i, e);
                return;
            }
        }
    }

    c.bench_function("video_thumbnail_throughput_10_videos", |b| {
        b.iter(|| {
            // Reset cache to force regeneration
            let _ = fs::remove_dir_all(&cache_dir);
            let _ = fs::create_dir_all(&cache_dir);
            
            for video_path in &video_paths {
                let result = generate_video_thumbnails(
                    black_box(video_path.to_str().unwrap()),
                    black_box(&cache_dir),
                );
                
                assert!(result.is_ok(), "Thumbnail generation failed: {:?}", result.err());
            }
        });
    });
}

/// Benchmark short video extraction (< 5 seconds)
fn bench_short_videos(c: &mut Criterion) {
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping short video benchmarks");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a short video (2 seconds)
    let video_path = temp_dir.path().join("short_video.mp4");
    
    match create_test_video(&video_path, "libx264", 2, "1280x720") {
        Ok(_) => {
            c.bench_function("video_thumbnail_extraction_short", |b| {
                b.iter(|| {
                    // Reset cache to force regeneration
                    let _ = fs::remove_dir_all(&cache_dir);
                    let _ = fs::create_dir_all(&cache_dir);
                    
                    let result = generate_video_thumbnails(
                        black_box(video_path.to_str().unwrap()),
                        black_box(&cache_dir),
                    );
                    
                    assert!(result.is_ok(), "Short video thumbnail generation failed: {:?}", result.err());
                });
            });
        }
        Err(e) => {
            println!("Failed to create short test video: {}", e);
        }
    }
}

/// Performance target verification test
/// This is not a benchmark but a test to verify performance targets are met
#[test]
fn test_performance_target_verification() {
    use std::time::Instant;
    
    // Check if FFmpeg is available
    let ffmpeg_check = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    if ffmpeg_check.is_err() || !ffmpeg_check.as_ref().unwrap().status.success() {
        println!("FFmpeg not available, skipping performance target verification");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a test video (H.264, 10 seconds, 1280x720)
    let video_path = temp_dir.path().join("test_video.mp4");
    
    match create_test_video(&video_path, "libx264", 10, "1280x720") {
        Ok(_) => {
            // Reset codec performance metrics
            reset_codec_performance_metrics();
            
            // Measure extraction time for 5 samples
            let mut times = Vec::new();
            
            for i in 0..5 {
                // Reset cache to force regeneration
                let _ = fs::remove_dir_all(&cache_dir);
                let _ = fs::create_dir_all(&cache_dir);
                
                let start = Instant::now();
                let result = generate_video_thumbnails(
                    video_path.to_str().unwrap(),
                    &cache_dir,
                );
                let duration = start.elapsed();
                
                assert!(result.is_ok(), "Thumbnail generation failed on iteration {}: {:?}", i, result.err());
                times.push(duration.as_millis());
            }
            
            // Calculate average time
            let avg_time = times.iter().sum::<u128>() / times.len() as u128;
            
            println!("\n=== Performance Target Verification ===");
            println!("Target: {} ms", PERFORMANCE_TARGET_MS);
            println!("Average extraction time: {} ms", avg_time);
            println!("Individual times: {:?}", times);
            
            // Get codec performance metrics
            let metrics = get_codec_performance_metrics();
            if !metrics.is_empty() {
                println!("\nCodec Performance Metrics:");
                for metric in metrics {
                    println!("  {}: avg={:.2}ms, samples={}, success_rate={:.2}%",
                             metric.codec_name,
                             metric.avg_extraction_time_ms,
                             metric.sample_count,
                             metric.success_rate * 100.0);
                }
            }
            
            // Verify performance target is met
            assert!(
                avg_time <= PERFORMANCE_TARGET_MS,
                "Performance target not met: average time {}ms exceeds target {}ms",
                avg_time,
                PERFORMANCE_TARGET_MS
            );
            
            println!("\n✅ Performance target met: {}ms <= {}ms", avg_time, PERFORMANCE_TARGET_MS);
        }
        Err(e) => {
            println!("Failed to create test video: {}", e);
            println!("Skipping performance target verification");
        }
    }
}

criterion_group!(
    benches,
    bench_single_video_extraction,
    bench_cached_video_extraction,
    bench_different_codecs,
    bench_different_sizes,
    bench_throughput,
    bench_short_videos,
);

criterion_main!(benches);
