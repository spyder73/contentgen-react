import {
  CheckpointConfig,
  CheckpointType,
  GeneratorConfig,
  PipelineOutputFormat,
} from '../../api/structs';

// ── Primitives ──────────────────────────────────────────

export const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const checkpointType = (c: CheckpointConfig): CheckpointType =>
  c.type || 'prompt';

// ── Generator helpers ───────────────────────────────────

export const normalizeGeneratorMediaType = (
  value: string
): 'image' | 'video' | 'audio' => {
  const normalized = toStringValue(value).toLowerCase();
  if (normalized === 'video' || normalized === 'ai_video') return 'video';
  if (normalized === 'audio' || normalized === 'music') return 'audio';
  return 'image';
};

export type GeneratorImageMode = 'image_to_image' | 'text_to_image';

export const getGeneratorImageMode = (
  value?: string
): GeneratorImageMode =>
  toStringValue(value).toLowerCase() === 'image_to_image'
    ? 'image_to_image'
    : 'text_to_image';

// ── Default configs ─────────────────────────────────────

export const DEFAULT_DISTRIBUTOR_CONFIG = {
  provider: '',
  model: '',
  delimiter: 'newline' as const,
  max_children: 8,
};

export const DEFAULT_CONNECTOR_CONFIG = {
  strategy: 'collect_all' as const,
};

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  media_type: 'image' as const,
  role: 'reference_frame',
  mode: 'text_to_image',
  provider: '',
  model: '',
};

export const DEFAULT_OUTPUT_FORMAT: PipelineOutputFormat = {
  image_provider: '',
  image_model: '',
  video_provider: '',
  video_model: '',
  audio_provider: '',
  audio_model: '',
};

// ── Checkpoint graph queries ────────────────────────────

export const getPreviousDistributors = (
  checkpoints: CheckpointConfig[],
  currentId: string
): CheckpointConfig[] => {
  const idx = checkpoints.findIndex((c) => c.id === currentId);
  if (idx <= 0) return [];
  return checkpoints
    .slice(0, idx)
    .filter((c) => checkpointType(c) === 'distributor');
};

export const pipelineRequiresSeedImageModel = (
  checkpoints: CheckpointConfig[]
): boolean =>
  checkpoints.some((c) => {
    if (checkpointType(c) !== 'generator') return false;
    const media = normalizeGeneratorMediaType(c.generator?.media_type || '');
    if (media !== 'image') return false;
    return getGeneratorImageMode(c.generator?.mode) === 'image_to_image';
  });

// ── Checkpoint display resolution ───────────────────────

export interface ResolvedCheckpointDisplay {
  checkpoint: CheckpointConfig;
  inputSources: string[];
  connectorSources: string[];
  requiredAssetCount: number;
}

export const resolveCheckpointDisplay = (
  checkpoints: CheckpointConfig[],
  index: number
): ResolvedCheckpointDisplay => {
  const checkpoint = checkpoints[index];
  const distributorById = new Map(
    checkpoints
      .filter((c) => checkpointType(c) === 'distributor')
      .map((c) => [c.id, c])
  );

  const inputSources = Object.entries(checkpoint.input_mapping || {}).map(
    ([key, value]) => {
      if (value === 'initial_input') return `${key}: user input`;
      if (value.startsWith('checkpoint:')) {
        const sourceId = value.replace('checkpoint:', '');
        return distributorById.has(sourceId)
          ? `${key}: ${sourceId} (distributor output)`
          : `${key}: ${sourceId}`;
      }
      return `${key}: ${value}`;
    }
  );

  const connectorSources: string[] = [];
  if (checkpointType(checkpoint) === 'connector') {
    const configuredSource = checkpoint.connector?.source_checkpoint_id;
    if (configuredSource && distributorById.has(configuredSource)) {
      connectorSources.push(configuredSource);
    } else {
      const distributors = getPreviousDistributors(checkpoints, checkpoint.id);
      if (distributors.length > 0) {
        connectorSources.push(distributors[distributors.length - 1].id);
      }
    }
  }

  const requiredAssetCount = Array.isArray(checkpoint.required_assets)
    ? checkpoint.required_assets.length
    : 0;

  return { checkpoint, inputSources, connectorSources, requiredAssetCount };
};

// ── Error formatting ────────────────────────────────────

export const buildSaveErrorMessage = (error: unknown): string => {
  const fallback =
    'Failed to save pipeline. Please retry or review checkpoint settings.';

  if (!isRecord(error)) {
    return error instanceof Error && error.message
      ? `Failed to save pipeline: ${error.message}`
      : fallback;
  }

  const response = isRecord(error.response) ? error.response : null;
  const data = response && isRecord(response.data) ? response.data : null;
  const detail = toStringValue(
    data?.error ?? data?.message ?? data?.detail ?? data?.details
  );

  if (detail) return `Failed to save pipeline: ${detail}`;

  const message = toStringValue(error.message);
  if (message) return `Failed to save pipeline: ${message}`;

  return fallback;
};
