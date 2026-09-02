import { createInitialWorkflowState } from '@/data/mock/workflow';
import type { WorkflowState } from '@/domain/workflow/types';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

export const WORKFLOW_STORAGE_KEY = 'p_ceo_os.phase2.workflow.v1';
export const WORKFLOW_CHANGED_EVENT = 'pceo:workflow-changed';

export class LocalWorkflowRepository implements WorkflowRepository {
  load(): WorkflowState {
    if (typeof window === 'undefined') return createInitialWorkflowState();
    const stored = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!stored) {
      const initial = createInitialWorkflowState();
      this.save(initial);
      return initial;
    }
    try {
      return JSON.parse(stored) as WorkflowState;
    } catch {
      return this.reset();
    }
  }

  save(state: WorkflowState): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(WORKFLOW_CHANGED_EVENT));
  }

  reset(): WorkflowState {
    const state = createInitialWorkflowState();
    this.save(state);
    return state;
  }
}
