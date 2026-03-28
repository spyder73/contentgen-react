import { PipelineRun } from '../../../api/structs/pipeline';
import { applyReferenceImageMetadata } from '../../../api/referenceImagePayload';
import {
  AttachmentProvenanceItem,
  isGeneratedAttachmentSource,
  mergeAttachmentProvenance,
  normalizeAttachmentProvenanceItem,
  readMetadataAttachmentProvenance,
} from '../../clips/attachmentProvenance';
import {
  SceneReferenceRow,
  getOptionKey,
  mergeSceneSelectionsIntoReferenceAssets,
  toSceneReferenceMappingEntries,
} from '../sceneReferenceMapping';
import { isPlainObject, readString } from './valueReaders';

export const dedupeReferenceOptions = (
  items: AttachmentProvenanceItem[]
): AttachmentProvenanceItem[] => {
  const deduped = new Map<string, AttachmentProvenanceItem>();
  items.forEach((item) => {
    const key = getOptionKey(item);
    if (!key || deduped.has(key)) return;
    deduped.set(key, item);
  });
  return Array.from(deduped.values());
};

const readReferenceAssets = (metadata: Record<string, unknown>): AttachmentProvenanceItem[] => {
  if (!Array.isArray(metadata.reference_assets)) return [];
  return metadata.reference_assets
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};

const enrichPromptJsonWithRunProvenance = (
  rawPromptJson: string,
  run: PipelineRun,
  runProvenance: AttachmentProvenanceItem[]
): string => {
  try {
    const parsed = JSON.parse(rawPromptJson) as unknown;
    if (!isPlainObject(parsed)) return rawPromptJson;

    const metadata = isPlainObject(parsed.metadata) ? { ...parsed.metadata } : {};
    const existing = readMetadataAttachmentProvenance(metadata);
    const merged = mergeAttachmentProvenance(existing, runProvenance);
    const generated = merged.filter(
      (item) => isGeneratedAttachmentSource(item.source) || Boolean(item.source_checkpoint_id)
    );

    metadata.attachment_provenance = merged;
    metadata.pipeline_run_id = readString(metadata.pipeline_run_id) || run.id;

    if (!Array.isArray(metadata.reference_assets) || metadata.reference_assets.length === 0) {
      metadata.reference_assets = generated;
    }

    return JSON.stringify({ ...parsed, metadata });
  } catch {
    return rawPromptJson;
  }
};

const resolveReferenceInput = (item: AttachmentProvenanceItem): string =>
  readString(item.url) || readString(item.media_id) || readString(item.id);

const getOrderedReferenceUrls = (
  rows: SceneReferenceRow[],
  options: AttachmentProvenanceItem[]
): string[] => {
  const optionMap = new Map(options.map((item) => [getOptionKey(item), item]));
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => optionMap.get(row.selectedOptionKey))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item))
    .map((item) => resolveReferenceInput(item))
    .filter(Boolean);
};

export const buildAssembledClipPromptPayload = (
  rawPromptJson: string,
  run: PipelineRun,
  runProvenance: AttachmentProvenanceItem[],
  rows: SceneReferenceRow[],
  options: AttachmentProvenanceItem[]
): Record<string, unknown> => {
  const enrichedJson = enrichPromptJsonWithRunProvenance(rawPromptJson, run, runProvenance);
  const parsed = JSON.parse(enrichedJson) as unknown;

  if (!isPlainObject(parsed)) {
    throw new Error('Clip prompt output is not a valid JSON object.');
  }

  const metadata = isPlainObject(parsed.metadata) ? { ...parsed.metadata } : {};
  const existingReferenceAssets = readReferenceAssets(metadata);
  const sceneReferenceMapping = toSceneReferenceMappingEntries(rows, options);
  const mergedReferenceAssets = mergeSceneSelectionsIntoReferenceAssets(
    existingReferenceAssets,
    rows,
    options
  );

  const orderedReferenceImageUrls = getOrderedReferenceUrls(rows, options);
  const singleImageReferenceUrl = orderedReferenceImageUrls.length > 0 ? [orderedReferenceImageUrls[0]] : [];

  metadata.scene_reference_mapping = sceneReferenceMapping;

  if (run.cost_summary) {
    metadata.pipeline_cost_summary = run.cost_summary;
  }

  if (mergedReferenceAssets.length > 0) {
    metadata.reference_assets = mergedReferenceAssets;
  } else {
    delete metadata.reference_assets;
  }

  parsed.imagePrompts = applyReferenceImageMetadata(parsed.imagePrompts, singleImageReferenceUrl);
  parsed.image_prompts = applyReferenceImageMetadata(parsed.image_prompts, singleImageReferenceUrl);
  parsed.aiVideoPrompts = applyReferenceImageMetadata(parsed.aiVideoPrompts, orderedReferenceImageUrls);
  parsed.ai_video_prompts = applyReferenceImageMetadata(parsed.ai_video_prompts, orderedReferenceImageUrls);

  return {
    ...parsed,
    metadata,
  };
};

export const isImageReferenceOption = (item?: AttachmentProvenanceItem): boolean => {
  if (!item) return false;
  const type = readString(item.type).toLowerCase();
  const mimeType = readString(item.mime_type).toLowerCase();
  return type.includes('image') || mimeType.startsWith('image/');
};
