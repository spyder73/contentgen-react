import React from 'react';
import { GeneratorConfig } from '../../../api/structs';
import CheckpointProviderSelector from '../../selectors/CheckpointProviderSelector';
import ModelSettingsModal from '../../selectors/ModelSettingsModal';
import { GeneratorImageMode, normalizeGeneratorMediaType } from '../utils';

interface GeneratorSettingsSectionProps {
  generator: GeneratorConfig;
  outputSpec?: Record<string, unknown>;
  onGeneratorChange: (field: keyof GeneratorConfig, value: string | undefined) => void;
  onOutputSpecChange: (value?: Record<string, unknown>) => void;
}

const GeneratorSettingsSection: React.FC<GeneratorSettingsSectionProps> = ({
  generator,
  outputSpec,
  onGeneratorChange,
  onOutputSpecChange,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const mediaType = normalizeGeneratorMediaType(generator.media_type || 'image');
  const imageMode = (generator.mode || 'text_to_image') as GeneratorImageMode;

  return (
    <section className="space-y-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
          Generator Settings
        </h4>
        <p className="mt-1 text-xs text-sky-100/60">
          Generator provider, model, and mode live inside `generator`.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Media Type</label>
          <select
            value={generator.media_type}
            onChange={(event) => {
              onGeneratorChange('media_type', event.target.value);
            }}
            className="input w-full text-xs"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        {mediaType === 'image' && (
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Mode</label>
            <select
              value={imageMode}
              onChange={(event) => onGeneratorChange('mode', event.target.value)}
              className="input w-full text-xs"
            >
              <option value="text_to_image">text_to_image</option>
              <option value="image_to_image">image_to_image</option>
            </select>
          </div>
        )}
      </div>

      <CheckpointProviderSelector
        provider={generator.provider || ''}
        model={generator.model || ''}
        modality={mediaType}
        allowInherit={false}
        allowManualModelInput={mediaType === 'audio'}
        requireSeedImageSupport={mediaType === 'image' && imageMode === 'image_to_image'}
        providerAriaLabel="Generator provider"
        modelAriaLabel="Generator model"
        onProviderChange={(value) => {
          onGeneratorChange('provider', value);
        }}
        onModelChange={(value) => {
          onGeneratorChange('model', value);
        }}
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Role</label>
          <input
            type="text"
            value={generator.role || ''}
            onChange={(event) => onGeneratorChange('role', event.target.value)}
            className="input w-full text-xs"
            placeholder={mediaType === 'image' ? 'reference_frame' : mediaType === 'audio' ? 'music_track' : 'reference_frame'}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setShowSettings(true)}
            className="btn btn-sm btn-ghost w-full md:w-auto"
            disabled={!generator.model}
          >
            Model Settings
          </button>
        </div>
      </div>

      <ModelSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        modelId={generator.model || ''}
        modality={mediaType}
        settings={outputSpec || {}}
        onSettingsChange={(settings) => onOutputSpecChange(settings as Record<string, unknown>)}
      />
    </section>
  );
};

export default GeneratorSettingsSection;
