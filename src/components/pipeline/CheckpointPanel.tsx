import React, { useState } from 'react';
import {
  ChainConfig,
  CheckpointConfig,
  CheckpointRequiredAsset,
  CheckpointType,
  ConnectorStrategy,
  PromptTemplate,
} from '../../api/structs';

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
  const [newMappingKey, setNewMappingKey] = useState('');
  const currentIndex = allCheckpoints.findIndex((c) => c.id === checkpoint.id);
  const previousCheckpoints = allCheckpoints.slice(0, currentIndex);
  const previousDistributorCheckpoints = previousCheckpoints.filter(
    (item) => (item.type || 'prompt') === 'distributor'
  );
  const normalizedType: CheckpointType = checkpoint.type || 'prompt';
  const requiredAssets =
    checkpoint.required_assets ||
    checkpoint.required_attachments ||
    checkpoint.attachment_requirements ||
    [];

  const chainCount = (() => {
    const chain = checkpoint.chain as ChainConfig | undefined;
    if (!chain) return 0;
    if (typeof chain.count === 'number' && Number.isFinite(chain.count)) return Math.max(0, Math.floor(chain.count));
    if (Array.isArray(chain.sub_checkpoints)) return chain.sub_checkpoints.length;
    if (Array.isArray(chain.checkpoints)) return chain.checkpoints.length;
    if (typeof chain.sub_checkpoints === 'number' && Number.isFinite(chain.sub_checkpoints)) {
      return Math.max(0, Math.floor(chain.sub_checkpoints));
    }
    if (typeof chain.checkpoints === 'number' && Number.isFinite(chain.checkpoints)) {
      return Math.max(0, Math.floor(chain.checkpoints));
    }
    return 0;
  })();

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
    const key = newMappingKey.trim();
    if (!key) return;
    if ((checkpoint.input_mapping || {})[key]) return;
    handleInputMappingChange(key, 'initial_input');
    setNewMappingKey('');
  };

  const handleRemoveInputMapping = (key: string) => {
    const newMapping = { ...checkpoint.input_mapping };
    delete newMapping[key];
    onUpdate({ ...checkpoint, input_mapping: newMapping });
  };

  const handleCheckpointTypeChange = (value: CheckpointType) => {
    if (value === 'distributor') {
      onUpdate({
        ...checkpoint,
        type: 'distributor',
        distributor: checkpoint.distributor || {
          delimiter: 'newline',
          max_children: 8,
        },
        connector: undefined,
        chain: undefined,
      });
      return;
    }

    if (value === 'connector') {
      const fallbackSource =
        previousDistributorCheckpoints[previousDistributorCheckpoints.length - 1]?.id;
      onUpdate({
        ...checkpoint,
        type: 'connector',
        distributor: undefined,
        connector: checkpoint.connector || {
          strategy: 'first',
          source_checkpoint_id: fallbackSource,
        },
        chain: undefined,
      });
      return;
    }

    if (value === 'chain') {
      onUpdate({
        ...checkpoint,
        type: 'chain',
        distributor: undefined,
        connector: undefined,
        chain: checkpoint.chain || {
          count: 2,
        },
      });
      return;
    }

    onUpdate({
      ...checkpoint,
      type: 'prompt',
      distributor: undefined,
      connector: undefined,
      chain: undefined,
    });
  };

  const handleDistributorChange = (field: 'delimiter' | 'max_children', value: string) => {
    const current = checkpoint.distributor || {
      delimiter: 'newline',
      max_children: 8,
    };

    if (field === 'max_children') {
      const parsed = Number(value);
      onUpdate({
        ...checkpoint,
        distributor: {
          ...current,
          max_children: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1,
        },
      });
      return;
    }

    onUpdate({
      ...checkpoint,
      distributor: {
        ...current,
        delimiter: value || 'newline',
      },
    });
  };

  const handleConnectorChange = (
    field: 'strategy' | 'source_checkpoint_id',
    value: string
  ) => {
    const current = checkpoint.connector || {
      strategy: 'first' as ConnectorStrategy,
      source_checkpoint_id:
        previousDistributorCheckpoints[previousDistributorCheckpoints.length - 1]?.id,
    };

    onUpdate({
      ...checkpoint,
      connector: {
        ...current,
        [field]:
          field === 'source_checkpoint_id'
            ? value || undefined
            : (value as ConnectorStrategy),
      },
    });
  };

  const handleChainCountChange = (value: string) => {
    const parsed = Number(value);
    const nextCount = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
    onUpdate({
      ...checkpoint,
      chain: {
        ...(checkpoint.chain || {}),
        count: nextCount,
      },
    });
  };

  const setRequiredAssets = (next: CheckpointRequiredAsset[]) => {
    onUpdate({
      ...checkpoint,
      required_assets: next,
      required_attachments: next,
      attachment_requirements: next,
    });
  };

  const handleRequiredAssetChange = (
    index: number,
    field: keyof CheckpointRequiredAsset,
    value: string
  ) => {
    const next = requiredAssets.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === 'min_count' || field === 'max_count') {
        const parsed = Number(value);
        const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
        return {
          ...item,
          [field]: normalized,
        };
      }
      return {
        ...item,
        [field]: value || undefined,
      };
    });
    setRequiredAssets(next);
  };

  const handleAddRequiredAsset = () => {
    const next: CheckpointRequiredAsset[] = [
      ...requiredAssets,
      {
        id: `required-${requiredAssets.length + 1}`,
        label: `Required Asset ${requiredAssets.length + 1}`,
        kind: 'image',
        source: 'any',
        min_count: 1,
      },
    ];
    setRequiredAssets(next);
  };

  const handleRemoveRequiredAsset = (index: number) => {
    const next = requiredAssets.filter((_, itemIndex) => itemIndex !== index);
    setRequiredAssets(next);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/50">
        <h3 className="font-semibold text-white text-xs uppercase tracking-[0.15em]">Checkpoint</h3>
        <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4 text-xs min-w-0">
        <div>
          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Checkpoint ID</label>
          <input
            type="text"
            value={checkpoint.id}
            disabled
            className="input"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Display Name</label>
          <input
            type="text"
            value={checkpoint.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Checkpoint Type</label>
          <select
            value={normalizedType}
            onChange={(e) => handleCheckpointTypeChange(e.target.value as CheckpointType)}
            className="w-full select"
          >
            <option value="prompt">Prompt (single output)</option>
            <option value="distributor">Distributor (fan-out)</option>
            <option value="connector">Connector (fan-in)</option>
            <option value="chain">Chain (sub-checkpoints)</option>
          </select>
        </div>

        {normalizedType !== 'connector' && (
          <div>
            <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Prompt Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start min-w-0">
              <select
                value={checkpoint.prompt_template_id}
                onChange={(e) => handleChange('prompt_template_id', e.target.value)}
                className="w-full select min-w-0"
              >
                <option value="">Select Prompt</option>
                {promptTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button onClick={() => onEditPrompt(checkpoint.prompt_template_id)} className="btn btn-sm btn-ghost">
                Edit
              </button>
            </div>
          </div>
        )}

        {normalizedType === 'distributor' && (
          <div className="space-y-2 rounded border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-300">Distributor Config</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Delimiter</label>
                <select
                  value={checkpoint.distributor?.delimiter || 'newline'}
                  onChange={(e) => handleDistributorChange('delimiter', e.target.value)}
                  className="w-full select"
                >
                  <option value="newline">Newline</option>
                  <option value="json_array">JSON Array</option>
                  <option value="json_objects">JSON Objects</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Max Children</label>
                <input
                  type="number"
                  min={1}
                  value={checkpoint.distributor?.max_children || 8}
                  onChange={(e) => handleDistributorChange('max_children', e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              Distributor checkpoints split one output into child runs.
            </p>
          </div>
        )}

        {normalizedType === 'connector' && (
          <div className="space-y-2 rounded border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-300">Connector Config</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Strategy</label>
                <select
                  value={checkpoint.connector?.strategy || 'first'}
                  onChange={(e) => handleConnectorChange('strategy', e.target.value)}
                  className="w-full select"
                >
                  <option value="first">First</option>
                  <option value="longest">Longest</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Source</label>
                <select
                  value={checkpoint.connector?.source_checkpoint_id || ''}
                  onChange={(e) => handleConnectorChange('source_checkpoint_id', e.target.value)}
                  className="w-full select"
                >
                  <option value="">Latest Distributor (auto)</option>
                  {previousDistributorCheckpoints.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              Connector checkpoints select one result from a distributor fan-out.
            </p>
          </div>
        )}

        {normalizedType === 'chain' && (
          <div className="space-y-2 rounded border border-emerald-400/35 bg-emerald-500/10 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-200">Chain Config</p>
            <div>
              <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Sub-checkpoint Count</label>
              <input
                type="number"
                min={1}
                value={chainCount || 1}
                onChange={(e) => handleChainCountChange(e.target.value)}
                className="input"
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Chain checkpoints represent grouped sequential sub-steps within one visible pipeline node.
            </p>
          </div>
        )}

        {normalizedType !== 'connector' && (
          <div>
            <label className="text-gray-400 uppercase tracking-wide block mb-2">Input Mappings</label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-2">
              <input
                value={newMappingKey}
                onChange={(e) => setNewMappingKey(e.target.value)}
                className="input"
                placeholder="variable name"
              />
              <button onClick={handleAddInputMapping} className="btn btn-sm btn-ghost">Add</button>
            </div>

            <div className="space-y-2">
              {Object.entries(checkpoint.input_mapping || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-[90px_1fr_auto] gap-2 items-center min-w-0">
                  <input type="text" value={key} disabled className="input" />
                  <select
                    value={value}
                    onChange={(e) => handleInputMappingChange(key, e.target.value)}
                    className="w-full select min-w-0"
                  >
                    <option value="initial_input">User Input</option>
                    {previousCheckpoints.map((c) => (
                      <option key={c.id} value={`checkpoint:${c.id}`}>
                        From: {c.name}
                        {c.type === 'distributor' ? ' (from distributor)' : ''}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleRemoveInputMapping(key)} className="btn btn-sm btn-ghost">Remove</button>
                </div>
              ))}

              {Object.keys(checkpoint.input_mapping || {}).length === 0 && (
                <p className="text-xs text-gray-500 italic">No input mappings.</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Provider Override</label>
            <input
              type="text"
              value={checkpoint.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              placeholder="Use default"
              className="input"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Model Override</label>
            <input
              type="text"
              value={checkpoint.model || ''}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="Use default"
              className="input"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.requires_confirm}
              onChange={(e) => handleChange('requires_confirm', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-zinc-200">Requires Confirmation</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.allow_regenerate}
              onChange={(e) => handleChange('allow_regenerate', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-zinc-200">Allow Regenerate</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpoint.allow_attachments}
              onChange={(e) => handleChange('allow_attachments', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-zinc-200">Allow Attachments</span>
          </label>

          {(checkpoint.allow_attachments || requiredAssets.length > 0) && (
            <div className="space-y-2 rounded border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-300">Required Assets</p>
                <button onClick={handleAddRequiredAsset} className="btn btn-sm btn-ghost">
                  + Add Requirement
                </button>
              </div>

              {requiredAssets.length === 0 ? (
                <p className="text-[10px] text-zinc-500">
                  Optional. Add requirements to block execution until bindings are satisfied.
                </p>
              ) : (
                <div className="space-y-2">
                  {requiredAssets.map((item, index) => (
                    <div key={`${item.id || 'required'}-${index}`} className="space-y-2 rounded border border-white/10 p-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Label</label>
                          <input
                            type="text"
                            value={item.label || ''}
                            onChange={(e) => handleRequiredAssetChange(index, 'label', e.target.value)}
                            placeholder={`Requirement ${index + 1}`}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">ID</label>
                          <input
                            type="text"
                            value={item.id || ''}
                            onChange={(e) => handleRequiredAssetChange(index, 'id', e.target.value)}
                            placeholder={`required-${index + 1}`}
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Kind</label>
                          <select
                            value={item.kind || 'any'}
                            onChange={(e) => handleRequiredAssetChange(index, 'kind', e.target.value)}
                            className="w-full select"
                          >
                            <option value="any">Any</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="music">Music</option>
                            <option value="file">File</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Source</label>
                          <select
                            value={item.source || 'any'}
                            onChange={(e) => handleRequiredAssetChange(index, 'source', e.target.value)}
                            className="w-full select"
                          >
                            <option value="any">Any</option>
                            <option value="media">Media Item</option>
                            <option value="generated">Generated Output</option>
                            <option value="url">URL</option>
                            <option value="file">Local File</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-medium text-gray-400 mb-1 uppercase tracking-wide">Min Count</label>
                          <input
                            type="number"
                            min={1}
                            value={item.min_count || 1}
                            onChange={(e) => handleRequiredAssetChange(index, 'min_count', e.target.value)}
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoveRequiredAsset(index)}
                          className="btn btn-sm btn-ghost"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckpointPanel;
