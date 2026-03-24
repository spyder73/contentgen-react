import React, { useCallback, useMemo, useState } from 'react';
import { MediaLibraryItem } from '../../../api/media';
import AttachmentLibraryModal from '../AttachmentLibraryModal';
import CheckpointCard from './CheckpointCard';
import { CheckpointInteractionState } from './checkpointCardTypes';
import { CheckpointListProps } from './checkpointListTypes';
import DistributorConnectorBlock from './DistributorConnectorBlock';
import { useCheckpointListControls } from './useCheckpointListControls';

// For each distributor checkpoint, find its matching connector (by source_checkpoint_id).
// Returns a map: distributorIndex → connectorIndex, and a set of suppressed indices
// (child-only checkpoints + the connector itself, since they render inside the block).
function buildDistributorBlocks(checkpoints: CheckpointListProps['template']['checkpoints']) {
  const blocks = new Map<number, number>(); // distributorIdx → connectorIdx
  const suppressed = new Set<number>();

  checkpoints.forEach((cp, i) => {
    if ((cp.type ?? 'prompt') !== 'distributor') return;
    const connIdx = checkpoints.findIndex(
      (c, j) =>
        j > i &&
        (c.type ?? 'prompt') === 'connector' &&
        c.connector?.source_checkpoint_id === cp.id
    );
    if (connIdx > i) {
      blocks.set(i, connIdx);
      for (let k = i + 1; k <= connIdx; k++) suppressed.add(k);
    }
  });

  return { blocks, suppressed };
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
    const checkpoint = template?.checkpoints[index];
    const role = checkpoint?.type === 'generator' ? checkpoint.generator?.role : undefined;
    await controls.handleLibraryAttach(index, items[0], role);
  }, [libraryOpenForCheckpoint, controls, template]);

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

  const { blocks, suppressed } = useMemo(
    () => buildDistributorBlocks(template.checkpoints),
    [template.checkpoints]
  );

  return (
    <>
      {template.checkpoints.map((checkpoint, index) => {
        if (suppressed.has(index)) return null;

        if (blocks.has(index)) {
          const connectorIndex = blocks.get(index)!;
          return (
            <DistributorConnectorBlock
              key={checkpoint.id}
              run={run}
              template={template}
              distributorIndex={index}
              connectorIndex={connectorIndex}
              isTerminal={isTerminal}
              isPaused={isPaused}
              connectorInteraction={buildInteraction(connectorIndex)}
              onConnectorContinue={() => controls.handleContinue(connectorIndex)}
              onConnectorRegenerate={() => controls.handleRegenerate(connectorIndex)}
              onConnectorInject={() => controls.handleInjectPrompt(connectorIndex)}
            />
          );
        }

        return (
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
        );
      })}
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
