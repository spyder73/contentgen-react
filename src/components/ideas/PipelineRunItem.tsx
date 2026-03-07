import React, { useMemo, useState } from 'react';
import { PipelineRun, PipelineTemplate } from '../../api/structs';
import { MediaAttachment } from '../../api/structs/pipeline';
import { Button, Badge } from '../ui';
import {
  AssetPoolItem,
  evaluateCheckpointRequirements,
  extractCheckpointRequirements,
  normalizeAssetSource,
  pipelineAttachmentToPoolItem,
} from './assetPool';

interface Props {
  run: PipelineRun;
  template: PipelineTemplate;
  onContinue: () => void;
  onRegenerate: (checkpoint: number) => void;
  onInjectPrompt: (
    checkpoint: number,
    text: string,
    options?: { autoRegenerate?: boolean; source?: string }
  ) => Promise<void>;
  onAddAttachment: (
    checkpoint: number,
    attachment: Omit<MediaAttachment, 'id' | 'created_at'>
  ) => Promise<void>;
  onCancel: () => void;
  onRemove: () => void;
}

const DEFAULT_MIME_TYPE = 'application/octet-stream';

const formatMetadataValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return '';

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

const toActionableErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const record = error as
    | {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      }
    | undefined;
  return (
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.message ||
    fallbackMessage
  );
};

const toAttachmentRequest = (asset: AssetPoolItem): Omit<MediaAttachment, 'id' | 'created_at'> => ({
  media_id: asset.media_id,
  type: asset.type || asset.kind || 'file',
  url: asset.url || '',
  mime_type: asset.mime_type || DEFAULT_MIME_TYPE,
  name: asset.name || asset.media_id || asset.id,
  filename: asset.name || asset.media_id || asset.id,
  size_bytes: asset.size_bytes,
  metadata: {
    ...(asset.metadata || {}),
    source: asset.source,
    source_run_id: asset.run_id,
    source_checkpoint_id: asset.checkpoint_id,
    source_checkpoint_index: asset.checkpoint_index,
    reused_from_asset_pool: true,
  },
});

