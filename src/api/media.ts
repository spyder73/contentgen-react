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

export interface MediaLibraryItem {
  id: string;
  media_id: string;
  type: string;
  name: string;
  url?: string;
  mime_type?: string;
  source?: string;
  size_bytes?: number;
  clip_id?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

interface MediaLibraryListQuery {
  search?: string;
  type?: string;
  source?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeMediaLibraryItem = (value: unknown, index: number): MediaLibraryItem | null => {
  if (!isRecord(value)) {
    if (typeof value === 'string') {
      return {
        id: value,
        media_id: value,
        type: 'unknown',
        name: value,
        url: value,
      };
    }
    return null;
  }

  const url = toStringValue(value.url ?? value.file_url ?? value.asset_url ?? value.uri);
  const mediaId = toStringValue(value.media_id ?? value.id ?? value.asset_id, url || `media-${index + 1}`);
  if (!mediaId) return null;

  const metadata = isRecord(value.metadata) ? value.metadata : undefined;

  return {
    id: mediaId,
    media_id: mediaId,
    type: toStringValue(value.type ?? value.media_type ?? value.kind, 'unknown'),
    name: toStringValue(value.name ?? value.file_name ?? value.filename ?? value.title, mediaId),
    url: url || undefined,
    mime_type: toStringValue(value.mime_type ?? value.mimeType ?? value.content_type) || undefined,
    source: toStringValue(value.source ?? value.origin) || undefined,
    size_bytes: toNumberValue(value.size_bytes ?? value.sizeBytes ?? value.size),
    clip_id: toStringValue(value.clip_id ?? value.clipId) || undefined,
    created_at: toStringValue(value.created_at ?? value.createdAt) || undefined,
    metadata,
  };
};

const normalizeMediaLibraryList = (payload: unknown): MediaLibraryItem[] => {
  const rawItems = isRecord(payload)
    ? (Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.media_items)
        ? payload.media_items
        : Array.isArray(payload.media_files)
          ? payload.media_files
          : Array.isArray(payload.data)
            ? payload.data
            : [])
    : Array.isArray(payload)
      ? payload
      : [];

  const deduped = new Map<string, MediaLibraryItem>();
  rawItems
    .map((item, index) => normalizeMediaLibraryItem(item, index))
    .filter((item): item is MediaLibraryItem => Boolean(item))
    .forEach((item) => deduped.set(item.media_id, item));
  return Array.from(deduped.values());
};

const normalizeMediaLibraryUploadResponse = (payload: unknown): MediaLibraryItem | null => {
  if (isRecord(payload)) {
    const candidate = payload.item ?? payload.media_item ?? payload.media ?? payload.data ?? payload;
    return normalizeMediaLibraryItem(candidate, 0);
  }
  return normalizeMediaLibraryItem(payload, 0);
};

// ==================== API Functions ====================

const getMediaItem = (mediaId: string) =>
  axios.get(`${BASE_URL}/media/${mediaId}`).then((res) => res.data);

const createMediaItem = (request: NewMediaItemRequest) =>
  axios.post(`${BASE_URL}/media`, request).then((res) => res.data.media_id);

const listMediaLibrary = (query?: MediaLibraryListQuery) =>
  axios
    .get(`${BASE_URL}/media/library`, {
      params: {
        search: query?.search?.trim() || undefined,
        type: query?.type?.trim() || undefined,
        source: query?.source?.trim() || undefined,
      },
    })
    .then((res) => normalizeMediaLibraryList(res.data));

const uploadMediaLibraryFile = async (
  file: File,
  options?: { type?: string; source?: string }
): Promise<MediaLibraryItem> => {
  const body = new FormData();
  body.append('file', file);
  if (options?.type?.trim()) {
    body.append('type', options.type.trim());
  }
  if (options?.source?.trim()) {
    body.append('source', options.source.trim());
  }

  const payload = await axios
    .post(`${BASE_URL}/media/library/upload`, body)
    .then((res) => res.data);
  const normalized = normalizeMediaLibraryUploadResponse(payload);
  if (!normalized) {
    throw new Error('Upload succeeded but no media ID was returned.');
  }
  return normalized;
};

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
  listMediaLibrary,
  uploadMediaLibraryFile,
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
