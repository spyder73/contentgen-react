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
  file_url: string;
}

export interface Idea {
  id: string;
  clip_idea: string;
  clip_prompt_json: string;
}