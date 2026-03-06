import React, { useState } from 'react';
import { AudioProvider } from '../../api/structs/providers';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { Select } from '../ui';
import ModelSettingsModal from './ModelSettingsModal';

interface AudioProviderSelectorProps {
  provider: AudioProvider;
  model: string;
  onProviderChange: (provider: AudioProvider) => void;
  onModelChange: (model: string) => void;
  settings: Partial<MediaOutputSpec>;
  onSettingsChange: (settings: Partial<MediaOutputSpec>) => void;
}

const AUDIO_PROVIDERS: { value: string; label: string }[] = [
  { value: 'suno', label: '🎵 Suno' },
  { value: 'udio', label: '🎶 Udio' },
];

const AudioProviderSelector: React.FC<AudioProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  settings,
  onSettingsChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          options={AUDIO_PROVIDERS}
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as AudioProvider)}
          selectSize="sm"
        />

        <input
          type="text"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder="Model (optional)"
          className="w-32 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white placeholder-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="btn-ghost btn-sm"
          title="Audio model settings"
        >
          ⚙️
        </button>
      </div>

      <ModelSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        modelId={model}
        modality="audio"
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
};

export default AudioProviderSelector;
