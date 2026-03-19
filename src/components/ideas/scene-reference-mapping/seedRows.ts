import { AttachmentProvenanceItem } from '../../clips/attachmentProvenance';
import { SeedSceneRow } from './types';
import {
  asArray,
  isRecord,
  readReferenceAssets,
  resolveReferenceFromRaw,
  toBooleanValue,
  toNumberWithFallback,
  toSceneKey,
  toStringValue,
} from './shared';

const resolveInitialSceneList = (parsedPrompt: Record<string, unknown>): unknown[] => {
  const metadata = isRecord(parsedPrompt.metadata) ? parsedPrompt.metadata : {};
  return [
    ...asArray(parsedPrompt.scenes),
    ...asArray(parsedPrompt.scene_list),
    ...asArray(parsedPrompt.scene_prompts),
    ...asArray(metadata.scenes),
    ...asArray(metadata.scene_list),
    ...asArray(metadata.scene_prompts),
  ];
};

const resolveSceneReferenceMappingList = (parsedPrompt: Record<string, unknown>): unknown[] => {
  const metadata = isRecord(parsedPrompt.metadata) ? parsedPrompt.metadata : {};
  return [
    ...asArray(parsedPrompt.scene_references),
    ...asArray(metadata.scene_reference_mapping),
    ...asArray(metadata.scene_reference_bindings),
    ...asArray(metadata.scene_references),
    ...asArray(metadata.scene_reference_map),
    ...asArray(parsedPrompt.scene_reference_mapping),
  ];
};

const resolveSceneId = (value: Record<string, unknown>, fallback: string): string =>
  toStringValue(value.scene_id ?? value.sceneId ?? value.id ?? value.scene ?? value.name) || fallback;

const resolveSceneOrder = (value: Record<string, unknown>, fallback: number): number =>
  Math.max(1, toNumberWithFallback(value.order ?? value.scene_order ?? value.sceneOrder ?? value.index, fallback));

const resolveSceneRequired = (value: Record<string, unknown>, fallback: boolean): boolean =>
  toBooleanValue(
    value.required_reference ??
      value.requiredReference ??
      value.requires_reference ??
      value.requiresReference ??
      value.required,
    fallback
  );

export const normalizeSeedRows = (
  parsedPrompt: Record<string, unknown>
): { seeds: SeedSceneRow[]; topLevelReferences: AttachmentProvenanceItem[] } => {
  const metadata = isRecord(parsedPrompt.metadata) ? parsedPrompt.metadata : {};
  const sceneRows = resolveInitialSceneList(parsedPrompt);
  const mappingRows = resolveSceneReferenceMappingList(parsedPrompt);
  const topLevelReferences = readReferenceAssets(metadata);

  const seedMap = new Map<string, SeedSceneRow>();

  const putSeed = (row: SeedSceneRow) => {
    const existing = seedMap.get(row.key);
    if (!existing) {
      seedMap.set(row.key, row);
      return;
    }
    seedMap.set(row.key, {
      ...existing,
      required: row.required,
      reference: row.reference || existing.reference,
    });
  };

  const seedFromRaw = (raw: Record<string, unknown>, index: number): SeedSceneRow => {
    const sceneId = resolveSceneId(raw, `scene-${index + 1}`);
    const order = resolveSceneOrder(raw, index + 1);
    const reference = resolveReferenceFromRaw(raw.reference_asset ?? raw.reference ?? raw.binding ?? raw) || undefined;
    return {
      key: toSceneKey(sceneId, order),
      scene_id: sceneId,
      order,
      required: resolveSceneRequired(raw, true),
      reference,
    };
  };

  sceneRows.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    putSeed(seedFromRaw(raw, index));
  });

  mappingRows.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    putSeed(seedFromRaw(raw, index));
  });

  const seeds = Array.from(seedMap.values()).sort((a, b) => a.order - b.order);
  if (seeds.length > 0) return { seeds, topLevelReferences };

  if (topLevelReferences.length > 0) {
    const fallbackSeeds = topLevelReferences.map((item, index) => ({
      key: toSceneKey(`scene-${index + 1}`, index + 1),
      scene_id: `scene-${index + 1}`,
      order: index + 1,
      required: false,
      reference: item,
    }));
    return { seeds: fallbackSeeds, topLevelReferences };
  }

  return { seeds: [], topLevelReferences };
};
