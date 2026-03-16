import React from 'react';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';
import { Button } from '../../ui';
import { AssetPoolItem, NormalizedCheckpointAssetRequirement, RequirementMatchDetail } from '../assetPool';
import AttachmentSurface from './AttachmentSurface';
import { CheckpointInteractionState } from './checkpointCardTypes';
import ConnectorSceneReferences, { toConnectorSceneReferenceEntries } from './ConnectorSceneReferences';
import {
  formatOutput,
  getCheckpointModelContext,
  getCheckpointType,
  getFanInSources,
  getReusableAssetsForCheckpoint,
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
  reusablePoolAssets: AssetPoolItem[];
  interaction: CheckpointInteractionState;
  selectedCheckpoint: number | null;
  setSelectedCheckpoint: (value: number | null) => void;
  onAttachFromPool: () => Promise<void>;
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
  reusablePoolAssets,
  interaction,
  selectedCheckpoint,
  setSelectedCheckpoint,
  onAttachFromPool,
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
  const reusableOptions = getReusableAssetsForCheckpoint(reusablePoolAssets, index);
  const selectedAsset = reusableOptions.find((item) => item.id === interaction.selectedAssetId) || null;
  const backendErrorText = (result?.error || '').trim();
  const canInspectCheckpoint = Boolean(result) || checkpoint.allow_attachments || hasRequiredAssets;
  const showAttachControls = !isTerminal && (checkpoint.allow_attachments || hasRequiredAssets);
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
          {isAwaitingAsset && <span className="text-[10px] uppercase tracking-wide bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded">Awaiting Asset</span>}
          {isAwaitingConfirm && <span className="text-[10px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">Awaiting Confirm</span>}
          {hasRequiredAssets && (
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
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
            Model: {modelLabel} ({modelSourceLabel})
          </div>
          {result && fanInSources.length > 0 && <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Fan-in from {fanInSources.join(', ')}</div>}
          {checkpointType === 'generator' && <div className="text-[10px] text-sky-200 uppercase tracking-wide">Output: {checkpoint.generator?.media_type || 'media'}</div>}

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

          {backendErrorText && (isAwaitingAsset || isFailed) && (
            <div className="attachment-surface space-y-1 border-amber-400/30">
              <p className="attachment-state">{isAwaitingAsset ? 'Blocked By Required Asset' : 'Checkpoint Error'}</p>
              <p className="attachment-meta text-amber-100">{backendErrorText}</p>
            </div>
          )}

          {result && hasStructuredConnectorOutput ? (
            <ConnectorSceneReferences output={result.output} />
          ) : null}

          {result && (!hasStructuredConnectorOutput || checkpointType !== 'connector') && (
            <pre className="text-[11px] text-slate-300 bg-black/70 p-2 rounded overflow-auto max-h-56 border border-white/10">{formatOutput(result.output)}</pre>
          )}

          {(showAttachControls || ((result?.attachments || []).length > 0)) && (
            <AttachmentSurface
              heading={`Checkpoint ${index + 1} Attachments`}
              attachments={result?.attachments}
              loadingText={!result ? 'Waiting for checkpoint result...' : undefined}
              emptyText="No attachments produced for this checkpoint."
              unavailableText="Attachment payload unavailable for this checkpoint."
              errorText={result?.status === 'failed' ? 'Checkpoint failed; attachment output may be incomplete.' : undefined}
            />
          )}

          {showAttachControls && (
            <div className="attachment-surface space-y-2">
              <p className="attachment-state">Attach From Asset Pool</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={interaction.selectedAssetId}
                  onChange={(event) => interaction.setSelectedAssetId(event.target.value)}
                  className="w-full select sm:flex-1"
                >
                  <option value="">{reusableOptions.length > 0 ? 'Select asset reference...' : 'No reusable assets yet'}</option>
                  {reusableOptions.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.kind} · {asset.source}{asset.checkpoint_name ? ` · ${asset.checkpoint_name}` : ''})</option>
                  ))}
                </select>
                <Button variant="secondary" size="sm" onClick={() => void onAttachFromPool()} disabled={!interaction.selectedAssetId || interaction.attachLoading}>
                  {interaction.attachLoading ? 'Attaching...' : 'Attach'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => interaction.setSelectedAssetId('')}
                  disabled={!interaction.selectedAssetId}
                >
                  Clear
                </Button>
              </div>
              {selectedAsset && <p className="attachment-meta">Selected reference: {selectedAsset.name} ({selectedAsset.kind} · {selectedAsset.source})</p>}
              {interaction.attachError && <p className="attachment-meta text-red-300">{interaction.attachError}</p>}
            </div>
          )}

          {result && isCurrent && isPaused && (
            <CheckpointPauseControls
              runId={run.id}
              index={index}
              checkpoint={checkpoint}
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
            />
          )}

          {result && !isCurrent && checkpoint.allow_regenerate && !isTerminal && isComplete && (
            <Button variant="secondary" size="sm" onClick={() => void onRegenerate()} disabled={interaction.progressionLoading}>
              {interaction.progressionLoading ? 'Regenerating...' : 'Regenerate Step'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckpointCard;
