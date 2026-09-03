-- P_CEO_OS Phase 3 core schema.
-- Apply through a reviewed Supabase migration workflow. Never paste secrets here.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, id),
  unique (user_id, legacy_local_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  parent_goal_id uuid,
  title text not null,
  description text not null default '',
  why text not null,
  success_metrics jsonb not null default '[]'::jsonb,
  deadline date,
  next_review_at date,
  status text not null check (status in ('active','at-risk','stalled','completed','paused','abandoned')),
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  progress_mode text not null check (progress_mode in ('manual','metric','children','milestones')),
  suggested_progress numeric(5,2) check (suggested_progress between 0 and 100),
  last_meaningful_progress_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, id),
  unique (user_id, legacy_local_id),
  foreign key (user_id, parent_goal_id) references public.goals(user_id, id),
  check (deadline is not null or next_review_at is not null)
);

create table public.goal_company_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  company_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (goal_id, company_id),
  foreign key (user_id, goal_id) references public.goals(user_id, id) on delete cascade,
  foreign key (user_id, company_id) references public.companies(user_id, id) on delete cascade
);

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  kind text not null check (kind in ('primary','maintenance')),
  status text not null check (status in ('planned','active','review','completed','closed-incomplete')),
  title text not null,
  primary_outcome text not null,
  secondary_outcomes jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date not null,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  golden_time text,
  review_reason text,
  carried_from_sprint_id uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, id),
  unique (user_id, legacy_local_id),
  foreign key (user_id, carried_from_sprint_id) references public.sprints(user_id, id),
  check (end_date >= start_date)
);

create unique index one_active_primary_sprint_per_user
  on public.sprints (user_id)
  where kind = 'primary' and status = 'active' and deleted_at is null;

create table public.sprint_goal_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  sprint_id uuid not null,
  goal_id uuid not null,
  relation_type text not null check (relation_type in ('primary','secondary')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (sprint_id, goal_id, relation_type),
  foreign key (user_id, sprint_id) references public.sprints(user_id, id) on delete cascade,
  foreign key (user_id, goal_id) references public.goals(user_id, id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  title text not null,
  notes text not null default '',
  task_type text not null check (task_type in ('strategic','maintenance','normal')),
  status text not null check (status in ('inbox','todo','in-progress','waiting','blocked','done','cancelled')),
  relations jsonb not null default '[]'::jsonb,
  waiting jsonb,
  delegation jsonb,
  blocker jsonb,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes is null or actual_minutes >= 0),
  actual_time_source text check (actual_time_source is null or actual_time_source in ('inferred','manual','focus')),
  hard_deadline_at timestamptz,
  target_date date,
  source_idea_key text,
  today_assignment_count integer not null default 0 check (today_assignment_count >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, id),
  unique (user_id, legacy_local_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  original_text text not null,
  source text not null default 'web' check (source = 'web'),
  status text not null check (status in ('saved','converted','archived')),
  analysis jsonb,
  converted_entity_key text,
  converted_entity_type text check (converted_entity_type is null or converted_entity_type in ('task','project','opportunity','knowledge')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, id),
  unique (user_id, legacy_local_id)
);

create table public.today_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  plan_date date not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, id),
  unique (user_id, legacy_local_id),
  unique (user_id, plan_date)
);

create table public.today_task_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  today_plan_id uuid not null,
  task_id uuid not null,
  relation_type text not null check (relation_type in ('one-thing','key','other','unfinished')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (today_plan_id, task_id, relation_type),
  foreign key (user_id, today_plan_id) references public.today_plans(user_id, id) on delete cascade,
  foreign key (user_id, task_id) references public.tasks(user_id, id) on delete cascade
);

create unique index one_thing_per_today_plan
  on public.today_task_links (today_plan_id)
  where relation_type = 'one-thing';

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_local_id text not null,
  entity_type text not null check (entity_type in ('goal','sprint','task','today','idea')),
  entity_key text not null,
  action text not null,
  summary text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, legacy_local_id)
);

