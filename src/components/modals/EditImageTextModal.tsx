import React, { useState } from 'react';
import Modal from './Modal';
import { ImagePrompt } from '../../api/api';

interface EditImageTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePrompt: ImagePrompt;
  onSubmit: (newText: string) => void;
}

const EditImageTextModal: React.FC<EditImageTextModalProps> = ({ 
  isOpen, 
  onClose, 
  imagePrompt, 
  onSubmit 
}) => {
  const [text, setText] = useState(imagePrompt.text);

  const handleSubmit = () => {
    onSubmit(text);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Text"
      onSubmit={handleSubmit}
      submitText="Save"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 min-h-[120px] resize-y"
      />
    </Modal>
  );
};

export default EditImageTextModal;