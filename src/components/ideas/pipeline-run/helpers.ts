import { CheckpointConfig, PipelineRun } from '../../../api/structs';
import { CheckpointInjectionMode, MediaAttachment } from '../../../api/structs/pipeline';
import { AssetPoolItem } from '../assetPool';

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export const formatMetadataValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return '';

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

export const toActionableErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const record = error as
    | {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      }
    | undefined;
  return (
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.message ||
    fallbackMessage
  );
};

export const toAttachmentRequest = (asset: AssetPoolItem): Omit<MediaAttachment, 'id' | 'created_at'> => ({
  media_id: asset.media_id,
  type: asset.type || asset.kind || 'file',
  url: asset.url || '',
  mime_type: asset.mime_type || DEFAULT_MIME_TYPE,
  name: asset.name || asset.media_id || asset.id,
  filename: asset.name || asset.media_id || asset.id,
  size_bytes: asset.size_bytes,
  metadata: {
    ...(asset.metadata || {}),
    source: asset.source,
    source_run_id: asset.run_id,
    source_checkpoint_id: asset.checkpoint_id,
    source_checkpoint_index: asset.checkpoint_index,
    reused_from_asset_pool: true,
  },
});

export const modeLabel = (mode: CheckpointInjectionMode): string =>
  mode === 'with_prior_output_context' ? 'Guidance + prior output context' : 'Guidance only';

export const formatOutput = (output: string): string => {
  try {
    const parsed = JSON.parse(output);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return output;
  }
};

export const getCheckpointType = (template: { checkpoints: CheckpointConfig[] }, index: number): 'prompt' | 'distributor' | 'connector' => {
  return template.checkpoints[index]?.type || 'prompt';
};

export const getFanInSources = (checkpoints: CheckpointConfig[], index: number): string[] => {
  const checkpoint = checkpoints[index];
  if (!checkpoint) return [];

  if ((checkpoint.type || 'prompt') !== 'connector') {
    return [];
  }

  const configuredSource = checkpoint.connector?.source_checkpoint_id;
  if (configuredSource) {
    const source = checkpoints.find((item) => item.id === configuredSource);
    if ((source?.type || 'prompt') === 'distributor') {
      return [configuredSource];
    }
  }

  for (let i = index - 1; i >= 0; i--) {
    const candidate = checkpoints[i];
    if ((candidate?.type || 'prompt') === 'distributor') {
      return [candidate.id];
    }
  }
  return [];
};

export const getReusableAssetsForCheckpoint = (
  reusablePoolAssets: AssetPoolItem[],
  checkpointIndex: number
): AssetPoolItem[] =>
  reusablePoolAssets.filter((asset) => {
    if (asset.checkpoint_index === undefined || asset.checkpoint_index === null) return true;
    return asset.checkpoint_index < checkpointIndex;
  });

export const getRunProgressPercent = (run: PipelineRun, checkpointCount: number): number => {
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const total = checkpointCount || 1;
  if (isTerminal) return 100;
  return Math.round((run.current_checkpoint / total) * 100);
};
