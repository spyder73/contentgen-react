import { CheckpointConfig, PipelineRun, PipelineTemplate } from '../../../api/structs';
import { AssetPoolItem } from '../assetPool';

export const getCheckpointType = (
  template: { checkpoints: CheckpointConfig[] },
  index: number
): CheckpointConfig['type'] | 'prompt' => template.checkpoints[index]?.type || 'prompt';

export const getFanInSources = (checkpoints: CheckpointConfig[], index: number): string[] => {
  const checkpoint = checkpoints[index];
  if (!checkpoint) return [];
  if ((checkpoint.type || 'prompt') !== 'connector') return [];

  const configuredSource = checkpoint.connector?.source_checkpoint_id;
  if (configuredSource) {
    const source = checkpoints.find((item) => item.id === configuredSource);
    if ((source?.type || 'prompt') === 'distributor') {
      return [configuredSource];
    }
  }

  for (let i = index - 1; i >= 0; i -= 1) {
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

const toCleanString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const inferProviderFromModel = (model: string): string => {
  if (!model) return '';
  if (model.includes(':')) return model.split(':')[0].trim();
  if (model.includes('/')) return model.split('/')[0].trim();
  return '';
};

export interface CheckpointModelContext {
  provider: string;
  model: string;
  source: 'checkpoint' | 'pipeline' | 'run' | 'unknown';
}

const normalizeGeneratorMediaType = (value: string): 'image' | 'video' | 'audio' | '' => {
  const normalized = toCleanString(value).toLowerCase();
  if (normalized === 'video' || normalized === 'ai_video') return 'video';
  if (normalized === 'audio' || normalized === 'music') return 'audio';
  if (normalized === 'image') return 'image';
  return '';
};

const getPipelineDefaultsForCheckpoint = (
  checkpoint: CheckpointConfig,
  template: PipelineTemplate
): { provider: string; model: string } => {
  const outputFormat = template.output_format;
  if (!outputFormat) return { provider: '', model: '' };

  const checkpointType = checkpoint.type || 'prompt';
  if (checkpointType === 'generator') {
    const mediaType = normalizeGeneratorMediaType(checkpoint.generator?.media_type || '');
    if (mediaType === 'image') {
      return {
        provider: toCleanString(outputFormat.image_provider),
        model: toCleanString(outputFormat.image_model),
      };
    }
    if (mediaType === 'video') {
      return {
        provider: toCleanString(outputFormat.video_provider),
        model: toCleanString(outputFormat.video_model),
      };
    }
    if (mediaType === 'audio') {
      return {
        provider: toCleanString(outputFormat.audio_provider),
        model: toCleanString(outputFormat.audio_model),
      };
    }
    return { provider: '', model: '' };
  }

  return { provider: '', model: '' };
};

const getCheckpointSelector = (
  checkpoint: CheckpointConfig
): { provider: string; model: string } => {
  const checkpointType = checkpoint.type || 'prompt';

  if (checkpointType === 'prompt') {
    return {
      provider: toCleanString(checkpoint.promptGate?.provider),
      model: toCleanString(checkpoint.promptGate?.model),
    };
  }

  if (checkpointType === 'distributor') {
    return {
      provider: toCleanString(checkpoint.distributor?.provider),
      model: toCleanString(checkpoint.distributor?.model),
    };
  }

  if (checkpointType === 'generator') {
    return {
      provider: toCleanString(checkpoint.generator?.provider),
      model: toCleanString(checkpoint.generator?.model),
    };
  }

  return { provider: '', model: '' };
};

export const getCheckpointModelContext = (
  checkpoint: CheckpointConfig,
  run: PipelineRun,
  template: PipelineTemplate
): CheckpointModelContext => {
  const checkpointSelector = getCheckpointSelector(checkpoint);
  const checkpointProvider = checkpointSelector.provider;
  const checkpointModel = checkpointSelector.model;
  const runProvider = toCleanString(run.provider);
  const runModel = toCleanString(run.model);
  const pipelineDefaults = getPipelineDefaultsForCheckpoint(checkpoint, template);
  const pipelineProvider = pipelineDefaults.provider;
  const pipelineModel = pipelineDefaults.model;

  if (checkpointModel) {
    return {
      provider:
        checkpointProvider ||
        inferProviderFromModel(checkpointModel) ||
        pipelineProvider ||
        runProvider,
      model: checkpointModel,
      source: 'checkpoint',
    };
  }

  if (pipelineModel) {
    return {
      provider:
        checkpointProvider ||
        inferProviderFromModel(pipelineModel) ||
        pipelineProvider ||
        runProvider,
      model: pipelineModel,
      source: 'pipeline',
    };
  }

  if (pipelineProvider) {
    return {
      provider: checkpointProvider || pipelineProvider || runProvider,
      model: '',
      source: 'pipeline',
    };
  }

  if (runModel) {
    return {
      provider: checkpointProvider || runProvider || inferProviderFromModel(runModel),
      model: runModel,
      source: 'run',
    };
  }

  if (runProvider || checkpointProvider) {
    return {
      provider: checkpointProvider || runProvider,
      model: '',
      source: checkpointProvider ? 'checkpoint' : 'run',
    };
  }

  return {
    provider: '',
    model: '',
    source: 'unknown',
  };
};
