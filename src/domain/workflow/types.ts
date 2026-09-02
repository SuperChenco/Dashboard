import type { EntityId } from '@/types/core';

export type IsoDate = string;
export type IsoDateTime = string;

export interface DomainEntity {
  id: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type GoalStatus =
  'active' | 'at-risk' | 'stalled' | 'completed' | 'paused' | 'abandoned';

export type GoalProgressMode = 'manual' | 'metric' | 'children' | 'milestones';

export interface Goal extends DomainEntity {
  title: string;
  description: string;
  why: string;
  successMetrics: string[];
  deadline?: IsoDate;
  nextReviewAt?: IsoDate;
  status: GoalStatus;
  progress: number;
  progressMode: GoalProgressMode;
  suggestedProgress?: number;
  parentGoalId?: EntityId;
  companyIds: EntityId[];
  lastMeaningfulProgressAt: IsoDateTime;
}

export type SprintKind = 'primary' | 'maintenance';
export type SprintStatus =
  'planned' | 'active' | 'review' | 'completed' | 'closed-incomplete';

export interface Sprint extends DomainEntity {
  title: string;
  kind: SprintKind;
  status: SprintStatus;
  primaryGoalId?: EntityId;
  secondaryGoalIds: EntityId[];
  primaryOutcome: string;
  secondaryOutcomes: string[];
  startDate: IsoDate;
  endDate: IsoDate;
  progress: number;
  goldenTime?: string;
  reviewReason?: string;
  carriedFromSprintId?: EntityId;
}

export type TaskType = 'strategic' | 'maintenance' | 'normal';
export type TaskStatus =
  | 'inbox'
  | 'todo'
  | 'in-progress'
  | 'waiting'
  | 'blocked'
  | 'done'
  | 'cancelled';

export type TaskRelationType =
  'goal' | 'sprint' | 'project' | 'company' | 'opportunity' | 'person';

export interface TaskRelation {
  type: TaskRelationType;
  entityId: EntityId;
  label: string;
}

export interface WaitingDetails {
  waitingFor: string;
  waitingOn: string;
  followUpAt: IsoDate;
  lastActionAt: IsoDateTime;
}

export interface DelegationDetails {
  responsibility: string;
  assignee: string;
  deadline?: IsoDate;
  followUpAt?: IsoDate;
  myRole: string;
}

export interface BlockerDetails {
  blocker: string;
  blockedAt: IsoDateTime;
  nextAction?: string;
}

export interface Task extends DomainEntity {
  title: string;
  notes: string;
  type: TaskType;
  status: TaskStatus;
  relations: TaskRelation[];
  waiting?: WaitingDetails;
  delegation?: DelegationDetails;
  blocker?: BlockerDetails;
  estimatedMinutes?: number;
  actualMinutes?: number;
  actualTimeSource?: 'inferred' | 'manual' | 'focus';
  hardDeadlineAt?: IsoDateTime;
  targetDate?: IsoDate;
  sourceIdeaId?: EntityId;
  todayAssignmentCount: number;
}

export interface TodayPlan extends DomainEntity {
  date: IsoDate;
  oneThingTaskId?: EntityId;
  keyTaskIds: EntityId[];
  otherTaskIds: EntityId[];
  unfinishedTaskIds: EntityId[];
}

export type IdeaSuggestion =
  'keep' | 'task' | 'project' | 'opportunity' | 'knowledge' | 'archive';

export interface IdeaAnalysis {
  label: 'Mock AI';
  suggestion: IdeaSuggestion;
  reason: string;
  suggestedRelations: TaskRelation[];
  analyzedAt: IsoDateTime;
  confirmedAt?: IsoDateTime;
}

export interface Idea extends DomainEntity {
  originalText: string;
  source: 'web';
  status: 'saved' | 'converted' | 'archived';
  analysis?: IdeaAnalysis;
  convertedEntityId?: EntityId;
  convertedEntityType?: Exclude<IdeaSuggestion, 'keep' | 'archive'>;
}

export interface AdvisorSuggestion {
  id: EntityId;
  label: 'Mock AI' | 'AI Suggestion Preview';
  kind: 'task-type' | 'one-thing' | 'next-action' | 'strategic-drift';
  recommendation: string;
  reason: string;
  targetId?: EntityId;
  confirmed: boolean;
}

export interface AuditEvent {
  id: EntityId;
  entityType: 'goal' | 'sprint' | 'task' | 'today' | 'idea';
  entityId: EntityId;
  action: string;
  occurredAt: IsoDateTime;
  summary: string;
}

export interface WorkflowState {
  version: 1;
  goals: Goal[];
  sprints: Sprint[];
  tasks: Task[];
  todayPlans: TodayPlan[];
  ideas: Idea[];
  auditEvents: AuditEvent[];
}

export interface RuleResult<T> {
  value?: T;
  errors: string[];
  warnings: string[];
}
