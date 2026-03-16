import { useEffect, useMemo, useState } from 'react';
import API from '../../../api/api';
import { AvailableMediaItem } from '../../../api/clip';
import { ClipPrompt } from '../../../api/structs';
import { AttachmentProvenanceItem, isGeneratedAttachmentSource, mergeAttachmentProvenance, normalizeAttachmentProvenanceItem, readMetadataAttachmentProvenance } from '../../clips/attachmentProvenance';
import { ClipStyleSchema, ClipStyleSummary, createEmptyClipStyleSchema } from '../../../api/clipstyleSchema';
import { extractMusicMediaId, isMusicMedia, normalizeFrontText, readReferenceAssets, toMediaOptionLabel, toProvenanceMediaItem } from './utils';

interface UseEditClipPromptStateArgs {
  isOpen: boolean;
  clip: ClipPrompt;
}

export const useEditClipPromptState = ({ isOpen, clip }: UseEditClipPromptStateArgs) => {
  const [name, setName] = useState('');
  const [style, setStyle] = useState('standard');
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [styles, setStyles] = useState<ClipStyleSummary[]>([]);
  const [styleSchemas, setStyleSchemas] = useState<Record<string, ClipStyleSchema>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [availableMedia, setAvailableMedia] = useState<AvailableMediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [musicMediaId, setMusicMediaId] = useState('');

  const inheritedAttachments = useMemo(() => {
    const metadataAttachments = readMetadataAttachmentProvenance(clip.metadata || {});
    const clipAudioAttachments = (clip.media?.audios || [])
      .map((audio) =>
        normalizeAttachmentProvenanceItem(
          {
            id: audio.id,
            media_id: audio.id,
            type: audio.type || 'audio',
            name: audio.prompt || audio.id,
            url: audio.file_url,
            source: 'clip_media',
            role: 'music',
          },
          { source: 'clip_media', role: 'music' }
        )
      )
      .filter((item): item is AttachmentProvenanceItem => Boolean(item));
    return mergeAttachmentProvenance(metadataAttachments, clipAudioAttachments);
  }, [clip.media?.audios, clip.metadata]);

  useEffect(() => {
    const nextStyle = clip.style?.style || 'standard';
    const nextMetadata = { ...(clip.metadata || {}) };
    if (nextMetadata.frontText !== undefined) nextMetadata.frontText = normalizeFrontText(nextMetadata.frontText);
    setName(clip.name || '');
    setStyle(nextStyle);
    setMetadata(nextMetadata);
    setMusicMediaId(extractMusicMediaId(clip));
    setSchemaError(null);
  }, [clip]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingStyles(true);

    API.getClipStyles()
      .then((fetchedStyles) => {
        if (cancelled) return;
        setSchemaError(null);
        setStyles(fetchedStyles);
        setStyle((currentStyle) => {
          if (fetchedStyles.length > 0 && !fetchedStyles.some((item) => item.id === currentStyle)) {
            return fetchedStyles[0].id;
          }
          return currentStyle;
        });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStyles([]);
        setSchemaError(`Failed to load clip styles from API: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStyles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !style || styleSchemas[style]) return;
    let cancelled = false;
    setIsLoadingSchema(true);
    const styleSummary = styles.find((item) => item.id === style);

    API.getClipStyleSchema(style, styleSummary)
      .then((schema) => {
        if (cancelled) return;
        setSchemaError(null);
        setStyleSchemas((prev) => ({ ...prev, [style]: schema }));
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStyleSchemas((prev) => ({ ...prev, [style]: createEmptyClipStyleSchema(style, styleSummary) }));
        setSchemaError(`Failed to load schema for "${style}": ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchema(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, style, styleSchemas, styles]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingMedia(true);

    API.getAvailableMedia()
      .then((items) => {
        if (cancelled) return;
        const fetched = Array.isArray(items) ? items : [];
        const inheritedMedia = inheritedAttachments.map((item) => toProvenanceMediaItem(item)).filter((item): item is AvailableMediaItem => Boolean(item));
        const deduped = new Map<string, AvailableMediaItem>();
        [...fetched, ...inheritedMedia].forEach((item) => {
          if (!item.id || deduped.has(item.id)) return;
          deduped.set(item.id, item);
        });
        setAvailableMedia(Array.from(deduped.values()));
      })
      .catch(() => {
        if (!cancelled) setAvailableMedia([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMedia(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inheritedAttachments, isOpen]);

  const styleSchema = styleSchemas[style];
  const metadataFields = useMemo(() => styleSchema?.metadataFields || [], [styleSchema]);

  const musicMediaOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    availableMedia.filter(isMusicMedia).forEach((item) => {
      if (!options.has(item.id)) options.set(item.id, { value: item.id, label: toMediaOptionLabel(item) });
    });
    if (musicMediaId && !options.has(musicMediaId)) {
      options.set(musicMediaId, { value: musicMediaId, label: `Current selection (${musicMediaId})` });
    }
    return Array.from(options.values());
  }, [availableMedia, musicMediaId]);

  const selectedMusic = useMemo(() => {
    const existing = availableMedia.find((item) => item.id === musicMediaId);
    if (existing) return existing;
    const inherited = inheritedAttachments.find((item) => (item.media_id || item.id) === musicMediaId);
    return inherited ? toProvenanceMediaItem(inherited) : null;
  }, [availableMedia, inheritedAttachments, musicMediaId]);

  const referenceAssetSelections = useMemo(() => readReferenceAssets(metadata), [metadata]);
  const selectedReferenceKeys = useMemo(() => new Set(referenceAssetSelections.map((item) => item.media_id || item.id)), [referenceAssetSelections]);
  const generatedInheritedAttachments = useMemo(
    () => inheritedAttachments.filter((item) => isGeneratedAttachmentSource(item.source) || Boolean(item.source_checkpoint_id)),
    [inheritedAttachments]
  );

  const handleMetadataChange = (key: string, value: unknown) => setMetadata((prev) => ({ ...prev, [key]: value }));

  const toggleReferenceAsset = (item: AttachmentProvenanceItem) => {
    const assetKey = item.media_id || item.id;
    if (!assetKey) return;

    setMetadata((previous) => {
      const current = readReferenceAssets(previous);
      const exists = current.some((entry) => (entry.media_id || entry.id) === assetKey);
      const next = exists
        ? current.filter((entry) => (entry.media_id || entry.id) !== assetKey)
        : [...current, item];
      return { ...previous, reference_assets: next };
    });
  };

  return {
    name,
    setName,
    style,
    setStyle,
    metadata,
    setMetadata,
    styles,
    styleSchema,
    metadataFields,
    isLoading,
    setIsLoading,
    isLoadingStyles,
    isLoadingSchema,
    schemaError,
    isLoadingMedia,
    availableMedia,
    musicMediaId,
    setMusicMediaId,
    musicMediaOptions,
    selectedMusic,
    inheritedAttachments,
    generatedInheritedAttachments,
    selectedReferenceKeys,
    handleMetadataChange,
    toggleReferenceAsset,
  };
};
