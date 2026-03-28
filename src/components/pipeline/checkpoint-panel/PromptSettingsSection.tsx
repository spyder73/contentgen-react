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
}) => {
  const isOnline = Boolean(model?.endsWith(':online'));
  const baseModel = isOnline ? model.slice(0, -7) : (model || '');

  const handleModelChange = (newValue: string) => {
    onModelChange(isOnline && newValue ? `${newValue}:online` : newValue || undefined);
  };

  const handleWebSearchToggle = (checked: boolean) => {
    onModelChange(checked && baseModel ? `${baseModel}:online` : baseModel || undefined);
  };

  return (
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
        model={baseModel}
        modality="chat"
        allowInherit
        inheritLabel="Use run defaults"
        providerAriaLabel="Prompt provider"
        modelAriaLabel="Prompt model"
        onProviderChange={onProviderChange}
        onModelChange={handleModelChange}
      />

      {provider && baseModel && (
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => handleWebSearchToggle(e.target.checked)}
            className="accent-white"
          />
          <span>Web Search</span>
          <span className="text-slate-500">(+$0.01/req)</span>
        </label>
      )}
    </section>
  );
};

export default PromptSettingsSection;
