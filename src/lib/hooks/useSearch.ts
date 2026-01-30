import { useState, useCallback } from 'react';
import { useAppDispatch } from '../store/AppContext';
import { searchImages, getAllEmbeddings, RustImageRecord } from '../tauri/commands';
import type { SearchQuery, ImageRecord } from '../types';

export function useSearch() {
  const dispatch = useAppDispatch();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const performSemanticSearch = useCallback(async (query: string): Promise<ImageRecord[]> => {
    try {
      // Get all embeddings from database
      const embeddings = await getAllEmbeddings();
      
      if (embeddings.length === 0) {
        console.warn('No embeddings found in database');
        return [];
      }

      // Create worker for semantic search
      const worker = new Worker(new URL('../workers/aiClassifier.worker.ts', import.meta.url));
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error('Semantic search timeout'));
        }, 30000); // 30 second timeout

        worker.onmessage = (event) => {
          const { type, result, error: workerError } = event.data;
          
          if (type === 'semantic-search-result') {
            clearTimeout(timeout);
            worker.terminate();
            
            // Convert results to ImageRecord format
            const rankedImageIds = result.results.map((r: { imageId: number; score: number }) => r.imageId);
            resolve(rankedImageIds as any); // Will be converted by caller
          } else if (type === 'error') {
            clearTimeout(timeout);
            worker.terminate();
            reject(new Error(workerError));
          }
        };

        worker.onerror = (err) => {
          clearTimeout(timeout);
          worker.terminate();
          reject(err);
        };

        // Send semantic search request
        worker.postMessage({
          type: 'semantic-search',
          data: {
            query,
            imageEmbeddings: embeddings.map(([imageId, embedding]) => ({
              imageId,
              embedding,
            })),
          },
        });
      });
    } catch (err) {
      console.error('Semantic search error:', err);
      throw err;
    }
  }, []);

  const performSearch = useCallback(async (query: SearchQuery): Promise<ImageRecord[]> => {
    setIsSearching(true);
    setError(null);
    dispatch({ type: 'SET_IS_SEARCHING', payload: true });

    const startTime = performance.now();

    try {
      let results: ImageRecord[] = [];

      // Check if semantic search is requested
      if (query.semantic && query.text) {
        // Perform semantic search using CLIP embeddings
        const rankedIds = await performSemanticSearch(query.text);
        
        // For now, just return empty array as placeholder
        // In production, we'd fetch the full image records
        results = [];
      } else {
        // Perform regular tag-based search
        const filters: {
          text?: string;
          tags?: string[];
          dateStart?: string;
          dateEnd?: string;
          cameraModel?: string;
        } = {};

        if (query.text) {
          filters.text = query.text;
        }

        if (query.tags && query.tags.length > 0) {
          filters.tags = query.tags;
        }

        if (query.dateRange) {
          filters.dateStart = query.dateRange.start.toISOString();
          filters.dateEnd = query.dateRange.end.toISOString();
        }

        if (query.cameraModel) {
          filters.cameraModel = query.cameraModel;
        }

        // Perform search
        const rustResults = await searchImages(filters);

        // Convert Rust results to frontend ImageRecord format
        results = rustResults.map((rustImg: RustImageRecord) => ({
          id: rustImg.id,
          path: rustImg.path,
          thumbnailSmall: rustImg.thumbnail_small,
          thumbnailMedium: rustImg.thumbnail_medium,
          checksum: rustImg.checksum,
          metadata: {
            captureDate: rustImg.capture_date ? new Date(rustImg.capture_date) : undefined,
            cameraMake: rustImg.camera_make || undefined,
            cameraModel: rustImg.camera_model || undefined,
            gpsCoordinates:
              rustImg.gps_latitude !== null && rustImg.gps_longitude !== null
                ? {
                    latitude: rustImg.gps_latitude,
                    longitude: rustImg.gps_longitude,
                  }
                : undefined,
            dimensions: {
              width: rustImg.width,
              height: rustImg.height,
            },
            fileSize: rustImg.file_size,
            fileModified: new Date(rustImg.file_modified),
          },
          tags: [], // Tags will be loaded separately if needed
          syncStatus: rustImg.sync_status as 'pending' | 'synced' | 'failed',
          syncedAt: rustImg.synced_at ? new Date(rustImg.synced_at) : undefined,
        }));
      }

      const endTime = performance.now();
      const searchTimeMs = Math.round(endTime - startTime);
      setSearchTime(searchTimeMs);

      // Update state with results
      const resultIds = results.map((img) => img.id);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: resultIds });
      dispatch({ type: 'ADD_IMAGES', payload: results });

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return [];
    } finally {
      setIsSearching(false);
      dispatch({ type: 'SET_IS_SEARCHING', payload: false });
    }
  }, [dispatch, performSemanticSearch]);

  return {
    performSearch,
    isSearching,
    searchTime,
    error,
  };
}
