import React, { useState, useEffect } from 'react';
import ModelsAPI from '../../api/models';
import { 
  ImageProvider, 
  DEFAULT_IMAGE_MODEL,
  IMAGE_PROVIDERS,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice, ModelConstraintsResponse } from '../../api/structs/model';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { Select, Dropdown } from '../ui';
import ModelSettingsModal from './ModelSettingsModal';

interface ImageProviderSelectorProps {
  provider: ImageProvider;
  model: string;
  onProviderChange: (provider: ImageProvider) => void;
  onModelChange: (model: string) => void;
  settings: Partial<MediaOutputSpec>;
  onSettingsChange: (settings: Partial<MediaOutputSpec>) => void;
}

const ImageProviderSelector: React.FC<ImageProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  settings,
  onSettingsChange,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [constraints, setConstraints] = useState<ModelConstraintsResponse | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!providerRequiresModel(provider)) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      try {
        const imageModels = await ModelsAPI.getImageModels(provider);
        setModels(imageModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [provider]);

  useEffect(() => {
    if (!providerRequiresModel(provider)) {
      return;
    }

    if (!model && models.length > 0) {
      onModelChange(models[0]?.id || DEFAULT_IMAGE_MODEL);
    }
  }, [provider, model, models, onModelChange]);

  // Reset settings when model changes (clears stale fields from previous model)
  useEffect(() => {
    onSettingsChange({});
  }, [model, onSettingsChange]);

  // Pre-fetch constraints so modal opens instantly
  useEffect(() => {
    if (!providerRequiresModel(provider) || !model) {
      setConstraints(undefined);
      return;
    }

    ModelsAPI.getModelConstraints(model, 'image')
      .then(setConstraints)
      .catch(() => setConstraints(undefined));
  }, [provider, model]);

  const dropdownOptions = models.map((m) => ({
    value: m.id,
    label: m.name,
    sublabel: m.runware?.architecture || m.id,
    rightLabel: formatPrice(m),
  }));

  return (
    <>
      <div className="flex gap-2 items-center">
        <Select
          options={IMAGE_PROVIDERS}
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as ImageProvider)}
          selectSize="sm"
        />

        {providerRequiresModel(provider) && (
          <Dropdown
            options={dropdownOptions}
            value={model}
            onChange={onModelChange}
            placeholder="Select model"
            searchable
            loading={loading}
          />
        )}

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="btn-ghost btn-sm"
          title="Image model settings"
        >
          ⚙️
        </button>
      </div>

      <ModelSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        modelId={model}
        modality="image"
        settings={settings}
        onSettingsChange={onSettingsChange}
        constraints={constraints}
      />
    </>
  );
};

export default ImageProviderSelector;
