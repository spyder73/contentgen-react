import React from 'react';
import { MediaLibraryItem } from '../../../api/media';
import { Button, Input, TextArea } from '../../ui';
import {
  FOLDER_STYLES,
  FolderType,
  inferFolderFromType,
  inferSourceBucket,
  SOURCE_OPTIONS,
  SourceFilter,
} from './helpers';

interface BrowseTabProps {
  loading: boolean;
  folderType: FolderType;
  sourceFilter: SourceFilter;
  searchQuery: string;
  folderCounts: Record<FolderType, number>;
  filteredItems: MediaLibraryItem[];
  selectedIds: string[];
  activeItem: MediaLibraryItem | null;
  mode: 'manage' | 'select';
  contextDraft: string;
  renameDraft: string;
  savingContext: boolean;
  renaming: boolean;
  deleting: boolean;
  onFolderTypeChange: (value: FolderType) => void;
  onSourceFilterChange: (value: SourceFilter) => void;
  onSearchQueryChange: (value: string) => void;
  onFileClick: (mediaId: string) => void;
  onContextDraftChange: (value: string) => void;
  onRenameDraftChange: (value: string) => void;
  onSaveContext: () => void;
  onRename: () => void;
  onRemove: () => void;
}

const renderRowPreview = (item: MediaLibraryItem) => {
  const folder = inferFolderFromType(item.type, item.mime_type);
  const url = (item.url || '').trim();
  if (!url) {
    return (
      <div className="w-11 h-11 rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase">
        {folder}
      </div>
    );
  }
  if (folder === 'image') {
    return <img src={url} alt={item.name || item.media_id || item.id} className="w-11 h-11 rounded object-cover border border-white/20" loading="lazy" />;
  }
  if (folder === 'video') {
    return <video src={url} className="w-11 h-11 rounded object-cover border border-white/20" muted playsInline preload="metadata" />;
  }
  return (
    <div className="w-11 h-11 rounded border border-amber-300/30 bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-200 uppercase">
      Audio
    </div>
  );
};

const renderDetailPreview = (item: MediaLibraryItem) => {
  const folder = inferFolderFromType(item.type, item.mime_type);
  const url = (item.url || '').trim();
  if (!url) {
    return <p className="attachment-meta">No preview URL available for this file.</p>;
  }
  if (folder === 'image') {
    return <img src={url} alt={item.name || item.media_id || item.id} className="w-full max-h-44 object-contain rounded border border-white/15 bg-black/40" loading="lazy" />;
  }
  if (folder === 'video') {
    return <video src={url} className="w-full max-h-44 rounded border border-white/15 bg-black/40" controls playsInline preload="metadata" />;
  }
  if (folder === 'audio') {
    return <audio src={url} className="w-full" controls preload="metadata" />;
  }
  return <p className="attachment-meta">Preview not supported for this media type.</p>;
};

const readGeneratedOriginLabel = (item: MediaLibraryItem): string => {
  const metadata = item.metadata || {};
  const originName = metadata.source_checkpoint_name;
  if (typeof originName === 'string' && originName.trim()) return originName.trim();
  const originId = metadata.source_checkpoint_id;
  if (typeof originId === 'string' && originId.trim()) return originId.trim();
  const originIndex = metadata.source_checkpoint_index;
  if (typeof originIndex === 'number' && Number.isFinite(originIndex)) {
    return `checkpoint ${originIndex + 1}`;
  }
  return '';
};

