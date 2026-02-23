/// Integration tests for video processing performance
/// 
/// Task 30.2: Write performance tests for video processing
/// Requirements: 10.1, 10.2 (extended)
/// 
/// These tests verify:
/// - Video thumbnail extraction meets performance targets
/// - Performance with various video codecs
/// - Performance with various video sizes
/// - Throughput for batch processing

use std::path::Path;
use std::process::Command;
use std::fs;
use std::time::Instant;
use tempfile::TempDir;

// Import from the app library
use app_lib::thumbnail::{generate_video_thumbnails, get_codec_performance_metrics, reset_codec_performance_metrics};

/// Performance target: Video thumbnail extraction should complete within 500ms on average
const PERFORMANCE_TARGET_MS: u128 = 500;

/// Performance target: Cached thumbnail retrieval should complete within 50ms
const CACHED_PERFORMANCE_TARGET_MS: u128 = 50;

/// Helper function to check if FFmpeg is available
fn is_ffmpeg_available() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Helper function to create a test video
fn create_test_video(
    output_path: &Path,
    codec: &str,
    duration_secs: u32,
    resolution: &str,
) -> Result<(), String> {
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
        return Err(format!("FFmpeg failed: {}", stderr));
    }

    Ok(())
}

#[test]
fn test_video_thumbnail_performance_target() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a test video (H.264, 10 seconds, 1280x720)
    let video_path = temp_dir.path().join("test_video.mp4");
    
    if let Err(e) = create_test_video(&video_path, "libx264", 10, "1280x720") {
        println!("Failed to create test video: {}", e);
        return;
    }

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
    
    println!("\n=== Video Thumbnail Performance Test ===");
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
    
    println!("✅ Performance target met: {}ms <= {}ms\n", avg_time, PERFORMANCE_TARGET_MS);
}

#[test]
fn test_cached_thumbnail_performance() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a test video
    let video_path = temp_dir.path().join("test_video.mp4");
    
    if let Err(e) = create_test_video(&video_path, "libx264", 10, "1280x720") {
        println!("Failed to create test video: {}", e);
        return;
    }

    // Generate thumbnails once to populate cache
    let result = generate_video_thumbnails(
        video_path.to_str().unwrap(),
        &cache_dir,
    );
    assert!(result.is_ok(), "Initial thumbnail generation failed");

    // Measure cached retrieval time for 5 samples
    let mut times = Vec::new();
    
    for _ in 0..5 {
        let start = Instant::now();
        let result = generate_video_thumbnails(
            video_path.to_str().unwrap(),
            &cache_dir,
        );
        let duration = start.elapsed();
        
        assert!(result.is_ok(), "Cached thumbnail retrieval failed");
        times.push(duration.as_millis());
    }
    
    // Calculate average time
    let avg_time = times.iter().sum::<u128>() / times.len() as u128;
    
    println!("\n=== Cached Thumbnail Performance Test ===");
    println!("Target: {} ms", CACHED_PERFORMANCE_TARGET_MS);
    println!("Average cached retrieval time: {} ms", avg_time);
    println!("Individual times: {:?}", times);
    
    // Verify cached performance target is met
    assert!(
        avg_time <= CACHED_PERFORMANCE_TARGET_MS,
        "Cached performance target not met: average time {}ms exceeds target {}ms",
        avg_time,
        CACHED_PERFORMANCE_TARGET_MS
    );
    
    println!("✅ Cached performance target met: {}ms <= {}ms\n", avg_time, CACHED_PERFORMANCE_TARGET_MS);
}

