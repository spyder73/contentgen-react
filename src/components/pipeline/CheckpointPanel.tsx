import React from 'react';
import {
  CheckpointConfig,
  CheckpointRequiredAsset,
  CheckpointType,
  PromptTemplate,
} from '../../api/structs';
import {
  applyCheckpointType,
  getCheckpointSelector,
  updateCheckpointSelector,
} from './checkpointConfig';
import ConnectorSettingsSection from './checkpoint-panel/ConnectorSettingsSection';
import CheckpointBasicsSection from './checkpoint-panel/CheckpointBasicsSection';
import DistributorSettingsSection from './checkpoint-panel/DistributorSettingsSection';
import FlagsSection from './checkpoint-panel/FlagsSection';
import GeneratorSettingsSection from './checkpoint-panel/GeneratorSettingsSection';
import InputMappingSection from './checkpoint-panel/InputMappingSection';
import PromptSettingsSection from './checkpoint-panel/PromptSettingsSection';
import RequiredAssetsSection from './checkpoint-panel/RequiredAssetsSection';
import {
  DEFAULT_CONNECTOR_CONFIG,
  DEFAULT_DISTRIBUTOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
} from './utils';

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
  const type = checkpoint.type || 'prompt';
  const currentIndex = allCheckpoints.findIndex((candidate) => candidate.id === checkpoint.id);
  const previousDistributorCheckpoints = allCheckpoints
    .slice(0, currentIndex)
    .filter((candidate) => (candidate.type || 'prompt') === 'distributor');
  const previousDistributorId =
    previousDistributorCheckpoints[previousDistributorCheckpoints.length - 1]?.id;
  const selector = getCheckpointSelector(checkpoint);
  const requiredAssets = checkpoint.required_assets || [];

  const updateCheckpoint = (updates: Partial<CheckpointConfig>) => {
    onUpdate({ ...checkpoint, ...updates });
  };

  const handleTypeChange = (nextType: CheckpointType) => {
    onUpdate(applyCheckpointType(checkpoint, nextType, previousDistributorId));
  };

  const handleFlagChange = (
    field: 'requires_confirm' | 'allow_regenerate',
    value: boolean
  ) => {
    updateCheckpoint({ [field]: value } as Pick<CheckpointConfig, typeof field>);
  };

  const handleInputMappingChange = (key: string, value: string) => {
    updateCheckpoint({
      input_mapping: {
        ...checkpoint.input_mapping,
        [key]: value,
      },
    });
  };

  const handleInputMappingRemove = (key: string) => {
    const nextMapping = { ...checkpoint.input_mapping };
    delete nextMapping[key];
    updateCheckpoint({ input_mapping: nextMapping });
  };

  const handleRequiredAssetChange = (
    index: number,
    field: keyof CheckpointRequiredAsset,
    value: string
  ) => {
    const nextAssets = [...requiredAssets];
    const currentAsset = nextAssets[index] || {};
    const nextAsset = { ...currentAsset, [field]: value || undefined };
    const currentSource = (field === 'source' ? value : nextAsset.source || '').trim();
    const checkpointIdInput = (field === 'checkpoint_id' ? value : nextAsset.checkpoint_id || '').trim();
    const existingCheckpointId = currentSource.startsWith('checkpoint:')
      ? currentSource.slice('checkpoint:'.length).trim()
      : '';
    const effectiveCheckpointId = checkpointIdInput || existingCheckpointId;

    if (currentSource === 'checkpoint' || currentSource.startsWith('checkpoint:')) {
      nextAsset.source = effectiveCheckpointId ? `checkpoint:${effectiveCheckpointId}` : 'checkpoint';
      nextAsset.checkpoint_id = effectiveCheckpointId || undefined;
    } else {
      nextAsset.source = currentSource || undefined;
      nextAsset.checkpoint_id = checkpointIdInput || undefined;
    }

    nextAssets[index] = nextAsset;
    updateCheckpoint({ required_assets: nextAssets });
  };

  const handleAddRequiredAsset = () => {
    updateCheckpoint({
      required_assets: [...requiredAssets, { key: '', type: '', source: '' }],
    });
  };

  const handleRemoveRequiredAsset = (index: number) => {
    const nextAssets = requiredAssets.filter((_, assetIndex) => assetIndex !== index);
    updateCheckpoint({ required_assets: nextAssets.length > 0 ? nextAssets : undefined });
  };

  const handleOutputSpecChange = (value?: Record<string, unknown>) => {
    updateCheckpoint({ output_spec: value && Object.keys(value).length > 0 ? value : undefined });
  };

  const showPromptAndMapping = type !== 'upload' && type !== 'connector';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
            Checkpoint Details
            {type === 'upload' && <span className="ml-2 text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded normal-case tracking-normal">Upload</span>}
            {type === 'connector' && <span className="ml-2 text-[10px] bg-zinc-700 text-zinc-300 border border-white/10 px-1.5 py-0.5 rounded normal-case tracking-normal">Connector</span>}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Edit the canonical backend shape for this checkpoint.
          </p>
        </div>
        <button onClick={onClose} className="btn btn-sm btn-ghost">
          Close
        </button>
      </div>

      <CheckpointBasicsSection
        checkpoint={checkpoint}
        promptTemplates={promptTemplates}
        onNameChange={(value) => updateCheckpoint({ name: value })}
        onTypeChange={handleTypeChange}
        onPromptTemplateChange={(value) => updateCheckpoint({ prompt_template_id: value })}
        onEditPrompt={onEditPrompt}
      />

      {showPromptAndMapping && (
        <InputMappingSection
          inputMapping={checkpoint.input_mapping}
          onChange={handleInputMappingChange}
          onRemove={handleInputMappingRemove}
        />
      )}

      {type === 'prompt' && (
        <PromptSettingsSection
          provider={selector.provider}
          model={selector.model}
          onProviderChange={(value) => onUpdate(updateCheckpointSelector(checkpoint, 'provider', value))}
          onModelChange={(value) => onUpdate(updateCheckpointSelector(checkpoint, 'model', value))}
        />
      )}

      {type === 'distributor' && (
        <DistributorSettingsSection
          provider={selector.provider}
          model={selector.model}
          delimiter={checkpoint.distributor?.delimiter || DEFAULT_DISTRIBUTOR_CONFIG.delimiter}
          maxChildren={checkpoint.distributor?.max_children || DEFAULT_DISTRIBUTOR_CONFIG.max_children}
          onProviderChange={(value) => onUpdate(updateCheckpointSelector(checkpoint, 'provider', value))}
          onModelChange={(value) => onUpdate(updateCheckpointSelector(checkpoint, 'model', value))}
          onDelimiterChange={(value) =>
            updateCheckpoint({
              distributor: {
                ...DEFAULT_DISTRIBUTOR_CONFIG,
                ...checkpoint.distributor,
                delimiter: value,
              },
            })
          }
          onMaxChildrenChange={(value) => {
            const parsed = Number(value);
            updateCheckpoint({
              distributor: {
                ...DEFAULT_DISTRIBUTOR_CONFIG,
                ...checkpoint.distributor,
                max_children: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1,
              },
            });
          }}
        />
      )}

      {type === 'connector' && (
        <ConnectorSettingsSection
          sourceCheckpointId={checkpoint.connector?.source_checkpoint_id}
          previousDistributorCheckpoints={previousDistributorCheckpoints}
          onSourceCheckpointChange={(value) =>
            updateCheckpoint({
              connector: {
                ...DEFAULT_CONNECTOR_CONFIG,
                ...checkpoint.connector,
                strategy: 'collect_all',
                source_checkpoint_id: value || undefined,
              },
            })
          }
        />
      )}

      {type === 'generator' && (
        <GeneratorSettingsSection
          generator={{ ...DEFAULT_GENERATOR_CONFIG, ...checkpoint.generator }}
          outputSpec={checkpoint.output_spec as Record<string, unknown> | undefined}
          onGeneratorChange={(field, value) =>
            updateCheckpoint({
              generator: {
                ...DEFAULT_GENERATOR_CONFIG,
                ...checkpoint.generator,
                [field]: value,
              },
              ...(field === 'media_type' || field === 'provider' || field === 'model'
                ? { output_spec: undefined }
                : {}),
            })
          }
          onOutputSpecChange={handleOutputSpecChange}
        />
      )}

      {type === 'upload' && (
        <section className="space-y-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300">Upload Settings</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Media Type</label>
              <select
                value={checkpoint.upload?.media_type || 'image'}
                onChange={(event) => updateCheckpoint({ upload: { ...checkpoint.upload, media_type: event.target.value } })}
                className="input w-full text-sm"
              >
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Role</label>
              <input
                type="text"
                value={checkpoint.upload?.role || ''}
                onChange={(event) => updateCheckpoint({ upload: { ...checkpoint.upload, role: event.target.value } })}
                className="input w-full text-sm"
                placeholder="seed_image"
              />
            </div>
          </div>
        </section>
      )}

      {showPromptAndMapping && (
        <RequiredAssetsSection
          requiredAssets={requiredAssets}
          onChange={handleRequiredAssetChange}
          onAdd={handleAddRequiredAsset}
          onRemove={handleRemoveRequiredAsset}
        />
      )}

      {type !== 'upload' && (
        <FlagsSection
          requiresConfirm={checkpoint.requires_confirm}
          allowRegenerate={checkpoint.allow_regenerate}
          onChange={handleFlagChange}
        />
      )}
    </div>
  );
};

export default CheckpointPanel;
