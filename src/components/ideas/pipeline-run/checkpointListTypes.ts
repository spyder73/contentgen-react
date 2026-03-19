import { PipelineRun, PipelineTemplate } from '../../../api/structs';
import { CheckpointInjectionMode, MediaAttachment } from '../../../api/structs/pipeline';
import { AssetPoolItem, NormalizedCheckpointAssetRequirement, RequirementMatchDetail } from '../assetPool';

export interface CheckpointListProps {
  run: PipelineRun;
  template: PipelineTemplate;
  isTerminal: boolean;
  isPaused: boolean;
  checkpointRequirements: NormalizedCheckpointAssetRequirement[][];
  evaluateRequirementDetails: (
    index: number,
    attachments: PipelineRun['results'][number]['attachments'] | undefined
  ) => { satisfied: boolean; details: RequirementMatchDetail[] };
  reusablePoolAssets: AssetPoolItem[];
  onContinue: () => Promise<void> | void;
  onRegenerate: (checkpoint: number) => Promise<void> | void;
  onInjectPrompt: (
    checkpoint: number,
    text: string,
    options?: {
      autoRegenerate?: boolean;
      source?: string;
      mode?: CheckpointInjectionMode;
    }
  ) => Promise<void>;
  onAddAttachment: (
    checkpoint: number,
    attachment: Omit<MediaAttachment, 'id' | 'created_at'>
  ) => Promise<void>;
}
