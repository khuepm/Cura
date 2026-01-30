/**
 * AI Processing Manager Component
 * Manages background AI classification of images
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { useAIClassifier } from '@/lib/hooks/useAIClassifier';
import { saveTags } from '@/lib/tauri/commands';
import type { ClassificationResult } from '@/lib/types';

interface AIProcessingManagerProps {
  /**
   * Images currently visible in the viewport (high priority)
   */
  visibleImageIds?: number[];
}

export function AIProcessingManager({ visibleImageIds = [] }: AIProcessingManagerProps) {
  const { state, dispatch } = useApp();
  const processedImagesRef = useRef<Set<number>>(new Set());
  const queuedImagesRef = useRef<Set<number>>(new Set());

  // Handle classification results
  const handleResult = useCallback(
    async (result: ClassificationResult) => {
      if (result.error) {
        console.error(`Classification error for image ${result.imageId}:`, result.error);
        return;
      }

      // Save tags to database
      try {
        const tagTuples: Array<[string, number]> = result.tags.map(tag => [
          tag.label,
          tag.confidence,
        ]);

        await saveTags(result.imageId, tagTuples);

        // Update image in state with new tags
        const image = state.images.items.get(result.imageId);
        if (image) {
          dispatch({
            type: 'UPDATE_IMAGE',
            payload: {
              ...image,
              tags: result.tags,
            },
          });
        }

        // Mark as processed
        processedImagesRef.current.add(result.imageId);
        queuedImagesRef.current.delete(result.imageId);
      } catch (error) {
        console.error(`Failed to save tags for image ${result.imageId}:`, error);
      }
    },
    [state.images.items, dispatch]
  );

  // Handle errors
  const handleError = useCallback((error: string) => {
    console.error('AI Classification error:', error);
  }, []);

  // Initialize AI classifier
  const { state: aiState, classify } = useAIClassifier({
    modelType: state.settings.aiModel,
    onResult: handleResult,
    onError: handleError,
  });

  // Update app state with AI processing state
  useEffect(() => {
    dispatch({ type: 'SET_AI_PROCESSING', payload: aiState.isProcessing });
    dispatch({ type: 'SET_AI_QUEUE_SIZE', payload: aiState.queueSize });
    dispatch({ type: 'SET_AI_PROCESSED_COUNT', payload: aiState.processedCount });
    dispatch({ type: 'SET_AI_MODEL_LOADED', payload: aiState.modelLoaded });
  }, [aiState, dispatch]);

  // Process visible images with high priority
  useEffect(() => {
    if (!aiState.modelLoaded) return;

    for (const imageId of visibleImageIds) {
      // Skip if already processed or queued
      if (processedImagesRef.current.has(imageId) || queuedImagesRef.current.has(imageId)) {
        continue;
      }

      const image = state.images.items.get(imageId);
      if (!image) continue;

      // Skip if image already has tags
      if (image.tags && image.tags.length > 0) {
        processedImagesRef.current.add(imageId);
        continue;
      }

      // Queue for classification with high priority
      queuedImagesRef.current.add(imageId);
      classify({
        imageId: image.id,
        thumbnailPath: image.thumbnailSmall,
        priority: 'high',
      });
    }
  }, [visibleImageIds, aiState.modelLoaded, state.images.items, classify]);

  // Process remaining images in background with low priority
  useEffect(() => {
    if (!aiState.modelLoaded) return;
    if (aiState.isProcessing && aiState.queueSize > 5) return; // Don't overwhelm the queue

    // Get all images that need processing
    const imagesToProcess = Array.from(state.images.items.values()).filter(
      image =>
        !processedImagesRef.current.has(image.id) &&
        !queuedImagesRef.current.has(image.id) &&
        (!image.tags || image.tags.length === 0)
    );

    // Process up to 10 images at a time
    const batch = imagesToProcess.slice(0, 10);

    for (const image of batch) {
      queuedImagesRef.current.add(image.id);
      classify({
        imageId: image.id,
        thumbnailPath: image.thumbnailSmall,
        priority: 'low',
      });
    }
  }, [aiState.modelLoaded, aiState.isProcessing, aiState.queueSize, state.images.items, classify]);

  // This component doesn't render anything
  return null;
}
