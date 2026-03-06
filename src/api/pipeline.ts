import axios from 'axios';
import { BASE_URL } from './helpers';
import {
  PipelineRun,
  PipelineTemplate,
  PromptTemplate,
  MediaAttachment,
  CheckpointConfig,
  PipelineOutputFormat,
} from './structs';
import { MediaProfile } from './structs/media-spec';

// ==================== Request Types ====================

interface StartPipelineRequest {
  template_id: string;
  initial_input: string;
  auto_mode?: boolean;
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

// ==================== Pipeline Runs API ====================

const startPipeline = (
  templateId: string,
  initialInput: string,
  options?: {
    autoMode?: boolean;
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
      media_profile: options?.mediaProfile,
      provider: options?.provider,
      model: options?.model,
    } as StartPipelineRequest)
    .then((res) => res.data);

const getPipeline = (pipelineId: string) =>
  axios
    .get<PipelineRun>(`${BASE_URL}/pipelines/${pipelineId}`)
    .then((res) => res.data);

const listPipelines = () =>
  axios
    .get<PipelineRun[]>(`${BASE_URL}/pipelines`)
    .then((res) => res.data || []);

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
