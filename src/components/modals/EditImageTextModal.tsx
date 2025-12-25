import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ImagePrompt } from '../../api/structs/clip';
import { Button, Input } from '../ui';
import Modal from './Modal';

interface EditImageTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePrompt: ImagePrompt;
  onSave: () => void;
}

const EditImageTextModal: React.FC<EditImageTextModalProps> = ({
  isOpen,
  onClose,
  imagePrompt,
  onSave,
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (imagePrompt) {
      setText(imagePrompt.text || '');
    }
  }, [imagePrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await API.editImageText(imagePrompt.id, text);
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Image Text">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Text Overlay</label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to display on image..."
          />
        </div>

        <p className="text-xs text-muted">
          This text will be overlaid on the image in the final video.
        </p>

        <div className="flex justify-end gap-3">
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

export default EditImageTextModal;