import { AssetKind, AssetSource } from './types';
import { isRecord, toNumberValue, toStringValue } from '../../../api/typeHelpers';
export { isRecord, toStringValue, toNumberValue };

export const humanize = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const normalizeAssetKind = (rawType?: string, rawMimeType?: string): AssetKind => {
  const type = (rawType || '').toLowerCase();
  const mimeType = (rawMimeType || '').toLowerCase();

  if (type.includes('music')) return 'music';
  if (type === 'audio' || mimeType.startsWith('audio/')) return 'audio';
  if (type === 'image' || mimeType.startsWith('image/')) return 'image';
  if (type === 'video' || type === 'ai_video' || mimeType.startsWith('video/')) return 'video';
  if (type === 'file' || type === 'document') return 'file';
  return 'unknown';
};

export const normalizeAssetSource = (rawSource?: string): AssetSource => {
  const source = (rawSource || '').toLowerCase();
  if (!source) return 'unknown';
  if (source.includes('generated') || source.includes('checkpoint') || source.includes('pipeline')) {
    return 'generated';
  }
  if (source.includes('media')) return 'media';
  if (source.includes('url') || source.includes('remote') || source.includes('http')) return 'url';
  if (source.includes('file') || source.includes('upload') || source.includes('local')) return 'file';
  return 'unknown';
};
