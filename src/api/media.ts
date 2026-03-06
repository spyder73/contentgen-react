import axios from 'axios';
import { BASE_URL } from './helpers';
import { MediaType } from './structs';
import { MediaOutputSpec } from './structs/media-spec';

// ==================== Request Types ====================

interface NewMediaItemRequest {
  clip_id: string;
  type: MediaType;
  prompt: string;
  metadata?: Record<string, any>;
  output_spec?: MediaOutputSpec;
}

interface EditMediaItemRequest {
  new_prompt_string?: string;
  output_spec?: MediaOutputSpec;
}

interface RegenerateMediaRequest {
  output_spec?: MediaOutputSpec;
}

// ==================== API Functions ====================

const getMediaItem = (mediaId: string) =>
  axios.get(`${BASE_URL}/media/${mediaId}`).then((res) => res.data);

const createMediaItem = (request: NewMediaItemRequest) =>
  axios.post(`${BASE_URL}/media`, request).then((res) => res.data.media_id);

const createImage = (
  clipId: string,
  prompt: string,
  metadata?: Record<string, any>,
  outputSpec?: MediaOutputSpec
) =>
  createMediaItem({
    clip_id: clipId,
    type: 'image',
    prompt,
    metadata,
    output_spec: outputSpec,
  });

const createAIVideo = (
  clipId: string,
  prompt: string,
  metadata?: Record<string, any>,
  outputSpec?: MediaOutputSpec
) =>
  createMediaItem({
    clip_id: clipId,
    type: 'ai_video',
    prompt,
    metadata,
    output_spec: outputSpec,
  });

const createAudio = (
  clipId: string,
  prompt: string,
  metadata?: Record<string, any>,
  outputSpec?: MediaOutputSpec
) =>
  createMediaItem({
    clip_id: clipId,
    type: 'audio',
    prompt,
    metadata,
    output_spec: outputSpec,
  });

const editMediaItem = (mediaId: string, request: EditMediaItemRequest) =>
  axios.put(`${BASE_URL}/media/${mediaId}`, request).then((res) => res.data);

const regenerateMedia = (mediaId: string, request?: RegenerateMediaRequest) =>
  axios
    .post(`${BASE_URL}/media/${mediaId}/regenerate`, request ?? {})
    .then((res) => res.data);

const editMediaMetadata = (mediaId: string, key: string, value: any) =>
  axios.put(`${BASE_URL}/media/${mediaId}/metadata`, { key, value }).then((res) => res.data);

const replaceMediaMetadata = (mediaId: string, metadata: Record<string, any>) =>
  axios.put(`${BASE_URL}/media/${mediaId}/metadata/replace`, { metadata }).then((res) => res.data);

const deleteMediaItem = (mediaId: string) =>
  axios.delete(`${BASE_URL}/media/${mediaId}`).then((res) => res.data);

// ==================== Export ====================

const MediaAPI = {
  getMediaItem,
  createMediaItem,
  createImage,
  createAIVideo,
  createAudio,
  editMediaItem,
  regenerateMedia,
  editMediaMetadata,
  replaceMediaMetadata,
  deleteMediaItem,
};

export default MediaAPI;
