import { useState } from 'react';

import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import {
  formatDateRange,
  getSprintTiming,
} from '@/components/workflow/presentation';
import { detectStrategicDrift, recommendOneThing } from '@/domain/advisor';
import { isGoalStagnant } from '@/domain/goals';
import { getMaintenanceFocusRisk } from '@/domain/sprints';
import { waitingNeedsAttention } from '@/domain/tasks';
import type { YesterdayDecision } from '@/domain/today';
import { useWorkflow } from '@/hooks/useWorkflow';
import WorkflowLoadState from '@/components/workflow/WorkflowLoadState';
import type { TodayPlan } from '@/domain/workflow/types';

export default function TodayWorkspace() {
  const { state, service, isLoading, error, refresh } = useWorkflow();
  const [feedback, setFeedback] = useState<string>();
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  if (isLoading && state.tasks.length === 0)
    return <WorkflowLoadState loading />;
  if (error)
    return <WorkflowLoadState error={error} onRetry={() => void refresh()} />;
  const date = new Date().toISOString().slice(0, 10);
  const plan: TodayPlan = state.todayPlans.find(
    (item) => item.date === date,
  ) ?? {
    id: `today-${date}`,
    date,
    keyTaskIds: [],
    otherTaskIds: [],
    unfinishedTaskIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const primarySprint = state.sprints.find(
    (item) => item.kind === 'primary' && item.status === 'active',
  );
  const primaryGoal = state.goals.find(
    (goal) => goal.id === primarySprint?.primaryGoalId,
  );
  const baseSuggestion = recommendOneThing(state.tasks, primarySprint);
  const oneThing = state.tasks.find((task) => task.id === plan.oneThingTaskId);
  const recommendationCandidates = state.tasks.filter(
    (task) => !['done', 'cancelled', 'waiting'].includes(task.status),
  );
  const recommendedTask =
    recommendationCandidates.find(
      (task) => suggestionIndex === 0 && task.id === baseSuggestion?.targetId,
    ) ??
    recommendationCandidates[suggestionIndex % recommendationCandidates.length];
  const recommendationReason =
    recommendedTask?.id === baseSuggestion?.targetId
      ? baseSuggestion.reason
      : recommendedTask?.type === 'strategic'
        ? '这项工作与长期目标直接相关，适合作为今天的战略推进点。'
        : '这项工作当前可执行，并能解除后续工作的依赖。';
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
    (stagnant
      ? '有 Goal 已超过 4 周没有有效进展，建议安排 Review。'
      : undefined);

  const addKey = async (taskId: string) => {
    const result = await service.addTodayKeyTask(taskId).catch(() => undefined);
    if (!result) return;
    setFeedback(result?.errors?.[0] ?? '已加入 Key Tasks。');
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

      <section className="rounded-panel border border-app-foreground/30 bg-app-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="goal-label">
            {oneThing ? "Today's One Thing" : 'AI 推荐今日重点'}
          </p>
          <span
            className={`rounded-badge px-2 py-1 text-[11px] font-medium ${oneThing ? 'bg-success-soft text-success-strong' : 'border border-app-border bg-app-muted text-app-muted-foreground'}`}
          >
            {oneThing ? 'Confirmed' : 'Mock AI'}
          </span>
        </div>
        <h2 className="mt-3 max-w-3xl text-xl font-semibold leading-8 sm:text-2xl">
          {oneThing?.title ?? recommendedTask?.title ?? '暂时没有可推荐的任务'}
        </h2>
        {!oneThing && recommendedTask && (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted-foreground">
              {recommendationReason}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void service
                    .setTodayOneThing(recommendedTask.id)
                    .catch(() => undefined)
                }
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground"
              >
                设为今日重点
              </button>
              {recommendationCandidates.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSuggestionIndex(
                      (index) => (index + 1) % recommendationCandidates.length,
                    )
                  }
                  className="h-9 rounded-control border border-app-border px-4 text-sm font-medium"
                >
                  换一个
                </button>
              )}
            </div>
            <details className="mt-4 text-xs text-app-muted-foreground">
              <summary className="cursor-pointer rounded-control outline-none focus-visible:ring-2 focus-visible:ring-app-foreground">
                手动选择
              </summary>
              <select
                aria-label="手动选择今日重点"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value)
                    void service
                      .setTodayOneThing(event.target.value)
                      .catch(() => undefined);
                }}
                className="mt-2 h-10 w-full max-w-xl rounded-control border border-app-border bg-white px-3 text-sm"
              >
                <option value="">选择一个 Task…</option>
                {available.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </details>
          </>
        )}
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="goal-label">Current Primary Sprint</p>
            <h2 className="mt-2 text-lg font-semibold">
              {primarySprint?.title ?? 'No Primary Sprint'}
            </h2>
            {primarySprint && (
              <p className="mt-1 text-xs text-app-subtle">
                {formatDateRange(
                  primarySprint.startDate,
                  primarySprint.endDate,
                )}{' '}
                · Day {getSprintTiming(primarySprint, date).day} /{' '}
                {getSprintTiming(primarySprint, date).totalDays}
              </p>
            )}
          </div>
          <a
            href="/sprints"
            className="text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
          >
            查看 Sprint →
          </a>
        </div>
        {primarySprint && (
          <>
            <p className="mt-4 text-sm font-medium leading-6">
              {primarySprint.primaryOutcome}
            </p>
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
              {primaryGoal ? ` · Goal · ${primaryGoal.title}` : ''}
            </p>
          </>
        )}
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Key Tasks</h2>
          <span className="text-xs text-app-subtle">{keyTasks.length} / 3</span>
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
        <select
          aria-label="添加 Key Task"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) addKey(event.target.value);
            event.target.value = '';
          }}
          className="mt-4 h-9 w-full max-w-xl rounded-control border border-app-border bg-white px-3 text-sm"
        >
          <option value="">+ 添加 Key Task</option>
          {available.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </section>

      {(attention.length > 0 || unfinished.length > 0) && (
        <section
          className="rounded-panel border border-warning/25 bg-warning-soft/35 p-5 sm:p-6"
          aria-labelledby="attention-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="attention-heading" className="text-sm font-semibold">
              Attention
            </h2>
            <span className="text-xs text-warning-strong">
              {attention.length + unfinished.length} 件需要判断
            </span>
          </div>
          <div className="mt-3 divide-y divide-warning/15">
            {attention.map((task) => (
              <article key={task.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="mt-1 text-xs leading-5 text-app-muted-foreground">
                  {task.status === 'blocked'
                    ? `Blocked · ${task.blocker?.blocker}`
                    : `Waiting for ${task.waiting?.waitingFor} · 今天跟进`}
                </p>
              </article>
            ))}
            {unfinished.map(
              (task) =>
                task && (
                  <article key={task.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-app-muted-foreground">
                      昨日未完成 · 需要决定下一步
                      {task.todayAssignmentCount > 1
                        ? ` · 已连续安排 ${task.todayAssignmentCount} 次`
                        : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ['continue', '今天继续'],
                          ['reschedule', '重新安排'],
                          ['pool', '放回任务池'],
                          ['cancel', '取消'],
                        ] as [YesterdayDecision, string][]
                      ).map(([decision, label]) => (
                        <button
                          type="button"
                          key={decision}
                          onClick={() =>
                            void service
                              .resolveYesterday(task.id, decision)
                              .catch(() => undefined)
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

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Other Tasks</h2>
          <a
            href="/tasks"
            className="text-xs font-medium text-app-muted-foreground underline decoration-app-border underline-offset-4"
          >
            所有 Tasks →
          </a>
        </div>
        <ul className="mt-3 divide-y divide-app-border text-sm text-app-muted-foreground">
          {otherTasks.map(
            (task) =>
              task && (
                <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                  {task.title}
                </li>
              ),
          )}
          {otherTasks.length === 0 && (
            <li className="py-2">暂无 Other Tasks。</li>
          )}
        </ul>
        <select
          aria-label="添加 Other Task"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value)
              void service
                .addTodayOtherTask(event.target.value)
                .catch(() => undefined);
            event.target.value = '';
          }}
          className="mt-4 h-9 w-full max-w-xl rounded-control border border-app-border bg-white px-3 text-sm"
        >
          <option value="">+ 添加 Other Task</option>
          {available.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </section>

      {strategicWarning ? (
        <WorkflowNotice tone="warning">
          <strong>Strategic Signal</strong> · {strategicWarning}
        </WorkflowNotice>
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
  );
}
