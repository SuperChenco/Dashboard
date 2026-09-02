import { useMemo, useState } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { suggestTaskType } from '@/domain/advisor';
import type { TaskStatus } from '@/domain/workflow/types';
import { useWorkflow } from '@/hooks/useWorkflow';

type DetailMode = 'waiting' | 'blocked' | 'delegate';

export default function TasksWorkspace() {
  const { state, service } = useWorkflow();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<{ taskId: string; mode: DetailMode }>();
  const [feedback, setFeedback] = useState<string>();
  const [suggestionId, setSuggestionId] = useState<string>();
  const [nextActionTaskId, setNextActionTaskId] = useState<string>();
  const suggestionTask = state.tasks.find((task) => task.id === suggestionId);
  const suggestion = useMemo(
    () => (suggestionTask ? suggestTaskType(suggestionTask) : undefined),
    [suggestionTask],
  );

  const move = (taskId: string, status: TaskStatus) => {
    const result = service.transitionTask(taskId, status);
    setFeedback(result.errors[0] ?? `Task moved to ${status}.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-app-border bg-app-surface p-5">
        <div>
          <p className="text-sm font-semibold">Task Pool</p>
          <p className="mt-1 text-xs text-app-subtle">
            Capture fast. Organize later. Goal / Sprint relations are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
        >
          Quick Create Task
        </button>
      </div>
      {feedback && (
        <WorkflowNotice
          tone={
            feedback.includes('requires') || feedback.includes('Cannot')
              ? 'danger'
              : 'success'
          }
        >
          {feedback}
        </WorkflowNotice>
      )}
      <div className="space-y-3">
        {state.tasks.map((task) => (
          <article
            key={task.id}
            className="rounded-panel border border-app-border bg-app-surface p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{task.title}</h2>
                  <span
                    className={`rounded-badge border px-2 py-0.5 text-[11px] font-medium ${task.type === 'strategic' ? 'border-success/20 bg-success-soft text-success-strong' : task.type === 'maintenance' ? 'border-warning/20 bg-warning-soft text-warning-strong' : 'border-app-border bg-app-muted text-app-muted-foreground'}`}
                  >
                    {task.type}
                  </span>
                  <span className="rounded-badge border border-app-border px-2 py-0.5 text-[11px] text-app-muted-foreground">
                    {task.status}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-app-subtle">
                  {task.relations.length
                    ? task.relations
                        .map((relation) => relation.label)
                        .join(' · ')
                    : 'Independent Task'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestionId(task.id)}
                  className="h-8 rounded-control border border-app-border px-2.5 text-xs"
                >
                  Mock AI classify
                </button>
                {task.status === 'blocked' && (
                  <button
                    type="button"
                    onClick={() => setNextActionTaskId(task.id)}
                    className="h-8 rounded-control border border-warning/20 bg-warning-soft px-2.5 text-xs text-warning-strong"
                  >
                    Mock AI next action
                  </button>
                )}
                {task.status !== 'done' && (
                  <button
                    type="button"
                    onClick={() => move(task.id, 'done')}
                    className="h-8 rounded-control border border-success/20 bg-success-soft px-2.5 text-xs text-success-strong"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
            {(task.waiting || task.blocker || task.delegation) && (
              <div className="mt-4 grid gap-2 text-xs text-app-muted-foreground sm:grid-cols-3">
                {task.waiting && (
                  <p>
                    <strong className="text-app-foreground">Waiting:</strong>{' '}
                    {task.waiting.waitingFor} · follow-up{' '}
                    {task.waiting.followUpAt}
                  </p>
                )}
                {task.blocker && (
                  <p>
                    <strong className="text-app-foreground">Blocker:</strong>{' '}
                    {task.blocker.blocker}
                  </p>
                )}
                {task.delegation && (
                  <p>
                    <strong className="text-app-foreground">Delegated:</strong>{' '}
                    {task.delegation.assignee} · {task.delegation.myRole}
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-app-border pt-3">
              <button
                type="button"
                onClick={() => move(task.id, 'in-progress')}
                className="task-action"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => setDetail({ taskId: task.id, mode: 'waiting' })}
                className="task-action"
              >
                Waiting
              </button>
              <button
                type="button"
                onClick={() => setDetail({ taskId: task.id, mode: 'blocked' })}
                className="task-action"
              >
                Blocked
              </button>
              <button
                type="button"
                onClick={() => setDetail({ taskId: task.id, mode: 'delegate' })}
                className="task-action"
              >
                Delegate
              </button>
              {task.hardDeadlineAt && (
                <span className="ml-auto text-xs text-danger-strong">
                  Hard deadline{' '}
                  {task.hardDeadlineAt.slice(0, 16).replace('T', ' ')}
                </span>
              )}
              {task.targetDate && !task.hardDeadlineAt && (
                <span className="ml-auto text-xs text-app-subtle">
                  Target {task.targetDate}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={createOpen}
        title="Quick Create Task"
        description="Only the title is required. Relationships can be organized later."
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const relation = String(data.get('relation') || '');
            const result = service.createTask({
              title: String(data.get('title') ?? ''),
              type: String(data.get('type')) as
                'strategic' | 'maintenance' | 'normal',
              estimatedMinutes: Number(data.get('estimate')) || undefined,
              hardDeadlineAt: String(data.get('deadline') || '') || undefined,
              targetDate: String(data.get('target') || '') || undefined,
              relations: relation
                ? [
                    {
                      type: relation.startsWith('goal') ? 'goal' : 'sprint',
                      entityId: relation.split(':')[1],
                      label: String(data.get('relationLabel') || relation),
                    },
                  ]
                : [],
            });
            setFeedback(result.errors[0] ?? 'Task captured in Inbox.');
            if (result.value) {
              setCreateOpen(false);
              setSuggestionId(result.value.id);
            }
          }}
        >
          <Field
            label="Task"
            name="title"
            required
            placeholder="What needs to move?"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Type
              <select
                name="type"
                defaultValue="normal"
                className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
              >
                <option value="normal">Normal</option>
                <option value="strategic">Strategic</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <Field label="Estimated minutes" name="estimate" type="number" />
          </div>
          <label className="block text-sm font-medium">
            Optional relation
            <select
              name="relation"
              className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
            >
              <option value="">None</option>
              {state.goals.map((goal) => (
                <option key={goal.id} value={`goal:${goal.id}`}>
                  Goal · {goal.title}
                </option>
              ))}
              {state.sprints.map((sprint) => (
                <option key={sprint.id} value={`sprint:${sprint.id}`}>
                  Sprint · {sprint.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Hard Deadline"
              name="deadline"
              type="datetime-local"
            />
            <Field label="Target Date" name="target" type="date" />
          </div>
          <div className="flex justify-end">
            <button className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white">
              Capture Task
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        title={
          detail?.mode === 'waiting'
            ? 'Set Waiting'
            : detail?.mode === 'blocked'
              ? 'Record Blocker'
              : 'Delegate Task'
        }
        description="This action is recorded in local Audit History."
        onClose={() => setDetail(undefined)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            if (!detail) return;
            let result;
            if (detail.mode === 'waiting')
              result = service.transitionTask(detail.taskId, 'waiting', {
                waiting: {
                  waitingFor: String(data.get('for') ?? ''),
                  waitingOn: String(data.get('on') ?? ''),
                  followUpAt: String(data.get('follow') ?? ''),
                  lastActionAt: new Date().toISOString(),
                },
              });
            else if (detail.mode === 'blocked')
              result = service.transitionTask(detail.taskId, 'blocked', {
                blocker: {
                  blocker: String(data.get('blocker') ?? ''),
                  blockedAt: new Date().toISOString(),
                  nextAction: String(data.get('next') || '') || undefined,
                },
              });
            else
              result = service.delegateTask(detail.taskId, {
                responsibility: String(data.get('responsibility') ?? ''),
                assignee: String(data.get('assignee') ?? ''),
                myRole: String(data.get('role') ?? ''),
                deadline: String(data.get('deadline') || '') || undefined,
                followUpAt: String(data.get('follow') || '') || undefined,
              });
            setFeedback(result.errors[0] ?? `${detail.mode} details saved.`);
            if (result.value) setDetail(undefined);
          }}
        >
          {detail?.mode === 'waiting' && (
            <>
              <Field label="Waiting For" name="for" required />
              <Field label="Waiting On" name="on" required />
              <Field
                label="Follow-up Date"
                name="follow"
                type="date"
                required
              />
            </>
          )}
          {detail?.mode === 'blocked' && (
            <>
              <Field label="Blocker" name="blocker" required />
              <Field label="Suggested next action (optional)" name="next" />
            </>
          )}
          {detail?.mode === 'delegate' && (
            <>
              <Field label="Responsibility" name="responsibility" required />
              <Field label="Assignee" name="assignee" required />
              <Field
                label="My Role"
                name="role"
                required
                placeholder="Final Review"
              />
              <Field label="Delegation Deadline" name="deadline" type="date" />
              <Field label="Follow-up Date" name="follow" type="date" />
            </>
          )}
          <div className="flex justify-end">
            <button className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(suggestion)}
        title="Task Classification Suggestion"
        description="Mock AI only suggests. The Task changes only after CEO confirmation."
        onClose={() => setSuggestionId(undefined)}
      >
        {suggestion && (
          <div className="mt-6">
            <WorkflowNotice>
              <strong>
                {suggestion.label}: {suggestion.recommendation}
              </strong>
              <br />
              {suggestion.reason}
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuggestionId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                Ignore
              </button>
              <button
                type="button"
                onClick={() => {
                  service.confirmTaskType(
                    suggestion.targetId!,
                    suggestion.recommendation.toLowerCase() as
                      'strategic' | 'normal',
                  );
                  setSuggestionId(undefined);
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                CEO Confirm
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(nextActionTaskId)}
        title="Blocked Task · Next Action Suggestion"
        description="AI Suggestion Preview. Nothing changes until CEO confirmation."
        onClose={() => setNextActionTaskId(undefined)}
      >
        {nextActionTaskId && (
          <div className="mt-6">
            <WorkflowNotice tone="warning">
              <strong>Mock AI:</strong> 明确阻塞事项的最终决策人，并安排一次 15
              分钟确认。
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNextActionTaskId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                Ignore
              </button>
              <button
                type="button"
                onClick={() => {
                  service.confirmBlockedNextAction(
                    nextActionTaskId,
                    '明确最终决策人，并安排一次 15 分钟确认',
                  );
                  setNextActionTaskId(undefined);
                  setFeedback('CEO confirmed the suggested next action.');
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                CEO Confirm
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1.5 h-10 w-full rounded-control border border-app-border px-3 outline-none focus:border-slate-500"
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </label>
  );
}
