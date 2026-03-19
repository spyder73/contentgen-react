import React from 'react';
import { AssetPoolItem } from '../assetPool';
import { CheckpointBindingRow } from './types';

interface CheckpointBindingsSectionProps {
  rows: CheckpointBindingRow[];
  assetPool: AssetPoolItem[];
  checkpointBindings: Record<string, string[]>;
  onToggleBinding: (checkpointId: string, assetId: string) => void;
}

const CheckpointBindingsSection: React.FC<CheckpointBindingsSectionProps> = ({
  rows,
  assetPool,
  checkpointBindings,
  onToggleBinding,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Checkpoint Bindings</label>
    {rows.length === 0 ? (
      <p className="attachment-meta">No checkpoint-bound attachment slots for this template.</p>
    ) : (
      rows.map((row) => (
        <div key={row.checkpoint.id} className="attachment-item space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-zinc-200 truncate">{row.checkpoint.name}</p>
            <span
              className={`text-[10px] uppercase tracking-wide ${
                row.requirements.length === 0
                  ? 'text-zinc-400'
                  : row.requirementSummary.satisfied
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}
            >
              {row.requirements.length === 0
                ? `${row.boundAssets.length} bound`
                : row.requirementSummary.satisfied
                ? 'Requirements met'
                : 'Requirements missing'}
            </span>
          </div>

          {row.requirements.length > 0 && (
            <div className="space-y-1">
              {row.requirementSummary.details.map((detail) => (
                <p key={`${row.checkpoint.id}-${detail.requirement.id}`} className="attachment-meta">
                  {detail.requirement.label}: {detail.matched_count}/{detail.requirement.min_count}
                  {detail.satisfied ? ' (ok)' : ` (missing ${detail.missing_count})`}
                </p>
              ))}
            </div>
          )}

          {assetPool.length === 0 ? (
            <p className="attachment-meta">Add assets to the pool first.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-auto pr-1">
              {assetPool.map((asset) => {
                const isChecked = (checkpointBindings[row.checkpoint.id] || []).includes(asset.id);
                return (
                  <label key={`${row.checkpoint.id}-${asset.id}`} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleBinding(row.checkpoint.id, asset.id)}
                      className="h-4 w-4"
                    />
                    <span className="attachment-meta">
                      {asset.name} ({asset.kind} · {asset.source})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

export default CheckpointBindingsSection;
