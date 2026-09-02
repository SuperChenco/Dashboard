# P_CEO_OS V1 技术架构

## 状态

- 基线：CEO 已确认
- 当前阶段：Phase 2（已实现，等待 CEO 验收）
- 部署目标：Vercel

## 总体架构

```text
Browser
  → Astro Server on Vercel
    → Application / Domain Services
      ├── Supabase PostgreSQL / Auth / Storage
      ├── AI Service Layer
      └── Future external integrations
```

项目采用单仓库、模块化单体。V1 不引入微服务、ORM、Next.js 或全局状态管理框架。

## 前端

- Astro 使用 `output: server`。
- 使用官方 Vercel Adapter。
- 页面和 Layout 优先使用 Astro。
- 只有需要交互的局部区域使用 React Islands。
- Tailwind CSS 采用官方 Vite 插件和 CSS-first 配置。
- V1 不引入 Redux、Zustand 等全局状态方案。

### Phase 1 UI Shell

- `AppLayout` 统一组合桌面 Sidebar、页面 Header、移动端 Drawer 与底部快捷导航。
- 页面与静态信息面板使用 Astro，只有快速想法 Modal 和移动导航使用 React Islands。
- Mock Data 集中在 `src/data/mock`，页面与组件不散落业务样例数据。
- Tailwind CSS-first `@theme` 定义最小颜色、间距、圆角、阴影和字号 token。
- 所有 Phase 1 保存反馈明确标记为 Mock，不暗示数据库持久化。

### Phase 2 Core Workflow

- `src/domain` 保存纯 TypeScript 实体和业务规则，不依赖 React、Astro 或 Supabase。
- `WorkflowService` 编排 mutation、确认边界和本地 Audit Event。
- 页面依赖 `WorkflowRepository` contract；当前实现是浏览器 LocalStorage adapter。
- Goals、Sprints、Tasks、Today 和 Ideas 采用页面级 React Islands；全局 Shell 仍由 Astro 管理。
- Dashboard 把 Current Primary Sprint、Today's One Thing 与 Attention 提升为第一层信息。
- Mock Advisor 使用确定性规则，明确显示 `Mock AI`，不构建真实 Provider。

## 服务边界

页面不直接包含 Supabase 查询或 OpenAI 调用。业务能力通过 `src/services` 暴露，基础设施连接放在 `src/lib` 或后续 repository implementation 中。

```text
Page / Component
  → Domain Service
    → Repository contract
      → Mock or Supabase implementation
```

Phase 2 和 Phase 3 使用 mock repository 时，页面依赖相同 contract，Phase 4 才替换为真实 Supabase implementation。Phase 2 LocalStorage 不是数据库，也不承担多用户、同步、加密或生产可靠性。

## Supabase

Phase 0–2 只建立：

- 环境变量 schema
- Browser client factory
- Request-scoped server client factory
- 未配置时的明确失败行为

Phase 0–2 不创建 Supabase 项目、表、Migration、Auth 页面、RLS 或业务数据。

## FindingMat 边界

P_CEO_OS 仅管理 FindingMat 的战略、Goals、Sprint、KPI、项目、商机、时间投入和战略风险。

FindingMat 的材料数据库、建筑师系统、厂家系统、公共 Wiki、材料 AI 和 Market Intelligence 必须留在独立产品边界内。未来集成通过明确的 API/adapter 完成，不共享未经定义的内部表。

## 决策记录

后续影响多个模块的技术决策应写入 `docs/decisions/`，记录背景、选择、替代方案和影响。
