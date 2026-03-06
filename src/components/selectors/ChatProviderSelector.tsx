import React, { useState, useEffect } from 'react';
import ModelsAPI from '../../api/models';
import { 
  ChatProvider, 
  DEFAULT_CHAT_MODEL,
  CHAT_PROVIDERS,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface ChatProviderSelectorProps {
  provider: ChatProvider;
  model: string;
  onProviderChange: (provider: ChatProvider) => void;
  onModelChange: (model: string) => void;
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
    if (!providerRequiresModel(provider)) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      try {
        const chatModels = await ModelsAPI.getChatModels();
        setModels(chatModels);
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
      onModelChange(models[0]?.id || DEFAULT_CHAT_MODEL);
    }
  }, [provider, model, models, onModelChange]);

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
        options={CHAT_PROVIDERS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as ChatProvider)}
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

export default ChatProviderSelector;