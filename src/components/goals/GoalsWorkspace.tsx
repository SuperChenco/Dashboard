import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { isGoalStagnant } from '@/domain/goals';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function GoalsWorkspace() {
  const { state, service } = useWorkflow();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-app-border bg-app-surface p-5">
        <div>
          <p className="text-sm font-semibold">Strategic Results</p>
          <p className="mt-1 text-xs text-app-subtle">
            Result + Time/Review + Success Metrics + Why
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Create Goal
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
      <div className="grid gap-5 lg:grid-cols-2">
        {state.goals.map((goal) => {
          const gap =
            goal.suggestedProgress === undefined
              ? undefined
              : goal.progress - goal.suggestedProgress;
          return (
            <article
              key={goal.id}
              className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-app-subtle">
                    {goal.deadline
                      ? `Deadline ${goal.deadline}`
                      : `Review ${goal.nextReviewAt}`}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold leading-7">
                    {goal.title}
                  </h2>
                </div>
                <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] font-medium">
                  {goal.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-app-muted-foreground">
                {goal.why}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {goal.successMetrics.map((metric) => (
                  <li key={metric}>— {metric}</li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between text-xs text-app-muted-foreground">
                <span>CEO Progress {goal.progress}%</span>
                {gap !== undefined && (
                  <span>
                    AI Evidence {goal.suggestedProgress}% · Gap {gap}%
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-muted">
                <div
                  className="h-full rounded-full bg-app-foreground"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
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
          onSubmit={(form) => {
            const result = service.createGoal(form);
            setFeedback({ errors: result.errors, warnings: result.warnings });
            if (result.value) setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
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