const PipelineRunItem: React.FC<Props> = ({
  run,
  template,
  onContinue,
  onRegenerate,
  onInjectPrompt,
  onAddAttachment,
  onCancel,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [selectedAssetByCheckpoint, setSelectedAssetByCheckpoint] = useState<Record<number, string>>({});
  const [attachLoadingByCheckpoint, setAttachLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [attachErrorByCheckpoint, setAttachErrorByCheckpoint] = useState<Record<number, string>>({});
  const [injectTextByCheckpoint, setInjectTextByCheckpoint] = useState<Record<number, string>>({});
  const [injectLoadingByCheckpoint, setInjectLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [injectErrorByCheckpoint, setInjectErrorByCheckpoint] = useState<Record<number, string>>({});

  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const isPaused = run.status === 'paused';

  const checkpointRequirements = useMemo(
    () => template.checkpoints.map((checkpoint) => extractCheckpointRequirements(checkpoint)),
    [template.checkpoints]
  );

  const reusablePoolAssets = useMemo(() => {
    const items: AssetPoolItem[] = [];

    (run.initial_attachments || []).forEach((attachment) => {
      const normalizedSource = normalizeAssetSource(attachment.source);
      items.push(
        pipelineAttachmentToPoolItem(attachment, {
          source: normalizedSource === 'unknown' ? 'media' : normalizedSource,
          runId: run.id,
        })
      );
    });

    (run.results || []).forEach((result, checkpointIndex) => {
      const checkpointName =
        template.checkpoints[checkpointIndex]?.name || result.checkpoint_id || `Checkpoint ${checkpointIndex + 1}`;
      (result.attachments || []).forEach((attachment) => {
        const normalizedSource = normalizeAssetSource(attachment.source);
        items.push(
          pipelineAttachmentToPoolItem(attachment, {
            source: normalizedSource === 'unknown' ? 'generated' : normalizedSource,
            runId: run.id,
            checkpointId: result.checkpoint_id,
            checkpointName,
            checkpointIndex,
          })
        );
      });
    });

    const deduped = new Map<string, AssetPoolItem>();
    items.forEach((item) => deduped.set(item.id, item));
    return Array.from(deduped.values());
  }, [run.id, run.initial_attachments, run.results, template.checkpoints]);

  const getStatusBadge = () => {
    switch (run.status) {
      case 'running':
        return <Badge variant="blue">Running</Badge>;
      case 'paused':
        return <Badge variant="yellow">Awaiting Review</Badge>;
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      case 'failed':
        return <Badge variant="red">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{run.status}</Badge>;
    }
  };

  const getProgressPercent = () => {
    const total = template.checkpoints.length || 1;
    if (isTerminal) return 100;
    return Math.round((run.current_checkpoint / total) * 100);
  };

  const formatOutput = (output: string): string => {
    try {
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  };

  const getCheckpointType = (index: number): 'prompt' | 'distributor' | 'connector' => {
    return template.checkpoints[index]?.type || 'prompt';
  };

  const getFanInSources = (index: number): string[] => {
    const checkpoint = template.checkpoints[index];
    if (!checkpoint) return [];

    if ((checkpoint.type || 'prompt') !== 'connector') {
      return [];
    }

    const configuredSource = checkpoint.connector?.source_checkpoint_id;
    if (configuredSource) {
      const source = template.checkpoints.find((item) => item.id === configuredSource);
      if ((source?.type || 'prompt') === 'distributor') {
        return [configuredSource];
      }
    }

    for (let i = index - 1; i >= 0; i--) {
      const candidate = template.checkpoints[i];
      if ((candidate?.type || 'prompt') === 'distributor') {
        return [candidate.id];
      }
    }
    return [];
  };

  const getReusableAssetsForCheckpoint = (checkpointIndex: number): AssetPoolItem[] =>
    reusablePoolAssets.filter((asset) => {
      if (asset.checkpoint_index === undefined || asset.checkpoint_index === null) return true;
      return asset.checkpoint_index < checkpointIndex;
    });

  const handleAttachFromPool = async (checkpointIndex: number) => {
    const selectedAssetId = selectedAssetByCheckpoint[checkpointIndex];
    if (!selectedAssetId) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: 'Select an asset from the pool first.',
      }));
      return;
    }

    const selectedAsset = getReusableAssetsForCheckpoint(checkpointIndex).find(
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

  const renderAttachmentSurface = (
    heading: string,
    options: {
      attachments?: PipelineRun['initial_attachments'];
      loadingText?: string;
      emptyText: string;
      unavailableText: string;
      errorText?: string;
    }
  ) => {
    const { attachments, loadingText, emptyText, unavailableText, errorText } = options;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    return (
      <div className="attachment-surface space-y-2">
        <p className="attachment-state">{heading}</p>
        {loadingText && <p className="attachment-state">{loadingText}</p>}
        {errorText && <p className="attachment-state">{errorText}</p>}
        {!loadingText && !errorText && attachments === undefined && (
          <p className="attachment-state">{unavailableText}</p>
        )}
        {!loadingText && !errorText && Array.isArray(attachments) && attachments.length === 0 && (
          <p className="attachment-state">{emptyText}</p>
        )}
        {hasAttachments && (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const metadataEntries = attachment.metadata ? Object.entries(attachment.metadata) : [];
              return (
                <div key={attachment.id} className="attachment-item">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-200 truncate">{attachment.name || attachment.id}</p>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">{attachment.type}</span>
                  </div>
                  <p className="attachment-meta mt-1">
                    MIME: {attachment.mime_type || 'unknown'}
                    {attachment.size_bytes ? ` | ${attachment.size_bytes} bytes` : ''}
                  </p>
                  {attachment.url ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="attachment-meta underline mt-1 inline-block"
                    >
                      {attachment.url}
                    </a>
                  ) : (
                    <p className="attachment-meta mt-1">No URL provided.</p>
                  )}
                  {metadataEntries.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {metadataEntries.map(([key, value]) => (
                        <p key={`${attachment.id}-${key}`} className="attachment-meta">
                          {key}: {formatMetadataValue(value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pipeline-run-item bg-black/50 border border-white/15 overflow-hidden">
      <div
        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {run.initial_input.slice(0, 56)}
              {run.initial_input.length > 56 ? '...' : ''}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              {template.name} | Step {run.current_checkpoint + 1}/{template.checkpoints.length}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 ml-3">
          {!isTerminal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}
          <span className="text-slate-400 text-xs uppercase tracking-wide">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>

      <div className="h-1 bg-white/10">
        <div
          className={`h-full transition-all duration-300 pipeline-progress ${
            run.status === 'completed' ? 'bg-white' : 'bg-zinc-400'
          }`}
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>

      {isExpanded && (
        <div>
          <div className="p-3 space-y-2">
            {renderAttachmentSurface('Initial Attachments', {
              attachments: run.initial_attachments,
              loadingText:
                run.initial_attachments === undefined && ['pending', 'running'].includes(run.status)
                  ? 'Loading initial attachments...'
                  : undefined,
              emptyText: 'No initial attachments.',
              unavailableText: 'Attachment payload unavailable in this run response.',
            })}

            {template.checkpoints.map((checkpoint, index) => {
              const result = run.results?.[index];
              const checkpointType = getCheckpointType(index);
              const fanInSources = getFanInSources(index);
              const isCurrent = index === run.current_checkpoint;
              const isComplete = result?.status === 'completed';
              const isFailed = result?.status === 'failed';
              const isPending = !result;

              const requirementSummary = evaluateCheckpointRequirements(
                checkpointRequirements[index],
                (result?.attachments || []).map((attachment) =>
                  pipelineAttachmentToPoolItem(attachment, {
                    source: (() => {
                      const normalizedSource = normalizeAssetSource(attachment.source);
                      return normalizedSource === 'unknown' ? 'generated' : normalizedSource;
                    })(),
                    runId: run.id,
                    checkpointId: checkpoint.id,
                    checkpointName: checkpoint.name,
                    checkpointIndex: index,
                  })
                )
              );
              const hasRequiredAssets = checkpointRequirements[index].length > 0;
              const canContinueCurrentCheckpoint = !hasRequiredAssets || requirementSummary.satisfied;
              const reusableOptions = getReusableAssetsForCheckpoint(index);
              const selectedAssetId = selectedAssetByCheckpoint[index] || '';
              const selectedAsset = reusableOptions.find((item) => item.id === selectedAssetId) || null;
              const injectText = injectTextByCheckpoint[index] || '';

              return (
                <div
                  key={checkpoint.id}
                  className={`rounded border ${
                    isCurrent && !isTerminal ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-2.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
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
                    <div className="px-2.5 pb-2.5 space-y-2" onClick={(e) => e.stopPropagation()}>
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

                      {checkpoint.allow_attachments &&
                        renderAttachmentSurface(`Checkpoint ${index + 1} Attachments`, {
                          attachments: result?.attachments,
                          loadingText: !result ? 'Waiting for checkpoint result...' : undefined,
                          emptyText: 'No attachments produced for this checkpoint.',
                          unavailableText: 'Attachment payload unavailable for this checkpoint.',
                          errorText:
                            result?.status === 'failed'
                              ? 'Checkpoint failed; attachment output may be incomplete.'
                              : undefined,
                        })}

                      {checkpoint.allow_attachments && !isTerminal && (
                        <div className="attachment-surface space-y-2">
                          <p className="attachment-state">Attach From Asset Pool</p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              value={selectedAssetId}
                              onChange={(event) =>
                                setSelectedAssetByCheckpoint((prev) => ({
                                  ...prev,
                                  [index]: event.target.value,
                                }))
                              }
                              className="w-full select sm:flex-1"
                            >
                              <option value="">
                                {reusableOptions.length > 0
                                  ? 'Select asset reference...'
                                  : 'No reusable assets yet'}
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
                              onClick={() => handleAttachFromPool(index)}
                              disabled={!selectedAssetId || attachLoadingByCheckpoint[index]}
                            >
                              {attachLoadingByCheckpoint[index] ? 'Attaching...' : 'Attach'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedAssetByCheckpoint((prev) => ({ ...prev, [index]: '' }))
                              }
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
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleInjectPrompt(index);
                                }}
                                disabled={!injectText.trim() || injectLoadingByCheckpoint[index]}
                              >
                                {injectLoadingByCheckpoint[index]
                                  ? 'Injecting...'
                                  : 'Inject + Regenerate'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setInjectTextByCheckpoint((prev) => ({ ...prev, [index]: '' }))
                                }
                                disabled={!injectText}
                              >
                                Clear Guidance
                              </Button>
                              <span className="attachment-meta">
                                Guidance is run-scoped and append-only for this checkpoint.
                              </span>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRegenerate(index);
                                }}
                              >
                                Regenerate
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
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
                          onClick={(e) => {
                            e.stopPropagation();
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
          </div>

          {isTerminal && (
            <div className="px-3 pb-3">
              <div className="flex justify-between items-center p-2.5 bg-black/40 border border-white/15 rounded">
                {run.status === 'completed' && (
                  <p className="text-xs text-zinc-200 uppercase tracking-wide">Pipeline completed</p>
                )}
                {run.status === 'failed' && (
                  <p className="text-xs text-zinc-200 uppercase tracking-wide">Pipeline failed</p>
                )}
                {run.status === 'cancelled' && (
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Pipeline cancelled</p>
                )}
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineRunItem;
