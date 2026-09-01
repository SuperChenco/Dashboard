# P_CEO_OS V1 产品需求与技术架构文档

> 本文件是 P_CEO_OS V1 的产品需求基准；技术细化分别记录在同目录的架构、数据模型、AI 规则与路线图文档中。

**Product Name:** P_CEO_OS\
**Full Name:** Personal CEO Operating System\
**Version:** V1.0\
**Document Status:** MVP / Architecture Baseline\
**Primary User:** Founder / CEO\
**Core Long-term Project:** FindingMat\
**Document Purpose:** 作为 P_CEO_OS 的产品、设计、技术和 AI
开发唯一基准文档之一，供 Codex / Cursor 按阶段实施。

------------------------------------------------------------------------

# 0. 文档使用规则

## 0.1 决策标记

本文档中的内容分为三类：

-   **【已确认】**：来自产品讨论，视为当前产品决策。
-   **【架构建议】**：为了让系统可以落地，由产品/架构侧补充的最佳实践，后续可以调整。
-   **【未来规划】**：V1 不实现，只保留接口或数据模型兼容性。

如果【架构建议】与现有代码或实际环境冲突，**先报告冲突，不要擅自大规模重构。**

## 0.2 Codex 开发总原则

1.  不要一次性开发全部功能。
2.  每个 Phase 独立完成、运行、测试后再进入下一 Phase。
3.  不删除已有功能，除非得到明确授权。
4.  不擅自更换技术栈。
5.  不为了"看起来完整"而增加无实际价值的依赖。
6.  重要数据结构必须可迁移、可审计、可追踪。
7.  AI 默认是"参谋"，不是"老板"。
8.  AI 可以分析、建议、准备，但重要执行默认必须经过用户确认。
9.  不允许 AI 静默修改核心战略、客户、项目、财务或知识事实。
10. 所有核心业务数据的修改都应该可追踪。

------------------------------------------------------------------------

# 1. Project Overview

## 1.1 产品定位

P_CEO_OS 是一个面向创始人/CEO 的 Personal CEO Operating System。

它不是传统 Todo App，也不是 CRM、ERP 或单纯知识库。

核心目标：

> **帮助 CEO 管理自己的注意力、目标、事业、客户、项目、机会、想法和 AI
> 协作，并持续发现战略偏航。**

核心关系：

> **用户 = CEO**\
> **AI = 参谋长 / Advisor**\
> **P_CEO_OS = 总控制台**\
> **FindingMat = 当前最重要的长期事业**

## 1.2 核心价值

系统主要解决：

1.  事情太多，注意力被切碎。
2.  重要但不紧急的长期目标容易被短期业务挤压。
3.  想法很多，但容易沉没在微信、聊天记录和信息流中。
4.  客户、项目、商机、公司之间缺乏统一视图。
5.  AI 可以执行大量工作，但缺少一个稳定的个人业务上下文。
6.  需要一个敢于指出"今天很忙，但价值不高"的系统。
7.  需要把长期商业判断、经验和结果逐渐沉淀为可复用的个人商业判断模型。

## 1.3 核心产品原则

### 原则一：AI 是参谋，不是老板

AI 可以： - 发现问题 - 分析数据 - 给出建议 - 发现机会 - 提醒战略偏航 -
模拟历史判断

但最终决策权属于用户。

### 原则二：数据自动产生，用户主要做判断

尽量减少手工录入。

### 原则三：记录低摩擦

用户产生一个想法时，应该能够立即保存，不需要先分类。

### 原则四：重要数据不能被 AI 擅自修改

AI 可以提出： \> "可能是同一个项目。"

但核心实体合并必须经过用户确认。

### 原则五：保护注意力，而不是制造更多任务

系统的目标不是让用户每天完成更多任务，而是帮助用户把时间投入到更高价值的事情。

------------------------------------------------------------------------

# 2. 用户长期目标模型

## 2.1 人生方向

【已确认】

用户希望通过事业成功获得更大的选择权，而不是单纯追求工作量。

长期理想状态：

-   上午工作
-   下午自由
-   每年 60 天以上用于旅行、陪家人和个人生活
-   改善住房环境
-   让家庭成员生活更加方便
-   持续学习 AI 和新技术
-   FindingMat 成为长期核心事业

