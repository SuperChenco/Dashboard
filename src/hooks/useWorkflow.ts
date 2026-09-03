import { useCallback, useEffect, useMemo, useState } from 'react';

import { createEmptyWorkflowState } from '@/data/workflow-state';
import type { WorkflowState } from '@/domain/workflow/types';
import {
  WORKFLOW_CHANGED_EVENT,
  WORKFLOW_ERROR_EVENT,
} from '@/repositories/events';
import { createWorkflowRepository } from '@/repositories/factory';
import { WorkflowService } from '@/services/workflow/workflow.service';

export function useWorkflow() {
  const repository = useMemo(() => createWorkflowRepository(), []);
  const service = useMemo(() => new WorkflowService(repository), [repository]);
  const [state, setState] = useState<WorkflowState>(createEmptyWorkflowState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setState(await repository.load());
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '数据加载失败。');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    let active = true;
    void repository
      .load()
      .then((nextState) => {
        if (!active) return;
        setState(nextState);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : '数据加载失败。');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const handleChange = () => void refresh();
    const handleVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const handleError = (event: Event) => {
      setError((event as CustomEvent<string>).detail);
      setIsLoading(false);
    };
    window.addEventListener(WORKFLOW_CHANGED_EVENT, handleChange);
    window.addEventListener(WORKFLOW_ERROR_EVENT, handleError);
    window.addEventListener('focus', handleChange);
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      active = false;
      window.removeEventListener(WORKFLOW_CHANGED_EVENT, handleChange);
      window.removeEventListener(WORKFLOW_ERROR_EVENT, handleError);
      window.removeEventListener('focus', handleChange);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [refresh, repository]);

  return {
    state,
    service,
    refresh,
    reset: () => repository.reset(),
    isLoading,
    error,
    repositoryKind: repository.kind,
  };
}
