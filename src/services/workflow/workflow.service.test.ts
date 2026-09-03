import { describe, expect, it } from 'vitest';

import { createEmptyWorkflowState } from '@/data/workflow-state';
import type { WorkflowState } from '@/domain/workflow/types';
import type { WorkflowRepository } from '@/repositories/workflow.repository';
import { WorkflowService } from '@/services/workflow/workflow.service';

class MemoryWorkflowRepository implements WorkflowRepository {
  readonly kind = 'local' as const;
  state = createEmptyWorkflowState();

  async load(): Promise<WorkflowState> {
    return structuredClone(this.state);
  }

  async save(state: WorkflowState): Promise<void> {
    this.state = structuredClone(state);
  }

  async reset(): Promise<WorkflowState> {
    this.state = createEmptyWorkflowState();
    return this.load();
  }
}

describe('WorkflowService persistence boundary', () => {
  it('persists an idea and its audit event before resolving', async () => {
    const repository = new MemoryWorkflowRepository();
    const service = new WorkflowService(repository);

    const result = await service.createIdea('验证云端异步保存边界');

    expect(result.value).toBeDefined();
    expect(repository.state.ideas).toHaveLength(1);
    expect(repository.state.auditEvents).toHaveLength(1);
    expect(repository.state.auditEvents[0]?.entityId).toBe(result.value?.id);
  });

  it('rejects when the repository cannot persist', async () => {
    class FailingRepository extends MemoryWorkflowRepository {
      override async save(): Promise<void> {
        throw new Error('cloud write failed');
      }
    }

    const service = new WorkflowService(new FailingRepository());

    await expect(service.createIdea('不应显示成功')).rejects.toThrow(
      'cloud write failed',
    );
  });
});
