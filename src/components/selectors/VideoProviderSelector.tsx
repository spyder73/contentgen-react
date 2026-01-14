import React, { useState, useEffect } from 'react';
import { VideoProvider, DEFAULT_VIDEO_MODEL } from '../../api/structs/providers';
import { Select, Dropdown } from '../ui';

interface VideoProviderSelectorProps {
  provider: VideoProvider;
  model: string;
  onProviderChange: (provider: VideoProvider) => void;
  onModelChange: (model: string) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'runware', label: 'Runware' },
];

// Runware video models (hardcoded for now, could be fetched from API later)
const VIDEO_MODELS = [
  { value: 'lightricks:1', label: 'LTX Video v1', sublabel: 'lightricks:1' },
  { value: 'lightricks:2@1', label: 'LTX Video v2.1', sublabel: 'lightricks:2@1' },
  { value: 'google:1', label: 'Google Veo', sublabel: 'google:1' },
  { value: 'haiper:2', label: 'Haiper v2', sublabel: 'haiper:2' },
  { value: 'haiper:2.5', label: 'Haiper v2.5', sublabel: 'haiper:2.5' },
  { value: 'minimax:1', label: 'MiniMax', sublabel: 'minimax:1' },
  { value: 'tencent:1', label: 'Tencent HunYuan', sublabel: 'tencent:1' },
  { value: 'wavespeed:1', label: 'Wavespeed', sublabel: 'wavespeed:1' },
];

const VideoProviderSelector: React.FC<VideoProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  // Set default model if none selected
  useEffect(() => {
    if (!model) {
      onModelChange(DEFAULT_VIDEO_MODEL);
    }
  }, []);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-muted text-sm">🎬</span>

      <Select
        options={PROVIDER_OPTIONS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as VideoProvider)}
        selectSize="sm"
      />

      <Dropdown
        options={VIDEO_MODELS}
        value={model}
        onChange={onModelChange}
        placeholder="Select model"
        searchable
      />
    </div>
  );
};

export default VideoProviderSelector;