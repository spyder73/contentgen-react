import React from 'react';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';
import { NormalizedCheckpointAssetRequirement, RequirementMatchDetail } from '../assetPool';
import AttachmentSurface from './AttachmentSurface';
import { CheckpointInteractionState } from './checkpointCardTypes';
import ConnectorSceneReferences, { toConnectorSceneReferenceEntries } from './ConnectorSceneReferences';
import {
  formatOutput,
  getCheckpointModelContext,
  getCheckpointType,
  getFanInSources,
} from './helpers';
import CheckpointPauseControls from './CheckpointPauseControls';

interface CheckpointCardProps {
  run: PipelineRun;
  template: PipelineTemplate;
  index: number;
  isTerminal: boolean;
  isPaused: boolean;
  checkpointRequirements: NormalizedCheckpointAssetRequirement[][];
  evaluateRequirementDetails: (
    index: number,
    attachments: PipelineRun['results'][number]['attachments'] | undefined
  ) => { satisfied: boolean; details: RequirementMatchDetail[] };
  interaction: CheckpointInteractionState;
  selectedCheckpoint: number | null;
  setSelectedCheckpoint: (value: number | null) => void;
  onInjectPrompt: () => Promise<void>;
  onContinue: () => Promise<void>;
  onRegenerate: () => Promise<void>;
}

