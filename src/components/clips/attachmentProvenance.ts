import { PipelineRun, PipelineTemplate } from '../../api/structs';
import { isRecord, toNumberValue, toStringValue } from '../../api/typeHelpers';

export interface AttachmentProvenanceItem {
  id: string;
  media_id?: string;
  type: string;
  name: string;
  url?: string;
  mime_type?: string;
  source: string;
  role: string;
  source_run_id?: string;
  source_checkpoint_id?: string;
  source_checkpoint_name?: string;
  source_checkpoint_index?: number;
}


const isMusicLikeType = (type: string, mimeType?: string): boolean => {
  const normalizedType = type.toLowerCase();
  const normalizedMime = (mimeType || '').toLowerCase();
  return (
    normalizedType.includes('music') ||
    normalizedType === 'audio' ||
    normalizedMime.startsWith('audio/')
  );
};

export const isGeneratedAttachmentSource = (source: string): boolean => {
  const normalized = source.toLowerCase();
  return (
    normalized.includes('generated') ||
    normalized.includes('pipeline') ||
    normalized.includes('checkpoint')
  );
};

const inferRole = (
  item: {
    type: string;
    mime_type?: string;
    media_id?: string;
    role?: string;
  },
  runMusicMediaId?: string | null
): string => {
  if (item.role) return item.role;

  const normalizedMusicMediaId = toStringValue(runMusicMediaId);
  if (normalizedMusicMediaId && item.media_id && item.media_id === normalizedMusicMediaId) {
    return 'music';
  }
  if (isMusicLikeType(item.type, item.mime_type)) return 'audio';
  return 'reference';
};

export const normalizeAttachmentProvenanceItem = (
  raw: unknown,
  fallback?: Partial<AttachmentProvenanceItem>
): AttachmentProvenanceItem | null => {
  if (!isRecord(raw)) return null;

  const id =
    toStringValue(raw.id) ||
    toStringValue(raw.media_id ?? raw.mediaId) ||
    toStringValue(raw.url ?? raw.file_url) ||
    toStringValue(fallback?.id);
  if (!id) return null;

  const mediaId =
    toStringValue(raw.media_id ?? raw.mediaId) ||
    toStringValue(fallback?.media_id);
  const type = toStringValue(raw.type) || fallback?.type || 'file';
  const mimeType = toStringValue(raw.mime_type ?? raw.mimeType) || fallback?.mime_type;
  const source = toStringValue(raw.source) || fallback?.source || 'media';
  const role = inferRole(
    {
      type,
      mime_type: mimeType,
      media_id: mediaId || undefined,
      role: toStringValue(raw.role ?? raw.output_role ?? raw.outputRole) || fallback?.role,
    },
    null
  );

  return {
    id,
    media_id: mediaId || undefined,
    type,
    name:
      toStringValue(raw.name ?? raw.filename ?? raw.file_name ?? raw.title) ||
      fallback?.name ||
      id,
    url: toStringValue(raw.url ?? raw.file_url) || fallback?.url,
    mime_type: mimeType || undefined,
    source,
    role,
    source_run_id:
      toStringValue(raw.source_run_id ?? raw.sourceRunId ?? raw.run_id) || fallback?.source_run_id,
    source_checkpoint_id:
      toStringValue(raw.source_checkpoint_id ?? raw.sourceCheckpointId ?? raw.checkpoint_id) ||
      fallback?.source_checkpoint_id,
    source_checkpoint_name:
      toStringValue(raw.source_checkpoint_name ?? raw.sourceCheckpointName ?? raw.checkpoint_name) ||
      fallback?.source_checkpoint_name,
    source_checkpoint_index:
      toNumberValue(raw.source_checkpoint_index ?? raw.sourceCheckpointIndex ?? raw.checkpoint_index) ??
      fallback?.source_checkpoint_index,
  };
};

const dedupeProvenance = (items: AttachmentProvenanceItem[]): AttachmentProvenanceItem[] => {
  const deduped = new Map<string, AttachmentProvenanceItem>();
  items.forEach((item) => {
    const key = [
      item.media_id || item.id,
      item.source,
      item.source_run_id || '',
      item.source_checkpoint_id || '',
      item.source_checkpoint_index ?? '',
    ].join('|');
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });
  return Array.from(deduped.values());
};

export const collectRunAttachmentProvenance = (
  run: PipelineRun,
  template?: PipelineTemplate
): AttachmentProvenanceItem[] => {
  const items: AttachmentProvenanceItem[] = [];
  const normalizedMusicMediaId = toStringValue(run.music_media_id);

  const push = (
    attachment: unknown,
    fallback: Partial<AttachmentProvenanceItem>
  ) => {
    const normalized = normalizeAttachmentProvenanceItem(attachment, fallback);
    if (!normalized) return;

    items.push({
      ...normalized,
      role: inferRole(
        {
          type: normalized.type,
          mime_type: normalized.mime_type,
          media_id: normalized.media_id,
          role: normalized.role,
        },
        normalizedMusicMediaId || null
      ),
    });
  };

  (run.initial_attachments || []).forEach((attachment) => {
    push(attachment, {
      source: 'media',
      source_run_id: run.id,
    });
  });

  (run.results || []).forEach((result, checkpointIndex) => {
    const checkpointName =
      template?.checkpoints?.[checkpointIndex]?.name || result.checkpoint_id || `Checkpoint ${checkpointIndex + 1}`;
    (result.attachments || []).forEach((attachment) => {
      push(attachment, {
        source: 'generated',
        source_run_id: run.id,
        source_checkpoint_id: result.checkpoint_id,
        source_checkpoint_name: checkpointName,
        source_checkpoint_index: checkpointIndex,
      });
    });
  });

  return dedupeProvenance(items);
};

export const readMetadataAttachmentProvenance = (
  metadata: Record<string, unknown> | undefined
): AttachmentProvenanceItem[] => {
  if (!metadata) return [];
  const rawLists = [
    metadata.attachment_provenance,
    metadata.inherited_attachments,
    metadata.reference_assets,
    metadata.generated_reference_assets,
  ].filter(Array.isArray);

  const items = rawLists.flatMap((raw) =>
    (raw as unknown[]).map((item) => normalizeAttachmentProvenanceItem(item)).filter(Boolean) as AttachmentProvenanceItem[]
  );
  return dedupeProvenance(items);
};

export const mergeAttachmentProvenance = (
  first: AttachmentProvenanceItem[],
  second: AttachmentProvenanceItem[]
): AttachmentProvenanceItem[] => dedupeProvenance([...first, ...second]);
