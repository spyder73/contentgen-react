// ==================== Pipeline Run Types ====================

import { MediaOutputSpec } from './media-spec';

export type PipelineRunStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type CheckpointStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'awaiting_asset'
  | 'awaiting_confirm'
  | 'skipped';

export type CheckpointType = 'prompt' | 'distributor' | 'connector' | 'generator';
export type CheckpointInjectionMode = 'guidance_only' | 'with_prior_output_context';

export interface CostProviderTotal {
  total_cost?: number;
  run_cost?: number;
  per_clip_cost?: number;
  clip_count?: number;
  currency?: string;
  estimated?: boolean;
  [key: string]: unknown;
}

export interface CostSummary {
  estimated?: boolean;
  currency?: string;
  total_cost?: number;
  providers?: Record<string, CostProviderTotal>;
  per_run?: Record<string, CostProviderTotal>;
  per_clip?: Record<string, CostProviderTotal>;
  clips?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MediaAttachment {
  id: string;
  media_id?: string;
  role?: string;
  scene_id?: string;
  frame_order?: number;
  type: string;
  url: string;
  mime_type: string;
  name: string;
  filename?: string;
  created_at: string;
  source?: string;
  size_bytes?: number;
  size?: number;
  metadata?: Record<string, unknown>;
  checkpoint_id?: string;
  checkpoint_index?: number;
  source_checkpoint_id?: string;
  source_run_id?: string;
  generated_from_checkpoint_id?: string;
  generated_from_field?: string;
}

export interface PipelineInputAttachment {
  type: string;
  role?: string;
  scene_id?: string;
  frame_order?: number;
  source?: string;
  state?: string;
  url?: string;
  name?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  size?: number;
  media_id?: string;
  metadata?: Record<string, unknown>;
  checkpoint_id?: string;
  checkpoint_index?: number;
  source_checkpoint_id?: string;
  source_run_id?: string;
  generated_from_checkpoint_id?: string;
  generated_from_field?: string;
}

export interface CheckpointResult {
  checkpoint_id: string;
  status: CheckpointStatus;
  input: string;
  output: string;
  error?: string;
  attachments?: MediaAttachment[];
  started_at?: string;
  completed_at?: string;
  regenerate_count: number;
  child_pipeline_ids?: string[];
}

export interface PipelineRun {
  id: string;
  pipeline_template_id: string;
  parent_run_id?: string;
  initial_input: string;
  initial_attachments?: MediaAttachment[];
  current_checkpoint: number;
  status: PipelineRunStatus;
  results: CheckpointResult[];
  auto_mode: boolean;
  music_media_id?: string | null;
  provider?: string;
  model?: string;
  cost?: Record<string, unknown>;
  cost_summary?: CostSummary | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==================== Pipeline Template Types ====================

export interface InputMapping {
  [placeholder: string]: string;
}

export interface PromptCheckpointConfig {
  provider?: string;
  model?: string;
}

export interface DistributorConfig {
  provider?: string;
  model?: string;
  delimiter: 'newline' | 'json_array' | 'json_objects' | string;
  max_children: number;
  prompt_decorator?: string;
}

export type ConnectorStrategy = 'collect_all';

export interface ConnectorConfig {
  strategy: ConnectorStrategy;
  source_checkpoint_id?: string;
}

export interface GeneratorConfig {
  media_type: string;
  role?: string;
  mode?: 'text_to_image' | 'image_to_image' | string;
  provider?: string;
  model?: string;
}

export interface CheckpointRequiredAsset {
  key?: string;
  type?: string;
  source?: string;
  checkpoint_id?: string;
  media_id?: string;
}

export interface CheckpointConfig {
  id: string;
  name: string;
  type?: CheckpointType;
  prompt_template_id: string;
  input_mapping: InputMapping;
  requires_confirm: boolean;
  allow_regenerate: boolean;
  allow_attachments: boolean;
  output_spec?: Partial<MediaOutputSpec>;
  promptGate?: PromptCheckpointConfig;
  distributor?: DistributorConfig;
  connector?: ConnectorConfig;
  generator?: GeneratorConfig;
  required_assets?: CheckpointRequiredAsset[];
}

export interface PipelineOutputFormat {
  image_provider?: string;
  image_model?: string;
  video_provider?: string;
  video_model?: string;
  audio_provider?: string;
  audio_model?: string;
  image_settings?: Partial<MediaOutputSpec>;
  video_settings?: Partial<MediaOutputSpec>;
  audio_settings?: Partial<MediaOutputSpec>;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  output_format?: PipelineOutputFormat;
  checkpoints: CheckpointConfig[];
  version: number;
  created_at: string;
  updated_at: string;
}

// ==================== Prompt Template Types ====================

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

// ==================== WebSocket Event Types ====================

export type PipelineEventType =
  | 'PipelineStarted'
  | 'CheckpointStarted'
  | 'CheckpointCompleted'
  | 'CheckpointFailed'
  | 'PipelinePaused'
  | 'PipelineCompleted'
  | 'PipelineCancelled'
  | 'DistributorCompleted';

export interface DistributorCompletedEvent {
  event: 'DistributorCompleted';
  data: {
    run_id: string;
    child_count: number;
    outputs: string[];
  };
}

export interface PipelineStartedEvent {
  event: 'PipelineStarted';
  data: PipelineRun;
}

export interface CheckpointStartedEvent {
  event: 'CheckpointStarted';
  data: {
    run_id: string;
    checkpoint_index: number;
    checkpoint_id: string;
    checkpoint_name: string;
    checkpoint_type?: CheckpointType;
  };
}

export interface CheckpointCompletedEvent {
  event: 'CheckpointCompleted';
  data: {
    run_id: string;
    checkpoint_index: number;
    checkpoint_id: string;
    checkpoint_name: string;
    output: string;
  };
}

export interface CheckpointFailedEvent {
  event: 'CheckpointFailed';
  data: {
    run_id: string;
    checkpoint_index: number;
    error: string;
  };
}

export interface PipelinePausedEvent {
  event: 'PipelinePaused';
  data: {
    run_id: string;
    checkpoint_index: number;
    checkpoint_name: string;
    awaiting_confirm: boolean;
  };
}

export interface PipelineCompletedEvent {
  event: 'PipelineCompleted';
  data: {
    run_id: string;
    final_output: string;
  };
}

export interface PipelineCancelledEvent {
  event: 'PipelineCancelled';
  data: {
    run_id: string;
  };
}

export type PipelineEvent =
  | PipelineStartedEvent
  | CheckpointStartedEvent
  | CheckpointCompletedEvent
  | CheckpointFailedEvent
  | PipelinePausedEvent
  | PipelineCompletedEvent
  | PipelineCancelledEvent
  | DistributorCompletedEvent;
