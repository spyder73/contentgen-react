// ==================== Pipeline Run Types ====================

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

export type CheckpointType = 'prompt' | 'distributor';

export interface MediaAttachment {
  id: string;
  type: string;
  url: string;
  mime_type: string;
  name: string;
  created_at: string;
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
  child_pipeline_ids?: string[]; // For distributor checkpoints
}

export interface PipelineRun {
  id: string;
  pipeline_template_id: string;
  parent_run_id?: string; // For child pipelines
  initial_input: string;
  initial_attachments?: MediaAttachment[];
  current_checkpoint: number;
  status: PipelineRunStatus;
  results: CheckpointResult[];
  auto_mode: boolean;
  provider?: string;
  model?: string;
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

export interface CheckpointConfig {
  id: string;
  name: string;
  type?: CheckpointType; // 'prompt' | 'distributor', defaults to 'prompt'
  prompt_template_id: string;
  input_mapping: InputMapping;
  requires_confirm: boolean;
  allow_regenerate: boolean;
  allow_attachments: boolean;
  provider?: string;
  model?: string;
  distributor?: DistributorConfig; // Only for type='distributor'
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
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