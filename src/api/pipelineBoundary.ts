import {
  CheckpointConfig,
  CheckpointType,
  ConnectorConfig,
  DistributorConfig,
  GeneratorConfig,
  MediaAttachment,
  PipelineInputAttachment,
  PipelineOutputFormat,
  PipelineRun,
  PipelineTemplate,
  PromptCheckpointConfig,
} from './structs';
import { cleanString, isRecord, toNumberValue, toStringValue } from './typeHelpers';

const hasOwn = <T extends object>(value: T, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const normalizePositiveInteger = (value: unknown): number | undefined => {
  const parsed = toNumberValue(value);
  if (parsed === undefined || parsed <= 0) return undefined;
  return Math.floor(parsed);
};

const sanitizeSettingsMap = (value: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(value)) return undefined;

  const next: Record<string, unknown> = {};
  Object.entries(value).forEach(([rawKey, rawValue]) => {
    const key = toStringValue(rawKey).trim();
    if (!key || rawValue === undefined || rawValue === null) return;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) return;
      next[key] = trimmed;
      return;
    }
    next[key] = rawValue;
  });

  return Object.keys(next).length > 0 ? next : undefined;
};

const sanitizeInputMapping = (
  mapping: CheckpointConfig['input_mapping']
): CheckpointConfig['input_mapping'] => {
  const next: Record<string, string> = {};
  Object.entries(mapping || {}).forEach(([rawKey, rawValue]) => {
    const key = toStringValue(rawKey).trim();
    const value = toStringValue(rawValue).trim();
    if (!key || !value) return;
    next[key] = value;
  });
  return next;
};

const sanitizeRequiredAssets = (
  requiredAssets: CheckpointConfig['required_assets']
): CheckpointConfig['required_assets'] => {
  if (!Array.isArray(requiredAssets) || requiredAssets.length === 0) return undefined;

  const toCheckpointSource = (
    source?: string,
    checkpointId?: string
  ): { source?: string; checkpoint_id?: string } => {
    const cleanedSource = cleanString(source);
    const cleanedCheckpointId = cleanString(checkpointId);

    if (!cleanedSource) {
      return {
        source: undefined,
        checkpoint_id: cleanedCheckpointId,
      };
    }

    const normalizedSource = cleanedSource.toLowerCase();
    if (normalizedSource === 'checkpoint') {
      return {
        source: cleanedCheckpointId ? `checkpoint:${cleanedCheckpointId}` : cleanedSource,
        checkpoint_id: cleanedCheckpointId,
      };
    }

    if (normalizedSource.startsWith('checkpoint:')) {
      const sourceCheckpointId = cleanString(cleanedSource.slice('checkpoint:'.length));
      return {
        source: sourceCheckpointId ? `checkpoint:${sourceCheckpointId}` : cleanedSource,
        checkpoint_id: sourceCheckpointId,
      };
    }

    return {
      source: cleanedSource,
      checkpoint_id: cleanedCheckpointId,
    };
  };

  const sanitized = requiredAssets
    .map((asset) => {
      const key = cleanString(asset?.key);
      const type = cleanString(asset?.type);
      const { source, checkpoint_id: checkpointId } = toCheckpointSource(
        asset?.source,
        asset?.checkpoint_id
      );
      const mediaId = cleanString(asset?.media_id);

      if (!key && !type && !source && !checkpointId && !mediaId) {
        return null;
      }

      return {
        key,
        type,
        source,
        checkpoint_id: checkpointId,
        media_id: mediaId,
      };
    })
    .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));

  return sanitized.length > 0 ? sanitized : undefined;
};

