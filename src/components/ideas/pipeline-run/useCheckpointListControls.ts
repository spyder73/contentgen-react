import { useState } from 'react';
import MediaAPI, { MediaLibraryItem } from '../../../api/media';
import { CheckpointInjectionMode } from '../../../api/structs/pipeline';
import { mediaLibraryItemToAttachment, toActionableErrorMessage } from './helpers';
import { extractRequiredReferenceMessage, isRequiredReferenceBlockError } from './checkpointListUtils';

interface UseCheckpointListControlsArgs {
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
  onContinue,
  onRegenerate,
  onInjectPrompt,
  onAddAttachment,
}: UseCheckpointListControlsArgs) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [attachLoadingByCheckpoint, setAttachLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [attachErrorByCheckpoint, setAttachErrorByCheckpoint] = useState<Record<number, string>>({});
  const [injectTextByCheckpoint, setInjectTextByCheckpoint] = useState<Record<number, string>>({});
  const [injectModeByCheckpoint, setInjectModeByCheckpoint] = useState<Record<number, CheckpointInjectionMode>>({});
  const [injectLoadingByCheckpoint, setInjectLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [injectErrorByCheckpoint, setInjectErrorByCheckpoint] = useState<Record<number, string>>({});
  const [progressionLoadingByCheckpoint, setProgressionLoadingByCheckpoint] = useState<Record<number, boolean>>({});
  const [progressionErrorByCheckpoint, setProgressionErrorByCheckpoint] = useState<Record<number, string>>({});
  const [requiredReferencePromptByCheckpoint, setRequiredReferencePromptByCheckpoint] = useState<Record<number, string>>({});

  const handleAttach = async (checkpointIndex: number, attachment: ReturnType<typeof mediaLibraryItemToAttachment>) => {
    setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    try {
      await onAddAttachment(checkpointIndex, attachment);
      setRequiredReferencePromptByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
      setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: toActionableErrorMessage(error, 'Failed to attach asset to this checkpoint.'),
      }));
    } finally {
      setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleFileUpload = async (checkpointIndex: number, file: File) => {
    setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: true }));
    setAttachErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    try {
      const uploaded = await MediaAPI.uploadMediaLibraryFile(file, { source: 'seed_upload', type: 'image' });
      await onAddAttachment(checkpointIndex, mediaLibraryItemToAttachment(uploaded));
      setRequiredReferencePromptByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
      setProgressionErrorByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: '' }));
    } catch (error) {
      setAttachErrorByCheckpoint((prev) => ({
        ...prev,
        [checkpointIndex]: toActionableErrorMessage(error, 'Failed to upload seed image.'),
      }));
    } finally {
      setAttachLoadingByCheckpoint((prev) => ({ ...prev, [checkpointIndex]: false }));
    }
  };

  const handleLibraryAttach = async (checkpointIndex: number, item: MediaLibraryItem, role?: string) => {
    await handleAttach(checkpointIndex, mediaLibraryItemToAttachment(item, role));
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
    handleFileUpload,
    handleLibraryAttach,
    handleContinue,
    handleRegenerate,
    handleInjectPrompt,
    setInjectErrorByCheckpoint,
  };
};
