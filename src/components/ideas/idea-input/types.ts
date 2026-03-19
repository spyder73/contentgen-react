import { AvailableMediaItem } from '../../../api/clip';
import { CheckpointConfig } from '../../../api/structs';
import {
  AssetPoolItem,
  NormalizedCheckpointAssetRequirement,
  RequirementMatchDetail,
} from '../assetPool';

export type AttachmentType = 'music' | 'image' | 'video' | 'audio' | 'file';
export type FileAttachmentMode = AttachmentType | 'auto';

export const ATTACHMENT_TYPE_OPTIONS: Array<{ value: AttachmentType; label: string }> = [
  { value: 'music', label: 'Music' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'File' },
];

export interface TemplateOption {
  value: string;
  label: string;
}

export interface MusicOption {
  value: string;
  label: string;
}

export interface CheckpointBindingRow {
  checkpoint: CheckpointConfig;
  checkpointIndex: number;
  requirements: NormalizedCheckpointAssetRequirement[];
  boundAssets: AssetPoolItem[];
  requirementSummary: {
    satisfied: boolean;
    details: RequirementMatchDetail[];
  };
}

export interface MusicSelectionModel {
  value: string;
  options: MusicOption[];
  selected: AvailableMediaItem | null;
}