const normalizeAttachment = (value: unknown, index: number): MediaAttachment | null => {
  if (!isRecord(value)) return null;

  const url = toStringValue(value.url ?? value.file_url ?? value.asset_url ?? value.uri);
  const id =
    toStringValue(value.id ?? value.attachment_id ?? value.asset_id) ||
    (url ? `attachment:${url}` : `attachment-${index}`);
  if (!id) return null;

  const size = toNumberValue(value.size ?? value.size_bytes ?? value.sizeBytes);
  const name = toStringValue(
    value.name ?? value.filename ?? value.file_name ?? value.title,
    `attachment-${index + 1}`
  );

  return {
    id,
    media_id: cleanString(value.media_id ?? value.mediaId),
    role: cleanString(value.role),
    scene_id: cleanString(value.scene_id ?? value.sceneId),
    frame_order: normalizePositiveInteger(value.frame_order ?? value.frameOrder),
    type: toStringValue(value.type ?? value.media_type ?? value.kind, 'unknown'),
    url,
    mime_type: toStringValue(
      value.mime_type ?? value.mimeType ?? value.content_type,
      'application/octet-stream'
    ),
    name,
    filename: cleanString(value.filename ?? value.file_name ?? value.fileName ?? name),
    created_at: toStringValue(value.created_at ?? value.createdAt, new Date(0).toISOString()),
    source: cleanString(value.source),
    size_bytes: size,
    size,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
    checkpoint_id: cleanString(value.checkpoint_id ?? value.checkpointId),
    checkpoint_index: toNumberValue(value.checkpoint_index ?? value.checkpointIndex),
    source_checkpoint_id: cleanString(value.source_checkpoint_id ?? value.sourceCheckpointId),
    source_run_id: cleanString(value.source_run_id ?? value.sourceRunId),
    generated_from_checkpoint_id: cleanString(
      value.generated_from_checkpoint_id ?? value.generatedFromCheckpointId
    ),
    generated_from_field: cleanString(value.generated_from_field ?? value.generatedFromField),
  };
};

const normalizeAttachmentList = (value: unknown): MediaAttachment[] | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) return [];

  return value
    .map((attachment, index) => normalizeAttachment(attachment, index))
    .filter((attachment): attachment is MediaAttachment => Boolean(attachment));
};

const normalizeSeedImageMode = (generator: Record<string, unknown>): GeneratorConfig['mode'] => {
  const explicitMode = cleanString(generator.mode);
  if (explicitMode) return explicitMode;

  const role = toStringValue(generator.role).trim().toLowerCase();
  const legacySeedRoles = new Set([
    'reference_image',
    'seed_image',
    'character_seed',
    'reference',
  ]);
  return legacySeedRoles.has(role) ? 'image_to_image' : 'text_to_image';
};

const normalizePromptGate = (
  value: unknown,
  fallbackProvider?: string,
  fallbackModel?: string
): PromptCheckpointConfig | undefined => {
  const source = isRecord(value) ? value : {};
  const provider = cleanString(source.provider ?? fallbackProvider);
  const model = cleanString(source.model ?? fallbackModel);
  if (!provider && !model) return undefined;
  return { provider, model };
};

const normalizeDistributor = (
  value: unknown,
  fallbackProvider?: string,
  fallbackModel?: string
): DistributorConfig => {
  const source = isRecord(value) ? value : {};
  return {
    provider: cleanString(source.provider ?? fallbackProvider),
    model: cleanString(source.model ?? fallbackModel),
    delimiter:
      toStringValue(source.delimiter).trim() || 'json_objects',
    max_children: normalizePositiveInteger(source.max_children) ?? 1,
    prompt_decorator: cleanString(source.prompt_decorator ?? source.promptDecorator),
  };
};

const normalizeConnector = (value: unknown): ConnectorConfig => {
  const source = isRecord(value) ? value : {};
  return {
    strategy: 'collect_all',
    source_checkpoint_id: cleanString(source.source_checkpoint_id ?? source.sourceCheckpointId),
  };
};

const normalizeGenerator = (
  value: unknown,
  fallbackProvider?: string,
  fallbackModel?: string
): GeneratorConfig => {
  const source = isRecord(value) ? value : {};
  return {
    media_type: toStringValue(source.media_type).trim() || 'image',
    role: cleanString(source.role),
    mode: normalizeSeedImageMode(source),
    provider: cleanString(source.provider ?? source.generator ?? fallbackProvider),
    model: cleanString(source.model ?? fallbackModel),
  };
};

