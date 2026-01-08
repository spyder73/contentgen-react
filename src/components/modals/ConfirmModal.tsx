import React from 'react';
import { Button } from '../ui';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-slate-300">{message}</p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={buttonVariant} onClick={handleConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;