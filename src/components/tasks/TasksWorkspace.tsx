import { useMemo, useState, type MouseEvent } from 'react';

import Modal from '@/components/ui/Modal';
import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { taskStatusLabel } from '@/components/workflow/presentation';
import { suggestTaskType } from '@/domain/advisor';
import { waitingNeedsAttention } from '@/domain/tasks';
import type { Task, TaskStatus } from '@/domain/workflow/types';
import { useWorkflow } from '@/hooks/useWorkflow';
import WorkflowLoadState from '@/components/workflow/WorkflowLoadState';

type DetailMode = 'waiting' | 'blocked' | 'delegate';
type TaskFilter = 'all' | 'strategic' | 'maintenance' | 'waiting' | 'blocked';

const filters: { id: TaskFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strategic', label: 'Strategic' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'blocked', label: 'Blocked' },
];

export default function TasksWorkspace() {
  const { state, service, isLoading, error, refresh } = useWorkflow();
  const [filter, setFilter] = useState<TaskFilter>('all');
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
  if (isLoading && state.tasks.length === 0)
    return <WorkflowLoadState loading />;
  if (error)
    return <WorkflowLoadState error={error} onRetry={() => void refresh()} />;
  const today = new Date().toISOString().slice(0, 10);
  const visibleTasks = state.tasks.filter((task) => {
    if (['done', 'cancelled'].includes(task.status)) return false;
    if (filter === 'strategic') return task.type === 'strategic';
    if (filter === 'maintenance') return task.type === 'maintenance';
    if (filter === 'waiting') return task.status === 'waiting';
    if (filter === 'blocked') return task.status === 'blocked';
    return true;
  });
  const needsAttention = visibleTasks.filter(
    (task) => task.status === 'blocked' || waitingNeedsAttention(task, today),
  );
  const inProgress = visibleTasks.filter(
    (task) =>
      task.status === 'in-progress' &&
      !needsAttention.some((item) => item.id === task.id),
  );
  const delegated = visibleTasks.filter(
    (task) =>
      Boolean(task.delegation) &&
      !needsAttention.some((item) => item.id === task.id) &&
      !inProgress.some((item) => item.id === task.id),
  );
  const next = visibleTasks.filter(
    (task) =>
      !needsAttention.some((item) => item.id === task.id) &&
      !inProgress.some((item) => item.id === task.id) &&
      !delegated.some((item) => item.id === task.id),
  );

  const move = async (taskId: string, status: TaskStatus) => {
    const result = await service
      .transitionTask(taskId, status)
      .catch(() => undefined);
    if (!result) return;
    setFeedback(
      result.errors[0] ??
        (status === 'done'
          ? '任务已完成。'
          : `任务已更新为${taskStatusLabel[status]}。`),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1" aria-label="Task filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`h-8 rounded-control px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground ${filter === item.id ? 'bg-app-foreground text-white' : 'text-app-muted-foreground hover:bg-app-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
        >
          + New Task
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

      <TaskSection
        title="Needs Attention"
        tasks={needsAttention}
        tone="warning"
        today={today}
        move={move}
        setDetail={setDetail}
        setSuggestionId={setSuggestionId}
        setNextActionTaskId={setNextActionTaskId}
      />
      <TaskSection
        title="In Progress"
        tasks={inProgress}
        today={today}
        move={move}
        setDetail={setDetail}
        setSuggestionId={setSuggestionId}
        setNextActionTaskId={setNextActionTaskId}
      />
      <TaskSection
        title="Next"
        tasks={next}
        today={today}
        move={move}
        setDetail={setDetail}
        setSuggestionId={setSuggestionId}
        setNextActionTaskId={setNextActionTaskId}
      />
      <TaskSection
        title="Delegated"
        tasks={delegated}
        today={today}
        move={move}
        setDetail={setDetail}
        setSuggestionId={setSuggestionId}
        setNextActionTaskId={setNextActionTaskId}
      />

      <Modal
        open={createOpen}
        title="New Task"
        description="先记录要推进的事，其他信息可以稍后补充。"
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const relation = String(data.get('relation') || '');
            const result = await service
              .createTask({
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
              })
              .catch(() => undefined);
            if (!result) return;
            setFeedback(result.errors[0] ?? '任务已加入 Inbox。');
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
            placeholder="现在需要推进什么？"
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
            <Field label="预计分钟" name="estimate" type="number" />
          </div>
          <label className="block text-sm font-medium">
            关联（可选）
            <select
              name="relation"
              className="mt-1.5 h-10 w-full rounded-control border border-app-border bg-white px-3"
            >
              <option value="">无</option>
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
              创建 Task
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        title={
          detail?.mode === 'waiting'
            ? '设为 Waiting'
            : detail?.mode === 'blocked'
              ? '记录阻塞'
              : '委派 Task'
        }
        description="保存后会记录在 Audit History。"
        onClose={() => setDetail(undefined)}
      >
        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            if (!detail) return;
            let result;
            if (detail.mode === 'waiting')
              result = await service
                .transitionTask(detail.taskId, 'waiting', {
                  waiting: {
                    waitingFor: String(data.get('for') ?? ''),
                    waitingOn: String(data.get('on') ?? ''),
                    followUpAt: String(data.get('follow') ?? ''),
                    lastActionAt: new Date().toISOString(),
                  },
                })
                .catch(() => undefined);
            else if (detail.mode === 'blocked')
              result = await service
                .transitionTask(detail.taskId, 'blocked', {
                  blocker: {
                    blocker: String(data.get('blocker') ?? ''),
                    blockedAt: new Date().toISOString(),
                    nextAction: String(data.get('next') || '') || undefined,
                  },
                })
                .catch(() => undefined);
            else
              result = await service
                .delegateTask(detail.taskId, {
                  responsibility: String(data.get('responsibility') ?? ''),
                  assignee: String(data.get('assignee') ?? ''),
                  myRole: String(data.get('role') ?? ''),
                  deadline: String(data.get('deadline') || '') || undefined,
                  followUpAt: String(data.get('follow') || '') || undefined,
                })
                .catch(() => undefined);
            if (!result) return;
            setFeedback(result.errors[0] ?? 'Task 已更新。');
            if (result.value) setDetail(undefined);
          }}
        >
          {detail?.mode === 'waiting' && (
            <>
              <Field label="Waiting for" name="for" required />
              <Field label="等待对方完成什么" name="on" required />
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
              <Field label="下一步（可选）" name="next" />
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
              <Field label="Deadline" name="deadline" type="date" />
              <Field label="Follow-up Date" name="follow" type="date" />
            </>
          )}
          <div className="flex justify-end">
            <button className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white">
              保存
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(suggestion)}
        title="AI 分类建议"
        description="Mock AI 只提供建议，确认前不会改变 Task。"
        onClose={() => setSuggestionId(undefined)}
      >
        {suggestion && (
          <div className="mt-6">
            <WorkflowNotice>
              <strong>Mock AI · {suggestion.recommendation}</strong>
              <br />
              {suggestion.reason}
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuggestionId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                暂不调整
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await service.confirmTaskType(
                      suggestion.targetId!,
                      suggestion.recommendation.toLowerCase() as
                        'strategic' | 'normal',
                    );
                    setSuggestionId(undefined);
                  } catch {
                    // The repository publishes the user-facing failure state.
                  }
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                确认分类
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(nextActionTaskId)}
        title="AI 分析阻塞"
        description="Mock AI 建议；确认前不会改变 Task。"
        onClose={() => setNextActionTaskId(undefined)}
      >
        {nextActionTaskId && (
          <div className="mt-6">
            <WorkflowNotice tone="warning">
              <strong>Mock AI：</strong>明确阻塞事项的最终决策人，并安排一次 15
              分钟确认。
            </WorkflowNotice>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNextActionTaskId(undefined)}
                className="h-9 rounded-control border border-app-border px-4 text-sm"
              >
                暂不采用
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await service.confirmBlockedNextAction(
                      nextActionTaskId,
                      '明确最终决策人，并安排一次 15 分钟确认',
                    );
                    setNextActionTaskId(undefined);
                    setFeedback('已确认阻塞项的下一步。');
                  } catch {
                    // The repository publishes the user-facing failure state.
                  }
                }}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white"
              >
                采用建议
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  tone?: 'default' | 'warning';
  today: string;
  move: (taskId: string, status: TaskStatus) => void;
  setDetail: (value: { taskId: string; mode: DetailMode }) => void;
  setSuggestionId: (taskId: string) => void;
  setNextActionTaskId: (taskId: string) => void;
}

function TaskSection({
  title,
  tasks,
  tone = 'default',
  ...actions
}: TaskSectionProps) {
  return (
    <section
      aria-labelledby={`task-group-${title.replaceAll(' ', '-').toLowerCase()}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2
          id={`task-group-${title.replaceAll(' ', '-').toLowerCase()}`}
          className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${tone === 'warning' ? 'text-warning-strong' : 'text-app-subtle'}`}
        >
          {title}
        </h2>
        <span className="text-xs text-app-subtle">{tasks.length}</span>
      </div>
      {tasks.length > 0 ? (
        <div className="overflow-visible rounded-panel border border-app-border bg-app-surface">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              isLast={index === tasks.length - 1}
              {...actions}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-control border border-dashed border-app-border px-4 py-3 text-sm text-app-subtle">
          当前没有需要处理的任务。
        </p>
      )}
    </section>
  );
}

function TaskRow({
  task,
  isLast,
  move,
  setDetail,
  setSuggestionId,
  setNextActionTaskId,
}: Omit<TaskSectionProps, 'title' | 'tasks' | 'today' | 'tone'> & {
  task: Task;
  isLast: boolean;
}) {
  const closeMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
  };
  return (
    <article
      className={`px-4 py-3.5 sm:px-5 ${isLast ? '' : 'border-b border-app-border'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {task.status === 'blocked' && (
              <span className="rounded-badge bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger-strong">
                Blocked
              </span>
            )}
            <h3 className="text-sm font-medium leading-6">{task.title}</h3>
            <span className="text-[11px] text-app-subtle">
              {taskStatusLabel[task.status]}
            </span>
          </div>
          {task.status === 'blocked' && task.blocker && (
            <p className="mt-1 text-xs leading-5 text-danger-strong">
              Blocker: {task.blocker.blocker}
            </p>
          )}
          {task.status === 'waiting' && task.waiting && (
            <p className="mt-1 text-xs leading-5 text-app-muted-foreground">
              Waiting for {task.waiting.waitingFor} · Follow-up{' '}
              {task.waiting.followUpAt}
              {task.delegation
                ? ` · ${task.delegation.assignee} · ${task.delegation.myRole}`
                : ''}
            </p>
          )}
          {task.delegation && task.status !== 'waiting' && (
            <p className="mt-1 text-xs text-app-muted-foreground">
              {task.delegation.assignee} · My Role: {task.delegation.myRole}
            </p>
          )}
          {task.relations.length > 0 && (
            <p className="mt-1 text-xs text-app-subtle">
              {task.relations.map((relation) => relation.label).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {task.status === 'blocked' && (
            <button
              type="button"
              onClick={() => setNextActionTaskId(task.id)}
              className="hidden h-8 rounded-control border border-warning/25 bg-warning-soft px-3 text-xs font-medium text-warning-strong sm:inline-flex sm:items-center"
            >
              解决阻塞
            </button>
          )}
          {task.status === 'inbox' ? (
            <button
              type="button"
              onClick={() => move(task.id, 'in-progress')}
              className="task-action"
            >
              开始
            </button>
          ) : (
            <button
              type="button"
              onClick={() => move(task.id, 'done')}
              className="task-action"
            >
              完成
            </button>
          )}
          <details
            className="relative"
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              event.currentTarget.removeAttribute('open');
              event.currentTarget.querySelector('summary')?.focus();
            }}
          >
            <summary
              aria-label={`更多操作：${task.title}`}
              className="flex size-8 cursor-pointer list-none items-center justify-center rounded-control border border-app-border text-lg leading-none text-app-muted-foreground hover:bg-app-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-app-foreground [&::-webkit-details-marker]:hidden"
            >
              ···
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-control border border-app-border bg-white p-1 shadow-dialog">
              {task.status !== 'in-progress' && (
                <MenuButton
                  label="开始"
                  onClick={(event) => {
                    closeMenu(event);
                    move(task.id, 'in-progress');
                  }}
                />
              )}
              {task.status === 'blocked' && (
                <MenuButton
                  label="解决阻塞"
                  onClick={(event) => {
                    closeMenu(event);
                    setNextActionTaskId(task.id);
                  }}
                />
              )}
              <MenuButton
                label="设为 Waiting"
                onClick={(event) => {
                  closeMenu(event);
                  setDetail({ taskId: task.id, mode: 'waiting' });
                }}
              />
              <MenuButton
                label="记录 Blocked"
                onClick={(event) => {
                  closeMenu(event);
                  setDetail({ taskId: task.id, mode: 'blocked' });
                }}
              />
              <MenuButton
                label="委派"
                onClick={(event) => {
                  closeMenu(event);
                  setDetail({ taskId: task.id, mode: 'delegate' });
                }}
              />
              <MenuButton
                label="AI 重新分析分类"
                onClick={(event) => {
                  closeMenu(event);
                  setSuggestionId(task.id);
                }}
              />
              <MenuButton
                label="取消 Task"
                danger
                onClick={(event) => {
                  closeMenu(event);
                  move(task.id, 'cancelled');
                }}
              />
            </div>
          </details>
        </div>
      </div>
      {task.hardDeadlineAt && (
        <p className="mt-2 text-xs text-danger-strong">
          Hard deadline · {task.hardDeadlineAt.slice(0, 16).replace('T', ' ')}
        </p>
      )}
      {task.targetDate && !task.hardDeadlineAt && (
        <p className="mt-2 text-xs text-app-subtle">
          Target · {task.targetDate}
        </p>
      )}
    </article>
  );
}

function MenuButton({
  label,
  danger = false,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-control px-3 py-2 text-left text-xs hover:bg-app-muted focus-visible:outline-2 focus-visible:outline-app-foreground ${danger ? 'text-danger-strong' : 'text-app-foreground'}`}
    >
      {label}
    </button>
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
