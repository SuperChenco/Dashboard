import type { BusinessSummary } from '@/types/dashboard';

export const businessSummaries: BusinessSummary[] = [
  {
    id: 'company-findingmat',
    name: 'FindingMat',
    currentStatus: 'MVP 验证中',
    weeklyFocus: '完成架构复核，准备首轮建筑师验证',
    progress: 60,
    progressLabel: 'MVP 里程碑 3 / 5',
    status: 'success',
    isStrategicPriority: true,
  },
  {
    id: 'company-yaozhiyan',
    name: '曜之岩',
    currentStatus: '机会推进中',
    weeklyFocus: '跟进四川代理商与重点客户',
    progress: 45,
    progressLabel: '本周关键动作 2 / 4',
    status: 'warning',
  },
  {
    id: 'company-changle',
    name: '长乐防火',
    currentStatus: '稳定交付',
    weeklyFocus: '完成 SDC 资料审核与项目响应',
    progress: 72,
    progressLabel: '本周关键动作 3 / 4',
    status: 'neutral',
  },
];
