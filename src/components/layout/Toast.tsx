import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastMessage } from '../../toast';

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;
  const level = message.level || 'success';
  const iconByLevel = {
    success: '✓',
    info: 'i',
    warning: '!',
    error: 'x',
  } as const;

  return createPortal(
    <div className="toast-shell animate-slide-up" role="status" aria-live="polite">
      <div className="toast-card" data-level={level}>
        <span aria-hidden>{iconByLevel[level]}</span>
        <span className="min-w-0 break-words">{message.text}</span>
        <button onClick={onClose} className="toast-close" type="button" aria-label="Dismiss notification">
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
