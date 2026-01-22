import React, { useState, useEffect } from 'react';
import ModelsAPI from '../../api/models';
import { 
  ImageProvider, 
  DEFAULT_IMAGE_MODEL,
  IMAGE_PROVIDERS,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface ImageProviderSelectorProps {
  provider: ImageProvider;
  model: string;
  onProviderChange: (provider: ImageProvider) => void;
  onModelChange: (model: string) => void;
}

const ImageProviderSelector: React.FC<ImageProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);

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

        if (!model && imageModels.length > 0) {
          onModelChange(imageModels[0]?.id || DEFAULT_IMAGE_MODEL);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [provider]);

  const dropdownOptions = models.map((m) => ({
    value: m.id,
    label: m.name,
    sublabel: m.runware?.architecture || m.id,
    rightLabel: formatPrice(m),
  }));

  return (
    <div className="flex gap-2 items-center">
      <span className="text-muted text-sm">🖼️</span>

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
    </div>
  );
};

export default ImageProviderSelector;