const normalizeCheckpointConfig = (checkpoint: unknown): CheckpointConfig => {
  const source = isRecord(checkpoint) ? checkpoint : {};
  const rawType = cleanString(source.type);
  const type: CheckpointType =
    rawType === 'distributor' ||
    rawType === 'connector' ||
    rawType === 'generator' ||
    rawType === 'prompt'
      ? rawType
      : 'prompt';
  const legacyProvider = cleanString(source.provider);
  const legacyModel = cleanString(source.model);

  const normalized: CheckpointConfig = {
    id: toStringValue(source.id).trim(),
    name: cleanString(source.name) || toStringValue(source.id).trim() || 'Checkpoint',
    type,
    prompt_template_id: toStringValue(source.prompt_template_id ?? source.promptTemplateId).trim(),
    input_mapping: sanitizeInputMapping(
      isRecord(source.input_mapping) ? (source.input_mapping as Record<string, string>) : {}
    ),
    requires_confirm: Boolean(source.requires_confirm ?? source.requiresConfirm),
    allow_regenerate: Boolean(source.allow_regenerate ?? source.allowRegenerate),
    allow_attachments: Boolean(source.allow_attachments ?? source.allowAttachments),
    output_spec: sanitizeSettingsMap(source.output_spec ?? source.outputSpec),
    required_assets: sanitizeRequiredAssets(
      Array.isArray(source.required_assets)
        ? (source.required_assets as CheckpointConfig['required_assets'])
        : undefined
    ),
  };

  if (type === 'prompt') {
    normalized.promptGate = normalizePromptGate(source.promptGate, legacyProvider, legacyModel);
  }

  if (type === 'distributor') {
    normalized.distributor = normalizeDistributor(source.distributor, legacyProvider, legacyModel);
  }

  if (type === 'connector') {
    normalized.connector = normalizeConnector(source.connector);
  }

  if (type === 'generator') {
    normalized.generator = normalizeGenerator(source.generator, legacyProvider, legacyModel);
  }

  return normalized;
};

const normalizeCheckpointList = (value: unknown): CheckpointConfig[] => {
  if (!Array.isArray(value)) return [];
  return value.map((checkpoint) => normalizeCheckpointConfig(checkpoint));
};

export const normalizePipelineOutputFormat = (
  value: unknown
): PipelineOutputFormat | undefined => {
  if (!isRecord(value)) return undefined;

  const next: PipelineOutputFormat = {
    image_provider: cleanString(value.image_provider ?? value.imageProvider),
    image_model: cleanString(value.image_model ?? value.imageModel),
    image_settings: sanitizeSettingsMap(value.image_settings ?? value.imageSettings),
    video_provider: cleanString(value.video_provider ?? value.videoProvider),
    video_model: cleanString(value.video_model ?? value.videoModel),
    video_settings: sanitizeSettingsMap(value.video_settings ?? value.videoSettings),
    audio_provider: cleanString(value.audio_provider ?? value.audioProvider),
    audio_model: cleanString(value.audio_model ?? value.audioModel),
    audio_settings: sanitizeSettingsMap(value.audio_settings ?? value.audioSettings),
  };

  return Object.values(next).some((entry) => entry !== undefined) ? next : undefined;
};

export const serializePipelineOutputFormat = (
  value?: PipelineOutputFormat
): PipelineOutputFormat | undefined => normalizePipelineOutputFormat(value);

export const serializeCheckpointConfig = (checkpoint: CheckpointConfig): CheckpointConfig => {
  const normalized = normalizeCheckpointConfig(checkpoint);

  if (normalized.type === 'prompt' && normalized.promptGate) {
    normalized.promptGate = normalizePromptGate(normalized.promptGate);
  }

  if (normalized.type === 'distributor' && normalized.distributor) {
    normalized.distributor = normalizeDistributor(normalized.distributor);
  }

  if (normalized.type === 'connector' && normalized.connector) {
    normalized.connector = normalizeConnector(normalized.connector);
  }

  if (normalized.type === 'generator' && normalized.generator) {
    normalized.generator = normalizeGenerator(normalized.generator);
  }

  return normalized;
};

