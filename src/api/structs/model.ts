// ==================== Base Model ====================

export type ModelType = 'chat' | 'image' | 'video' | 'audio';

export interface ModelPricing {
  prompt?: string;           // per input token (OpenRouter chat)
  completion?: string;       // per output token (OpenRouter chat)
  per_image?: string;        // per image (OpenRouter image, Runware image)
  per_second?: string;       // per second (Runware video/audio)
  per_generation?: string;   // per generation (Suno)
  web_search?: string;       // per web search call (OpenRouter :online)
  request?: string;          // fixed per-request fee
}

export interface ModelCapabilities {
  input_modalities?: string[];
  output_modalities?: string[];
  max_resolution?: number;
  supports_lora?: boolean;
}

// ==================== Registry Constraints (new field-driven) ====================

export interface ConstraintField {
  type?: 'number' | 'integer' | 'string' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  enum?: Array<string | number | boolean>;
  default?: unknown;
  items?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Raw response from GET /models/:id/constraints */
export interface ModelConstraintsRawResponse {
  model_id: string;
  known_model: boolean;
  constraints: {
    image?: { fields: Record<string, ConstraintField>; capabilities?: Record<string, unknown> };
    video?: { fields: Record<string, ConstraintField>; capabilities?: Record<string, unknown> };
    audio?: { fields: Record<string, ConstraintField>; capabilities?: Record<string, unknown> };
  };
}

// Existing ModelConstraintsResponse stays — but it now represents a single modality:
export interface ModelConstraintsResponse {
  model_id: string;
  fields?: Record<string, ConstraintField>;
  capabilities?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  [key: string]: unknown;
}

// ==================== Provider Extensions ====================

export interface OpenRouterModelExt {
  context_length?: number;
  modality?: string;
}

export interface RunwareModelExt {
  air?: string;
  architecture?: string;
  category?: string;
  version?: string;
  civitai_id?: string;
  nsfw_level?: number;
  tags?: string[];
}

// ==================== Unified Model ====================

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider: string;
  type: ModelType;
  pricing?: ModelPricing;
  capabilities?: ModelCapabilities;
  openrouter?: OpenRouterModelExt;
  runware?: RunwareModelExt;
  [key: string]: unknown;
}

// ==================== API Response ====================

export interface ModelsResponse {
  recommended: AIModel[];
  openrouter?: AIModel[];
  runware?: AIModel[];
  suno?: AIModel[];
  [key: string]: AIModel[] | undefined;
}

// ==================== Helpers ====================

export function supportsLoRA(model: AIModel): boolean {
  return model.capabilities?.supports_lora === true;
}

export function getArchitecture(model: AIModel): string | undefined {
  return model.runware?.architecture;
}

export function isImageModel(model: AIModel): boolean {
  return model.type === 'image';
}

export function isVideoModel(model: AIModel): boolean {
  return model.type === 'video';
}

export function isChatModel(model: AIModel): boolean {
  return model.type === 'chat';
}

export function formatPrice(model: AIModel): string {
  const p = model.pricing;
  if (!p) return '';

  if (p.per_image) {
    const price = parseFloat(p.per_image);
    if (price > 0) return `$${price.toFixed(4)}/img`;
  }

  if (p.per_second) {
    const price = parseFloat(p.per_second);
    if (price > 0) return `$${price.toFixed(4)}/sec`;
  }

  if (p.per_generation) {
    const price = parseFloat(p.per_generation);
    if (price > 0) return `$${price.toFixed(2)}/gen`;
  }

  if (p.prompt) {
    const promptPrice = parseFloat(p.prompt);
    if (promptPrice > 0) {
      const per10k = promptPrice * 10_000;
      const isOnline = model.id.endsWith(':online');
      const wsPrice = isOnline && p.web_search ? parseFloat(p.web_search) : 0;
      const total = per10k + wsPrice;
      const label = isOnline ? '/10k+search' : '/10k tok';
      return `$${total.toFixed(4)}${label}`;
    }
  }

  return '';
}
