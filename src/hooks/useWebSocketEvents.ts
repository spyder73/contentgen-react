import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { ToastMessage } from '../toast';
import { isRecord, toStringValue } from '../api/typeHelpers';

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
  | 'PipelineStarted'
  | 'CheckpointStarted'
  | 'CheckpointCompleted'
  | 'CheckpointFailed'
  | 'PipelinePaused'
  | 'PipelineCompleted'
  | 'PipelineCancelled'
  | 'DistributorCompleted'
  | 'GeneratorProgress'
  | string;


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

interface EventRefreshTargets {
  refreshIdeas: boolean;
  refreshClips: boolean;
}

const PIPELINE_LIFECYCLE_EVENTS = new Set<string>([
  'PipelineStarted',
  'CheckpointStarted',
  'CheckpointCompleted',
  'CheckpointFailed',
  'PipelinePaused',
  'PipelineCompleted',
  'PipelineCancelled',
  'DistributorCompleted',
  'GeneratorProgress',
]);

export const getEventRefreshTargets = (eventType: string): EventRefreshTargets => {
  if (eventType === 'AddPromptIdea' || eventType === 'EditPromptIdea' || eventType === 'DeletePromptIdea') {
    return { refreshIdeas: true, refreshClips: false };
  }

  if (
    eventType === 'UpdateClipPrompt' ||
    eventType === 'UpdateClipPromptFileURL' ||
    eventType === 'UpdateImagePromptFileURL' ||
    eventType === 'UpdateAIVideoPromptFileURL' ||
    eventType === 'run_update'
  ) {
    return { refreshIdeas: false, refreshClips: true };
  }

  if (PIPELINE_LIFECYCLE_EVENTS.has(eventType)) {
    return { refreshIdeas: false, refreshClips: false };
  }

  return { refreshIdeas: false, refreshClips: false };
};

interface UseWebSocketEventsOptions {
  onRefreshIdeas: () => void;
  onRefreshClips: () => void;
  onToast?: (message: string | ToastMessage) => void;
}

export function useWebSocketEvents({ onRefreshIdeas, onRefreshClips, onToast }: UseWebSocketEventsOptions) {
  const handleEvent = useCallback((eventType: WebSocketEventType, data: any) => {
    const targets = getEventRefreshTargets(eventType);
    if (targets.refreshIdeas) {
      onRefreshIdeas();
    }
    if (targets.refreshClips) {
      onRefreshClips();
    }

    switch (eventType) {
      case 'AddPromptIdea':
      case 'EditPromptIdea':
      case 'DeletePromptIdea':
        console.log('Idea updated');
        break;

      case 'UpdateClipPrompt':
        console.log('Clip updated');
        break;

      case 'UpdateClipPromptFileURL':
        console.log('Clip rendered');
        onToast?.({ text: 'Clip rendered!', level: 'success' });
        break;

      case 'UpdateImagePromptFileURL':
        console.log('Image generated');
        onToast?.({ text: 'Image generated', level: 'success' });
        break;

      case 'UpdateAIVideoPromptFileURL':
        console.log('AI Video generated');
        onToast?.({ text: 'Video generated', level: 'success' });
        break;

      case 'run_update': {
        const toast = buildRunUpdateToast(data);
        if (toast) {
          onToast?.(toast);
        }
        break;
      }

      case 'PipelineCompleted':
        onToast?.({ text: 'Pipeline completed.', level: 'success' });
        break;

      case 'PipelinePaused':
        onToast?.({ text: 'Pipeline paused for review.', level: 'info' });
        break;

      case 'CheckpointFailed':
        onToast?.({ text: 'A checkpoint failed.', level: 'warning' });
        break;

      case 'PipelineCancelled':
        onToast?.({ text: 'Pipeline cancelled.', level: 'warning' });
        break;

      default:
        console.log('Unknown event:', eventType);
    }
  }, [onRefreshIdeas, onRefreshClips, onToast]);

  useWebSocket({ onEvent: handleEvent });
}
