import React, { useState } from 'react';
import Modal from './Modal';

interface AddImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

const AddImagePromptModal: React.FC<AddImagePromptModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Image Prompt"
      onSubmit={handleSubmit}
      submitText="Add"
      submitDisabled={!prompt.trim()}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt..."
        className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 min-h-[120px] resize-y"
        autoFocus
      />
    </Modal>
  );
};

export default AddImagePromptModal;