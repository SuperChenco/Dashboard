import type { WorkflowState } from '@/domain/workflow/types';

export function createEmptyWorkflowState(): WorkflowState {
  return {
    version: 1,
    goals: [],
    sprints: [],
    tasks: [],
    todayPlans: [],
    ideas: [],
    auditEvents: [],
  };
}
