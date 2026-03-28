import React from 'react';
import { PipelineRun } from '../../../api/structs/pipeline';
import { Button } from '../../ui';
import { ClipAssemblyDraft, RunAssemblyState } from './types';
import { buildAssembledClipPromptPayload } from './assemblyPayload';
import { getBlockingReferenceCount } from './assemblyErrors';
import SceneReferenceBindingRow from './SceneReferenceBindingRow';
import AssemblyScenePreview from './AssemblyScenePreview';

interface AssemblyDraftCardProps {
  run: PipelineRun;
  runAssembly: RunAssemblyState;
  draft: ClipAssemblyDraft;
  copiedPreviewDraftId: string | null;
  onCopyPreview: (draftId: string, payload: Record<string, unknown>) => Promise<void>;
  onSceneSelection: (draftId: string, rowKey: string, selectedOptionKey: string) => void;
  onAssemble: (draftId: string) => Promise<void>;
}

const AssemblyDraftCard: React.FC<AssemblyDraftCardProps> = ({
  run,
  runAssembly,
  draft,
  copiedPreviewDraftId,
  onCopyPreview,
  onSceneSelection,
  onAssemble,
}) => {
  const unresolvedCount = getBlockingReferenceCount(draft.rows);
  const disableAssemble =
    draft.status === 'assembling' || draft.status === 'assembled' || unresolvedCount > 0;

  const previewPayload = (() => {
    try {
      return buildAssembledClipPromptPayload(
        draft.promptJson,
        run,
        runAssembly.runProvenance,
        draft.rows,
        runAssembly.options
      );
    } catch {
      return null;
    }
  })();

  return (
    <div key={draft.id} className="attachment-item space-y-2" data-testid={`assembly-draft-${draft.id}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-100 uppercase tracking-wide">{draft.title}</p>
        <span className="attachment-meta">
          {draft.status === 'assembled'
            ? 'Assembled'
            : draft.status === 'assembling'
            ? 'Assembling...'
            : unresolvedCount > 0
            ? `${unresolvedCount} unresolved`
            : 'Ready to assemble'}
        </span>
      </div>

      {draft.rows.length === 0 ? (
        <p className="attachment-meta">No scene rows detected; assemble will preserve existing metadata as-is.</p>
      ) : (
        <div className="space-y-2">
          {draft.rows
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((row) => (
              <SceneReferenceBindingRow
                key={row.key}
                row={row}
                options={runAssembly.options}
                onSelect={(rowKey, selectedOptionKey) => onSceneSelection(draft.id, rowKey, selectedOptionKey)}
              />
            ))}
        </div>
      )}

      {previewPayload ? (
        <AssemblyScenePreview payload={previewPayload} />
      ) : (
        <p className="attachment-meta text-red-200">Unable to generate scene preview for this draft.</p>
      )}

      <details className="attachment-item space-y-2">
        <summary className="cursor-pointer text-xs text-zinc-500 uppercase tracking-wide">Advanced · View JSON</summary>
        {previewPayload ? (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => onCopyPreview(draft.id, previewPayload)}>
                {copiedPreviewDraftId === draft.id ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <pre
              className="rounded border border-white/15 bg-black/50 p-2 text-[11px] leading-relaxed text-zinc-200 overflow-auto max-h-72"
              data-testid={`json-preview-${draft.id}`}
            >
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </div>
        ) : null}
      </details>

      {draft.errorMessage && <p className="attachment-meta text-red-200">{draft.errorMessage}</p>}

      <Button
        type="button"
        variant="primary"
        size="sm"
        loading={draft.status === 'assembling'}
        onClick={() => void onAssemble(draft.id)}
        disabled={disableAssemble}
      >
        Assemble Clip Prompt
      </Button>
    </div>
  );
};

export default AssemblyDraftCard;
