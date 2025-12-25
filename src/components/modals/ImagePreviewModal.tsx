import React from 'react';
import Modal from './Modal';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  if (!imageUrl) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Preview">
      <div className="flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;