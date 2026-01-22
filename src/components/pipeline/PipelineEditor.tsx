import React, { useState, useEffect } from 'react';
import { PipelineEditorProps } from './types';
import PipelineFlow from './PipelineFlow';
import CheckpointPanel from './CheckpointPanel';
import { PipelineTemplate, CheckpointConfig } from '../../api/structs';

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

  const handleCheckpointAdd = () => {
    const id = prompt('Enter checkpoint ID (e.g., my-step):');
    if (!id) return;

    const newCheckpoint: CheckpointConfig = {
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: true,
      allow_regenerate: true,
      allow_attachments: false,
      provider: '',
      model: '',
    };

    setLocalPipeline((prev) => ({
      ...prev,
      checkpoints: [...prev.checkpoints, newCheckpoint],
    }));
    setSelectedCheckpointId(id);
    setHasChanges(true);
  };

  const handleCheckpointRemove = (checkpointId: string) => {
    if (!window.confirm(`Remove checkpoint "${checkpointId}"?`)) return;

    setLocalPipeline((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((c) => c.id !== checkpointId),
    }));

    if (selectedCheckpointId === checkpointId) {
      setSelectedCheckpointId(null);
    }
    setHasChanges(true);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with Pipeline Info */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={localPipeline.name}
              onChange={(e) => handleMetadataChange('name', e.target.value)}
              className="text-lg font-semibold bg-transparent text-white border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none w-full"
              placeholder="Pipeline Name"
            />
            <input
              type="text"
              value={localPipeline.description || ''}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
              className="text-sm text-gray-400 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none w-full mt-1"
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
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Flow + Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pipeline Flow - Scrollable */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">Pipeline Flow</h3>
            <button
              onClick={handleCheckpointAdd}
              className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              + Add Checkpoint
            </button>
          </div>

          <PipelineFlow
            checkpoints={localPipeline.checkpoints}
            promptTemplates={promptTemplates}
            selectedCheckpointId={selectedCheckpointId}
            onCheckpointClick={handleCheckpointClick}
            onCheckpointRemove={handleCheckpointRemove}
            onReorder={handleCheckpointReorder}
          />

          {localPipeline.checkpoints.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>No checkpoints yet</p>
              <button
                onClick={handleCheckpointAdd}
                className="text-blue-400 hover:text-blue-300 text-sm mt-2"
              >
                Add your first checkpoint
              </button>
            </div>
          )}
        </div>

        {/* Checkpoint Panel - Fixed Width */}
        {selectedCheckpoint && (
          <div className="w-96 border-l border-gray-700 bg-gray-800/70 overflow-auto">
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
    </div>
  );
};

export default PipelineEditor;