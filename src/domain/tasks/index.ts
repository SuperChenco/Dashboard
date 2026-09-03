import type {
  BlockerDetails,
  DelegationDetails,
  RuleResult,
  Task,
  TaskRelation,
  TaskStatus,
  TaskType,
  WaitingDetails,
} from '@/domain/workflow/types';

export interface CreateTaskInput {
  title: string;
  notes?: string;
  type?: TaskType;
  relations?: TaskRelation[];
  estimatedMinutes?: number;
  hardDeadlineAt?: string;
  targetDate?: string;
  sourceIdeaId?: string;
}

export function createTaskDraft(
  input: CreateTaskInput,
  id: string,
  now: string,
): RuleResult<Task> {
  if (!input.title.trim())
    return { errors: ['Task title is required.'], warnings: [] };
  return {
    value: {
      id,
      title: input.title.trim(),
      notes: input.notes?.trim() ?? '',
      type: input.type ?? 'normal',
      status: 'inbox',
      relations: input.relations ?? [],
      estimatedMinutes: input.estimatedMinutes,
      hardDeadlineAt: input.hardDeadlineAt,
      targetDate: input.targetDate,
      sourceIdeaId: input.sourceIdeaId,
      todayAssignmentCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    errors: [],
    warnings: [],
  };
}

const transitions: Record<TaskStatus, TaskStatus[]> = {
  inbox: ['todo', 'in-progress', 'waiting', 'blocked', 'cancelled'],
  todo: ['in-progress', 'waiting', 'blocked', 'done', 'cancelled'],
  'in-progress': ['todo', 'waiting', 'blocked', 'done', 'cancelled'],
  waiting: ['todo', 'in-progress', 'blocked', 'done', 'cancelled'],
  blocked: ['todo', 'in-progress', 'waiting', 'done', 'cancelled'],
  done: ['todo'],
  cancelled: ['todo'],
};

export function transitionTask(
  task: Task,
  status: TaskStatus,
  now: string,
  details?: { waiting?: WaitingDetails; blocker?: BlockerDetails },
): RuleResult<Task> {
  const errors: string[] = [];
  if (!transitions[task.status].includes(status))
    errors.push(`Cannot move Task from ${task.status} to ${status}.`);
  if (
    status === 'waiting' &&
    (!details?.waiting?.waitingFor.trim() ||
      !details.waiting.waitingOn.trim() ||
      !details.waiting.followUpAt)
  ) {
    errors.push('Waiting requires who/what is awaited and a follow-up date.');
  }
  if (status === 'blocked' && !details?.blocker?.blocker.trim())
    errors.push('Blocked requires a blocker.');
  if (errors.length) return { errors, warnings: [] };
  return {
    value: {
      ...task,
      status,
      waiting: status === 'waiting' ? details?.waiting : task.waiting,
      blocker: status === 'blocked' ? details?.blocker : task.blocker,
      updatedAt: now,
    },
    errors: [],
    warnings: [],
  };
}

export function delegateTask(
  task: Task,
  delegation: DelegationDetails,
  now: string,
): RuleResult<Task> {
  if (!delegation.assignee.trim() || !delegation.myRole.trim())
    return {
      errors: ['Delegation requires an assignee and My Role.'],
      warnings: [],
    };
  return {
    value: { ...task, delegation, updatedAt: now },
    errors: [],
    warnings: [],
  };
}

export function waitingNeedsAttention(task: Task, today: string): boolean {
  return (
    task.status === 'waiting' &&
    Boolean(task.waiting?.followUpAt && task.waiting.followUpAt <= today)
  );
}
