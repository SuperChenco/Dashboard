import { analyzeIdeaDeterministically } from '@/domain/advisor';
import {
  getGoalHierarchyWarning,
  type CreateGoalInput,
  validateGoalInput,
} from '@/domain/goals';
import {
  attachIdeaAnalysis,
  confirmIdeaToTask,
  createIdea,
} from '@/domain/ideas';
import {
  activatePrimarySprint,
  carryForwardSprint,
  type CreateSprintInput,
  reviewSprint,
  type SprintReviewDecision,
  validateSprintInput,
} from '@/domain/sprints';
import {
  createTaskDraft,
  delegateTask,
  transitionTask,
  type CreateTaskInput,
} from '@/domain/tasks';
import {
  addKeyTask,
  resolveYesterdayTask,
  setOneThing,
  type YesterdayDecision,
} from '@/domain/today';
import { createEntityId } from '@/domain/shared/id';
import type {
  AuditEvent,
  BlockerDetails,
  DelegationDetails,
  Goal,
  RuleResult,
  Sprint,
  TaskStatus,
  WaitingDetails,
  WorkflowState,
} from '@/domain/workflow/types';
import type { WorkflowRepository } from '@/repositories/workflow.repository';

export class WorkflowService {
  constructor(private readonly repository: WorkflowRepository) {}

  async getState(): Promise<WorkflowState> {
    return this.repository.load();
  }

