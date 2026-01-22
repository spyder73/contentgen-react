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

// ==================== Provider Extensions ====================

export interface OpenRouterModelExt {
  context_length?: number;
  modality?: string;
}

export interface RunwareModelExt {
  air: string;
  architecture?: string;  // "flux", "sd15", "sdxl"
  category?: string;      // "base", "lora", "embedding"
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
  
  // Provider-specific extensions
  openrouter?: OpenRouterModelExt;
  runware?: RunwareModelExt;
}

// ==================== API Response ====================

export interface ModelsResponse {
  recommended: AIModel[];
  openrouter?: AIModel[];
  runware?: AIModel[];
}

// ==================== Helpers ====================

export function supportsLoRA(model: AIModel): boolean {
  return model.capabilities?.supports_lora ?? false;
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
  if (model.pricing?.completion) {
    const price = parseFloat(model.pricing.completion);
    if (price === 0) return 'Free';
    return `$${price.toFixed(6)}/tok`;
  }
  return 'Free';
}