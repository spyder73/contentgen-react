import { MediaLibraryItem } from '../../api/media';
import { FolderType, inferFolderFromType } from './attachment-library/helpers';

interface RecordLike {
  [key: string]: unknown;
}

export interface MediaPreviewCandidates {
  folder: FolderType;
  image: string[];
  video: string[];
  audio: string[];
  poster: string[];
}

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toCleanString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  return '';
};

const uniqueUrls = (values: unknown[]): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];

  values.forEach((value) => {
    const next = toCleanString(value);
    if (!next) return;
    if (seen.has(next)) return;
    seen.add(next);
    urls.push(next);
  });

  return urls;
};

const readByKeys = (record: RecordLike, keys: string[]): unknown[] =>
  keys.map((key) => record[key]);

const VIDEO_EXT_RE = /(\.mp4|\.mov|\.m4v|\.webm|\.ogv|\.ogg|\.m3u8)(\?|#|$)/i;
const AUDIO_EXT_RE = /(\.mp3|\.wav|\.ogg|\.oga|\.m4a|\.aac|\.flac)(\?|#|$)/i;

const isLikelyVideoUrl = (url: string): boolean => VIDEO_EXT_RE.test(url);
const isLikelyAudioUrl = (url: string): boolean => AUDIO_EXT_RE.test(url);

const MEDIA_URL_KEYS = [
  'url',
  'file_url',
  'asset_url',
  'uri',
  'media_url',
  'source_url',
  'download_url',
  'stream_url',
  'playback_url',
];

const IMAGE_PREVIEW_KEYS = [
  'preview_url',
  'preview_image_url',
  'image_url',
  'thumbnail_url',
  'thumb_url',
  'small_url',
];

const VIDEO_PREVIEW_KEYS = [
  'preview_video_url',
  'playback_url',
  'stream_url',
  'video_url',
  'video_file_url',
];

const AUDIO_PREVIEW_KEYS = ['preview_audio_url', 'audio_url', 'audio_file_url'];

const POSTER_KEYS = ['poster_url', 'poster_image_url', 'thumbnail_url', 'thumb_url'];

const resolveMetadata = (item: MediaLibraryItem): RecordLike =>
  isRecord(item.metadata) ? item.metadata : {};

export const resolveMediaPreviewCandidates = (item: MediaLibraryItem): MediaPreviewCandidates => {
  const raw = item as unknown as RecordLike;
  const metadata = resolveMetadata(item);
  const metadataPreview = isRecord(metadata.preview) ? metadata.preview : {};
  const folder = inferFolderFromType(item.type, item.mime_type);
  const mime = toCleanString(item.mime_type).toLowerCase();

  const mediaUrls = uniqueUrls([
    ...readByKeys(raw, MEDIA_URL_KEYS),
    ...readByKeys(metadata, MEDIA_URL_KEYS),
    ...readByKeys(metadataPreview, MEDIA_URL_KEYS),
  ]);

  const imageUrls = uniqueUrls([
    ...readByKeys(raw, IMAGE_PREVIEW_KEYS),
    ...readByKeys(metadata, IMAGE_PREVIEW_KEYS),
    ...readByKeys(metadataPreview, IMAGE_PREVIEW_KEYS),
  ]);

  const videoUrls = uniqueUrls([
    ...readByKeys(raw, VIDEO_PREVIEW_KEYS),
    ...readByKeys(metadata, VIDEO_PREVIEW_KEYS),
    ...readByKeys(metadataPreview, VIDEO_PREVIEW_KEYS),
  ]);

  const audioUrls = uniqueUrls([
    ...readByKeys(raw, AUDIO_PREVIEW_KEYS),
    ...readByKeys(metadata, AUDIO_PREVIEW_KEYS),
    ...readByKeys(metadataPreview, AUDIO_PREVIEW_KEYS),
  ]);

  const posterUrls = uniqueUrls([
    ...readByKeys(raw, POSTER_KEYS),
    ...readByKeys(metadata, POSTER_KEYS),
    ...readByKeys(metadataPreview, POSTER_KEYS),
  ]);

  const likelyVideoMediaUrls = mediaUrls.filter((url) => isLikelyVideoUrl(url));
  const likelyAudioMediaUrls = mediaUrls.filter((url) => isLikelyAudioUrl(url));

  const includeUnknownMediaForVideo = folder === 'video' || mime.startsWith('video/');
  const includeUnknownMediaForAudio = folder === 'audio' || mime.startsWith('audio/');

  const videoCandidates = uniqueUrls([
    ...videoUrls,
    ...likelyVideoMediaUrls,
    ...(includeUnknownMediaForVideo ? mediaUrls : []),
  ]);

  const audioCandidates = uniqueUrls([
    ...audioUrls,
    ...likelyAudioMediaUrls,
    ...(includeUnknownMediaForAudio ? mediaUrls : []),
  ]);

  const imageCandidates = uniqueUrls([...imageUrls, ...posterUrls, ...mediaUrls]);

  return {
    folder,
    image: imageCandidates,
    video: videoCandidates,
    audio: audioCandidates,
    poster: posterUrls,
  };
};