const CheckpointCard: React.FC<CheckpointCardProps> = ({
  run,
  template,
  index,
  isTerminal,
  isPaused,
  checkpointRequirements,
  evaluateRequirementDetails,
  interaction,
  selectedCheckpoint,
  setSelectedCheckpoint,
  onInjectPrompt,
  onContinue,
  onRegenerate,
}) => {
  const checkpoint = template.checkpoints[index];
  const result = run.results?.[index];
  const checkpointType = getCheckpointType(template, index);
  const modelContext = getCheckpointModelContext(checkpoint, run, template);
  const fanInSources = getFanInSources(template.checkpoints, index);
  const isCurrent = index === run.current_checkpoint;
  const isComplete = result?.status === 'completed';
  const isFailed = result?.status === 'failed';
  const isAwaitingAsset = result?.status === 'awaiting_asset';
  const isAwaitingConfirm = result?.status === 'awaiting_confirm';
  const isPending = !result;
  const requirementSummary = evaluateRequirementDetails(index, result?.attachments);
  const hasRequiredAssets = checkpointRequirements[index].length > 0;
  const canContinueCurrentCheckpoint = !hasRequiredAssets || requirementSummary.satisfied;
  const backendErrorText = (result?.error || '').trim();
  const canInspectCheckpoint = Boolean(result) || hasRequiredAssets;
  const showAttachControls = !isTerminal && checkpointType === 'upload' && !isComplete;
  const hasStructuredConnectorOutput =
    checkpointType === 'connector' && Boolean(result?.output) && toConnectorSceneReferenceEntries(result.output).length > 0;
  const modelSourceLabel =
    modelContext.source === 'checkpoint'
      ? 'checkpoint-specific'
      : modelContext.source === 'pipeline'
      ? 'pipeline default'
      : modelContext.source === 'run'
      ? 'run default'
      : 'unspecified';
  const modelLabel = modelContext.model
    ? `${modelContext.provider ? `${modelContext.provider} / ` : ''}${modelContext.model}`
    : modelContext.provider || 'inherits pipeline defaults';

  return (
    <div className={`rounded border ${isCurrent && !isTerminal ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/10'}`}>
      <div
        className="flex items-center justify-between p-2.5 cursor-pointer"
        onClick={(event) => {
          event.stopPropagation();
          if (canInspectCheckpoint) {
            setSelectedCheckpoint(selectedCheckpoint === index ? null : index);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            isComplete
              ? 'bg-white text-black'
              : isFailed
              ? 'bg-zinc-500 text-black'
              : isCurrent && !isTerminal
              ? 'bg-zinc-200 text-black animate-pulse'
              : 'bg-zinc-700 text-zinc-300'
          }`}>{isComplete ? 'OK' : isFailed ? 'X' : isPending ? '-' : index + 1}</span>
          <span className="text-white font-medium text-xs">{checkpoint.name}</span>
          {checkpointType === 'distributor' && <span className="text-[10px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">Distributor</span>}
          {checkpointType === 'connector' && <span className="text-[10px] uppercase tracking-wide bg-zinc-800 border border-white/20 text-zinc-200 px-1.5 py-0.5 rounded">Connector</span>}
          {checkpointType === 'generator' && <span className="text-[10px] uppercase tracking-wide bg-sky-300 text-sky-950 px-1.5 py-0.5 rounded">Generator</span>}
          {checkpointType === 'upload' && <span className="text-[10px] uppercase tracking-wide bg-violet-300 text-violet-950 px-1.5 py-0.5 rounded">Upload</span>}
          {isAwaitingAsset && <span className="text-[10px] uppercase tracking-wide bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded">Awaiting Asset</span>}
          {isAwaitingConfirm && <span className="text-[10px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">Awaiting Confirm</span>}
          {hasRequiredAssets && (result || isCurrent) && (
            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${requirementSummary.satisfied ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-300'}`}>
              {requirementSummary.satisfied ? 'Assets Ready' : 'Assets Missing'}
            </span>
          )}
        </div>
        {canInspectCheckpoint && (
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">{selectedCheckpoint === index ? 'Hide' : 'Show'}</span>
        )}
      </div>

      {selectedCheckpoint === index && canInspectCheckpoint && (
        <div className="px-2.5 pb-2.5 space-y-2" onClick={(event) => event.stopPropagation()}>
          {result && checkpointType === 'distributor' && (
            <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
              Fan-out: {(result.child_pipeline_ids || []).length} child pipeline{(result.child_pipeline_ids || []).length === 1 ? '' : 's'}
              {result.child_pipeline_ids && result.child_pipeline_ids.length > 0 ? ` (${result.child_pipeline_ids.join(', ')})` : ''}
            </div>
          )}
          {checkpointType !== 'upload' && (
            <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
              Model: {modelLabel} ({modelSourceLabel})
            </div>
          )}
          {checkpointType === 'upload' && (
            <div className="text-[10px] text-violet-300 uppercase tracking-wide">
              Upload: {checkpoint.upload?.role || 'seed_image'} ({checkpoint.upload?.media_type || 'image'})
            </div>
          )}
          {result && fanInSources.length > 0 && <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Fan-in from {fanInSources.join(', ')}</div>}
          {checkpointType === 'generator' && <div className="text-[10px] text-sky-200 uppercase tracking-wide">Output: {checkpoint.generator?.media_type || 'media'}</div>}

          {hasRequiredAssets && (result || isCurrent) && (
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

          {backendErrorText && (isAwaitingAsset || isFailed) && (
            <div className="attachment-surface space-y-1 border-amber-400/30">
              <p className="attachment-state">{isAwaitingAsset ? 'Blocked By Required Asset' : 'Checkpoint Error'}</p>
              <p className="attachment-meta text-amber-100">{backendErrorText}</p>
            </div>
          )}

          {result && hasStructuredConnectorOutput ? (
            <ConnectorSceneReferences output={result.output} />
          ) : null}

          {result && (!hasStructuredConnectorOutput || checkpointType !== 'connector') &&
            checkpointType !== 'upload' && checkpointType !== 'generator' && (
            (() => {
              const text = formatOutput(result.output).trim();
              if (!text) return null;
              let parsed: unknown = null;
              try { parsed = JSON.parse(text); } catch { /* not JSON */ }
              if (parsed !== null && typeof parsed === 'object') {
                return (
                  <details>
                    <summary className="cursor-pointer text-[10px] text-zinc-500 uppercase tracking-wide">Output</summary>
                    <pre className="text-[11px] text-slate-300 bg-black/70 p-2 rounded overflow-auto max-h-56 border border-white/10 mt-1">{text}</pre>
                  </details>
                );
              }
              return (
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{text}</p>
              );
            })()
          )}

          {(result?.attachments || []).length > 0 && (
            <AttachmentSurface
              heading={`Checkpoint ${index + 1} Attachments`}
              attachments={result?.attachments}
              emptyText="No attachments produced for this checkpoint."
              unavailableText="Attachment payload unavailable for this checkpoint."
              errorText={result?.status === 'failed' ? 'Checkpoint failed; attachment output may be incomplete.' : undefined}
            />
          )}

          {showAttachControls && (
            <div className={`attachment-surface space-y-2 ${isAwaitingAsset ? 'border-amber-400/50' : ''}`}>
              <p className={`attachment-state ${isAwaitingAsset ? 'text-amber-300' : ''}`}>Attach Seed Image</p>
              <div
                className={`border-2 border-dashed rounded p-6 text-center transition-colors ${
                  interaction.attachLoading
                    ? 'border-white/10 opacity-50 pointer-events-none'
                    : isAwaitingAsset
                    ? 'border-amber-400/60 hover:border-amber-400 bg-amber-500/5 cursor-pointer'
                    : 'border-white/20 hover:border-violet-400/50 cursor-pointer'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void interaction.onFileUpload(file);
                }}
                onClick={interaction.onOpenLibrary}
              >
                <p className={`text-xs ${isAwaitingAsset ? 'text-amber-200' : 'text-zinc-400'}`}>
                  {interaction.attachLoading
                    ? 'Attaching...'
                    : (result?.attachments || []).length > 0
                    ? `${(result?.attachments || []).length} image${(result?.attachments || []).length !== 1 ? 's' : ''} attached — drop more or click to add`
                    : 'Drop image(s) here, or click to add from library'}
                </p>
              </div>
              {interaction.attachError && (
                <p className="attachment-meta text-red-300">{interaction.attachError}</p>
              )}
            </div>
          )}

          {!isTerminal && checkpointType === 'upload' && isComplete && !isCurrent && (
            <div className="flex flex-wrap items-center gap-2">
              {(result?.attachments || []).length > 0 && (
                <span className="text-[10px] text-zinc-400">
                  {(result?.attachments || []).length} image{(result?.attachments || []).length !== 1 ? 's' : ''} attached
                </span>
              )}
              <button
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                onClick={interaction.onOpenLibrary}
                disabled={interaction.attachLoading}
              >
                {interaction.attachLoading ? 'Attaching...' : 'Add image'}
              </button>
            </div>
          )}

          {result && isCurrent && isPaused && (
            <CheckpointPauseControls
              runId={run.id}
              index={index}
              checkpoint={checkpoint}
              isUploadCheckpoint={checkpointType === 'upload'}
              isGeneratorCheckpoint={checkpointType === 'generator'}
              pauseState={isAwaitingAsset ? 'awaiting_asset' : isAwaitingConfirm ? 'awaiting_confirm' : 'paused'}
              canContinueCurrentCheckpoint={canContinueCurrentCheckpoint}
              backendErrorText={backendErrorText}
              requiredReferencePrompt={interaction.requiredReferencePrompt}
              injectText={interaction.injectText}
              injectMode={interaction.injectMode}
              injectLoading={interaction.injectLoading}
              injectError={interaction.injectError}
              progressionLoading={interaction.progressionLoading}
              progressionError={interaction.progressionError}
              onSetSelectedCheckpoint={() => setSelectedCheckpoint(index)}
              onInjectTextChange={(next) => {
                interaction.setInjectText(next);
                if (interaction.injectError) interaction.setInjectError('');
              }}
              onInjectModeChange={(mode) => interaction.setInjectMode(mode)}
              onInject={() => onInjectPrompt()}
              onRegenerate={() => onRegenerate()}
              onContinue={() => onContinue()}
              attachLoading={interaction.attachLoading}
              onOpenLibrary={interaction.onOpenLibrary}
            />
          )}

          {result && !isCurrent && checkpoint.allow_regenerate && !isTerminal && isComplete && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => void onRegenerate()}
                disabled={interaction.progressionLoading}
              >
                {interaction.progressionLoading ? 'Regenerating...' : 'Regenerate Step'}
              </button>
              {checkpointType === 'generator' && (
                <button
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
                  onClick={interaction.onOpenLibrary}
                  disabled={interaction.attachLoading}
                >
                  {interaction.attachLoading ? 'Attaching...' : 'Pick from library'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckpointCard;
