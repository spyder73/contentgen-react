import { AvailableMediaItem } from '../../api/clip';
import {
  CheckpointConfig,
  MediaAttachment,
  PipelineInputAttachment,
} from '../../api/structs';

export type AssetKind = 'music' | 'image' | 'video' | 'audio' | 'file' | 'unknown';
export type AssetSource = 'media' | 'generated' | 'url' | 'file' | 'unknown';

export interface AssetPoolItem {
  id: string;
  media_id?: string;
  type: string;
  kind: AssetKind;
  source: AssetSource;
  name: string;
  url?: string;
  mime_type?: string;
  size_bytes?: number;
  run_id?: string;
  checkpoint_id?: string;
  checkpoint_name?: string;
  checkpoint_index?: number;
  metadata?: Record<string, unknown>;
}

export interface NormalizedCheckpointAssetRequirement {
  id: string;
  label: string;
  kind: 'any' | AssetKind;
  source: 'any' | AssetSource;
  min_count: number;
  max_count?: number;
}

export interface RequirementMatchDetail {
  requirement: NormalizedCheckpointAssetRequirement;
  matched_count: number;
  missing_count: number;
  satisfied: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const toNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const humanize = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const normalizeAssetKind = (rawType?: string, rawMimeType?: string): AssetKind => {
  const type = (rawType || '').toLowerCase();
  const mimeType = (rawMimeType || '').toLowerCase();

  if (type.includes('music')) return 'music';
  if (type === 'audio' || mimeType.startsWith('audio/')) return 'audio';
  if (type === 'image' || mimeType.startsWith('image/')) return 'image';
  if (type === 'video' || type === 'ai_video' || mimeType.startsWith('video/')) return 'video';
  if (type === 'file' || type === 'document') return 'file';
  return 'unknown';
};

export const normalizeAssetSource = (rawSource?: string): AssetSource => {
  const source = (rawSource || '').toLowerCase();
  if (!source) return 'unknown';
  if (source.includes('generated') || source.includes('checkpoint') || source.includes('pipeline')) {
    return 'generated';
  }
  if (source.includes('media')) return 'media';
  if (source.includes('url') || source.includes('remote') || source.includes('http')) return 'url';
  if (source.includes('file') || source.includes('upload') || source.includes('local')) return 'file';
  return 'unknown';
};

export const mediaItemToPoolItem = (item: AvailableMediaItem): AssetPoolItem => {
  const mediaId = toStringValue(item.id);
  return {
    id: `media:${mediaId}`,
    media_id: mediaId || undefined,
    type: toStringValue(item.type) || 'unknown',
    kind: normalizeAssetKind(item.type, item.mime_type),
    source: 'media',
    name: toStringValue(item.name) || mediaId || 'media-item',
    url: toStringValue(item.url) || undefined,
    mime_type: toStringValue(item.mime_type) || undefined,
  };
};

export const pipelineAttachmentToPoolItem = (
  attachment: MediaAttachment,
  options: {
    source: AssetSource;
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
    metadata: attachment.metadata,
  };
};

const normalizeRequirementKind = (raw: unknown): 'any' | AssetKind => {
  const value = toStringValue(raw).toLowerCase();
  if (!value || value === 'any' || value === '*') return 'any';
  return normalizeAssetKind(value, '');
};

const normalizeRequirementSource = (raw: unknown): 'any' | AssetSource => {
  const value = toStringValue(raw).toLowerCase();
  if (!value || value === 'any' || value === '*') return 'any';
  return normalizeAssetSource(value);
};

const parseSingleRequirement = (
  raw: unknown,
  fallbackId: string
): NormalizedCheckpointAssetRequirement | null => {
  if (typeof raw === 'string') {
    const kind = normalizeRequirementKind(raw);
    return {
      id: fallbackId,
      label: kind === 'any' ? 'Any asset' : `${humanize(kind)} asset`,
      kind,
      source: 'any',
      min_count: 1,
    };
  }

  if (!isRecord(raw)) return null;

  const id = toStringValue(raw.id) || fallbackId;
  const kind = normalizeRequirementKind(
    raw.kind ?? raw.type ?? raw.asset_kind ?? raw.asset_type
  );
  const source = normalizeRequirementSource(
    raw.source ?? raw.asset_source ?? raw.source_type
  );

  const explicitMin = toNumberValue(
    raw.min_count ?? raw.minCount ?? raw.required_count ?? raw.requiredCount ?? raw.count ?? raw.min
  );
  const required = Boolean(raw.required);
  const minCount = explicitMin && explicitMin > 0 ? Math.floor(explicitMin) : required ? 1 : 1;

  const maxCount = toNumberValue(raw.max_count ?? raw.maxCount ?? raw.max);

  const label =
    toStringValue(raw.label) ||
    toStringValue(raw.name) ||
    `${humanize(kind === 'any' ? 'any' : kind)} asset${minCount > 1 ? 's' : ''}`;

  return {
    id,
    label,
    kind,
    source,
    min_count: minCount,
    max_count: maxCount && maxCount > 0 ? Math.floor(maxCount) : undefined,
  };
};

const asRequirementList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const extractCheckpointRequirements = (
  checkpoint: CheckpointConfig
): NormalizedCheckpointAssetRequirement[] => {
  const checkpointRecord = checkpoint as unknown as Record<string, unknown>;
  const rawList = [
    ...asRequirementList(checkpoint.required_assets),
    ...asRequirementList(checkpoint.required_attachments),
    ...asRequirementList(checkpoint.attachment_requirements),
    ...asRequirementList(checkpointRecord.requiredAssets),
    ...asRequirementList(checkpointRecord.requiredAttachments),
    ...asRequirementList(checkpointRecord.attachmentRequirements),
  ];

  const parsed = rawList
    .map((item, index) => parseSingleRequirement(item, `requirement-${index + 1}`))
    .filter((item): item is NormalizedCheckpointAssetRequirement => Boolean(item));

  const deduped = new Map<string, NormalizedCheckpointAssetRequirement>();
  parsed.forEach((item) => {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  });
  return Array.from(deduped.values());
};

const matchRequirementKind = (
  requiredKind: NormalizedCheckpointAssetRequirement['kind'],
  candidate: AssetPoolItem
): boolean => {
  if (requiredKind === 'any') return true;
  if (requiredKind === 'audio') return candidate.kind === 'audio' || candidate.kind === 'music';
  if (requiredKind === 'music') return candidate.kind === 'music' || candidate.kind === 'audio';
  return candidate.kind === requiredKind;
};

const matchRequirementSource = (
  requiredSource: NormalizedCheckpointAssetRequirement['source'],
  candidate: AssetPoolItem
): boolean => {
  if (requiredSource === 'any') return true;
  return candidate.source === requiredSource;
};

export const evaluateCheckpointRequirements = (
  requirements: NormalizedCheckpointAssetRequirement[],
  selectedAssets: AssetPoolItem[]
): { satisfied: boolean; details: RequirementMatchDetail[] } => {
  if (requirements.length === 0) {
    return { satisfied: true, details: [] };
  }

  const details = requirements.map((requirement) => {
    const matchedCount = selectedAssets.filter(
      (asset) =>
        matchRequirementKind(requirement.kind, asset) &&
        matchRequirementSource(requirement.source, asset)
    ).length;

    const minCount = Math.max(1, requirement.min_count);
    const missingCount = Math.max(0, minCount - matchedCount);
    const satisfied = missingCount === 0;

    return {
      requirement,
      matched_count: matchedCount,
      missing_count: missingCount,
      satisfied,
    };
  });

  return {
    satisfied: details.every((item) => item.satisfied),
    details,
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
