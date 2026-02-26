import axios from 'axios';
import { BASE_URL } from './helpers';
import { ClipMetadata } from './structs';

// ==================== Request Types ====================

interface MediaOutputSpec {
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  steps?: number;
  provider?: string;
  model?: string;
}

interface MediaPrompt {
  prompt: string;
  outputSpec?: MediaOutputSpec;
  [key: string]: any;
}

interface NewClipPromptRequest {
  name?: string;
  imagePrompts?: MediaPrompt[];
  aiVideoPrompts?: MediaPrompt[];
  audioPrompts?: MediaPrompt[];
  metadata?: ClipMetadata;
  clipStyle?: string;
  imageGenerator?: string;
  imageModel?: string;
  videoGenerator?: string;
  videoModel?: string;
  audioGenerator?: string;
  audioModel?: string;
  config?: Record<string, any>;
}

interface EditClipPromptRequest {
  name?: string;
  metadata?: ClipMetadata;
  clipStyle?: string;
}

interface NewClipIdeaRequest {
  clip_idea: string;
  clip_prompt_json?: string;
  clip_prompt_list?: string[];
}

// ==================== Clip API ====================

const getClipPrompt = (clipId: string) =>
  axios.get(`${BASE_URL}/clips/${clipId}`).then((res) => res.data.clip_prompt);

const getClipPrompts = () =>
  axios.get(`${BASE_URL}/clips`).then((res) => res.data.clip_prompts || []);

const createClipPrompt = (request: NewClipPromptRequest) =>
  axios.post(`${BASE_URL}/clips`, request).then((res) => res.data.clip_prompt_id);

const createClipPromptFromJson = (
  json: string,
  imageGenerator: string,
  imageModel: string,
  videoGenerator: string,
  videoModel: string,
  audioGenerator: string,
  audioModel: string
) => {
  const parsed = JSON.parse(json) as NewClipPromptRequest;
  return createClipPrompt({
    ...parsed,
    // Per-item outputSpec.provider/model takes priority over these fallbacks
    imageGenerator: parsed.imageGenerator || imageGenerator,
    imageModel: parsed.imageModel || imageModel,
    videoGenerator: parsed.videoGenerator || videoGenerator,
    videoModel: parsed.videoModel || videoModel,
    audioGenerator: parsed.audioGenerator || audioGenerator,
    audioModel: parsed.audioModel || audioModel,
  });
};

const editClipPrompt = (clipId: string, request: EditClipPromptRequest) =>
  axios.put(`${BASE_URL}/clips/${clipId}`, request).then((res) => res.data);

const editClipMetadata = (clipId: string, key: string, value: any) =>
  axios.put(`${BASE_URL}/clips/${clipId}/metadata`, { key, value }).then((res) => res.data);

const deleteClipPrompt = (clipId: string) =>
  axios.delete(`${BASE_URL}/clips/${clipId}`).then((res) => res.data);

// ==================== Clip Ideas API ====================

const getIdeas = () =>
  axios.get(`${BASE_URL}/clip-ideas`).then((res) => res.data.prompt_ideas || []);

const createIdea = (clipIdea: string, clipPromptJson: string) =>
  axios.post(`${BASE_URL}/clip-ideas`, {
    clip_idea: clipIdea,
    clip_prompt_json: clipPromptJson,
  } as NewClipIdeaRequest).then((res) => res.data);

const createIdeas = (clipIdea: string, clipPromptList: string[]) =>
  axios.post(`${BASE_URL}/clip-ideas`, {
    clip_idea: clipIdea,
    clip_prompt_list: clipPromptList,
  } as NewClipIdeaRequest).then((res) => res.data);

const deleteIdea = (clipIdea: string) =>
  axios.delete(`${BASE_URL}/clip-ideas`, {
    data: { clip_idea: clipIdea },
  }).then((res) => res.data);

// ==================== Available Media ====================

const getAvailableMedia = () =>
  axios.get(`${BASE_URL}/clips/available-media`).then((res) => res.data.media_files || []);

// ==================== Export ====================

const ClipAPI = {
  getClipPrompt,
  getClipPrompts,
  createIdea,
  createIdeas,
  createClipPrompt,
  createClipPromptFromJson,
  editClipPrompt,
  editClipMetadata,
  deleteClipPrompt,
  getAvailableMedia,
  getIdeas,
  deleteIdea,
};

export default ClipAPI;