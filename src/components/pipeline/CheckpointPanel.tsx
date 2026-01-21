import React from 'react';
import { CheckpointConfig, PromptTemplate } from '../../api/structs';

interface CheckpointPanelProps {
  checkpoint: CheckpointConfig;
  promptTemplates: PromptTemplate[];
  allCheckpoints: CheckpointConfig[];
  onUpdate: (checkpoint: CheckpointConfig) => void;
  onEditPrompt: (promptId: string) => void;
  onClose: () => void;
}

const CheckpointPanel: React.FC<CheckpointPanelProps> = ({
  checkpoint,
  promptTemplates,
  allCheckpoints,
  onUpdate,
  onEditPrompt,
  onClose,
}) => {
  const currentIndex = allCheckpoints.findIndex((c) => c.id === checkpoint.id);
  const previousCheckpoints = allCheckpoints.slice(0, currentIndex);

  const handleChange = <K extends keyof CheckpointConfig>(
    field: K,
    value: CheckpointConfig[K]
  ) => {
    onUpdate({ ...checkpoint, [field]: value });
  };

  const handleInputMappingChange = (key: string, value: string) => {
    onUpdate({
      ...checkpoint,
      input_mapping: { ...checkpoint.input_mapping, [key]: value },
    });
  };

  const handleAddInputMapping = () => {
    const key = prompt('Enter input variable name (e.g., user_idea):');
    if (!key) return;
    handleInputMappingChange(key, 'initial_input');
  };

  const handleRemoveInputMapping = (key: string) => {
    const newMapping = { ...checkpoint.input_mapping };
    delete newMapping[key];
    onUpdate({ ...checkpoint, input_mapping: newMapping });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Edit Checkpoint</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl px-2 rounded hover:bg-gray-700"
        >
          ×
        </button>
      </div>

      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Basic Info */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Checkpoint ID
          </label>
          <input
            type="text"
            value={checkpoint.id}
            disabled
            className="w-full bg-gray-800 text-gray-500 px-3 py-2 rounded border border-gray-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={checkpoint.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* Prompt Template */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Prompt Template
          </label>
          <div className="flex gap-2">
            <select
              value={checkpoint.prompt_template_id}
              onChange={(e) => handleChange('prompt_template_id', e.target.value)}
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="">-- Select Prompt --</option>
              {promptTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => onEditPrompt(checkpoint.prompt_template_id)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm"
              title="Edit prompt"
            >
              ✏️
            </button>
          </div>
        </div>

        {/* Input Mappings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">
              Input Mappings
            </label>
            <button
              onClick={handleAddInputMapping}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(checkpoint.input_mapping || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="w-24 bg-gray-800 text-gray-400 px-2 py-1.5 rounded border border-gray-700 text-xs"
                />
                <span className="text-gray-500">→</span>
                <select
                  value={value}
                  onChange={(e) => handleInputMappingChange(key, e.target.value)}
                  className="flex-1 bg-gray-800 text-white px-2 py-1.5 rounded border border-gray-700 text-xs"
                >
                  <option value="initial_input">User Input</option>
                  {previousCheckpoints.map((c) => (
                    <option key={c.id} value={`checkpoint:${c.id}`}>
                      From: {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveInputMapping(key)}
                  className="text-gray-500 hover:text-red-400 text-sm"
                >
                  ×
                </button>
              </div>
            ))}

            {Object.keys(checkpoint.input_mapping || {}).length === 0 && (
              <p className="text-xs text-gray-500 italic">No input mappings</p>
            )}
          </div>
        </div>

        {/* Provider/Model Override */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Provider Override
            </label>
            <input
              type="text"
              value={checkpoint.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              placeholder="Use default"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Model Override
            </label>
            <input
              type="text"
              value={checkpoint.model || ''}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="Use default"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.requires_confirm}
              onChange={(e) => handleChange('requires_confirm', e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-white">Requires Confirmation</span>
              <p className="text-xs text-gray-500">
                Pause and wait for user approval
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.allow_regenerate}
              onChange={(e) => handleChange('allow_regenerate', e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-white">Allow Regenerate</span>
              <p className="text-xs text-gray-500">
                User can request a new generation
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.allow_attachments}
              onChange={(e) => handleChange('allow_attachments', e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-white">Allow Attachments</span>
              <p className="text-xs text-gray-500">
                User can attach files at this step
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CheckpointPanel;