create table public.migration_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null,
  source_version text not null,
  migration_key text not null,
  status text not null check (status in ('running','completed','failed')),
  counts jsonb not null default '{}'::jsonb,
  checksum text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  unique (user_id, migration_key)
);

create index goals_user_updated_idx on public.goals (user_id, updated_at desc) where deleted_at is null;
create index sprints_user_updated_idx on public.sprints (user_id, updated_at desc) where deleted_at is null;
create index tasks_user_updated_idx on public.tasks (user_id, updated_at desc) where deleted_at is null;
create index ideas_user_updated_idx on public.ideas (user_id, updated_at desc) where deleted_at is null;
create index audit_events_user_time_idx on public.audit_events (user_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.goals enable row level security;
alter table public.goal_company_links enable row level security;
alter table public.sprints enable row level security;
alter table public.sprint_goal_links enable row level security;
alter table public.tasks enable row level security;
alter table public.ideas enable row level security;
alter table public.today_plans enable row level security;
alter table public.today_task_links enable row level security;
alter table public.audit_events enable row level security;
alter table public.migration_records enable row level security;

revoke all on public.profiles, public.companies, public.goals, public.goal_company_links, public.sprints, public.sprint_goal_links, public.tasks, public.ideas, public.today_plans, public.today_task_links, public.audit_events, public.migration_records from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.companies, public.goals, public.goal_company_links, public.sprints, public.sprint_goal_links, public.tasks, public.ideas, public.today_plans, public.today_task_links to authenticated;
grant select, insert on public.audit_events to authenticated;
grant select, insert, update on public.migration_records to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare table_name text;
begin
  foreach table_name in array array['companies','goals','goal_company_links','sprints','sprint_goal_links','tasks','ideas','today_plans','today_task_links','migration_records']
  loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name || '_update_own', table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['companies','goals','goal_company_links','sprints','sprint_goal_links','tasks','ideas','today_plans','today_task_links']
  loop
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name || '_delete_own', table_name);
  end loop;
end $$;

