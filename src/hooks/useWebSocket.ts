import { useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../api/helpers';

type WebSocketEventHandler = (eventType: string, data: any) => void;

interface UseWebSocketOptions {
  onEvent: WebSocketEventHandler;
  reconnectDelay?: number;
  endpoint?: string;
}

export function useWebSocket({ 
  onEvent, 
  reconnectDelay = 3000,
  endpoint = '/webhook'
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const wsUrl = API_BASE_URL.replace('http', 'ws') + endpoint;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.event || data.type;
        console.log('WebSocket event:', eventType, data);
        onEvent(eventType, data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in', reconnectDelay, 'ms');
      reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
    };
  }, [onEvent, reconnectDelay, endpoint]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return wsRef;
}