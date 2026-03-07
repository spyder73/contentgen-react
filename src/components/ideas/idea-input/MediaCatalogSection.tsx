import React, { useMemo, useState } from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem, mediaItemToPoolItem } from '../assetPool';
import { Button } from '../../ui';
import { formatBytes } from './helpers';

interface MediaCatalogSectionProps {
  availableMedia: AvailableMediaItem[];
  assetPoolById: Map<string, AssetPoolItem>;
  onAddAsset: (asset: AssetPoolItem) => void;
}

const MediaCatalogSection: React.FC<MediaCatalogSectionProps> = ({
  availableMedia,
  assetPoolById,
  onAddAsset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    availableMedia.forEach((item) => {
      if (item.type?.trim()) types.add(item.type.trim());
    });
    return ['all', ...Array.from(types.values()).sort((a, b) => a.localeCompare(b))];
  }, [availableMedia]);

  const sourceOptions = useMemo(() => {
    const sources = new Set<string>();
    availableMedia.forEach((item) => {
      if (item.source?.trim()) sources.add(item.source.trim());
    });
    return ['all', ...Array.from(sources.values()).sort((a, b) => a.localeCompare(b))];
  }, [availableMedia]);

  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableMedia.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedSource !== 'all' && (item.source || 'unknown') !== selectedSource) return false;
      if (!query) return true;
      const mediaId = item.media_id || item.id;
      return [item.name, mediaId, item.type, item.source || 'unknown']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [availableMedia, searchQuery, selectedSource, selectedType]);

  return (
    <div className="space-y-2">
      <label className="attachment-state">Media Explorer</label>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="input sm:col-span-2"
          placeholder="Search name, media_id, type, source..."
          aria-label="Search media library"
        />
        <div className="grid gap-2 grid-cols-2">
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="select"
            aria-label="Filter media type"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <select
            value={selectedSource}
            onChange={(event) => setSelectedSource(event.target.value)}
            className="select"
            aria-label="Filter media source"
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source === 'all' ? 'All Sources' : source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {availableMedia.length === 0 ? (
        <p className="attachment-meta">No media library items available yet.</p>
      ) : filteredMedia.length === 0 ? (
        <p className="attachment-meta">No media items match current filters.</p>
      ) : (
        <div className="space-y-1 max-h-56 overflow-auto pr-1">
          <div className="attachment-meta grid grid-cols-[minmax(0,2fr)_80px_110px_minmax(0,1.5fr)_70px] gap-2 px-2">
            <span>Name</span>
            <span>Type</span>
            <span>Source</span>
            <span>Media ID</span>
            <span />
          </div>
          {filteredMedia.map((item) => {
            const poolItem = mediaItemToPoolItem(item);
            const isInPool = assetPoolById.has(poolItem.id);
            const mediaId = item.media_id || item.id;
            return (
              <div
                key={mediaId}
                className="attachment-item grid grid-cols-[minmax(0,2fr)_80px_110px_minmax(0,1.5fr)_70px] items-center gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 truncate">{item.name || mediaId}</p>
                  <p className="attachment-meta">
                    {item.mime_type || 'unknown mime'}
                    {formatBytes(item.size_bytes) ? ` · ${formatBytes(item.size_bytes)}` : ''}
                  </p>
                </div>
                <p className="attachment-meta truncate">{item.type || 'unknown'}</p>
                <p className="attachment-meta truncate">{item.source || 'unknown'}</p>
                <p className="attachment-meta truncate">{mediaId}</p>
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
};

export default MediaCatalogSection;
