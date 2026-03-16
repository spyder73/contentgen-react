import { CheckpointConfig, MediaAttachment, PipelineInputAttachment } from '../../../api/structs';
import { AvailableMediaItem } from '../../../api/clip';

export type AssetKind = 'music' | 'image' | 'video' | 'audio' | 'file' | 'unknown';
export type AssetSource = 'media' | 'generated' | 'url' | 'file' | 'unknown';

export interface AssetPoolItem {
  id: string;
  media_id?: string;
  type: string;
  kind: AssetKind;
  source: AssetSource;
  name: string;
  url?: string;
  mime_type?: string;
  size_bytes?: number;
  run_id?: string;
  checkpoint_id?: string;
  checkpoint_name?: string;
  checkpoint_index?: number;
  source_checkpoint_id?: string;
  generated_from_checkpoint_id?: string;
  metadata?: Record<string, unknown>;
}

export type RequirementSource = 'any' | string;

export interface NormalizedCheckpointAssetRequirement {
  id: string;
  label: string;
  kind: 'any' | AssetKind;
  source: RequirementSource;
  min_count: number;
  max_count?: number;
}

export interface RequirementMatchDetail {
  requirement: NormalizedCheckpointAssetRequirement;
  matched_count: number;
  missing_count: number;
  satisfied: boolean;
}

export interface AttachmentBinding {
  checkpointId?: string;
  checkpointIndex?: number;
}

export type CheckpointRequirementSource = Pick<CheckpointConfig, 'required_assets'> &
  Record<string, unknown>;

export type PipelineAttachmentSource = Pick<
  PipelineInputAttachment,
  'type' | 'source' | 'state' | 'url' | 'name' | 'filename' | 'mime_type' | 'size_bytes' | 'size' | 'media_id'
> &
  Record<string, unknown>;

export type PipelineMediaAttachment = MediaAttachment;
export type LibraryMediaItem = AvailableMediaItem;
