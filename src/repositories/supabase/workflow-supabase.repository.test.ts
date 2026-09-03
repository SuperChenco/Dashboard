import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { createInitialWorkflowState } from '@/data/mock/workflow';
import { SupabaseWorkflowRepository } from '@/repositories/supabase/workflow-supabase.repository';

function clientWith(options: {
  user?: boolean;
  data?: unknown;
  error?: { message: string };
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user === false ? null : { id: 'owner-id' } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: options.data ?? null,
      error: options.error ?? null,
    }),
  } as unknown as SupabaseClient;
}

describe('SupabaseWorkflowRepository', () => {
  it('loads the authenticated owner workflow', async () => {
    const state = createInitialWorkflowState('2026-09-03T00:00:00.000Z');
    const repository = new SupabaseWorkflowRepository(
      clientWith({ data: state }),
    );
    await expect(repository.load()).resolves.toEqual(state);
  });

  it('rejects an expired or missing session', async () => {
    const repository = new SupabaseWorkflowRepository(
      clientWith({ user: false }),
    );
    await expect(repository.load()).rejects.toThrow('登录会话已失效');
  });

  it('does not report a cloud save as successful when RPC fails', async () => {
    const repository = new SupabaseWorkflowRepository(
      clientWith({ error: { message: 'network failed' } }),
    );
    await expect(repository.save(createInitialWorkflowState())).rejects.toThrow(
      'network failed',
    );
  });
});
