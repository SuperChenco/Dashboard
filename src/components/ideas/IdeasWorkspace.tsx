import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function IdeasWorkspace() {
  const { state, service } = useWorkflow();
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const unanalyzed = state.ideas.filter((idea) => !idea.analysis).length;

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-app-foreground/20 bg-app-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Zero-friction Capture</p>
            <p className="mt-1 text-xs text-app-subtle">
              Only original text is required. No automatic AI analysis.
            </p>
          </div>
          <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] text-app-muted-foreground">
            {unanalyzed} unanalyzed
          </span>
        </div>
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const result = service.createIdea(text);
            setFeedback(
              result.errors[0] ?? 'Idea saved locally without analysis.',
            );
            if (result.value) setText('');
          }}
        >
          <label className="sr-only" htmlFor="idea-capture">
            New Idea
          </label>
          <textarea
            id="idea-capture"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="现在想到什么？"
            className="w-full resize-none rounded-panel border border-app-border px-4 py-3 text-base leading-7 outline-none focus:border-slate-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-app-subtle">
              Source: Web · Local Mock
            </span>
            <button
              disabled={!text.trim()}
              className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white disabled:opacity-35"
            >
              Save Idea
            </button>
          </div>
        </form>
      </section>
      {feedback && <WorkflowNotice tone="success">{feedback}</WorkflowNotice>}
      <div className="space-y-3">
        {state.ideas.map((idea) => (
          <article
            key={idea.id}
            className="rounded-panel border border-app-border bg-app-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium leading-6">
                  {idea.originalText}
                </p>
                <p className="mt-2 text-xs text-app-subtle">
                  {new Date(idea.createdAt).toLocaleString('zh-CN')} ·{' '}
                  {idea.source} · {idea.status}
                </p>
              </div>
              {!idea.analysis && (
                <button
                  type="button"
                  onClick={() => service.analyzeIdea(idea.id)}
                  className="h-9 rounded-control border border-app-border px-3 text-sm"
                >
                  AI 分析
                </button>
              )}
            </div>
            {idea.analysis && (
              <div className="mt-4 rounded-control border border-app-border bg-app-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">
                    {idea.analysis.label} · Suggest {idea.analysis.suggestion}
                  </p>
                  {!idea.analysis.confirmedAt &&
                    idea.analysis.suggestion === 'task' && (
                      <button
                        type="button"
                        onClick={() => setConfirmId(idea.id)}
                        className="h-8 rounded-control bg-app-foreground px-3 text-xs font-medium text-white"
                      >
                        Review Conversion
                      </button>
                    )}
                </div>
                <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
                  {idea.analysis.reason}
                </p>
                <p className="mt-2 text-xs text-app-subtle">
                  Suggestion only · no mutation without CEO confirmation
                </p>
              </div>
            )}
            {idea.convertedEntityId && (
              <p className="mt-3 text-xs text-success-strong">
                Converted to Task · Source Idea preserved ·{' '}
                {idea.convertedEntityId}
              </p>
            )}
          </article>
        ))}
      </div>
      <Modal
        open={Boolean(confirmId)}
        title="Confirm Idea Conversion"
        description="Original Idea will remain. The new Task will retain a sourceIdeaId relation."
        onClose={() => setConfirmId(undefined)}
      >
        {confirmId && (
          <div className="mt-6">
            <WorkflowNotice tone="warning">
              Mock AI proposed a Task. This is the explicit CEO confirmation
              boundary.
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                Keep as Idea
              </button>
              <button
                type="button"
                onClick={() => {
                  const result = service.confirmIdeaTaskConversion(confirmId);
                  setFeedback(
                    result.errors[0] ??
                      'CEO confirmed conversion. Source preserved.',
                  );
                  if (result.value) setConfirmId(undefined);
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                CEO Confirm Conversion
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
