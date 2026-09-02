import type { WorkflowState } from '@/domain/workflow/types';

export interface WorkflowRepository {
  load(): WorkflowState;
  save(state: WorkflowState): void;
  reset(): WorkflowState;
}
