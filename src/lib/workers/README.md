# AI Classification Worker

This directory contains the web worker implementation for AI-powered image classification using Transformers.js.

## Overview

The AI classifier runs in a separate web worker thread to avoid blocking the UI during inference. It supports two models:
- **CLIP** (`Xenova/clip-vit-base-patch32`): For semantic search and zero-shot classification
- **MobileNet** (`Xenova/mobilenetv4_conv_small`): For faster standard image classification

## Usage

### Using the Hook

The easiest way to use the AI classifier is through the `useAIClassifier` hook:

```typescript
import { useAIClassifier } from '@/lib/hooks/useAIClassifier';

function MyComponent() {
  const { state, classify, clearQueue } = useAIClassifier({
    modelType: 'mobilenet',
    onResult: (result) => {
      console.log('Classification result:', result);
      // Save tags to database
    },
    onError: (error) => {
      console.error('Classification error:', error);
    },
  });

  // Check if model is loaded
  if (!state.modelLoaded) {
    return <div>Loading AI model...</div>;
  }

  // Classify an image
  const handleClassify = () => {
    classify({
      imageId: 123,
      thumbnailPath: '/path/to/thumbnail.jpg',
      priority: 'high', // or 'low'
    });
  };

  return (
    <div>
      <button onClick={handleClassify}>Classify Image</button>
      <p>Queue size: {state.queueSize}</p>
      <p>Processed: {state.processedCount}</p>
    </div>
  );
}
```

### Using the AIProcessingManager Component

For automatic background processing of all images:

```typescript
import { AIProcessingManager } from '@/components/AIProcessingManager';

function App() {
  const visibleImageIds = [1, 2, 3]; // IDs of images in viewport

  return (
    <div>
      {/* This component handles background AI processing */}
      <AIProcessingManager visibleImageIds={visibleImageIds} />
      
      {/* Your other components */}
    </div>
  );
}
```

### Displaying Processing Status

```typescript
import { AIProcessingStatus } from '@/components/AIProcessingStatus';

function Header() {
  return (
    <header>
      <h1>My Photo Gallery</h1>
      <AIProcessingStatus />
    </header>
  );
}
```

## Features

### Queue Management
- Maximum 2 concurrent inference operations to prevent memory exhaustion
- Priority queue: high-priority images (in viewport) are processed first
- Background processing for off-screen images

### Model Selection
- **CLIP**: Better for semantic search, natural language queries
- **MobileNet**: Faster inference, good for standard classification

### Error Handling
- Graceful error handling with detailed error messages
- Continues processing remaining images if one fails
- Errors are logged and reported via callback

## Architecture

```
┌─────────────────┐
│   Main Thread   │
│   (React UI)    │
└────────┬────────┘
         │
         │ postMessage
         ▼
┌─────────────────┐
│  Web Worker     │
│  (AI Inference) │
└────────┬────────┘
         │
         │ Transformers.js
         ▼
┌─────────────────┐
│  AI Model       │
│  (CLIP/MobileNet)│
└─────────────────┘
```

## Performance

- Model loading: ~2-5 seconds (one-time)
- Classification per image: ~100-500ms depending on model
- Memory usage: ~200-500MB for model + inference
- Queue limit: 2 concurrent operations

## Testing

Property-based tests validate:
- Classification output structure (Property 11)
- At least one tag with label and confidence
- Confidence scores in range [0, 1]
- Unique tags (no duplicates)

Unit tests validate:
- Web worker isolation (no UI blocking)
- Queue management (max 2 concurrent)
- Error handling
- Model initialization
