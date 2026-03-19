import React from 'react';
import { CheckpointRequiredAsset } from '../../../api/structs';

interface RequiredAssetsSectionProps {
  requiredAssets: CheckpointRequiredAsset[];
  onChange: (index: number, field: keyof CheckpointRequiredAsset, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

const RequiredAssetsSection: React.FC<RequiredAssetsSectionProps> = ({
  requiredAssets,
  onChange,
  onAdd,
  onRemove,
}) => {
  const sourceValue = (source?: string) =>
    (source || '').toLowerCase().startsWith('checkpoint:') ? 'checkpoint' : source || '';

  const checkpointIdValue = (asset: CheckpointRequiredAsset) => {
    if (asset.checkpoint_id) return asset.checkpoint_id;
    if ((asset.source || '').toLowerCase().startsWith('checkpoint:')) {
      return asset.source?.slice('checkpoint:'.length) || '';
    }
    return '';
  };

  return (
  <section className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
          Required Assets
        </h4>
        <p className="mt-1 text-xs text-gray-500">
          Structural gating for manual assets or prior checkpoint outputs.
        </p>
      </div>
      <button onClick={onAdd} className="btn btn-sm btn-ghost">
        Add Asset
      </button>
    </div>

    <div className="space-y-3">
      {requiredAssets.map((asset, index) => (
        <div
          key={`${asset.key || 'asset'}-${index}`}
          className="space-y-3 rounded-lg border border-white/10 bg-black/25 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Asset {index + 1}
            </div>
            <button onClick={() => onRemove(index)} className="btn btn-sm btn-ghost">
              Remove
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-400">
                Key
              </span>
              <input
                type="text"
                value={asset.key || ''}
                onChange={(event) => onChange(index, 'key', event.target.value)}
                className="input w-full text-xs"
                placeholder="seed_image"
              />
            </label>

            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-400">
                Type
              </span>
              <select
                value={asset.type || ''}
                onChange={(event) => onChange(index, 'type', event.target.value)}
                className="input w-full text-xs"
              >
                <option value="">Any type</option>
                <option value="image">image</option>
                <option value="video">video</option>
                <option value="audio">audio</option>
                <option value="document">document</option>
                <option value="music">music</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-400">
                Source
              </span>
              <select
                value={sourceValue(asset.source)}
                onChange={(event) => onChange(index, 'source', event.target.value)}
                className="input w-full text-xs"
              >
                <option value="">Any source</option>
                <option value="initial">initial</option>
                <option value="user">user</option>
                <option value="checkpoint">checkpoint</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-400">
                Checkpoint ID
              </span>
              <input
                type="text"
                value={checkpointIdValue(asset)}
                onChange={(event) => onChange(index, 'checkpoint_id', event.target.value)}
                className="input w-full text-xs"
                placeholder="character-seed"
              />
            </label>

            <label className="space-y-1 lg:col-span-2">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-gray-400">
                Media ID
              </span>
              <input
                type="text"
                value={asset.media_id || ''}
                onChange={(event) => onChange(index, 'media_id', event.target.value)}
                className="input w-full text-xs"
                placeholder="Optional fixed media identifier"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  </section>
  );
};

export default RequiredAssetsSection;
