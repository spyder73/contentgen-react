import React, { useCallback } from 'react';
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
    reusablePoolAssets,
    onContinue,
    onRegenerate,
    onInjectPrompt,
    onAddAttachment,
  });

  const buildInteraction = useCallback(
    (index: number): CheckpointInteractionState => ({
      selectedAssetId: controls.selectedAssetByCheckpoint[index] || '',
      setSelectedAssetId: (id: string) =>
        controls.setSelectedAssetByCheckpoint((prev) => ({ ...prev, [index]: id })),
      attachLoading: Boolean(controls.attachLoadingByCheckpoint[index]),
      attachError: controls.attachErrorByCheckpoint[index] || '',
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
          reusablePoolAssets={reusablePoolAssets}
          interaction={buildInteraction(index)}
          selectedCheckpoint={controls.selectedCheckpoint}
          setSelectedCheckpoint={controls.setSelectedCheckpoint}
          onAttachFromPool={() => controls.handleAttachFromPool(index)}
          onInjectPrompt={() => controls.handleInjectPrompt(index)}
          onContinue={() => controls.handleContinue(index)}
          onRegenerate={() => controls.handleRegenerate(index)}
        />
      ))}
    </>
  );
};

export default CheckpointList;
