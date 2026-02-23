/**
 * Web Worker for AI Image Classification
 * Runs Transformers.js models in a separate thread to avoid blocking the UI
 */

import { pipeline } from '@xenova/transformers';
import type { ClassificationRequest, ClassificationResult } from '../types';

// Worker state
let model: any = null;
let modelType: 'clip' | 'mobilenet' | null = null;
let isInitializing = false;
let processingQueue: ClassificationRequest[] = [];
let activeProcessing = 0;
const MAX_CONCURRENT = 2;

// Semantic search types
export interface SemanticSearchRequest {
  query: string;
  imageEmbeddings: Array<{ imageId: number; embedding: number[] }>;
}

export interface SemanticSearchResult {
  results: Array<{ imageId: number; score: number }>;
}

export interface ComputeEmbeddingRequest {
  imageId: number;
  thumbnailPath: string;
}

export interface ComputeEmbeddingResult {
  imageId: number;
  embedding: number[];
  error?: string;
}

/**
 * Initialize the AI model
 */
async function initializeModel(type: 'clip' | 'mobilenet'): Promise<void> {
  if (model && modelType === type) {
    return; // Already initialized with correct model
  }

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isInitializing = true;
  
  try {
    if (type === 'clip') {
      // Load CLIP model for semantic search and classification
      model = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
    } else {
      // Load MobileNet for faster classification
      model = await pipeline('image-classification', 'Xenova/mobilenetv4_conv_small');
    }
    
    modelType = type;
    postMessage({ type: 'model-loaded', modelType: type });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postMessage({ type: 'error', error: `Failed to load model: ${errorMessage}` });
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Classify an image using the loaded model
 */
async function classifyImage(request: ClassificationRequest): Promise<ClassificationResult> {
  try {
    // Ensure model is initialized
    if (!model || modelType !== request.modelType) {
      await initializeModel(request.modelType);
    }

    if (!model) {
      throw new Error('Model not initialized');
    }

    // Load image from file path
    // Note: In a real implementation, we'd need to convert the file path to a URL
    // that the worker can access. For now, we'll assume the thumbnailPath is accessible
    const imageUrl = `file://${request.thumbnailPath}`;

    let tags: Array<{ label: string; confidence: number }> = [];

    if (request.modelType === 'clip') {
      // For CLIP, we use zero-shot classification with common categories
      const categories = [
        'person', 'people', 'portrait', 'selfie',
        'landscape', 'nature', 'mountain', 'beach', 'ocean', 'forest',
        'city', 'building', 'architecture', 'street',
        'animal', 'cat', 'dog', 'bird',
        'food', 'meal', 'restaurant',
        'car', 'vehicle', 'transportation',
        'indoor', 'outdoor',
        'sunset', 'sunrise', 'night', 'day',
        'flower', 'plant', 'tree',
        'water', 'sky', 'cloud'
      ];

      const result = await model(imageUrl, categories);
      
      // Filter results with confidence > 0.3 and take top 5
      tags = (result as Array<{ label: string; score: number }>)
        .filter(r => r.score > 0.3)
        .slice(0, 5)
        .map(r => ({ label: r.label, confidence: r.score }));
    } else {
      // For MobileNet, use standard image classification
      const result = await model(imageUrl);
      
      // Take top 5 predictions with confidence > 0.3
      tags = (result as Array<{ label: string; score: number }>)
        .filter(r => r.score > 0.3)
        .slice(0, 5)
        .map(r => ({ label: r.label, confidence: r.score }));
    }

    return {
      imageId: request.imageId,
      tags,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      imageId: request.imageId,
      tags: [],
      error: `Classification failed: ${errorMessage}`,
    };
  }
}

/**
 * Process the next item in the queue
 */
async function processQueue(): Promise<void> {
  while (processingQueue.length > 0 && activeProcessing < MAX_CONCURRENT) {
    const request = processingQueue.shift();
    if (!request) continue;

    activeProcessing++;
    
    try {
      const result = await classifyImage(request);
      postMessage({ type: 'classification-result', result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      postMessage({
        type: 'classification-result',
        result: {
          imageId: request.imageId,
          tags: [],
          error: errorMessage,
        },
      });
    } finally {
      activeProcessing--;
      
      // Update queue status
      postMessage({
        type: 'queue-status',
        queueSize: processingQueue.length,
        activeProcessing,
      });
    }
  }
}

/**
 * Handle messages from the main thread
 */
self.onmessage = async (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'initialize':
      try {
        await initializeModel(data.modelType);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        postMessage({ type: 'error', error: errorMessage });
      }
      break;

    case 'classify':
      // Add to queue based on priority
      const request = data as ClassificationRequest;
      if (request.priority === 'high') {
        processingQueue.unshift(request); // Add to front of queue
      } else {
        processingQueue.push(request); // Add to back of queue
      }
      
      postMessage({
        type: 'queue-status',
        queueSize: processingQueue.length,
        activeProcessing,
      });
      
      // Start processing
      processQueue();
      break;

    case 'compute-embedding':
      try {
        const embeddingRequest = data as ComputeEmbeddingRequest;
        const result = await computeImageEmbedding(embeddingRequest);
        postMessage({ type: 'embedding-result', result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        postMessage({
          type: 'embedding-result',
          result: {
            imageId: data.imageId,
            embedding: [],
            error: errorMessage,
          },
        });
      }
      break;

    case 'semantic-search':
      try {
        const searchRequest = data as SemanticSearchRequest;
        const result = await performSemanticSearch(searchRequest);
        postMessage({ type: 'semantic-search-result', result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        postMessage({ type: 'error', error: errorMessage });
      }
      break;

    case 'clear-queue':
      processingQueue = [];
      postMessage({
        type: 'queue-status',
        queueSize: 0,
        activeProcessing,
      });
      break;

    default:
      postMessage({ type: 'error', error: `Unknown message type: ${type}` });
  }
};

/**
 * Compute embedding for an image (CLIP only)
 */
async function computeImageEmbedding(request: ComputeEmbeddingRequest): Promise<ComputeEmbeddingResult> {
  try {
    // Ensure CLIP model is loaded
    if (!model || modelType !== 'clip') {
      await initializeModel('clip');
    }

    if (!model) {
      throw new Error('CLIP model not initialized');
    }

    // In a real implementation, we would use CLIP's image encoder
    // For now, we'll return a placeholder
    // TODO: Implement actual CLIP image embedding extraction
    const imageUrl = `file://${request.thumbnailPath}`;
    
    // Placeholder: return random embedding
    // In production, use: const embedding = await model.encode_image(imageUrl);
    const embedding = Array.from({ length: 512 }, () => Math.random());

    return {
      imageId: request.imageId,
      embedding,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      imageId: request.imageId,
      embedding: [],
      error: `Failed to compute embedding: ${errorMessage}`,
    };
  }
}

/**
 * Perform semantic search using CLIP embeddings
 */
async function performSemanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResult> {
  try {
    // Ensure CLIP model is loaded
    if (!model || modelType !== 'clip') {
      await initializeModel('clip');
    }

    if (!model) {
      throw new Error('CLIP model not initialized');
    }

    // Compute query embedding
    // In a real implementation: const queryEmbedding = await model.encode_text(request.query);
    // For now, use placeholder
    const queryEmbedding = Array.from({ length: 512 }, () => Math.random());

    // Compute cosine similarity with each image embedding
    const results = request.imageEmbeddings.map(({ imageId, embedding }) => {
      const score = cosineSimilarity(queryEmbedding, embedding);
      return { imageId, score };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return { results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Semantic search failed: ${errorMessage}`);
  }
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Export empty object to make this a module
export {};
