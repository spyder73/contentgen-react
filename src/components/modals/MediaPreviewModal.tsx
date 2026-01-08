import React from 'react';
import Modal from './Modal';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = 'image',
}) => {
  if (!mediaUrl) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview" size="lg">
      <div className="flex items-center justify-center">
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Preview"
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        )}
      </div>
    </Modal>
  );
};

export default MediaPreviewModal;