// ===========================================
// PROVIDER TYPES (API Services)
// ===========================================

/** Image generation API providers */
export type ImageProvider = 'pollinations' | 'openrouter' | 'runware';

/** Video generation API providers */
export type VideoProvider = 'runware';

/** Audio generation API providers */
export type AudioProvider = 'suno' | 'udio';

/** Chat/Text inference API providers */
export type ChatProvider = 'openrouter' | 'google';

/** All generator types (union of all providers) */
export type Generator = ImageProvider | VideoProvider | AudioProvider;

// ===========================================
// MODEL TYPES (Actual AI Models)
// ===========================================

/** Image model ID string (e.g., 'openai/gpt-5-image-mini') */
export type ImageModel = string;

/** Video model ID string (e.g., 'lightricks:2@1') */
export type VideoModel = string;

/** Audio model ID string */
export type AudioModel = string;

/** Chat model ID string (e.g., 'anthropic/claude-3-opus') */
export type ChatModel = string;

// ===========================================
// SELECTION STATE TYPES
// ===========================================

export interface ImageSelection {
  provider: ImageProvider;
  model: ImageModel;
}

export interface VideoSelection {
  provider: VideoProvider;
  model: VideoModel;
}

export interface AudioSelection {
  provider: AudioProvider;
  model: AudioModel;
}

export interface ChatSelection {
  provider: ChatProvider;
  model: ChatModel;
}

// ===========================================
// DEFAULT VALUES
// ===========================================

export const DEFAULT_IMAGE_PROVIDER: ImageProvider = 'openrouter';
export const DEFAULT_IMAGE_MODEL: ImageModel = 'openai/gpt-5-image-mini';

export const DEFAULT_VIDEO_PROVIDER: VideoProvider = 'runware';
export const DEFAULT_VIDEO_MODEL: VideoModel = 'lightricks:2@1';

export const DEFAULT_AUDIO_PROVIDER: AudioProvider = 'suno';
export const DEFAULT_AUDIO_MODEL: AudioModel = '';

export const DEFAULT_CHAT_PROVIDER: ChatProvider = 'openrouter';
export const DEFAULT_CHAT_MODEL: ChatModel = 'x-ai/grok-4-fast';