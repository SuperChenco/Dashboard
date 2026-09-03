import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from 'astro:env/client';

import { createBrowserSupabaseClient } from '@/lib/supabase';
import { hasSupabaseConfig } from '@/lib/supabase/config';
import { LocalWorkflowRepository } from '@/repositories/local/workflow-local.repository';
import { SupabaseWorkflowRepository } from '@/repositories/supabase/workflow-supabase.repository';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

let repository: WorkflowRepository | undefined;

export function createWorkflowRepository(): WorkflowRepository {
  if (repository) return repository;
  const configured = hasSupabaseConfig({
    url: PUBLIC_SUPABASE_URL,
    publishableKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (configured) {
    repository = new SupabaseWorkflowRepository(createBrowserSupabaseClient());
    return repository;
  }
  if (!import.meta.env.DEV) {
    throw new Error(
      '生产环境必须配置 Supabase，LocalStorage 不能作为生产数据源。',
    );
  }
  repository = new LocalWorkflowRepository();
  return repository;
}
