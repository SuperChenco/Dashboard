export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'later';
export type SemanticStatus = 'neutral' | 'success' | 'warning' | 'danger';

export interface MockTask {
  id: string;
  title: string;
  context: string;
  status: TaskStatus;
}

export interface StrategicGoal {
  id: string;
  title: string;
  period: string;
  completedMilestones: number;
  totalMilestones: number;
  currentSprint: string;
  status: SemanticStatus;
}

export interface BusinessSummary {
  id: string;
  name: string;
  currentStatus: string;
  weeklyFocus: string;
  progress: number;
  progressLabel: string;
  status: SemanticStatus;
  isStrategicPriority?: boolean;
}

export interface MockAIInsight {
  label: string;
  summary: string;
  rationale: string;
}
