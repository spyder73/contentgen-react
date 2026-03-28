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
  { value: 'suno', label: 'Suno' },
  { value: 'runware', label: 'Runware' },
];

const SUNO_MODELS: { value: string; label: string }[] = [
  { value: 'V5_5', label: 'V5.5' },
  { value: 'V5', label: 'V5' },
  { value: 'V4_5PLUS', label: 'V4.5+' },
  { value: 'V4_5ALL', label: 'V4.5 All' },
  { value: 'V4_5', label: 'V4.5' },
  { value: 'V4', label: 'V4' },
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

  const instrumental = (settings as any)?.instrumental ?? false;
  const vocalGender = (settings as any)?.vocal_gender ?? 'f';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          options={AUDIO_PROVIDERS}
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as AudioProvider)}
          selectSize="sm"
        />

        {provider === 'suno' ? (
          <>
            <Select
              options={SUNO_MODELS}
              value={model || 'V4_5ALL'}
              onChange={(e) => onModelChange(e.target.value)}
              selectSize="sm"
            />

            <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={instrumental}
                onChange={(e) =>
                  onSettingsChange({ ...settings, instrumental: e.target.checked } as any)
                }
                className="accent-white"
              />
              Instrumental
            </label>

            {!instrumental && (
              <select
                value={vocalGender}
                onChange={(e) =>
                  onSettingsChange({ ...settings, vocal_gender: e.target.value } as any)
                }
                className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-white/10"
              >
                <option value="f">Female</option>
                <option value="m">Male</option>
              </select>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder="Model (optional)"
              className="w-32 input input-sm"
            />

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="btn-ghost btn-sm"
              title="Audio model settings"
            >
              Settings
            </button>
          </>
        )}
      </div>

      {provider !== 'suno' && (
        <ModelSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          modelId={model}
          modality="audio"
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      )}
    </>
  );
};

export default AudioProviderSelector;
