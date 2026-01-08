import axios from 'axios';
import { BASE_URL } from './helpers';
import { ClipMetadata } from './structs';

// ==================== Request Types ====================

interface NewClipPromptRequest {
  name?: string;

  imagePrompts?: Array<[string, ...string[]]>;
  aiVideoPrompts?: Array<[string, ...string[]]>;
  audioPrompts?: Array<[string, ...string[]]>;

  metadata?: ClipMetadata;
  clipStyle?: string;

  imageGenerator?: string;
  imageModel?: string;

  videoGenerator?: string;
  videoModel?: string;

  audioGenerator?: string;
  audioModel?: string;
}

interface EditClipPromptRequest {
  name?: string;
  metadata?: ClipMetadata;
  clipStyle?: string;
}

interface NewClipIdeaRequest {
  clip_idea: string;
  provider?: string;
  model?: string;
}


// ==================== Clip API ====================

const getClipPrompt = (clipId: string) =>
  axios.get(`${BASE_URL}/clips/${clipId}`).then((res) => res.data.clip_prompt);

const getClipPrompts = () =>
  axios.get(`${BASE_URL}/clips`).then((res) => res.data.clip_prompts || []);

const createClipPrompt = (request: NewClipPromptRequest) =>
  axios.post(`${BASE_URL}/clips`, request).then((res) => res.data.clip_prompt_id);

// Helper to create from JSON + generators
const createClipPromptFromJson = (
  json: string,
  imageGenerator: string,
  imageModel: string,
  videoGenerator: string,
  videoModel: string,
  audioGenerator: string,
  audioModel: string
) => {
  const parsed = JSON.parse(json);
  return createClipPrompt({
    ...parsed,
    imageGenerator,
    imageModel,
    videoGenerator,
    videoModel,
    audioGenerator,
    audioModel,
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
  axios.get(`${BASE_URL}/clip-ideas`).then((res) => (console.log(res.data.prompt_ideas), res.data.prompt_ideas || []));

// Single idea → generates one clip prompt
const createNewIdea = (clipIdea: string, provider?: string, model?: string) =>
  axios.post(`${BASE_URL}/clip-ideas`, {
    clip_idea: clipIdea,
    provider,
    model,
  } as NewClipIdeaRequest).then((res) => res.data);

// Batch: prompt that generates multiple ideas
const createMultipleIdeas = (clipIdeasPrompt: string, provider?: string, model?: string) =>
  axios.post(`${BASE_URL}/clip-ideas/batch`, {
    clip_idea: clipIdeasPrompt,
    provider,
    model,
  }).then((res) => res.data);

const deleteIdea = (ideaId: string) =>
  axios.delete(`${BASE_URL}/clip-ideas`, {
    data: { clip_idea: ideaId }
  }).then((res) => res.data);

// ==================== Available Media ====================

const getAvailableMedia = () =>
  axios.get(`${BASE_URL}/clips/available-media`).then((res) => res.data.media_files || []);

// ==================== Export ====================

const ClipAPI = {
  getClipPrompt,
  getClipPrompts,
  createClipPrompt,
  createClipPromptFromJson,
  editClipPrompt,
  editClipMetadata,
  deleteClipPrompt,
  getAvailableMedia,
  getIdeas,
  createNewIdea,
  createMultipleIdeas,
  deleteIdea,
};

export default ClipAPI;