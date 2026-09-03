import type { MockTask } from '@/types/dashboard';

export const mockTasks: MockTask[] = [
  {
    id: 'task-findingmat-architecture',
    title: '完成 FindingMat MVP 架构复核',
    context: 'FindingMat · 核心事业',
    status: 'in-progress',
  },
  {
    id: 'task-sichuan-agent',
    title: '联系四川代理商',
    context: '曜之岩 · 商业机会',
    status: 'todo',
  },
  {
    id: 'task-sdc-review',
    title: '审核 SDC 产品资料',
    context: '长乐防火 · 项目资料',
    status: 'done',
  },
  {
    id: 'task-findingmat-interviews',
    title: '整理建筑师访谈问题',
    context: 'FindingMat · 用户验证',
    status: 'later',
  },
  {
    id: 'task-weekly-review',
    title: '准备本周 CEO 复盘',
    context: 'P_CEO_OS · 战略复盘',
    status: 'later',
  },
];

export const dashboardTasks = mockTasks.slice(0, 3);

export const taskStatusLabels = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
  later: 'Later',
} as const;
