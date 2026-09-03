# P_CEO_OS

Personal CEO Operating System 是面向创始人/CEO 的个人战略、注意力与业务管理系统。

P_CEO_OS 负责管理目标、Sprint、任务、想法、公司、联系人、项目、商机、时间投入和决策上下文。FindingMat 是当前最重要的长期事业，但仍然是独立产品；本仓库不实现 FindingMat 的材料数据库、建筑师系统、厂家系统、公共 Wiki、材料 AI 或 Market Intelligence。

## 当前阶段

稳定版本：`v0.2.0`。当前开发：Phase 3 — Make It Real。

当前包含 Goal → Sprint → Task → Today → Review 核心工作流、Idea 捕获、主动 Mock AI 分析、Audit History，以及响应式 Shell。

Phase 3 增加 Supabase PostgreSQL、Owner Auth、RLS、Cloud Repository、显式 LocalStorage Migration、基础 PWA 与 JSON Export。OpenAI 仍未接入。

## 核心页面

- `/` CEO Dashboard
- `/today` 今日任务
- `/goals`、`/sprints`、`/tasks`、`/ideas`
- `/companies`、`/people`
- `/projects`、`/opportunities`、`/health`、`/learning`

## 技术栈

- Astro Server
- TypeScript strict mode
- React Islands
- Tailwind CSS
- Vercel Adapter
- Supabase PostgreSQL + Auth + RLS
- Vitest
- ESLint + Prettier
- pnpm

## 环境要求

- Node.js `>= 22.12.0`
- pnpm `11.25.0`

## 开始使用

```bash
pnpm install
cp .env.example .env
pnpm dev
```

不配置 Supabase 时，本地开发使用 LocalStorage fallback；生产环境会 fail closed。连接真实 Supabase 时，只把 `PUBLIC_SUPABASE_URL` 和 publishable key 写入本地 `.env` 或 Vercel Secure Environment Variables，绝不提交密钥。

Owner 账号必须在 Supabase Dashboard 后台创建，产品不开放 Sign Up。数据库 migration 位于 `supabase/migrations/`，必须通过受审查的 Supabase migration 流程应用。

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

## 文档

- [产品需求](docs/PRD.md)
- [技术架构](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [AI 权限规则](docs/AI_RULES.md)
- [开发路线图](docs/ROADMAP.md)
- [Phase 2 Business Rules](docs/PHASE_2_BUSINESS_RULES.md)
- [Phase 3 Make It Real](docs/PHASE_3_MAKE_IT_REAL.md)

任何 Phase 开始前都应先阅读相关文档，完成后执行测试、构建和控制台检查，再进入下一阶段。
