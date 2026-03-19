import { AvailableMediaItem } from '../../../api/clip';
import { AssetKind, normalizeAssetKind } from '../assetPool';
import { AttachmentType } from './types';

export const isMusicMedia = (item: AvailableMediaItem): boolean => {
  const kind = normalizeAssetKind(item.type, item.mime_type);
  return kind === 'music' || kind === 'audio';
};

export const inferAttachmentTypeFromFile = (file: File): AttachmentType => {
  if (file.type.startsWith('audio/')) return 'music';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
};

export const ensureKind = (value: AttachmentType): AssetKind => {
  if (value === 'music') return 'music';
  if (value === 'image') return 'image';
  if (value === 'video') return 'video';
  if (value === 'audio') return 'audio';
  if (value === 'file') return 'file';
  return 'unknown';
};

export const formatBytes = (value?: number): string => {
  if (!value || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const toActionableErrorMessage = (error: unknown): string => {
  const record = error as
    | {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      }
    | undefined;
  return (
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.message ||
    'Failed to start pipeline run.'
  );
};
