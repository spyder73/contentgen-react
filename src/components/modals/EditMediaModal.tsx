import React, { useState, useEffect } from 'react';
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

const EditMediaModal: React.FC<EditMediaModalProps> = ({
  isOpen,
  onClose,
  item,
  outputSpec,
  metadataFields = [],
  onSuccess,
}) => {
  const [prompt, setPrompt] = useState(item.prompt);
  const [metadata, setMetadata] = useState<Record<string, unknown>>(item.metadata || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPrompt(item.prompt);
    setMetadata(item.metadata || {});
  }, [item.prompt, item.metadata]);

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

        {metadataFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">Style Metadata</p>
            {metadataFields.map(renderMetadataField)}
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