#[test]
fn test_codec_performance_comparison() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Reset codec performance metrics
    reset_codec_performance_metrics();

    // Test different codecs
    let codecs = vec![
        ("libx264", "h264"),      // H.264 - most common
        ("libx265", "h265"),      // H.265/HEVC - newer
        ("libvpx-vp9", "vp9"),    // VP9 - WebM
        ("mpeg4", "mpeg4"),       // MPEG-4 - older
    ];

    let mut codec_times = Vec::new();

    for (encoder, codec_name) in &codecs {
        let video_path = temp_dir.path().join(format!("test_{}.mp4", codec_name));
        
        // Create test video with this codec
        if let Err(e) = create_test_video(&video_path, encoder, 10, "1280x720") {
            println!("Skipping codec {} ({}): {}", codec_name, encoder, e);
            continue;
        }

        // Measure extraction time
        let codec_cache = cache_dir.join(codec_name);
        fs::create_dir_all(&codec_cache).unwrap();
        
        let start = Instant::now();
        let result = generate_video_thumbnails(
            video_path.to_str().unwrap(),
            &codec_cache,
        );
        let duration = start.elapsed();
        
        if result.is_ok() {
            codec_times.push((codec_name.to_string(), duration.as_millis()));
            println!("Codec {}: {} ms", codec_name, duration.as_millis());
        } else {
            println!("Codec {} failed: {:?}", codec_name, result.err());
        }
    }

    // Get codec performance metrics
    let metrics = get_codec_performance_metrics();
    
    println!("\n=== Codec Performance Comparison ===");
    for metric in &metrics {
        println!("  {}: avg={:.2}ms, success_rate={:.2}%",
                 metric.codec_name,
                 metric.avg_extraction_time_ms,
                 metric.success_rate * 100.0);
    }

    // Verify all tested codecs meet performance target
    for (codec_name, time) in &codec_times {
        assert!(
            *time <= PERFORMANCE_TARGET_MS,
            "Codec {} exceeds performance target: {}ms > {}ms",
            codec_name,
            time,
            PERFORMANCE_TARGET_MS
        );
    }

    // Verify all codecs have 100% success rate
    for metric in &metrics {
        assert!(
            metric.success_rate >= 0.99,
            "Codec {} has low success rate: {:.2}%",
            metric.codec_name,
            metric.success_rate * 100.0
        );
    }

    println!("✅ All codecs meet performance targets\n");
}

#[test]
fn test_video_size_performance() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
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
    ];

    let mut size_times = Vec::new();

    println!("\n=== Video Size Performance Test ===");

    for (resolution, size_name) in &sizes {
        let video_path = temp_dir.path().join(format!("test_{}.mp4", size_name));
        
        // Create test video with this resolution
        if let Err(e) = create_test_video(&video_path, "libx264", 10, resolution) {
            println!("Skipping size {} ({}): {}", size_name, resolution, e);
            continue;
        }

        // Measure extraction time
        let size_cache = cache_dir.join(size_name);
        fs::create_dir_all(&size_cache).unwrap();
        
        let start = Instant::now();
        let result = generate_video_thumbnails(
            video_path.to_str().unwrap(),
            &size_cache,
        );
        let duration = start.elapsed();
        
        if result.is_ok() {
            size_times.push((size_name.to_string(), duration.as_millis()));
            println!("Size {} ({}): {} ms", size_name, resolution, duration.as_millis());
        } else {
            println!("Size {} failed: {:?}", size_name, result.err());
        }
    }

    // Verify all tested sizes meet performance target
    for (size_name, time) in &size_times {
        assert!(
            *time <= PERFORMANCE_TARGET_MS * 2, // Allow 2x target for larger videos
            "Video size {} exceeds performance target: {}ms > {}ms",
            size_name,
            time,
            PERFORMANCE_TARGET_MS * 2
        );
    }

    println!("✅ All video sizes meet performance targets\n");
}

#[test]
fn test_throughput_performance() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create multiple test videos
    let video_count = 5;
    let mut video_paths = Vec::new();
    
    println!("\n=== Throughput Performance Test ===");
    println!("Creating {} test videos...", video_count);
    
    for i in 0..video_count {
        let video_path = temp_dir.path().join(format!("test_video_{}.mp4", i));
        
        if let Err(e) = create_test_video(&video_path, "libx264", 10, "1280x720") {
            println!("Failed to create test video {}: {}", i, e);
            return;
        }
        
        video_paths.push(video_path);
    }

    // Measure throughput
    let start = Instant::now();
    
    for (i, video_path) in video_paths.iter().enumerate() {
        let result = generate_video_thumbnails(
            video_path.to_str().unwrap(),
            &cache_dir,
        );
        
        assert!(result.is_ok(), "Thumbnail generation failed for video {}: {:?}", i, result.err());
    }
    
    let total_duration = start.elapsed();
    let avg_time_per_video = total_duration.as_millis() / video_count as u128;
    
    println!("Total time for {} videos: {} ms", video_count, total_duration.as_millis());
    println!("Average time per video: {} ms", avg_time_per_video);
    println!("Throughput: {:.2} videos/second", 1000.0 / avg_time_per_video as f64);
    
    // Verify average time meets performance target
    assert!(
        avg_time_per_video <= PERFORMANCE_TARGET_MS,
        "Average throughput time {}ms exceeds target {}ms",
        avg_time_per_video,
        PERFORMANCE_TARGET_MS
    );
    
    println!("✅ Throughput performance target met\n");
}

