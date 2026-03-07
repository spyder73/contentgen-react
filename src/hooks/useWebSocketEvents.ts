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
  | 'schedule_update'
  | string;

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

      // Schedule events
      case 'schedule_update':
        if (data.success) {
          onToast?.({ text: `Scheduled: ${data.message}`, level: 'success' });
        } else {
          onToast?.({ text: `Schedule failed: ${data.message}`, level: 'error' });
        }
        break;

      default:
        console.log('Unknown event:', eventType);
        // For unknown events, refresh both to be safe
        onRefreshIdeas();
        onRefreshClips();
    }
  }, [onRefreshIdeas, onRefreshClips, onToast]);

  useWebSocket({ onEvent: handleEvent });
}
