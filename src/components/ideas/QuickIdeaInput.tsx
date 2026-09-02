import { useRef, useState } from 'react';

import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import { LocalWorkflowRepository } from '@/repositories/local/workflow-local.repository';
import { WorkflowService } from '@/services/workflow/workflow.service';

interface QuickIdeaInputProps {
  variant?: 'primary' | 'compact' | 'inline';
}

const triggerClasses = {
  primary:
    'inline-flex h-9 items-center gap-2 rounded-control bg-app-foreground px-3.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground',
  compact:
    'inline-flex h-9 items-center gap-1.5 rounded-control bg-app-foreground px-3 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground',
  inline:
    'inline-flex h-10 items-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground',
};

export default function QuickIdeaInput({
  variant = 'primary',
}: QuickIdeaInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setIsOpen(false);
    setIdea('');
    setIsSaved(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses[variant]}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <Icon name="plus" className="size-4" />
        新想法
      </button>

      <Modal
        open={isOpen}
        title="快速记录新想法"
        description="先记录，暂不分类。保存到当前浏览器 Local Mock，不调用 AI。"
        onClose={close}
      >
        {isSaved ? (
          <div className="mt-6" aria-live="polite">
            <div className="rounded-panel border border-success/20 bg-success-soft px-4 py-4">
              <p className="text-sm font-semibold text-success-strong">
                Idea 已保存到 Local Mock
              </p>
              <p className="mt-1 text-sm leading-6 text-success-strong/80">
                未写入数据库，也没有自动触发 AI 分析。可在 Ideas 页面继续处理。
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground"
                onClick={close}
              >
                完成
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (idea.trim()) {
                const service = new WorkflowService(
                  new LocalWorkflowRepository(),
                );
                if (service.createIdea(idea).value) setIsSaved(true);
              }
            }}
          >
            <label htmlFor="quick-idea" className="sr-only">
              想法内容
            </label>
            <textarea
              id="quick-idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              autoFocus
              rows={6}
              maxLength={1000}
              placeholder="现在想到什么？"
              className="w-full resize-none rounded-panel border border-app-border bg-white px-4 py-3 text-base leading-7 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="rounded-badge border border-app-border bg-app-muted px-2 py-0.5 text-[11px] font-medium text-app-muted-foreground">
                Phase 2 Local Mock
              </span>
              <span className="text-xs text-app-muted-foreground">
                {idea.length} / 1000
              </span>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="h-9 rounded-control border border-app-border bg-white px-4 text-sm font-medium text-app-muted-foreground transition-colors hover:bg-app-muted hover:text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground"
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!idea.trim()}
                className="h-9 rounded-control bg-app-foreground px-4 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground disabled:cursor-not-allowed disabled:opacity-35"
              >
                Save Idea
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
