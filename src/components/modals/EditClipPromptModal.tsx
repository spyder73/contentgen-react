import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';
import { AvailableMediaItem } from '../../api/clip';
import {
  AttachmentProvenanceItem,
  isGeneratedAttachmentSource,
  mergeAttachmentProvenance,
  normalizeAttachmentProvenanceItem,
  readMetadataAttachmentProvenance,
} from '../clips/attachmentProvenance';
import {
  ClipStyleField,
  ClipStyleSchema,
  ClipStyleSummary,
  createEmptyClipStyleSchema,
} from '../../api/clipstyleSchema';
import { ClipStyleSelector } from '../selectors';
import { Button, Input, TextArea } from '../ui';
import Modal from './Modal';

interface EditClipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ClipPrompt;
  onSave: () => void;
}

const normalizeFrontText = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const extractMediaId = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!isRecord(value)) return '';

  return toStringValue(
    value.media_id ??
      value.mediaId ??
      value.id
  );
};

const extractMusicMediaId = (clip: ClipPrompt): string => {
  const metadata = clip.metadata || {};
  const metadataMusicId = extractMediaId(
    metadata.music_media_id ??
      metadata.musicMediaId ??
      metadata.music ??
      metadata.music_attachment ??
      metadata.musicAttachment
  );

  if (metadataMusicId) return metadataMusicId;

  const metadataProvenance = readMetadataAttachmentProvenance(metadata);
  const inheritedMusic = metadataProvenance.find((item) => {
    const type = item.type.toLowerCase();
    const role = item.role.toLowerCase();
    return (
      Boolean(item.media_id) &&
      (role === 'music' || type.includes('music') || type === 'audio')
    );
  });
  if (inheritedMusic?.media_id) return inheritedMusic.media_id;

  const firstAudio = clip.media?.audios?.[0];
  return firstAudio?.id || '';
};

const isMusicMedia = (item: AvailableMediaItem): boolean => {
  const type = item.type.toLowerCase();
  if (type.includes('music')) return true;
  if (type === 'audio') return true;
  return Boolean(item.mime_type?.toLowerCase().startsWith('audio/'));
};

const formatSourceLabel = (source?: string): string => {
  const normalized = (source || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('generated') || normalized.includes('pipeline') || normalized.includes('checkpoint')) {
    return 'generated';
  }
  if (normalized.includes('media') || normalized.includes('upload') || normalized.includes('manual')) {
    return 'uploaded';
  }
  return normalized;
};

const toMediaOptionLabel = (item: AvailableMediaItem): string =>
  `${item.name} (${item.type}${item.source ? ` · ${formatSourceLabel(item.source)}` : ''})`;

const toProvenanceMediaItem = (item: AttachmentProvenanceItem): AvailableMediaItem | null => {
  const mediaId = item.media_id || item.id;
  if (!mediaId) return null;
  return {
    id: mediaId,
    media_id: item.media_id || mediaId,
    type: item.type || 'unknown',
    name: item.name || mediaId,
    url: item.url,
    mime_type: item.mime_type,
    source: item.source,
    metadata: {
      role: item.role,
      source_run_id: item.source_run_id,
      source_checkpoint_id: item.source_checkpoint_id,
      source_checkpoint_name: item.source_checkpoint_name,
      source_checkpoint_index: item.source_checkpoint_index,
      inherited_attachment: true,
    },
  };
};

const readReferenceAssets = (metadata: Record<string, unknown>): AttachmentProvenanceItem[] => {
  if (!Array.isArray(metadata.reference_assets)) return [];
  return metadata.reference_assets
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};

const normalizeReferenceAssetsForSubmit = (value: unknown): AttachmentProvenanceItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeAttachmentProvenanceItem(item))
    .filter((item): item is AttachmentProvenanceItem => Boolean(item));
};

const normalizeMetadataForSubmit = (
  metadata: Record<string, unknown>,
  musicMediaId?: string
): Record<string, unknown> => {
  const normalized = { ...metadata };

  if (normalized.frontText !== undefined) {
    normalized.frontText = normalizeFrontText(normalized.frontText);
  }

  const referenceAssets = normalizeReferenceAssetsForSubmit(normalized.reference_assets);
  if (referenceAssets.length > 0) {
    normalized.reference_assets = referenceAssets;
  } else {
    delete normalized.reference_assets;
  }

  if (musicMediaId) {
    normalized.music_media_id = musicMediaId;
    normalized.music = isRecord(normalized.music)
      ? { ...normalized.music, media_id: musicMediaId }
      : { media_id: musicMediaId };
  } else {
    delete normalized.music_media_id;
    if (isRecord(normalized.music)) {
      const nextMusic = { ...normalized.music };
      delete nextMusic.media_id;
      delete nextMusic.mediaId;
      delete nextMusic.id;

      if (Object.keys(nextMusic).length === 0) {
        delete normalized.music;
      } else {
        normalized.music = nextMusic;
      }
    }
  }

  return normalized;
};

