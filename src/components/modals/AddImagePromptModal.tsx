import React, { useState } from 'react';
import API from '../../api/api';
import { ImageProvider } from '../../api/structs/providers';
import { Button, TextArea } from '../ui';
import Modal from './Modal';

interface AddImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  onSuccess: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
}

const AddImagePromptModal: React.FC<AddImagePromptModalProps> = ({
  isOpen,
  onClose,
  clipId,
  onSuccess,
  imageProvider,
  imageModel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await API.createImagePrompt(
        clipId,
        prompt,
        imageProvider,
        imageProvider === 'openrouter' ? imageModel : undefined
      );
      setPrompt('');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Image">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Image Prompt</label>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
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
            Generate
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddImagePromptModal;