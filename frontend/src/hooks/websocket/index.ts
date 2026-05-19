import { useEffect, useRef, useState } from 'react';
import type { Cells, Status } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
const RECONNECT_DELAY = 2000;

export const useWebSocket = () => {
  const [cells, setCells] = useState<Cells>([]);
  const [status, setStatus] = useState<Status>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connect = () => {
      setStatus((prev) => (prev === 'live' ? 'reconnecting' : 'connecting'));

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('live');
        if (retryRef.current) {
          clearTimeout(retryRef.current);
          retryRef.current = null;
        }
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setCells(data);
        } catch {
          // malformed frame — skip
        }
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        retryRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { cells, status };
};