const BrowseTab: React.FC<BrowseTabProps> = ({
  loading,
  folderType,
  sourceFilter,
  searchQuery,
  folderCounts,
  filteredItems,
  selectedIds,
  activeItem,
  mode,
  contextDraft,
  renameDraft,
  savingContext,
  renaming,
  deleting,
  onFolderTypeChange,
  onSourceFilterChange,
  onSearchQueryChange,
  onFileClick,
  onContextDraftChange,
  onRenameDraftChange,
  onSaveContext,
  onRename,
  onRemove,
}) => {
  const activeMediaId = activeItem ? activeItem.media_id || activeItem.id : '';
  const isActiveSelected = activeMediaId ? selectedIds.includes(activeMediaId) : false;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {(['all', 'image', 'video', 'audio'] as FolderType[]).map((folder) => {
          const isActive = folderType === folder;
          return (
            <button
              key={folder}
              type="button"
              className={`rounded border px-3 py-2 text-left transition ${FOLDER_STYLES[folder]} ${
                isActive ? 'ring-1 ring-white/40' : ''
              }`}
              onClick={() => onFolderTypeChange(folder)}
            >
              <p className="text-xs uppercase tracking-[0.1em]">
                {folder === 'all' ? 'All Files' : `${folder[0].toUpperCase()}${folder.slice(1)} Folder`}
              </p>
              <p className="text-[11px] mt-1">{folderCounts[folder]} files</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search name, media ID, type, source..."
        />
        <select
          className="select"
          value={sourceFilter}
          onChange={(event) => onSourceFilterChange(event.target.value as SourceFilter)}
          aria-label="Filter by source"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-h-80 overflow-auto space-y-2 pr-1">
          {loading ? (
            <p className="attachment-meta">Loading library files...</p>
          ) : filteredItems.length === 0 ? (
            <p className="attachment-meta">No files match current folder/source filters.</p>
          ) : (
            filteredItems.map((item) => {
              const mediaId = item.media_id || item.id;
              const selected = selectedIds.includes(mediaId);
              const folder = inferFolderFromType(item.type, item.mime_type);
              return (
                <button
                  key={mediaId}
                  type="button"
                  className={`w-full text-left attachment-item transition ${
                    selected ? 'ring-1 ring-white/45 bg-white/10' : ''
                  } ${
                    folder === 'image'
                      ? 'border-red-400/35'
                      : folder === 'video'
                      ? 'border-blue-400/35'
                      : folder === 'audio'
                      ? 'border-amber-400/35'
                      : ''
                  }`}
                  onClick={() => onFileClick(mediaId)}
                >
                  <div className="flex items-start gap-2">
                    {renderRowPreview(item)}
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const originLabel = inferSourceBucket(item.source) === 'generated'
                          ? readGeneratedOriginLabel(item)
                          : '';
                        return (
                          <>
                            <p className="text-xs text-zinc-100 truncate">{item.name || mediaId}</p>
                            <p className="attachment-meta mt-1">
                              {item.type || 'unknown'} · {inferSourceBucket(item.source)} · {mediaId}
                              {originLabel ? ` · ${originLabel}` : ''}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    {mode === 'select' && (
                      <span className="attachment-meta">{selected ? 'Selected' : 'Tap to select'}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="attachment-surface space-y-2">
          <p className="attachment-state">File Details</p>
          {!activeItem ? (
            <p className="attachment-meta">Select a file to view metadata and preview.</p>
          ) : (
            <>
              {renderDetailPreview(activeItem)}
              <p className="text-xs text-zinc-200">{activeItem.name || activeItem.media_id || activeItem.id}</p>
              <p className="attachment-meta">Media ID: {activeItem.media_id || activeItem.id}</p>
              <p className="attachment-meta">Type: {activeItem.type || 'unknown'}</p>
              <p className="attachment-meta">Source: {activeItem.source || 'unknown'}</p>
              {readGeneratedOriginLabel(activeItem) && (
                <p className="attachment-meta">Generated from: {readGeneratedOriginLabel(activeItem)}</p>
              )}

              {mode === 'manage' ? (
                <>
                  <TextArea
                    value={contextDraft}
                    onChange={(event) => onContextDraftChange(event.target.value)}
                    rows={4}
                    placeholder="Add context for this file (stored in metadata)..."
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={onSaveContext} disabled={savingContext}>
                    {savingContext ? 'Saving...' : 'Save Context'}
                  </Button>

                  <div className="pt-1 border-t border-white/10 space-y-2">
                    <Input
                      value={renameDraft}
                      onChange={(event) => onRenameDraftChange(event.target.value)}
                      placeholder="Rename file..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onRename}
                        disabled={renaming || !renameDraft.trim()}
                      >
                        {renaming ? 'Renaming...' : 'Rename'}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={deleting}>
                        {deleting ? 'Removing...' : 'Remove File'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="attachment-meta">
                    {isActiveSelected ? 'Included for next run.' : 'Click the file row to include it for next run.'}
                  </p>
                  <p className="attachment-meta">
                    Removal and metadata editing are available in Media Upload Library (Upload/Browse mode).
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseTab;
