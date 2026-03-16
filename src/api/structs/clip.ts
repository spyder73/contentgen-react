import { MediaItem } from './media';

// ==================== Core Clip Types ====================

export interface ClipMedia {
  images: MediaItem[];
  ai_videos: MediaItem[];
  audios: MediaItem[];
}

export interface ClipMetadata {
  [key: string]: any;
}

export interface ClipStyle {
  style: string;
}

export interface ClipPrompt {
  id: string;
  name: string;
  media: ClipMedia;
  metadata: ClipMetadata;
  style: ClipStyle;
  file_urls: string[];
}

export interface Idea {
  id: string;
  clip_idea: string;
  clip_prompt_json: string;
}

// ==================== File Type Helpers ====================

export type OutputFileType = 'video' | 'image' | 'audio' | 'unknown';

const normalizeOutputUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  const withoutQuery = trimmed.split('?')[0]?.split('#')[0] || '';
  return withoutQuery.toLowerCase();
};

export const isTransientOutputUrl = (url: string): boolean => {
  const trimmed = (url || '').trim().toLowerCase();
  if (!trimmed) return true;
  return /^(waiting|pending|rendering|processing|queued|failed|error)([:_\- ]|$)/i.test(trimmed);
};

export const getFileType = (url: string): OutputFileType => {
  const normalized = normalizeOutputUrl(url);
  if (!normalized || isTransientOutputUrl(normalized)) return 'unknown';

  if (/\.(mp4|webm|mov|avi|m4v|ogv|m3u8)$/.test(normalized)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|avif)$/.test(normalized)) return 'image';
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(normalized)) return 'audio';

  const fallback = normalized.toLowerCase();
  if (fallback.includes('/video') || fallback.includes('video/')) return 'video';
  if (fallback.includes('/image') || fallback.includes('image/')) return 'image';
  if (fallback.includes('/audio') || fallback.includes('audio/')) return 'audio';

  return 'unknown';
};

export const getOutputFileTypes = (urls: string[]): OutputFileType[] => 
  urls.map(getFileType);

export const getPrimaryOutputType = (urls: string[]): OutputFileType => {
  if (urls.length === 0) return 'unknown';
  return getFileType(urls[0]);
};
