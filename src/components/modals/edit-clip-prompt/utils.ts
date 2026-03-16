import { ClipPrompt } from '../../../api/structs';
import { AvailableMediaItem } from '../../../api/clip';
import {
  AttachmentProvenanceItem,
  normalizeAttachmentProvenanceItem,
  readMetadataAttachmentProvenance,
} from '../../clips/attachmentProvenance';

import { isRecord, toStringValue } from '../../../api/typeHelpers';
export { isRecord, toStringValue };

export const normalizeFrontText = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

export const extractMediaId = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!isRecord(value)) return '';
  return toStringValue(value.media_id ?? value.mediaId ?? value.id);
};

export const extractMusicMediaId = (clip: ClipPrompt): string => {
  const metadata = clip.metadata || {};
  const metadataMusicId = extractMediaId(
    metadata.music_media_id ??
      metadata.musicMediaId ??
      metadata.music ??
      metadata.music_attachment ??
      metadata.musicAttachment
  );
  if (metadataMusicId) return metadataMusicId;

  const metadataProvenance = readMetadataAttachmentProvenance(metadata);
  const inheritedMusic = metadataProvenance.find((item) => {
    const type = item.type.toLowerCase();
    const role = item.role.toLowerCase();
    return Boolean(item.media_id) && (role === 'music' || type.includes('music') || type === 'audio');
  });
  if (inheritedMusic?.media_id) return inheritedMusic.media_id;

  const firstAudio = clip.media?.audios?.[0];
  return firstAudio?.id || '';
};

export const isMusicMedia = (item: AvailableMediaItem): boolean => {
  const type = item.type.toLowerCase();
  if (type.includes('music')) return true;
  if (type === 'audio') return true;
  return Boolean(item.mime_type?.toLowerCase().startsWith('audio/'));
};

export const formatSourceLabel = (source?: string): string => {
  const normalized = (source || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('generated') || normalized.includes('pipeline') || normalized.includes('checkpoint')) {
    return 'generated';
  }
  if (normalized.includes('media') || normalized.includes('upload') || normalized.includes('manual')) {
    return 'uploaded';
  }
  return normalized;
};

export const toMediaOptionLabel = (item: AvailableMediaItem): string =>
  `${item.name} (${item.type}${item.source ? ` · ${formatSourceLabel(item.source)}` : ''})`;

export const toProvenanceMediaItem = (item: AttachmentProvenanceItem): AvailableMediaItem | null => {
  const mediaId = item.media_id || item.id;
  if (!mediaId) return null;
  return {
    id: mediaId,
    media_id: item.media_id || mediaId,
    type: item.type || 'unknown',
    name: item.name || mediaId,
    url: item.url,
    mime_type: item.mime_type,
    source: item.source,
    metadata: {
      role: item.role,
      source_run_id: item.source_run_id,
      source_checkpoint_id: item.source_checkpoint_id,
      source_checkpoint_name: item.source_checkpoint_name,
      source_checkpoint_index: item.source_checkpoint_index,
      inherited_attachment: true,
    },
  };
};

export const readReferenceAssets = (metadata: Record<string, unknown>): AttachmentProvenanceItem[] => {
  if (!Array.isArray(metadata.reference_assets)) return [];
  return metadata.reference_assets
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};

const normalizeReferenceAssetsForSubmit = (value: unknown): AttachmentProvenanceItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};

export const normalizeMetadataForSubmit = (
  metadata: Record<string, unknown>,
  musicMediaId?: string
): Record<string, unknown> => {
  const normalized = { ...metadata };

  if (normalized.frontText !== undefined) {
    normalized.frontText = normalizeFrontText(normalized.frontText);
  }

  const referenceAssets = normalizeReferenceAssetsForSubmit(normalized.reference_assets);
  if (referenceAssets.length > 0) {
    normalized.reference_assets = referenceAssets;
  } else {
    delete normalized.reference_assets;
  }

  if (musicMediaId) {
    normalized.music_media_id = musicMediaId;
    normalized.music = isRecord(normalized.music)
      ? { ...normalized.music, media_id: musicMediaId }
      : { media_id: musicMediaId };
  } else {
    delete normalized.music_media_id;
    if (isRecord(normalized.music)) {
      const nextMusic = { ...normalized.music };
      delete nextMusic.media_id;
      delete nextMusic.mediaId;
      delete nextMusic.id;
      if (Object.keys(nextMusic).length === 0) delete normalized.music;
      else normalized.music = nextMusic;
    }
  }

  return normalized;
};
