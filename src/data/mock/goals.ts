import type { StrategicGoal } from '@/types/dashboard';

export const strategicGoals: StrategicGoal[] = [
  {
    id: 'goal-findingmat-mvp',
    title: 'FindingMat MVP',
    period: '2026 Q4',
    completedMilestones: 3,
    totalMilestones: 5,
    currentSprint: 'Sprint 04 · 验证产品闭环',
    status: 'success',
  },
];

export const primaryStrategicGoal = strategicGoals[0];
