export type ToastLevel = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  level?: ToastLevel;
}
