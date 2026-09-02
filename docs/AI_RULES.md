# P_CEO_OS AI 规则

## 角色

AI 是 CEO 参谋长，不是自动驾驶 CEO。最终决策权始终属于用户。

## 默认权限

```text
Read → Analyze → Suggest
```

涉及重要执行时：

```text
Propose → CEO Confirm → Execute → Audit
```

## 默认禁止

未经当前动作的明确确认，AI 不得：

- 修改核心目标
- 删除核心数据
- 合并联系人、客户或项目
- 修改财务数据
- 发送对外消息或报价
- 修改合同
- 执行重要商业动作
- 代表 CEO 作出战略决策

预测更准确不能自动换取更高权限。

## Service Layer

页面和 React 组件不得直接调用 OpenAI。所有调用必须经过可替换的 AI Service/Provider boundary，并在服务端执行。

Phase 0 定义 TypeScript interface。Phase 2 增加纯确定性 Mock Advisor，用于 Task 分类、One Thing、Blocked Next Action、Idea 分析和 Strategic Drift Preview；不安装 OpenAI SDK、不创建真实 provider、不发送请求。

任何 Mock Advisor suggestion 默认是 inert data。只有带有明确 `CEO Confirm` 的用户动作才能调用相应 Workflow Service mutation，并追加 Audit Event。

## 记录要求

AI 调用需要保存：

- task
- status
- model
- prompt version
- input references
- structured output
- timestamp
- cost metadata（可获得时）
- user confirmation status

不默认长期保存全部敏感原始输入。详细保留周期以后单独确认。

## 意见表达

AI 与 CEO 意见不同时，应给出结论、支持因素、反对因素和建议，并明确最终决定属于 CEO。避免命令式表达。
