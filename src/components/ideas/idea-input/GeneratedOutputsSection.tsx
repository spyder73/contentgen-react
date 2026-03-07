import React from 'react';
import { AssetPoolItem } from '../assetPool';
import { Button } from '../../ui';

interface GeneratedOutputsSectionProps {
  generatedAssets: AssetPoolItem[];
  assetPoolById: Map<string, AssetPoolItem>;
  onAddAsset: (asset: AssetPoolItem) => void;
}

const GeneratedOutputsSection: React.FC<GeneratedOutputsSectionProps> = ({
  generatedAssets,
  assetPoolById,
  onAddAsset,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Generated Outputs</label>
    {generatedAssets.length === 0 ? (
      <p className="attachment-meta">No generated outputs available for reuse yet.</p>
    ) : (
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {generatedAssets.map((asset) => {
          const normalized: AssetPoolItem = { ...asset, source: 'generated' };
          const isInPool = assetPoolById.has(normalized.id);

          return (
            <div key={normalized.id} className="attachment-item flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-zinc-200 truncate">{normalized.name}</p>
                <p className="attachment-meta">
                  {normalized.kind} · {normalized.checkpoint_name || normalized.checkpoint_id || 'generated'}
                  {normalized.media_id ? ` · ${normalized.media_id}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddAsset(normalized)}
                disabled={isInPool}
              >
                {isInPool ? 'Added' : 'Add'}
              </Button>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default GeneratedOutputsSection;
