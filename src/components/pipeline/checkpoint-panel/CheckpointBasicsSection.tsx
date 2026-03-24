import React from 'react';
import { CheckpointConfig, CheckpointType, PromptTemplate } from '../../../api/structs';

interface CheckpointBasicsSectionProps {
  checkpoint: CheckpointConfig;
  promptTemplates: PromptTemplate[];
  onNameChange: (value: string) => void;
  onTypeChange: (value: CheckpointType) => void;
  onPromptTemplateChange: (value: string) => void;
  onEditPrompt: (promptId: string) => void;
}

const CheckpointBasicsSection: React.FC<CheckpointBasicsSectionProps> = ({
  checkpoint,
  promptTemplates,
  onNameChange,
  onTypeChange,
  onPromptTemplateChange,
  onEditPrompt,
}) => {
  const type = checkpoint.type || 'prompt';
  const showPromptTemplate = type !== 'upload' && type !== 'connector';

  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Name</label>
          <input
            type="text"
            value={checkpoint.name}
            onChange={(event) => onNameChange(event.target.value)}
            className="input w-full text-sm"
            placeholder="Checkpoint name"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Type</label>
          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value as CheckpointType)}
            className="input w-full text-sm"
          >
            <option value="prompt">Prompt</option>
            <option value="distributor">Distributor</option>
            <option value="connector">Connector</option>
            <option value="generator">Generator</option>
            <option value="upload">Upload</option>
          </select>
        </div>
      </div>

      {showPromptTemplate && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">
              Prompt Template
            </label>
            <select
              value={checkpoint.prompt_template_id}
              onChange={(event) => onPromptTemplateChange(event.target.value)}
              className="input w-full text-sm"
            >
              <option value="">None</option>
              {promptTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => onEditPrompt(checkpoint.prompt_template_id || '')}
              className="btn btn-sm btn-ghost w-full md:w-auto"
            >
              {checkpoint.prompt_template_id ? 'Edit Prompt' : 'New Prompt'}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Checkpoint ID</label>
        <div className="rounded border border-white/10 bg-black/50 px-3 py-2 text-xs text-gray-400">
          {checkpoint.id}
        </div>
      </div>
    </section>
  );
};

export default CheckpointBasicsSection;
