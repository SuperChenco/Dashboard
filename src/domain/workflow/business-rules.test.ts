import { describe, expect, it } from 'vitest';

import {
  analyzeIdeaDeterministically,
  detectStrategicDrift,
} from '@/domain/advisor';
import {
  getGoalHierarchyWarning,
  isGoalStagnant,
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
  getMaintenanceFocusRisk,
  isSprintExpired,
  reviewSprint,
  validateSprintInput,
} from '@/domain/sprints';
import { createTaskDraft, delegateTask, transitionTask } from '@/domain/tasks';
import { addKeyTask, createNextDayPlan, setOneThing } from '@/domain/today';
import type { Goal, Sprint, Task, TodayPlan } from '@/domain/workflow/types';

const now = '2026-09-02T08:00:00.000Z';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    title: 'Strategic Goal',
    description: '',
    why: 'Why',
    successMetrics: ['Metric'],
    nextReviewAt: '2026-09-30',
    status: 'active',
    progress: 0,
    progressMode: 'manual',
    companyIds: [],
    lastMeaningfulProgressAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function sprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 'sprint-1',
    title: 'Sprint',
    kind: 'primary',
    status: 'active',
    secondaryGoalIds: [],
    primaryOutcome: 'Outcome',
    secondaryOutcomes: [],
    startDate: '2026-09-01',
    endDate: '2026-09-06',
    progress: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Task',
    notes: '',
    type: 'normal',
    status: 'todo',
    relations: [],
    todayAssignmentCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function today(overrides: Partial<TodayPlan> = {}): TodayPlan {
  return {
    id: 'today-1',
    date: '2026-09-02',
    keyTaskIds: [],
    otherTaskIds: [],
    unfinishedTaskIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Phase 2 business rules', () => {
  it('requires a review date when Goal deadline is absent', () => {
    expect(
      validateGoalInput({
        title: 'Goal',
        why: 'Why',
        successMetrics: ['Metric'],
      }).errors,
    ).toContain('A Goal without a deadline requires a next review date.');
  });

  it('warns instead of blocking Goal hierarchy deeper than 3 levels', () => {
    const goals = [
      goal(),
      goal({ id: 'goal-2', parentGoalId: 'goal-1' }),
      goal({ id: 'goal-3', parentGoalId: 'goal-2' }),
    ];
    expect(getGoalHierarchyWarning('goal-3', goals)).toContain('too deep');
  });

  it('allows only one active Primary Sprint', () => {
    const result = activatePrimarySprint(
      'sprint-2',
      [sprint(), sprint({ id: 'sprint-2', status: 'planned' })],
      now,
    );
    expect(
      result.filter(
        (item) => item.kind === 'primary' && item.status === 'active',
      ),
    ).toHaveLength(1);
    expect(result.find((item) => item.id === 'sprint-2')?.status).toBe(
      'active',
    );
  });

  it('produces Focus Risk for more than 2 active Maintenance Sprints', () => {
    const items = [1, 2, 3].map((id) =>
      sprint({ id: `s-${id}`, kind: 'maintenance' }),
    );
    expect(getMaintenanceFocusRisk(items)).toContain('3 个');
  });

  it('warns when Sprint duration is outside 4–7 days', () => {
    const short = validateSprintInput({
      title: 'Short',
      kind: 'primary',
      primaryOutcome: 'Outcome',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
    });
    const long = validateSprintInput({
      title: 'Long',
      kind: 'primary',
      primaryOutcome: 'Outcome',
      startDate: '2026-09-01',
      endDate: '2026-09-12',
    });
    expect(short.warnings.join()).toContain('short sprint');
    expect(long.warnings.join()).toContain('longer');
  });

  it('detects Sprint expiry without automatically extending it', () => {
    const expired = sprint({ endDate: '2026-09-01' });
    expect(isSprintExpired(expired, '2026-09-02')).toBe(true);
    expect(expired.endDate).toBe('2026-09-01');
  });

  it('requires a reason to extend a Sprint', () => {
    expect(
      reviewSprint(sprint(), 'extend', undefined, '2026-09-10').errors,
    ).not.toHaveLength(0);
  });

  it('requires a reason to Close Incomplete', () => {
    expect(reviewSprint(sprint(), 'close-incomplete').errors).not.toHaveLength(
      0,
    );
  });

  it('preserves Sprint history when carrying work forward', () => {
    const next = carryForwardSprint(
      sprint(),
      'sprint-2',
      '2026-09-07',
      '2026-09-12',
      now,
    );
    expect(next.carriedFromSprintId).toBe('sprint-1');
    expect(next.progress).toBe(0);
  });

  it('allows Task creation without Goal or Sprint', () => {
    expect(
      createTaskDraft({ title: 'Independent' }, 'task-x', now).value?.relations,
    ).toEqual([]);
  });

  it('defaults Task Type to Normal', () => {
    expect(
      createTaskDraft({ title: 'Default' }, 'task-x', now).value?.type,
    ).toBe('normal');
  });

  it('supports Waiting details and follow-up', () => {
    const result = transitionTask(task(), 'waiting', now, {
      waiting: {
        waitingFor: 'Supplier',
        waitingOn: 'Price',
        followUpAt: '2026-09-04',
        lastActionAt: now,
      },
    });
    expect(result.value?.waiting?.followUpAt).toBe('2026-09-04');
  });

  it('allows a delegated Task to remain Waiting', () => {
    const waiting = task({
      status: 'waiting',
      waiting: {
        waitingFor: 'Client',
        waitingOn: 'Reply',
        followUpAt: '2026-09-04',
        lastActionAt: now,
      },
    });
    const result = delegateTask(
      waiting,
      { responsibility: 'Follow-up', assignee: 'A', myRole: 'Final Review' },
      now,
    );
    expect(result.value?.status).toBe('waiting');
    expect(result.value?.delegation?.assignee).toBe('A');
  });

  it('requires a blocker when Task moves to Blocked', () => {
    expect(transitionTask(task(), 'blocked', now).errors).toContain(
      'Blocked requires a blocker.',
    );
  });

  it('keeps Hard Deadline and Target Date distinct', () => {
    const result = createTaskDraft(
      {
        title: 'Dates',
        hardDeadlineAt: '2026-09-03T10:00:00Z',
        targetDate: '2026-09-02',
      },
      'task-x',
      now,
    ).value;
    expect(result?.hardDeadlineAt).not.toBe(result?.targetDate);
  });

  it('replaces rather than duplicates Today One Thing', () => {
    const result = setOneThing(
      setOneThing(today(), 'task-1', now),
      'task-2',
      now,
    );
    expect(result.oneThingTaskId).toBe('task-2');
  });

  it('limits Today to 3 Key Tasks', () => {
    expect(
      addKeyTask(today({ keyTaskIds: ['a', 'b', 'c'] }), 'd', now).errors,
    ).toContain('Today supports at most 3 Key Tasks.');
  });

  it('does not auto-roll unfinished Today Tasks into tomorrow', () => {
    const next = createNextDayPlan(
      today({ oneThingTaskId: 'task-1' }),
      '2026-09-03',
      'today-2',
      now,
      [task()],
    );
    expect(next.otherTaskIds).toEqual([]);
    expect(next.unfinishedTaskIds).toEqual(['task-1']);
  });

  it('creates an Idea using original text only', () => {
    expect(createIdea('A raw thought', 'idea-1', now).value).toMatchObject({
      originalText: 'A raw thought',
      source: 'web',
      status: 'saved',
    });
  });

  it('AI analysis does not mutate the Idea until explicitly attached', () => {
    const idea = createIdea('完成验证', 'idea-1', now).value!;
    analyzeIdeaDeterministically(idea, now);
    expect(idea.analysis).toBeUndefined();
  });

  it('Idea conversion preserves its source relation', () => {
    const idea = createIdea('完成验证', 'idea-1', now).value!;
    const analyzed = attachIdeaAnalysis(
      idea,
      analyzeIdeaDeterministically(idea, now)!,
      now,
    );
    const result = confirmIdeaToTask(analyzed, 'task-2', now).value!;
    expect(result.task.sourceIdeaId).toBe('idea-1');
    expect(result.idea.convertedEntityId).toBe('task-2');
  });

  it('requires confirmation context before Idea mutation', () => {
    const idea = createIdea('完成验证', 'idea-1', now).value!;
    expect(confirmIdeaToTask(idea, 'task-2', now).errors).not.toHaveLength(0);
  });

  it('preserves Primary and Secondary Goal relation behavior', () => {
    const input = {
      title: 'Sprint',
      kind: 'primary' as const,
      primaryGoalId: 'goal-1',
      secondaryGoalIds: ['goal-2'],
      primaryOutcome: 'Outcome',
      startDate: '2026-09-01',
      endDate: '2026-09-06',
    };
    expect(validateSprintInput(input).value).toMatchObject({
      primaryGoalId: 'goal-1',
      secondaryGoalIds: ['goal-2'],
    });
  });

  it('flags an active Goal after 4 weeks without progress', () => {
    expect(
      isGoalStagnant(
        goal({ lastMeaningfulProgressAt: '2026-07-01T00:00:00Z' }),
        new Date('2026-09-02T00:00:00Z'),
      ),
    ).toBe(true);
  });

  it('detects basic Strategic Drift deterministically', () => {
    const stale = goal({ lastMeaningfulProgressAt: '2026-08-01T00:00:00Z' });
    expect(
      detectStrategicDrift([stale], [], [], new Date('2026-09-02T00:00:00Z'))
        ?.kind,
    ).toBe('strategic-drift');
  });
});
