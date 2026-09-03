import type { WorkflowState } from '@/domain/workflow/types';

export interface WorkflowRepository {
  readonly kind: 'local' | 'supabase';
  load(): Promise<WorkflowState>;
  save(state: WorkflowState): Promise<void>;
  reset(): Promise<WorkflowState>;
}
