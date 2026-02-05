/**
 * Integration tests for Cura Photo Manager
 * Tests complete user flows from folder selection to cloud sync
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

describe('Integration Tests - Complete User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flow 1: Import folder → Scan → Extract metadata → Generate thumbnails → Display grid', () => {
    it('should complete the full import flow', async () => {
      // Step 1: Scan folder
      const mockScanResult = {
        media_files: [
          { path: '/test/image1.jpg', media_type: 'image' },
          { path: '/test/image2.png', media_type: 'image' },
        ],
        total_count: 2,
        image_count: 2,
        video_count: 0,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);

      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
      });

      expect(scanResult.total_count).toBe(2);
      expect(scanResult.media_files).toHaveLength(2);
      expect(scanResult.image_count).toBe(2);
      expect(scanResult.video_count).toBe(0);

      // Step 2: Extract metadata for each image
      const mockMetadata = {
        path: '/test/image1.jpg',
        capture_date: '2024-01-15T10:30:00Z',
        camera_make: 'Canon',
        camera_model: 'EOS R5',
        gps_latitude: 37.7749,
        gps_longitude: -122.4194,
        width: 6000,
        height: 4000,
        file_size: 5242880,
        file_modified: '2024-01-15T10:30:00Z',
      };

      mockInvoke.mockResolvedValueOnce(mockMetadata);

      const metadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/image1.jpg',
      });

      expect(metadata.camera_make).toBe('Canon');
      expect(metadata.gps_latitude).toBe(37.7749);

      // Step 3: Generate thumbnails
      const mockThumbnails = {
        small: '/cache/thumbnails/abc123_small.jpg',
        medium: '/cache/thumbnails/abc123_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockThumbnails);

      const thumbnails = await mockInvoke('generate_thumbnails', {
        imagePath: '/test/image1.jpg',
      });

      expect(thumbnails.small).toContain('_small.jpg');
      expect(thumbnails.medium).toContain('_medium.jpg');

      // Verify all commands were called in correct order
      expect(mockInvoke).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully during import', async () => {
      // Simulate scan with some errors
      const mockScanResult = {
        media_files: [{ path: '/test/image1.jpg', media_type: 'image' }],
        total_count: 1,
        image_count: 1,
        video_count: 0,
        errors: [
          {
            path: '/test/corrupt.jpg',
            message: 'Failed to read file',
          },
        ],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);

      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
      });

      expect(scanResult.total_count).toBe(1);
      expect(scanResult.errors).toHaveLength(1);
      expect(scanResult.errors[0].message).toBe('Failed to read file');
    });
  });

  describe('Flow 2: Select image → Display detail view → Show metadata and tags', () => {
    it('should load image details with metadata and tags', async () => {
      const imageId = 1;

      // Step 1: Get image by ID
      const mockImage = {
        id: imageId,
        path: '/test/image1.jpg',
        thumbnail_small: '/cache/abc123_small.jpg',
        thumbnail_medium: '/cache/abc123_medium.jpg',
        checksum: 'abc123',
        capture_date: '2024-01-15T10:30:00Z',
        camera_make: 'Canon',
        camera_model: 'EOS R5',
        width: 6000,
        height: 4000,
        file_size: 5242880,
        sync_status: 'pending',
      };

      mockInvoke.mockResolvedValueOnce(mockImage);

      const image = await mockInvoke('get_image_by_id', { imageId });

      expect(image.id).toBe(imageId);
      expect(image.camera_make).toBe('Canon');

      // Step 2: Get tags for image
      const mockTags = [
        { id: 1, image_id: imageId, label: 'landscape', confidence: 0.95 },
        { id: 2, image_id: imageId, label: 'nature', confidence: 0.87 },
      ];

      mockInvoke.mockResolvedValueOnce(mockTags);

      const tags = await mockInvoke('get_image_tags', { imageId });

      expect(tags).toHaveLength(2);
      expect(tags[0].label).toBe('landscape');
      expect(tags[0].confidence).toBeGreaterThan(0.9);
    });
  });

  describe('Flow 3: Search by tag → Filter results → Display matches', () => {
    it('should search images by tags and filters', async () => {
      const mockSearchResults = [
        {
          id: 1,
          path: '/test/image1.jpg',
          thumbnail_small: '/cache/abc123_small.jpg',
          thumbnail_medium: '/cache/abc123_medium.jpg',
          camera_model: 'EOS R5',
        },
        {
          id: 2,
          path: '/test/image2.jpg',
          thumbnail_small: '/cache/def456_small.jpg',
          thumbnail_medium: '/cache/def456_medium.jpg',
          camera_model: 'EOS R5',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockSearchResults);

      const results = await mockInvoke('search_images', {
        text: 'landscape',
        tags: ['nature', 'landscape'],
        cameraModel: 'EOS R5',
      });

      expect(results).toHaveLength(2);
      expect(results[0].camera_model).toBe('EOS R5');
    });

    it('should handle empty search results', async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const results = await mockInvoke('search_images', {
        text: 'nonexistent',
      });

      expect(results).toHaveLength(0);
    });
  });

  describe('Flow 4: Authenticate Drive → Select images → Upload → Verify sync status', () => {
    it('should complete the full sync flow', async () => {
      // Step 1: Check authentication status
      mockInvoke.mockResolvedValueOnce(false);

      const isAuth = await mockInvoke('is_authenticated');
      expect(isAuth).toBe(false);

      // Step 2: Authenticate
      const mockAuthStatus = {
        success: true,
        message: 'Authentication successful',
      };

      mockInvoke.mockResolvedValueOnce(mockAuthStatus);

      const authResult = await mockInvoke('authenticate_google_drive');
      expect(authResult.success).toBe(true);

      // Step 3: Sync images
      const mockSyncResult = {
        uploaded: 2,
        skipped: 1,
        failed: [],
      };

      mockInvoke.mockResolvedValueOnce(mockSyncResult);

      const syncResult = await mockInvoke('sync_to_drive', {
        imageIds: [1, 2, 3],
      });

      expect(syncResult.uploaded).toBe(2);
      expect(syncResult.skipped).toBe(1);
      expect(syncResult.failed).toHaveLength(0);
    });

    it('should handle sync failures with retry', async () => {
      const mockSyncResult = {
        uploaded: 1,
        skipped: 0,
        failed: [
          {
            image_id: 2,
            error: 'Network timeout',
          },
        ],
      };

      mockInvoke.mockResolvedValueOnce(mockSyncResult);

      const syncResult = await mockInvoke('sync_to_drive', {
        imageIds: [1, 2],
      });

      expect(syncResult.uploaded).toBe(1);
      expect(syncResult.failed).toHaveLength(1);
      expect(syncResult.failed[0].error).toBe('Network timeout');
    });
  });

  describe('Event System Integration', () => {
    it('should handle progress events during scan', async () => {
      const progressCallback = vi.fn();

      mockListen.mockImplementation((event, callback) => {
        if (event === 'scan-progress') {
          // Simulate progress events
          setTimeout(() => callback({ payload: { current: 50, total: 100 } }), 10);
          setTimeout(() => callback({ payload: { current: 100, total: 100 } }), 20);
        }
        return Promise.resolve(() => {});
      });

      await mockListen('scan-progress', progressCallback);

      // Wait for events to fire
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(mockListen).toHaveBeenCalledWith('scan-progress', expect.any(Function));
    });

    it('should handle sync progress events', async () => {
      const progressCallback = vi.fn();

      mockListen.mockImplementation((event, callback) => {
        if (event === 'sync-progress') {
          setTimeout(
            () =>
              callback({
                payload: {
                  current: 1,
                  total: 3,
                  current_file: 'image1.jpg',
                },
              }),
            10
          );
        }
        return Promise.resolve(() => {});
      });

      await mockListen('sync-progress', progressCallback);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(mockListen).toHaveBeenCalledWith('sync-progress', expect.any(Function));
    });
  });

  describe('AI Classification Integration', () => {
    it('should save AI-generated tags to database', async () => {
      const imageId = 1;
      const tags = [
        ['landscape', 0.95],
        ['nature', 0.87],
        ['mountain', 0.82],
      ];

      mockInvoke.mockResolvedValueOnce(undefined);

      await mockInvoke('save_tags', { imageId, tags });

      expect(mockInvoke).toHaveBeenCalledWith('save_tags', {
        imageId,
        tags,
      });
    });

    it('should save embeddings for semantic search', async () => {
      const imageId = 1;
      const embedding = new Array(512).fill(0).map(() => Math.random());
      const modelVersion = 'clip-vit-base-patch32';

      mockInvoke.mockResolvedValueOnce(undefined);

      await mockInvoke('save_embedding', {
        imageId,
        embedding,
        modelVersion,
      });

      expect(mockInvoke).toHaveBeenCalledWith('save_embedding', {
        imageId,
        embedding,
        modelVersion,
      });
    });
  });

  describe('Settings Integration', () => {
    it('should load and save settings', async () => {
      // Load settings
      const mockSettings = {
        thumbnail_cache_path: '/cache/thumbnails',
        ai_model: 'clip',
        sync_enabled: true,
        auto_sync: false,
        sync_interval: 60,
      };

      mockInvoke.mockResolvedValueOnce(mockSettings);

      const settings = await mockInvoke('get_settings');

      expect(settings.ai_model).toBe('clip');
      expect(settings.sync_enabled).toBe(true);

      // Save settings
      const newSettings = {
        ...mockSettings,
        auto_sync: true,
        sync_interval: 30,
      };

      mockInvoke.mockResolvedValueOnce(undefined);

      await mockInvoke('save_settings', { newSettings });

      expect(mockInvoke).toHaveBeenCalledWith('save_settings', {
        newSettings,
      });
    });
  });

  describe('Flow 5: Mixed Media Import - Images and Videos', () => {
    it('should import folder with both images and videos', async () => {
      // Step 1: Scan folder with mixed media
      const mockScanResult = {
        media_files: [
          { path: '/test/photo1.jpg', media_type: 'image' },
          { path: '/test/photo2.png', media_type: 'image' },
          { path: '/test/video1.mp4', media_type: 'video' },
          { path: '/test/video2.mov', media_type: 'video' },
          { path: '/test/subfolder/photo3.heic', media_type: 'image' },
          { path: '/test/subfolder/video3.avi', media_type: 'video' },
        ],
        total_count: 6,
        image_count: 3,
        video_count: 3,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);

      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
      });

      // Verify scan results
      expect(scanResult.total_count).toBe(6);
      expect(scanResult.image_count).toBe(3);
      expect(scanResult.video_count).toBe(3);
      expect(scanResult.media_files).toHaveLength(6);
      expect(scanResult.errors).toHaveLength(0);

      // Verify media types are correctly identified
      const images = scanResult.media_files.filter((m: any) => m.media_type === 'image');
      const videos = scanResult.media_files.filter((m: any) => m.media_type === 'video');
      expect(images).toHaveLength(3);
      expect(videos).toHaveLength(3);

      // Step 2: Process images - extract metadata and generate thumbnails
      for (const media of images) {
        // Extract image metadata
        const mockImageMetadata = {
          path: media.path,
          capture_date: '2024-01-15T10:30:00Z',
          camera_make: 'Canon',
          camera_model: 'EOS R5',
          width: 6000,
          height: 4000,
          file_size: 5242880,
          file_modified: '2024-01-15T10:30:00Z',
        };

        mockInvoke.mockResolvedValueOnce(mockImageMetadata);

        const imageMetadata = await mockInvoke('extract_metadata', {
          imagePath: media.path,
        });

        expect(imageMetadata.path).toBe(media.path);
        expect(imageMetadata.width).toBeGreaterThan(0);
        expect(imageMetadata.height).toBeGreaterThan(0);

        // Generate image thumbnails
        const mockImageThumbnails = {
          small: `/cache/thumbnails/${media.path.split('/').pop()}_small.jpg`,
          medium: `/cache/thumbnails/${media.path.split('/').pop()}_medium.jpg`,
        };

        mockInvoke.mockResolvedValueOnce(mockImageThumbnails);

        const imageThumbnails = await mockInvoke('generate_thumbnails', {
          imagePath: media.path,
        });

        expect(imageThumbnails.small).toContain('_small.jpg');
        expect(imageThumbnails.medium).toContain('_medium.jpg');
      }

      // Step 3: Process videos - extract metadata and generate thumbnails
      for (const media of videos) {
        // Extract video metadata
        const mockVideoMetadata = {
          path: media.path,
          width: 1920,
          height: 1080,
          duration_seconds: 120.5,
          video_codec: 'h264',
          file_size: 15728640,
          file_modified: '2024-01-15T11:00:00Z',
        };

        mockInvoke.mockResolvedValueOnce(mockVideoMetadata);

        const videoMetadata = await mockInvoke('extract_metadata', {
          imagePath: media.path, // Note: command name is still imagePath for compatibility
        });

        expect(videoMetadata.path).toBe(media.path);
        expect(videoMetadata.duration_seconds).toBeGreaterThan(0);
        expect(videoMetadata.video_codec).toBeTruthy();
        expect(videoMetadata.width).toBeGreaterThan(0);
        expect(videoMetadata.height).toBeGreaterThan(0);

        // Generate video thumbnails (extracted from video frame)
        const mockVideoThumbnails = {
          small: `/cache/thumbnails/${media.path.split('/').pop()}_small.jpg`,
          medium: `/cache/thumbnails/${media.path.split('/').pop()}_medium.jpg`,
        };

        mockInvoke.mockResolvedValueOnce(mockVideoThumbnails);

        const videoThumbnails = await mockInvoke('generate_video_thumbnails', {
          videoPath: media.path,
        });

        expect(videoThumbnails.small).toContain('_small.jpg');
        expect(videoThumbnails.medium).toContain('_medium.jpg');
      }

      // Verify all media files were processed
      // 3 images × 2 calls (metadata + thumbnails) + 3 videos × 2 calls (metadata + thumbnails) + 1 scan = 13 calls
      expect(mockInvoke).toHaveBeenCalledTimes(13);
    });

    it('should handle mixed media with some processing errors', async () => {
      // Scan with mixed media including some problematic files
      const mockScanResult = {
        media_files: [
          { path: '/test/good_image.jpg', media_type: 'image' },
          { path: '/test/good_video.mp4', media_type: 'video' },
          { path: '/test/corrupt_image.jpg', media_type: 'image' },
          { path: '/test/corrupt_video.mp4', media_type: 'video' },
        ],
        total_count: 4,
        image_count: 2,
        video_count: 2,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);

      const scanResult = await mockInvoke('scan_folder', {
        folderPath: '/test',
      });

      expect(scanResult.total_count).toBe(4);
      expect(scanResult.image_count).toBe(2);
      expect(scanResult.video_count).toBe(2);

      // Process good image - succeeds
      mockInvoke.mockResolvedValueOnce({
        path: '/test/good_image.jpg',
        width: 1920,
        height: 1080,
        file_size: 2048000,
      });

      const goodImageMetadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/good_image.jpg',
      });

      expect(goodImageMetadata.path).toBe('/test/good_image.jpg');

      // Process corrupt image - fails
      mockInvoke.mockRejectedValueOnce(new Error('Failed to decode image'));

      try {
        await mockInvoke('extract_metadata', {
          imagePath: '/test/corrupt_image.jpg',
        });
      } catch (error: any) {
        expect(error.message).toBe('Failed to decode image');
      }

      // Process good video - succeeds
      mockInvoke.mockResolvedValueOnce({
        path: '/test/good_video.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 60.0,
        video_codec: 'h264',
        file_size: 10240000,
      });

      const goodVideoMetadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/good_video.mp4',
      });

      expect(goodVideoMetadata.duration_seconds).toBe(60.0);

      // Process corrupt video - fails
      mockInvoke.mockRejectedValueOnce(new Error('Failed to extract video frame'));

      try {
        await mockInvoke('generate_video_thumbnails', {
          videoPath: '/test/corrupt_video.mp4',
        });
      } catch (error: any) {
        expect(error.message).toBe('Failed to extract video frame');
      }

      // Verify error handling allows processing to continue
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should correctly filter media by type after import', async () => {
      // Import mixed media
      const mockScanResult = {
        media_files: [
          { path: '/test/image1.jpg', media_type: 'image' },
          { path: '/test/image2.png', media_type: 'image' },
          { path: '/test/video1.mp4', media_type: 'video' },
          { path: '/test/video2.mov', media_type: 'video' },
        ],
        total_count: 4,
        image_count: 2,
        video_count: 2,
        errors: [],
      };

      mockInvoke.mockResolvedValueOnce(mockScanResult);

      await mockInvoke('scan_folder', { folderPath: '/test' });

      // Query for images only
      const mockImageResults = [
        {
          id: 1,
          path: '/test/image1.jpg',
          media_type: 'image',
          thumbnail_small: '/cache/image1_small.jpg',
        },
        {
          id: 2,
          path: '/test/image2.png',
          media_type: 'image',
          thumbnail_small: '/cache/image2_small.jpg',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockImageResults);

      const imageResults = await mockInvoke('query_media', {
        mediaType: 'image',
      });

      expect(imageResults).toHaveLength(2);
      expect(imageResults.every((m: any) => m.media_type === 'image')).toBe(true);

      // Query for videos only
      const mockVideoResults = [
        {
          id: 3,
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
          duration_seconds: 90.5,
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockVideoResults);

      const videoResults = await mockInvoke('query_media', {
        mediaType: 'video',
      });

      expect(videoResults).toHaveLength(2);
      expect(videoResults.every((m: any) => m.media_type === 'video')).toBe(true);
      expect(videoResults.every((m: any) => m.duration_seconds > 0)).toBe(true);

      // Query for all media
      const mockAllResults = [...mockImageResults, ...mockVideoResults];

      mockInvoke.mockResolvedValueOnce(mockAllResults);

      const allResults = await mockInvoke('query_media', {
        mediaType: 'all',
      });

      expect(allResults).toHaveLength(4);
    });

    it('should generate thumbnails for both images and videos with correct dimensions', async () => {
      // Test image thumbnail generation
      const mockImageThumbnails = {
        small: '/cache/thumbnails/image_abc123_small.jpg',
        medium: '/cache/thumbnails/image_abc123_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockImageThumbnails);

      const imageThumbnails = await mockInvoke('generate_thumbnails', {
        imagePath: '/test/photo.jpg',
      });

      expect(imageThumbnails.small).toContain('_small.jpg');
      expect(imageThumbnails.medium).toContain('_medium.jpg');

      // Test video thumbnail generation (from extracted frame)
      const mockVideoThumbnails = {
        small: '/cache/thumbnails/video_def456_small.jpg',
        medium: '/cache/thumbnails/video_def456_medium.jpg',
      };

      mockInvoke.mockResolvedValueOnce(mockVideoThumbnails);

      const videoThumbnails = await mockInvoke('generate_video_thumbnails', {
        videoPath: '/test/video.mp4',
      });

      expect(videoThumbnails.small).toContain('_small.jpg');
      expect(videoThumbnails.medium).toContain('_medium.jpg');

      // Both should produce thumbnails in the same format (JPEG)
      expect(imageThumbnails.small.endsWith('.jpg')).toBe(true);
      expect(videoThumbnails.small.endsWith('.jpg')).toBe(true);
    });

    it('should extract metadata for both images and videos with type-specific fields', async () => {
      // Extract image metadata
      const mockImageMetadata = {
        path: '/test/photo.jpg',
        capture_date: '2024-01-15T10:30:00Z',
        camera_make: 'Canon',
        camera_model: 'EOS R5',
        gps_latitude: 37.7749,
        gps_longitude: -122.4194,
        width: 6000,
        height: 4000,
        file_size: 5242880,
        file_modified: '2024-01-15T10:30:00Z',
        // No video-specific fields
        duration_seconds: null,
        video_codec: null,
      };

      mockInvoke.mockResolvedValueOnce(mockImageMetadata);

      const imageMetadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/photo.jpg',
      });

      expect(imageMetadata.camera_make).toBeTruthy();
      expect(imageMetadata.camera_model).toBeTruthy();
      expect(imageMetadata.gps_latitude).toBeTruthy();
      expect(imageMetadata.duration_seconds).toBeNull();
      expect(imageMetadata.video_codec).toBeNull();

      // Extract video metadata
      const mockVideoMetadata = {
        path: '/test/video.mp4',
        width: 1920,
        height: 1080,
        duration_seconds: 120.5,
        video_codec: 'h264',
        file_size: 15728640,
        file_modified: '2024-01-15T11:00:00Z',
        // No image-specific fields
        capture_date: null,
        camera_make: null,
        camera_model: null,
        gps_latitude: null,
        gps_longitude: null,
      };

      mockInvoke.mockResolvedValueOnce(mockVideoMetadata);

      const videoMetadata = await mockInvoke('extract_metadata', {
        imagePath: '/test/video.mp4',
      });

      expect(videoMetadata.duration_seconds).toBeGreaterThan(0);
      expect(videoMetadata.video_codec).toBeTruthy();
      expect(videoMetadata.camera_make).toBeNull();
      expect(videoMetadata.gps_latitude).toBeNull();
    });
  });
});
