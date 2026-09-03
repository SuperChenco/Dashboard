import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { isGoalStagnant } from '@/domain/goals';
import type { Goal } from '@/domain/workflow/types';
import { useWorkflow } from '@/hooks/useWorkflow';
import WorkflowLoadState from '@/components/workflow/WorkflowLoadState';

export default function GoalsWorkspace() {
  const { state, service, isLoading, error, refresh } = useWorkflow();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });
  if (isLoading && state.goals.length === 0)
    return <WorkflowLoadState loading />;
  if (error)
    return <WorkflowLoadState error={error} onRetry={() => void refresh()} />;
  const goalRows = buildGoalRows(state.goals);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          + New Goal
        </button>
      </div>
      {feedback.errors.map((error) => (
        <WorkflowNotice key={error} tone="danger">
          {error}
        </WorkflowNotice>
      ))}
      {feedback.warnings.map((warning) => (
        <WorkflowNotice key={warning} tone="warning">
          {warning}
        </WorkflowNotice>
      ))}
      <div className="space-y-4">
        {goalRows.length === 0 && (
          <p className="rounded-panel border border-dashed border-app-border px-5 py-8 text-sm text-app-subtle">
            还没有 Goal。先创建一个能改变结果的战略目标。
          </p>
        )}
        {goalRows.map(({ goal, depth }) => {
          const gap =
            goal.suggestedProgress === undefined
              ? undefined
              : goal.progress - goal.suggestedProgress;
          const hasMeaningfulGap = gap !== undefined && Math.abs(gap) >= 10;
          const activeSprint = state.sprints.find(
            (sprint) =>
              sprint.status === 'active' &&
              (sprint.primaryGoalId === goal.id ||
                sprint.secondaryGoalIds.includes(goal.id)),
          );
          return (
            <article
              key={goal.id}
              className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6"
              style={{ marginInlineStart: `${Math.min(depth - 1, 2) * 24}px` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {depth > 1 && (
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-app-subtle uppercase">
                      Level {depth} · Supporting Goal
                    </p>
                  )}
                  <h2 className="mt-2 text-lg font-semibold leading-7">
                    {goal.title}
                  </h2>
                </div>
                <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] font-medium">
                  {goal.status}
                </span>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
                <div>
                  <p className="goal-label">Why</p>
                  <p className="mt-1.5 text-sm leading-6 text-app-muted-foreground">
                    {goal.why}
                  </p>
                </div>
                <div>
                  <p className="goal-label">Success</p>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {goal.successMetrics.map((metric) => (
                      <li key={metric}>— {metric}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-app-border pt-4 sm:grid-cols-2">
                <div>
                  <p className="goal-label">Time</p>
                  <p className="mt-1.5 text-sm font-medium">
                    {goal.deadline
                      ? `Deadline · ${goal.deadline}`
                      : `Next Review · ${goal.nextReviewAt}`}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="goal-label">Progress</p>
                    <span className="text-xs font-medium">
                      {goal.progress}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-app-subtle">
                    Official CEO Progress
                    {gap !== undefined && !hasMeaningfulGap
                      ? ` · Evidence ${goal.suggestedProgress}%`
                      : ''}
                  </p>
                </div>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-app-muted"
                role="progressbar"
                aria-label={`${goal.title} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={goal.progress}
              >
                <div
                  className="h-full rounded-full bg-app-foreground"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {activeSprint && (
                <a
                  href="/sprints"
                  className="mt-4 inline-flex text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
                >
                  Current Sprint → {activeSprint.title}
                </a>
              )}
              {hasMeaningfulGap && (
                <div className="mt-4">
                  <WorkflowNotice tone="warning">
                    Progress Gap · CEO 进度 {goal.progress}%，证据进度{' '}
                    {goal.suggestedProgress}%。建议在下次 Review 核对。
                  </WorkflowNotice>
                </div>
              )}
              {isGoalStagnant(goal, new Date()) && (
                <div className="mt-4">
                  <WorkflowNotice tone="warning">
                    Goal Review：4 周没有有效进展。Continue / Adjust / Downgrade
                    / Pause / Abandon 需要 CEO 决定。
                  </WorkflowNotice>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Modal
        open={open}
        title="Create Strategic Goal"
        description="Goal 是战略结果，不是普通 Todo。"
        onClose={() => setOpen(false)}
      >
        <GoalForm
          goals={state.goals}
          onSubmit={async (form) => {
            const result = await service
              .createGoal(form)
              .catch(() => undefined);
            if (!result) return;
            setFeedback({ errors: result.errors, warnings: result.warnings });
            if (result.value) setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function buildGoalRows(goals: Goal[]) {
  const rows: { goal: Goal; depth: number }[] = [];
  const visit = (parentGoalId: string | undefined, depth: number) => {
    goals
      .filter((goal) => goal.parentGoalId === parentGoalId)
      .forEach((goal) => {
        rows.push({ goal, depth });
        if (depth < 3) visit(goal.id, depth + 1);
      });
  };
  visit(undefined, 1);
  goals
    .filter((goal) => !rows.some((row) => row.goal.id === goal.id))
    .forEach((goal) => rows.push({ goal, depth: 1 }));
  return rows;
}

function GoalForm({
  goals,
  onSubmit,
}: {
  goals: { id: string; title: string }[];
  onSubmit: (value: {
    title: string;
    description: string;
    why: string;
    successMetrics: string[];
    deadline?: string;
    nextReviewAt?: string;
    parentGoalId?: string;
    companyIds: string[];
  }) => void;
}) {
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
          title: String(data.get('title') ?? ''),
          description: String(data.get('description') ?? ''),
          why: String(data.get('why') ?? ''),
          successMetrics: String(data.get('metrics') ?? '').split('\n'),
          deadline: String(data.get('deadline') || '') || undefined,
          nextReviewAt: String(data.get('review') || '') || undefined,
          parentGoalId: String(data.get('parent') || '') || undefined,
          companyIds: data.getAll('companies').map(String),
        });
      }}
    >
      <Field
        label="Result"
        name="title"
        required
        placeholder="FindingMat 获得第一批稳定建筑师用户"
      />
      <Field
        label="Why"
        name="why"
        required
        placeholder="为什么这个结果值得投入？"
      />
      <label className="block text-sm font-medium">
        Success Metrics
        <textarea
          name="metrics"
          required
          rows={3}
          className="mt-1.5 w-full rounded-control border border-app-border px-3 py-2 outline-none focus:border-slate-500"
          placeholder={'持续使用建筑师 ≥ 100\n30 日留存率 ≥ 30%'}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deadline (optional)" name="deadline" type="date" />
        <Field
          label="Next Review (required if no deadline)"
          name="review"
          type="date"
        />
      </div>
      <label className="block text-sm font-medium">
        Parent Goal
        <select
          name="parent"
          className="mt-1.5 w-full rounded-control border border-app-border bg-white px-3 py-2"
        >
          <option value="">None</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium">
          Companies (optional, multiple)
        </legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[
            ['company-findingmat', 'FindingMat'],
            ['company-yaozhiyan', '曜之岩'],
            ['company-changle', '长乐防火'],
          ].map(([id, label]) => (
            <label key={id} className="flex items-center gap-2">
              <input type="checkbox" name="companies" value={id} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <button
          type="submit"
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
        >
          Save Goal
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = 'text',
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-control border border-app-border px-3 outline-none focus:border-slate-500"
      />
    </label>
  );
}
