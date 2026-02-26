export type MediaType = 'image' | 'ai_video' | 'audio';


export interface MediaOutputSpec {
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  steps?: number;
  provider?: string;
  model?: string;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  prompt: string;
  file_url: string;
  metadata: Record<string, any>;
  output_spec?: MediaOutputSpec;
}