## 2.2 三年方向

【已确认】

个人年净收入目标：

> 100 万人民币以上

主要事业方向：

> FindingMat

现金流和现有业务：

> 曜之岩、长乐防火等

## 2.3 战略原则

短期： \> 重要客户机会可以优先，FindingMat 可以暂时让路。

长期： \> 如果 FindingMat 连续被短期业务挤压，系统必须提醒。

如果一个目标连续 4 周没有推进：

> AI 分析原因 → 提供方案 → 用户选择： - 继续 - 降级 - 暂停 - 放弃

------------------------------------------------------------------------

# 3. Product Information Architecture

## 3.1 V1 核心模块

左侧主导航：

1.  Today
2.  Goals
3.  Ideas
4.  Companies
5.  People
6.  Projects
7.  Opportunities
8.  Health
9.  Learning

顶部或全局入口：

> **+ 新想法**

未来模块：

-   AI Advisor
-   Knowledge
-   Finance
-   Analytics
-   Market Intelligence

## 3.2 首页 Dashboard

首页必须回答：

> **"今天，我最应该把注意力放在哪里？"**

建议结构：

### 顶部

-   日期
-   当前核心状态
-   `+ 新想法`
-   搜索

### 主区域

#### Today

显示： - 今日重要任务 - 进行中任务 - 已完成任务 - 延期任务

#### Strategic Goals

显示： - 年度目标 - 季度目标 - 当前 Sprint - 目标进度

#### Business

显示： - FindingMat - 曜之岩 - 长乐防火 - 其他业务

重点展示： - 本周关键事项 - 商机 - 进度 - 是否偏航

#### AI Brief

V1 可以先做为静态区域，后续接 AI：

-   今日最重要事项
-   当前战略风险
-   被忽视的目标
-   高价值机会

#### Time

未来显示： - 黄金时间使用情况 - 时间流向 - 可 AI 化任务 - 低价值时间

------------------------------------------------------------------------

# 4. Ideas 想法系统

## 4.1 核心入口

首页最重要的快速入口：

> **+ 新想法**

输入后默认：

> **只保存，不分析。**

用户主动点击：

> **AI 分析**

AI 才开始分析。

## 4.2 想法来源

V1： - Web 输入

未来： - 手机 - 微信 - 语音 - 快捷入口

## 4.3 想法排序

默认：

> 最新

允许切换：

-   AI 价值
-   最近考虑
-   公司 / 项目

## 4.4 想法生命周期

``` text
New Idea
    ↓
Saved
    ↓
AI Analysis（用户主动）
    ↓
可选：
Project / Task / Opportunity / Knowledge
```

重要原则：

> 有价值但现在不做的想法，不自动创建提醒、不自动创建任务。

它继续留在 Ideas。

如果 6 个月没有查看：

> 只提醒一次是否删除。

------------------------------------------------------------------------

# 5. Goals 目标系统

## 5.1 层级

``` text
Life Direction
    ↓
3-Year Goal
    ↓
Annual Goal
    ↓
Quarter Goal
    ↓
Sprint
    ↓
Task
```

## 5.2 目标状态

-   Active
-   At Risk
-   Stalled
-   Completed
-   Paused
-   Abandoned

## 5.3 战略纠偏

如果目标连续 4 周没有推进：

AI 生成：

-   当前状态
-   停滞原因
-   被什么挤压
-   建议解决方案

然后用户选择：

> Continue / Downgrade / Pause / Abandon

------------------------------------------------------------------------

# 6. Task 任务系统

## 6.1 任务原则

任务不是系统的核心，而是目标和项目的执行单元。

任务应该关联：

-   Goal
-   Company
-   Project
-   Opportunity
-   Person
-   Idea

## 6.2 AI任务清理

如果系统发现：

> 同时存在大量任务，但完成率较低

AI 分析：

-   删除
-   延期
-   委派
-   AI执行

但不自动删除。

## 6.3 AI执行权限

【已确认】

AI发现适合自己执行的任务：

> 先提出执行方案 → 用户确认 → 执行

默认流程：

``` text
AI发现任务
↓
AI生成执行计划
↓
用户确认
↓
AI执行
↓
输出结果
↓
用户审核
```

