import React, { createContext, useCallback, useContext } from 'react';
import { ToastMessage } from '../toast';

type PushToast = (message: ToastMessage) => void;

const ToastContext = createContext<PushToast>(() => {});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pushToast = useCallback<PushToast>(() => {}, []);

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      {/* Toast component is rendered in App.tsx for now — the provider just exposes pushToast */}
    </ToastContext.Provider>
  );
};

/**
 * Access the toast function from any component.
 *
 * Usage:
 * ```ts
 * const toast = useToast();
 * toast({ text: 'Something went wrong', level: 'error' });
 * ```
 */
export const useToast = (): PushToast => useContext(ToastContext);

/** Re-export the provider's internal state setter for App.tsx wiring. */
export const ToastProviderWithState: React.FC<{
  children: React.ReactNode;
  toast: ToastMessage | null;
  setToast: React.Dispatch<React.SetStateAction<ToastMessage | null>>;
}> = ({ children, toast: _toast, setToast }) => {
  const pushToast = useCallback<PushToast>((message) => setToast(message), [setToast]);

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
    </ToastContext.Provider>
  );
};
