import React, { useEffect, useState } from 'react';
import { CheckpointType, PipelineTemplate } from '../../api/structs';
import CheckpointPanel from './CheckpointPanel';
import { createCheckpointConfig } from './checkpointConfig';
import PipelineExtendedModal from './extended/PipelineExtendedModal';
import PipelineFlow from './PipelineFlow';
import PipelineOutputFormatPanel from './PipelineOutputFormatPanel';
import { PipelineEditorProps } from './types';
import { buildSaveErrorMessage, pipelineRequiresSeedImageModel } from './utils';

const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipeline,
  promptTemplates,
  onSave,
  onEditPrompt,
}) => {
  const [localPipeline, setLocalPipeline] = useState<PipelineTemplate>(pipeline);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [newCheckpointId, setNewCheckpointId] = useState('');
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [newCheckpointType, setNewCheckpointType] = useState<CheckpointType>('prompt');
  const [addCheckpointError, setAddCheckpointError] = useState('');
  const [checkpointToRemoveId, setCheckpointToRemoveId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExtendedView, setShowExtendedView] = useState(false);

  const selectedCheckpoint = localPipeline.checkpoints.find(
    (checkpoint) => checkpoint.id === selectedCheckpointId
  );
  const requiresSeedCompatibleImageModel = pipelineRequiresSeedImageModel(
    localPipeline.checkpoints
  );

  useEffect(() => {
    setLocalPipeline(pipeline);
    setHasChanges(false);
    setSaveError(null);
  }, [pipeline]);

  const markDirty = () => {
    setHasChanges(true);
    setSaveError(null);
  };

  const handleCheckpointUpdate = (updatedCheckpoint: PipelineTemplate['checkpoints'][number]) => {
    setLocalPipeline((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.map((checkpoint) =>
        checkpoint.id === updatedCheckpoint.id ? updatedCheckpoint : checkpoint
      ),
    }));
    markDirty();
  };

  const handleCheckpointIdChange = (value: string) => {
    const normalizedId = value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');

    setNewCheckpointId(normalizedId);
    if (!newCheckpointName.trim()) {
      setNewCheckpointName(
        normalizedId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
      );
    }
  };

  const handleCheckpointAdd = () => {
    const id = newCheckpointId.trim();
    if (!id) {
      setAddCheckpointError('Checkpoint ID is required.');
      return;
    }

    if (localPipeline.checkpoints.some((checkpoint) => checkpoint.id === id)) {
      setAddCheckpointError(`Checkpoint ID "${id}" already exists.`);
      return;
    }

    const previousDistributorId = localPipeline.checkpoints
      .filter((checkpoint) => (checkpoint.type || 'prompt') === 'distributor')
      .slice(-1)[0]?.id;

    const newCheckpoint = createCheckpointConfig(
      id,
      newCheckpointName.trim() || id,
      newCheckpointType,
      previousDistributorId
    );

    setLocalPipeline((previous) => ({
      ...previous,
      checkpoints: [...previous.checkpoints, newCheckpoint],
    }));
    setSelectedCheckpointId(id);
    setShowAddCheckpointModal(false);
    setNewCheckpointId('');
    setNewCheckpointName('');
    setNewCheckpointType('prompt');
    setAddCheckpointError('');
    markDirty();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(localPipeline);
      setHasChanges(false);
    } catch (error) {
      setSaveError(buildSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={localPipeline.name}
            onChange={(event) => {
              setLocalPipeline((previous) => ({ ...previous, name: event.target.value }));
              markDirty();
            }}
            className="input border-none bg-transparent p-0 text-lg font-semibold"
            placeholder="Pipeline name"
          />
          <input
            type="text"
            value={localPipeline.description}
            onChange={(event) => {
              setLocalPipeline((previous) => ({ ...previous, description: event.target.value }));
              markDirty();
            }}
            className="input mt-1 border-none bg-transparent p-0 text-xs text-gray-400"
            placeholder="Description (optional)"
          />
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">{localPipeline.checkpoints.length} checkpoints</span>
          <button
            onClick={() => setShowExtendedView(true)}
            className="btn btn-ghost btn-sm font-mono"
            aria-label="Open extended view"
          >
            []
          </button>
          <button onClick={handleSave} disabled={!hasChanges || isSaving} className="btn btn-primary btn-sm">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="border-b border-red-500/30 bg-red-900/30 px-4 py-2 text-xs text-red-300">
          {saveError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-80 flex-col overflow-hidden border-r border-white/10 p-4">
          <div className="mb-3 flex items-center justify-end">
            <button onClick={() => setShowAddCheckpointModal(true)} className="btn btn-ghost btn-sm">
              + Add Checkpoint
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <PipelineFlow
              checkpoints={localPipeline.checkpoints}
              promptTemplates={promptTemplates}
              selectedCheckpointId={selectedCheckpointId}
              onCheckpointClick={(checkpointId) =>
                setSelectedCheckpointId((current) => (current === checkpointId ? null : checkpointId))
              }
              onCheckpointRemove={(checkpointId) => setCheckpointToRemoveId(checkpointId)}
              onReorder={(fromIndex, toIndex) => {
                setLocalPipeline((previous) => {
                  const nextCheckpoints = [...previous.checkpoints];
                  const [moved] = nextCheckpoints.splice(fromIndex, 1);
                  nextCheckpoints.splice(toIndex, 0, moved);
                  return { ...previous, checkpoints: nextCheckpoints };
                });
                markDirty();
              }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <PipelineOutputFormatPanel
              value={localPipeline.output_format}
              onChange={(outputFormat) => {
                setLocalPipeline((previous) => ({ ...previous, output_format: outputFormat }));
                markDirty();
              }}
              requiresSeedCompatibleImageModel={requiresSeedCompatibleImageModel}
            />

            {selectedCheckpoint ? (
              <CheckpointPanel
                checkpoint={selectedCheckpoint}
                promptTemplates={promptTemplates}
                allCheckpoints={localPipeline.checkpoints}
                onUpdate={handleCheckpointUpdate}
                onEditPrompt={onEditPrompt}
                onClose={() => setSelectedCheckpointId(null)}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-sm text-gray-500">
                Select a checkpoint to edit its nested config. Final clip generation settings stay visible here.
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddCheckpointModal && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 border border-white/20 bg-zinc-950 p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Add Checkpoint
            </h3>

            <input
              type="text"
              value={newCheckpointId}
              onChange={(event) => handleCheckpointIdChange(event.target.value)}
              className="input w-full"
              placeholder="Checkpoint ID (e.g., first-draft)"
            />
            <input
              type="text"
              value={newCheckpointName}
              onChange={(event) => setNewCheckpointName(event.target.value)}
              className="input w-full"
              placeholder="Checkpoint Name"
            />
            <select
              value={newCheckpointType}
              onChange={(event) => setNewCheckpointType(event.target.value as CheckpointType)}
              className="input w-full"
            >
              <option value="prompt">Prompt</option>
              <option value="distributor">Distributor</option>
              <option value="connector">Connector</option>
              <option value="generator">Generator</option>
            </select>

            {addCheckpointError && <div className="text-xs text-red-300">{addCheckpointError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddCheckpointModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleCheckpointAdd} className="btn btn-primary btn-sm">
                Add Checkpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {checkpointToRemoveId && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-4 border border-white/20 bg-zinc-950 p-5 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Remove Checkpoint
              </h3>
              <p className="text-sm text-gray-400">
                Remove `{checkpointToRemoveId}` from this pipeline?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCheckpointToRemoveId(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  setLocalPipeline((previous) => ({
                    ...previous,
                    checkpoints: previous.checkpoints.filter(
                      (checkpoint) => checkpoint.id !== checkpointToRemoveId
                    ),
                  }));
                  if (selectedCheckpointId === checkpointToRemoveId) {
                    setSelectedCheckpointId(null);
                  }
                  setCheckpointToRemoveId(null);
                  markDirty();
                }}
                className="btn btn-primary btn-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <PipelineExtendedModal
        isOpen={showExtendedView}
        checkpoints={localPipeline.checkpoints}
        selectedCheckpointId={selectedCheckpointId}
        onClose={() => setShowExtendedView(false)}
        onSelectCheckpoint={(checkpointId) => setSelectedCheckpointId(checkpointId)}
      />
    </div>
  );
};

export default PipelineEditor;
