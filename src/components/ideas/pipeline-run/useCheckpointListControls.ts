import { useState } from 'react';
import { CheckpointInjectionMode } from '../../../api/structs/pipeline';
import { AssetPoolItem } from '../assetPool';
import { getReusableAssetsForCheckpoint, toActionableErrorMessage, toAttachmentRequest } from './helpers';
import { extractRequiredReferenceMessage, isRequiredReferenceBlockError } from './checkpointListUtils';

interface UseCheckpointListControlsArgs {
  reusablePoolAssets: AssetPoolItem[];
  onContinue: () => Promise<void> | void;
  onRegenerate: (checkpoint: number) => Promise<void> | void;
  onInjectPrompt: (
    checkpoint: number,
    text: string,
    options?: {
      autoRegenerate?: boolean;
      source?: string;
      mode?: CheckpointInjectionMode;
    }
  ) => Promise<void>;
  onAddAttachment: (checkpoint: number, attachment: any) => Promise<void>;
}

export const useCheckpointListControls = ({
  reusablePoolAssets,
  onContinue,
  onRegenerate,
  onInjectPrompt,
  onAddAttachment,
}: UseCheckpointListControlsArgs) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [selectedAssetByCheckpoint, setSelectedAssetByCheckpoint] = useState<Record<number, string>>({});
  const [attachLoadingByCheckpoint, setAttachLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [attachErrorByCheckpoint, setAttachErrorByCheckpoint] = useState<Record<number, string>>({});
  const [injectTextByCheckpoint, setInjectTextByCheckpoint] = useState<Record<number, string>>({});
  const [injectModeByCheckpoint, setInjectModeByCheckpoint] = useState<Record<number, CheckpointInjectionMode>>({});
  const [injectLoadingByCheckpoint, setInjectLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [injectErrorByCheckpoint, setInjectErrorByCheckpoint] = useState<Record<number, string>>({});
  const [progressionLoadingByCheckpoint, setProgressionLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [progressionErrorByCheckpoint, setProgressionErrorByCheckpoint] = useState<Record<number, string>>({});
  const [requiredReferencePromptByCheckpoint, setRequiredReferencePromptByCheckpoint] = useState<Record<number, string>>({});

  const handleAttachFromPool = async (checkpointIndex: number) => {
    const selectedAssetId = selectedAssetByCheckpoint[checkpointIndex];
    if (!selectedAssetId) {
      setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: 'Select an asset from the pool first.' }));
      return;
    }

    const selectedAsset = getReusableAssetsForCheckpoint(reusablePoolAssets, checkpointIndex).find(
      (asset) => asset.id === selectedAssetId
    );
    if (!selectedAsset) {
      setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: 'Selected asset is no longer available for this checkpoint.' }));
      return;
    }

    if (!selectedAsset.media_id && !selectedAsset.url) {
      setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: 'Selected asset has no media ID or URL to bind.' }));
      return;
    }

    setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));

    try {
      await onAddAttachment(checkpointIndex, toAttachmentRequest(selectedAsset));
      setSelectedAssetByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
      setRequiredReferencePromptByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
      setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: toActionableErrorMessage(error, 'Failed to attach selected asset to this checkpoint.'),
      }));
    } finally {
      setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleContinue = async (checkpointIndex: number) => {
    setProgressionLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));

    try {
      await Promise.resolve(onContinue());
      setRequiredReferencePromptByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      const errorMessage = toActionableErrorMessage(error, 'Failed to continue pipeline.');
      setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: errorMessage }));
      if (isRequiredReferenceBlockError(error)) {
        setRequiredReferencePromptByCheckpoint((prev) => ({
          ...prev,
          [checkpointIndex]: extractRequiredReferenceMessage(error),
        }));
      }
    } finally {
      setProgressionLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleRegenerate = async (checkpointIndex: number) => {
    setProgressionLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));

    try {
      await Promise.resolve(onRegenerate(checkpointIndex));
      setRequiredReferencePromptByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      const errorMessage = toActionableErrorMessage(error, 'Failed to regenerate checkpoint.');
      setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: errorMessage }));
      if (isRequiredReferenceBlockError(error)) {
        setRequiredReferencePromptByCheckpoint((prev) => ({
          ...prev,
          [checkpointIndex]: extractRequiredReferenceMessage(error),
        }));
      }
    } finally {
      setProgressionLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleInjectPrompt = async (checkpointIndex: number) => {
    const guidance = (injectTextByCheckpoint[checkpointIndex] || '').trim();
    const mode = injectModeByCheckpoint[checkpointIndex] || 'guidance_only';
    if (!guidance) {
      setInjectErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: 'Enter prompt guidance before injecting.' }));
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

  return {
    selectedCheckpoint,
    setSelectedCheckpoint,
    selectedAssetByCheckpoint,
    setSelectedAssetByCheckpoint,
    attachLoadingByCheckpoint,
    attachErrorByCheckpoint,
    injectTextByCheckpoint,
    setInjectTextByCheckpoint,
    injectModeByCheckpoint,
    setInjectModeByCheckpoint,
    injectLoadingByCheckpoint,
    injectErrorByCheckpoint,
    progressionLoadingByCheckpoint,
    progressionErrorByCheckpoint,
    requiredReferencePromptByCheckpoint,
    handleAttachFromPool,
    handleContinue,
    handleRegenerate,
    handleInjectPrompt,
    setInjectErrorByCheckpoint,
  };
};
