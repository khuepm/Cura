/**
 * Convert backend errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // File system errors
  if (errorMessage.includes('does not exist')) {
    return 'The selected file or folder could not be found. Please check the path and try again.';
  }

  if (errorMessage.includes('Permission denied') || errorMessage.includes('access')) {
    return 'Permission denied. Please check that you have access to this file or folder.';
  }

  if (errorMessage.includes('not a directory')) {
    return 'The selected path is not a folder. Please select a valid folder.';
  }

  // Image processing errors
  if (errorMessage.includes('Failed to decode image') || errorMessage.includes('Failed to open image')) {
    return 'Unable to process this image. The file may be corrupted or in an unsupported format.';
  }

  if (errorMessage.includes('HEIC format not yet supported')) {
    return 'HEIC format is not yet supported. Please convert the image to JPEG or PNG.';
  }

  if (errorMessage.includes('RAW format not yet supported')) {
    return 'RAW format is not yet supported. Please convert the image to JPEG or PNG.';
  }

  // Metadata errors
  if (errorMessage.includes('Failed to read file metadata')) {
    return 'Unable to read file information. The file may be inaccessible or corrupted.';
  }

  // Thumbnail errors
  if (errorMessage.includes('Failed to create cache directory')) {
    return 'Unable to create thumbnail cache directory. Please check disk space and permissions.';
  }

  if (errorMessage.includes('Failed to save thumbnail')) {
    return 'Unable to save thumbnail. Please check disk space and try again.';
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return 'Authentication failed. Please sign in again.';
  }

  // Generic fallback
  if (errorMessage.includes('Failed to')) {
    return errorMessage;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error to console in development mode
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * Handle error with logging and user-friendly message
 */
export function handleError(error: unknown, context?: string): string {
  logError(error, context);
  return getUserFriendlyError(error);
}
