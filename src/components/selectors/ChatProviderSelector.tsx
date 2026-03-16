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
  className?: string;
}

const ChatProviderSelector: React.FC<ChatProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  className = '',
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
    <div className={`grid grid-cols-1 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-2 items-center min-w-0 ${className}`}>
      <Select
        options={CHAT_PROVIDERS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as ChatProvider)}
        selectSize="sm"
        className="w-full min-w-0"
      />

      {providerRequiresModel(provider) && (
        <Dropdown
          options={dropdownOptions}
          value={model}
          onChange={onModelChange}
          placeholder="Select model"
          searchable
          loading={loading}
          className="w-full min-w-0"
          buttonClassName="w-full min-w-0"
        />
      )}
    </div>
  );
};

export default ChatProviderSelector;
