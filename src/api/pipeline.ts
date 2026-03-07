import axios from 'axios';
import { BASE_URL } from './helpers';
import {
  PipelineRun,
  PipelineTemplate,
  PromptTemplate,
  MediaAttachment,
  PipelineInputAttachment,
  CheckpointConfig,
  PipelineOutputFormat,
} from './structs';
import { MediaProfile } from './structs/media-spec';

// ==================== Request Types ====================

interface StartPipelineRequest {
  template_id: string;
  initial_input: string;
  auto_mode?: boolean;
  initial_attachments?: PipelineInputAttachment[];
  music_media_id?: string | null;
  media_profile?: MediaProfile;
  provider?: string;
  model?: string;
}

interface RegenerateCheckpointRequest {
  checkpoint_index: number;
}

interface AddAttachmentRequest {
  checkpoint_index: number;
  attachment: Omit<MediaAttachment, 'id' | 'created_at'>;
}

interface InjectCheckpointPromptRequest {
  text: string;
  auto_regenerate?: boolean;
  source?: string;
}

interface InjectCheckpointPromptResponse {
  status: string;
  checkpoint_index: number;
  injection_count?: number;
  regenerated?: boolean;
}

interface CreatePipelineTemplateRequest {
  id: string;
  name: string;
  description?: string;
  output_format?: PipelineOutputFormat;
  checkpoints: CheckpointConfig[];
}

interface UpdatePipelineTemplateRequest {
  name?: string;
  description?: string;
  output_format?: PipelineOutputFormat;
  checkpoints?: CheckpointConfig[];
}

interface CreatePromptTemplateRequest {
  id: string;
  name: string;
  description?: string;
  content: string;
}

interface UpdatePromptTemplateRequest {
  name?: string;
  description?: string;
  content?: string;
}

interface PipelineOutputResponse {
  status: string;
  ready: boolean;
  output?: string;
}

interface StartPipelineResponse {
  run_id: string;
  status: string;
}

