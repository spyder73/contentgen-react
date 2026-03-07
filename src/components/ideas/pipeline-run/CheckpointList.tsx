import React, { useState } from 'react';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';
import { CheckpointInjectionMode, MediaAttachment } from '../../../api/structs/pipeline';
import { Button } from '../../ui';
import {
  AssetPoolItem,
  NormalizedCheckpointAssetRequirement,
  RequirementMatchDetail,
} from '../assetPool';
import AttachmentSurface from './AttachmentSurface';
import {
  formatOutput,
  getCheckpointType,
  getFanInSources,
  getReusableAssetsForCheckpoint,
  modeLabel,
  toActionableErrorMessage,
  toAttachmentRequest,
} from './helpers';

interface CheckpointListProps {
  run: PipelineRun;
  template: PipelineTemplate;
  isTerminal: boolean;
  isPaused: boolean;
  checkpointRequirements: NormalizedCheckpointAssetRequirement[][];
  evaluateRequirementDetails: (
    index: number,
    attachments: PipelineRun['results'][number]['attachments'] | undefined
  ) => { satisfied: boolean; details: RequirementMatchDetail[] };
  reusablePoolAssets: AssetPoolItem[];
  onContinue: () => void;
  onRegenerate: (checkpoint: number) => void;
  onInjectPrompt: (
    checkpoint: number,
    text: string,
    options?: {
      autoRegenerate?: boolean;
      source?: string;
      mode?: CheckpointInjectionMode;
    }
  ) => Promise<void>;
  onAddAttachment: (
    checkpoint: number,
    attachment: Omit<MediaAttachment, 'id' | 'created_at'>
  ) => Promise<void>;
}

