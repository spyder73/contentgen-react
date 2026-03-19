import { AvailableMediaItem } from '../../../api/clip';
import {
  AttachmentProvenanceItem,
  normalizeAttachmentProvenanceItem,
} from '../../clips/attachmentProvenance';

import { isRecord, toNumberValue, toStringValue } from '../../../api/typeHelpers';
export { isRecord, toStringValue };

export const toNumberWithFallback = (value: unknown, fallback: number): number =>
  toNumberValue(value) ?? fallback;

export const toBooleanValue = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const toReferenceOptionKey = (item: AttachmentProvenanceItem): string =>
  item.media_id || item.id || item.url || '';

export const dedupeOptions = (items: AttachmentProvenanceItem[]): AttachmentProvenanceItem[] => {
  const deduped = new Map<string, AttachmentProvenanceItem>();
  items.forEach((item) => {
    const optionKey = toReferenceOptionKey(item);
    if (!optionKey) return;
    if (!deduped.has(optionKey)) {
      deduped.set(optionKey, item);
    }
  });
  return Array.from(deduped.values());
};

export const normalizeSource = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'media';
  if (normalized.includes('generated') || normalized.includes('pipeline') || normalized.includes('checkpoint')) {
    return 'generated';
  }
  if (normalized.includes('library') || normalized.includes('upload') || normalized.includes('media')) {
    return 'media';
  }
  return normalized;
};

export const toOptionFromAvailableMedia = (item: AvailableMediaItem): AttachmentProvenanceItem => {
  const mediaId = toStringValue(item.media_id ?? item.id) || item.id;
  const source = normalizeSource(toStringValue(item.source));

  return {
    id: mediaId,
    media_id: mediaId,
    type: toStringValue(item.type) || 'unknown',
    name: toStringValue(item.name) || mediaId,
    url: toStringValue(item.url) || undefined,
    mime_type: toStringValue(item.mime_type) || undefined,
    source,
    role: 'reference',
  };
};

export const isReferenceCandidate = (item: AttachmentProvenanceItem): boolean => {
  const type = (item.type || '').toLowerCase();
  const mimeType = (item.mime_type || '').toLowerCase();
  return (
    type.includes('image') ||
    type.includes('video') ||
    type.includes('ai_video') ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/')
  );
};

export const resolveReferenceFromRaw = (value: unknown): AttachmentProvenanceItem | null => {
  const normalized = normalizeAttachmentProvenanceItem(
    isRecord(value)
      ? {
          ...value,
          id: toStringValue(value.id ?? value.reference_id ?? value.referenceId),
          media_id: toStringValue(
            value.media_id ??
              value.mediaId ??
              value.reference_media_id ??
              value.referenceMediaId
          ),
          url: toStringValue(value.url ?? value.reference_url ?? value.referenceUrl),
          name: toStringValue(value.name ?? value.reference_name ?? value.referenceName),
          type: toStringValue(value.type ?? value.reference_type ?? value.referenceType) || 'image',
          source: toStringValue(value.source ?? value.reference_source ?? value.referenceSource) || 'media',
          role: toStringValue(value.role) || 'reference',
          source_checkpoint_id: toStringValue(value.source_checkpoint_id ?? value.sourceCheckpointId),
          source_checkpoint_name: toStringValue(value.source_checkpoint_name ?? value.sourceCheckpointName),
          source_checkpoint_index:
            typeof value.source_checkpoint_index === 'number'
              ? value.source_checkpoint_index
              : undefined,
        }
      : value,
    isRecord(value)
      ? {
          id: toStringValue(value.reference_id ?? value.referenceId),
          media_id: toStringValue(
            value.reference_media_id ??
              value.referenceMediaId ??
              value.media_id ??
              value.mediaId
          ),
          url: toStringValue(value.reference_url ?? value.referenceUrl ?? value.url),
          name: toStringValue(value.reference_name ?? value.referenceName ?? value.name),
          type: toStringValue(value.reference_type ?? value.referenceType ?? value.type) || 'image',
          source: toStringValue(value.reference_source ?? value.referenceSource ?? value.source) || 'media',
          role: 'reference',
          source_checkpoint_id: toStringValue(value.source_checkpoint_id ?? value.sourceCheckpointId),
          source_checkpoint_name: toStringValue(value.source_checkpoint_name ?? value.sourceCheckpointName),
          source_checkpoint_index:
            typeof value.source_checkpoint_index === 'number'
              ? value.source_checkpoint_index
              : undefined,
        }
      : undefined
  );
  return normalized;
};

export const toSceneKey = (sceneId: string, order: number): string => `${sceneId}::${order}`;

export const readReferenceAssets = (metadata: Record<string, unknown>): AttachmentProvenanceItem[] => {
  if (!Array.isArray(metadata.reference_assets)) return [];
  return metadata.reference_assets
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};
