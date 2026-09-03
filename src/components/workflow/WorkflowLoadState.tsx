interface WorkflowLoadStateProps {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function WorkflowLoadState({
  loading,
  error,
  onRetry,
}: WorkflowLoadStateProps) {
  return (
    <section
      className="rounded-panel border border-app-border bg-app-surface p-6"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-app-foreground">
        {loading ? '正在载入 CEO 工作区…' : '暂时无法载入工作区'}
      </p>
      {error && <p className="mt-2 text-sm text-danger-strong">{error}</p>}
      {!loading && onRetry && (
        <button type="button" className="task-action mt-4" onClick={onRetry}>
          重试
        </button>
      )}
    </section>
  );
}
