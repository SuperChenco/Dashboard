import { useEffect, useState } from 'react';

import WorkflowNotice from '@/components/workflow/WorkflowNotice';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { createWorkflowRepository } from '@/repositories/factory';
import {
  detectLocalWorkflowMigration,
  migrateLocalWorkflow,
  type MigrationPreview,
} from '@/services/migration/workflow-migration';

interface DataSettingsProps {
  cloudEnabled: boolean;
}

export default function DataSettings({ cloudEnabled }: DataSettingsProps) {
  const [preview, setPreview] = useState<MigrationPreview | null>();
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done'>('idle');
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (!cloudEnabled) return;
    void detectLocalWorkflowMigration()
      .then(setPreview)
      .catch((error: unknown) =>
        setMessage(
          error instanceof Error ? error.message : '本地数据检测失败。',
        ),
      );
  }, [cloudEnabled]);

  const migrate = async () => {
    if (!preview || status === 'migrating') return;
    setStatus('migrating');
    setMessage(undefined);
    try {
      const result = await migrateLocalWorkflow(
        preview,
        createWorkflowRepository(),
        createBrowserSupabaseClient(),
      );
      setStatus('done');
      setMessage(
        result === 'already-completed'
          ? '这批数据已经迁移过，未创建重复记录。'
          : '迁移与云端校验已完成。本地数据仍保留，可在确认稳定后自行清理。',
      );
    } catch (error) {
      setStatus('idle');
      setMessage(error instanceof Error ? error.message : '迁移失败。');
    }
  };

  return (
    <div className="space-y-5">
      {!cloudEnabled && (
        <WorkflowNotice tone="neutral">
          当前为 Local development。配置 Supabase 后才会开放云端迁移与导出。
        </WorkflowNotice>
      )}
      {message && (
        <WorkflowNotice tone={status === 'done' ? 'success' : 'danger'}>
          {message}
        </WorkflowNotice>
      )}
      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <p className="goal-label">LocalStorage Migration</p>
        <h2 className="mt-2 text-base font-semibold">迁移 Phase 2 本地数据</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
          系统只检测并预览，不会静默上传，也不会自动删除本地数据。
        </p>
        {cloudEnabled && preview === undefined && (
          <p className="mt-4 text-sm text-app-subtle" aria-live="polite">
            正在检测本地数据…
          </p>
        )}
        {cloudEnabled && preview === null && (
          <p className="mt-4 text-sm text-app-subtle">
            未发现可迁移的 Phase 2 LocalStorage 数据。
          </p>
        )}
        {preview && (
          <div className="mt-5 rounded-control border border-app-border bg-app-muted p-4">
            <p className="text-sm font-medium">迁移预览</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              {Object.entries(preview.counts).map(([label, count]) => (
                <div key={label}>
                  <dt className="text-app-subtle">{label}</dt>
                  <dd className="mt-1 font-medium">{count}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => void migrate()}
              disabled={status === 'migrating'}
              className="mt-5 h-10 rounded-control bg-app-foreground px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {status === 'migrating' ? '正在验证并上传…' : '确认迁移到云端'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-panel border border-app-border bg-app-surface p-5 sm:p-6">
        <p className="goal-label">Export</p>
        <h2 className="mt-2 text-base font-semibold">Export My Data</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted-foreground">
          导出当前 Owner 的 CEO OS 数据为 JSON。导入功能留待后续阶段。
        </p>
        {cloudEnabled ? (
          <a
            href="/api/export"
            className="task-action mt-5 inline-flex items-center"
          >
            下载 JSON
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="task-action mt-5 opacity-50"
          >
            等待云端配置
          </button>
        )}
      </section>
    </div>
  );
}
