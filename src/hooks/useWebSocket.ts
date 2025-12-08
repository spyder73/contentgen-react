import { useEffect, useRef } from 'react';

interface ScheduleUpdate {
  type: 'schedule_update';
  video_id: string;
  success: boolean;
  status: string;
  message: string;
}

export const useWebSocket = (
  url: string,
  onRefresh: () => void,
  onScheduleUpdate?: (data: ScheduleUpdate) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const onScheduleUpdateRef = useRef(onScheduleUpdate);

  // Keep refs updated without causing reconnects
  useEffect(() => {
    onRefreshRef.current = onRefresh;
    onScheduleUpdateRef.current = onScheduleUpdate;
  }, [onRefresh, onScheduleUpdate]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let isUnmounting = false;

    const connect = () => {
      if (isUnmounting) return;

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle schedule updates
          if (data.type === 'schedule_update' && onScheduleUpdateRef.current) {
            onScheduleUpdateRef.current(data);
          }

          // Trigger refresh for all messages
          onRefreshRef.current();
        } catch {
          onRefreshRef.current();
        }
      };

      ws.onclose = () => {
        if (!isUnmounting) {
          console.log('WebSocket disconnected, reconnecting in 3s...');
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      isUnmounting = true;
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [url]); // Only reconnect if URL changes
};