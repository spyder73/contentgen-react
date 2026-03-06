import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';
import { getStyleConfig, MetadataFieldConfig } from '../../clipStyles';
import { ClipStyleSelector } from '../selectors';
import { Button, Input, TextArea } from '../ui';
import Modal from './Modal';

interface EditClipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ClipPrompt;
  onSave: () => void;
}

const EditClipPromptModal: React.FC<EditClipPromptModalProps> = ({ isOpen, onClose, clip, onSave }) => {
  const [name, setName] = useState('');
  const [style, setStyle] = useState('standard');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const styleConfig = getStyleConfig(style);

  useEffect(() => {
    const nextStyle = clip.style?.style || 'standard';
    const nextMetadata = { ...(clip.metadata || {}) };
    if (nextMetadata.frontText !== undefined) {
      if (Array.isArray(nextMetadata.frontText)) {
        nextMetadata.frontText = nextMetadata.frontText.map((v: any) => String(v).trim()).filter(Boolean);
      } else if (typeof nextMetadata.frontText === 'string') {
        nextMetadata.frontText = nextMetadata.frontText.split(/\r?\n/).map((v: string) => v.trim()).filter(Boolean);
      } else {
        nextMetadata.frontText = [];
      }
    }
    setName(clip.name || '');
    setStyle(nextStyle);
    setMetadata(nextMetadata);
  }, [clip]);

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const normalizedMetadata = { ...metadata };
      if (normalizedMetadata.frontText !== undefined) {
        if (Array.isArray(normalizedMetadata.frontText)) {
          normalizedMetadata.frontText = normalizedMetadata.frontText.map((v: any) => String(v).trim()).filter(Boolean);
        } else if (typeof normalizedMetadata.frontText === 'string') {
          normalizedMetadata.frontText = normalizedMetadata.frontText.split(/\r?\n/).map((v: string) => v.trim()).filter(Boolean);
        } else {
          normalizedMetadata.frontText = [];
        }
      }

      await API.editClipPrompt(clip.id, {
        name,
        clipStyle: style,
        metadata: normalizedMetadata,
      });
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMetadataField = (field: MetadataFieldConfig) => {
    const value = metadata[field.key] ?? '';

    if (field.type === 'textarea') {
      const fieldValue =
        field.key === 'frontText'
          ? (Array.isArray(value) ? value.map((v) => String(v)).join('\n') : String(value))
          : String(value);
      return (
        <div key={field.key}>
          <label className="block text-sm text-slate-400 mb-1">
            {field.label}
            {field.description && <span className="text-xs text-slate-500 ml-2">({field.description})</span>}
          </label>
          <TextArea
            value={fieldValue}
            onChange={(e) =>
              handleMetadataChange(
                field.key,
                field.key === 'frontText'
                  ? e.target.value.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)
                  : e.target.value
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
          <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
          <select
            value={value}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
        <Input
          value={value}
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
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clip name..." />
        </div>

        <ClipStyleSelector value={style} onChange={setStyle} />

        {styleConfig.metadataFields.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-700">
            <p className="text-sm text-white font-medium">{styleConfig.name} Settings</p>
            {styleConfig.metadataFields.map(renderMetadataField)}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
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
