import React from 'react';
import { PipelineRun } from '../../../api/structs/pipeline';
import { Button } from '../../ui';
import AssemblyDraftCard from './AssemblyDraftCard';
import { RunAssemblyState } from './types';

interface CompletedRunAssemblyProps {
  run: PipelineRun;
  runAssembly?: RunAssemblyState;
  copiedPreviewDraftId: string | null;
  onCopyPreview: (draftId: string, payload: Record<string, unknown>) => Promise<void>;
  onRetryLoad: () => Promise<void>;
  onSceneSelection: (draftId: string, rowKey: string, selectedOptionKey: string) => void;
  onAssembleDraft: (draftId: string) => Promise<void>;
  onCloseWorkspace: () => void;
}

const CompletedRunAssembly: React.FC<CompletedRunAssemblyProps> = ({
  run,
  runAssembly,
  copiedPreviewDraftId,
  onCopyPreview,
  onRetryLoad,
  onSceneSelection,
  onAssembleDraft,
  onCloseWorkspace,
}) => {
  const allDraftsAssembled =
    runAssembly?.status === 'ready' &&
    runAssembly.drafts.length > 0 &&
    runAssembly.drafts.every((draft) => draft.status === 'assembled');

  return (
    <div className="attachment-surface space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="attachment-state">Clip Prompt Assembly</p>
          <p className="attachment-meta">Explicitly map scene references, then assemble.</p>
        </div>
        <span className="attachment-meta">Run: {run.id}</span>
      </div>

      {runAssembly?.status === 'loading' && (
        <p className="attachment-meta">Loading pipeline output and scene mappings...</p>
      )}

      {runAssembly?.status === 'error' && (
        <div className="attachment-item border-red-400/40 bg-red-500/10 space-y-2">
          <p className="text-xs text-red-200 uppercase tracking-wide">Assembly Load Failed</p>
          <p className="attachment-meta text-red-100">{runAssembly.loadError}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void onRetryLoad()}>
            Retry Load
          </Button>
        </div>
      )}

      {runAssembly?.status === 'ready' &&
        runAssembly.drafts.map((draft) => (
          <AssemblyDraftCard
            key={draft.id}
            run={run}
            runAssembly={runAssembly}
            draft={draft}
            copiedPreviewDraftId={copiedPreviewDraftId}
            onCopyPreview={onCopyPreview}
            onSceneSelection={onSceneSelection}
            onAssemble={onAssembleDraft}
          />
        ))}

      {allDraftsAssembled && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onCloseWorkspace}>
            Close Run Workspace
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompletedRunAssembly;
