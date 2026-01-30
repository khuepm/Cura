/**
 * Unit tests for search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSearch } from '../useSearch';
import * as commands from '../../tauri/commands';

// Mock Tauri commands
vi.mock('../../tauri/commands', () => ({
  searchImages: vi.fn(),
  getAllEmbeddings: vi.fn(),
}));

// Mock AppContext
vi.mock('../../store/AppContext', () => ({
  useAppDispatch: () => vi.fn(),
}));

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty search results', () => {
    it('should handle empty search results correctly', async () => {
      // Mock searchImages to return empty array
      vi.mocked(commands.searchImages).mockResolvedValue([]);

      const { result } = renderHook(() => useSearch());

      // Perform search with query that matches no images
      const searchResults = await result.current.performSearch({
        text: 'nonexistent-query-that-matches-nothing',
      });

      // Verify empty results
      expect(searchResults).toEqual([]);
      expect(searchResults.length).toBe(0);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle search with no matching tags', async () => {
      // Mock searchImages to return empty array
      vi.mocked(commands.searchImages).mockResolvedValue([]);

      const { result } = renderHook(() => useSearch());

      // Perform search with tags that don't exist
      const searchResults = await result.current.performSearch({
        tags: ['nonexistent-tag-1', 'nonexistent-tag-2'],
      });

      // Verify empty results
      expect(searchResults).toEqual([]);
      expect(searchResults.length).toBe(0);
    });

    it('should handle search with no matching date range', async () => {
      // Mock searchImages to return empty array
      vi.mocked(commands.searchImages).mockResolvedValue([]);

      const { result } = renderHook(() => useSearch());

      // Perform search with date range that has no images
      const searchResults = await result.current.performSearch({
        dateRange: {
          start: new Date('2000-01-01'),
          end: new Date('2000-01-02'),
        },
      });

      // Verify empty results
      expect(searchResults).toEqual([]);
      expect(searchResults.length).toBe(0);
    });

    it('should handle search with no matching camera model', async () => {
      // Mock searchImages to return empty array
      vi.mocked(commands.searchImages).mockResolvedValue([]);

      const { result } = renderHook(() => useSearch());

      // Perform search with camera model that doesn't exist
      const searchResults = await result.current.performSearch({
        cameraModel: 'Nonexistent Camera Model XYZ',
      });

      // Verify empty results
      expect(searchResults).toEqual([]);
      expect(searchResults.length).toBe(0);
    });

    it('should track search time even for empty results', async () => {
      // Mock searchImages to return empty array with a small delay
      vi.mocked(commands.searchImages).mockImplementation(async () => {
        // Add a small delay to ensure searchTime is measurable
        await new Promise(resolve => setTimeout(resolve, 10));
        return [];
      });

      const { result } = renderHook(() => useSearch());

      await result.current.performSearch({ text: 'test' });

      // Wait for search time to be updated
      await waitFor(() => {
        expect(result.current.searchTime).toBeGreaterThan(0);
      });
    });

    it('should not throw error on empty results', async () => {
      // Mock searchImages to return empty array
      vi.mocked(commands.searchImages).mockResolvedValue([]);

      const { result } = renderHook(() => useSearch());

      // Should not throw
      await expect(
        result.current.performSearch({ text: 'test' })
      ).resolves.not.toThrow();
    });
  });

  describe('Search error handling', () => {
    it('should handle search errors gracefully', async () => {
      // Mock searchImages to throw error
      vi.mocked(commands.searchImages).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { result } = renderHook(() => useSearch());

      const searchResults = await result.current.performSearch({ text: 'test' });

      // Should return empty array on error
      expect(searchResults).toEqual([]);
      
      // Wait for error state to be set
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});