  async createGoal(input: CreateGoalInput): Promise<RuleResult<Goal>> {
    const validation = validateGoalInput(input);
    if (!validation.value) {
      return { errors: validation.errors, warnings: validation.warnings };
    }
    const state = await this.getState();
    const now = new Date().toISOString();
    const goal: Goal = {
      id: createEntityId('goal'),
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      why: input.why.trim(),
      successMetrics: input.successMetrics
        .map((metric) => metric.trim())
        .filter(Boolean),
      deadline: input.deadline,
      nextReviewAt: input.nextReviewAt,
      status: 'active',
      progress: 0,
      progressMode: 'manual',
      parentGoalId: input.parentGoalId,
      companyIds: input.companyIds ?? [],
      lastMeaningfulProgressAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const warning = getGoalHierarchyWarning(input.parentGoalId, state.goals);
    await this.commit(
      { ...state, goals: [...state.goals, goal] },
      this.audit(
        'goal',
        goal.id,
        'created',
        `Created Goal: ${goal.title}`,
        now,
      ),
    );
    return { value: goal, errors: [], warnings: warning ? [warning] : [] };
  }

  async createSprint(input: CreateSprintInput): Promise<RuleResult<Sprint>> {
    const validation = validateSprintInput(input);
    if (!validation.value) {
      return { errors: validation.errors, warnings: validation.warnings };
    }
    const state = await this.getState();
    const now = new Date().toISOString();
    const sprint: Sprint = {
      id: createEntityId('sprint'),
      title: input.title.trim(),
      kind: input.kind,
      status: 'active',
      primaryGoalId: input.primaryGoalId,
      secondaryGoalIds: input.secondaryGoalIds ?? [],
      primaryOutcome: input.primaryOutcome.trim(),
      secondaryOutcomes: input.secondaryOutcomes ?? [],
      startDate: input.startDate,
      endDate: input.endDate,
      progress: 0,
      goldenTime: input.goldenTime,
      createdAt: now,
      updatedAt: now,
    };
    let sprints = [...state.sprints, sprint];
    if (sprint.kind === 'primary')
      sprints = activatePrimarySprint(sprint.id, sprints, now);
    await this.commit(
      { ...state, sprints },
      this.audit(
        'sprint',
        sprint.id,
        'created',
        `Created ${sprint.kind} Sprint: ${sprint.title}`,
        now,
      ),
    );
    return { value: sprint, errors: [], warnings: validation.warnings };
  }

  async reviewSprint(
    sprintId: string,
    decision: SprintReviewDecision,
    reason?: string,
    newEndDate?: string,
  ): Promise<RuleResult<Sprint>> {
    const state = await this.getState();
    const sprint = state.sprints.find((item) => item.id === sprintId);
    if (!sprint) return { errors: ['Sprint not found.'], warnings: [] };
    const result = reviewSprint(sprint, decision, reason, newEndDate);
    if (!result.value) return result;
    const now = new Date().toISOString();
    let sprints = state.sprints.map((item) =>
      item.id === sprintId ? result.value! : item,
    );
    if (decision === 'carry-forward') {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      const next = carryForwardSprint(
        sprint,
        createEntityId('sprint'),
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
        now,
      );
      sprints = [...sprints, next];
      if (next.kind === 'primary') {
        sprints = activatePrimarySprint(next.id, sprints, now);
      }
    }
    await this.commit(
      { ...state, sprints },
      this.audit(
        'sprint',
        sprintId,
        `review:${decision}`,
        reason || decision,
        now,
      ),
    );
    return result;
  }

  async createTask(input: CreateTaskInput) {
    const state = await this.getState();
    const now = new Date().toISOString();
    const result = createTaskDraft(input, createEntityId('task'), now);
    if (!result.value) return result;
    await this.commit(
      { ...state, tasks: [...state.tasks, result.value] },
      this.audit(
        'task',
        result.value.id,
        'created',
        `Captured Task: ${result.value.title}`,
        now,
      ),
    );
    return result;
  }

  async transitionTask(
    taskId: string,
    status: TaskStatus,
    details?: { waiting?: WaitingDetails; blocker?: BlockerDetails },
  ) {
    const state = await this.getState();
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return { errors: ['Task not found.'], warnings: [] };
    const now = new Date().toISOString();
    const result = transitionTask(task, status, now, details);
    if (!result.value) return result;
    await this.commit(
      {
        ...state,
        tasks: state.tasks.map((item) =>
          item.id === taskId ? result.value! : item,
        ),
      },
      this.audit(
        'task',
        taskId,
        `status:${status}`,
        `Task moved to ${status}`,
        now,
      ),
    );
    return result;
  }

  async delegateTask(taskId: string, delegation: DelegationDetails) {
    const state = await this.getState();
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return { errors: ['Task not found.'], warnings: [] };
    const now = new Date().toISOString();
    const result = delegateTask(task, delegation, now);
    if (!result.value) return result;
    await this.commit(
      {
        ...state,
        tasks: state.tasks.map((item) =>
          item.id === taskId ? result.value! : item,
        ),
      },
      this.audit(
        'task',
        taskId,
        'delegated',
        `Delegated to ${delegation.assignee}`,
        now,
      ),
    );
    return result;
  }

  async confirmTaskType(
    taskId: string,
    type: 'strategic' | 'maintenance' | 'normal',
  ) {
    const state = await this.getState();
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    const now = new Date().toISOString();
    const updated = { ...task, type, updatedAt: now };
    await this.commit(
      {
        ...state,
        tasks: state.tasks.map((item) => (item.id === taskId ? updated : item)),
      },
      this.audit(
        'task',
        taskId,
        'ai-suggestion-confirmed',
        `CEO confirmed Task Type: ${type}`,
        now,
      ),
    );
  }

  async confirmBlockedNextAction(
    taskId: string,
    nextAction: string,
  ): Promise<void> {
    const state = await this.getState();
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task?.blocker) return;
    const now = new Date().toISOString();
    const updated = {
      ...task,
      blocker: { ...task.blocker, nextAction },
      updatedAt: now,
    };
    await this.commit(
      {
        ...state,
        tasks: state.tasks.map((item) => (item.id === taskId ? updated : item)),
      },
      this.audit(
        'task',
        taskId,
        'next-action-confirmed',
        `CEO confirmed next action: ${nextAction}`,
        now,
      ),
    );
  }

  async setTodayOneThing(taskId: string): Promise<void> {
    await this.updateToday('one-thing', taskId);
  }
  async addTodayKeyTask(taskId: string) {
    return this.updateToday('key', taskId);
  }

  async addTodayOtherTask(taskId: string): Promise<void> {
    const state = await this.getState();
    const today = this.today(state);
    const now = new Date().toISOString();
    const updated = {
      ...today,
      otherTaskIds: today.otherTaskIds.includes(taskId)
        ? today.otherTaskIds
        : [...today.otherTaskIds, taskId],
      updatedAt: now,
    };
    await this.commit(
      {
        ...state,
        todayPlans: this.upsertTodayPlan(state.todayPlans, updated),
      },
      this.audit(
        'today',
        today.id,
        'other-task',
        `Added Task ${taskId} as Other Task`,
        now,
      ),
    );
  }

