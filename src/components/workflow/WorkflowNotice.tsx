interface WorkflowNoticeProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

const tones = {
  neutral: 'border-app-border bg-app-muted text-app-muted-foreground',
  success: 'border-success/20 bg-success-soft text-success-strong',
  warning: 'border-warning/20 bg-warning-soft text-warning-strong',
  danger: 'border-danger/20 bg-danger-soft text-danger-strong',
};

export default function WorkflowNotice({
  tone = 'neutral',
  children,
}: WorkflowNoticeProps) {
  return (
    <div
      className={`rounded-control border px-3 py-2 text-sm leading-6 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
