import { MediaLibraryItem } from '../../../api/media';
import { AssetPoolItem } from '../assetPool';

export type FolderType = 'all' | 'image' | 'video' | 'audio';
export type SourceFilter = 'all' | 'uploaded' | 'generated';

interface HttpErrorRecord {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      detail?: string;
    };
  };
  message?: string;
}

type ErrorContext = 'list' | 'upload' | 'rename' | 'metadata' | 'remove';

export const FOLDER_STYLES: Record<FolderType, string> = {
  all: 'border-white/20 text-zinc-200 bg-white/5',
  image: 'border-red-400/40 text-red-300 bg-red-500/10',
  video: 'border-blue-400/40 text-blue-300 bg-blue-500/10',
  audio: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
};

export const SOURCE_OPTIONS: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'All Sources' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'generated', label: 'Generated' },
];

export const inferFolderFromType = (type?: string, mimeType?: string): FolderType => {
  const normalizedType = (type || '').toLowerCase();
  const normalizedMime = (mimeType || '').toLowerCase();
  if (normalizedType.includes('image') || normalizedMime.startsWith('image/')) return 'image';
  if (normalizedType.includes('video') || normalizedType.includes('ai_video') || normalizedMime.startsWith('video/')) {
    return 'video';
  }
  if (normalizedType.includes('audio') || normalizedType.includes('music') || normalizedMime.startsWith('audio/')) {
    return 'audio';
  }
  return 'all';
};

export const inferSourceBucket = (source?: string): SourceFilter => {
  const normalized = (source || '').toLowerCase();
  if (!normalized) return 'uploaded';
  if (isGeneratedSource(source)) return 'generated';
  return 'uploaded';
};

export const isGeneratedSource = (source?: string): boolean => {
  const normalized = (source || '').toLowerCase();
  return (
    normalized.includes('generated') ||
    normalized.includes('pipeline') ||
    normalized.includes('checkpoint')
  );
};

export const inferUploadType = (file: File): string => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
};

const hasDuplicateNameSignal = (rawText: string): boolean => {
  const normalized = rawText.toLowerCase();
  return (
    normalized.includes('duplicate') ||
    normalized.includes('already exists') ||
    normalized.includes('name exists') ||
    normalized.includes('conflict')
  );
};

export const toActionableError = (error: unknown, context: ErrorContext = 'list'): string => {
  const record = error as HttpErrorRecord | undefined;
  const status = record?.response?.status;
  const details =
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.response?.data?.detail ||
    record?.message;

  if (status === 405) {
    return 'Media-library route is disabled (HTTP 405). Check upload/list route configuration.';
  }
  if (status === 413) {
    return 'This file is too large (HTTP 413). Upload a smaller file or increase backend upload limits.';
  }
  if (context === 'rename' && (status === 409 || hasDuplicateNameSignal(details || ''))) {
    return 'A file with this name already exists. Choose a different name and try again.';
  }
  if (context === 'remove' && status === 409) {
    return 'This file cannot be removed right now due to backend constraints. Try again after dependent jobs finish.';
  }
  if (context === 'rename') {
    return details || 'Failed to rename media item.';
  }
  if (context === 'metadata') {
    return details || 'Failed to save media metadata.';
  }
  if (context === 'upload') {
    return details || 'Failed to upload media file.';
  }
  return details || 'Media library action failed.';
};

const normalizeGeneratedAsset = (asset: AssetPoolItem): MediaLibraryItem | null => {
  const mediaId = (asset.media_id || '').trim();
  const fallbackId = mediaId || (asset.id || '').trim() || (asset.url || '').trim();
  if (!fallbackId) return null;

  return {
    id: fallbackId,
    media_id: fallbackId,
    type: asset.type || asset.kind || 'unknown',
    name: asset.name || fallbackId,
    url: asset.url,
    mime_type: asset.mime_type,
    source: 'generated',
    size_bytes: asset.size_bytes,
    metadata: {
      ...(asset.metadata || {}),
      generated_asset_pool_id: asset.id,
      generated_has_real_media_id: Boolean(mediaId),
      source_run_id: asset.run_id,
      source_checkpoint_id: asset.checkpoint_id,
      source_checkpoint_name: asset.checkpoint_name,
      source_checkpoint_index: asset.checkpoint_index,
    },
  };
};

export const mergeLibraryItems = (libraryItems: MediaLibraryItem[], generatedAssets: AssetPoolItem[]): MediaLibraryItem[] => {
  const merged = new Map<string, MediaLibraryItem>();
  libraryItems.forEach((item) => {
    merged.set(item.media_id || item.id, item);
  });
  generatedAssets
    .map((asset) => normalizeGeneratedAsset(asset))
    .filter((asset): asset is MediaLibraryItem => Boolean(asset))
    .forEach((asset) => {
      const id = asset.media_id || asset.id;
      if (!merged.has(id)) {
        merged.set(id, asset);
      }
    });

  return Array.from(merged.values()).sort((a, b) => {
    const byType = inferFolderFromType(a.type, a.mime_type).localeCompare(inferFolderFromType(b.type, b.mime_type));
    if (byType !== 0) return byType;
    return (a.name || a.media_id || a.id).localeCompare(b.name || b.media_id || b.id);
  });
};

export const filterLibraryItems = (
  items: MediaLibraryItem[],
  folderType: FolderType,
  sourceFilter: SourceFilter,
  searchQuery: string
): MediaLibraryItem[] => {
  const query = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    const itemFolder = inferFolderFromType(item.type, item.mime_type);
    const isGenerated = isGeneratedSource(item.source);

    if (folderType !== 'all' && itemFolder !== folderType) return false;
    if (sourceFilter === 'uploaded' && isGenerated) return false;
    if (sourceFilter === 'generated' && !isGenerated) return false;
    if (!query) return true;

    return [item.name, item.media_id || item.id, item.type, item.source || 'unknown']
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
};

export const countItemsByFolder = (items: MediaLibraryItem[]): Record<FolderType, number> =>
  items.reduce<Record<FolderType, number>>(
    (acc, item) => {
      const folder = inferFolderFromType(item.type, item.mime_type);
      acc.all += 1;
      if (folder !== 'all') acc[folder] += 1;
      return acc;
    },
    { all: 0, image: 0, video: 0, audio: 0 }
  );

export const selectMediaItems = (items: MediaLibraryItem[], selectedIds: string[]): MediaLibraryItem[] =>
  selectedIds
    .map((id) => items.find((item) => (item.media_id || item.id) === id))
    .filter((item): item is MediaLibraryItem => Boolean(item));

export const readMediaContextDraft = (item: MediaLibraryItem | null): string => {
  if (!item) return '';
  const metadata = item.metadata || {};
  const value = metadata.user_context ?? metadata.context_note ?? metadata.context ?? '';
  return typeof value === 'string' ? value : '';
};
