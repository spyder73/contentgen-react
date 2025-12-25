import React, { useState, useEffect } from 'react';
import API from '../../api/api'
import { ChatProvider, DEFAULT_CHAT_MODEL } from '../../api/structs/providers';
import { AIModel } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface ChatProviderSelectorProps {
  provider: ChatProvider;
  model: string;
  onProviderChange: (provider: ChatProvider) => void;
  onModelChange: (model: string) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'google', label: 'Google' },
];

function supportsTextOutput(model: AIModel): boolean {
  // Text models either have no output_modalities specified, or include 'text'
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

const ChatProviderSelector: React.FC<ChatProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      if (provider === 'google') return; // Google uses fixed model

      setLoading(true);
      try {
        const response = await API.getModels();
        const allModels = [
          ...(response.recommended || []),
          ...(response.all || []),
        ];

        // Remove duplicates and filter for text output
        const uniqueModels = Array.from(
          new Map(allModels.map((m) => [m.id, m])).values()
        );
        const textModels = uniqueModels.filter(supportsTextOutput);
        setModels(textModels);

        // Set default model if none selected
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

  return (
    <div className="flex gap-2 items-center">
      <span className="text-muted text-sm">💬</span>

      <Select
        options={PROVIDER_OPTIONS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as ChatProvider)}
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
    </div>
  );
};

export default ChatProviderSelector;