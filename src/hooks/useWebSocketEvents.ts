import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

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
  onRefresh: () => void;
  onToast?: (message: string) => void;
}

export function useWebSocketEvents({ onRefresh, onToast }: UseWebSocketEventsOptions) {
  const handleEvent = useCallback((eventType: WebSocketEventType, data: any) => {
    switch (eventType) {
      // Idea events
      case 'AddPromptIdea':
      case 'EditPromptIdea':
      case 'DeletePromptIdea':
        console.log('Idea updated');
        onRefresh();
        break;

      // Clip events
      case 'UpdateClipPrompt':
        console.log('Clip updated');
        onRefresh();
        break;

      case 'UpdateClipPromptFileURL':
        console.log('Clip rendered');
        onRefresh();
        onToast?.('Clip rendered!');
        break;

      // Image events
      case 'UpdateImagePromptFileURL':
        console.log('Image generated');
        onRefresh();
        break;

      // Video events
      case 'UpdateAIVideoPromptFileURL':
        console.log('AI Video generated');
        onRefresh();
        break;

      // Schedule events
      case 'schedule_update':
        if (data.success) {
          onToast?.(`Scheduled: ${data.message}`);
        } else {
          onToast?.(`Schedule failed: ${data.message}`);
        }
        break;

      default:
        console.log('Unknown event:', eventType);
        // Refresh for unknown events that might affect data
        onRefresh();
    }
  }, [onRefresh, onToast]);

  useWebSocket({ onEvent: handleEvent });
}