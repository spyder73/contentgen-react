export interface Idea {
  id: string;
  clip_idea: string;
  clip_prompt_json: string;
}

export interface FrontTextWithMedia {
  frontText: string[];
  frontVid: string;
  POV: string;
}

export interface EndText {
  partTwo: string;
}

export interface ClipDuration {
  totalDuration: string;
  frontVidDuration: string;
}

export interface ImagePrompt {
  id: string;
  prompt: string;
  file_url: string;
  text: string;
  text_position: string;
}

export interface AIVideoPrompt {
  id: string;
  prompt: string;
  file_url: string;
  text: string;
  text_position: string;
}

export interface ClipPrompt {
  id: string;
  image_prompts: ImagePrompt[];
  ai_video_prompts: AIVideoPrompt[];
  front_text?: FrontTextWithMedia;
  partTwo?: EndText;
  totalDuration?: ClipDuration;
  file_url?: string;
  music_url?: string;
  clip_style?: string;
}

export interface AvailableMedia {
  media_files: string[];
}