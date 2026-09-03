import { describe, expect, it } from 'vitest';

import migrationSql from '../../../supabase/migrations/202609030001_phase3_core.sql?raw';

const sql = migrationSql.toLowerCase();

describe('Phase 3 database security contract', () => {
  const tables = [
    'profiles',
    'companies',
    'goals',
    'goal_company_links',
    'sprints',
    'sprint_goal_links',
    'tasks',
    'ideas',
    'today_plans',
    'today_task_links',
    'audit_events',
    'migration_records',
  ];

  it.each(tables)('enables RLS for %s', (table) => {
    expect(sql).toContain(
      `alter table public.${table} enable row level security`,
    );
  });

  it('keeps workflow RPCs caller-scoped', () => {
    expect(sql.match(/security invoker/g)).toHaveLength(2);
    expect(sql).toContain('auth.uid()');
    expect(sql).not.toContain('service_role');
  });

  it('does not grant audit update or delete to authenticated clients', () => {
    expect(sql).toContain(
      'grant select, insert on public.audit_events to authenticated',
    );
    expect(sql).not.toMatch(
      /grant[^;]*(update|delete)[^;]*public\.audit_events/,
    );
  });

  it('binds relationship foreign keys to the same owner', () => {
    expect(sql).toContain(
      'foreign key (user_id, goal_id) references public.goals(user_id, id)',
    );
    expect(sql).toContain(
      'foreign key (user_id, task_id) references public.tasks(user_id, id)',
    );
    expect(sql).toContain(
      'foreign key (user_id, company_id) references public.companies(user_id, id)',
    );
  });
});
