import React, { useState, useEffect } from 'react';
import ModelsAPI from '../../api/models';
import { 
  ChatProvider, 
  DEFAULT_CHAT_MODEL,
  CHAT_PROVIDERS,
  ProviderDefinition,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface CheckpointProviderSelectorProps {
  provider: ChatProvider | '';
  model: string;
  onProviderChange: (provider: ChatProvider | '') => void;
  onModelChange: (model: string) => void;
  allowInherit?: boolean;
}

const INHERIT_OPTION: ProviderDefinition = { value: '', label: 'Inherit from run' };

const CheckpointProviderSelector: React.FC<CheckpointProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  allowInherit = true,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);

  const providerOptions = allowInherit 
    ? [INHERIT_OPTION, ...CHAT_PROVIDERS] 
    : CHAT_PROVIDERS;

  useEffect(() => {
    if (!provider || !providerRequiresModel(provider as ChatProvider)) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      try {
        const chatModels = await ModelsAPI.getChatModels();
        setModels(chatModels);

        if (!model && chatModels.length > 0) {
          onModelChange(chatModels[0]?.id || DEFAULT_CHAT_MODEL);
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
      <Select
        options={providerOptions}
        value={provider}
        onChange={(e) => {
          const newProvider = e.target.value as ChatProvider | '';
          onProviderChange(newProvider);
          if (newProvider !== provider) {
            onModelChange('');
          }
        }}
        selectSize="sm"
      />

      {provider && providerRequiresModel(provider as ChatProvider) && (
        <Dropdown
          options={dropdownOptions}
          value={model}
          onChange={onModelChange}
          placeholder="Select model"
          searchable
          loading={loading}
        />
      )}

      {provider === '' && (
        <span className="text-xs text-gray-500 italic">Uses run default</span>
      )}
    </div>
  );
};

export default CheckpointProviderSelector;