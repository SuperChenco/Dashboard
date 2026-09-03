# P_CEO_OS V1 数据模型基线

本文件描述已确认的数据方向。Phase 3 的首个可执行 schema 位于 `supabase/migrations/202609030001_phase3_core.sql`，应用前仍须在真实 Supabase 项目中审查。

## 通用原则

- PostgreSQL UUID 主键。
- 所有用户业务表包含 `user_id`。
- 核心实体记录 `created_at`、`updated_at`、`created_by`、`updated_by`。
- 时间字段使用带时区时间。
- 金额使用精确数值并保存币种。
- 概率限制在 0–100。
- 核心删除优先归档，并写入审计事件。
- RLS 以 `auth.uid() IS NOT NULL AND auth.uid() = user_id` 为基础。

## Phase 3 实体表

```text
profiles
companies
people
goals
sprints
tasks
ideas
audit_events
migration_records
```

Phase 3 同时建立 `goal_company_links`、`sprint_goal_links` 与 `today_task_links`。People、Projects、Opportunities、Decisions、Time、AI、Health、Learning 的正式表按后续 Phase 在产生真实需求时增加，避免预建空表。

## 核心关系

```text
Company
  ├── People
  ├── Projects
  ├── Opportunities
  └── Tasks

Goal
  ├── Child Goals
  ├── Sprints
  └── Tasks

Project
  ├── People
  ├── Opportunities
  └── Tasks

Idea
  └── Optional explicit links to Goal / Company / Project / Opportunity
```

业务关键关系使用明确外键，不使用无法在数据库层保证完整性的通用多态外键。

## Goals 与 Sprint

`goals` 使用 `parent_goal_id` 表达层级；超过 3 层只提醒、不拒绝。Goal 必须有 `deadline` 或 `next_review_at`，并保存 why、success metrics、progress mode、official progress、suggested progress 与 last meaningful progress。

Sprint 有独立周期、kind、status、Primary Outcome 与 review history，因此使用独立 `sprints` 表。Sprint 与 Goal 应支持一个 Primary Goal 和多个 Secondary Goals；Carry Forward 通过 `carried_from_sprint_id` 保留来源。

## Tasks / Today / Ideas

- Task relationships are optional. Task records type, status, Waiting, Delegation, Blocked, estimate, hard deadline and target date separately.
- Actual time reserves optional inferred/manual/focus fields without implementing a full timer in Phase 2.
- Today Plan has at most one One Thing and three Key Tasks. Unfinished assignments are explicit review items and never auto-roll.
- Idea requires only original text and source. Analysis is separate, and conversion stores bidirectional source references.
- Domain 保持 camelCase；Phase 3 Supabase Repository 通过 caller-scoped RPC 映射到 PostgreSQL snake_case。
- 数据库主键使用 UUID；`legacy_local_id` 保留 Phase 2 本地实体标识并用于幂等迁移。

## Opportunity 判断

AI 概率、CEO 概率、CEO 理由和最终结果分开保存，历史判断不得互相覆盖。短期商业价值与长期战略价值是独立字段。

## Audit

`activities` 表达业务活动；`audit_events` 记录核心数据变更。审计事件至少包含操作者、动作、实体、时间和必要的变更摘要。

## Health 与 Learning

V1 只保留轻量基础模型和页面入口，不开发复杂健康或学习管理能力。

## 初始业务实体

FindingMat、曜之岩、长乐防火只在 CEO 确认的 LocalStorage migration 或未来受控初始化流程中创建，不在 migration SQL 中写入生产业务数据。
