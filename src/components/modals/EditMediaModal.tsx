import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { MediaItem } from '../../api/structs/media';
import { Generator } from '../../api/structs/providers';
import { getStyleConfig, MetadataFieldConfig } from '../../clipStyles';
import { Button, TextArea, Input } from '../ui';
import Modal from './Modal';

interface EditMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem;
  clipStyle: string;
  onSave: () => void;
  generator: Generator;
  model: string;
}

const EditMediaModal: React.FC<EditMediaModalProps> = ({
  isOpen,
  onClose,
  mediaItem,
  clipStyle,
  onSave,
  generator,
  model,
}) => {
  const [prompt, setPrompt] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get metadata fields config for this media type from clipStyle
  const styleConfig = getStyleConfig(clipStyle);
  const metadataFields = styleConfig.mediaMetadataFields[mediaItem.type] || [];

  useEffect(() => {
    if (mediaItem) {
      setPrompt(mediaItem.prompt || '');
      setMetadata(mediaItem.metadata || {});
    }
  }, [mediaItem]);

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Update prompt if changed (triggers regeneration)
      if (prompt !== mediaItem.prompt) {
        await API.editMediaItem(mediaItem.id, {
          new_prompt_string: prompt,
          generator,
          model,
        });
      }

      // Update metadata if changed
      const metadataChanged = JSON.stringify(metadata) !== JSON.stringify(mediaItem.metadata);
      if (metadataChanged) {
        await API.replaceMediaMetadata(mediaItem.id, metadata);
      }

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
              value={value}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
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

  // Also render any existing metadata keys not in the config (for flexibility)
  const existingKeys = Object.keys(metadata).filter(
    (key) => !metadataFields.some((f) => f.key === key)
  );

  const mediaTypeLabel = mediaItem.type === 'ai_video' ? 'AI Video' :
    mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${mediaTypeLabel}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Prompt */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Prompt</label>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Generation prompt..."
            rows={3}
          />
          <p className="text-xs text-slate-500 mt-1">
            Changing the prompt will regenerate the {mediaItem.type.replace('_', ' ')}
          </p>
        </div>

        {/* Configured metadata fields */}
        {metadataFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <p className="text-sm text-slate-400 font-medium">Metadata</p>
            {metadataFields.map(renderMetadataField)}
          </div>
        )}

        {/* Extra metadata (not in config) */}
        {existingKeys.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <p className="text-sm text-slate-500">Additional Metadata</p>
            {existingKeys.map((key) => (
              <div key={key}>
                <label className="block text-sm text-slate-400 mb-1">{key}</label>
                <Input
                  value={metadata[key] || ''}
                  onChange={(e) => handleMetadataChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Generator info */}
        <div className="text-xs text-slate-500">
          Using: {generator} • {model || 'default'}
        </div>

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

export default EditMediaModal;