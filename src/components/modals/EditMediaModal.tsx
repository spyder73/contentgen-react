import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';
import { MediaItem } from '../../api/structs/media';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { ClipStyleField } from '../../api/clipstyleSchema';
import { Modal } from '../modals';
import { Button, Input, TextArea } from '../ui';

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
  const [prompt, setPrompt] = useState(item.prompt);
  const [metadata, setMetadata] = useState<Record<string, unknown>>(() => buildInitialMetadata(item));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPrompt(item.prompt);
    setMetadata(buildInitialMetadata(item));
  }, [item]);

  const resolvedMetadataFields = useMemo(() => {
    if (!metadata || Object.keys(metadata).length === 0) return metadataFields;

    const existingKeys = new Set(metadataFields.map((field) => field.key));
    const inferredFields = Object.entries(metadata)
      .filter(([key]) => !existingKeys.has(key))
      .map(([key, value]) => inferField(key, value));

    return [...metadataFields, ...inferredFields];
  }, [metadata, metadataFields]);

  const handleMetadataChange = (key: string, value: unknown) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await API.editMediaItem(item.id, {
        new_prompt_string: prompt,
        output_spec: outputSpec,
      });

      await API.replaceMediaMetadata(item.id, metadata);
      onSuccess();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
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

  const spec = item.output_spec ?? outputSpec;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Media">
      <div className="space-y-4">
        <TextArea
          label="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />

        {resolvedMetadataFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">Style Metadata</p>
            {resolvedMetadataFields.map(renderMetadataField)}
          </div>
        )}

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
