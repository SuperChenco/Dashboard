import type { RuleResult, Sprint } from '@/domain/workflow/types';

export interface CreateSprintInput {
  title: string;
  kind: 'primary' | 'maintenance';
  primaryGoalId?: string;
  secondaryGoalIds?: string[];
  primaryOutcome: string;
  secondaryOutcomes?: string[];
  startDate: string;
  endDate: string;
  goldenTime?: string;
}

export function sprintDurationDays(startDate: string, endDate: string): number {
  return (
    Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() -
        new Date(`${startDate}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1
  );
}

export function validateSprintInput(
  input: CreateSprintInput,
): RuleResult<CreateSprintInput> {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input.title.trim()) errors.push('Sprint title is required.');
  if (!input.primaryOutcome.trim())
    errors.push('One Primary Outcome is required.');
  const duration = sprintDurationDays(input.startDate, input.endDate);
  if (duration <= 0)
    errors.push('Sprint end date must not be before its start date.');
  if (duration > 0 && duration < 4)
    warnings.push(
      'This is a short sprint. Would this be better represented as a Task or Mini Sprint?',
    );
  if (duration > 7)
    warnings.push(
      'This sprint is longer than the recommended focus window. Consider narrowing the Primary Outcome.',
    );
  if (!input.primaryGoalId)
    warnings.push(
      'This Sprint has no Primary Goal. Consider linking it to a strategic result.',
    );
  return { value: errors.length === 0 ? input : undefined, errors, warnings };
}

export function activatePrimarySprint(
  sprintId: string,
  sprints: Sprint[],
  now: string,
): Sprint[] {
  return sprints.map((sprint) => {
    if (sprint.id === sprintId)
      return { ...sprint, kind: 'primary', status: 'active', updatedAt: now };
    if (sprint.kind === 'primary' && sprint.status === 'active') {
      return { ...sprint, status: 'planned', updatedAt: now };
    }
    return sprint;
  });
}

export function getMaintenanceFocusRisk(sprints: Sprint[]): string | undefined {
  const activeCount = sprints.filter(
    (sprint) => sprint.kind === 'maintenance' && sprint.status === 'active',
  ).length;
  if (activeCount <= 2) return undefined;
  return `当前同时存在 ${activeCount} 个 Maintenance Sprints。持续性事务可能正在侵蚀 Primary Sprint。`;
}

export function isSprintExpired(sprint: Sprint, today: string): boolean {
  return sprint.status === 'active' && sprint.endDate < today;
}

export type SprintReviewDecision =
  'complete' | 'extend' | 'carry-forward' | 'close-incomplete';

export function reviewSprint(
  sprint: Sprint,
  decision: SprintReviewDecision,
  reason?: string,
  newEndDate?: string,
): RuleResult<Sprint> {
  const needsReason = decision === 'extend' || decision === 'close-incomplete';
  if (needsReason && !reason?.trim())
    return {
      errors: ['A reason is required for this Sprint Review decision.'],
      warnings: [],
    };
  if (decision === 'extend' && !newEndDate)
    return {
      errors: ['A new end date is required to extend a Sprint.'],
      warnings: [],
    };
  const status =
    decision === 'complete' || decision === 'carry-forward'
      ? 'completed'
      : decision === 'close-incomplete'
        ? 'closed-incomplete'
        : 'active';
  return {
    value: {
      ...sprint,
      status,
      endDate: decision === 'extend' ? newEndDate! : sprint.endDate,
      reviewReason: reason,
      updatedAt: new Date().toISOString(),
    },
    errors: [],
    warnings: [],
  };
}

export function carryForwardSprint(
  sprint: Sprint,
  id: string,
  startDate: string,
  endDate: string,
  now: string,
): Sprint {
  return {
    ...sprint,
    id,
    title: `${sprint.title} · Carry Forward`,
    status: 'active',
    startDate,
    endDate,
    progress: 0,
    reviewReason: undefined,
    carriedFromSprintId: sprint.id,
    createdAt: now,
    updatedAt: now,
  };
}
