import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import {
  getMaintenanceFocusRisk,
  isSprintExpired,
  type SprintReviewDecision,
} from '@/domain/sprints';
import { useWorkflow } from '@/hooks/useWorkflow';

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-app-border bg-app-surface p-5">
        <div>
          <p className="text-sm font-semibold">Sprint Portfolio</p>
          <p className="mt-1 text-xs text-app-subtle">
            最多一个 Primary Sprint；Maintenance 推荐 0–2 个。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
        >
          Create Sprint
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
      <div className="grid gap-5 lg:grid-cols-2">
        {state.sprints.map((sprint) => (
          <article
            key={sprint.id}
            className={`rounded-panel border bg-app-surface p-5 sm:p-6 ${sprint.kind === 'primary' && sprint.status === 'active' ? 'border-app-foreground/35' : 'border-app-border'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
                  {sprint.kind} Sprint
                </p>
                <h2 className="mt-2 text-lg font-semibold">{sprint.title}</h2>
              </div>
              <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px]">
                {sprint.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-app-subtle">
              {sprint.startDate} → {sprint.endDate}
            </p>
            <div className="mt-5 border-l-2 border-app-foreground pl-4">
              <p className="text-xs font-semibold text-app-subtle uppercase">
                Primary Outcome
              </p>
              <p className="mt-1 text-sm font-medium leading-6">
                {sprint.primaryOutcome}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-app-muted-foreground">
              <span>{sprint.progress}% progress</span>
              <span>
                {sprint.primaryGoalId
                  ? 'Primary Goal linked'
                  : 'No Primary Goal'}
              </span>
            </div>
            {(sprint.status === 'review' || isSprintExpired(sprint, today)) && (
              <button
                type="button"
                onClick={() => setReviewId(sprint.id)}
                className="mt-5 h-9 rounded-control border border-warning/30 bg-warning-soft px-3 text-sm font-medium text-warning-strong"
              >
                Open Sprint Review
              </button>
            )}
          </article>
        ))}
      </div>

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
