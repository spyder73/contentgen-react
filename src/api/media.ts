import axios from 'axios';
import { BASE_URL } from './helpers';
import { MediaType } from './structs';
import { MediaOutputSpec } from './structs/media-spec';
import { isRecord, toNumberValue, toStringValue } from './typeHelpers';

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

interface RenameMediaItemRequest {
  name: string;
  new_name?: string;
}

export interface MediaLibraryItem {
  id: string;
  media_id: string;
  type: string;
  name: string;
  url?: string;
  preview_url?: string;
  preview_video_url?: string;
  preview_audio_url?: string;
  thumbnail_url?: string;
  poster_url?: string;
  playback_url?: string;
  mime_type?: string;
  source?: string;
  size_bytes?: number;
  clip_id?: string;
  created_at?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
}

interface MediaLibraryListQuery {
  search?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export interface MediaLibraryPage {
  items: MediaLibraryItem[];
  total: number;
  page: number;
  limit: number;
}

interface HttpErrorWithStatus {
  response?: {
    status?: number;
  };
}


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

  const mediaUrl = toStringValue(
    value.url ??
      value.file_url ??
      value.asset_url ??
      value.uri ??
      value.media_url ??
      value.source_url ??
      value.download_url ??
      value.stream_url ??
      value.playback_url
  );
  const mediaId = toStringValue(value.media_id ?? value.id ?? value.asset_id, mediaUrl || `media-${index + 1}`);
  if (!mediaId) return null;

  const metadata = isRecord(value.metadata) ? value.metadata : undefined;
  const previewUrl = toStringValue(
    value.preview_url ??
      value.preview_image_url ??
      value.thumbnail_url ??
      value.thumb_url ??
      value.image_url
  );
  const previewVideoUrl = toStringValue(value.preview_video_url ?? value.video_url ?? value.video_file_url);
  const previewAudioUrl = toStringValue(value.preview_audio_url ?? value.audio_url ?? value.audio_file_url);
  const thumbnailUrl = toStringValue(value.thumbnail_url ?? value.thumb_url);
  const posterUrl = toStringValue(value.poster_url ?? value.poster_image_url);
  const playbackUrl = toStringValue(value.playback_url ?? value.stream_url);

  return {
    id: mediaId,
    media_id: mediaId,
    type: toStringValue(value.type ?? value.media_type ?? value.kind, 'unknown'),
    name: toStringValue(value.name ?? value.file_name ?? value.filename ?? value.title, mediaId),
    url: mediaUrl || undefined,
    preview_url: previewUrl || undefined,
    preview_video_url: previewVideoUrl || undefined,
    preview_audio_url: previewAudioUrl || undefined,
    thumbnail_url: thumbnailUrl || undefined,
    poster_url: posterUrl || undefined,
    playback_url: playbackUrl || undefined,
    mime_type: toStringValue(value.mime_type ?? value.mimeType ?? value.content_type) || undefined,
    source: toStringValue(value.source ?? value.origin) || undefined,
    size_bytes: toNumberValue(value.size_bytes ?? value.sizeBytes ?? value.size),
    clip_id: toStringValue(value.clip_id ?? value.clipId) || undefined,
    created_at: toStringValue(value.created_at ?? value.createdAt) || undefined,
    prompt: toStringValue(value.prompt) || undefined,
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

const getHttpStatus = (error: unknown): number | undefined =>
  (error as HttpErrorWithStatus | undefined)?.response?.status;

const shouldFallbackToLegacyRoute = (error: unknown): boolean => {
  const status = getHttpStatus(error);
  return status === 404 || status === 405;
};

// ==================== API Functions ====================

const getMediaItem = (mediaId: string) =>
  axios.get(`${BASE_URL}/media/${mediaId}`).then((res) => res.data);

const createMediaItem = (request: NewMediaItemRequest) =>
  axios.post(`${BASE_URL}/media`, request).then((res) => res.data.media_id);

const listMediaLibrary = async (query?: MediaLibraryListQuery): Promise<MediaLibraryItem[]> => {
  const params = {
    search: query?.search?.trim() || undefined,
    type: query?.type?.trim() || undefined,
    source: query?.source?.trim() || undefined,
    page: query?.page ?? undefined,
    limit: query?.limit ?? undefined,
  };

  try {
    const payload = await axios
      .get(`${BASE_URL}/media/library`, { params })
      .then((res) => res.data);
    return normalizeMediaLibraryList(payload);
  } catch (error) {
    if (!shouldFallbackToLegacyRoute(error)) {
      throw error;
    }
  }

  const legacyPayload = await axios.get(`${BASE_URL}/media`, { params }).then((res) => res.data);
  return normalizeMediaLibraryList(legacyPayload);
};

const listMediaLibraryPaged = async (query?: MediaLibraryListQuery): Promise<MediaLibraryPage> => {
  const params = {
    search: query?.search?.trim() || undefined,
    type: query?.type?.trim() || undefined,
    page: query?.page ?? 1,
    limit: query?.limit ?? 20,
  };

  try {
    const payload = await axios
      .get(`${BASE_URL}/media/library`, { params })
      .then((res) => res.data);
    return {
      items: normalizeMediaLibraryList(payload),
      total: (payload as Record<string, unknown>)?.total as number ?? 0,
      page: (payload as Record<string, unknown>)?.page as number ?? params.page,
      limit: (payload as Record<string, unknown>)?.limit as number ?? params.limit,
    };
  } catch (error) {
    if (!shouldFallbackToLegacyRoute(error)) {
      throw error;
    }
  }

  const legacyPayload = await axios.get(`${BASE_URL}/media`, { params }).then((res) => res.data);
  const items = normalizeMediaLibraryList(legacyPayload);
  return {
    items,
    total: (legacyPayload as Record<string, unknown>)?.total as number ?? items.length,
    page: params.page,
    limit: params.limit,
  };
};

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

  let payload: unknown;
  try {
    payload = await axios
      .post(`${BASE_URL}/media/library/upload`, body)
      .then((res) => res.data);
  } catch (error) {
    if (!shouldFallbackToLegacyRoute(error)) {
      throw error;
    }
    payload = await axios.post(`${BASE_URL}/media/upload`, body).then((res) => res.data);
  }

  const normalized = normalizeMediaLibraryUploadResponse(payload);
  if (!normalized) {
    throw new Error('Upload succeeded but no media ID was returned.');
  }
  return normalized;
};

const renameMediaLibraryItem = async (
  mediaId: string,
  nextName: string
): Promise<MediaLibraryItem> => {
  const trimmedName = nextName.trim();
  if (!trimmedName) {
    throw new Error('Media name is required.');
  }

  const payload: RenameMediaItemRequest = {
    name: trimmedName,
    new_name: trimmedName,
  };

  let responsePayload: unknown;
  try {
    responsePayload = await axios
      .put(`${BASE_URL}/media/library/${mediaId}/rename`, payload)
      .then((res) => res.data);
  } catch (error) {
    if (!shouldFallbackToLegacyRoute(error)) {
      throw error;
    }
    responsePayload = await axios
      .put(`${BASE_URL}/media/${mediaId}/rename`, payload)
      .then((res) => res.data);
  }

  const normalized = normalizeMediaLibraryUploadResponse(responsePayload);
  if (normalized) {
    return {
      ...normalized,
      name: normalized.name || trimmedName,
    };
  }

  return {
    id: mediaId,
    media_id: mediaId,
    type: 'unknown',
    name: trimmedName,
  };
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
  listMediaLibraryPaged,
  uploadMediaLibraryFile,
  renameMediaLibraryItem,
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
