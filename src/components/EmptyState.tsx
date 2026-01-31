/**
 * Reusable empty state component
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon = 'image_not_supported',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
