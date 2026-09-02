import type {
  AdvisorSuggestion,
  Goal,
  Idea,
  Sprint,
  Task,
} from '@/domain/workflow/types';
import { isGoalStagnant } from '@/domain/goals';

export function suggestTaskType(task: Task): AdvisorSuggestion {
  const strategic =
    task.relations.some(
      (relation) => relation.type === 'goal' || relation.type === 'sprint',
    ) || /FindingMat|MVP|战略/i.test(task.title);
  return {
    id: `suggestion-${task.id}`,
    label: 'Mock AI',
    kind: 'task-type',
    recommendation: strategic ? 'Strategic' : 'Normal',
    reason: strategic
      ? '该任务直接关联目标、Sprint 或长期事业。'
      : '当前证据不足，建议保持 Normal。',
    targetId: task.id,
    confirmed: false,
  };
}

export function analyzeIdeaDeterministically(
  idea: Idea,
  now: string,
): Idea['analysis'] {
  const taskLike = /联系|完成|审核|安排|跟进|准备|整理/.test(idea.originalText);
  return {
    label: 'Mock AI',
    suggestion: taskLike ? 'task' : 'keep',
    reason: taskLike
      ? '文本包含明确行动动词，建议转换为 Task；需要 CEO 确认。'
      : '当前更像待探索判断，建议继续保留为 Idea。',
    suggestedRelations: [],
    analyzedAt: now,
  };
}

export function recommendOneThing(
  tasks: Task[],
  activePrimarySprint?: Sprint,
): AdvisorSuggestion | undefined {
  const candidates = tasks.filter(
    (task) => !['done', 'cancelled', 'waiting'].includes(task.status),
  );
  const sprintCandidate = activePrimarySprint
    ? candidates.find((task) =>
        task.relations.some(
          (relation) =>
            relation.type === 'sprint' &&
            relation.entityId === activePrimarySprint.id,
        ),
      )
    : undefined;
  const task =
    sprintCandidate ??
    candidates.find((candidate) => candidate.type === 'strategic') ??
    candidates[0];
  if (!task) return undefined;
  return {
    id: `one-thing-${task.id}`,
    label: 'AI Suggestion Preview',
    kind: 'one-thing',
    recommendation: task.title,
    reason: sprintCandidate
      ? '该任务位于 Primary Sprint 的关键执行链。'
      : '这是当前可执行任务中战略相关性最高的一项。',
    targetId: task.id,
    confirmed: false,
  };
}

export function detectStrategicDrift(
  goals: Goal[],
  sprints: Sprint[],
  tasks: Task[],
  now: Date,
): AdvisorSuggestion | undefined {
  const strategicGoal = goals.find((goal) => goal.status === 'active');
  if (!strategicGoal) return undefined;
  const supportedBySprint = sprints.some(
    (sprint) =>
      sprint.status === 'active' &&
      (sprint.primaryGoalId === strategicGoal.id ||
        sprint.secondaryGoalIds.includes(strategicGoal.id)),
  );
  const strategicTasks = tasks.filter(
    (task) => task.type === 'strategic' && task.status !== 'done',
  );
  const maintenanceTasks = tasks.filter(
    (task) => task.type === 'maintenance' && task.status !== 'done',
  );
  if (
    !supportedBySprint &&
    strategicTasks.length === 0 &&
    isGoalStagnant(strategicGoal, now, 14)
  ) {
    return {
      id: `drift-${strategicGoal.id}`,
      label: 'Mock AI',
      kind: 'strategic-drift',
      recommendation:
        'Short-term operations may be crowding out long-term strategic work.',
      reason: `${strategicGoal.title} 已 14 天没有 Active Sprint 或 Strategic Task 支持。`,
      targetId: strategicGoal.id,
      confirmed: false,
    };
  }
  if (
    maintenanceTasks.length > strategicTasks.length * 2 &&
    strategicTasks.length > 0
  ) {
    return {
      id: `drift-${strategicGoal.id}`,
      label: 'Mock AI',
      kind: 'strategic-drift',
      recommendation:
        'Short-term operations may be crowding out long-term strategic work.',
      reason: '当前 Maintenance Work 明显高于 Strategic Work。',
      targetId: strategicGoal.id,
      confirmed: false,
    };
  }
  return undefined;
}
