import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { ToastMessage } from '../toast';

// All known backend webhook events
export type WebSocketEventType =
  | 'AddPromptIdea'
  | 'EditPromptIdea'
  | 'DeletePromptIdea'
  | 'UpdateClipPrompt'
  | 'UpdateClipPromptFileURL'
  | 'UpdateImagePromptFileURL'
  | 'UpdateAIVideoPromptFileURL'
  | 'run_update'
  | string;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const getEventPayload = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) return {};
  return isRecord(value.data) ? value.data : value;
};

const isSchedulerRunUpdate = (payload: Record<string, unknown>): boolean => {
  const explicitType = toStringValue(payload.type).toLowerCase();
  if (explicitType === 'run_update') {
    return true;
  }

  const eventType = toStringValue(payload.event_type).toLowerCase();
  if (eventType.startsWith('run.')) {
    return true;
  }

  const context = [
    payload.kind,
    payload.type,
    payload.run_type,
    payload.scope,
    payload.domain,
    payload.owner,
    payload.source,
    payload.message,
  ]
    .map((item) => toStringValue(item).toLowerCase())
    .join(' ');

  return (
    context.includes('scheduler') ||
    context.includes('schedule') ||
    context.includes('publish') ||
    context.includes('posting')
  );
};

export const buildRunUpdateToast = (rawEvent: unknown): ToastMessage | null => {
  const payload = getEventPayload(rawEvent);
  if (!isSchedulerRunUpdate(payload)) return null;

  const status = toStringValue(
    payload.status ?? payload.run_status ?? payload.state
  ).toLowerCase();
  const message =
    toStringValue(payload.message) ||
    toStringValue(payload.detail) ||
    toStringValue(payload.error);

  if (status === 'completed' || status === 'succeeded' || status === 'success') {
    return {
      text: message || 'Scheduling run completed.',
      level: 'success',
    };
  }

  if (status === 'failed' || status === 'error') {
    return {
      text: message || 'Scheduling run failed.',
      level: 'error',
    };
  }

  if (status === 'cancelled' || status === 'canceled') {
    return {
      text: message || 'Scheduling run cancelled.',
      level: 'warning',
    };
  }

  if (status === 'queued' || status === 'pending' || status === 'running' || status === 'started') {
    return {
      text: message || 'Scheduling run in progress...',
      level: 'info',
    };
  }

  if (!status && message) {
    return {
      text: message,
      level: 'info',
    };
  }

  return null;
};

interface UseWebSocketEventsOptions {
  onRefreshIdeas: () => void;
  onRefreshClips: () => void;
  onToast?: (message: string | ToastMessage) => void;
}

export function useWebSocketEvents({ onRefreshIdeas, onRefreshClips, onToast }: UseWebSocketEventsOptions) {
  const handleEvent = useCallback((eventType: WebSocketEventType, data: any) => {
    switch (eventType) {
      // Idea events - only refresh ideas list
      case 'AddPromptIdea':
      case 'EditPromptIdea':
      case 'DeletePromptIdea':
        console.log('Idea updated');
        onRefreshIdeas();
        break;

      // Clip events - only refresh clips list
      case 'UpdateClipPrompt':
        console.log('Clip updated');
        onRefreshClips();
        break;

      case 'UpdateClipPromptFileURL':
        console.log('Clip rendered');
        onRefreshClips();
        onToast?.({ text: 'Clip rendered!', level: 'success' });
        break;

      // Image events - only refresh clips
      case 'UpdateImagePromptFileURL':
        console.log('Image generated');
        onRefreshClips();
        onToast?.({ text: 'Image generated', level: 'success' });
        break;

      // Video events - only refresh clips
      case 'UpdateAIVideoPromptFileURL':
        console.log('AI Video generated');
        onRefreshClips();
        onToast?.({ text: 'Video generated', level: 'success' });
        break;

      case 'run_update': {
        onRefreshClips();
        const toast = buildRunUpdateToast(data);
        if (toast) {
          onToast?.(toast);
        }
        break;
      }

      default:
        console.log('Unknown event:', eventType);
        // For unknown events, refresh both to be safe
        onRefreshIdeas();
        onRefreshClips();
    }
  }, [onRefreshIdeas, onRefreshClips, onToast]);

  useWebSocket({ onEvent: handleEvent });
}
