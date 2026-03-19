import { CheckpointConfig } from '../../../api/structs';
import {
  AssetPoolItem,
  NormalizedCheckpointAssetRequirement,
  RequirementMatchDetail,
  RequirementSource,
} from './types';
import { humanize, isRecord, normalizeAssetKind, normalizeAssetSource, toNumberValue, toStringValue } from './shared';

const normalizeRequirementKind = (raw: unknown): 'any' | ReturnType<typeof normalizeAssetKind> => {
  const value = toStringValue(raw).toLowerCase();
  if (!value || value === 'any' || value === '*') return 'any';
  return normalizeAssetKind(value, '');
};

const normalizeRequirementSource = (raw: unknown): RequirementSource => {
  const value = toStringValue(raw).toLowerCase();
  if (!value || value === 'any' || value === '*') return 'any';
  return value;
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

  const id = toStringValue(raw.key ?? raw.id) || fallbackId;
  const kind = normalizeRequirementKind(raw.type ?? raw.kind ?? raw.asset_type ?? raw.asset_kind);
  const source = normalizeRequirementSource(raw.source ?? raw.asset_source ?? raw.source_type);

  const explicitMin = toNumberValue(
    raw.min_count ?? raw.minCount ?? raw.required_count ?? raw.requiredCount ?? raw.count ?? raw.min
  );
  const required = Boolean(raw.required);
  const minCount = explicitMin && explicitMin > 0 ? Math.floor(explicitMin) : required ? 1 : 1;
  const maxCount = toNumberValue(raw.max_count ?? raw.maxCount ?? raw.max);

  const label =
    toStringValue(raw.label) ||
    toStringValue(raw.name) ||
    toStringValue(raw.key) ||
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
    ...asRequirementList(checkpointRecord.requiredAssets),
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

  const normalizedSource = requiredSource.trim().toLowerCase();
  if (!normalizedSource || normalizedSource === 'any') return true;

  if (normalizedSource === 'initial' || normalizedSource === 'user') return true;

  if (normalizedSource.startsWith('checkpoint:')) {
    const requiredCheckpointId = normalizedSource.slice('checkpoint:'.length).trim();
    if (!requiredCheckpointId) return true;

    const candidateCheckpointIds = [
      candidate.source_checkpoint_id,
      candidate.generated_from_checkpoint_id,
      candidate.checkpoint_id,
      typeof candidate.metadata?.source_checkpoint_id === 'string'
        ? candidate.metadata.source_checkpoint_id
        : undefined,
      typeof candidate.metadata?.generated_from_checkpoint_id === 'string'
        ? candidate.metadata.generated_from_checkpoint_id
        : undefined,
      typeof candidate.metadata?.origin_checkpoint_id === 'string'
        ? candidate.metadata.origin_checkpoint_id
        : undefined,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase());

    return candidateCheckpointIds.includes(requiredCheckpointId);
  }

  const genericSource = normalizeAssetSource(normalizedSource);
  return genericSource !== 'unknown' ? candidate.source === genericSource : false;
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
