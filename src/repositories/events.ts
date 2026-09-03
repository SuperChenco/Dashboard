export const WORKFLOW_CHANGED_EVENT = 'pceo:workflow-changed';
export const WORKFLOW_ERROR_EVENT = 'pceo:workflow-error';

export function notifyWorkflowChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WORKFLOW_CHANGED_EVENT));
  }
}

export function notifyWorkflowError(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<string>(WORKFLOW_ERROR_EVENT, { detail: message }),
    );
  }
}
