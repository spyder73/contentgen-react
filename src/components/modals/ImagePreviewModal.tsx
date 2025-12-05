import React from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <img 
        src={imageUrl} 
        alt="Preview" 
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
      />
    </div>
  );
};

export default ImagePreviewModal;