const EditClipPromptModal: React.FC<EditClipPromptModalProps> = ({
  isOpen,
  onClose,
  clip,
  onSave,
}) => {
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
          {
            source: 'clip_media',
            role: 'music',
          }
        )
      )
      .filter((item): item is AttachmentProvenanceItem => Boolean(item));

    return mergeAttachmentProvenance(metadataAttachments, clipAudioAttachments);
  }, [clip.media?.audios, clip.metadata]);

  useEffect(() => {
    const nextStyle = clip.style?.style || 'standard';
    const nextMetadata = { ...(clip.metadata || {}) };

    if (nextMetadata.frontText !== undefined) {
      nextMetadata.frontText = normalizeFrontText(nextMetadata.frontText);
    }

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
        if (!cancelled) {
          setIsLoadingStyles(false);
        }
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
        if (!cancelled) {
          setIsLoadingSchema(false);
        }
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
        const inheritedMedia = inheritedAttachments
          .map((item) => toProvenanceMediaItem(item))
          .filter((item): item is AvailableMediaItem => Boolean(item));

        const deduped = new Map<string, AvailableMediaItem>();
        [...fetched, ...inheritedMedia].forEach((item) => {
          if (!item.id) return;
          if (!deduped.has(item.id)) {
            deduped.set(item.id, item);
          }
        });

        setAvailableMedia(Array.from(deduped.values()));
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableMedia([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMedia(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inheritedAttachments, isOpen]);

  const styleSchema = styleSchemas[style];

  const metadataFields = useMemo(() => {
    return styleSchema?.metadataFields || [];
  }, [styleSchema]);

  const musicMediaOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    availableMedia
      .filter(isMusicMedia)
      .forEach((item) => {
        if (!options.has(item.id)) {
          options.set(item.id, {
            value: item.id,
            label: toMediaOptionLabel(item),
          });
        }
      });

    if (musicMediaId && !options.has(musicMediaId)) {
      options.set(musicMediaId, {
        value: musicMediaId,
        label: `Current selection (${musicMediaId})`,
      });
    }

    return Array.from(options.values());
  }, [availableMedia, musicMediaId]);

  const selectedMusic = useMemo(() => {
    const existing = availableMedia.find((item) => item.id === musicMediaId);
    if (existing) return existing;
    const inherited = inheritedAttachments.find(
      (item) => (item.media_id || item.id) === musicMediaId
    );
    return inherited ? toProvenanceMediaItem(inherited) : null;
  }, [availableMedia, inheritedAttachments, musicMediaId]);

  const referenceAssetSelections = useMemo(() => readReferenceAssets(metadata), [metadata]);

  const selectedReferenceKeys = useMemo(
    () =>
      new Set(referenceAssetSelections.map((item) => item.media_id || item.id)),
    [referenceAssetSelections]
  );

  const generatedInheritedAttachments = useMemo(
    () =>
      inheritedAttachments.filter(
        (item) =>
          isGeneratedAttachmentSource(item.source) ||
          Boolean(item.source_checkpoint_id)
      ),
    [inheritedAttachments]
  );

  const handleMetadataChange = (key: string, value: unknown) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const toggleReferenceAsset = (item: AttachmentProvenanceItem) => {
    const assetKey = item.media_id || item.id;
    if (!assetKey) return;

    setMetadata((previous) => {
      const current = readReferenceAssets(previous);
      const exists = current.some((entry) => (entry.media_id || entry.id) === assetKey);
      const next = exists
        ? current.filter((entry) => (entry.media_id || entry.id) !== assetKey)
        : [...current, item];

      return {
        ...previous,
        reference_assets: next,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await API.editClipPrompt(clip.id, {
        name,
        clipStyle: style,
        music_media_id: musicMediaId || null,
        metadata: normalizeMetadataForSubmit(metadata, musicMediaId || undefined),
      });
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMetadataField = (field: ClipStyleField) => {
    const value = metadata[field.key] ?? field.defaultValue ?? '';
    const label = field.required ? `${field.label} *` : field.label;

    if (field.type === 'textarea') {
      const textValue =
        field.key === 'frontText'
          ? normalizeFrontText(value).join('\n')
          : String(value);

      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">
            {label}
            {field.description && <span className="text-[10px] text-zinc-500 ml-2">({field.description})</span>}
          </label>
          <TextArea
            value={textValue}
            onChange={(e) =>
              handleMetadataChange(
                field.key,
                field.key === 'frontText' ? normalizeFrontText(e.target.value) : e.target.value
              )
            }
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
          <select
            value={String(value)}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            className="w-full select"
          >
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'select-media') {
      const selectedMediaId = extractMediaId(value);
      const preferMusic = field.key.toLowerCase().includes('music');
      const mediaOptions = (preferMusic ? availableMedia.filter(isMusicMedia) : availableMedia).map((item) => ({
        value: item.id,
        label: toMediaOptionLabel(item),
      }));

      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
          {mediaOptions.length > 0 ? (
            <select
              value={selectedMediaId}
              onChange={(e) =>
                handleMetadataChange(field.key, e.target.value ? { media_id: e.target.value } : '')
              }
              className="w-full select"
            >
              <option value="">Select media...</option>
              {mediaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={selectedMediaId}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              placeholder={field.placeholder || 'Media ID...'}
            />
          )}
          {isLoadingMedia && <p className="attachment-meta">Loading media catalog...</p>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="flex items-center gap-2">
          <input
            id={`clip-field-${field.key}`}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleMetadataChange(field.key, e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-700"
          />
          <label htmlFor={`clip-field-${field.key}`} className="text-sm text-slate-300">
            {label}
          </label>
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={toStringValue(value)}
          onChange={(e) => handleMetadataChange(field.key, e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Clip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clip name..." />
        </div>

        <ClipStyleSelector
          value={style}
          onChange={setStyle}
          styles={styles}
          isLoading={isLoadingStyles}
        />

        <div className="space-y-2 pt-3 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">Inherited Attachments</p>
          {inheritedAttachments.length === 0 ? (
            <p className="attachment-meta">
              No inherited run attachments were found on this clip prompt.
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-auto pr-1">
              {inheritedAttachments.map((item) => {
                const itemKey = item.media_id || item.id;
                const isReferenceSelected = selectedReferenceKeys.has(itemKey);
                const showReferenceToggle =
                  Boolean(itemKey) &&
                  (isGeneratedAttachmentSource(item.source) || Boolean(item.source_checkpoint_id));
                const originLabel = item.source_checkpoint_name || item.source_checkpoint_id;
                return (
                  <div key={`${item.id}-${item.source}-${item.source_checkpoint_index ?? ''}`} className="attachment-item flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-100 truncate">{item.name}</p>
                      <p className="attachment-meta">
                        {item.type} · role:{' '}
                        {item.role || 'reference'} · source:{' '}
                        {formatSourceLabel(item.source)}
                        {originLabel ? ` · from ${originLabel}` : ''}
                        {item.media_id ? ` · ${item.media_id}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMusicMedia({
                        id: item.media_id || item.id,
                        type: item.type,
                        name: item.name,
                        mime_type: item.mime_type,
                        source: item.source,
                      }) && item.media_id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMusicMediaId(item.media_id || '')}
                        >
                          Use Music
                        </Button>
                      )}
                      {showReferenceToggle && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReferenceAsset(item)}
                        >
                          {isReferenceSelected ? 'Unmark Ref' : 'Use as Ref'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {generatedInheritedAttachments.length > 0 && (
            <p className="attachment-meta">
              Generated pipeline assets can be toggled as `reference_assets` for prompt assembly.
            </p>
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">Music Attachment</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={musicMediaId}
              onChange={(e) => setMusicMediaId(e.target.value)}
              className="w-full select sm:flex-1"
              disabled={isLoadingMedia}
            >
              <option value="">
                {isLoadingMedia ? 'Loading music media...' : 'Select music media...'}
              </option>
              {musicMediaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMusicMediaId('')}
              disabled={!musicMediaId}
            >
              Remove
            </Button>
          </div>
          {selectedMusic && (
            <p className="attachment-meta">
              Selected: {selectedMusic.name} ({selectedMusic.type})
            </p>
          )}
          <p className="attachment-meta">
            Audio options include inherited run attachments and media-library audio items.
          </p>
          <p className="attachment-meta">Save to apply music `media_id` to this clip prompt.</p>
        </div>

        {schemaError && (
          <div className="text-sm text-zinc-200 bg-black/50 border border-white/10 rounded p-2">
            {schemaError}
          </div>
        )}

        {isLoadingSchema && (
          <p className="text-sm text-slate-400">Loading style schema...</p>
        )}

        {metadataFields.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">{styleSchema?.name || style} Settings</p>
            {metadataFields.map(renderMetadataField)}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditClipPromptModal;
