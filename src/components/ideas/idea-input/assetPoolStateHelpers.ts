import { AvailableMediaItem } from '../../../api/clip';

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

export const getHttpStatus = (error: unknown): number | undefined =>
  (error as HttpErrorRecord | undefined)?.response?.status;

export const getInlineMediaError = (error: unknown, context: 'list' | 'upload'): string => {
  const status = getHttpStatus(error);
  const details =
    (error as HttpErrorRecord | undefined)?.response?.data?.error ||
    (error as HttpErrorRecord | undefined)?.response?.data?.message ||
    (error as HttpErrorRecord | undefined)?.response?.data?.detail ||
    (error as HttpErrorRecord | undefined)?.message;

  if (status === 405) {
    return context === 'list'
      ? 'Media listing is disabled (HTTP 405). Enable GET /media/library or legacy GET /media.'
      : 'Media upload is disabled (HTTP 405). Enable POST /media/library/upload or legacy POST /media/upload.';
  }

  if (status === 413) {
    return 'File is too large for upload (HTTP 413). Choose a smaller file or raise the upload size limit.';
  }

  if (context === 'list') {
    return details || 'Failed to load media library items.';
  }

  return details || 'Failed to upload file to the media library.';
};

export const toNormalizedLibraryItem = (
  item: Partial<AvailableMediaItem>,
  fallback: { inferredType?: string; fallbackName?: string; fallbackSource?: string; fallbackSize?: number } = {}
): AvailableMediaItem => ({
  id: String(item.media_id || item.id || '').trim(),
  media_id: String(item.media_id || item.id || '').trim(),
  type: String(item.type || fallback.inferredType || 'unknown'),
  name: String(item.name || fallback.fallbackName || item.media_id || item.id || '').trim(),
  url: typeof item.url === 'string' ? item.url : undefined,
  mime_type: typeof item.mime_type === 'string' ? item.mime_type : undefined,
  source:
    typeof item.source === 'string'
      ? item.source
      : fallback.fallbackSource,
  size_bytes:
    typeof item.size_bytes === 'number' && Number.isFinite(item.size_bytes)
      ? item.size_bytes
      : fallback.fallbackSize,
  clip_id: typeof item.clip_id === 'string' ? item.clip_id : undefined,
  created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
  metadata:
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : undefined,
});

export const replaceLibraryIfChanged = (
  current: AvailableMediaItem[],
  nextItems: AvailableMediaItem[]
): AvailableMediaItem[] => {
  if (
    current.length === nextItems.length &&
    current.every(
      (item, index) =>
        item.id === nextItems[index]?.id &&
        item.name === nextItems[index]?.name &&
        item.type === nextItems[index]?.type &&
        item.source === nextItems[index]?.source
    )
  ) {
    return current;
  }

  return nextItems;
};

export const mergeLibraryItems = (
  previous: AvailableMediaItem[],
  incoming: AvailableMediaItem[],
  options?: { prepend?: boolean }
): AvailableMediaItem[] => {
  const ordered = options?.prepend ? [...incoming, ...previous] : [...previous, ...incoming];
  const seen = new Set<string>();

  return ordered.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};
