import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay z-[240]"
      onClick={onClose}
    >
      <div
        className={`modal-content p-5 overflow-y-auto ${sizeClasses[size]} animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{title}</h2>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            type="button"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
