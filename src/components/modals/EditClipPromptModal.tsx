import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';
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

const normalizeMetadataForSubmit = (metadata: Record<string, unknown>): Record<string, unknown> => {
  const normalized = { ...metadata };

  if (normalized.frontText !== undefined) {
    normalized.frontText = normalizeFrontText(normalized.frontText);
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

  useEffect(() => {
    const nextStyle = clip.style?.style || 'standard';
    const nextMetadata = { ...(clip.metadata || {}) };

    if (nextMetadata.frontText !== undefined) {
      nextMetadata.frontText = normalizeFrontText(nextMetadata.frontText);
    }

    setName(clip.name || '');
    setStyle(nextStyle);
    setMetadata(nextMetadata);
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

  const styleSchema = styleSchemas[style];

  const metadataFields = useMemo(() => {
    return styleSchema?.metadataFields || [];
  }, [styleSchema]);

  const handleMetadataChange = (key: string, value: unknown) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await API.editClipPrompt(clip.id, {
        name,
        clipStyle: style,
        metadata: normalizeMetadataForSubmit(metadata),
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
          value={String(value)}
          onChange={(e) => handleMetadataChange(field.key, e.target.value)}
          placeholder={field.placeholder || (field.type === 'select-media' ? 'Media path...' : undefined)}
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
