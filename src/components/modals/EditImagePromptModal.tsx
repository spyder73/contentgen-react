import React, { useState } from 'react';
import Modal from './Modal';
import { ImagePrompt } from '../../api/api';

interface EditImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePrompt: ImagePrompt;
  onSubmit: (newPrompt: string) => void;
}

const EditImagePromptModal: React.FC<EditImagePromptModalProps> = ({ 
  isOpen, 
  onClose, 
  imagePrompt, 
  onSubmit 
}) => {
  const [prompt, setPrompt] = useState(imagePrompt.prompt);

  const handleSubmit = () => {
    onSubmit(prompt);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Prompt"
      onSubmit={handleSubmit}
      submitText="Save"
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt..."
        className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 min-h-[120px] resize-y"
      />
    </Modal>
  );
};

export default EditImagePromptModal;