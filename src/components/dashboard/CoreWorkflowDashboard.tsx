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
  const keyTasks = (plan?.keyTaskIds ?? [])
    .map((id) => state.tasks.find((task) => task.id === id))
    .filter(Boolean);
  const attention = state.tasks.filter(
    (task) => task.status === 'blocked' || waitingNeedsAttention(task, today),
  );
  const drift = detectStrategicDrift(
    state.goals,
    state.sprints,
    state.tasks,
    new Date(),
  );
  const focusRisk = getMaintenanceFocusRisk(state.sprints);
  const stagnant = state.goals.some((goal) => isGoalStagnant(goal, new Date()));
  const strategicWarning =
    drift?.reason ??
    focusRisk ??
    (stagnant ? '有 Goal 已超过 4 周没有有效进展。' : undefined);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <section className="rounded-panel border border-app-foreground/30 bg-app-surface p-5 sm:p-6 xl:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <p className="goal-label">
            {oneThing ? "Today's One Thing" : 'AI 推荐今日重点'}
          </p>
          <span className="rounded-badge border border-app-border bg-app-muted px-2 py-1 text-[11px] text-app-muted-foreground">
            {oneThing ? 'Confirmed' : 'Mock AI'}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-8">
          {oneThing?.title ??
            suggestion?.recommendation ??
            '暂时没有可推荐的任务'}
        </h2>
        {!oneThing && suggestion && (
          <>
            <p className="mt-3 text-sm leading-6 text-app-muted-foreground">
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
              设为今日重点
            </button>
          </>
        )}
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-5">
        <p className="goal-label">Current Primary Sprint</p>
        <h2 className="mt-3 text-lg font-semibold">
          {primarySprint?.title ?? 'No Primary Sprint'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
          {primarySprint?.primaryOutcome ??
            '为最重要的战略结果建立当前执行窗口。'}
        </p>
        {primarySprint && (
          <>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-app-muted"
              role="progressbar"
              aria-label="Current Sprint progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={primarySprint.progress}
            >
              <div
                className="h-full rounded-full bg-app-foreground"
                style={{ width: `${primarySprint.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-app-subtle">
              {primarySprint.progress}% · Golden Time{' '}
              {primarySprint.goldenTime ?? '未设置'}
            </p>
          </>
        )}
        <a
          href="/sprints"
          className="mt-4 inline-flex text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
        >
          查看 Sprint →
        </a>
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Key Tasks</h2>
          <a
            href="/today"
            className="text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
          >
            打开 Today →
          </a>
        </div>
        <ul className="mt-3 divide-y divide-app-border">
          {keyTasks.map(
            (task) =>
              task && (
                <li key={task.id} className="py-3 text-sm first:pt-0 last:pb-0">
                  {task.title}
                </li>
              ),
          )}
          {keyTasks.length === 0 && (
            <li className="py-2 text-sm text-app-subtle">
              今天还没有 Key Task。
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6 xl:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Attention</h2>
          <span className="text-xs text-app-subtle">{attention.length}</span>
        </div>
        <ul className="mt-3 divide-y divide-app-border">
          {attention.map((task) => (
            <li key={task.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="mt-1 text-xs text-app-subtle">
                {task.status === 'blocked'
                  ? `Blocked · ${task.blocker?.blocker}`
                  : `Waiting · 今天跟进 ${task.waiting?.waitingFor}`}
              </p>
            </li>
          ))}
          {attention.length === 0 && (
            <li className="py-2 text-sm text-app-subtle">
              当前没有需要立即关注的事项。
            </li>
          )}
        </ul>
      </section>

      <div className="xl:col-span-12">
        {strategicWarning ? (
          <WorkflowSignal warning={strategicWarning} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-app-border px-4 py-3 text-sm">
            <span>
              <span className="mr-2 text-success-strong">✓</span>
              <strong>Strategy aligned</strong>
              <span className="ml-2 text-app-muted-foreground">
                Today&apos;s work supports the Primary Sprint.
              </span>
            </span>
            <span className="text-[11px] text-app-subtle">Mock Insight</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowSignal({ warning }: { warning: string }) {
  return (
    <div className="rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning-strong">
      <strong>Strategic Signal</strong> · {warning}
      <span className="ml-2 text-[11px]">Mock Insight</span>
    </div>
  );
}
