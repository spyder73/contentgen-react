export interface ModelArchitecture {
  modality?: string;
  input_modalities?: string[];
  output_modalities?: string[];
}

export interface ModelPricing {
  prompt: string;
  completion: string;
  image?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: ModelPricing;
  architecture?: ModelArchitecture;
}

export interface ModelsResponse {
  recommended: AIModel[];
  all?: AIModel[];
}