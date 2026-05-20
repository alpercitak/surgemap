import { useDemo } from '@/hooks/demo';
import { useWebSocket } from '@/hooks/websocket';

const DEMO_MODE = import.meta.env.VITE_RUNTIME_MODE === 'demo';

export const useData = DEMO_MODE ? useDemo : useWebSocket;
