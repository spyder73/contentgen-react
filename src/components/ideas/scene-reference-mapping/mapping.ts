import { AvailableMediaItem } from '../../../api/clip';
import { AttachmentProvenanceItem, mergeAttachmentProvenance } from '../../clips/attachmentProvenance';
import { normalizeSeedRows } from './seedRows';
import { SceneReferenceMappingEntry, SceneReferenceRow } from './types';
import {
  dedupeOptions,
  getOptionKey,
  isReferenceCandidate,
  normalizeSource,
  toOptionFromAvailableMedia,
  toReferenceOptionKey,
} from './publicUtils';

export const buildSceneReferenceOptions = (
  runProvenance: AttachmentProvenanceItem[],
  availableMedia: AvailableMediaItem[]
): AttachmentProvenanceItem[] =>
  dedupeOptions([
    ...runProvenance.filter(isReferenceCandidate),
    ...availableMedia.map((item) => toOptionFromAvailableMedia(item)).filter(isReferenceCandidate),
  ]);

const mergeSeedOption = (
  options: AttachmentProvenanceItem[],
  optionMap: Map<string, AttachmentProvenanceItem>,
  candidate: AttachmentProvenanceItem
): string => {
  const candidateKey = toReferenceOptionKey(candidate);
  if (!candidateKey) return '';
  if (!optionMap.has(candidateKey)) {
    options.push(candidate);
    dedupeOptions(options).forEach((item) => {
      optionMap.set(toReferenceOptionKey(item), item);
    });
  }
  return candidateKey;
};

export const createSceneReferenceRows = (
  parsedPrompt: Record<string, unknown>,
  options: AttachmentProvenanceItem[]
): SceneReferenceRow[] => {
  const optionMap = new Map(options.map((item) => [toReferenceOptionKey(item), item]));
  const { seeds, topLevelReferences } = normalizeSeedRows(parsedPrompt);
  let topLevelIndex = 0;

  const rows = seeds.map((seed) => {
    const seedOptionKey = seed.reference ? toReferenceOptionKey(seed.reference) : '';
    let selectedOptionKey = '';

    if (seedOptionKey && optionMap.has(seedOptionKey)) {
      selectedOptionKey = seedOptionKey;
    } else if (seed.reference) {
      selectedOptionKey = mergeSeedOption(options, optionMap, seed.reference);
    } else if (topLevelReferences[topLevelIndex]) {
      selectedOptionKey = mergeSeedOption(options, optionMap, topLevelReferences[topLevelIndex]);
      topLevelIndex += 1;
    }

    return {
      key: seed.key,
      scene_id: seed.scene_id,
      order: seed.order,
      required: seed.required,
      selectedOptionKey,
    };
  });

  return rows.sort((a, b) => a.order - b.order);
};

export const countUnresolvedRows = (rows: SceneReferenceRow[]): number =>
  rows.filter((row) => row.required && !row.selectedOptionKey).length;

export const toSceneReferenceMappingEntries = (
  rows: SceneReferenceRow[],
  options: AttachmentProvenanceItem[]
): SceneReferenceMappingEntry[] => {
  const optionMap = new Map(options.map((item) => [toReferenceOptionKey(item), item]));
  return rows
    .map((row) => {
      const selected = row.selectedOptionKey ? optionMap.get(row.selectedOptionKey) : undefined;
      return {
        scene_id: row.scene_id,
        order: row.order,
        required_reference: row.required,
        status: (selected ? 'resolved' : 'missing') as 'resolved' | 'missing',
        reference_media_id: selected?.media_id,
        reference_id: selected?.id,
        reference_name: selected?.name,
        reference_type: selected?.type,
        reference_url: selected?.url,
        reference_source: selected?.source,
        source_checkpoint_id: selected?.source_checkpoint_id,
        source_checkpoint_name: selected?.source_checkpoint_name,
        source_checkpoint_index: selected?.source_checkpoint_index,
      };
    })
    .sort((a, b) => a.order - b.order);
};

export const mergeSceneSelectionsIntoReferenceAssets = (
  existingReferenceAssets: AttachmentProvenanceItem[],
  rows: SceneReferenceRow[],
  options: AttachmentProvenanceItem[]
): AttachmentProvenanceItem[] => {
  const optionMap = new Map(options.map((item) => [toReferenceOptionKey(item), item]));
  const selected = rows
    .map((row) => optionMap.get(row.selectedOptionKey))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));

  return mergeAttachmentProvenance(existingReferenceAssets, selected);
};

export const toReferenceOptionLabel = (item: AttachmentProvenanceItem): string => {
  const normalizedSource = normalizeSource(item.source || 'media');
  const sourceLabel = normalizedSource === 'generated' ? 'generated' : 'library';
  return `${item.name} (${item.type} · ${sourceLabel})`;
};

export { getOptionKey };