------------------------------------------------------------------------

# 7. Companies 公司系统

V1 需要支持多公司。

初始业务实体包括：

-   FindingMat
-   曜之岩
-   长乐防火
-   其他业务

每家公司包含：

-   公司信息
-   战略目标
-   项目
-   客户
-   联系人
-   商机
-   任务
-   关键指标
-   AI Insights

重要：

> FindingMat 是 CEO OS
> 中最重要的长期事业，但它仍然应该是一个独立产品系统。

CEO OS 管理 FindingMat 的： - 战略 - 目标 - Sprint - 时间投入 -
商业机会 - 用户增长 - 关键指标

FindingMat 本身以后拥有独立： - 材料数据库 - 建筑师 - 厂家 - 项目 - AI -
公共 Wiki - Market Intelligence

------------------------------------------------------------------------

# 8. People / CRM

## 8.1 客户档案

客户画像包括：

### 基础信息

-   公司
-   联系人
-   职位
-   联系方式

### 企业信息

-   公司背景
-   业务规模
-   项目类型
-   地区
-   行业影响力

### 关系历史

-   沟通记录
-   最近联系
-   已发送资料
-   历史项目

### 当前商业状态

-   当前项目
-   项目金额
-   需求
-   关注点
-   异议
-   成交概率
-   下一步动作

## 8.2 AI 成交概率

AI 自动计算：

> 成交概率 %

必须同时给出原因。

用户可以手动修改。

例如：

``` text
AI：65%
用户：30%

AI：
为什么你判断 30%？
```

用户回答后保存：

> AI判断 + 用户判断 + 用户理由 + 最终结果

未来用于形成：

> Personal Business Judgment Model

## 8.3 实体关联规则

如果 AI 发现：

> 两个联系人可能属于同一家公司

AI 只能：

> 建议关联 → 用户确认

如果 AI 发现两个项目可能是同一个项目：

> 建议合并 → 用户确认

不能自动合并核心商业实体。

------------------------------------------------------------------------

# 9. Projects / Opportunities

## 9.1 项目结构

``` text
Company
  ↓
Person / Customer
  ↓
Project
  ↓
Opportunity
  ↓
Deal
```

## 9.2 Opportunity

每个商机至少包含：

-   标题
-   来源
-   公司
-   项目
-   联系人
-   预计金额
-   成交概率
-   短期商业价值
-   长期战略价值
-   时间成本
-   当前阶段
-   下一步

## 9.3 AI机会判断

AI 可以发现：

> 这个机会更适合哪家公司？

输出：

``` text
AI建议：
优先进入 FindingMat + 长乐防火

理由：
...
```

AI不能自动把机会转移到某公司。

## 9.4 机会价值模型

至少展示两个维度：

-   Short-term Business Value
-   Long-term Strategic Value

AI可以建议：

> Now / Later

但最终由 CEO 决定。

------------------------------------------------------------------------

# 10. Time & Attention System

## 10.1 黄金时间

用户黄金时间：

> 08:00--10:00

AI每天可以建议：

> 今天最值得投入在哪里？

但用户最终决定。

## 10.2 战略挤压提醒

如果 FindingMat 连续一周黄金时间明显被其他业务占用：

AI主动提醒：

> FindingMat 正在被短期业务挤压。

如果持续 4 周：

> 进入战略纠偏流程。

## 10.3 时间自动记录

【已确认】

用户不希望手动计时。

系统未来通过： - 任务操作 - 项目操作 - 页面活动 - 日历 - AI任务
等信息尽可能自动推断时间流向。

【架构建议】

V1 不需要实现复杂的电脑全局监控。

先记录：

-   Task started
-   Task completed
-   Project activity
-   AI execution
-   Calendar activity（未来）

避免把系统做成监控软件。

## 10.4 时间分析

AI最终需要回答：

> 我的时间被什么吃掉了？

并识别：

-   高价值
-   业务维持
-   可 AI 化
-   可委派
-   低价值
-   未分类

------------------------------------------------------------------------

# 11. Health / Life / Learning

## 11.1 Health

保持轻量：

-   体重
-   运动
-   睡眠

如果出现：

