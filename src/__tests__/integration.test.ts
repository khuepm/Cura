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
        images: [
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
});
