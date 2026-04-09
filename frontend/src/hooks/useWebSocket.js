import { useEffect, useRef, useState } from 'react';
import { io as ioClient } from 'socket.io-client';

// WebSocket URL can be overridden with Vite env var VITE_WS_URL
const WS_URL = (import.meta && import.meta.env && import.meta.env.VITE_WS_URL) || 'http://localhost:3001';

// singleton socket and listeners so multiple hook users reuse same connection
let socket = null;
let globalListeners = new Set();
let connected = false;

function ensureSocket() {
  if (socket) return socket;
  socket = ioClient(WS_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    connected = true;
    globalListeners.forEach(l => l({ type: 'CONNECT' }));
  });
  socket.on('disconnect', (reason) => {
    connected = false;
    globalListeners.forEach(l => l({ type: 'DISCONNECT', reason }));
  });
  socket.on('event', (ev) => {
    globalListeners.forEach(l => {
      try { l(ev); } catch (e) { console.error('ws listener failed', e); }
    });
  });

  return socket;
}

export default function useWebSocket(onEvent) {
  const listenerRef = useRef(onEvent);
  const [isConnected, setIsConnected] = useState(!!socket && connected);
  const subscribedGymsRef = useRef(new Set());

  // keep latest callback
  useEffect(() => { listenerRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    const s = ensureSocket();

    const wrapped = (ev) => {
      // deliver to local callback if present
      if (listenerRef.current) listenerRef.current(ev);
    };

    globalListeners.add(wrapped);
    // update connection state snapshot
    setIsConnected(!!s && s.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      globalListeners.delete(wrapped);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      // do not close socket here (shared singleton)
    };
  }, []);

  function subscribeGym(gymId) {
    if (!gymId) return;
    ensureSocket();
    if (subscribedGymsRef.current.has(gymId)) return;
    subscribedGymsRef.current.add(gymId);
    try { socket.emit('subscribe', gymId); } catch (e) { console.warn('subscribe emit failed', e); }
  }

  function unsubscribeGym(gymId) {
    if (!gymId) return;
    if (!subscribedGymsRef.current.has(gymId)) return;
    subscribedGymsRef.current.delete(gymId);
    try { socket.emit('unsubscribe', gymId); } catch (e) { console.warn('unsubscribe emit failed', e); }
  }

  return {
    connected: isConnected,
    subscribeGym,
    unsubscribeGym,
  };
}