  async resolveYesterday(
    taskId: string,
    decision: YesterdayDecision,
  ): Promise<void> {
    const state = await this.getState();
    const today = this.today(state);
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    const now = new Date().toISOString();
    const result = resolveYesterdayTask(today, task, decision, now);
    await this.commit(
      {
        ...state,
        todayPlans: this.upsertTodayPlan(state.todayPlans, result.plan),
        tasks: state.tasks.map((item) =>
          item.id === taskId ? result.task : item,
        ),
      },
      this.audit(
        'today',
        today.id,
        `yesterday:${decision}`,
        `Resolved ${task.title}`,
        now,
      ),
    );
  }

  async createIdea(text: string) {
    const state = await this.getState();
    const now = new Date().toISOString();
    const result = createIdea(text, createEntityId('idea'), now);
    if (!result.value) return result;
    await this.commit(
      { ...state, ideas: [result.value, ...state.ideas] },
      this.audit(
        'idea',
        result.value.id,
        'captured',
        'Captured Idea from web',
        now,
      ),
    );
    return result;
  }

  async analyzeIdea(ideaId: string): Promise<void> {
    const state = await this.getState();
    const idea = state.ideas.find((item) => item.id === ideaId);
    if (!idea) return;
    const now = new Date().toISOString();
    const updated = attachIdeaAnalysis(
      idea,
      analyzeIdeaDeterministically(idea, now)!,
      now,
    );
    await this.commit(
      {
        ...state,
        ideas: state.ideas.map((item) => (item.id === ideaId ? updated : item)),
      },
      this.audit(
        'idea',
        ideaId,
        'mock-analysis',
        'Generated Mock AI suggestion preview',
        now,
      ),
    );
  }

  async confirmIdeaTaskConversion(ideaId: string) {
    const state = await this.getState();
    const idea = state.ideas.find((item) => item.id === ideaId);
    if (!idea) return { errors: ['Idea not found.'], warnings: [] };
    const now = new Date().toISOString();
    const result = confirmIdeaToTask(idea, createEntityId('task'), now);
    if (!result.value) return result;
    await this.commit(
      {
        ...state,
        ideas: state.ideas.map((item) =>
          item.id === ideaId ? result.value!.idea : item,
        ),
        tasks: [...state.tasks, result.value.task],
      },
      this.audit(
        'idea',
        ideaId,
        'conversion-confirmed',
        `Converted to Task ${result.value.task.id}; source preserved`,
        now,
      ),
    );
    return result;
  }

  private async updateToday(kind: 'one-thing' | 'key', taskId: string) {
    const state = await this.getState();
    const today = this.today(state);
    const now = new Date().toISOString();
    const result =
      kind === 'one-thing'
        ? { value: setOneThing(today, taskId, now), errors: [], warnings: [] }
        : addKeyTask(today, taskId, now);
    if (!result.value) return result;
    const tasks = state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            todayAssignmentCount: task.todayAssignmentCount + 1,
            updatedAt: now,
          }
        : task,
    );
    await this.commit(
      {
        ...state,
        todayPlans: this.upsertTodayPlan(state.todayPlans, result.value),
        tasks,
      },
      this.audit('today', today.id, kind, `Assigned Task ${taskId}`, now),
    );
    return result;
  }

  private today(state: WorkflowState) {
    const date = new Date().toISOString().slice(0, 10);
    const existing = state.todayPlans.find((plan) => plan.date === date);
    if (existing) return existing;
    const now = new Date().toISOString();
    return {
      id: createEntityId('today'),
      date,
      keyTaskIds: [],
      otherTaskIds: [],
      unfinishedTaskIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  private upsertTodayPlan(
    plans: WorkflowState['todayPlans'],
    updated: WorkflowState['todayPlans'][number],
  ) {
    return plans.some((plan) => plan.id === updated.id)
      ? plans.map((plan) => (plan.id === updated.id ? updated : plan))
      : [...plans, updated];
  }

  private audit(
    entityType: AuditEvent['entityType'],
    entityId: string,
    action: string,
    summary: string,
    occurredAt: string,
  ): AuditEvent {
    return {
      id: createEntityId('audit'),
      entityType,
      entityId,
      action,
      occurredAt,
      summary,
    };
  }

  private async commit(state: WorkflowState, audit: AuditEvent): Promise<void> {
    await this.repository.save({
      ...state,
      auditEvents: [...state.auditEvents, audit],
    });
  }
}
