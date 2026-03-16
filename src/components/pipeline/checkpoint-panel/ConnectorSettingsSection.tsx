import React from 'react';
import { CheckpointConfig } from '../../../api/structs';

interface ConnectorSettingsSectionProps {
  sourceCheckpointId?: string;
  previousDistributorCheckpoints: CheckpointConfig[];
  onSourceCheckpointChange: (value: string) => void;
}

const ConnectorSettingsSection: React.FC<ConnectorSettingsSectionProps> = ({
  sourceCheckpointId,
  previousDistributorCheckpoints,
  onSourceCheckpointChange,
}) => (
  <section className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">
        Connector Settings
      </h4>
      <p className="mt-1 text-xs text-emerald-100/60">
        Connector strategy is fixed to `collect_all`.
      </p>
    </div>

    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Strategy</label>
      <div className="rounded border border-white/10 bg-black/50 px-3 py-2 text-xs text-gray-300">
        collect_all
      </div>
    </div>

    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">
        Source Distributor
      </label>
      <select
        value={sourceCheckpointId || ''}
        onChange={(event) => onSourceCheckpointChange(event.target.value)}
        className="input w-full text-xs"
      >
        <option value="">Use nearest prior distributor</option>
        {previousDistributorCheckpoints.map((checkpoint) => (
          <option key={checkpoint.id} value={checkpoint.id}>
            {checkpoint.name}
          </option>
        ))}
      </select>
    </div>
  </section>
);

export default ConnectorSettingsSection;
