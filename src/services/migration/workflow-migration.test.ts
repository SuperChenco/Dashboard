import { describe, expect, it } from 'vitest';

import { createInitialWorkflowState } from '@/data/mock/workflow';
import {
  checksumWorkflowState,
  hasSameWorkflowIdentity,
} from '@/services/migration/workflow-migration';

describe('Phase 3 LocalStorage migration', () => {
  it('creates a stable checksum when collection order changes', async () => {
    const state = createInitialWorkflowState('2026-09-03T00:00:00.000Z');
    const reordered = {
      ...state,
      tasks: [...state.tasks].reverse(),
      sprints: [...state.sprints].reverse(),
    };
    await expect(checksumWorkflowState(reordered)).resolves.toBe(
      await checksumWorkflowState(state),
    );
  });

  it('detects missing entities during cloud verification', () => {
    const state = createInitialWorkflowState('2026-09-03T00:00:00.000Z');
    expect(hasSameWorkflowIdentity(state, state)).toBe(true);
    expect(
      hasSameWorkflowIdentity(state, { ...state, tasks: state.tasks.slice(1) }),
    ).toBe(false);
  });

  it('detects missing relationships during cloud verification', () => {
    const state = createInitialWorkflowState('2026-09-03T00:00:00.000Z');
    const changed = {
      ...state,
      goals: state.goals.map((goal) => ({ ...goal, companyIds: [] })),
    };
    expect(hasSameWorkflowIdentity(state, changed)).toBe(false);
  });
});
