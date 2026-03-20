import React, { useCallback, useState } from 'react';
import { MediaLibraryItem } from '../../../api/media';
import AttachmentLibraryModal from '../AttachmentLibraryModal';
import CheckpointCard from './CheckpointCard';
import { CheckpointInteractionState } from './checkpointCardTypes';
import { CheckpointListProps } from './checkpointListTypes';
import { useCheckpointListControls } from './useCheckpointListControls';

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
  const controls = useCheckpointListControls({
    onContinue,
    onRegenerate,
    onInjectPrompt,
    onAddAttachment,
  });

  const [libraryOpenForCheckpoint, setLibraryOpenForCheckpoint] = useState<number | null>(null);

  const handleLibrarySelect = useCallback(async (items: MediaLibraryItem[]) => {
    if (libraryOpenForCheckpoint === null || items.length === 0) return;
    const index = libraryOpenForCheckpoint;
    setLibraryOpenForCheckpoint(null);
    await controls.handleLibraryAttach(index, items[0]);
  }, [libraryOpenForCheckpoint, controls]);

  const buildInteraction = useCallback(
    (index: number): CheckpointInteractionState => ({
      attachLoading: Boolean(controls.attachLoadingByCheckpoint[index]),
      attachError: controls.attachErrorByCheckpoint[index] || '',
      onOpenLibrary: () => setLibraryOpenForCheckpoint(index),
      onFileUpload: (file: File) => controls.handleFileUpload(index, file),
      injectText: controls.injectTextByCheckpoint[index] || '',
      setInjectText: (text: string) =>
        controls.setInjectTextByCheckpoint((prev) => ({ ...prev, [index]: text })),
      injectMode: controls.injectModeByCheckpoint[index] || 'guidance_only',
      setInjectMode: (mode) =>
        controls.setInjectModeByCheckpoint((prev) => ({ ...prev, [index]: mode })),
      injectLoading: Boolean(controls.injectLoadingByCheckpoint[index]),
      injectError: controls.injectErrorByCheckpoint[index] || '',
      setInjectError: (error: string) =>
        controls.setInjectErrorByCheckpoint((prev) => ({ ...prev, [index]: error })),
      progressionLoading: Boolean(controls.progressionLoadingByCheckpoint[index]),
      progressionError: controls.progressionErrorByCheckpoint[index] || '',
      requiredReferencePrompt: controls.requiredReferencePromptByCheckpoint[index] || '',
    }),
    [controls]
  );

  return (
    <>
      {template.checkpoints.map((checkpoint, index) => (
        <CheckpointCard
          key={checkpoint.id}
          run={run}
          template={template}
          index={index}
          isTerminal={isTerminal}
          isPaused={isPaused}
          checkpointRequirements={checkpointRequirements}
          evaluateRequirementDetails={evaluateRequirementDetails}
          interaction={buildInteraction(index)}
          selectedCheckpoint={controls.selectedCheckpoint}
          setSelectedCheckpoint={controls.setSelectedCheckpoint}
          onInjectPrompt={() => controls.handleInjectPrompt(index)}
          onContinue={() => controls.handleContinue(index)}
          onRegenerate={() => controls.handleRegenerate(index)}
        />
      ))}
      <AttachmentLibraryModal
        isOpen={libraryOpenForCheckpoint !== null}
        mode="select"
        onClose={() => setLibraryOpenForCheckpoint(null)}
        onConfirmSelection={(items) => void handleLibrarySelect(items)}
      />
    </>
  );
};

export default CheckpointList;
