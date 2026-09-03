import type {
  Idea,
  IdeaAnalysis,
  IdeaSuggestion,
  RuleResult,
  Task,
} from '@/domain/workflow/types';
import { createTaskDraft } from '@/domain/tasks';

export function createIdea(
  originalText: string,
  id: string,
  now: string,
): RuleResult<Idea> {
  if (!originalText.trim())
    return { errors: ['Idea text is required.'], warnings: [] };
  return {
    value: {
      id,
      originalText: originalText.trim(),
      source: 'web',
      status: 'saved',
      createdAt: now,
      updatedAt: now,
    },
    errors: [],
    warnings: [],
  };
}

export function attachIdeaAnalysis(
  idea: Idea,
  analysis: IdeaAnalysis,
  now: string,
): Idea {
  return { ...idea, analysis, updatedAt: now };
}

export function confirmIdeaToTask(
  idea: Idea,
  taskId: string,
  now: string,
): RuleResult<{ idea: Idea; task: Task }> {
  if (!idea.analysis || idea.analysis.suggestion !== 'task')
    return {
      errors: ['A Task conversion suggestion must exist before confirmation.'],
      warnings: [],
    };
  if (idea.analysis.confirmedAt)
    return {
      errors: ['This Idea conversion has already been confirmed.'],
      warnings: [],
    };
  const taskResult = createTaskDraft(
    { title: idea.originalText, sourceIdeaId: idea.id },
    taskId,
    now,
  );
  if (!taskResult.value)
    return { errors: taskResult.errors, warnings: taskResult.warnings };
  return {
    value: {
      idea: {
        ...idea,
        status: 'converted',
        convertedEntityType: 'task',
        convertedEntityId: taskId,
        analysis: { ...idea.analysis, confirmedAt: now },
        updatedAt: now,
      },
      task: taskResult.value,
    },
    errors: [],
    warnings: [],
  };
}

export function suggestionCreatesMutation(suggestion: IdeaSuggestion): boolean {
  return suggestion !== 'keep';
}
