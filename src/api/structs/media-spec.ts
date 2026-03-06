export interface LoraSpec {
  model: string;
  weight?: number;
}

export interface FrameImageSpec {
  inputImage: string;
  frame: 'first' | 'last' | string;
}

export interface ReferenceImageSpec {
  inputImage: string;
  weight?: number;
  type?: string;
}

export interface MediaOutputSpec {
  provider: string;
  model: string;

  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  steps?: number;
  cfg_scale?: number;

  lora?: LoraSpec[];
  frameImages?: FrameImageSpec[];
  referenceImages?: ReferenceImageSpec[];

  [key: string]: unknown;
}

export interface MediaProfile {
  image?: MediaOutputSpec;
  video?: MediaOutputSpec;
  audio?: MediaOutputSpec;
}

export interface MediaPrompt {
  prompt: string;
  outputSpec?: MediaOutputSpec;
  [key: string]: unknown;
}