create policy audit_events_select_own on public.audit_events for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy audit_events_insert_own on public.audit_events for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.save_workflow_state(payload jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  item jsonb;
  parent_key text;
  sprint_parent_key text;
  company_key text;
  relation jsonb;
  position_index integer;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if coalesce((payload->>'version')::integer, 0) <> 1 then raise exception 'unsupported workflow version'; end if;

  insert into public.profiles (id, email)
  select uid, (select email from auth.users where id = uid)
  on conflict (id) do update set email = excluded.email, updated_at = now();

  for item in select value from jsonb_array_elements(coalesce(payload->'goals', '[]'::jsonb)) loop
    for company_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'companyIds', '[]'::jsonb)) loop
      insert into public.companies (user_id, legacy_local_id, name)
      values (uid, company_key, company_key)
      on conflict (user_id, legacy_local_id) do nothing;
    end loop;
  end loop;
  for item in select value from jsonb_array_elements(coalesce(payload->'tasks', '[]'::jsonb)) loop
    for relation in select value from jsonb_array_elements(coalesce(item->'relations', '[]'::jsonb)) loop
      if relation->>'type' = 'company' then
        insert into public.companies (user_id, legacy_local_id, name)
        values (uid, relation->>'entityId', coalesce(nullif(relation->>'label',''), relation->>'entityId'))
        on conflict (user_id, legacy_local_id) do update set name = excluded.name, updated_at = now();
      end if;
    end loop;
  end loop;

  insert into public.goals (user_id, legacy_local_id, title, description, why, success_metrics, deadline, next_review_at, status, progress, progress_mode, suggested_progress, last_meaningful_progress_at, created_at, updated_at, deleted_at)
  select uid, source.value->>'id', source.value->>'title', coalesce(source.value->>'description',''), source.value->>'why', coalesce(source.value->'successMetrics','[]'::jsonb), nullif(source.value->>'deadline','')::date, nullif(source.value->>'nextReviewAt','')::date, source.value->>'status', (source.value->>'progress')::numeric, source.value->>'progressMode', nullif(source.value->>'suggestedProgress','')::numeric, (source.value->>'lastMeaningfulProgressAt')::timestamptz, (source.value->>'createdAt')::timestamptz, (source.value->>'updatedAt')::timestamptz, null
  from jsonb_array_elements(coalesce(payload->'goals','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do update set title=excluded.title, description=excluded.description, why=excluded.why, success_metrics=excluded.success_metrics, deadline=excluded.deadline, next_review_at=excluded.next_review_at, status=excluded.status, progress=excluded.progress, progress_mode=excluded.progress_mode, suggested_progress=excluded.suggested_progress, last_meaningful_progress_at=excluded.last_meaningful_progress_at, updated_at=excluded.updated_at, deleted_at=null;

  for item in select value from jsonb_array_elements(coalesce(payload->'goals','[]'::jsonb)) loop
    parent_key := nullif(item->>'parentGoalId','');
    update public.goals set parent_goal_id = (select id from public.goals where user_id=uid and legacy_local_id=parent_key)
    where user_id=uid and legacy_local_id=item->>'id';
  end loop;
  update public.goals g set deleted_at=now() where g.user_id=uid and g.deleted_at is null and not exists (select 1 from jsonb_array_elements(coalesce(payload->'goals','[]'::jsonb)) source where source.value->>'id'=g.legacy_local_id);
  delete from public.goal_company_links where user_id=uid;
  for item in select value from jsonb_array_elements(coalesce(payload->'goals','[]'::jsonb)) loop
    for company_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'companyIds','[]'::jsonb)) loop
      insert into public.goal_company_links (user_id, goal_id, company_id)
      select uid, g.id, c.id from public.goals g join public.companies c on c.user_id=uid and c.legacy_local_id=company_key where g.user_id=uid and g.legacy_local_id=item->>'id';
    end loop;
  end loop;

  -- Release the previous active Primary before inserting its confirmed replacement.
  update public.sprints s
  set status='review', updated_at=now()
  where s.user_id=uid and s.kind='primary' and s.status='active'
    and not exists (
      select 1 from jsonb_array_elements(coalesce(payload->'sprints','[]'::jsonb)) source
      where source.value->>'id'=s.legacy_local_id and source.value->>'status'='active'
    );

  insert into public.sprints (user_id, legacy_local_id, title, kind, status, primary_outcome, secondary_outcomes, start_date, end_date, progress, golden_time, review_reason, created_at, updated_at, deleted_at)
  select uid, source.value->>'id', source.value->>'title', source.value->>'kind', source.value->>'status', source.value->>'primaryOutcome', coalesce(source.value->'secondaryOutcomes','[]'::jsonb), (source.value->>'startDate')::date, (source.value->>'endDate')::date, (source.value->>'progress')::numeric, nullif(source.value->>'goldenTime',''), nullif(source.value->>'reviewReason',''), (source.value->>'createdAt')::timestamptz, (source.value->>'updatedAt')::timestamptz, null
  from jsonb_array_elements(coalesce(payload->'sprints','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do update set title=excluded.title, kind=excluded.kind, status=excluded.status, primary_outcome=excluded.primary_outcome, secondary_outcomes=excluded.secondary_outcomes, start_date=excluded.start_date, end_date=excluded.end_date, progress=excluded.progress, golden_time=excluded.golden_time, review_reason=excluded.review_reason, updated_at=excluded.updated_at, deleted_at=null;
  for item in select value from jsonb_array_elements(coalesce(payload->'sprints','[]'::jsonb)) loop
    sprint_parent_key := nullif(item->>'carriedFromSprintId','');
    update public.sprints set carried_from_sprint_id = (select id from public.sprints where user_id=uid and legacy_local_id=sprint_parent_key)
    where user_id=uid and legacy_local_id=item->>'id';
  end loop;
  update public.sprints s set deleted_at=now() where s.user_id=uid and s.deleted_at is null and not exists (select 1 from jsonb_array_elements(coalesce(payload->'sprints','[]'::jsonb)) source where source.value->>'id'=s.legacy_local_id);
  delete from public.sprint_goal_links where user_id=uid;
  for item in select value from jsonb_array_elements(coalesce(payload->'sprints','[]'::jsonb)) loop
    if nullif(item->>'primaryGoalId','') is not null then
      insert into public.sprint_goal_links (user_id,sprint_id,goal_id,relation_type,position)
      select uid,s.id,g.id,'primary',0 from public.sprints s join public.goals g on g.user_id=uid and g.legacy_local_id=item->>'primaryGoalId' where s.user_id=uid and s.legacy_local_id=item->>'id';
    end if;
    position_index := 0;
    for parent_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'secondaryGoalIds','[]'::jsonb)) loop
      insert into public.sprint_goal_links (user_id,sprint_id,goal_id,relation_type,position)
      select uid,s.id,g.id,'secondary',position_index from public.sprints s join public.goals g on g.user_id=uid and g.legacy_local_id=parent_key where s.user_id=uid and s.legacy_local_id=item->>'id';
      position_index := position_index + 1;
    end loop;
  end loop;

  insert into public.tasks (user_id, legacy_local_id, title, notes, task_type, status, relations, waiting, delegation, blocker, estimated_minutes, actual_minutes, actual_time_source, hard_deadline_at, target_date, source_idea_key, today_assignment_count, created_at, updated_at, deleted_at)
  select uid,source.value->>'id',source.value->>'title',coalesce(source.value->>'notes',''),source.value->>'type',source.value->>'status',coalesce(source.value->'relations','[]'::jsonb),source.value->'waiting',source.value->'delegation',source.value->'blocker',nullif(source.value->>'estimatedMinutes','')::integer,nullif(source.value->>'actualMinutes','')::integer,nullif(source.value->>'actualTimeSource',''),nullif(source.value->>'hardDeadlineAt','')::timestamptz,nullif(source.value->>'targetDate','')::date,nullif(source.value->>'sourceIdeaId',''),coalesce((source.value->>'todayAssignmentCount')::integer,0),(source.value->>'createdAt')::timestamptz,(source.value->>'updatedAt')::timestamptz,null
  from jsonb_array_elements(coalesce(payload->'tasks','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do update set title=excluded.title,notes=excluded.notes,task_type=excluded.task_type,status=excluded.status,relations=excluded.relations,waiting=excluded.waiting,delegation=excluded.delegation,blocker=excluded.blocker,estimated_minutes=excluded.estimated_minutes,actual_minutes=excluded.actual_minutes,actual_time_source=excluded.actual_time_source,hard_deadline_at=excluded.hard_deadline_at,target_date=excluded.target_date,source_idea_key=excluded.source_idea_key,today_assignment_count=excluded.today_assignment_count,updated_at=excluded.updated_at,deleted_at=null;
  update public.tasks t set deleted_at=now() where t.user_id=uid and t.deleted_at is null and not exists (select 1 from jsonb_array_elements(coalesce(payload->'tasks','[]'::jsonb)) source where source.value->>'id'=t.legacy_local_id);

  insert into public.ideas (user_id,legacy_local_id,original_text,source,status,analysis,converted_entity_key,converted_entity_type,created_at,updated_at,deleted_at)
  select uid,source.value->>'id',source.value->>'originalText',source.value->>'source',source.value->>'status',source.value->'analysis',nullif(source.value->>'convertedEntityId',''),nullif(source.value->>'convertedEntityType',''),(source.value->>'createdAt')::timestamptz,(source.value->>'updatedAt')::timestamptz,null
  from jsonb_array_elements(coalesce(payload->'ideas','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do update set original_text=excluded.original_text,source=excluded.source,status=excluded.status,analysis=excluded.analysis,converted_entity_key=excluded.converted_entity_key,converted_entity_type=excluded.converted_entity_type,updated_at=excluded.updated_at,deleted_at=null;
  update public.ideas i set deleted_at=now() where i.user_id=uid and i.deleted_at is null and not exists (select 1 from jsonb_array_elements(coalesce(payload->'ideas','[]'::jsonb)) source where source.value->>'id'=i.legacy_local_id);

  insert into public.today_plans (user_id,legacy_local_id,plan_date,created_at,updated_at)
  select uid,source.value->>'id',(source.value->>'date')::date,(source.value->>'createdAt')::timestamptz,(source.value->>'updatedAt')::timestamptz
  from jsonb_array_elements(coalesce(payload->'todayPlans','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do update set plan_date=excluded.plan_date,updated_at=excluded.updated_at;
  delete from public.today_task_links where user_id=uid;
  for item in select value from jsonb_array_elements(coalesce(payload->'todayPlans','[]'::jsonb)) loop
    if nullif(item->>'oneThingTaskId','') is not null then
      insert into public.today_task_links (user_id,today_plan_id,task_id,relation_type,position)
      select uid,p.id,t.id,'one-thing',0 from public.today_plans p join public.tasks t on t.user_id=uid and t.legacy_local_id=item->>'oneThingTaskId' where p.user_id=uid and p.legacy_local_id=item->>'id';
    end if;
    position_index := 0;
    for parent_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'keyTaskIds','[]'::jsonb)) loop
      insert into public.today_task_links (user_id,today_plan_id,task_id,relation_type,position) select uid,p.id,t.id,'key',position_index from public.today_plans p join public.tasks t on t.user_id=uid and t.legacy_local_id=parent_key where p.user_id=uid and p.legacy_local_id=item->>'id'; position_index := position_index + 1;
    end loop;
    position_index := 0;
    for parent_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'otherTaskIds','[]'::jsonb)) loop
      insert into public.today_task_links (user_id,today_plan_id,task_id,relation_type,position) select uid,p.id,t.id,'other',position_index from public.today_plans p join public.tasks t on t.user_id=uid and t.legacy_local_id=parent_key where p.user_id=uid and p.legacy_local_id=item->>'id'; position_index := position_index + 1;
    end loop;
    position_index := 0;
    for parent_key in select value #>> '{}' from jsonb_array_elements(coalesce(item->'unfinishedTaskIds','[]'::jsonb)) loop
      insert into public.today_task_links (user_id,today_plan_id,task_id,relation_type,position) select uid,p.id,t.id,'unfinished',position_index from public.today_plans p join public.tasks t on t.user_id=uid and t.legacy_local_id=parent_key where p.user_id=uid and p.legacy_local_id=item->>'id'; position_index := position_index + 1;
    end loop;
  end loop;

  insert into public.audit_events (user_id,legacy_local_id,entity_type,entity_key,action,summary,occurred_at)
  select uid,source.value->>'id',source.value->>'entityType',source.value->>'entityId',source.value->>'action',source.value->>'summary',(source.value->>'occurredAt')::timestamptz
  from jsonb_array_elements(coalesce(payload->'auditEvents','[]'::jsonb)) source
  on conflict (user_id, legacy_local_id) do nothing;
end;
$$;

create or replace function public.load_workflow_state()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'version', 1,
    'goals', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',g.legacy_local_id,'title',g.title,'description',g.description,'why',g.why,'successMetrics',g.success_metrics,'deadline',g.deadline,'nextReviewAt',g.next_review_at,'status',g.status,'progress',g.progress,'progressMode',g.progress_mode,'suggestedProgress',g.suggested_progress,'parentGoalId',pg.legacy_local_id,'companyIds',coalesce((select jsonb_agg(c.legacy_local_id order by c.legacy_local_id) from public.goal_company_links l join public.companies c on c.id=l.company_id where l.goal_id=g.id),'[]'::jsonb),'lastMeaningfulProgressAt',g.last_meaningful_progress_at,'createdAt',g.created_at,'updatedAt',g.updated_at)) order by g.created_at,g.id) from public.goals g left join public.goals pg on pg.id=g.parent_goal_id where g.user_id=(select auth.uid()) and g.deleted_at is null),'[]'::jsonb),
    'sprints', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',s.legacy_local_id,'title',s.title,'kind',s.kind,'status',s.status,'primaryGoalId',(select g.legacy_local_id from public.sprint_goal_links l join public.goals g on g.id=l.goal_id where l.sprint_id=s.id and l.relation_type='primary' limit 1),'secondaryGoalIds',coalesce((select jsonb_agg(g.legacy_local_id order by l.position) from public.sprint_goal_links l join public.goals g on g.id=l.goal_id where l.sprint_id=s.id and l.relation_type='secondary'),'[]'::jsonb),'primaryOutcome',s.primary_outcome,'secondaryOutcomes',s.secondary_outcomes,'startDate',s.start_date,'endDate',s.end_date,'progress',s.progress,'goldenTime',s.golden_time,'reviewReason',s.review_reason,'carriedFromSprintId',cs.legacy_local_id,'createdAt',s.created_at,'updatedAt',s.updated_at)) order by s.created_at,s.id) from public.sprints s left join public.sprints cs on cs.id=s.carried_from_sprint_id where s.user_id=(select auth.uid()) and s.deleted_at is null),'[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',t.legacy_local_id,'title',t.title,'notes',t.notes,'type',t.task_type,'status',t.status,'relations',t.relations,'waiting',t.waiting,'delegation',t.delegation,'blocker',t.blocker,'estimatedMinutes',t.estimated_minutes,'actualMinutes',t.actual_minutes,'actualTimeSource',t.actual_time_source,'hardDeadlineAt',t.hard_deadline_at,'targetDate',t.target_date,'sourceIdeaId',t.source_idea_key,'todayAssignmentCount',t.today_assignment_count,'createdAt',t.created_at,'updatedAt',t.updated_at)) order by t.created_at,t.id) from public.tasks t where t.user_id=(select auth.uid()) and t.deleted_at is null),'[]'::jsonb),
    'todayPlans', coalesce((select jsonb_agg(jsonb_build_object('id',p.legacy_local_id,'date',p.plan_date,'oneThingTaskId',(select t.legacy_local_id from public.today_task_links l join public.tasks t on t.id=l.task_id where l.today_plan_id=p.id and l.relation_type='one-thing' limit 1),'keyTaskIds',coalesce((select jsonb_agg(t.legacy_local_id order by l.position) from public.today_task_links l join public.tasks t on t.id=l.task_id where l.today_plan_id=p.id and l.relation_type='key'),'[]'::jsonb),'otherTaskIds',coalesce((select jsonb_agg(t.legacy_local_id order by l.position) from public.today_task_links l join public.tasks t on t.id=l.task_id where l.today_plan_id=p.id and l.relation_type='other'),'[]'::jsonb),'unfinishedTaskIds',coalesce((select jsonb_agg(t.legacy_local_id order by l.position) from public.today_task_links l join public.tasks t on t.id=l.task_id where l.today_plan_id=p.id and l.relation_type='unfinished'),'[]'::jsonb),'createdAt',p.created_at,'updatedAt',p.updated_at) order by p.plan_date,p.id) from public.today_plans p where p.user_id=(select auth.uid())),'[]'::jsonb),
    'ideas', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',i.legacy_local_id,'originalText',i.original_text,'source',i.source,'status',i.status,'analysis',i.analysis,'convertedEntityId',i.converted_entity_key,'convertedEntityType',i.converted_entity_type,'createdAt',i.created_at,'updatedAt',i.updated_at)) order by i.created_at desc,i.id) from public.ideas i where i.user_id=(select auth.uid()) and i.deleted_at is null),'[]'::jsonb),
    'auditEvents', coalesce((select jsonb_agg(jsonb_build_object('id',a.legacy_local_id,'entityType',a.entity_type,'entityId',a.entity_key,'action',a.action,'occurredAt',a.occurred_at,'summary',a.summary) order by a.occurred_at,a.id) from public.audit_events a where a.user_id=(select auth.uid())),'[]'::jsonb)
  )
  where (select auth.uid()) is not null;
$$;

revoke all on function public.save_workflow_state(jsonb) from public, anon;
revoke all on function public.load_workflow_state() from public, anon;
grant execute on function public.save_workflow_state(jsonb) to authenticated;
grant execute on function public.load_workflow_state() to authenticated;

comment on function public.save_workflow_state(jsonb) is 'Atomically persists P_CEO_OS workflow state for the authenticated owner under RLS.';
comment on function public.load_workflow_state() is 'Loads P_CEO_OS workflow state for the authenticated owner under RLS.';
