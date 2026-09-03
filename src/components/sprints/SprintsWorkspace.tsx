import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import {
  formatDateRange,
  getSprintTiming,
} from '@/components/workflow/presentation';
import {
  getMaintenanceFocusRisk,
  isSprintExpired,
  type SprintReviewDecision,
} from '@/domain/sprints';
import { useWorkflow } from '@/hooks/useWorkflow';
import type { Sprint } from '@/domain/workflow/types';

export default function SprintsWorkspace() {
  const { state, service } = useWorkflow();
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string>();
  const [feedback, setFeedback] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });
  const focusRisk = getMaintenanceFocusRisk(state.sprints);
  const today = new Date().toISOString().slice(0, 10);
  const primary = state.sprints.find(
    (sprint) => sprint.kind === 'primary' && sprint.status === 'active',
  );
  const needsReview = state.sprints.filter(
    (sprint) => sprint.status === 'review' || isSprintExpired(sprint, today),
  );
  const maintenance = state.sprints.filter(
    (sprint) =>
      sprint.kind === 'maintenance' &&
      sprint.status !== 'review' &&
      !isSprintExpired(sprint, today),
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
        >
          + New Sprint
        </button>
      </div>
      {focusRisk && (
        <WorkflowNotice tone="warning">Focus Risk · {focusRisk}</WorkflowNotice>
      )}
      {feedback.errors.map((item) => (
        <WorkflowNotice key={item} tone="danger">
          {item}
        </WorkflowNotice>
      ))}
      {feedback.warnings.map((item) => (
        <WorkflowNotice key={item} tone="warning">
          {item}
        </WorkflowNotice>
      ))}
      {primary ? (
        <PrimarySprintCard
          sprint={primary}
          today={today}
          goalTitle={
            state.goals.find((goal) => goal.id === primary.primaryGoalId)?.title
          }
        />
      ) : (
        <WorkflowNotice tone="warning">
          当前没有 Primary Sprint。请为最重要的战略结果建立执行窗口。
        </WorkflowNotice>
      )}

      {maintenance.length > 0 && (
        <section aria-labelledby="maintenance-heading">
          <h2
            id="maintenance-heading"
            className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase"
          >
            Maintenance
          </h2>
          <div className="space-y-2">
            {maintenance.map((sprint) => (
              <SprintCompactRow
                key={sprint.id}
                sprint={sprint}
                goalTitle={
                  state.goals.find((goal) => goal.id === sprint.primaryGoalId)
                    ?.title
                }
              />
            ))}
          </div>
        </section>
      )}

      {needsReview.length > 0 && (
        <section aria-labelledby="review-heading">
          <h2
            id="review-heading"
            className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-warning-strong uppercase"
          >
            Needs Review
          </h2>
          <div className="space-y-2">
            {needsReview.map((sprint) => (
              <SprintCompactRow
                key={sprint.id}
                sprint={sprint}
                goalTitle={
                  state.goals.find((goal) => goal.id === sprint.primaryGoalId)
                    ?.title
                }
                onReview={() => setReviewId(sprint.id)}
              />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={createOpen}
        title="Create Sprint"
        description="Sprint success is defined by its Primary Outcome, not Task count."
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const result = service.createSprint({
              title: String(data.get('title') ?? ''),
              kind: String(data.get('kind')) as 'primary' | 'maintenance',
              primaryGoalId: String(data.get('goal') || '') || undefined,
              secondaryGoalIds: data.getAll('secondaryGoals').map(String),
              primaryOutcome: String(data.get('outcome') ?? ''),
              startDate: String(data.get('start') ?? ''),
              endDate: String(data.get('end') ?? ''),
              goldenTime: String(data.get('golden') || '') || undefined,
            });
            setFeedback({ errors: result.errors, warnings: result.warnings });
            if (result.value) setCreateOpen(false);
          }}
        >
          <Field label="Sprint title" name="title" required />
          <label className="block text-sm font-medium">
            Kind
            <select
              name="kind"
              className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
            >
              <option value="primary">Primary</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Primary Goal
            <select
              name="goal"
              className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
            >
              <option value="">No Goal (warning)</option>
              {state.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-medium">
              Secondary Goals (optional)
            </legend>
            <div className="mt-2 space-y-2">
              {state.goals.map((goal) => (
                <label
                  key={goal.id}
                  className="flex items-start gap-2 text-sm text-app-muted-foreground"
                >
                  <input
                    type="checkbox"
                    name="secondaryGoals"
                    value={goal.id}
                    className="mt-1"
                  />
                  <span>{goal.title}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Primary Outcome" name="outcome" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start" name="start" type="date" required />
            <Field label="End" name="end" type="date" required />
          </div>
          <Field
            label="Golden Time (optional)"
            name="golden"
            placeholder="08:00–10:00"
          />
          <div className="flex justify-end">
            <button className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white">
              Save and Activate
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewId)}
        title="Sprint Review"
        description="Sprint never extends automatically. The CEO chooses the outcome."
        onClose={() => setReviewId(undefined)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const decision = String(
              data.get('decision'),
            ) as SprintReviewDecision;
            const result = service.reviewSprint(
              reviewId!,
              decision,
              String(data.get('reason') || '') || undefined,
              String(data.get('end') || '') || undefined,
            );
            setFeedback({ errors: result.errors, warnings: result.warnings });
            if (result.value) setReviewId(undefined);
          }}
        >
          <label className="block text-sm font-medium">
            Decision
            <select
              name="decision"
              className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
            >
              <option value="complete">Complete</option>
              <option value="extend">Extend</option>
              <option value="carry-forward">Carry Forward</option>
              <option value="close-incomplete">Close Incomplete</option>
            </select>
          </label>
          <Field
            label="Reason (required for Extend / Close Incomplete)"
            name="reason"
          />
          <Field label="New end date (Extend only)" name="end" type="date" />
          <WorkflowNotice>
            Carry Forward closes this Sprint normally, creates a new linked
            Sprint, and preserves the source history.
          </WorkflowNotice>
          <div className="flex justify-end">
            <button className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white">
              Confirm Review Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PrimarySprintCard({
  sprint,
  today,
  goalTitle,
}: {
  sprint: Sprint;
  today: string;
  goalTitle?: string;
}) {
  const timing = getSprintTiming(sprint, today);
  return (
    <section className="rounded-panel border border-app-foreground/30 bg-app-surface p-5 sm:p-7">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
        Current Primary
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {sprint.title}
          </h2>
          <p className="mt-2 text-sm text-app-muted-foreground">
            {formatDateRange(sprint.startDate, sprint.endDate)} · Day{' '}
            {timing.day} / {timing.totalDays}
          </p>
        </div>
        <span className="text-sm font-semibold">{sprint.progress}%</span>
      </div>
      <div className="mt-6 border-l-2 border-app-foreground pl-4">
        <p className="goal-label">Primary Outcome</p>
        <p className="mt-2 text-base font-medium leading-7">
          {sprint.primaryOutcome}
        </p>
      </div>
      <div
        className="mt-6 h-1.5 overflow-hidden rounded-full bg-app-muted"
        role="progressbar"
        aria-label={`${sprint.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sprint.progress}
      >
        <div
          className="h-full rounded-full bg-app-foreground"
          style={{ width: `${sprint.progress}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-app-muted-foreground">
        <span>
          {timing.remainingDays > 0
            ? `${timing.remainingDays} days remaining`
            : '最后一天'}
        </span>
        {sprint.goldenTime && <span>Golden Time · {sprint.goldenTime}</span>}
        {goalTitle ? (
          <a href="/goals" className="font-medium underline underline-offset-4">
            Goal · {goalTitle} →
          </a>
        ) : (
          <span>No Goal</span>
        )}
      </div>
    </section>
  );
}

function SprintCompactRow({
  sprint,
  goalTitle,
  onReview,
}: {
  sprint: Sprint;
  goalTitle?: string;
  onReview?: () => void;
}) {
  return (
    <article className="rounded-control border border-app-border bg-app-surface px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{sprint.title}</h3>
            <span className="text-xs text-app-subtle">
              {formatDateRange(sprint.startDate, sprint.endDate)}
            </span>
          </div>
          <p className="mt-1 text-sm text-app-muted-foreground">
            {sprint.primaryOutcome}
          </p>
          <p className="mt-1 text-xs text-app-subtle">
            {sprint.progress}% · {goalTitle ? `Goal · ${goalTitle}` : 'No Goal'}
          </p>
        </div>
        {onReview && (
          <button
            type="button"
            onClick={onReview}
            className="h-8 rounded-control border border-warning/30 bg-warning-soft px-3 text-xs font-medium text-warning-strong"
          >
            Review
          </button>
        )}
      </div>
    </article>
  );
}

function Field({
  label,
  name,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1.5 h-10 w-full rounded-control border border-app-border px-3 outline-none focus:border-slate-500"
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </label>
  );
}
