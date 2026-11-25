import { useEffect, useRef, useState } from 'react';
import type { Cells, DataHook, Status } from '@/types';

// Same-origin only: the backend rejects cross-origin WebSocket requests
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const RECONNECT_DELAY = 2000;

export const useWebSocket = (): DataHook => {
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
      if (wsRef.current) {
        // Detach before closing so onclose doesn't schedule a reconnect after unmount
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return { cells, status };
};