> 睡眠不足 + 工作效率下降

AI：

> 数据提示 → 提醒 → 建议调整第二天计划

重要客户项目优先级可以保留。

外围任务可以： - 延期 - 委派 - AI化

## 11.2 Learning

记录： - AI - Codex - 日语 - 其他学习项目

## 11.3 Life

未来可以记录： - 家庭 - 住房 - 旅行 - 自由时间

但 V1 不做复杂生活管理。

------------------------------------------------------------------------

# 12. AI Advisor

## 12.1 AI角色

AI是：

> **CEO参谋长**

不是自动驾驶 CEO。

## 12.2 AI可以做

-   分析
-   预测
-   推荐
-   风险提醒
-   商业机会发现
-   时间分析
-   战略偏航提醒
-   任务优化
-   客户 briefing
-   项目总结
-   决策模拟
-   复盘

## 12.3 AI不能默认做

涉及以下事项，默认需要用户确认：

-   修改核心目标
-   删除核心数据
-   合并客户
-   合并项目
-   修改财务数据
-   发送对外消息
-   发报价
-   修改合同
-   执行重要商业动作
-   代表 CEO 做战略决策

## 12.4 AI意见表达

当 AI 与 CEO 意见不同：

格式：

``` text
AI观点
结论：……

支持你判断的因素
1.
2.
3.

反对你判断的因素
1.
2.
3.

建议：
……

最终决定：
CEO
```

不要使用：

> "你不应该......"

而应该：

> "基于目前数据，我有一个不同观点。"

------------------------------------------------------------------------

# 13. Personal Business Judgment Model

【未来规划】

系统长期记录：

``` text
Situation
↓
AI Judgment
↓
CEO Judgment
↓
CEO Reason
↓
Final Result
↓
Outcome
```

系统分析：

-   AI什么时候更准确
-   CEO什么时候更准确
-   哪些类型的问题 CEO判断更强
-   哪些类型 AI判断更强

最终形成：

> **AI + CEO Hybrid Judgment Model**

注意：

不能简单把"AI连续预测正确"自动转化为更高权限。

这是辅助决策模型，不是权限升级模型。

------------------------------------------------------------------------

# 14. FindingMat Integration

## 14.1 FindingMat 的定位

FindingMat 的终极愿景：

> **建筑行业的 ChatGPT**

核心底层：

> 公共建筑材料知识库 + AI材料决策 + 项目需求网络

核心闭环：

``` text
建筑师
↓
材料需求
↓
AI理解
↓
材料推荐
↓
厂家匹配
↓
建筑师选择
↓
项目
↓
成交
↓
真实数据
↓
Market Intelligence
```

## 14.2 CEO OS 对 FindingMat 的管理

CEO OS 管：

-   FindingMat战略
-   Goals
-   Sprint
-   时间投入
-   关键指标
-   建筑师增长
-   项目机会
-   商业结果

FindingMat 独立产品管：

-   Materials
-   Material Sources
-   Manufacturers
-   Architects
-   Projects
-   AI material intelligence
-   Public Wiki
-   Reviews
-   Market Intelligence

## 14.3 MVP五级验证

必须按顺序逐步验证：

### A

500+材料数据库上线

### B

AI材料问答真正好用

### C

第一个真实建筑师持续使用

### D

第一个真实项目通过 FindingMat 产生

### E

第一次产生收入

哪怕第一笔收入只有：

> ¥1,000

也视为商业闭环首次验证。

------------------------------------------------------------------------

# 15. FindingMat 数据可信度原则

【未来由 FindingMat 实现，但 CEO OS 需要兼容】

材料数据状态：

-   AI生成 / 待验证
-   已验证
-   高可信
-   厂家声明
-   用户经验
-   存在冲突

## 15.1 待验证数据

可以用于：

> 一般知识问答

但不能直接用于：

> 高风险技术决策 / 最终推荐

## 15.2 数据冲突

例如：

厂家资料：1.20\
检测报告：1.25\
第三方网站：1.10

系统：

1.  权威来源优先
2.  所有来源保留
3.  AI给推荐值
4.  保留历史版本

## 15.3 厂家更新

厂家提交新数据：

> 不直接覆盖已验证数据。

流程：

