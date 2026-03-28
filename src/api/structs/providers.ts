// ===========================================
// PROVIDER TYPES (API Services)
// ===========================================

/** Image generation API providers */
export type ImageProvider = 'pollinations' | 'openrouter' | 'runware';

/** Video generation API providers */
export type VideoProvider = 'runware';

/** Audio generation API providers */
export type AudioProvider = 'suno' | 'runware';

/** Chat/Text inference API providers */
export type ChatProvider = 'openrouter';

/** All provider types */
export type Provider = ImageProvider | VideoProvider | AudioProvider | ChatProvider;

/** All generator types (for media generation) */
export type Generator = ImageProvider | VideoProvider | AudioProvider;

// ===========================================
// PROVIDER DEFINITIONS
// ===========================================

export interface ProviderDefinition {
  value: string;
  label: string;
  icon?: string;
}

export const IMAGE_PROVIDERS: ProviderDefinition[] = [
  { value: 'pollinations', label: 'Pollinations' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'runware', label: 'Runware' },
];

export const VIDEO_PROVIDERS: ProviderDefinition[] = [
  { value: 'runware', label: 'Runware' },
];

export const AUDIO_PROVIDERS: ProviderDefinition[] = [
  { value: 'suno', label: 'Suno' },
  { value: 'runware', label: 'Runware' },
];

export const CHAT_PROVIDERS: ProviderDefinition[] = [
  { value: 'openrouter', label: 'OpenRouter' },
];

// ===========================================
// PROVIDER -> RESPONSE KEY MAPPING
// ===========================================

/** Maps provider to the key in ModelsResponse */
export type ProviderResponseKey = 'openrouter' | 'runware';

export const PROVIDER_RESPONSE_KEYS: Record<string, ProviderResponseKey | null> = {
  pollinations: null,  // No models fetched
  openrouter: 'openrouter',
  runware: 'runware',
  suno: null,          // No models fetched from registry
};

/** Providers that require model selection */
export const PROVIDERS_WITH_MODELS: Provider[] = ['openrouter', 'runware', 'suno'];

/** Check if a provider requires model selection */
export function providerRequiresModel(provider: Provider): boolean {
  return PROVIDERS_WITH_MODELS.includes(provider);
}

/** Get the response key for a provider */
export function getProviderResponseKey(provider: Provider): ProviderResponseKey | null {
  return PROVIDER_RESPONSE_KEYS[provider] ?? null;
}

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
export const DEFAULT_AUDIO_MODEL: AudioModel = 'V4_5ALL';

export const DEFAULT_CHAT_PROVIDER: ChatProvider = 'openrouter';
export const DEFAULT_CHAT_MODEL: ChatModel = 'x-ai/grok-4-fast';
