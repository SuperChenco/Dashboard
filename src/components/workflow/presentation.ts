import type { Sprint, TaskStatus } from '@/domain/workflow/types';

const DAY_MS = 86_400_000;

function asUtcDate(value: string): number {
  return new Date(`${value}T00:00:00Z`).getTime();
}

export function getSprintTiming(sprint: Sprint, today: string) {
  const totalDays = Math.max(
    1,
    Math.round(
      (asUtcDate(sprint.endDate) - asUtcDate(sprint.startDate)) / DAY_MS,
    ) + 1,
  );
  const elapsedDays = Math.round(
    (asUtcDate(today) - asUtcDate(sprint.startDate)) / DAY_MS,
  );
  const day = Math.min(totalDays, Math.max(1, elapsedDays + 1));
  const remainingDays = Math.max(
    0,
    Math.ceil((asUtcDate(sprint.endDate) - asUtcDate(today)) / DAY_MS),
  );

  return { day, totalDays, remainingDays };
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate.replaceAll('-', '.')} — ${endDate.replaceAll('-', '.')}`;
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  inbox: '待整理',
  todo: '下一步',
  'in-progress': '进行中',
  waiting: '等待中',
  blocked: '已阻塞',
  done: '已完成',
  cancelled: '已取消',
};