``` text
厂家提交
↓
待验证
↓
AI比较新旧数据
↓
要求证明文件
↓
人工/规则确认
↓
更新正式数据
↓
保留历史版本
```

------------------------------------------------------------------------

# 16. FindingMat Public Wiki

【未来规划】

专业用户可以纠错。

普通用户不能直接修改核心材料事实。

建筑师贡献： - 纠错 - 材料资料 - 使用经验 - 项目照片 - 项目说明 -
遇到的问题 - 最终评价

AI可以自动生成：

> 《XX材料项目应用案例》

但：

> **必须经过建筑师确认后公开。**

案例商业使用：

> 厂家必须再次获得建筑师授权。

原则：

> 内容贡献权 ≠ 商业使用权

------------------------------------------------------------------------

# 17. Market Intelligence

【未来规划】

FindingMat 未来可以形成：

> Market Intelligence

来源：

-   材料搜索
-   项目需求
-   建筑师行为
-   厂家响应
-   成交数据

商业原则：

> **卖市场规律，不卖用户隐私。**

可以商业化：

-   匿名聚合数据
-   行业报告

不能商业化泄露：

-   单个建筑师
-   单个客户
-   单个项目
-   具体私人需求

第一阶段产品：

> **免费行业报告 + 付费完整版行业报告**

但项目撮合应是更优先的商业收入方向。

------------------------------------------------------------------------

# 18. Technical Architecture

## 18.1 总体架构

``` text
                 User
                   │
       ┌───────────┴───────────┐
       │                       │
     Desktop                  Mobile
       │                       │
       └───────────┬───────────┘
                   ▼
              P_CEO_OS Web
                   │
                   ▼
          Application / API Layer
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
   Supabase     OpenAI API    External APIs
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
DB   Auth  Storage
```

## 18.2 数据库

【已确认方向】

> Supabase + PostgreSQL

用于：

-   用户
-   目标
-   任务
-   想法
-   公司
-   联系人
-   项目
-   商机
-   决策
-   活动
-   时间记录
-   AI分析
-   学习
-   健康

## 18.3 Authentication

> Supabase Auth

V1 支持： - Email - Magic Link 或密码登录

具体方式由实际开发环境确定。

## 18.4 Storage

> Supabase Storage

用于未来： - PDF - 图片 - 客户资料 - 项目文件 - AI生成文件

## 18.5 AI

使用 OpenAI API。

建议通过后端统一封装 AI 调用，不允许前端直接暴露 API Key。

OpenAI 当前官方文档显示，最新模型可通过 Responses API 和官方 SDK
使用，因此项目应把 AI Provider 做成可替换的 service
layer，而不是把模型调用散落在页面组件中。 citeturn0search0

建议结构：

``` text
src/
  services/
    ai/
      ai.service.ts
      prompts/
      schemas/
```

AI调用必须记录：

-   task
-   input reference
-   model
-   output
-   timestamp
-   cost metadata（如可获得）
-   user confirmation status

## 18.6 前端

【架构建议】

继续采用用户已经熟悉的：

> Astro + TypeScript + Tailwind CSS

对于高度交互的 Dashboard，使用 React Islands / client components。

不要为了 V1 引入复杂状态管理框架。

如果实际开发发现 Astro + islands
明显阻碍核心交互，再提出迁移建议，不能直接切换。

## 18.7 Runtime

建议：

> Node.js \>= 22.12

------------------------------------------------------------------------

# 19. Suggested Project Structure

``` text
P_CEO_OS/
│
├── README.md
├── package.json
├── astro.config.mjs
├── tsconfig.json
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── AI_RULES.md
│   └── ROADMAP.md
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── tasks/
│   │   ├── ideas/
│   │   ├── companies/
│   │   ├── people/
│   │   ├── projects/
│   │   ├── opportunities/
│   │   ├── health/
│   │   └── learning/
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── utils/
│   │   └── validation/
│   │
│   ├── services/
│   │   ├── ai/
│   │   ├── goals/
│   │   ├── ideas/
│   │   ├── crm/
│   │   └── opportunities/
│   │
│   ├── types/
│   │
│   └── styles/
│
└── supabase/
    ├── migrations/
    ├── seed/
    └── functions/
```

