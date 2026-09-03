import type { WorkflowState } from '@/domain/workflow/types';

function dateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function createInitialWorkflowState(
  now = new Date().toISOString(),
): WorkflowState {
  const goalId = 'goal-findingmat-users';
  const sprintId = 'sprint-findingmat-foundation';
  const taskOne = 'task-material-model';
  const taskWaiting = 'task-sichuan-followup';
  const taskBlocked = 'task-sdc-decision';
  const taskUnfinished = 'task-yesterday-review';
  const todayId = `today-${dateOffset(0)}`;

  return {
    version: 1,
    goals: [
      {
        id: goalId,
        title: 'FindingMat 获得第一批稳定建筑师用户',
        description: '通过真实使用验证产品价值，而不是只完成产品功能。',
        why: '验证 FindingMat 是否真正解决建筑师材料决策问题。',
        successMetrics: ['持续使用建筑师 ≥ 100', '30 日留存率 ≥ 30%'],
        deadline: dateOffset(180),
        status: 'active',
        progress: 42,
        progressMode: 'milestones',
        suggestedProgress: 38,
        companyIds: ['company-findingmat'],
        lastMeaningfulProgressAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    sprints: [
      {
        id: sprintId,
        title: 'FindingMat · MVP Foundation',
        kind: 'primary',
        status: 'active',
        primaryGoalId: goalId,
        secondaryGoalIds: [],
        primaryOutcome: '完成 Material Decision MVP 数据模型与验证闭环',
        secondaryOutcomes: ['完成首轮建筑师验证问题清单'],
        startDate: dateOffset(-1),
        endDate: dateOffset(4),
        progress: 58,
        goldenTime: '08:00–10:00',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sprint-maintenance-review',
        title: 'Business Maintenance · Previous Cycle',
        kind: 'maintenance',
        status: 'review',
        secondaryGoalIds: [],
        primaryOutcome: '完成本周期关键客户跟进',
        secondaryOutcomes: [],
        startDate: dateOffset(-8),
        endDate: dateOffset(-2),
        progress: 70,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      {
        id: taskOne,
        title: '完成 Material Decision 数据模型',
        notes: '明确核心实体、约束与验证路径。',
        type: 'strategic',
        status: 'in-progress',
        relations: [
          { type: 'goal', entityId: goalId, label: 'FindingMat 稳定用户' },
          { type: 'sprint', entityId: sprintId, label: 'MVP Foundation' },
          {
            type: 'company',
            entityId: 'company-findingmat',
            label: 'FindingMat',
          },
        ],
        estimatedMinutes: 90,
        targetDate: dateOffset(0),
        todayAssignmentCount: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskUnfinished,
        title: '复核昨日未完成的建筑师访谈提纲',
        notes: '不可自动滚入 Today，需要 CEO 决定。',
        type: 'strategic',
        status: 'todo',
        relations: [
          { type: 'goal', entityId: goalId, label: 'FindingMat 稳定用户' },
        ],
        todayAssignmentCount: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskWaiting,
        title: '跟进四川代理商反馈',
        notes: '',
        type: 'maintenance',
        status: 'waiting',
        relations: [
          { type: 'company', entityId: 'company-yaozhiyan', label: '曜之岩' },
        ],
        waiting: {
          waitingFor: '四川代理商',
          waitingOn: '确认下一轮沟通时间',
          followUpAt: dateOffset(0),
          lastActionAt: now,
        },
        delegation: {
          responsibility: '渠道反馈收集',
          assignee: '渠道同事',
          followUpAt: dateOffset(0),
          myRole: 'Final Review',
        },
        todayAssignmentCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskBlocked,
        title: '确认 SDC 产品资料发布口径',
        notes: '',
        type: 'normal',
        status: 'blocked',
        relations: [
          { type: 'company', entityId: 'company-changle', label: '长乐防火' },
        ],
        blocker: {
          blocker: '缺少最终技术确认',
          blockedAt: now,
          nextAction: '确认由谁给出最终技术签字',
        },
        hardDeadlineAt: `${dateOffset(1)}T10:00:00+08:00`,
        todayAssignmentCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    todayPlans: [
      {
        id: todayId,
        date: dateOffset(0),
        oneThingTaskId: undefined,
        keyTaskIds: [],
        otherTaskIds: [],
        unfinishedTaskIds: [taskUnfinished],
        createdAt: now,
        updatedAt: now,
      },
    ],
    ideas: [
      {
        id: 'idea-architect-workflow',
        originalText: '建筑师是否愿意把材料决策过程直接交给 FindingMat？',
        source: 'web',
        status: 'saved',
        createdAt: now,
        updatedAt: now,
      },
    ],
    auditEvents: [],
  };
}
