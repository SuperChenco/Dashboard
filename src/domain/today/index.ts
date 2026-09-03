import type { RuleResult, Task, TodayPlan } from '@/domain/workflow/types';

export function setOneThing(
  plan: TodayPlan,
  taskId: string,
  now: string,
): TodayPlan {
  return {
    ...plan,
    oneThingTaskId: taskId,
    keyTaskIds: plan.keyTaskIds.filter((id) => id !== taskId),
    otherTaskIds: plan.otherTaskIds.filter((id) => id !== taskId),
    updatedAt: now,
  };
}

export function addKeyTask(
  plan: TodayPlan,
  taskId: string,
  now: string,
): RuleResult<TodayPlan> {
  if (plan.keyTaskIds.includes(taskId))
    return { value: plan, errors: [], warnings: [] };
  if (plan.keyTaskIds.length >= 3)
    return { errors: ['Today supports at most 3 Key Tasks.'], warnings: [] };
  return {
    value: {
      ...plan,
      keyTaskIds: [...plan.keyTaskIds, taskId],
      otherTaskIds: plan.otherTaskIds.filter((id) => id !== taskId),
      updatedAt: now,
    },
    errors: [],
    warnings: [],
  };
}

export function getUnfinishedTodayTasks(
  plan: TodayPlan,
  tasks: Task[],
): string[] {
  const assigned = [
    plan.oneThingTaskId,
    ...plan.keyTaskIds,
    ...plan.otherTaskIds,
  ].filter((id): id is string => Boolean(id));
  return assigned.filter((id) => {
    const task = tasks.find((candidate) => candidate.id === id);
    return task && task.status !== 'done' && task.status !== 'cancelled';
  });
}

export function createNextDayPlan(
  previous: TodayPlan,
  date: string,
  id: string,
  now: string,
  tasks: Task[],
): TodayPlan {
  return {
    id,
    date,
    oneThingTaskId: undefined,
    keyTaskIds: [],
    otherTaskIds: [],
    unfinishedTaskIds: getUnfinishedTodayTasks(previous, tasks),
    createdAt: now,
    updatedAt: now,
  };
}

export type YesterdayDecision = 'continue' | 'reschedule' | 'pool' | 'cancel';

export function resolveYesterdayTask(
  plan: TodayPlan,
  task: Task,
  decision: YesterdayDecision,
  now: string,
): { plan: TodayPlan; task: Task } {
  const nextPlan = {
    ...plan,
    unfinishedTaskIds: plan.unfinishedTaskIds.filter((id) => id !== task.id),
    updatedAt: now,
  };
  if (decision === 'continue')
    nextPlan.otherTaskIds = [...nextPlan.otherTaskIds, task.id];
  return {
    plan: nextPlan,
    task:
      decision === 'cancel'
        ? { ...task, status: 'cancelled', updatedAt: now }
        : task,
  };
}
