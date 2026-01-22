import React, { useState, useEffect } from 'react';
import ModelsAPI from '../../api/models';
import { 
  VideoProvider, 
  DEFAULT_VIDEO_MODEL,
  VIDEO_PROVIDERS,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';

interface VideoProviderSelectorProps {
  provider: VideoProvider;
  model: string;
  onProviderChange: (provider: VideoProvider) => void;
  onModelChange: (model: string) => void;
}

const VideoProviderSelector: React.FC<VideoProviderSelectorProps> = ({
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
        const videoModels = await ModelsAPI.getVideoModels(provider);
        setModels(videoModels);

        if (!model && videoModels.length > 0) {
          onModelChange(videoModels[0]?.id || DEFAULT_VIDEO_MODEL);
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
      <span className="text-muted text-sm">🎬</span>

      <Select
        options={VIDEO_PROVIDERS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as VideoProvider)}
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

export default VideoProviderSelector;