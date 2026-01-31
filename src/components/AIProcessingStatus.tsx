/**
 * AI Processing Status Component
 * Displays the current status of AI classification processing
 */

'use client';

import { useAppState } from '@/lib/store/AppContext';

export function AIProcessingStatus() {
  const state = useAppState();
  const { ai } = state;

  if (!ai.modelLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
        <span>Loading AI model...</span>
      </div>
    );
  }

  if (!ai.isProcessing && ai.processedCount === 0) {
    return null; // Don't show anything if not processing
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {ai.isProcessing && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          <span>Classifying images...</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-gray-700">
        <span>
          Processed: <strong>{ai.processedCount}</strong>
        </span>
        {ai.queueSize > 0 && (
          <span>
            Queue: <strong>{ai.queueSize}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
