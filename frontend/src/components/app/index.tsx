import { useWebSocket } from '@/hooks/websocket';
import { SurgeMap } from '@/components/surgemap';
import { Hud } from '@/components/hud';

export const App = () => {
  const { cells, status } = useWebSocket();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <SurgeMap cells={cells} />
      <Hud cells={cells} status={status} />

      {/* Pulse animation for the status dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
