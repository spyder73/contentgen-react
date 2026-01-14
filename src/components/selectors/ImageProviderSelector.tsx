import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ImageProvider, DEFAULT_IMAGE_MODEL } from '../../api/structs/providers';
import { AIModel } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface ImageProviderSelectorProps {
  provider: ImageProvider;
  model: string;
  onProviderChange: (provider: ImageProvider) => void;
  onModelChange: (model: string) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'pollinations', label: 'Pollinations' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'runware', label: 'Runware' },
];

function supportsImageOutput(model: AIModel): boolean {
  return model.architecture?.output_modalities?.includes('image') ?? false;
}

function formatPrice(model: AIModel): string {
  if (!model.pricing?.completion) return 'Free';
  const price = parseFloat(model.pricing.completion);
  if (price === 0) return 'Free';
  return `$${price.toFixed(4)}`;
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
    const fetchModels = async () => {
      if (provider === 'pollinations') return;
      
      setLoading(true);
      try {
        const response = await API.getModels();
        const allModels = [
          ...(response.recommended || []),
          ...(response.all || []),
        ];
        
        // Remove duplicates and filter for image output
        const uniqueModels = Array.from(
          new Map(allModels.map((m) => [m.id, m])).values()
        );
        const imageModels = uniqueModels.filter(supportsImageOutput);
        setModels(imageModels);

        // Set default model if none selected
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
    sublabel: m.id,
    rightLabel: formatPrice(m),
  }));

  return (
    <div className="flex gap-2 items-center">
      <span className="text-muted text-sm">🖼️</span>

      <Select
        options={PROVIDER_OPTIONS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as ImageProvider)}
        selectSize="sm"
      />

      {(provider === 'openrouter' || provider === 'runware') && (
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