const hasOwn = <T extends object>(value: T, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeAttachment = (value: unknown, index: number): MediaAttachment | null => {
  if (!isRecord(value)) return null;

  const url = toStringValue(value.url ?? value.file_url ?? value.asset_url ?? value.uri);
  const id =
    toStringValue(value.id ?? value.attachment_id ?? value.asset_id) ||
    (url ? `attachment:${url}` : `attachment-${index}`);

  const type = toStringValue(value.type ?? value.media_type ?? value.kind, 'unknown');
  const name = toStringValue(
    value.name ?? value.filename ?? value.file_name ?? value.title,
    `attachment-${index + 1}`
  );

  const metadata = isRecord(value.metadata)
    ? (value.metadata as Record<string, unknown>)
    : undefined;
  const source = toStringValue(value.source);
  const mediaId = toStringValue(value.media_id ?? value.mediaId);
  const filename = toStringValue(value.filename ?? value.file_name ?? value.fileName, name);
  const checkpointId = toStringValue(value.checkpoint_id ?? value.checkpointId);
  const sourceCheckpointId = toStringValue(value.source_checkpoint_id ?? value.sourceCheckpointId);
  const sourceRunId = toStringValue(value.source_run_id ?? value.sourceRunId);
  const checkpointIndex = toNumberValue(value.checkpoint_index ?? value.checkpointIndex);

  return {
    id,
    media_id: mediaId || undefined,
    type,
    url,
    mime_type: toStringValue(value.mime_type ?? value.mimeType ?? value.content_type, 'application/octet-stream'),
    name,
    filename: filename || undefined,
    created_at: toStringValue(value.created_at ?? value.createdAt, new Date(0).toISOString()),
    source: source || undefined,
    size_bytes: toNumberValue(value.size_bytes ?? value.sizeBytes),
    metadata,
    checkpoint_id: checkpointId || undefined,
    checkpoint_index: checkpointIndex ?? undefined,
    source_checkpoint_id: sourceCheckpointId || undefined,
    source_run_id: sourceRunId || undefined,
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

const normalizeInputAttachment = (value: PipelineInputAttachment): PipelineInputAttachment | null => {
  const type = toStringValue(value.type).trim();
  if (!type) return null;

  const normalized: PipelineInputAttachment = { type };

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
      | 'source_run_id',
    raw: unknown
  ) => {
    const next = toStringValue(raw).trim();
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

  const sizeBytes = toNumberValue(value.size_bytes ?? value.size);
  if (sizeBytes !== undefined) {
    normalized.size_bytes = sizeBytes;
    normalized.size = sizeBytes;
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

const normalizeInputAttachments = (
  value?: PipelineInputAttachment[]
): PipelineInputAttachment[] | undefined => {
  if (!value?.length) return undefined;

  const normalized = value
    .map((attachment) => normalizeInputAttachment(attachment))
    .filter((attachment): attachment is PipelineInputAttachment => Boolean(attachment));

  return normalized.length > 0 ? normalized : undefined;
};

const normalizePipelineRun = (run: unknown): PipelineRun => {
  if (!isRecord(run)) return run as PipelineRun;

  const normalized: PipelineRun = { ...(run as unknown as PipelineRun) };

  if (hasOwn(run, 'initial_attachments')) {
    normalized.initial_attachments = normalizeAttachmentList(run.initial_attachments);
  }

  if (Array.isArray(run.results)) {
    normalized.results = run.results.map((result) => {
      if (!isRecord(result)) return result as any;
      if (!hasOwn(result, 'attachments')) return result as any;

      return {
        ...result,
        attachments: normalizeAttachmentList(result.attachments),
      };
    });
  }

  return normalized;
};

// ==================== Pipeline Runs API ====================

const startPipeline = (
  templateId: string,
  initialInput: string,
  options?: {
    autoMode?: boolean;
    initialAttachments?: PipelineInputAttachment[];
    musicMediaId?: string | null;
    mediaProfile?: MediaProfile;
    provider?: string;
    model?: string;
  }
): Promise<StartPipelineResponse> =>
  axios
    .post(`${BASE_URL}/pipelines/start`, {
      template_id: templateId,
      initial_input: initialInput,
      auto_mode: options?.autoMode ?? true,
      initial_attachments: normalizeInputAttachments(options?.initialAttachments),
      music_media_id: toStringValue(options?.musicMediaId).trim() || undefined,
      media_profile: options?.mediaProfile,
      provider: options?.provider,
      model: options?.model,
    } as StartPipelineRequest)
    .then((res) => res.data);

const getPipeline = (pipelineId: string) =>
  axios
    .get<PipelineRun>(`${BASE_URL}/pipelines/${pipelineId}`)
    .then((res) => normalizePipelineRun(res.data));

const listPipelines = () =>
  axios
    .get<PipelineRun[]>(`${BASE_URL}/pipelines`)
    .then((res) => (res.data || []).map((run) => normalizePipelineRun(run)));

const continuePipeline = (pipelineId: string) =>
  axios
    .post<{ status: string }>(`${BASE_URL}/pipelines/${pipelineId}/continue`)
    .then((res) => res.data);

const regenerateCheckpoint = (pipelineId: string, checkpointIndex: number) =>
  axios
    .post<{ status: string }>(`${BASE_URL}/pipelines/${pipelineId}/regenerate`, {
      checkpoint_index: checkpointIndex,
    } as RegenerateCheckpointRequest)
    .then((res) => res.data);

const addAttachment = (
  pipelineId: string,
  checkpointIndex: number,
  attachment: Omit<MediaAttachment, 'id' | 'created_at'>
) =>
  axios
    .post<{ status: string }>(`${BASE_URL}/pipelines/${pipelineId}/attachments`, {
      checkpoint_index: checkpointIndex,
      attachment,
    } as AddAttachmentRequest)
    .then((res) => res.data);

const injectCheckpointPrompt = (
  pipelineId: string,
  checkpointIndex: number,
  text: string,
  options?: { autoRegenerate?: boolean; source?: string }
) =>
  axios
    .post<InjectCheckpointPromptResponse>(
      `${BASE_URL}/pipelines/${pipelineId}/checkpoints/${checkpointIndex}/inject`,
      {
        text,
        auto_regenerate: options?.autoRegenerate,
        source: toStringValue(options?.source).trim() || undefined,
      } as InjectCheckpointPromptRequest
    )
    .then((res) => res.data);

const cancelPipeline = (pipelineId: string) =>
  axios
    .delete<{ status: string }>(`${BASE_URL}/pipelines/${pipelineId}`)
    .then((res) => res.data);

// ==================== Pipeline Templates API ====================

const createPipelineTemplate = (
  id: string,
  name: string,
  checkpoints: CheckpointConfig[],
  description?: string,
  outputFormat?: PipelineOutputFormat
) =>
  axios
    .post<PipelineTemplate>(`${BASE_URL}/pipeline-templates`, {
      id,
      name,
      description,
      output_format: outputFormat,
      checkpoints,
    } as CreatePipelineTemplateRequest)
    .then((res) => res.data);

const getPipelineTemplate = (templateId: string) =>
  axios
    .get<PipelineTemplate>(`${BASE_URL}/pipeline-templates/${templateId}`)
    .then((res) => res.data);

const listPipelineTemplates = () =>
  axios
    .get<PipelineTemplate[]>(`${BASE_URL}/pipeline-templates`)
    .then((res) => res.data || []);

const updatePipelineTemplate = (
  templateId: string,
  updates: UpdatePipelineTemplateRequest
) =>
  axios
    .put<PipelineTemplate>(`${BASE_URL}/pipeline-templates/${templateId}`, updates)
    .then((res) => res.data);

const deletePipelineTemplate = (templateId: string) =>
  axios
    .delete<{ status: string }>(`${BASE_URL}/pipeline-templates/${templateId}`)
    .then((res) => res.data);

const getPipelineOutput = (pipelineId: string) =>
  axios
    .get<PipelineOutputResponse>(`${BASE_URL}/pipelines/${pipelineId}/output`)
    .then((res) => res.data);

// ==================== Prompt Templates API ====================

const createPromptTemplate = (
  id: string,
  name: string,
  content: string,
  description?: string
) =>
  axios
    .post<PromptTemplate>(`${BASE_URL}/prompt-templates`, {
      id,
      name,
      description,
      content,
    } as CreatePromptTemplateRequest)
    .then((res) => res.data);

const getPromptTemplate = (templateId: string) =>
  axios
    .get<PromptTemplate>(`${BASE_URL}/prompt-templates/${templateId}`)
    .then((res) => res.data);

const listPromptTemplates = () =>
  axios
    .get<PromptTemplate[]>(`${BASE_URL}/prompt-templates`)
    .then((res) => res.data || []);

const updatePromptTemplate = (
  templateId: string,
  updates: UpdatePromptTemplateRequest
) =>
  axios
    .put<PromptTemplate>(`${BASE_URL}/prompt-templates/${templateId}`, updates)
    .then((res) => res.data);

const deletePromptTemplate = (templateId: string) =>
  axios
    .delete<{ status: string }>(`${BASE_URL}/prompt-templates/${templateId}`)
    .then((res) => res.data);

// ==================== Export ====================

const PipelineAPI = {
  startPipeline,
  getPipeline,
  listPipelines,
  continuePipeline,
  regenerateCheckpoint,
  addAttachment,
  injectCheckpointPrompt,
  cancelPipeline,
  createPipelineTemplate,
  getPipelineTemplate,
  listPipelineTemplates,
  updatePipelineTemplate,
  deletePipelineTemplate,
  createPromptTemplate,
  getPromptTemplate,
  listPromptTemplates,
  updatePromptTemplate,
  deletePromptTemplate,
  getPipelineOutput,
};

export default PipelineAPI;
