import { useEffect, useId, useRef, type ReactNode } from 'react';

import Icon from './Icon';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(94vw,38rem)] rounded-modal border border-app-border bg-app-surface p-0 text-app-foreground shadow-dialog backdrop:bg-slate-950/25"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1.5 text-sm leading-6 text-app-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-control text-app-muted-foreground transition-colors hover:bg-app-muted hover:text-app-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-foreground"
            aria-label="关闭"
            onClick={onClose}
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
