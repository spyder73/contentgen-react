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

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) || null;

  const handleCreatePipeline = async () => {
    const id = prompt('Enter pipeline ID (e.g., my-pipeline):');
    if (!id) return;

    const name = prompt('Enter pipeline name:');
    if (!name) return;

    try {
      const created = await createPipeline(id, name, [], '', DEFAULT_OUTPUT_FORMAT);
      setSelectedPipelineId(created.id);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-white">🔧 Pipeline Manager</h2>
            <p className="text-sm text-gray-400">
              Create and manage AI generation pipelines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsCreatingPrompt(true);
                setEditingPrompt(null);
              }}
              className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded transition-colors"
            >
              + New Prompt
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl px-2 hover:bg-gray-700 rounded transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Pipeline List */}
          <div className="w-64 border-r border-gray-700 bg-gray-800/30">
            <PipelineList
              pipelines={pipelines}
              selectedId={selectedPipelineId}
              onSelect={setSelectedPipelineId}
              onCreate={handleCreatePipeline}
              onDelete={handleDeletePipeline}
              isLoading={pipelinesLoading}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-gray-850">
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
                  <div className="text-5xl mb-4">🔧</div>
                  <p className="text-lg">Select a pipeline from the list</p>
                  <p className="text-sm mt-2 text-gray-600">
                    or{' '}
                    <button
                      onClick={handleCreatePipeline}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      create a new one
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
