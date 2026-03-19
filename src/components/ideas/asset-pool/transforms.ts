import { AvailableMediaItem } from '../../../api/clip';
import { MediaAttachment, PipelineInputAttachment } from '../../../api/structs';
import { normalizeAssetKind, normalizeAssetSource, toStringValue } from './shared';
import { AssetPoolItem } from './types';

export const mediaItemToPoolItem = (item: AvailableMediaItem): AssetPoolItem => {
  const mediaId = toStringValue(item.media_id ?? item.id);
  const source = normalizeAssetSource(item.source);
  return {
    id: `media:${mediaId}`,
    media_id: mediaId || undefined,
    type: toStringValue(item.type) || 'unknown',
    kind: normalizeAssetKind(item.type, item.mime_type),
    source: source === 'unknown' ? 'media' : source,
    name: toStringValue(item.name) || mediaId || 'media-item',
    url: toStringValue(item.url) || undefined,
    mime_type: toStringValue(item.mime_type) || undefined,
    size_bytes:
      typeof item.size_bytes === 'number' && Number.isFinite(item.size_bytes)
        ? item.size_bytes
        : undefined,
    metadata: item.source ? { library_source: item.source } : undefined,
  };
};

export const pipelineAttachmentToPoolItem = (
  attachment: MediaAttachment,
  options: {
    source: AssetPoolItem['source'];
    runId?: string;
    checkpointId?: string;
    checkpointName?: string;
    checkpointIndex?: number;
  }
): AssetPoolItem => {
  const mediaId = toStringValue(attachment.media_id);
  const attachmentId = toStringValue(attachment.id);
  const stableIdPart = mediaId || attachmentId || toStringValue(attachment.url) || `asset-${Date.now()}`;
  return {
    id: `${options.source}:${stableIdPart}`,
    media_id: mediaId || undefined,
    type: toStringValue(attachment.type) || 'unknown',
    kind: normalizeAssetKind(attachment.type, attachment.mime_type),
    source: options.source,
    name: toStringValue(attachment.name) || toStringValue(attachment.filename) || stableIdPart,
    url: toStringValue(attachment.url) || undefined,
    mime_type: toStringValue(attachment.mime_type) || undefined,
    size_bytes: attachment.size_bytes,
    run_id: options.runId,
    checkpoint_id: options.checkpointId,
    checkpoint_name: options.checkpointName,
    checkpoint_index: options.checkpointIndex,
    source_checkpoint_id:
      toStringValue(attachment.source_checkpoint_id) ||
      (typeof attachment.metadata?.source_checkpoint_id === 'string'
        ? attachment.metadata.source_checkpoint_id
        : undefined),
    generated_from_checkpoint_id:
      toStringValue(attachment.generated_from_checkpoint_id) ||
      (typeof attachment.metadata?.generated_from_checkpoint_id === 'string'
        ? attachment.metadata.generated_from_checkpoint_id
        : undefined),
    metadata: attachment.metadata,
  };
};

export const toPipelineInputAttachment = (
  asset: AssetPoolItem,
  binding?: { checkpointId?: string; checkpointIndex?: number }
): PipelineInputAttachment => ({
  type: asset.kind === 'unknown' ? asset.type : asset.kind,
  source: asset.source,
  state: binding?.checkpointId ? 'checkpoint_bound' : 'selected',
  url: asset.url,
  name: asset.name,
  filename: asset.name,
  mime_type: asset.mime_type,
  size_bytes: asset.size_bytes,
  size: asset.size_bytes,
  media_id: asset.media_id || undefined,
  checkpoint_id: binding?.checkpointId,
  checkpoint_index: binding?.checkpointIndex,
  source_checkpoint_id: asset.checkpoint_id,
  source_run_id: asset.run_id,
  metadata: {
    ...(asset.metadata || {}),
    asset_pool_id: asset.id,
    origin_checkpoint_id: asset.checkpoint_id,
    origin_checkpoint_index: asset.checkpoint_index,
    origin_checkpoint_name: asset.checkpoint_name,
  },
});
