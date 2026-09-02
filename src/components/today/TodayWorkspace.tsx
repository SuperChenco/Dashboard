import { useState } from 'react';

import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { recommendOneThing } from '@/domain/advisor';
import { waitingNeedsAttention } from '@/domain/tasks';
import type { YesterdayDecision } from '@/domain/today';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function TodayWorkspace() {
  const { state, service } = useWorkflow();
  const [feedback, setFeedback] = useState<string>();
  const date = new Date().toISOString().slice(0, 10);
  const plan =
    state.todayPlans.find((item) => item.date === date) ?? state.todayPlans[0];
  const primarySprint = state.sprints.find(
    (item) => item.kind === 'primary' && item.status === 'active',
  );
  const suggestion = recommendOneThing(state.tasks, primarySprint);
  const oneThing = state.tasks.find((task) => task.id === plan.oneThingTaskId);
  const keyTasks = plan.keyTaskIds
    .map((id) => state.tasks.find((task) => task.id === id))
    .filter(Boolean);
  const otherTasks = plan.otherTaskIds
    .map((id) => state.tasks.find((task) => task.id === id))
    .filter(Boolean);
  const available = state.tasks.filter(
    (task) =>
      !['done', 'cancelled'].includes(task.status) &&
      task.id !== plan.oneThingTaskId &&
      !plan.keyTaskIds.includes(task.id),
  );
  const attention = state.tasks.filter(
    (task) => task.status === 'blocked' || waitingNeedsAttention(task, date),
  );
  const unfinished = plan.unfinishedTaskIds
    .map((id) => state.tasks.find((task) => task.id === id))
    .filter(Boolean);

  const addKey = (taskId: string) => {
    const result = service.addTodayKeyTask(taskId);
    setFeedback(result?.errors?.[0] ?? 'Key Task added.');
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <WorkflowNotice
          tone={feedback.includes('at most') ? 'danger' : 'success'}
        >
          {feedback}
        </WorkflowNotice>
      )}
      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-panel border border-app-foreground/25 bg-app-surface p-5 sm:p-6 xl:col-span-7">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
            Today&apos;s One Thing
          </p>
          <h2 className="mt-3 text-xl font-semibold leading-8">
            {oneThing?.title ??
              suggestion?.recommendation ??
              'Choose the work that makes today strategically successful.'}
          </h2>
          {oneThing ? (
            <p className="mt-3 text-sm text-success-strong">
              CEO Confirmed · {oneThing.type}
            </p>
          ) : (
            suggestion && (
              <div className="mt-4">
                <WorkflowNotice>
                  <strong>AI Suggestion Preview</strong>
                  <br />
                  {suggestion.reason}
                </WorkflowNotice>
                <button
                  type="button"
                  onClick={() =>
                    suggestion.targetId &&
                    service.setTodayOneThing(suggestion.targetId)
                  }
                  className="mt-4 h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
                >
                  CEO Confirm One Thing
                </button>
              </div>
            )
          )}
          <div className="mt-5 border-t border-app-border pt-4">
            <label className="text-xs font-medium text-app-muted-foreground">
              Choose manually
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value)
                    service.setTodayOneThing(event.target.value);
                }}
                className="mt-2 h-10 w-full rounded-control border border-app-border bg-white px-3 text-sm"
              >
                <option value="">Select a Task…</option>
                {available.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
            Current Sprint
          </p>
          <h2 className="mt-3 text-lg font-semibold">
            {primarySprint?.title ?? 'No Primary Sprint'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
            {primarySprint?.primaryOutcome ??
              'Create a Primary Sprint to connect Today with strategy.'}
          </p>
          {primarySprint && (
            <>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-app-muted">
                <div
                  className="h-full rounded-full bg-app-foreground"
                  style={{ width: `${primarySprint.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-app-subtle">
                {primarySprint.progress}% · Golden Time{' '}
                {primarySprint.goldenTime}
              </p>
            </>
          )}
          <a
            href="/sprints"
            className="mt-4 inline-flex text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
          >
            Open Sprint
          </a>
        </section>
      </div>

      <section
        className="rounded-panel border border-warning/25 bg-warning-soft/50 p-5 sm:p-6"
        aria-labelledby="attention-heading"
      >
        <div className="flex items-center justify-between">
          <h2
            id="attention-heading"
            className="text-sm font-semibold text-warning-strong"
          >
            Attention
          </h2>
          <span className="text-xs text-warning-strong/70">
            Follow-ups and blockers
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {attention.map((task) => (
            <article
              key={task.id}
              className="rounded-control border border-warning/20 bg-white px-4 py-3"
            >
              <p className="text-sm font-medium">{task.title}</p>
              <p className="mt-1 text-xs leading-5 text-app-muted-foreground">
                {task.status === 'blocked'
                  ? task.blocker?.blocker
                  : `Waiting for ${task.waiting?.waitingFor} · follow-up ${task.waiting?.followUpAt}`}
              </p>
            </article>
          ))}
          {attention.length === 0 && (
            <p className="text-sm text-warning-strong">No urgent follow-up.</p>
          )}
        </div>
      </section>

      {unfinished.length > 0 && (
        <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold">Yesterday Follow-up</p>
            <p className="mt-1 text-xs text-app-subtle">
              Nothing rolls automatically. CEO decides each item.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {unfinished.map(
              (task) =>
                task && (
                  <article
                    key={task.id}
                    className="rounded-control border border-app-border p-4"
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.todayAssignmentCount > 1 && (
                      <p className="mt-1 text-xs text-warning-strong">
                        Repeated Carry · Planning Risk (
                        {task.todayAssignmentCount} assignments)
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ['continue', 'Continue Today'],
                          ['reschedule', 'Reschedule'],
                          ['pool', 'Return to Pool'],
                          ['cancel', 'Cancel'],
                        ] as [YesterdayDecision, string][]
                      ).map(([decision, label]) => (
                        <button
                          type="button"
                          key={decision}
                          onClick={() =>
                            service.resolveYesterday(task.id, decision)
                          }
                          className="task-action"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </article>
                ),
            )}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Key Tasks</h2>
              <p className="mt-1 text-xs text-app-subtle">Maximum 3</p>
            </div>
            <span className="text-xs text-app-subtle">
              {keyTasks.length} / 3
            </span>
          </div>
          <ul className="mt-4 divide-y divide-app-border">
            {keyTasks.map(
              (task) =>
                task && (
                  <li
                    key={task.id}
                    className="py-3 text-sm first:pt-0 last:pb-0"
                  >
                    {task.title}
                  </li>
                ),
            )}
            {keyTasks.length === 0 && (
              <li className="text-sm text-app-subtle">
                No Key Tasks confirmed.
              </li>
            )}
          </ul>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) addKey(event.target.value);
              event.target.value = '';
            }}
            className="mt-4 h-10 w-full rounded-control border border-app-border bg-white px-3 text-sm"
          >
            <option value="">Add Key Task…</option>
            {available.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </section>
        <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Other Tasks</h2>
          <p className="mt-1 text-xs text-app-subtle">
            Unlimited, intentionally lower visual weight.
          </p>
          <ul className="mt-4 divide-y divide-app-border text-sm text-app-muted-foreground">
            {otherTasks.map(
              (task) =>
                task && (
                  <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                    {task.title}
                  </li>
                ),
            )}
            {otherTasks.length === 0 && <li>No Other Tasks selected.</li>}
          </ul>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value)
                service.addTodayOtherTask(event.target.value);
              event.target.value = '';
            }}
            className="mt-4 h-10 w-full rounded-control border border-app-border bg-white px-3 text-sm"
          >
            <option value="">Add Other Task…</option>
            {available.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <a
            href="/tasks"
            className="mt-4 inline-flex text-xs font-medium underline decoration-app-border underline-offset-4"
          >
            Open Task Pool
          </a>
        </section>
      </div>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
          CEO Brief · Mock AI
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Brief
            label="Today's One Thing"
            value={oneThing?.title ?? 'Awaiting CEO confirmation'}
          />
          <Brief
            label="Attention"
            value={`${attention.length} item(s) require review`}
          />
          <Brief
            label="Strategic Signal"
            value={
              primarySprint ? 'Primary Sprint progressing' : 'No Primary Sprint'
            }
          />
          <Brief
            label="Decision Needed"
            value={`${state.tasks.filter((task) => task.status === 'blocked').length} blocker(s)`}
          />
        </dl>
      </section>
    </div>
  );
}

function Brief({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-app-subtle">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-6">{value}</dd>
    </div>
  );
}
