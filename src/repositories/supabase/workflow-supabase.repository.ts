import type { SupabaseClient } from '@supabase/supabase-js';

import { createEmptyWorkflowState } from '@/data/workflow-state';
import type { WorkflowState } from '@/domain/workflow/types';
import {
  notifyWorkflowChanged,
  notifyWorkflowError,
} from '@/repositories/events';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

function isWorkflowState(value: unknown): value is WorkflowState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<WorkflowState>;
  return (
    state.version === 1 &&
    Array.isArray(state.goals) &&
    Array.isArray(state.sprints) &&
    Array.isArray(state.tasks) &&
    Array.isArray(state.todayPlans) &&
    Array.isArray(state.ideas) &&
    Array.isArray(state.auditEvents)
  );
}

export class SupabaseWorkflowRepository implements WorkflowRepository {
  readonly kind = 'supabase' as const;

  constructor(private readonly client: SupabaseClient) {}

  async load(): Promise<WorkflowState> {
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError || !auth.user) {
      throw new Error('登录会话已失效，请重新登录。');
    }

    const { data, error } = await this.client.rpc('load_workflow_state');
    if (error) {
      notifyWorkflowError('云端数据加载失败，请检查网络后重试。');
      throw new Error(error.message);
    }
    if (data === null) return createEmptyWorkflowState();
    if (!isWorkflowState(data)) {
      throw new Error('云端返回了无法识别的数据格式。');
    }
    return data;
  }

  async save(state: WorkflowState): Promise<void> {
    const { error } = await this.client.rpc('save_workflow_state', {
      payload: state,
    });
    if (error) {
      notifyWorkflowError('保存失败，修改尚未确认写入云端。请重试。');
      throw new Error(error.message);
    }
    notifyWorkflowChanged();
  }

  async reset(): Promise<WorkflowState> {
    throw new Error('云端数据不能通过客户端重置，请使用数据导出与恢复流程。');
  }
}
