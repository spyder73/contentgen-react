// ==================== Pipeline Run Types ====================

import { MediaProfile } from './media-spec';

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
  | 'awaiting_confirm'
  | 'skipped';

export type CheckpointType = 'prompt' | 'distributor' | 'connector' | 'chain';
export type CheckpointInjectionMode = 'guidance_only' | 'with_prior_output_context';

export interface CostSummaryProvider {
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
  runware?: CostSummaryProvider;
  openrouter?: CostSummaryProvider;
  providers?: Record<string, CostSummaryProvider>;
  per_run?: Record<string, CostSummaryProvider>;
  per_clip?: Record<string, CostSummaryProvider>;
  clips?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MediaAttachment {
  id: string;
  media_id?: string;
  type: string;
  url: string;
  mime_type: string;
  name: string;
  filename?: string;
  created_at: string;
  source?: string;
  size_bytes?: number;
  metadata?: Record<string, unknown>;
  checkpoint_id?: string;
  checkpoint_index?: number;
  source_checkpoint_id?: string;
  source_run_id?: string;
}

export interface PipelineInputAttachment {
  type: string;
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
  media_profile?: MediaProfile;
  music_media_id?: string | null;
  provider?: string;
  model?: string;
  cost_summary?: CostSummary | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==================== Pipeline Template Types ====================

export interface InputMapping {
  [placeholder: string]: string;
}

export interface DistributorConfig {
  delimiter: 'newline' | 'json_array' | 'json_objects' | string;
  max_children: number;
}

export type ConnectorStrategy = 'first' | 'longest';

export interface ConnectorConfig {
  strategy: ConnectorStrategy;
  source_checkpoint_id?: string;
}

export interface ChainConfig {
  sub_checkpoints?:
    | Array<{ id?: string; name?: string } | string>
    | number;
  checkpoints?:
    | Array<{ id?: string; name?: string } | string>
    | number;
  count?: number;
}

export interface CheckpointRequiredAsset {
  id?: string;
  label?: string;
  kind?: string;
  source?: string;
  min_count?: number;
  max_count?: number;
  required?: boolean;
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
  provider?: string;
  model?: string;
  distributor?: DistributorConfig;
  connector?: ConnectorConfig;
  chain?: ChainConfig;
  required_assets?: CheckpointRequiredAsset[];
  required_attachments?: CheckpointRequiredAsset[];
  attachment_requirements?: CheckpointRequiredAsset[];
}

export interface PipelineOutputFormat {
  enabled: boolean;
  aspect_ratio?: string;
  image_long_edge?: number;
  video_long_edge?: number;
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
