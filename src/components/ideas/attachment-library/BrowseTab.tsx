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
  savingContext: boolean;
  onFolderTypeChange: (value: FolderType) => void;
  onSourceFilterChange: (value: SourceFilter) => void;
  onSearchQueryChange: (value: string) => void;
  onFileClick: (mediaId: string) => void;
  onContextDraftChange: (value: string) => void;
  onSaveContext: () => void;
}

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
  savingContext,
  onFolderTypeChange,
  onSourceFilterChange,
  onSearchQueryChange,
  onFileClick,
  onContextDraftChange,
  onSaveContext,
}) => (
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

    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                <p className="text-xs text-zinc-100 truncate">{item.name || mediaId}</p>
                <p className="attachment-meta mt-1">
                  {item.type || 'unknown'} · {inferSourceBucket(item.source)} · {mediaId}
                </p>
              </button>
            );
          })
        )}
      </div>

      <div className="attachment-surface space-y-2">
        <p className="attachment-state">File Details</p>
        {!activeItem ? (
          <p className="attachment-meta">Select a file to view metadata and context.</p>
        ) : (
          <>
            <p className="text-xs text-zinc-200">{activeItem.name || activeItem.media_id || activeItem.id}</p>
            <p className="attachment-meta">Media ID: {activeItem.media_id || activeItem.id}</p>
            <p className="attachment-meta">Type: {activeItem.type || 'unknown'}</p>
            <p className="attachment-meta">Source: {activeItem.source || 'unknown'}</p>
            <TextArea
              value={contextDraft}
              onChange={(event) => onContextDraftChange(event.target.value)}
              rows={4}
              placeholder="Add context for this file (stored in metadata)..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSaveContext}
              disabled={savingContext || mode === 'select'}
            >
              {savingContext ? 'Saving...' : 'Save Context'}
            </Button>
            {mode === 'select' && (
              <p className="attachment-meta">Context editing is available in upload/browse mode.</p>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);

export default BrowseTab;