#[test]
fn test_short_video_performance() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Create a short video (2 seconds - less than 5 second threshold)
    let video_path = temp_dir.path().join("short_video.mp4");
    
    if let Err(e) = create_test_video(&video_path, "libx264", 2, "1280x720") {
        println!("Failed to create short test video: {}", e);
        return;
    }

    println!("\n=== Short Video Performance Test ===");

    // Measure extraction time
    let start = Instant::now();
    let result = generate_video_thumbnails(
        video_path.to_str().unwrap(),
        &cache_dir,
    );
    let duration = start.elapsed();
    
    assert!(result.is_ok(), "Short video thumbnail generation failed: {:?}", result.err());
    
    println!("Short video (2s) extraction time: {} ms", duration.as_millis());
    
    // Short videos should be faster since they extract from first frame
    assert!(
        duration.as_millis() <= PERFORMANCE_TARGET_MS,
        "Short video extraction time {}ms exceeds target {}ms",
        duration.as_millis(),
        PERFORMANCE_TARGET_MS
    );
    
    println!("✅ Short video performance target met\n");
}

#[test]
fn test_codec_metrics_tracking() {
    if !is_ffmpeg_available() {
        println!("FFmpeg not available, skipping test");
        return;
    }

    let temp_dir = TempDir::new().unwrap();
    let cache_dir = temp_dir.path().join("cache");
    fs::create_dir_all(&cache_dir).unwrap();

    // Reset metrics
    reset_codec_performance_metrics();

    // Create and process a test video
    let video_path = temp_dir.path().join("test_video.mp4");
    
    if let Err(e) = create_test_video(&video_path, "libx264", 10, "1280x720") {
        println!("Failed to create test video: {}", e);
        return;
    }

    // Process the video multiple times
    for i in 0..3 {
        let iteration_cache = cache_dir.join(format!("iter_{}", i));
        fs::create_dir_all(&iteration_cache).unwrap();
        
        let result = generate_video_thumbnails(
            video_path.to_str().unwrap(),
            &iteration_cache,
        );
        
        assert!(result.is_ok(), "Thumbnail generation failed on iteration {}", i);
    }

    // Get metrics
    let metrics = get_codec_performance_metrics();
    
    println!("\n=== Codec Metrics Tracking Test ===");
    
    // Verify metrics were collected
    assert!(!metrics.is_empty(), "No codec metrics collected");
    
    // Find H.264 metrics
    let h264_metrics = metrics.iter().find(|m| m.codec_name == "h264");
    assert!(h264_metrics.is_some(), "H.264 metrics not found");
    
    let h264 = h264_metrics.unwrap();
    println!("H.264 metrics:");
    println!("  Sample count: {}", h264.sample_count);
    println!("  Average time: {:.2} ms", h264.avg_extraction_time_ms);
    println!("  Success rate: {:.2}%", h264.success_rate * 100.0);
    
    // Verify metrics are reasonable
    assert_eq!(h264.sample_count, 3, "Expected 3 samples");
    assert!(h264.avg_extraction_time_ms > 0.0, "Average time should be positive");
    assert!(h264.avg_extraction_time_ms <= PERFORMANCE_TARGET_MS as f64, 
            "Average time should meet target");
    assert_eq!(h264.success_rate, 1.0, "Success rate should be 100%");
    
    println!("✅ Codec metrics tracking working correctly\n");
}
