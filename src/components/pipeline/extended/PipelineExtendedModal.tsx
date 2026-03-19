import React from 'react';
import { CheckpointConfig } from '../../../api/structs';
import PipelineExtendedView from './PipelineExtendedView';

interface PipelineExtendedModalProps {
  isOpen: boolean;
  checkpoints: CheckpointConfig[];
  selectedCheckpointId: string | null;
  onClose: () => void;
  onSelectCheckpoint: (checkpointId: string) => void;
}

const PipelineExtendedModal: React.FC<PipelineExtendedModalProps> = ({
  isOpen,
  checkpoints,
  selectedCheckpointId,
  onClose,
  onSelectCheckpoint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[260] bg-black/95">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Extended Pipeline View</h2>
            <p className="mt-1 text-xs text-gray-500">Drag nodes to declutter. Bright lines show media reuse, muted lines show prompt and control dependencies.</p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <PipelineExtendedView
            checkpoints={checkpoints}
            selectedCheckpointId={selectedCheckpointId}
            onSelectCheckpoint={onSelectCheckpoint}
          />
        </div>
      </div>
    </div>
  );
};

export default PipelineExtendedModal;