const CheckpointList: React.FC<CheckpointListProps> = ({
  run,
  template,
  isTerminal,
  isPaused,
  checkpointRequirements,
  evaluateRequirementDetails,
  reusablePoolAssets,
  onContinue,
  onRegenerate,
  onInjectPrompt,
  onAddAttachment,
}) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [selectedAssetByCheckpoint, setSelectedAssetByCheckpoint] = useState<Record<number, string>>({});
  const [attachLoadingByCheckpoint, setAttachLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [attachErrorByCheckpoint, setAttachErrorByCheckpoint] = useState<Record<number, string>>({});
  const [injectTextByCheckpoint, setInjectTextByCheckpoint] = useState<Record<number, string>>({});
  const [injectModeByCheckpoint, setInjectModeByCheckpoint] = useState<Record<number, CheckpointInjectionMode>>({});
  const [injectLoadingByCheckpoint, setInjectLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [injectErrorByCheckpoint, setInjectErrorByCheckpoint] = useState<Record<number, string>>({});

  const handleAttachFromPool = async (checkpointIndex: number) => {
    const selectedAssetId = selectedAssetByCheckpoint[checkpointIndex];
    if (!selectedAssetId) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: 'Select an asset from the pool first.',
      }));
      return;
    }

    const selectedAsset = getReusableAssetsForCheckpoint(reusablePoolAssets, checkpointIndex).find(
      (asset) => asset.id === selectedAssetId
    );
    if (!selectedAsset) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: 'Selected asset is no longer available for this checkpoint.',
      }));
      return;
    }

    if (!selectedAsset.media_id && !selectedAsset.url) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: 'Selected asset has no media ID or URL to bind.',
      }));
      return;
    }

    setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));

    try {
      await onAddAttachment(checkpointIndex, toAttachmentRequest(selectedAsset));
      setSelectedAssetByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: toActionableErrorMessage(
          error,
          'Failed to attach selected asset to this checkpoint.'
        ),
      }));
    } finally {
      setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleInjectPrompt = async (checkpointIndex: number) => {
    const guidance = (injectTextByCheckpoint[checkpointIndex] || '').trim();
    const mode = injectModeByCheckpoint[checkpointIndex] || 'guidance_only';
    if (!guidance) {
      setInjectErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: 'Enter prompt guidance before injecting.',
      }));
      return;
    }

    setInjectLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setInjectErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));

    try {
      await onInjectPrompt(checkpointIndex, guidance, {
        autoRegenerate: true,
        source: 'frontend_pause_checkpoint',
        mode,
      });
      setInjectTextByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      setInjectErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: toActionableErrorMessage(error, 'Failed to inject prompt guidance.'),
      }));
    } finally {
      setInjectLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  return (
    <>
      {template.checkpoints.map((checkpoint, index) => {
        const result = run.results?.[index];
        const checkpointType = getCheckpointType(template, index);
        const fanInSources = getFanInSources(template.checkpoints, index);
        const isCurrent = index === run.current_checkpoint;
        const isComplete = result?.status === 'completed';
        const isFailed = result?.status === 'failed';
        const isPending = !result;
        const requirementSummary = evaluateRequirementDetails(index, result?.attachments);
        const hasRequiredAssets = checkpointRequirements[index].length > 0;
        const canContinueCurrentCheckpoint = !hasRequiredAssets || requirementSummary.satisfied;
        const reusableOptions = getReusableAssetsForCheckpoint(reusablePoolAssets, index);
        const selectedAssetId = selectedAssetByCheckpoint[index] || '';
        const selectedAsset = reusableOptions.find((item) => item.id === selectedAssetId) || null;
        const injectText = injectTextByCheckpoint[index] || '';
        const injectMode = injectModeByCheckpoint[index] || 'guidance_only';

        return (
          <div
            key={checkpoint.id}
            className={`rounded border ${
              isCurrent && !isTerminal ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/10'
            }`}
          >
            <div
              className="flex items-center justify-between p-2.5 cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                if (result || checkpoint.allow_attachments) {
                  setSelectedCheckpoint(selectedCheckpoint === index ? null : index);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isComplete
                      ? 'bg-white text-black'
                      : isFailed
                      ? 'bg-zinc-500 text-black'
                      : isCurrent && !isTerminal
                      ? 'bg-zinc-200 text-black animate-pulse'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {isComplete ? 'OK' : isFailed ? 'X' : isPending ? '-' : index + 1}
                </span>
                <span className="text-white font-medium text-xs">{checkpoint.name}</span>
                {checkpointType === 'distributor' && (
                  <span className="text-[10px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">
                    Distributor
                  </span>
                )}
                {checkpointType === 'connector' && (
                  <span className="text-[10px] uppercase tracking-wide bg-zinc-800 border border-white/20 text-zinc-200 px-1.5 py-0.5 rounded">
                    Connector
                  </span>
                )}
                {hasRequiredAssets && (
                  <span
                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                      requirementSummary.satisfied
                        ? 'border-emerald-500/40 text-emerald-300'
                        : 'border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {requirementSummary.satisfied ? 'Assets Ready' : 'Assets Missing'}
                  </span>
                )}
              </div>

              {(result || checkpoint.allow_attachments) && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {selectedCheckpoint === index ? 'Hide' : 'Show'}
                </span>
              )}
            </div>

            {selectedCheckpoint === index && (result || checkpoint.allow_attachments) && (
              <div className="px-2.5 pb-2.5 space-y-2" onClick={(event) => event.stopPropagation()}>
                {result && checkpointType === 'distributor' && (
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
                    Fan-out: {(result.child_pipeline_ids || []).length} child pipeline
                    {(result.child_pipeline_ids || []).length === 1 ? '' : 's'}
                    {result.child_pipeline_ids && result.child_pipeline_ids.length > 0
                      ? ` (${result.child_pipeline_ids.join(', ')})`
                      : ''}
                  </div>
                )}
                {result && fanInSources.length > 0 && (
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
                    Fan-in from {fanInSources.join(', ')}
                  </div>
                )}

                {hasRequiredAssets && (
                  <div className="attachment-surface space-y-1">
                    <p className="attachment-state">Required Asset Status</p>
                    {requirementSummary.details.map((detail) => (
                      <p key={`${checkpoint.id}-${detail.requirement.id}`} className="attachment-meta">
                        {detail.requirement.label}: {detail.matched_count}/{detail.requirement.min_count}
                        {detail.satisfied ? ' (ok)' : ` (missing ${detail.missing_count})`}
                      </p>
                    ))}
                  </div>
                )}

                {result && (
                  <pre className="text-[11px] text-slate-300 bg-black/70 p-2 rounded overflow-auto max-h-56 border border-white/10">
                    {formatOutput(result.output)}
                  </pre>
                )}

                {checkpoint.allow_attachments && (
                  <AttachmentSurface
                    heading={`Checkpoint ${index + 1} Attachments`}
                    attachments={result?.attachments}
                    loadingText={!result ? 'Waiting for checkpoint result...' : undefined}
                    emptyText="No attachments produced for this checkpoint."
                    unavailableText="Attachment payload unavailable for this checkpoint."
                    errorText={
                      result?.status === 'failed'
                        ? 'Checkpoint failed; attachment output may be incomplete.'
                        : undefined
                    }
                  />
                )}

                {checkpoint.allow_attachments && !isTerminal && (
                  <div className="attachment-surface space-y-2">
                    <p className="attachment-state">Attach From Asset Pool</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={selectedAssetId}
                        onChange={(event) =>
                          setSelectedAssetByCheckpoint((prev) => ({ ...prev, [index]: event.target.value }))
                        }
                        className="w-full select sm:flex-1"
                      >
                        <option value="">
                          {reusableOptions.length > 0 ? 'Select asset reference...' : 'No reusable assets yet'}
                        </option>
                        {reusableOptions.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name} ({asset.kind} · {asset.source}
                            {asset.checkpoint_name ? ` · ${asset.checkpoint_name}` : ''})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleAttachFromPool(index)}
                        disabled={!selectedAssetId || attachLoadingByCheckpoint[index]}
                      >
                        {attachLoadingByCheckpoint[index] ? 'Attaching...' : 'Attach'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAssetByCheckpoint((prev) => ({ ...prev, [index]: '' }))}
                        disabled={!selectedAssetId}
                      >
                        Clear
                      </Button>
                    </div>
                    {selectedAsset && (
                      <p className="attachment-meta">
                        Selected reference: {selectedAsset.name} ({selectedAsset.kind} · {selectedAsset.source})
                      </p>
                    )}
                    {attachErrorByCheckpoint[index] && (
                      <p className="attachment-meta text-red-300">{attachErrorByCheckpoint[index]}</p>
                    )}
                  </div>
                )}

                {result && isCurrent && isPaused && (
                  <div className="space-y-2 p-2 border border-white/20 bg-white/5 rounded">
                    <p className="text-xs text-zinc-300">
                      {canContinueCurrentCheckpoint
                        ? 'Review output before continuing.'
                        : 'Attach required assets before continuing.'}
                    </p>

                    <div className="space-y-2">
                      <label className="attachment-state" htmlFor={`inject-guidance-${run.id}-${index}`}>
                        Additive Prompt Guidance
                      </label>
                      <textarea
                        id={`inject-guidance-${run.id}-${index}`}
                        value={injectText}
                        onChange={(event) => {
                          const next = event.target.value;
                          setInjectTextByCheckpoint((prev) => ({ ...prev, [index]: next }));
                          if (injectErrorByCheckpoint[index]) {
                            setInjectErrorByCheckpoint((prev) => ({ ...prev, [index]: '' }));
                          }
                        }}
                        className="w-full input min-h-20"
                        placeholder="Add focused guidance to merge with this checkpoint prompt..."
                      />
                      <div className="space-y-1">
                        <p className="attachment-state">Regeneration Context Mode</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="attachment-meta flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`inject-mode-${run.id}-${index}`}
                              checked={injectMode === 'guidance_only'}
                              onChange={() =>
                                setInjectModeByCheckpoint((prev) => ({
                                  ...prev,
                                  [index]: 'guidance_only',
                                }))
                              }
                            />
                            Guidance only
                          </label>
                          <label className="attachment-meta flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`inject-mode-${run.id}-${index}`}
                              checked={injectMode === 'with_prior_output_context'}
                              onChange={() =>
                                setInjectModeByCheckpoint((prev) => ({
                                  ...prev,
                                  [index]: 'with_prior_output_context',
                                }))
                              }
                            />
                            Guidance + prior output context
                          </label>
                        </div>
                        <p className="attachment-meta">Active mode: {modeLabel(injectMode)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleInjectPrompt(index);
                          }}
                          disabled={!injectText.trim() || injectLoadingByCheckpoint[index]}
                        >
                          {injectLoadingByCheckpoint[index] ? 'Injecting...' : 'Inject + Regenerate'}
                        </Button>
                        <span className="attachment-meta">Guidance is run-scoped and append-only for this checkpoint.</span>
                      </div>
                      {injectErrorByCheckpoint[index] && (
                        <p className="attachment-meta text-red-300">{injectErrorByCheckpoint[index]}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {checkpoint.allow_regenerate && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRegenerate(index);
                          }}
                        >
                          Regenerate
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          onContinue();
                        }}
                        disabled={!canContinueCurrentCheckpoint}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {result && !isCurrent && checkpoint.allow_regenerate && !isTerminal && isComplete && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRegenerate(index);
                    }}
                  >
                    Regenerate Step
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default CheckpointList;
