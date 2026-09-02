import { detectStrategicDrift, recommendOneThing } from '@/domain/advisor';
import { isGoalStagnant } from '@/domain/goals';
import { getMaintenanceFocusRisk } from '@/domain/sprints';
import { waitingNeedsAttention } from '@/domain/tasks';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function CoreWorkflowDashboard() {
  const { state, service } = useWorkflow();
  const today = new Date().toISOString().slice(0, 10);
  const plan =
    state.todayPlans.find((item) => item.date === today) ?? state.todayPlans[0];
  const primarySprint = state.sprints.find(
    (item) => item.kind === 'primary' && item.status === 'active',
  );
  const oneThing = state.tasks.find((task) => task.id === plan?.oneThingTaskId);
  const suggestion = recommendOneThing(state.tasks, primarySprint);
  const attention = state.tasks.filter(
    (task) => task.status === 'blocked' || waitingNeedsAttention(task, today),
  );
  const focusRisk = getMaintenanceFocusRisk(state.sprints);
  const drift = detectStrategicDrift(
    state.goals,
    state.sprints,
    state.tasks,
    new Date(),
  );
  const stagnant = state.goals.filter((goal) =>
    isGoalStagnant(goal, new Date()),
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <section
        className="rounded-panel border border-app-foreground/20 bg-app-surface p-5 sm:p-6 xl:col-span-8"
        aria-labelledby="current-sprint-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
              Current Primary Sprint
            </p>
            <h2
              id="current-sprint-title"
              className="mt-2 text-xl font-semibold tracking-tight"
            >
              {primarySprint?.title ?? 'No Primary Sprint'}
            </h2>
            {primarySprint && (
              <p className="mt-1 text-sm text-app-muted-foreground">
                {primarySprint.startDate} → {primarySprint.endDate}
              </p>
            )}
          </div>
          <a
            href="/sprints"
            className="text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
          >
            Manage Sprint
          </a>
        </div>
        {primarySprint ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold tracking-wide text-app-subtle uppercase">
                Primary Outcome
              </p>
              <p className="mt-2 text-base font-medium leading-7">
                {primarySprint.primaryOutcome}
              </p>
              <div
                className="mt-5 h-1.5 overflow-hidden rounded-full bg-app-muted"
                role="progressbar"
                aria-label="Sprint progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={primarySprint.progress}
              >
                <div
                  className="h-full rounded-full bg-app-foreground"
                  style={{ width: `${primarySprint.progress}%` }}
                />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:block sm:min-w-36 sm:border-l sm:border-app-border sm:pl-5">
              <div>
                <dt className="text-xs text-app-subtle">Progress</dt>
                <dd className="mt-1 font-semibold">
                  {primarySprint.progress}%
                </dd>
              </div>
              <div className="sm:mt-4">
                <dt className="text-xs text-app-subtle">Golden Time</dt>
                <dd className="mt-1 font-semibold">
                  {primarySprint.goldenTime ?? 'Not set'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-5 text-sm text-warning-strong">
            建立 Primary Sprint，把战略结果带入当前执行窗口。
          </p>
        )}
      </section>

      <section
        className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-4"
        aria-labelledby="one-thing-title"
      >
        <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
          Today&apos;s One Thing
        </p>
        <h2
          id="one-thing-title"
          className="mt-3 text-lg font-semibold leading-7"
        >
          {oneThing?.title ??
            suggestion?.recommendation ??
            'No recommendation available'}
        </h2>
        {!oneThing && suggestion && (
          <>
            <p className="mt-3 text-sm leading-6 text-app-muted-foreground">
              <span className="font-semibold text-app-foreground">
                AI Suggestion Preview.
              </span>{' '}
              {suggestion.reason}
            </p>
            <button
              type="button"
              onClick={() =>
                suggestion.targetId &&
                service.setTodayOneThing(suggestion.targetId)
              }
              className="mt-5 h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground"
            >
              CEO Confirm
            </button>
          </>
        )}
        {oneThing && (
          <p className="mt-3 text-sm text-success-strong">
            CEO confirmed ·{' '}
            {oneThing.estimatedMinutes
              ? `${oneThing.estimatedMinutes} min`
              : 'No estimate'}
          </p>
        )}
      </section>

      <section
        className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-7"
        aria-labelledby="attention-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="attention-title" className="text-sm font-semibold">
            Attention
          </h2>
          <span className="text-xs text-app-subtle">
            {attention.length} items
          </span>
        </div>
        <ul className="mt-4 divide-y divide-app-border">
          {attention.map((task) => (
            <li key={task.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-app-subtle">
                    {task.status === 'blocked'
                      ? task.blocker?.blocker
                      : `Follow up ${task.waiting?.followUpAt}`}
                  </p>
                </div>
                <span className="rounded-badge border border-warning/20 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-strong">
                  {task.status}
                </span>
              </div>
            </li>
          ))}
          {attention.length === 0 && (
            <li className="text-sm text-app-subtle">
              No immediate attention items.
            </li>
          )}
        </ul>
        <a
          href="/today"
          className="mt-5 inline-flex text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
        >
          Open Today Command Surface
        </a>
      </section>

      <section
        className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-5"
        aria-labelledby="signal-title"
      >
        <p className="text-[10px] font-semibold tracking-[0.14em] text-app-subtle uppercase">
          Strategic Signal
        </p>
        <h2 id="signal-title" className="mt-3 text-base font-semibold">
          {drift
            ? 'Strategic Drift Warning'
            : stagnant.length
              ? 'Goal Review Required'
              : 'Strategy is supported'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
          {drift?.reason ??
            (stagnant.length
              ? `${stagnant.length} Goal has not progressed for 4 weeks.`
              : 'Primary Sprint and Strategic Tasks are currently connected.')}
        </p>
        {focusRisk && (
          <p className="mt-3 rounded-control bg-warning-soft px-3 py-2 text-sm text-warning-strong">
            {focusRisk}
          </p>
        )}
        <span className="mt-4 inline-flex rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] font-medium text-app-muted-foreground">
          Deterministic · Mock AI
        </span>
      </section>
    </div>
  );
}
