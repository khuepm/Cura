/**
 * Reusable error message component
 */

interface ErrorMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  onDismiss,
}: ErrorMessageProps) {
  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-slide-up"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-red-600 dark:text-red-400 flex-shrink-0">
          error
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            {title}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
