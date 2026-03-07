import axios from 'axios';
import { BASE_URL } from './helpers';
import { ClipMetadata } from './structs';
import { MediaOutputSpec, MediaProfile, MediaPrompt } from './structs/media-spec';
import {
  ClipStyleSchema,
  ClipStyleSummary,
  normalizeClipStyleList,
  normalizeClipStyleSchema,
} from './clipstyleSchema';

// ==================== Request Types ====================

interface NewClipPromptRequest {
  name?: string;
  imagePrompts?: MediaPrompt[];
  aiVideoPrompts?: MediaPrompt[];
  audioPrompts?: MediaPrompt[];
  music_media_id?: string | null;
  metadata?: ClipMetadata;
  clipStyle?: string;
}

interface EditClipPromptRequest {
  name?: string;
  metadata?: ClipMetadata;
  clipStyle?: string;
  music_media_id?: string | null;
}

interface NewClipIdeaRequest {
  clip_idea: string;
  clip_prompt_json?: string;
  clip_prompt_list?: string[];
}

export interface AvailableMediaItem {
  id: string;
  type: string;
  name: string;
  url?: string;
  mime_type?: string;
}

// ==================== Helpers ====================

const withDefaultOutputSpec = (
  prompts: MediaPrompt[] | undefined,
  fallback?: MediaOutputSpec
): MediaPrompt[] | undefined => {
  if (!prompts?.length) return prompts;
  if (!fallback) return prompts;

  return prompts.map((p) => {
    const mergedSpec = p.outputSpec ? { ...fallback, ...p.outputSpec } : { ...fallback };
    return { ...p, outputSpec: mergedSpec };
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const normalizeAvailableMediaItem = (value: unknown, index: number): AvailableMediaItem | null => {
  if (!isRecord(value)) {
    if (typeof value === 'string') {
      return {
        id: value,
        type: 'unknown',
        name: value,
        url: value,
      };
    }
    return null;
  }

  const url = toStringValue(value.url ?? value.file_url ?? value.asset_url ?? value.uri);
  const id = toStringValue(value.id ?? value.media_id ?? value.asset_id, url || `media-${index + 1}`);

  return {
    id,
    type: toStringValue(value.type ?? value.media_type ?? value.kind, 'unknown'),
    name: toStringValue(
      value.name ?? value.file_name ?? value.filename ?? value.title,
      id
    ),
    url: url || undefined,
    mime_type: toStringValue(value.mime_type ?? value.mimeType ?? value.content_type) || undefined,
  };
};

const normalizeAvailableMediaList = (payload: unknown): AvailableMediaItem[] => {
  const items = isRecord(payload)
    ? (Array.isArray(payload.media_files)
      ? payload.media_files
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.data)
          ? payload.data
          : [])
    : Array.isArray(payload)
      ? payload
      : [];

  return items
    .map((item, index) => normalizeAvailableMediaItem(item, index))
    .filter((item): item is AvailableMediaItem => Boolean(item));
};

// ==================== Clip API ====================

const getClipPrompt = (clipId: string) =>
  axios.get(`${BASE_URL}/clips/${clipId}`).then((res) => res.data.clip_prompt);

const getClipPrompts = () =>
  axios.get(`${BASE_URL}/clips`).then((res) => res.data.clip_prompts || []);

const createClipPrompt = (request: NewClipPromptRequest) =>
  axios.post(`${BASE_URL}/clips`, request).then((res) => res.data.clip_prompt_id);

/**
 * Parses a clip prompt JSON and optionally hydrates missing/partial per-item outputSpec
 * from run-level mediaProfile defaults.
 */
const createClipPromptFromJson = (
  json: string,
  mediaProfile?: MediaProfile
) => {
  const parsed = JSON.parse(json) as NewClipPromptRequest;

  return createClipPrompt({
    ...parsed,
    imagePrompts: withDefaultOutputSpec(parsed.imagePrompts, mediaProfile?.image),
    aiVideoPrompts: withDefaultOutputSpec(parsed.aiVideoPrompts, mediaProfile?.video),
    audioPrompts: withDefaultOutputSpec(parsed.audioPrompts, mediaProfile?.audio),
  });
};

const editClipPrompt = (clipId: string, request: EditClipPromptRequest) =>
  axios.put(`${BASE_URL}/clips/${clipId}`, request).then((res) => res.data);

const editClipMetadata = async (clipId: string, key: string, value: any) => {
  const clipPrompt = await getClipPrompt(clipId);
  const existingMetadata = clipPrompt?.metadata || {};

  return editClipPrompt(clipId, {
    metadata: {
      ...existingMetadata,
      [key]: value,
    },
  });
};

const getClipStyles = async (): Promise<ClipStyleSummary[]> => {
  const payload = await axios.get(`${BASE_URL}/clipstyles`).then((res) => res.data);
  return normalizeClipStyleList(payload);
};

const getClipStyleSchema = async (
  styleId: string,
  fallbackSummary?: ClipStyleSummary
): Promise<ClipStyleSchema> => {
  const payload = await axios
    .get(`${BASE_URL}/clipstyles/${encodeURIComponent(styleId)}/schema`)
    .then((res) => res.data);

  return normalizeClipStyleSchema(styleId, payload, fallbackSummary);
};

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
  axios
    .get(`${BASE_URL}/clips/available-media`)
    .then((res) => normalizeAvailableMediaList(res.data));

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
  getClipStyles,
  getClipStyleSchema,
  deleteClipPrompt,
  getAvailableMedia,
  getIdeas,
  deleteIdea,
};

export default ClipAPI;
