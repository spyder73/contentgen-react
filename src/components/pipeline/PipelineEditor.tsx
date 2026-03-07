import React, { useState, useEffect } from 'react';
import { PipelineEditorProps } from './types';
import PipelineFlow from './PipelineFlow';
import CheckpointPanel from './CheckpointPanel';
import { PipelineTemplate, CheckpointConfig, CheckpointType } from '../../api/structs';
import PipelineOutputFormatPanel from './PipelineOutputFormatPanel';
import { ConfirmModal, Modal } from '../modals';
import { Button, Input } from '../ui';

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

  const selectedCheckpoint = localPipeline.checkpoints.find(
    (c) => c.id === selectedCheckpointId
  );

  useEffect(() => {
    setLocalPipeline(pipeline);
  }, [pipeline]);

  const handleCheckpointClick = (checkpointId: string) => {
    setSelectedCheckpointId(
      selectedCheckpointId === checkpointId ? null : checkpointId
    );
  };

  const handleCheckpointUpdate = (updated: CheckpointConfig) => {
    setLocalPipeline((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((c) =>
        c.id === updated.id ? updated : c
      ),
    }));
    setHasChanges(true);
  };

  const resetAddCheckpointState = () => {
    setNewCheckpointId('');
    setNewCheckpointName('');
    setNewCheckpointType('prompt');
    setAddCheckpointError('');
  };

  const openAddCheckpointModal = () => {
    resetAddCheckpointState();
    setShowAddCheckpointModal(true);
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
        normalizedId.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      );
    }
  };

  const handleCheckpointAdd = () => {
    if (!newCheckpointId.trim()) {
      setAddCheckpointError('Checkpoint ID is required.');
      return;
    }

    if (localPipeline.checkpoints.some((checkpoint) => checkpoint.id === newCheckpointId)) {
      setAddCheckpointError(`Checkpoint ID "${newCheckpointId}" already exists.`);
      return;
    }

    const newCheckpoint: CheckpointConfig = {
      id: newCheckpointId,
      name: newCheckpointName.trim() || newCheckpointId,
      type: newCheckpointType,
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: true,
      allow_regenerate: true,
      allow_attachments: false,
      provider: '',
      model: '',
      required_assets: [],
      distributor:
        newCheckpointType === 'distributor'
          ? {
              delimiter: 'newline',
              max_children: 8,
            }
          : undefined,
      connector:
        newCheckpointType === 'connector'
          ? {
              strategy: 'first',
            }
          : undefined,
    };

    setLocalPipeline((prev) => ({
      ...prev,
      checkpoints: [...prev.checkpoints, newCheckpoint],
    }));
    setSelectedCheckpointId(newCheckpointId);
    setHasChanges(true);
    setShowAddCheckpointModal(false);
    resetAddCheckpointState();
  };

  const handleCheckpointRemove = (checkpointId: string) => {
    setLocalPipeline((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((c) => c.id !== checkpointId),
    }));

    if (selectedCheckpointId === checkpointId) {
      setSelectedCheckpointId(null);
    }
    setHasChanges(true);
  };

  const requestCheckpointRemove = (checkpointId: string) => {
    setCheckpointToRemoveId(checkpointId);
  };

  const handleCheckpointReorder = (fromIndex: number, toIndex: number) => {
    setLocalPipeline((prev) => {
      const newCheckpoints = [...prev.checkpoints];
      const [removed] = newCheckpoints.splice(fromIndex, 1);
      newCheckpoints.splice(toIndex, 0, removed);
      return { ...prev, checkpoints: newCheckpoints };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPipeline);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMetadataChange = (field: 'name' | 'description', value: string) => {
    setLocalPipeline((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleOutputFormatChange = (output_format: PipelineTemplate['output_format']) => {
    setLocalPipeline((prev) => ({ ...prev, output_format }));
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-3 border-b border-white/10 bg-black/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={localPipeline.name}
              onChange={(e) => handleMetadataChange('name', e.target.value)}
              className="text-base font-semibold bg-transparent text-white border-b border-transparent hover:border-white/30 focus:border-white/70 focus:outline-none w-full"
              placeholder="Pipeline Name"
            />
            <input
              type="text"
              value={localPipeline.description || ''}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
              className="text-xs text-gray-400 bg-transparent border-b border-transparent hover:border-white/30 focus:border-white/70 focus:outline-none w-full mt-1"
              placeholder="Description..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {localPipeline.checkpoints.length} checkpoints
            </span>
            {hasChanges && (
              <span className="text-xs text-yellow-500">• Unsaved</span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-3 py-1.5 border text-xs uppercase tracking-wide transition-colors ${
                hasChanges
                  ? 'bg-white text-black border-white hover:bg-zinc-200'
                  : 'bg-white/10 border-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <PipelineOutputFormatPanel
          value={localPipeline.output_format}
          onChange={handleOutputFormatChange}
        />
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-3 bg-black/40">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">Pipeline Flow</h3>
            <button
              onClick={openAddCheckpointModal}
              className="btn btn-sm btn-ghost"
            >
              + Add Checkpoint
            </button>
          </div>

          <PipelineFlow
            checkpoints={localPipeline.checkpoints}
            promptTemplates={promptTemplates}
            selectedCheckpointId={selectedCheckpointId}
            onCheckpointClick={handleCheckpointClick}
            onCheckpointRemove={requestCheckpointRemove}
            onReorder={handleCheckpointReorder}
          />

          {localPipeline.checkpoints.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No checkpoints yet</p>
              <button
                onClick={openAddCheckpointModal}
                className="text-zinc-300 hover:text-white text-sm mt-2 underline"
              >
                Add your first checkpoint
              </button>
            </div>
          )}
        </div>
        {selectedCheckpoint && (
          <div className="w-[22rem] max-w-[45vw] min-w-[18rem] border-l border-white/10 bg-black/60 overflow-auto max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-full max-md:max-w-none max-md:min-w-0">
            <CheckpointPanel
              checkpoint={selectedCheckpoint}
              promptTemplates={promptTemplates}
              allCheckpoints={localPipeline.checkpoints}
              onUpdate={handleCheckpointUpdate}
              onEditPrompt={onEditPrompt}
              onClose={() => setSelectedCheckpointId(null)}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddCheckpointModal}
        onClose={() => setShowAddCheckpointModal(false)}
        title="Add Checkpoint"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="Checkpoint ID (e.g., first-draft)"
            value={newCheckpointId}
            onChange={(e) => handleCheckpointIdChange(e.target.value)}
          />
          <Input
            placeholder="Checkpoint Name"
            value={newCheckpointName}
            onChange={(e) => setNewCheckpointName(e.target.value)}
          />
          <div>
            <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">
              Checkpoint Type
            </label>
            <select
              value={newCheckpointType}
              onChange={(e) => setNewCheckpointType(e.target.value as CheckpointType)}
              className="w-full select"
            >
              <option value="prompt">Prompt (single output)</option>
              <option value="distributor">Distributor (fan-out)</option>
              <option value="connector">Connector (fan-in)</option>
            </select>
          </div>

          {addCheckpointError && (
            <p className="text-sm text-red-400">{addCheckpointError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddCheckpointModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckpointAdd}>Add Checkpoint</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(checkpointToRemoveId)}
        onClose={() => setCheckpointToRemoveId(null)}
        onConfirm={() => {
          if (!checkpointToRemoveId) return;
          handleCheckpointRemove(checkpointToRemoveId);
        }}
        title="Remove checkpoint"
        message={`Remove checkpoint "${checkpointToRemoveId || ''}"?`}
        confirmText="Remove"
        variant="warning"
      />
    </div>
  );
};

export default PipelineEditor;
