import { MediaPrompt } from './structs/media-spec';
import { isRecord, toStringValue } from './typeHelpers';

export const toReferenceImageUrl = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (!isRecord(value)) return '';

  return toStringValue(
    value.reference_image_url ??
      value.referenceImageUrl ??
      value.url ??
      value.reference_url ??
      value.referenceUrl ??
      value.media_id ??
      value.mediaId ??
      value.id
  ).trim();
};

const readPromptReferenceImageFromOutputSpec = (prompt: MediaPrompt): string => {
  const promptRecord = prompt as Record<string, unknown>;
  const outputSpec = isRecord(promptRecord.outputSpec)
    ? promptRecord.outputSpec
    : isRecord(promptRecord.output_spec)
      ? promptRecord.output_spec
      : undefined;

  if (!outputSpec) return '';
  const referenceImages = Array.isArray(outputSpec.referenceImages)
    ? outputSpec.referenceImages
    : Array.isArray(outputSpec.reference_images)
      ? outputSpec.reference_images
      : [];

  if (referenceImages.length === 0) return '';
  const firstReference = referenceImages[0];
  return toReferenceImageUrl(
    firstReference && isRecord(firstReference) ? firstReference.inputImage ?? firstReference : firstReference
  );
};

export const stripLegacyReferenceImages = <T,>(value: T): T => {
  if (!isRecord(value)) return value;
  const next = { ...value };
  delete next.referenceImages;
  delete next.reference_images;
  return next as T;
};

export const stripPromptLegacyReferenceImages = (prompt: MediaPrompt): MediaPrompt => {
  const nextPrompt = { ...(prompt as Record<string, unknown>) };

  if (isRecord(nextPrompt.outputSpec)) {
    nextPrompt.outputSpec = stripLegacyReferenceImages(nextPrompt.outputSpec);
  }

  if (isRecord(nextPrompt.output_spec)) {
    nextPrompt.output_spec = stripLegacyReferenceImages(nextPrompt.output_spec);
  }

  return nextPrompt as MediaPrompt;
};

export const readTopLevelReferenceImageUrls = (metadata: unknown): string[] => {
  if (!isRecord(metadata)) return [];

  const rows = [
    ...(Array.isArray(metadata.reference_assets) ? metadata.reference_assets : []),
    ...(Array.isArray(metadata.generated_reference_assets) ? metadata.generated_reference_assets : []),
  ];

  return rows.map((item) => toReferenceImageUrl(item)).filter(Boolean);
};

export const normalizePromptReferenceImageUrls = (
  prompts: MediaPrompt[] | undefined,
  fallbackReferenceImageUrls: string[]
): MediaPrompt[] | undefined => {
  if (!prompts?.length) return prompts;

  return prompts.map((prompt, index) => {
    const nextPrompt = stripPromptLegacyReferenceImages(prompt);
    const promptRecord = nextPrompt as Record<string, unknown>;
    const metadata = isRecord(promptRecord.metadata) ? { ...promptRecord.metadata } : {};
    const explicitReferenceImageUrl = toReferenceImageUrl(
      metadata.reference_image_url ?? metadata.referenceImageUrl
    );
    const inferredReferenceImageUrl =
      explicitReferenceImageUrl ||
      readPromptReferenceImageFromOutputSpec(prompt) ||
      toStringValue(fallbackReferenceImageUrls[index] ?? fallbackReferenceImageUrls[0]).trim();

    if (inferredReferenceImageUrl) {
      metadata.reference_image_url = inferredReferenceImageUrl;
    } else {
      delete metadata.reference_image_url;
    }
    delete metadata.referenceImageUrl;

    const referenceMediaId = toStringValue((prompt as Record<string, unknown>).reference_media_id).trim() ||
      toStringValue(metadata.reference_media_id).trim();
    if (referenceMediaId) {
      metadata.reference_media_id = referenceMediaId;
    } else {
      delete metadata.reference_media_id;
    }

    promptRecord.metadata = metadata;
    return promptRecord as MediaPrompt;
  });
};

export const applyReferenceImageMetadata = (
  value: unknown,
  referenceImageUrls: string[]
): unknown => {
  if (!Array.isArray(value)) return value;

  return value.map((entry, index) => {
    if (!isRecord(entry)) return entry;
    const nextEntry: Record<string, unknown> = { ...entry };

    if (isRecord(entry.outputSpec)) {
      nextEntry.outputSpec = stripLegacyReferenceImages(entry.outputSpec);
    }
    if (isRecord(entry.output_spec)) {
      nextEntry.output_spec = stripLegacyReferenceImages(entry.output_spec);
    }

    const metadata = isRecord(entry.metadata) ? { ...entry.metadata } : {};
    const referenceImageUrl =
      toStringValue(referenceImageUrls[index]).trim() ||
      toStringValue(referenceImageUrls[0]).trim();

    if (referenceImageUrl) {
      metadata.reference_image_url = referenceImageUrl;
    } else {
      delete metadata.reference_image_url;
    }
    delete metadata.referenceImageUrl;

    const referenceMediaId = toStringValue(entry.reference_media_id).trim() ||
      toStringValue(metadata.reference_media_id).trim();
    if (referenceMediaId) {
      metadata.reference_media_id = referenceMediaId;
    } else {
      delete metadata.reference_media_id;
    }

    nextEntry.metadata = metadata;
    return nextEntry;
  });
};
