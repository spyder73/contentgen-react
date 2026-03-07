import React from 'react';
import { AssetPoolItem } from '../assetPool';
import { Button } from '../../ui';
import { formatBytes } from './helpers';

interface SelectedAssetsSectionProps {
  assetPool: AssetPoolItem[];
  onRemoveAsset: (assetId: string) => void;
  disabled?: boolean;
}

const SelectedAssetsSection: React.FC<SelectedAssetsSectionProps> = ({
  assetPool,
  onRemoveAsset,
  disabled,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Selected Assets</label>
    {assetPool.length === 0 ? (
      <p className="attachment-meta">No selected assets yet.</p>
    ) : (
      assetPool.map((asset) => (
        <div key={asset.id} className="attachment-item flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-zinc-200 truncate">{asset.name || asset.url || asset.id}</p>
            <p className="attachment-meta">
              {asset.kind} · {asset.source}
              {formatBytes(asset.size_bytes) ? ` · ${formatBytes(asset.size_bytes)}` : ''}
              {asset.media_id ? ` · ${asset.media_id}` : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveAsset(asset.id)}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      ))
    )}
  </div>
);

export default SelectedAssetsSection;
