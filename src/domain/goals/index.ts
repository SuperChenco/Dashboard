import type { Goal, RuleResult } from '@/domain/workflow/types';

export interface CreateGoalInput {
  title: string;
  description?: string;
  why: string;
  successMetrics: string[];
  deadline?: string;
  nextReviewAt?: string;
  parentGoalId?: string;
  companyIds?: string[];
}

export function validateGoalInput(
  input: CreateGoalInput,
): RuleResult<CreateGoalInput> {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push('Goal result is required.');
  if (!input.why.trim()) errors.push('Goal why is required.');
  if (input.successMetrics.filter((metric) => metric.trim()).length === 0) {
    errors.push('At least one success metric is required.');
  }
  if (!input.deadline && !input.nextReviewAt) {
    errors.push('A Goal without a deadline requires a next review date.');
  }
  return {
    value: errors.length === 0 ? input : undefined,
    errors,
    warnings: [],
  };
}

export function getGoalDepth(goalId: string, goals: Goal[]): number {
  let depth = 1;
  let current = goals.find((goal) => goal.id === goalId);
  const visited = new Set<string>();
  while (current?.parentGoalId && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    current = goals.find((goal) => goal.id === current?.parentGoalId);
  }
  return depth;
}

export function getGoalHierarchyWarning(
  parentGoalId: string | undefined,
  goals: Goal[],
): string | undefined {
  if (!parentGoalId) return undefined;
  const parentDepth = getGoalDepth(parentGoalId, goals);
  if (parentDepth + 1 <= 3) return undefined;
  return 'This goal hierarchy may be too deep. Consider converting lower-level items into Sprint or Task.';
}

export function isGoalStagnant(goal: Goal, now: Date, days = 28): boolean {
  if (goal.status !== 'active' && goal.status !== 'at-risk') return false;
  const elapsed =
    now.getTime() - new Date(goal.lastMeaningfulProgressAt).getTime();
  return elapsed >= days * 86_400_000;
}
