import React, { useState } from 'react';
import { PipelineManagerProps } from './types';
import { PipelineTemplate, PromptTemplate } from '../../api/structs';
import { usePipelines } from '../../hooks/usePipelines';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import PipelineList from './PipelineList';
import PipelineEditor from './PipelineEditor';
import PromptTemplateEditor from './PromptTemplateEditor';

const DEFAULT_OUTPUT_FORMAT = {
  enabled: true,
  aspect_ratio: '9:16',
  image_long_edge: 1920,
  video_long_edge: 1920,
};

const PipelineManager: React.FC<PipelineManagerProps> = ({ isOpen, onClose }) => {
  const {
    pipelines,
    isLoading: pipelinesLoading,
    createPipeline,
    updatePipeline,
    deletePipeline,
  } = usePipelines();

  const {
    templates: promptTemplates,
    createTemplate: createPromptTemplate,
    updateTemplate: updatePromptTemplate,
  } = usePromptTemplates();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newPipelineId, setNewPipelineId] = useState('');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) || null;

  const handleCreatePipeline = async () => {
    if (!newPipelineId.trim() || !newPipelineName.trim()) return;

    try {
      const created = await createPipeline(
        newPipelineId.trim(),
        newPipelineName.trim(),
        [],
        '',
        DEFAULT_OUTPUT_FORMAT
      );
      setSelectedPipelineId(created.id);
      setShowCreatePipeline(false);
      setNewPipelineId('');
      setNewPipelineName('');
    } catch (err: any) {
      alert(`Failed to create: ${err.message}`);
    }
  };

  const handleSavePipeline = async (pipeline: PipelineTemplate) => {
    await updatePipeline(pipeline.id, {
      name: pipeline.name,
      description: pipeline.description,
      output_format: pipeline.output_format,
      checkpoints: pipeline.checkpoints,
    });
  };

  const handleDeletePipeline = async (id: string) => {
    try {
      await deletePipeline(id);
      if (selectedPipelineId === id) {
        setSelectedPipelineId(null);
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleEditPrompt = (promptId: string) => {
    if (!promptId) {
      // Create new prompt
      setIsCreatingPrompt(true);
      setEditingPrompt(null);
    } else {
      const template = promptTemplates.find((t) => t.id === promptId);
      if (template) {
        setEditingPrompt(template);
        setIsCreatingPrompt(false);
      }
    }
  };

  const handleSavePrompt = async (template: PromptTemplate) => {
    const existing = promptTemplates.find((t) => t.id === template.id);
    if (existing) {
      await updatePromptTemplate(template.id, template);
    } else {
      await createPromptTemplate(
        template.id,
        template.name,
        template.content,
        template.description
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[180] p-4">
      <div className="bg-zinc-950 border border-white/20 w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/70">
          <div>
            <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-white">Pipeline Manager</h2>
            <p className="text-xs text-gray-400 mt-1">
              Build and run generation flows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsCreatingPrompt(true);
                setEditingPrompt(null);
              }}
              className="btn btn-sm btn-ghost"
            >
              New Prompt
            </button>
            <button
              onClick={() => setShowCreatePipeline((value) => !value)}
              className="btn btn-sm btn-ghost"
            >
              New Pipeline
            </button>
            <button
              onClick={onClose}
              className="btn btn-sm btn-ghost"
            >
              Close
            </button>
          </div>
        </div>
        {showCreatePipeline && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 px-5 py-3 border-b border-white/10 bg-black/50">
            <input
              value={newPipelineId}
              onChange={(e) => setNewPipelineId(e.target.value)}
              placeholder="Pipeline ID (e.g., ideation-v1)"
              className="input"
            />
            <input
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              placeholder="Pipeline Name"
              className="input"
            />
            <button className="btn btn-primary" onClick={handleCreatePipeline}>
              Create
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Pipeline List */}
          <div className="w-64 border-r border-white/10 bg-black/35">
            <PipelineList
              pipelines={pipelines}
              selectedId={selectedPipelineId}
              onSelect={setSelectedPipelineId}
              onCreate={() => setShowCreatePipeline(true)}
              onDelete={handleDeletePipeline}
              isLoading={pipelinesLoading}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-black">
            {selectedPipeline ? (
              <PipelineEditor
                key={selectedPipeline.id}
                pipeline={selectedPipeline}
                promptTemplates={promptTemplates}
                onSave={handleSavePipeline}
                onCheckpointAdd={() => {}}
                onCheckpointRemove={() => {}}
                onCheckpointUpdate={() => {}}
                onEditPrompt={handleEditPrompt}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-base uppercase tracking-wide text-zinc-300">Select a pipeline</p>
                  <p className="text-sm mt-2 text-gray-600">
                    or{' '}
                    <button
                      onClick={() => setShowCreatePipeline(true)}
                      className="text-zinc-300 hover:text-white underline"
                    >
                      create a new pipeline
                    </button>{' '}
                    to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Template Editor Modal */}
      {(editingPrompt || isCreatingPrompt) && (
        <PromptTemplateEditor
          template={editingPrompt}
          isNew={isCreatingPrompt}
          onSave={handleSavePrompt}
          onClose={() => {
            setEditingPrompt(null);
            setIsCreatingPrompt(false);
          }}
        />
      )}
    </div>
  );
};

export default PipelineManager;
