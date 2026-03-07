import React from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem, mediaItemToPoolItem } from '../assetPool';
import { Button } from '../../ui';

interface MediaCatalogSectionProps {
  availableMedia: AvailableMediaItem[];
  assetPoolById: Map<string, AssetPoolItem>;
  onAddAsset: (asset: AssetPoolItem) => void;
}

const MediaCatalogSection: React.FC<MediaCatalogSectionProps> = ({
  availableMedia,
  assetPoolById,
  onAddAsset,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Media Catalog</label>
    {availableMedia.length === 0 ? (
      <p className="attachment-meta">No media catalog items available.</p>
    ) : (
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {availableMedia.map((item) => {
          const poolItem = mediaItemToPoolItem(item);
          const isInPool = assetPoolById.has(poolItem.id);
          return (
            <div key={item.id} className="attachment-item flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-zinc-200 truncate">{item.name}</p>
                <p className="attachment-meta">
                  {item.type} · {item.id}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddAsset(poolItem)}
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

export default MediaCatalogSection;
