import { MediaLibraryItem } from '../../../api/media';
import { PipelineInputAttachment } from '../../../api/structs/pipeline';
import { AssetPoolItem, normalizeAssetKind, normalizeAssetSource } from '../assetPool';

export const toAssetPoolItem = (item: MediaLibraryItem): AssetPoolItem => {
  const mediaId = item.media_id || item.id;
  const source = normalizeAssetSource(item.source);
  return {
    id: `media:${mediaId}`,
    media_id: mediaId,
    type: item.type || 'unknown',
    kind: normalizeAssetKind(item.type, item.mime_type),
    source: source === 'unknown' || source === 'file' ? 'media' : source,
    name: item.name || mediaId,
    url: item.url,
    mime_type: item.mime_type,
    size_bytes: item.size_bytes,
    metadata: item.metadata,
  };
};

export const toAttachmentType = (item: MediaLibraryItem): string => {
  const type = (item.type || '').toLowerCase();
  const mimeType = (item.mime_type || '').toLowerCase();
  if (type.includes('image') || mimeType.startsWith('image/')) return 'image';
  if (type.includes('video') || type.includes('ai_video') || mimeType.startsWith('video/')) return 'video';
  if (type.includes('audio') || type.includes('music') || mimeType.startsWith('audio/')) return 'audio';
  return item.type || 'file';
};

export const normalizeLibraryAttachment = (
  item: MediaLibraryItem,
  metadataOverrides?: Record<string, unknown>
): PipelineInputAttachment => {
  const metadata = item.metadata || {};
  const hasRealGeneratedMediaId =
    metadata.generated_has_real_media_id === undefined
      ? true
      : Boolean(metadata.generated_has_real_media_id);
  const isGeneratedSource = (item.source || '').toLowerCase().includes('generated');
  const rawMediaId = (item.media_id || item.id || '').trim();
  const mediaIdForPayload =
    rawMediaId && (!isGeneratedSource || hasRealGeneratedMediaId) ? rawMediaId : undefined;

  return {
    type: toAttachmentType(item),
    source: isGeneratedSource ? 'generated' : 'media',
    state: 'selected',
    media_id: mediaIdForPayload,
    name: item.name || item.media_id || item.id,
    filename: item.name || item.media_id || item.id,
    mime_type: item.mime_type,
    url: item.url,
    size_bytes: item.size_bytes,
    size: item.size_bytes,
    metadata: {
      ...metadata,
      library_source: item.source,
      ...(metadataOverrides || {}),
    },
  };
};

export const buildRunAttachments = (params: {
  shouldShowAttachmentUI: boolean;
  selectedRunMedia: MediaLibraryItem[];
}): PipelineInputAttachment[] => {
  const { shouldShowAttachmentUI, selectedRunMedia } = params;
  return (shouldShowAttachmentUI ? selectedRunMedia : []).map((item) => normalizeLibraryAttachment(item));
};