------------------------------------------------------------------------

# 20. Initial Data Model

建议核心表：

``` text
profiles
companies
goals
tasks
ideas
people
projects
opportunities
decisions
activities
time_logs
ai_insights
ai_runs
health_logs
learning_items
```

## 20.1 关系

``` text
Company
 ├── People
 ├── Projects
 ├── Opportunities
 └── Tasks

Goal
 └── Tasks

Person
 ├── Projects
 ├── Opportunities
 └── Activities

Project
 ├── People
 ├── Opportunities
 └── Tasks

Idea
 └── optional links:
       Company
       Project
       Goal
       Opportunity
```

## 20.2 Audit

核心实体必须记录：

-   created_at
-   updated_at
-   created_by
-   updated_by

涉及 AI 建议的对象增加：

-   ai_generated
-   ai_confidence
-   ai_reason
-   confirmed_by_user
-   confirmed_at

------------------------------------------------------------------------

# 21. Security & Permission

## 21.1 基本原则

用户的数据默认只属于该用户。

使用 Supabase Row Level Security。

每条核心业务数据都必须有：

> user_id / owner_id

## 21.2 AI权限

AI默认：

> Read → Analyze → Suggest

重要执行：

> Confirm → Execute

## 21.3 对外动作

未来涉及： - Email - 微信 - CRM更新 - 报价 - 合同 - 项目状态 - 财务

必须设计 confirmation step。

------------------------------------------------------------------------

# 22. UI / UX Design System

## 22.1 视觉方向

【已确认】

用户偏好：

-   极简
-   白色背景
-   浅灰侧边栏
-   黑灰文字
-   少量状态色
-   Linear / ChatGPT 风格
-   清爽
-   高信息密度但不拥挤

避免：

-   五颜六色 Dashboard
-   传统 ERP 风格
-   大量卡片
-   巨型 KPI 数字墙
-   复杂动画
-   过度装饰

## 22.2 首页核心交互

最重要按钮：

> **+ 新想法**

其次：

> Today

第三：

> AI Brief

## 22.3 响应式

必须支持：

-   Desktop
-   Tablet
-   Mobile

移动端优先保证：

-   新想法
-   Today
-   Goals
-   Opportunities
-   People

可使用。

------------------------------------------------------------------------

# 23. V1 Development Roadmap

## Phase 0：Project Foundation

目标：

-   初始化项目
-   确认技术栈
-   配置 Tailwind
-   配置 Supabase
-   建立环境变量
-   建立 docs
-   建立基础 Layout
-   确认 build

完成标准：

``` text
npm install
npm run dev
npm run build
```

均正常。

------------------------------------------------------------------------

## Phase 1：CEO OS Shell

开发：

-   App Layout
-   Sidebar
-   Header
-   Dashboard
-   Responsive
-   Empty states

不接复杂 AI。

------------------------------------------------------------------------

## Phase 2：Goals + Tasks + Ideas

优先：

1.  Goals
2.  Tasks
3.  Ideas

核心体验：

> -   新想法 → 保存

然后：

> AI分析

先可以使用 mock AI response。

------------------------------------------------------------------------

## Phase 3：Companies + People + Projects + Opportunities

建立核心商业数据关系。

实现：

-   公司
-   联系人
-   项目
-   商机

------------------------------------------------------------------------

## Phase 4：Supabase Real Data

把 mock 数据替换成真实数据库。

完成：

-   Auth
-   RLS
-   CRUD
-   migrations
-   seed

------------------------------------------------------------------------

## Phase 5：AI Advisor V1

实现：

-   AI分析想法
-   AI任务整理建议
-   AI目标停滞分析
-   AI商机分析
-   AI客户 briefing

所有重要动作：

> Confirm first

------------------------------------------------------------------------

## Phase 6：Time / Attention

实现：

-   activity log
-   task timing
-   basic time analysis
-   strategic drift detection

------------------------------------------------------------------------

## Phase 7：FindingMat Management

CEO OS开始真正管理 FindingMat：

-   FindingMat Goal
-   Sprint
-   KPI
-   Project
-   Opportunity
-   Time investment
-   Strategic alerts

------------------------------------------------------------------------

