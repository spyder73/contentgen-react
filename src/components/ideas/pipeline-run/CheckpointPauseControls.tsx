import React from 'react';
import { CheckpointConfig } from '../../../api/structs';
import { CheckpointInjectionMode } from '../../../api/structs/pipeline';
import { Button } from '../../ui';
import { modeLabel } from './helpers';

interface CheckpointPauseControlsProps {
  runId: string;
  index: number;
  checkpoint: CheckpointConfig;
  pauseState: 'awaiting_asset' | 'awaiting_confirm' | 'paused';
  canContinueCurrentCheckpoint: boolean;
  backendErrorText: string;
  requiredReferencePrompt: string;
  injectText: string;
  injectMode: CheckpointInjectionMode;
  injectLoading: boolean;
  injectError: string;
  progressionLoading: boolean;
  progressionError: string;
  onSetSelectedCheckpoint: () => void;
  onInjectTextChange: (value: string) => void;
  onInjectModeChange: (mode: CheckpointInjectionMode) => void;
  onInject: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onContinue: () => Promise<void>;
}

const CheckpointPauseControls: React.FC<CheckpointPauseControlsProps> = ({
  runId,
  index,
  checkpoint,
  pauseState,
  canContinueCurrentCheckpoint,
  backendErrorText,
  requiredReferencePrompt,
  injectText,
  injectMode,
  injectLoading,
  injectError,
  progressionLoading,
  progressionError,
  onSetSelectedCheckpoint,
  onInjectTextChange,
  onInjectModeChange,
  onInject,
  onRegenerate,
  onContinue,
}) => {
  const showAssetGate = pauseState === 'awaiting_asset' || Boolean(requiredReferencePrompt);
  const continueDisabled =
    !canContinueCurrentCheckpoint || progressionLoading || (pauseState !== 'awaiting_asset' && Boolean(requiredReferencePrompt));

  return (
    <div className="space-y-2 p-2 border border-white/20 bg-white/5 rounded">
      <p className="text-xs text-zinc-300">
        {pauseState === 'awaiting_asset'
          ? 'This checkpoint is waiting for a required asset before it can retry.'
          : canContinueCurrentCheckpoint
          ? 'Review output before continuing.'
          : 'Attach required assets before continuing.'}
      </p>
      {showAssetGate && (
        <div className="attachment-item border-amber-400/40 bg-amber-500/10 space-y-1">
          <p className="text-xs text-amber-200 uppercase tracking-wide">
            {pauseState === 'awaiting_asset' ? 'Asset Required' : 'Reference Required'}
          </p>
          <p className="attachment-meta text-amber-100">
            {requiredReferencePrompt || backendErrorText || 'Attach the required asset, then continue the checkpoint.'}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onSetSelectedCheckpoint}>
            Attach Required Asset
          </Button>
        </div>
      )}
      {pauseState !== 'awaiting_asset' && (
        <>
          <label className="attachment-state" htmlFor={`inject-guidance-${runId}-${index}`}>
            Additive Prompt Guidance
          </label>
          <textarea
            id={`inject-guidance-${runId}-${index}`}
            value={injectText}
            onChange={(event) => onInjectTextChange(event.target.value)}
            className="w-full input min-h-20"
            placeholder="Add focused guidance to merge with this checkpoint prompt..."
          />
          <div className="space-y-1">
            <p className="attachment-state">Regeneration Context Mode</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="attachment-meta flex items-center gap-1 cursor-pointer">
                <input type="radio" name={`inject-mode-${runId}-${index}`} checked={injectMode === 'guidance_only'} onChange={() => onInjectModeChange('guidance_only')} />
                Guidance only
              </label>
              <label className="attachment-meta flex items-center gap-1 cursor-pointer">
                <input type="radio" name={`inject-mode-${runId}-${index}`} checked={injectMode === 'with_prior_output_context'} onChange={() => onInjectModeChange('with_prior_output_context')} />
                Guidance + prior output context
              </label>
            </div>
            <p className="attachment-meta">Active mode: {modeLabel(injectMode)}</p>
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {pauseState !== 'awaiting_asset' && (
          <Button variant="secondary" size="sm" onClick={() => void onInject()} disabled={!injectText.trim() || injectLoading}>
            {injectLoading ? 'Injecting...' : 'Inject + Regenerate'}
          </Button>
        )}
        {checkpoint.allow_regenerate && <Button variant="secondary" size="sm" onClick={() => void onRegenerate()} disabled={progressionLoading}>Regenerate</Button>}
        <Button variant="primary" size="sm" onClick={() => void onContinue()} disabled={continueDisabled}>
          {progressionLoading ? 'Continuing...' : 'Continue'}
        </Button>
      </div>
      {backendErrorText && pauseState !== 'awaiting_asset' && !requiredReferencePrompt && (
        <p className="attachment-meta text-amber-100">{backendErrorText}</p>
      )}
      {injectError && <p className="attachment-meta text-red-300">{injectError}</p>}
      {progressionError && <p className="attachment-meta text-red-300">{progressionError}</p>}
    </div>
  );
};

export default CheckpointPauseControls;
