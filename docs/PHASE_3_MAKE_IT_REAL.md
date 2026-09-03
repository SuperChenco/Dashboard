# Phase 3 — Make It Real

## Objective

把 v0.2.0 浏览器原型升级为有身份边界、云端真源、跨设备可访问的 Private Personal CEO OS。

## Scope

- Supabase PostgreSQL 与 Email + Password Owner Auth。
- Astro middleware session restore/refresh 与 protected routes。
- 最小 normalized schema、transactional workflow RPC、RLS 与索引。
- Supabase Repository Adapter；LocalStorage 仅作开发 fallback 和迁移来源。
- CEO 明确确认的幂等迁移向导，不静默上传或删除本地数据。
- Network/session/load/mutation failure、loading、empty、retry 状态。
- Mobile Today 延续 Phase 2 响应式体验。
- 基础 PWA manifest/icons/standalone；不做复杂离线同步。
- Owner JSON export；不做 Import。

## Architecture

```text
Astro middleware → Supabase Auth session
React Island → WorkflowService → WorkflowRepository
                                  ├─ Supabase adapter (production truth)
                                  └─ Local adapter (dev/migration only)
Supabase adapter → save_workflow_state RPC → normalized tables under RLS
```

Mutation 只有 RPC 成功后才触发 UI refresh；失败会显示明确错误，不得伪装保存成功。`save_workflow_state` 是单个 PostgreSQL transaction，避免跨表部分写入。

## Business Rules

Phase 2 的 32 条规则保持不变。AI 仍为确定性 Mock，重要建议仍需 CEO Confirm。Phase 3 只改变身份、持久化和交付边界。

## Data Model

核心表：`profiles`、`companies`、`goals`、`sprints`、`tasks`、`ideas`、`today_plans`、`audit_events`、`migration_records`。

关系表：`goal_company_links`、`sprint_goal_links`、`today_task_links`。所有私人业务行归属于 `user_id`；核心实体保留 `deleted_at`；数据库时间点统一 `timestamptz`，业务纯日期使用 `date`。

## Security

- 浏览器只接收 Supabase URL 与 publishable key；没有 service-role key。
- 产品无 Sign Up、Invite 或 Team UI，Owner 由 Supabase 后台创建。
- 每个 exposed table 启用 RLS，并撤销 anon table access。
- Owner 数据策略明确覆盖 SELECT / INSERT / UPDATE / DELETE。
- `audit_events` 客户端仅允许 SELECT / INSERT，禁止 UPDATE / DELETE。
- Workflow RPC 使用 `SECURITY INVOKER`，不绕过调用者 RLS。
- 生产环境缺少 Supabase 配置时 fail closed。

## LocalStorage Migration

```text
Detect → Preview → CEO Confirm → Validate → Transform
→ Upload → Verify → Complete
```

迁移通过 source checksum 生成稳定 `migration_key`，重复执行不会产生重复记录。完成后 LocalStorage 仍保留，不自动删除。

## Tests

- Phase 2 Domain Rules regression。
- Supabase Repository session/load/save failure tests。
- Migration checksum 与实体完整性验证。
- SQL schema/RLS/audit/RPC security contract tests。
- Typecheck、Lint、Format、Build。

真实项目接入后还必须执行：migration apply、两用户 RLS 隔离、session persistence、电脑/手机互改、Vercel production 和真机 PWA 验收。

## Known Limitations

- 当前仓库不包含真实 Supabase/Vercel credentials，也不会自动创建外部账号。
- Cross-device 是服务器最新状态 + refresh/focus reload + last valid write wins，不是协同编辑。
- 不包含复杂 offline DB、push notification 或 service worker background sync。
- JSON Import 延后。

## External Activation Checklist

以下步骤需要 CEO 在自己的平台账号内完成，凭据不得粘贴到聊天或提交 Git：

1. 创建或选择 Supabase project，并关闭公开 Sign Up。
2. 在 Supabase Auth 后台创建 Owner；RLS 验收时另建一个临时测试用户。
3. 审查并应用 `supabase/migrations/202609030001_phase3_core.sql`。
4. 把 Supabase URL 与 publishable key 写入本地 `.env`。
5. 完成本地登录、迁移预览/确认、导出、两用户隔离测试。
6. 在 Vercel Project 中配置同名 secure environment variables 并部署 Preview。
7. 用电脑与手机验证 session persistence 和双向刷新同步。

## Next Phase Handoff

Phase 4 才接真实 OpenAI。API Key 仅 server-side；Mock provider 继续服务 dev/test。任何重要 mutation 仍遵循 Proposal → CEO Confirm → Execute → Audit。