# 24. V1 明确不做

为了防止 Codex 过度开发，V1 不做：

-   复杂财务系统
-   自动交易
-   自动发邮件
-   自动发微信
-   自动修改合同
-   全电脑监控
-   复杂健康管理
-   社交网络
-   完整 FindingMat 产品
-   FindingMat 公共 Wiki
-   FindingMat 厂家交易系统
-   Market Intelligence Dashboard
-   自动商业判断替代
-   多人企业权限体系

------------------------------------------------------------------------

# 25. V1 Acceptance Criteria

P_CEO_OS V1 至少必须做到：

### 目标

用户可以：

> 创建目标 → 创建 Sprint → 创建任务 → 完成任务

### 想法

用户可以：

> `+ 新想法` → 保存 → 查看 → 主动 AI 分析

### 公司

用户可以：

> 创建 / 查看公司

### 人

用户可以：

> 创建联系人 → 关联公司

### 项目

用户可以：

> 创建项目 → 关联公司 / 联系人

### 商机

用户可以：

> 创建商机 → 查看金额 / 概率 / 战略价值

### Dashboard

用户打开系统后能够在 30 秒内回答：

1.  今天最重要的事情是什么？
2.  我的长期目标有没有偏航？
3.  FindingMat现在怎么样？
4.  有没有值得注意的商机？
5.  有没有明显需要我处理的问题？

------------------------------------------------------------------------

# 26. CEO OS 的核心成功标准

不是：

> "功能很多。"

而是：

> **用户愿意每天打开它。**

更具体：

### 第一阶段

每天使用 Today + Ideas。

### 第二阶段

Goals + Companies + Opportunities 成为日常工具。

### 第三阶段

AI Advisor 开始提供真正有价值的判断。

### 第四阶段

系统可以发现：

> "你很忙，但价值不高。"

### 第五阶段

系统可以发现：

> "FindingMat 连续被短期业务挤压。"

### 最终

系统能够逐渐回答：

> **"在当前所有事情中，作为 CEO，你现在最值得把注意力放在哪里？"**

------------------------------------------------------------------------

# 27. 给 Codex 的最终执行规则

Codex 在任何开发任务前必须：

1.  阅读 README
2.  阅读 docs/PRD.md
3.  阅读 docs/ARCHITECTURE.md
4.  阅读相关数据模型
5.  检查现有代码
6.  输出实施计划
7.  等待确认后再进行高风险修改

每个 Phase 完成后：

``` text
Implement
↓
Run tests
↓
Run build
↓
Check console errors
↓
Summarize changes
↓
Wait
```

不要：

``` text
Implement everything at once
```

------------------------------------------------------------------------

# 28. 第一开发任务

**现在 Codex 不应该直接开发全部 CEO OS。**

第一任务：

> **初始化 P_CEO_OS 工程，并建立项目文档与技术骨架。**

第一阶段只允许：

-   检查环境
-   初始化/确认 Astro
-   TypeScript
-   Tailwind
-   Supabase client 基础配置
-   docs
-   Layout
-   基础 Dashboard shell

不要开发：

-   AI Advisor
-   CRM
-   FindingMat
-   复杂数据库
-   自动化 Agent

------------------------------------------------------------------------

# 29. 产品北极星

P_CEO_OS 最终应该成为：

> **一个越来越懂 CEO 的个人操作系统。**

它记录：

> 你想做什么\
> 你正在做什么\
> 你为什么这么判断\
> 你花了多少时间\
> 最终结果是什么

然后逐渐形成：

> **你的目标系统 + 业务系统 + 时间系统 + 想法系统 + AI参谋系统 +
> 个人商业记忆**

而 FindingMat 是这个系统当前最重要的长期事业。

最终关系：

``` text
                    CEO
                     │
                     ▼
              ┌─────────────┐
              │  P_CEO_OS   │
              │ Personal OS │
              └──────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
     曜之岩        长乐防火      FindingMat
       │             │             │
       └─────────────┼─────────────┘
                     │
                 AI Advisor
                     │
                     ▼
             Decision Intelligence
```

最终目标不是：

> **让 CEO 管更多事情。**

而是：

> **让 CEO 把更多时间留给真正值得亲自做的事情。**
