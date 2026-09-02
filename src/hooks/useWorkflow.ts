import { useCallback, useEffect, useMemo, useState } from 'react';

import type { WorkflowState } from '@/domain/workflow/types';
import {
  LocalWorkflowRepository,
  WORKFLOW_CHANGED_EVENT,
} from '@/repositories/local/workflow-local.repository';
import { WorkflowService } from '@/services/workflow/workflow.service';

export function useWorkflow() {
  const repository = useMemo(() => new LocalWorkflowRepository(), []);
  const service = useMemo(() => new WorkflowService(repository), [repository]);
  const [state, setState] = useState<WorkflowState>(() => repository.load());
  const refresh = useCallback(() => setState(repository.load()), [repository]);

  useEffect(() => {
    window.addEventListener(WORKFLOW_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(WORKFLOW_CHANGED_EVENT, refresh);
  }, [refresh]);

  return { state, service, refresh, reset: () => repository.reset() };
}
