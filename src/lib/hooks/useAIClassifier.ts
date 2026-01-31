/**
 * Hook for managing AI classification worker
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ClassificationRequest, ClassificationResult, AIProcessingState } from '../types';

interface UseAIClassifierOptions {
  modelType: 'clip' | 'mobilenet';
  onResult?: (result: ClassificationResult) => void;
  onError?: (error: string) => void;
}

export function useAIClassifier(options: UseAIClassifierOptions) {
  const { modelType, onResult, onError } = options;
  
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<AIProcessingState>({
    isProcessing: false,
    queueSize: 0,
    processedCount: 0,
    modelLoaded: false,
  });

  // Initialize worker
  useEffect(() => {
    // Create worker
    const worker = new Worker(
      new URL('../workers/aiClassifier.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent) => {
      const { type, result, error, queueSize, activeProcessing, modelType: loadedModel } = event.data;

      switch (type) {
        case 'model-loaded':
          setState(prev => ({ ...prev, modelLoaded: true }));
          break;

        case 'classification-result':
          setState(prev => ({
            ...prev,
            processedCount: prev.processedCount + 1,
            isProcessing: queueSize > 0 || activeProcessing > 0,
          }));
          
          if (onResult) {
            onResult(result);
          }
          break;

        case 'queue-status':
          setState(prev => ({
            ...prev,
            queueSize,
            isProcessing: queueSize > 0 || activeProcessing > 0,
          }));
          break;

        case 'error':
          if (onError) {
            onError(error);
          }
          break;
      }
    };

    worker.onerror = (error) => {
      if (onError) {
        onError(error.message);
      }
    };

    // Initialize model
    worker.postMessage({ type: 'initialize', data: { modelType } });

    // Cleanup
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [modelType, onResult, onError]);

  // Classify an image
  const classify = useCallback((request: Omit<ClassificationRequest, 'modelType'>) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    workerRef.current.postMessage({
      type: 'classify',
      data: {
        ...request,
        modelType,
      },
    });
  }, [modelType]);

  // Clear the processing queue
  const clearQueue = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'clear-queue' });
  }, []);

  return {
    state,
    classify,
    clearQueue,
  };
}
