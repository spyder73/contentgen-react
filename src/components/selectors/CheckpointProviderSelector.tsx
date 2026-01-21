import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ChatProvider, DEFAULT_CHAT_MODEL } from '../../api/structs/providers';
import { AIModel } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface CheckpointProviderSelectorProps {
  provider: ChatProvider | '';
  model: string;
  onProviderChange: (provider: ChatProvider | '') => void;
  onModelChange: (model: string) => void;
  allowInherit?: boolean; // Show "inherit from run" option
}

const PROVIDER_OPTIONS_WITH_INHERIT = [
  { value: '', label: 'Inherit from run' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'google', label: 'Google' },
];

const PROVIDER_OPTIONS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'google', label: 'Google' },
];

function supportsTextOutput(model: AIModel): boolean {
  const modalities = model.architecture?.output_modalities;
  if (!modalities) return true;
  return modalities.includes('text') && !modalities.includes('image');
}

function formatPrice(model: AIModel): string {
  if (!model.pricing?.completion) return 'Free';
  const price = parseFloat(model.pricing.completion);
  if (price === 0) return 'Free';
  return `$${price.toFixed(4)}`;
}

const CheckpointProviderSelector: React.FC<CheckpointProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  allowInherit = true,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      if (provider !== 'openrouter') {
        setModels([]);
        return;
      }

      setLoading(true);
      try {
        const response = await API.getModels();
        const allModels = [
          ...(response.recommended || []),
          ...(response.all || []),
        ];

        const uniqueModels = Array.from(
          new Map(allModels.map((m) => [m.id, m])).values()
        );
        const textModels = uniqueModels.filter(supportsTextOutput);
        setModels(textModels);

        // Set default model if provider changed and no model selected
        if (!model && textModels.length > 0) {
          onModelChange(textModels[0]?.id || DEFAULT_CHAT_MODEL);
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

  const providerOptions = allowInherit ? PROVIDER_OPTIONS_WITH_INHERIT : PROVIDER_OPTIONS;

  return (
    <div className="flex gap-2 items-center">
      <Select
        options={providerOptions}
        value={provider}
        onChange={(e) => {
          const newProvider = e.target.value as ChatProvider | '';
          onProviderChange(newProvider);
          // Reset model when provider changes
          if (newProvider !== provider) {
            onModelChange('');
          }
        }}
        selectSize="sm"
      />

      {provider === 'openrouter' && (
        <Dropdown
          options={dropdownOptions}
          value={model}
          onChange={onModelChange}
          placeholder="Select model"
          searchable
          loading={loading}
        />
      )}

      {provider === 'google' && (
        <Select
          options={[
            { value: '', label: 'Default' },
            { value: 'gemini-pro', label: 'Gemini Pro' },
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
          ]}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          selectSize="sm"
        />
      )}

      {provider === '' && (
        <span className="text-xs text-gray-500 italic">Uses run default</span>
      )}
    </div>
  );
};

export default CheckpointProviderSelector;