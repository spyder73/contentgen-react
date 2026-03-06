import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { MediaItem } from '../../api/structs/media';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { Modal } from '../modals';
import { Button, TextArea } from '../ui';

interface EditMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  outputSpec?: MediaOutputSpec;
  onSuccess: () => void;
}

const EditMediaModal: React.FC<EditMediaModalProps> = ({
  isOpen,
  onClose,
  item,
  outputSpec,
  onSuccess,
}) => {
  const [prompt, setPrompt] = useState(item.prompt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPrompt(item.prompt);
  }, [item.prompt]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await API.editMediaItem(item.id, {
        new_prompt_string: prompt,
        output_spec: outputSpec,
      });
      onSuccess();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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

        {spec && (
          <div className="text-xs text-slate-500 bg-slate-800/50 rounded p-2">
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
