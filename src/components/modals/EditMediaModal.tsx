import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';
import { AvailableMediaItem } from '../../api/clip';
import { MediaItem } from '../../api/structs/media';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { ClipStyleField } from '../../api/clipstyleSchema';
import { Modal } from '../modals';
import CheckpointProviderSelector from '../selectors/CheckpointProviderSelector';
import { Button, Input, TextArea } from '../ui';
import { useToast } from '../../hooks/useToast';

interface EditMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  outputSpec?: MediaOutputSpec;
  metadataFields?: ClipStyleField[];
  onSuccess: () => void;
}

const POSITION_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'center', label: 'Center' },
];

const humanizeField = (key: string): string =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const buildInitialMetadata = (item: MediaItem): Record<string, unknown> => {
  const metadata = { ...toRecord(item.metadata) };
  const rawItem = item as unknown as Record<string, unknown>;

  ['text', 'position', 'topText', 'bottomText'].forEach((key) => {
    if (!(key in metadata) && rawItem[key] !== undefined && rawItem[key] !== null) {
      metadata[key] = rawItem[key];
    }
  });

  return metadata;
};

const extractReplacementMediaId = (metadata: Record<string, unknown>): string => {
  const mediaRef = toRecord(metadata.media_item_ref ?? metadata.mediaItemRef);
  return (
    toStringValue(metadata.replacement_media_id) ||
    toStringValue(metadata.replacementMediaId) ||
    toStringValue(metadata.media_item_id) ||
    toStringValue(metadata.mediaItemId) ||
    toStringValue(mediaRef.media_id ?? mediaRef.mediaId ?? mediaRef.id)
  );
};

const normalizeMediaType = (value: string): 'image' | 'video' | 'audio' | 'unknown' => {
  const lowered = value.toLowerCase();
  if (lowered === 'image') return 'image';
  if (lowered === 'ai_video' || lowered === 'video') return 'video';
  if (lowered === 'audio' || lowered.includes('music')) return 'audio';
  return 'unknown';
};

const isReplacementCandidate = (item: AvailableMediaItem, currentType: MediaItem['type']): boolean => {
  const candidateType = normalizeMediaType(item.type);
  const requiredType = normalizeMediaType(currentType);
  if (requiredType === 'unknown') return true;
  if (requiredType === 'audio') return candidateType === 'audio';
  if (requiredType === 'video') return candidateType === 'video';
  if (requiredType === 'image') return candidateType === 'image';
  return true;
};

const normalizeMetadataForSubmit = (
  metadata: Record<string, unknown>,
  replacementMediaId: string
): Record<string, unknown> => {
  const next = { ...metadata };

  delete next.replacement_media_id;
  delete next.replacementMediaId;
  delete next.media_item_id;
  delete next.mediaItemId;
  delete next.media_item_ref;
  delete next.mediaItemRef;

  if (replacementMediaId) {
    next.replacement_media_id = replacementMediaId;
    next.replacementMediaId = replacementMediaId;
    next.media_item_ref = { media_id: replacementMediaId };
  }

  return next;
};

const toSelectorModality = (type: MediaItem['type']): 'image' | 'video' | 'audio' => {
  if (type === 'ai_video') return 'video';
  if (type === 'audio') return 'audio';
  return 'image';
};

const buildOutputSpecForSubmit = (
  baseSpec: MediaOutputSpec | undefined,
  provider: string,
  model: string
): MediaOutputSpec | undefined => {
  const normalizedProvider = toStringValue(provider);
  const normalizedModel = toStringValue(model);
  if (!normalizedProvider && !normalizedModel) return undefined;
  return {
    ...(baseSpec || {}),
    provider: normalizedProvider,
    model: normalizedModel,
  };
};

const inferField = (key: string, value: unknown): ClipStyleField => {
  if (key.toLowerCase().includes('position')) {
    return {
      key,
      label: humanizeField(key),
      type: 'select',
      options: POSITION_OPTIONS,
    };
  }

  if (typeof value === 'boolean') {
    return {
      key,
      label: humanizeField(key),
      type: 'checkbox',
    };
  }

  if (typeof value === 'number') {
    return {
      key,
      label: humanizeField(key),
      type: 'number',
    };
  }

  if (key.toLowerCase().includes('text')) {
    return {
      key,
      label: humanizeField(key),
      type: 'textarea',
    };
  }

  return {
    key,
    label: humanizeField(key),
    type: 'text',
  };
};

