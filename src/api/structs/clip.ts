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

export const getFileType = (url: string): OutputFileType => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  
  return 'unknown';
};

export const getOutputFileTypes = (urls: string[]): OutputFileType[] => 
  urls.map(getFileType);

export const getPrimaryOutputType = (urls: string[]): OutputFileType => {
  if (urls.length === 0) return 'unknown';
  return getFileType(urls[0]);
};