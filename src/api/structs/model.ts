// ==================== Base Model ====================

export type ModelType = 'chat' | 'image' | 'video' | 'audio';

export interface ModelPricing {
  prompt?: string;
  completion?: string;
  per_image?: string;
  per_second?: string;
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
  if (model.pricing?.per_image) {
    const price = parseFloat(model.pricing.per_image);
    if (price === 0) return 'Free';
    return `$${price.toFixed(4)}/img`;
  }
  if (model.pricing?.per_second) {
    const price = parseFloat(model.pricing.per_second);
    if (price === 0) return 'Free';
    return `$${price.toFixed(4)}/sec`;
  }
  if (model.pricing?.completion) {
    const price = parseFloat(model.pricing.completion);
    if (price === 0) return 'Free';
    return `$${price.toFixed(6)}/tok`;
  }
  return 'Free';
}