const EditMediaModal: React.FC<EditMediaModalProps> = ({
  isOpen,
  onClose,
  item,
  outputSpec,
  metadataFields = [],
  onSuccess,
}) => {
  const toast = useToast();
  const resolvedOutputSpec = useMemo(
    () => item.output_spec ?? outputSpec,
    [item.output_spec, outputSpec]
  );
  const selectorModality = useMemo(() => toSelectorModality(item.type), [item.type]);
  const [prompt, setPrompt] = useState(item.prompt);
  const [metadata, setMetadata] = useState<Record<string, unknown>>(() => buildInitialMetadata(item));
  const [replacementMediaId, setReplacementMediaId] = useState<string>(() =>
    extractReplacementMediaId(buildInitialMetadata(item))
  );
  const [selectedProvider, setSelectedProvider] = useState<string>(
    toStringValue(resolvedOutputSpec?.provider)
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    toStringValue(resolvedOutputSpec?.model)
  );
  const [availableMedia, setAvailableMedia] = useState<AvailableMediaItem[]>([]);
  const [isLoadingMediaCatalog, setIsLoadingMediaCatalog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextMetadata = buildInitialMetadata(item);
    setPrompt(item.prompt);
    setMetadata(nextMetadata);
    setReplacementMediaId(extractReplacementMediaId(nextMetadata));
  }, [item]);

  useEffect(() => {
    setSelectedProvider(toStringValue(resolvedOutputSpec?.provider));
    setSelectedModel(toStringValue(resolvedOutputSpec?.model));
  }, [resolvedOutputSpec?.provider, resolvedOutputSpec?.model, item.id]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingMediaCatalog(true);

    API.getAvailableMedia()
      .then((items) => {
        if (cancelled) return;
        setAvailableMedia(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableMedia([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMediaCatalog(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const resolvedMetadataFields = useMemo(() => {
    if (!metadata || Object.keys(metadata).length === 0) return metadataFields;

    const existingKeys = new Set(metadataFields.map((field) => field.key));
    const inferredFields = Object.entries(metadata)
      .filter(([key]) => !existingKeys.has(key))
      .map(([key, value]) => inferField(key, value));

    return [...metadataFields, ...inferredFields];
  }, [metadata, metadataFields]);

  const replacementOptions = useMemo(
    () => availableMedia.filter((availableItem) => isReplacementCandidate(availableItem, item.type)),
    [availableMedia, item.type]
  );

  const handleMetadataChange = (key: string, value: unknown) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const outputSpecForSubmit = buildOutputSpecForSubmit(
        resolvedOutputSpec,
        selectedProvider,
        selectedModel
      );
      await API.editMediaItem(item.id, {
        new_prompt_string: prompt,
        output_spec: outputSpecForSubmit,
      });

      await API.replaceMediaMetadata(item.id, normalizeMetadataForSubmit(metadata, replacementMediaId));
      onSuccess();
    } catch (error: any) {
      toast({ text: `Failed: ${error.message}`, level: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMetadataField = (field: ClipStyleField) => {
    const value = metadata[field.key] ?? field.defaultValue ?? '';

    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{field.label}</label>
          <TextArea
            value={String(value)}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{field.label}</label>
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

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="flex items-center gap-2">
          <input
            id={`media-field-${field.key}`}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleMetadataChange(field.key, e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor={`media-field-${field.key}`} className="text-sm text-zinc-300">
            {field.label}
          </label>
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{field.label}</label>
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={(e) => handleMetadataChange(field.key, e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  const spec = buildOutputSpecForSubmit(resolvedOutputSpec, selectedProvider, selectedModel);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Media">
      <div className="space-y-4">
        <TextArea
          label="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />

        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">Provider / Model</p>
          <CheckpointProviderSelector
            provider={selectedProvider}
            model={selectedModel}
            modality={selectorModality}
            allowInherit
            inheritLabel="Use clip defaults"
            onProviderChange={(provider) => setSelectedProvider(provider)}
            onModelChange={(model) => setSelectedModel(model)}
          />
          <p className="attachment-meta">
            Leave blank to inherit current clip/pipeline defaults for this media type.
          </p>
        </div>

        {resolvedMetadataFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">Style Metadata</p>
            {resolvedMetadataFields.map(renderMetadataField)}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">Replace Media Reference</p>
          <label htmlFor="replacement-media-select" className="block text-xs uppercase tracking-wide text-zinc-400">
            Replacement Asset
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="replacement-media-select"
              value={replacementMediaId}
              onChange={(e) => setReplacementMediaId(e.target.value)}
              className="w-full select sm:flex-1"
              disabled={isLoadingMediaCatalog}
            >
              <option value="">
                {isLoadingMediaCatalog ? 'Loading media catalog...' : 'Keep generated media'}
              </option>
              {replacementOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.type})
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReplacementMediaId('')}
              disabled={!replacementMediaId}
            >
              Clear
            </Button>
          </div>
          {replacementMediaId && (
            <p className="attachment-meta">
              Replacement reference selected: {replacementMediaId}
            </p>
          )}
          <p className="attachment-meta">
            Saves additive replacement keys (`replacement_media_id`, `replacementMediaId`) for renderer compatibility.
          </p>
        </div>

        {spec && (
          <div className="text-xs text-zinc-500 bg-black/50 border border-white/10 rounded p-2 uppercase tracking-wide">
            <span className="font-medium">Output:</span>{' '}
            {spec.provider}/{spec.model}
            {spec.width && spec.height
              ? ` · ${spec.width}×${spec.height}`
              : ''}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditMediaModal;
