import React from 'react';
import CheckpointProviderSelector from '../../selectors/CheckpointProviderSelector';

interface PromptSettingsSectionProps {
  provider: string;
  model: string;
  onProviderChange: (value: string | undefined) => void;
  onModelChange: (value: string | undefined) => void;
}

const PromptSettingsSection: React.FC<PromptSettingsSectionProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => (
  <section className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
        Prompt Settings
      </h4>
      <p className="mt-1 text-xs text-gray-500">
        Prompt checkpoints store provider and model under `promptGate`.
      </p>
    </div>

    <CheckpointProviderSelector
      provider={provider}
      model={model}
      modality="chat"
      allowInherit
      inheritLabel="Use run defaults"
      providerAriaLabel="Prompt provider"
      modelAriaLabel="Prompt model"
      onProviderChange={onProviderChange}
      onModelChange={onModelChange}
    />
  </section>
);

export default PromptSettingsSection;
