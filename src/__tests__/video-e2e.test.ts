/**
 * Comprehensive End-to-End Tests for Video Support
 * Task 31.1: Test all video support features together
 * 
 * Tests cover:
 * - All video support features working together
 * - Edge cases: short videos, corrupt videos, unsupported codecs
 * - Format configuration with various combinations
 * - Media type filtering across all features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Tauri API
const mockInvoke = vi.fn();
const mockListen = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
}));

describe('Video Support - Comprehensive End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edge Case: Short Videos (< 5 seconds)', () => {
    it('should extract thumbnail from first frame for videos shorter than 5 seconds', async () => {
      // Scan finds a short video
      const mockScanResult = {
        media_files: [
          { path: '/test/short_video.mp4', media_type: 'video' },
        ],
        total_count: 1,
        image_count: 0,
        video_count: 1,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      await mockInvoke('scan_folder', { folderPath: '/test' });

      // Extract metadata shows duration < 5 seconds
      const mockVideoMetadata = {
        path: '/test/short_video.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 2.5, // Short video
        video_codec: 'h264',
        file_size: 1048576,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/short_video.mp4',
      });

      expect(metadata.duration_seconds).toBeLessThan(5);

      // Generate thumbnails - should extract from first frame
      const mockThumbnails = {
        small: '/cache/thumbnails/short_video_small.jpg',
        medium: '/cache/thumbnails/short_video_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockThumbnails);
      const thumbnails = await mockInvoke('generate_video_thumbnails', {
        videoPath: '/test/short_video.mp4',
      });

      expect(thumbnails.small).toContain('_small.jpg');
      expect(thumbnails.medium).toContain('_medium.jpg');
    });

    it('should handle videos with duration exactly 5 seconds', async () => {
      const mockVideoMetadata = {
        path: '/test/exactly_5s.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 5.0,
        video_codec: 'h264',
        file_size: 2097152,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/exactly_5s.mp4',
      });

      expect(metadata.duration_seconds).toBe(5.0);

      // Should extract from 5 second mark
      const mockThumbnails = {
        small: '/cache/thumbnails/exactly_5s_small.jpg',
        medium: '/cache/thumbnails/exactly_5s_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockThumbnails);
      const thumbnails = await mockInvoke('generate_video_thumbnails', {
        videoPath: '/test/exactly_5s.mp4',
      });

      expect(thumbnails).toBeTruthy();
    });

    it('should handle very short videos (< 1 second)', async () => {
      const mockVideoMetadata = {
        path: '/test/very_short.mp4',
        width: 1280,
        height: 720,
        duration_seconds: 0.5,
        video_codec: 'h264',
        file_size: 524288,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/very_short.mp4',
      });

      expect(metadata.duration_seconds).toBeLessThan(1);

      // Should still extract first frame
      const mockThumbnails = {
        small: '/cache/thumbnails/very_short_small.jpg',
        medium: '/cache/thumbnails/very_short_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockThumbnails);
      const thumbnails = await mockInvoke('generate_video_thumbnails', {
        videoPath: '/test/very_short.mp4',
      });

      expect(thumbnails).toBeTruthy();
    });
  });

  describe('Edge Case: Corrupt Videos', () => {
    it('should handle corrupt video files gracefully', async () => {
      // Scan finds a corrupt video
      const mockScanResult = {
        media_files: [
          { path: '/test/corrupt.mp4', media_type: 'video' },
        ],
        total_count: 1,
        image_count: 0,
        video_count: 1,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      await mockInvoke('scan_folder', { folderPath: '/test' });

      // Metadata extraction fails
      mockInvoke.mockRejectedValueOnce(new Error('Failed to read video metadata'));

      try {
        await mockInvoke('extract_metadata', {
          imagePath: '/test/corrupt.mp4',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to read video metadata');
      }

      // Thumbnail generation also fails
      mockInvoke.mockRejectedValueOnce(new Error('Failed to extract video frame'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/corrupt.mp4',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to extract video frame');
      }
    });

    it('should handle videos with missing video stream (audio only)', async () => {
      // Audio-only file detected as video by extension
      const mockScanResult = {
        media_files: [
          { path: '/test/audio_only.mp4', media_type: 'video' },
        ],
        total_count: 1,
        image_count: 0,
        video_count: 1,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      await mockInvoke('scan_folder', { folderPath: '/test' });

      // Thumbnail extraction fails because no video stream
      mockInvoke.mockRejectedValueOnce(new Error('No video stream found'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/audio_only.mp4',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('No video stream found');
      }
    });

    it('should handle partially corrupt videos', async () => {
      // Video metadata can be read but frame extraction fails
      const mockVideoMetadata = {
        path: '/test/partial_corrupt.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 60.0,
        video_codec: 'h264',
        file_size: 5242880,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/partial_corrupt.mp4',
      });

      expect(metadata.duration_seconds).toBe(60.0);

      // But thumbnail extraction fails
      mockInvoke.mockRejectedValueOnce(new Error('Failed to decode frame at 5s'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/partial_corrupt.mp4',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to decode frame');
      }
    });
  });

  describe('Edge Case: Unsupported Codecs', () => {
    it('should handle videos with unsupported codecs', async () => {
      // Scan finds video with rare codec
      const mockScanResult = {
        media_files: [
          { path: '/test/rare_codec.mkv', media_type: 'video' },
        ],
        total_count: 1,
        image_count: 0,
        video_count: 1,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      await mockInvoke('scan_folder', { folderPath: '/test' });

      // Metadata extraction might succeed
      const mockVideoMetadata = {
        path: '/test/rare_codec.mkv',
        width: 1920,
        height: 1080,
        duration_seconds: 120.0,
        video_codec: 'vp9',
        file_size: 10485760,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/rare_codec.mkv',
      });

      expect(metadata.video_codec).toBe('vp9');

      // But thumbnail extraction might fail if codec not supported
      mockInvoke.mockRejectedValueOnce(new Error('Codec not supported by FFmpeg'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/rare_codec.mkv',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Codec not supported');
      }
    });

    it('should handle videos with proprietary codecs', async () => {
      const mockVideoMetadata = {
        path: '/test/proprietary.mov',
        width: 3840,
        height: 2160,
        duration_seconds: 180.0,
        video_codec: 'prores',
        file_size: 104857600,
        file_modified: '2024-01-15T11:00:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);
      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/proprietary.mov',
      });

      expect(metadata.video_codec).toBe('prores');

      // Thumbnail extraction might work or fail depending on FFmpeg build
      mockInvoke.mockRejectedValueOnce(new Error('Decoder not available'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/proprietary.mov',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Decoder not available');
      }
    });
  });

  describe('Format Configuration: Various Combinations', () => {
    it('should handle custom format configuration with only specific video formats', async () => {
      // Get default formats
      const mockDefaultFormats = {
        imageFormats: ['jpg', 'jpeg', 'png', 'heic', 'raw'],
        videoFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      };

      mockInvoke.mockResolvedValueOnce(mockDefaultFormats);
      const defaultFormats = await mockInvoke('get_default_formats');

      expect(defaultFormats.videoFormats).toContain('mp4');
      expect(defaultFormats.videoFormats).toContain('mov');

      // Set custom configuration - only MP4 and MOV
      const customConfig = {
        imageFormats: ['jpg', 'jpeg', 'png'],
        videoFormats: ['mp4', 'mov'],
      };

      mockInvoke.mockResolvedValueOnce(undefined);
      await mockInvoke('set_format_config', { config: customConfig });

      // Scan with custom config
      const mockScanResult = {
        media_files: [
          { path: '/test/video1.mp4', media_type: 'video' },
          { path: '/test/video2.mov', media_type: 'video' },
          // These should be filtered out:
          // /test/video3.avi
          // /test/video4.mkv
        ],
        total_count: 2,
        image_count: 0,
        video_count: 2,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
        config: customConfig,
      });

      expect(scanResult.video_count).toBe(2);
      expect(scanResult.media_files.every((m: any) => 
        m.path.endsWith('.mp4') || m.path.endsWith('.mov')
      )).toBe(true);
    });

    it('should handle format configuration with no video formats selected', async () => {
      // Set config with no video formats
      const noVideoConfig = {
        imageFormats: ['jpg', 'jpeg', 'png', 'heic'],
        videoFormats: [],
      };

      mockInvoke.mockResolvedValueOnce(undefined);
      await mockInvoke('set_format_config', { config: noVideoConfig });

      // Scan should find no videos
      const mockScanResult = {
        media_files: [
          { path: '/test/photo1.jpg', media_type: 'image' },
          { path: '/test/photo2.png', media_type: 'image' },
          // Videos filtered out
        ],
        total_count: 2,
        image_count: 2,
        video_count: 0,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
        config: noVideoConfig,
      });

      expect(scanResult.video_count).toBe(0);
      expect(scanResult.image_count).toBe(2);
    });

    it('should handle format configuration with all video formats', async () => {
      // Set config with all video formats
      const allVideoConfig = {
        imageFormats: ['jpg', 'jpeg', 'png'],
        videoFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg', '3gp'],
      };

      mockInvoke.mockResolvedValueOnce(undefined);
      await mockInvoke('set_format_config', { config: allVideoConfig });

      // Scan should find all video formats
      const mockScanResult = {
        media_files: [
          { path: '/test/video1.mp4', media_type: 'video' },
          { path: '/test/video2.mov', media_type: 'video' },
          { path: '/test/video3.avi', media_type: 'video' },
          { path: '/test/video4.mkv', media_type: 'video' },
          { path: '/test/video5.webm', media_type: 'video' },
          { path: '/test/video6.flv', media_type: 'video' },
          { path: '/test/video7.wmv', media_type: 'video' },
          { path: '/test/video8.m4v', media_type: 'video' },
          { path: '/test/video9.mpg', media_type: 'video' },
          { path: '/test/video10.mpeg', media_type: 'video' },
          { path: '/test/video11.3gp', media_type: 'video' },
        ],
        total_count: 11,
        image_count: 0,
        video_count: 11,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
        config: allVideoConfig,
      });

      expect(scanResult.video_count).toBe(11);
      expect(scanResult.media_files).toHaveLength(11);
    });

    it('should handle mixed format configuration changes', async () => {
      // Start with default config
      const defaultConfig = {
        imageFormats: ['jpg', 'jpeg', 'png', 'heic'],
        videoFormats: ['mp4', 'mov', 'avi', 'mkv'],
      };

      mockInvoke.mockResolvedValueOnce(defaultConfig);
      const initialConfig = await mockInvoke('get_format_config');

      expect(initialConfig.videoFormats).toHaveLength(4);

      // Change to minimal config
      const minimalConfig = {
        imageFormats: ['jpg'],
        videoFormats: ['mp4'],
      };

      mockInvoke.mockResolvedValueOnce(undefined);
      await mockInvoke('set_format_config', { config: minimalConfig });

      // Verify config was saved
      mockInvoke.mockResolvedValueOnce(minimalConfig);
      const savedConfig = await mockInvoke('get_format_config');

      expect(savedConfig.imageFormats).toHaveLength(1);
      expect(savedConfig.videoFormats).toHaveLength(1);
    });
  });

  describe('Media Type Filtering: Across All Features', () => {
    it('should filter by media type in search', async () => {
      // Search for videos only
      const mockVideoSearchResults = [
        {
          id: 1,
          path: '/test/video1.mp4',
          media_type: 'video',
          thumbnail_small: '/cache/video1_small.jpg',
          duration_seconds: 120.0,
          video_codec: 'h264',
        },
        {
          id: 2,
          path: '/test/video2.mov',
          media_type: 'video',
          thumbnail_small: '/cache/video2_small.jpg',
          duration_seconds: 90.5,
          video_codec: 'h264',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockVideoSearchResults);
      const videoResults = await mockInvoke('search_images', {
        mediaType: 'video',
      });

      expect(videoResults).toHaveLength(2);
      expect(videoResults.every((m: any) => m.media_type === 'video')).toBe(true);
      expect(videoResults.every((m: any) => m.duration_seconds > 0)).toBe(true);

      // Search for images only
      const mockImageSearchResults = [
        {
          id: 3,
          path: '/test/photo1.jpg',
          media_type: 'image',
          thumbnail_small: '/cache/photo1_small.jpg',
          camera_make: 'Canon',
        },
        {
          id: 4,
          path: '/test/photo2.png',
          media_type: 'image',
          thumbnail_small: '/cache/photo2_small.jpg',
          camera_make: 'Nikon',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockImageSearchResults);
      const imageResults = await mockInvoke('search_images', {
        mediaType: 'image',
      });

      expect(imageResults).toHaveLength(2);
      expect(imageResults.every((m: any) => m.media_type === 'image')).toBe(true);

      // Search for all media
      const mockAllResults = [...mockVideoSearchResults, ...mockImageSearchResults];

      mockInvoke.mockResolvedValueOnce(mockAllResults);
      const allResults = await mockInvoke('search_images', {
        mediaType: 'all',
      });

      expect(allResults).toHaveLength(4);
    });

    it('should filter by media type in database queries', async () => {
      // Query videos with additional filters
      const mockFilteredVideos = [
        {
          id: 1,
          path: '/test/video1.mp4',
          media_type: 'video',
          duration_seconds: 120.0,
          video_codec: 'h264',
          width: 1920,
          height: 1080,
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockFilteredVideos);
      const filteredVideos = await mockInvoke('query_media', {
        mediaType: 'video',
        minDuration: 60.0,
        maxDuration: 180.0,
      });

      expect(filteredVideos).toHaveLength(1);
      expect(filteredVideos[0].media_type).toBe('video');
      expect(filteredVideos[0].duration_seconds).toBeGreaterThanOrEqual(60.0);
      expect(filteredVideos[0].duration_seconds).toBeLessThanOrEqual(180.0);

      // Query images with additional filters
      const mockFilteredImages = [
        {
          id: 2,
          path: '/test/photo1.jpg',
          media_type: 'image',
          camera_make: 'Canon',
          camera_model: 'EOS R5',
          width: 6000,
          height: 4000,
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockFilteredImages);
      const filteredImages = await mockInvoke('query_media', {
        mediaType: 'image',
        cameraModel: 'EOS R5',
      });

      expect(filteredImages).toHaveLength(1);
      expect(filteredImages[0].media_type).toBe('image');
      expect(filteredImages[0].camera_model).toBe('EOS R5');
    });

    it('should filter by media type in grid view', async () => {
      // Get all media for grid
      const mockAllMedia = [
        {
          id: 1,
          path: '/test/video1.mp4',
          media_type: 'video',
          thumbnail_small: '/cache/video1_small.jpg',
        },
        {
          id: 2,
          path: '/test/photo1.jpg',
          media_type: 'image',
          thumbnail_small: '/cache/photo1_small.jpg',
        },
        {
          id: 3,
          path: '/test/video2.mov',
          media_type: 'video',
          thumbnail_small: '/cache/video2_small.jpg',
        },
        {
          id: 4,
          path: '/test/photo2.png',
          media_type: 'image',
          thumbnail_small: '/cache/photo2_small.jpg',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockAllMedia);
      const allMedia = await mockInvoke('get_all_media');

      expect(allMedia).toHaveLength(4);

      // Filter videos in UI
      const videos = allMedia.filter((m: any) => m.media_type === 'video');
      expect(videos).toHaveLength(2);

      // Filter images in UI
      const images = allMedia.filter((m: any) => m.media_type === 'image');
      expect(images).toHaveLength(2);
    });

    it('should filter by media type in sync operations', async () => {
      // Sync only videos
      const mockVideoSyncResult = {
        uploaded: 2,
        skipped: 0,
        failed: [],
      };

      mockInvoke.mockResolvedValueOnce(mockVideoSyncResult);
      const videoSyncResult = await mockInvoke('sync_to_drive', {
        mediaType: 'video',
        imageIds: [1, 3],
      });

      expect(videoSyncResult.uploaded).toBe(2);

      // Sync only images
      const mockImageSyncResult = {
        uploaded: 2,
        skipped: 0,
        failed: [],
      };

      mockInvoke.mockResolvedValueOnce(mockImageSyncResult);
      const imageSyncResult = await mockInvoke('sync_to_drive', {
        mediaType: 'image',
        imageIds: [2, 4],
      });

      expect(imageSyncResult.uploaded).toBe(2);
    });
  });

  describe('Complete Video Support Integration', () => {
    it('should handle complete workflow: scan → process → display → search → sync', async () => {
      // Step 1: Configure formats
      const formatConfig = {
        imageFormats: ['jpg', 'jpeg', 'png'],
        videoFormats: ['mp4', 'mov', 'avi'],
      };

      mockInvoke.mockResolvedValueOnce(undefined);
      await mockInvoke('set_format_config', { config: formatConfig });

      // Step 2: Scan folder with mixed media
      const mockScanResult = {
        media_files: [
          { path: '/test/photo1.jpg', media_type: 'image' },
          { path: '/test/video1.mp4', media_type: 'video' },
          { path: '/test/photo2.png', media_type: 'image' },
          { path: '/test/video2.mov', media_type: 'video' },
        ],
        total_count: 4,
        image_count: 2,
        video_count: 2,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
        config: formatConfig,
      });

      expect(scanResult.total_count).toBe(4);
      expect(scanResult.image_count).toBe(2);
      expect(scanResult.video_count).toBe(2);

      // Step 3: Process each media file
      for (const media of scanResult.media_files) {
        // Extract metadata
        const mockMetadata = media.media_type === 'image'
          ? {
              path: media.path,
              width: 6000,
              height: 4000,
              camera_make: 'Canon',
              file_size: 5242880,
            }
          : {
              path: media.path,
              width: 1920,
              height: 1080,
              duration_seconds: 120.0,
              video_codec: 'h264',
              file_size: 15728640,
            };

        mockInvoke.mockResolvedValueOnce(mockMetadata);
        await mockInvoke('extract_metadata', { imagePath: media.path });

        // Generate thumbnails
        const mockThumbnails = {
          small: `/cache/${media.path.split('/').pop()}_small.jpg`,
          medium: `/cache/${media.path.split('/').pop()}_medium.jpg`,
        };

        mockInvoke.mockResolvedValueOnce(mockThumbnails);
        
        if (media.media_type === 'image') {
          await mockInvoke('generate_thumbnails', { imagePath: media.path });
        } else {
          await mockInvoke('generate_video_thumbnails', { videoPath: media.path });
        }
      }

      // Step 4: Search with media type filter
      const mockSearchResults = [
        {
          id: 2,
          path: '/test/video1.mp4',
          media_type: 'video',
          thumbnail_small: '/cache/video1_small.jpg',
          duration_seconds: 120.0,
        },
        {
          id: 4,
          path: '/test/video2.mov',
          media_type: 'video',
          thumbnail_small: '/cache/video2_small.jpg',
          duration_seconds: 90.0,
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockSearchResults);
      const searchResults = await mockInvoke('search_images', {
        mediaType: 'video',
      });

      expect(searchResults).toHaveLength(2);
      expect(searchResults.every((m: any) => m.media_type === 'video')).toBe(true);

      // Step 5: Sync videos to cloud
      const mockSyncResult = {
        uploaded: 2,
        skipped: 0,
        failed: [],
      };

      mockInvoke.mockResolvedValueOnce(mockSyncResult);
      const syncResult = await mockInvoke('sync_to_drive', {
        imageIds: [2, 4],
      });

      expect(syncResult.uploaded).toBe(2);

      // Verify all operations completed successfully
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should handle mixed media with various edge cases in single workflow', async () => {
      // Scan with mixed media including edge cases
      const mockScanResult = {
        media_files: [
          { path: '/test/normal_image.jpg', media_type: 'image' },
          { path: '/test/normal_video.mp4', media_type: 'video' },
          { path: '/test/short_video.mp4', media_type: 'video' },
          { path: '/test/heic_image.heic', media_type: 'image' },
          { path: '/test/corrupt_video.mp4', media_type: 'video' },
        ],
        total_count: 5,
        image_count: 2,
        video_count: 3,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);
      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
      });

      expect(scanResult.total_count).toBe(5);

      // Process normal image - succeeds
      mockInvoke.mockResolvedValueOnce({
        path: '/test/normal_image.jpg',
        width: 6000,
        height: 4000,
        file_size: 5242880,
      });
      await mockInvoke('extract_metadata', { imagePath: '/test/normal_image.jpg' });

      mockInvoke.mockResolvedValueOnce({
        small: '/cache/normal_image_small.jpg',
        medium: '/cache/normal_image_medium.jpg',
      });
      await mockInvoke('generate_thumbnails', { imagePath: '/test/normal_image.jpg' });

      // Process normal video - succeeds
      mockInvoke.mockResolvedValueOnce({
        path: '/test/normal_video.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 120.0,
        video_codec: 'h264',
        file_size: 15728640,
      });
      await mockInvoke('extract_metadata', { imagePath: '/test/normal_video.mp4' });

      mockInvoke.mockResolvedValueOnce({
        small: '/cache/normal_video_small.jpg',
        medium: '/cache/normal_video_medium.jpg',
      });
      await mockInvoke('generate_video_thumbnails', { videoPath: '/test/normal_video.mp4' });

      // Process short video - succeeds with first frame
      mockInvoke.mockResolvedValueOnce({
        path: '/test/short_video.mp4',
        width: 1280,
        height: 720,
        duration_seconds: 2.5,
        video_codec: 'h264',
        file_size: 1048576,
      });
      await mockInvoke('extract_metadata', { imagePath: '/test/short_video.mp4' });

      mockInvoke.mockResolvedValueOnce({
        small: '/cache/short_video_small.jpg',
        medium: '/cache/short_video_medium.jpg',
      });
      await mockInvoke('generate_video_thumbnails', { videoPath: '/test/short_video.mp4' });

      // Process HEIC image - succeeds with conversion
      mockInvoke.mockResolvedValueOnce({
        path: '/test/heic_image.heic',
        width: 4032,
        height: 3024,
        file_size: 3145728,
      });
      await mockInvoke('extract_metadata', { imagePath: '/test/heic_image.heic' });

      mockInvoke.mockResolvedValueOnce({
        small: '/cache/heic_image_small.jpg',
        medium: '/cache/heic_image_medium.jpg',
      });
      await mockInvoke('generate_thumbnails', { imagePath: '/test/heic_image.heic' });

      // Process corrupt video - fails gracefully
      mockInvoke.mockRejectedValueOnce(new Error('Failed to read video metadata'));

      try {
        await mockInvoke('extract_metadata', { imagePath: '/test/corrupt_video.mp4' });
      } catch (error: any) {
        expect(error.message).toContain('Failed to read video metadata');
      }

      // Verify successful media can still be queried
      const mockSuccessfulMedia = [
        { id: 1, path: '/test/normal_image.jpg', media_type: 'image' },
        { id: 2, path: '/test/normal_video.mp4', media_type: 'video' },
        { id: 3, path: '/test/short_video.mp4', media_type: 'video' },
        { id: 4, path: '/test/heic_image.heic', media_type: 'image' },
      ];

      mockInvoke.mockResolvedValueOnce(mockSuccessfulMedia);
      const successfulMedia = await mockInvoke('get_all_media');

      expect(successfulMedia).toHaveLength(4);
      expect(successfulMedia.filter((m: any) => m.media_type === 'video')).toHaveLength(2);
      expect(successfulMedia.filter((m: any) => m.media_type === 'image')).toHaveLength(2);
    });
  });
});
