export type MediaType = 'image' | 'ai_video' | 'audio';

export interface MediaItem {
  id: string;
  type: MediaType;
  prompt: string;
  file_url: string;
  metadata: Record<string, any>;
}