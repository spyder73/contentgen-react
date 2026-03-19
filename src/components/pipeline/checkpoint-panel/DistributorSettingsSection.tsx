import React from 'react';
import CheckpointProviderSelector from '../../selectors/CheckpointProviderSelector';

interface DistributorSettingsSectionProps {
  provider: string;
  model: string;
  delimiter: string;
  maxChildren: number;
  onProviderChange: (value: string | undefined) => void;
  onModelChange: (value: string | undefined) => void;
  onDelimiterChange: (value: string) => void;
  onMaxChildrenChange: (value: string) => void;
}

const DistributorSettingsSection: React.FC<DistributorSettingsSectionProps> = ({
  provider,
  model,
  delimiter,
  maxChildren,
  onProviderChange,
  onModelChange,
  onDelimiterChange,
  onMaxChildrenChange,
}) => (
  <section className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
        Distributor Settings
      </h4>
      <p className="mt-1 text-xs text-amber-100/60">
        Distributor provider and model live inside `distributor`.
      </p>
    </div>

    <CheckpointProviderSelector
      provider={provider}
      model={model}
      modality="chat"
      allowInherit
      inheritLabel="Use run defaults"
      providerAriaLabel="Distributor provider"
      modelAriaLabel="Distributor model"
      onProviderChange={onProviderChange}
      onModelChange={onModelChange}
    />

    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Delimiter</label>
        <select
          value={delimiter}
          onChange={(event) => onDelimiterChange(event.target.value)}
          className="input w-full text-xs"
        >
          <option value="newline">Newline</option>
          <option value="json_array">JSON Array</option>
          <option value="json_objects">JSON Objects</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Max Children</label>
        <input
          type="number"
          min={1}
          value={maxChildren}
          onChange={(event) => onMaxChildrenChange(event.target.value)}
          className="input w-full text-xs"
        />
      </div>
    </div>
  </section>
);

export default DistributorSettingsSection;
