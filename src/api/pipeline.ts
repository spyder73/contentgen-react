import axios from 'axios';
import { BASE_URL } from './helpers';
import {
  normalizeInputAttachments,
  normalizePipelineRun,
  normalizePipelineTemplate,
  serializeCheckpointList,
  serializePipelineOutputFormat,
} from './pipelineBoundary';
import {
  CheckpointConfig,
  CheckpointInjectionMode,
  MediaAttachment,
  PipelineInputAttachment,
  PipelineOutputFormat,
  PipelineRun,
  PipelineTemplate,
  PromptTemplate,
} from './structs';
import { toStringValue } from './typeHelpers';

interface StartPipelineRequest {
  template_id: string;
  initial_input: string;
  auto_mode?: boolean;
  initial_attachments?: PipelineInputAttachment[];
  music_media_id?: string | null;
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
  guidance?: string;
  prompt?: string;
  auto_regenerate?: boolean;
  source?: string;
  context_mode?: CheckpointInjectionMode;
  injection_mode?: CheckpointInjectionMode;
  include_prior_output_context?: boolean;
  include_context?: boolean;
  use_prior_output_context?: boolean;
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

const normalizeInjectionMode = (value?: CheckpointInjectionMode): CheckpointInjectionMode =>
  value === 'with_prior_output_context' ? value : 'guidance_only';

const serializePipelineTemplatePayload = (
  updates: UpdatePipelineTemplateRequest
): UpdatePipelineTemplateRequest => ({
  ...updates,
  output_format: serializePipelineOutputFormat(updates.output_format),
  checkpoints: updates.checkpoints ? serializeCheckpointList(updates.checkpoints) : undefined,
});

const startPipeline = (
  templateId: string,
  initialInput: string,
  options?: {
    autoMode?: boolean;
    initialAttachments?: PipelineInputAttachment[];
    musicMediaId?: string | null;
  }
): Promise<StartPipelineResponse> =>
  axios
    .post(`${BASE_URL}/pipelines/start`, {
      template_id: templateId,
      initial_input: initialInput,
      auto_mode: options?.autoMode ?? true,
      initial_attachments: normalizeInputAttachments(options?.initialAttachments),
      music_media_id: toStringValue(options?.musicMediaId).trim() || undefined,
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
  options?: {
    autoRegenerate?: boolean;
    source?: string;
    mode?: CheckpointInjectionMode;
  }
) => {
  const mode = normalizeInjectionMode(options?.mode);
  const includePriorOutputContext = mode === 'with_prior_output_context';

  return axios
    .post<InjectCheckpointPromptResponse>(
      `${BASE_URL}/pipelines/${pipelineId}/checkpoints/${checkpointIndex}/inject`,
      {
        text,
        guidance: text,
        prompt: text,
        auto_regenerate: options?.autoRegenerate,
        source: toStringValue(options?.source).trim() || undefined,
        context_mode: mode,
        injection_mode: mode,
        include_prior_output_context: includePriorOutputContext,
        include_context: includePriorOutputContext,
        use_prior_output_context: includePriorOutputContext,
      } as InjectCheckpointPromptRequest
    )
    .then((res) => res.data);
};

const cancelPipeline = (pipelineId: string) =>
  axios
    .delete<{ status: string }>(`${BASE_URL}/pipelines/${pipelineId}`)
    .then((res) => res.data);

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
      output_format: serializePipelineOutputFormat(outputFormat),
      checkpoints: serializeCheckpointList(checkpoints),
    } as CreatePipelineTemplateRequest)
    .then((res) => normalizePipelineTemplate(res.data));

const getPipelineTemplate = (templateId: string) =>
  axios
    .get<PipelineTemplate>(`${BASE_URL}/pipeline-templates/${templateId}`)
    .then((res) => normalizePipelineTemplate(res.data));

const listPipelineTemplates = () =>
  axios
    .get<PipelineTemplate[]>(`${BASE_URL}/pipeline-templates`)
    .then((res) => (res.data || []).map((template) => normalizePipelineTemplate(template)));

const updatePipelineTemplate = (
  templateId: string,
  updates: UpdatePipelineTemplateRequest
) =>
  axios
    .put<PipelineTemplate>(
      `${BASE_URL}/pipeline-templates/${templateId}`,
      serializePipelineTemplatePayload(updates)
    )
    .then((res) => normalizePipelineTemplate(res.data));

const deletePipelineTemplate = (templateId: string) =>
  axios
    .delete<{ status: string }>(`${BASE_URL}/pipeline-templates/${templateId}`)
    .then((res) => res.data);

const getPipelineOutput = (pipelineId: string) =>
  axios
    .get<PipelineOutputResponse>(`${BASE_URL}/pipelines/${pipelineId}/output`)
    .then((res) => res.data);

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
