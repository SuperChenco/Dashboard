import type { SupabaseClient } from '@supabase/supabase-js';

import type { WorkflowState } from '@/domain/workflow/types';
import { WORKFLOW_STORAGE_KEY } from '@/repositories/local/workflow-local.repository';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

export interface MigrationPreview {
  source: 'local-storage';
  sourceVersion: number;
  migrationKey: string;
  checksum: string;
  counts: Record<string, number>;
  state: WorkflowState;
}

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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function canonicalState(state: WorkflowState): WorkflowState {
  const byId = <T extends { id: string }>(items: T[]) =>
    [...items].sort((left, right) => left.id.localeCompare(right.id));
  return {
    ...state,
    goals: byId(state.goals),
    sprints: byId(state.sprints),
    tasks: byId(state.tasks),
    todayPlans: byId(state.todayPlans),
    ideas: byId(state.ideas),
    auditEvents: byId(state.auditEvents),
  };
}

export async function checksumWorkflowState(
  state: WorkflowState,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    stableStringify(canonicalState(state)),
  );
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hasSameWorkflowIdentity(
  source: WorkflowState,
  target: WorkflowState,
): boolean {
  const project = (state: WorkflowState) => ({
    version: state.version,
    goals: state.goals.map((goal) => ({
      id: goal.id,
      parentGoalId: goal.parentGoalId,
      companyIds: [...goal.companyIds].sort(),
    })),
    sprints: state.sprints.map((sprint) => ({
      id: sprint.id,
      primaryGoalId: sprint.primaryGoalId,
      secondaryGoalIds: [...sprint.secondaryGoalIds].sort(),
      carriedFromSprintId: sprint.carriedFromSprintId,
    })),
    tasks: state.tasks.map((task) => ({
      id: task.id,
      sourceIdeaId: task.sourceIdeaId,
      relations: [...task.relations].sort((left, right) =>
        `${left.type}:${left.entityId}`.localeCompare(
          `${right.type}:${right.entityId}`,
        ),
      ),
    })),
    todayPlans: state.todayPlans.map((plan) => ({
      id: plan.id,
      oneThingTaskId: plan.oneThingTaskId,
      keyTaskIds: plan.keyTaskIds,
      otherTaskIds: plan.otherTaskIds,
      unfinishedTaskIds: plan.unfinishedTaskIds,
    })),
    ideas: state.ideas.map((idea) => ({
      id: idea.id,
      convertedEntityId: idea.convertedEntityId,
      convertedEntityType: idea.convertedEntityType,
    })),
    auditEvents: state.auditEvents.map((event) => ({
      id: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
    })),
  });
  return (
    stableStringify(project(canonicalState(source))) ===
    stableStringify(project(canonicalState(target)))
  );
}

export async function detectLocalWorkflowMigration(): Promise<MigrationPreview | null> {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!isWorkflowState(parsed)) {
    throw new Error('本地 Phase 2 数据格式无效，迁移已停止。');
  }
  const checksum = await checksumWorkflowState(parsed);
  return {
    source: 'local-storage',
    sourceVersion: parsed.version,
    migrationKey: `phase2-local-v${parsed.version}-${checksum}`,
    checksum,
    counts: {
      goals: parsed.goals.length,
      sprints: parsed.sprints.length,
      tasks: parsed.tasks.length,
      ideas: parsed.ideas.length,
      todayPlans: parsed.todayPlans.length,
      auditEvents: parsed.auditEvents.length,
    },
    state: parsed,
  };
}

export async function migrateLocalWorkflow(
  preview: MigrationPreview,
  repository: WorkflowRepository,
  client: SupabaseClient,
): Promise<'completed' | 'already-completed'> {
  if (repository.kind !== 'supabase') {
    throw new Error('只有已连接 Supabase 的环境可以执行迁移。');
  }
  const { data: existing, error: lookupError } = await client
    .from('migration_records')
    .select('status, checksum')
    .eq('migration_key', preview.migrationKey)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (
    existing?.status === 'completed' &&
    existing.checksum === preview.checksum
  ) {
    return 'already-completed';
  }

  const startedAt = new Date().toISOString();
  const { error: startError } = await client.from('migration_records').upsert(
    {
      source: preview.source,
      source_version: String(preview.sourceVersion),
      migration_key: preview.migrationKey,
      status: 'running',
      counts: preview.counts,
      checksum: preview.checksum,
      started_at: startedAt,
      completed_at: null,
    },
    { onConflict: 'user_id,migration_key' },
  );
  if (startError) throw new Error(startError.message);

  try {
    await repository.save(preview.state);
    const verified = await repository.load();
    if (!hasSameWorkflowIdentity(preview.state, verified)) {
      throw new Error('云端校验失败，本地数据仍然保留。');
    }
    const { error: completeError } = await client
      .from('migration_records')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('migration_key', preview.migrationKey);
    if (completeError) throw new Error(completeError.message);
    return 'completed';
  } catch (error) {
    await client
      .from('migration_records')
      .update({ status: 'failed' })
      .eq('migration_key', preview.migrationKey);
    throw error;
  }
}
