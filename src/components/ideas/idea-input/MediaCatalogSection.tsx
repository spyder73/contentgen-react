import React, { useMemo, useState } from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem, mediaItemToPoolItem } from '../assetPool';
import { Button } from '../../ui';
import { formatBytes } from './helpers';
import { CheckpointBindingRow } from './types';

interface MediaCatalogSectionProps {
  availableMedia: AvailableMediaItem[];
  assetPoolById: Map<string, AssetPoolItem>;
  checkpointRows: CheckpointBindingRow[];
  checkpointBindings: Record<string, string[]>;
  libraryError?: string;
  onAddAsset: (asset: AssetPoolItem) => void;
  onAttachAssetToCheckpoint: (checkpointId: string, asset: AssetPoolItem) => void;
}

type MediaTab = 'image' | 'video' | 'audio';

const MEDIA_TABS: Array<{ id: MediaTab; label: string }> = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
];

const normalizeGroup = (item: AvailableMediaItem): MediaTab | 'other' => {
  const type = (item.type || '').toLowerCase();
  const mimeType = (item.mime_type || '').toLowerCase();
  if (type.includes('image') || mimeType.startsWith('image/')) return 'image';
  if (type.includes('video') || type.includes('ai_video') || mimeType.startsWith('video/')) return 'video';
  if (type.includes('audio') || type.includes('music') || mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

const MediaCatalogSection: React.FC<MediaCatalogSectionProps> = ({
  availableMedia,
  assetPoolById,
  checkpointRows,
  checkpointBindings,
  libraryError,
  onAddAsset,
  onAttachAssetToCheckpoint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<MediaTab>('image');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');

  const typeGroupedMedia = useMemo(() => {
    const grouped: Record<MediaTab, AvailableMediaItem[]> = {
      image: [],
      video: [],
      audio: [],
    };
    availableMedia.forEach((item) => {
      const group = normalizeGroup(item);
      if (group !== 'other') {
        grouped[group].push(item);
      }
    });
    return grouped;
  }, [availableMedia]);

  React.useEffect(() => {
    if (!checkpointRows.length) {
      if (selectedCheckpointId) {
        setSelectedCheckpointId('');
      }
      return;
    }
    if (
      !selectedCheckpointId ||
      !checkpointRows.some((row) => row.checkpoint.id === selectedCheckpointId)
    ) {
      setSelectedCheckpointId(checkpointRows[0].checkpoint.id);
    }
  }, [checkpointRows, selectedCheckpointId]);

  const mediaForSelectedTab = useMemo(() => typeGroupedMedia[selectedTab] || [], [selectedTab, typeGroupedMedia]);

  const sourceOptions = useMemo<string[]>(() => {
    const sources = new Set<string>();
    mediaForSelectedTab.forEach((item) => {
      if (item.source?.trim()) sources.add(item.source.trim());
    });
    return ['all', ...Array.from(sources.values()).sort((a, b) => a.localeCompare(b))];
  }, [mediaForSelectedTab]);

  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mediaForSelectedTab.filter((item) => {
      if (selectedSource !== 'all' && (item.source || 'unknown') !== selectedSource) return false;
      if (!query) return true;
      const mediaId = item.media_id || item.id;
      return [item.name, mediaId, item.type, item.source || 'unknown']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [mediaForSelectedTab, searchQuery, selectedSource]);

  React.useEffect(() => {
    if (!sourceOptions.includes(selectedSource)) {
      setSelectedSource('all');
    }
  }, [selectedSource, sourceOptions]);

  const renderPreview = (item: AvailableMediaItem) => {
    const group = normalizeGroup(item);
    if (!item.url) {
      return <p className="attachment-meta">No preview URL</p>;
    }

    if (group === 'image') {
      return (
        <img
          src={item.url}
          alt={item.name || item.media_id || item.id}
          className="h-16 w-full rounded border border-white/15 object-cover"
          loading="lazy"
        />
      );
    }

    if (group === 'video') {
      return (
        <video
          src={item.url}
          className="h-16 w-full rounded border border-white/15 object-cover"
          muted
          controls
          preload="metadata"
        />
      );
    }

    return (
      <audio src={item.url} controls preload="metadata" className="w-full h-8" />
    );
  };

  const checkpointOptions = checkpointRows.map((row) => ({
    id: row.checkpoint.id,
    label: row.checkpoint.name,
  }));

  return (
    <div className="space-y-2">
      <label className="attachment-state">Media Explorer</label>
      {libraryError && <p className="attachment-meta text-red-300">{libraryError}</p>}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Media type groups">
        {MEDIA_TABS.map((tab) => {
          const count = typeGroupedMedia[tab.id].length;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`px-2 py-1 text-xs border ${
                isActive ? 'border-white/50 bg-white/10 text-zinc-100' : 'border-white/20 text-zinc-400'
              }`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="input"
          placeholder={`Search ${selectedTab} by filename, media_id, source...`}
          aria-label="Search media library"
        />
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

      {mediaForSelectedTab.length === 0 ? (
        <p className="attachment-meta">No {selectedTab} media library items available yet.</p>
      ) : filteredMedia.length === 0 ? (
        <p className="attachment-meta">No media items match current filters.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {filteredMedia.map((item) => {
            const poolItem = mediaItemToPoolItem(item);
            const isInPool = assetPoolById.has(poolItem.id);
            const mediaId = item.media_id || item.id;
            const isBoundToSelectedCheckpoint = selectedCheckpointId
              ? (checkpointBindings[selectedCheckpointId] || []).includes(poolItem.id)
              : false;
            return (
              <div key={mediaId} className="attachment-item space-y-2">
                <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <div>{renderPreview(item)}</div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-zinc-100 truncate">Filename: {item.name || mediaId}</p>
                    <p className="attachment-meta">Type: {item.type || 'unknown'}</p>
                    <p className="attachment-meta">Media ID: {mediaId}</p>
                    <p className="attachment-meta">
                      Source: {item.source || 'unknown'} · MIME: {item.mime_type || 'unknown mime'}
                      {formatBytes(item.size_bytes) ? ` · ${formatBytes(item.size_bytes)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddAsset(poolItem)}
                    disabled={isInPool}
                  >
                    {isInPool ? 'Attached to Start' : 'Attach to Start'}
                  </Button>
                  {checkpointOptions.length > 0 && (
                    <>
                      <select
                        value={selectedCheckpointId}
                        onChange={(event) => setSelectedCheckpointId(event.target.value)}
                        className="select text-xs"
                        aria-label="Checkpoint quick attach target"
                      >
                        {checkpointOptions.map((checkpoint) => (
                          <option key={checkpoint.id} value={checkpoint.id}>
                            {checkpoint.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onAttachAssetToCheckpoint(selectedCheckpointId, poolItem)}
                        disabled={!selectedCheckpointId || isBoundToSelectedCheckpoint}
                      >
                        {isBoundToSelectedCheckpoint ? 'Attached to Checkpoint' : 'Attach to Checkpoint'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaCatalogSection;
