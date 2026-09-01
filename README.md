# P_CEO_OS

Personal CEO Operating System 是面向创始人/CEO 的个人战略、注意力与业务管理系统。

P_CEO_OS 负责管理目标、Sprint、任务、想法、公司、联系人、项目、商机、时间投入和决策上下文。FindingMat 是当前最重要的长期事业，但仍然是独立产品；本仓库不实现 FindingMat 的材料数据库、建筑师系统、厂家系统、公共 Wiki、材料 AI 或 Market Intelligence。

## 当前阶段

Phase 1：CEO OS Shell。

当前包含可运行的 Astro Server 骨架、React Islands、Tailwind、Vercel Adapter，以及响应式 App Layout、Dashboard、模块入口、快速想法 Mock 交互、Supabase 客户端边界和 AI Service interface。

所有界面数据均为 Phase 1 Mock。当前没有数据库表、Migration、真实 Auth、真实业务数据或 OpenAI 调用。

## Phase 1 页面

- `/` CEO Dashboard
- `/today` 今日任务
- `/goals`、`/ideas`、`/companies`、`/people`
- `/projects`、`/opportunities`、`/health`、`/learning`

## 技术栈

- Astro Server
- TypeScript strict mode
- React Islands
- Tailwind CSS
- Vercel Adapter
- Supabase PostgreSQL（仅代码边界，尚未连接）
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

Phase 1 不需要填写真实 Supabase 或 OpenAI 凭据即可完成类型检查、测试和构建。

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

任何 Phase 开始前都应先阅读相关文档，完成后执行测试、构建和控制台检查，再进入下一阶段。
