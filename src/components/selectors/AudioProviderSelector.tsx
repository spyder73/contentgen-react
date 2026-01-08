import React from 'react';
import { AudioProvider } from '../../api/structs/providers';
import { Select } from '../ui';

interface AudioProviderSelectorProps {
  provider: AudioProvider;
  model: string;
  onProviderChange: (provider: AudioProvider) => void;
  onModelChange: (model: string) => void;
}

const AUDIO_PROVIDERS: { value: AudioProvider; label: string }[] = [
  { value: 'suno', label: '🎵 Suno' },
  { value: 'udio', label: '🎶 Udio' },
];

const AudioProviderSelector: React.FC<AudioProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        options={AUDIO_PROVIDERS}
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as AudioProvider)}
        className="w-28"
      >
        {AUDIO_PROVIDERS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>

      <input
        type="text"
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        placeholder="Model (optional)"
        className="w-32 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white placeholder-slate-400"
      />
    </div>
  );
};

export default AudioProviderSelector;