export const serializeCheckpointList = (checkpoints: CheckpointConfig[]): CheckpointConfig[] =>
  checkpoints.map((checkpoint) => serializeCheckpointConfig(checkpoint));

export const normalizePipelineTemplate = (template: unknown): PipelineTemplate => {
  const source = isRecord(template) ? template : {};
  return {
    ...(template as PipelineTemplate),
    id: toStringValue(source.id),
    name: toStringValue(source.name),
    description: toStringValue(source.description),
    output_format: normalizePipelineOutputFormat(source.output_format ?? source.outputFormat),
    checkpoints: normalizeCheckpointList(source.checkpoints),
    version: toNumberValue(source.version) ?? 1,
    created_at: toStringValue(source.created_at ?? source.createdAt),
    updated_at: toStringValue(source.updated_at ?? source.updatedAt),
  };
};

export const normalizePipelineRun = (run: unknown): PipelineRun => {
  if (!isRecord(run)) return run as PipelineRun;

  const normalized: PipelineRun = { ...(run as unknown as PipelineRun) };

  if (hasOwn(run, 'initial_attachments')) {
    normalized.initial_attachments = normalizeAttachmentList(run.initial_attachments);
  }

  if (Array.isArray(run.results)) {
    normalized.results = run.results.map((result) => {
      if (!isRecord(result)) return result as PipelineRun['results'][number];
      if (!hasOwn(result, 'attachments')) {
        return result as unknown as PipelineRun['results'][number];
      }

      return {
        ...result,
        attachments: normalizeAttachmentList(result.attachments),
      } as PipelineRun['results'][number];
    });
  }

  return normalized;
};

export const normalizeInputAttachment = (
  value: PipelineInputAttachment
): PipelineInputAttachment | null => {
  const type = toStringValue(value.type).trim();
  if (!type) return null;

  const normalized: PipelineInputAttachment = {
    type,
    role: cleanString(value.role),
    scene_id: cleanString(value.scene_id),
    frame_order: normalizePositiveInteger(value.frame_order),
  };

  const assignString = (
    key:
      | 'source'
      | 'state'
      | 'url'
      | 'name'
      | 'filename'
      | 'mime_type'
      | 'media_id'
      | 'checkpoint_id'
      | 'source_checkpoint_id'
      | 'source_run_id'
      | 'generated_from_checkpoint_id'
      | 'generated_from_field',
    raw: unknown
  ) => {
    const next = cleanString(raw);
    if (next) {
      normalized[key] = next;
    }
  };

  assignString('source', value.source);
  assignString('state', value.state);
  assignString('url', value.url);
  assignString('name', value.name);
  assignString('filename', value.filename ?? value.name);
  assignString('mime_type', value.mime_type);
  assignString('media_id', value.media_id);
  assignString('checkpoint_id', value.checkpoint_id);
  assignString('source_checkpoint_id', value.source_checkpoint_id);
  assignString('source_run_id', value.source_run_id);
  assignString('generated_from_checkpoint_id', value.generated_from_checkpoint_id);
  assignString('generated_from_field', value.generated_from_field);

  const size = toNumberValue(value.size_bytes ?? value.size);
  if (size !== undefined) {
    normalized.size_bytes = size;
    normalized.size = size;
  }

  const checkpointIndex = toNumberValue(value.checkpoint_index);
  if (checkpointIndex !== undefined) {
    normalized.checkpoint_index = Math.max(0, Math.floor(checkpointIndex));
  }

  if (isRecord(value.metadata)) {
    normalized.metadata = value.metadata;
  }

  return normalized;
};

export const normalizeInputAttachments = (
  value?: PipelineInputAttachment[]
): PipelineInputAttachment[] | undefined => {
  if (!value?.length) return undefined;

  const normalized = value
    .map((attachment) => normalizeInputAttachment(attachment))
    .filter((attachment): attachment is PipelineInputAttachment => Boolean(attachment));

  return normalized.length > 0 ? normalized : undefined;
};
