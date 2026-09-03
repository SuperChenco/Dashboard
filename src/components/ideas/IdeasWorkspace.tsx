import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function IdeasWorkspace() {
  const { state, service } = useWorkflow();
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [collapsedAnalysis, setCollapsedAnalysis] = useState<string[]>([]);
  const unanalyzed = state.ideas.filter((idea) => !idea.analysis).length;

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-app-foreground/20 bg-app-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">现在想到什么？</h2>
          <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] text-app-muted-foreground">
            {unanalyzed} 条待分析
          </span>
        </div>
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const result = service.createIdea(text);
            setFeedback(result.errors[0] ?? '想法已保存。');
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
            placeholder="写下此刻的想法…"
            className="w-full resize-none rounded-panel border border-app-border px-4 py-3 text-base leading-7 outline-none focus:border-slate-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              disabled={!text.trim()}
              className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white disabled:opacity-35"
            >
              保存
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
                  {new Date(idea.createdAt).toLocaleString('zh-CN')}
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
            {idea.analysis && !collapsedAnalysis.includes(idea.id) && (
              <div className="mt-4 rounded-control border border-app-border bg-app-muted/60 p-4">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-app-subtle uppercase">
                  Mock AI
                </p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-app-subtle">判断</dt>
                    <dd className="mt-1 font-medium">
                      {idea.analysis.suggestion === 'task'
                        ? '值得转为明确行动'
                        : '值得进一步验证'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-app-subtle">建议</dt>
                    <dd className="mt-1 font-medium">
                      {idea.analysis.suggestion === 'task'
                        ? '→ Convert to Task'
                        : '继续保留为 Idea'}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm leading-6 text-app-muted-foreground">
                  {idea.analysis.reason}
                </p>
                {!idea.analysis.confirmedAt && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {idea.analysis.suggestion === 'task' && (
                      <button
                        type="button"
                        onClick={() => setConfirmId(idea.id)}
                        className="h-8 rounded-control bg-app-foreground px-3 text-xs font-medium text-white"
                      >
                        创建 Task
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedAnalysis((items) => [...items, idea.id])
                      }
                      className="task-action"
                    >
                      继续保留
                    </button>
                  </div>
                )}
              </div>
            )}
            {idea.convertedEntityId && (
              <p className="mt-3 text-xs text-success-strong">
                已创建 Task · 原始 Idea 已保留
              </p>
            )}
          </article>
        ))}
      </div>
      <Modal
        open={Boolean(confirmId)}
        title="确认创建 Task"
        description="原始 Idea 会继续保留，新 Task 将记录来源关系。"
        onClose={() => setConfirmId(undefined)}
      >
        {confirmId && (
          <div className="mt-6">
            <WorkflowNotice tone="warning">
              Mock AI 建议将这条 Idea 转为可执行任务。确认前不会产生任何变更。
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                继续保留
              </button>
              <button
                type="button"
                onClick={() => {
                  const result = service.confirmIdeaTaskConversion(confirmId);
                  setFeedback(
                    result.errors[0] ?? 'Task 已创建，原始 Idea 已保留。',
                  );
                  if (result.value) setConfirmId(undefined);
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                确认创建 Task
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
