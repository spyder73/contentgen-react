import React, { useState } from 'react';
import { PipelineTemplate, PromptTemplate } from '../../api/structs';
import { PipelineManagerProps } from './types';
import { usePipelines } from '../../hooks/usePipelines';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { useToast } from '../../hooks/useToast';
import PipelineList from './PipelineList';
import PipelineEditor from './PipelineEditor';
import PromptTemplateEditor from './PromptTemplateEditor';
import { DEFAULT_OUTPUT_FORMAT } from './utils';
import PipelineAPI from '../../api/pipeline';

const PipelineManager: React.FC<PipelineManagerProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
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

  const [isSyncing, setIsSyncing] = useState(false);
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
      toast({ text: `Failed to create: ${err.message}`, level: 'error' });
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
      toast({ text: `Failed to delete: ${err.message}`, level: 'error' });
    }
  };

  const handleSyncLocal = async () => {
    setIsSyncing(true);
    try {
      const result = await PipelineAPI.syncLocalToRemote();
      const msg = `Synced ${result.pipelines_synced} pipeline(s) and ${result.prompts_synced} prompt(s) to DB`;
      if (result.errors?.length) {
        toast({ text: `${msg}. Errors: ${result.errors.join('; ')}`, level: 'warning' });
      } else {
        toast({ text: msg, level: 'success' });
      }
    } catch (err: any) {
      toast({ text: `Sync failed: ${err.message}`, level: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditPrompt = (promptId: string) => {
    if (!promptId) {
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
    <div className="modal-overlay z-[220]">
      <div className="modal-content w-full max-w-6xl h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/70">
          <div>
            <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-white">
              Pipeline Manager
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncLocal}
              disabled={isSyncing}
              className="btn btn-sm btn-secondary"
              title="Push all local disk templates to the DB"
            >
              {isSyncing ? 'Syncing…' : 'Sync Local → DB'}
            </button>
            <button onClick={onClose} className="btn btn-sm btn-ghost">
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
            <div className="flex gap-2">
              <button onClick={handleCreatePipeline} className="btn btn-primary btn-sm">
                Create
              </button>
              <button
                onClick={() => setShowCreatePipeline(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
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

          <div className="flex-1 overflow-hidden bg-black">
            {selectedPipeline ? (
              <PipelineEditor
                key={selectedPipeline.id}
                pipeline={selectedPipeline}
                promptTemplates={promptTemplates}
                onSave={handleSavePipeline}
                onEditPrompt={handleEditPrompt}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Select a pipeline to edit
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
