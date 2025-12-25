import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ImagePrompt } from '../../api/structs/clip';
import { ImageProvider } from '../../api/structs/providers';
import { Button, TextArea } from '../ui';
import Modal from './Modal';

interface EditImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePrompt: ImagePrompt;
  onSave: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
}

const EditImagePromptModal: React.FC<EditImagePromptModalProps> = ({
  isOpen,
  onClose,
  imagePrompt,
  onSave,
  imageProvider,
  imageModel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (imagePrompt) {
      setPrompt(imagePrompt.prompt || '');
    }
  }, [imagePrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await API.editImagePrompt(
        imagePrompt.id,
        prompt,
        imageProvider,
        imageProvider === 'openrouter' ? imageModel : undefined
      );
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Image Prompt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Image Prompt</label>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image..."
            rows={4}
          />
        </div>

        <div className="text-xs text-muted">
          Using: {imageProvider} {imageProvider === 'openrouter' && `• ${imageModel}`}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading}
            disabled={!prompt.trim()}
          >
            Save & Regenerate
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditImagePromptModal;