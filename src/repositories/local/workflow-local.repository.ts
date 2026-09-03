import { createInitialWorkflowState } from '@/data/mock/workflow';
import type { WorkflowState } from '@/domain/workflow/types';
import { notifyWorkflowChanged } from '@/repositories/events';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

export const WORKFLOW_STORAGE_KEY = 'p_ceo_os.phase2.workflow.v1';

export class LocalWorkflowRepository implements WorkflowRepository {
  readonly kind = 'local' as const;

  async load(): Promise<WorkflowState> {
    if (typeof window === 'undefined') return createInitialWorkflowState();
    const stored = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!stored) {
      const initial = createInitialWorkflowState();
      await this.save(initial);
      return initial;
    }
    try {
      return JSON.parse(stored) as WorkflowState;
    } catch {
      return this.reset();
    }
  }

  async save(state: WorkflowState): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
    notifyWorkflowChanged();
  }

  async reset(): Promise<WorkflowState> {
    const state = createInitialWorkflowState();
    await this.save(state);
    return state;
  }
}
