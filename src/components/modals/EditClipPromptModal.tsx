import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';
import { ClipStyleSelector } from '../selectors';
import { getStyleConfig, MetadataFieldConfig } from '../../clipStyles';
import { Button, Input, TextArea } from '../ui';
import Modal from './Modal';

interface EditClipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ClipPrompt;
  onSave: () => void;
}

const EditClipPromptModal: React.FC<EditClipPromptModalProps> = ({
  isOpen,
  onClose,
  clip,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [style, setStyle] = useState('standard');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const styleConfig = getStyleConfig(style);
  const clipStyle = clip.style?.style;

  useEffect(() => {
    if (clip) {
      setName(clip.name || '');
      setStyle(clipStyle || 'standard');
      setMetadata(clip.metadata || {});
    }
  }, [clip]);

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await API.editClipPrompt(clip.id, {
        name,
        clipStyle: style,
        metadata,
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

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key}>
            <label className="block text-sm text-slate-400 mb-1">
              {field.label}
              {field.description && (
                <span className="text-xs text-slate-500 ml-2">({field.description})</span>
              )}
            </label>
            <TextArea
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={(e) => {
                // Split by newlines for array fields
                const newValue = field.description?.includes('per line')
                  ? e.target.value.split('\n')
                  : e.target.value;
                handleMetadataChange(field.key, newValue);
              }}
              placeholder={field.placeholder}
              rows={3}
            />
          </div>
        );

      case 'select':
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
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'select-media':
        // TODO: fetch available media and show selector
        return (
          <div key={field.key}>
            <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
            <Input
              value={value}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              placeholder={field.placeholder || 'Media path...'}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.key}>
            <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
            <Input
              value={value}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Clip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clip name..."
          />
        </div>

        {/* Style */}
        <ClipStyleSelector value={style} onChange={setStyle} />

        {/* Dynamic Metadata Fields */}
        {styleConfig.metadataFields.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-700">
            <p className="text-sm text-white font-medium">
              {styleConfig.name} Settings
            </p>
            {styleConfig.metadataFields.map(renderMetadataField)}
          </div>
        )}

        {/* Actions */}
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