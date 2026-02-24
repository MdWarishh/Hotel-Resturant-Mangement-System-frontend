// frontend/services/posSocket.js

import { io } from 'socket.io-client';

// URL se /api suffix aur trailing slash hatao
// Pehle SOCKET_URL check karo, phir API_URL se /api hatao
const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:5000';

const SOCKET_BASE_URL = rawUrl
  .replace(/\/api\/?$/, '')  // end mein /api ya /api/ hatao
  .replace(/\/$/, '');        // trailing slash bhi hatao

console.log('[POS Socket] Raw URL:', rawUrl);
console.log('[POS Socket] Socket URL:', SOCKET_BASE_URL);

let socket = null;
let connectionCount = 0;

export const getPOSSocket = () => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    socket = io(`${SOCKET_BASE_URL}/pos`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      autoConnect: false,
      withCredentials: true,
      forceNew: false,
      // ❌ secure option HATAO — ye URL ko corrupt karta hai
      // Socket.IO khud URL se http/https detect kar leta hai
    });

    socket.on('connect', () => {
      console.log('[POS Socket] ✅ Connected | ID:', socket.id);
      console.log('[POS Socket] Transport:', socket.io.engine.transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('[POS Socket] ⚠️ Disconnected:', reason);
      if (reason === 'io server disconnect') {
        setTimeout(() => { if (socket) socket.connect(); }, 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[POS Socket] ❌ Connection error:', error.message);
      // Websocket fail ho to polling pe fallback
      if (socket?.io?.opts?.transports?.[0] === 'websocket') {
        console.log('[POS Socket] Switching to polling fallback...');
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socket.on('reconnect', (attempt) => {
      console.log('[POS Socket] 🔄 Reconnected after', attempt, 'attempts');
      const freshToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (freshToken && socket) socket.auth = { token: freshToken };
    });
  }
  return socket;
};

export const connectPOSSocket = (token = null) => {
  const s = getPOSSocket();
  connectionCount++;

  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (activeToken) s.auth = { token: activeToken };

  if (!s.connected && !s.connecting) {
    console.log('[POS Socket] Connecting to:', SOCKET_BASE_URL);
    s.connect();
  }

  return s;
};

// Reference counting — sirf tab disconnect karo jab koi use na kar raha ho
export const disconnectPOSSocket = () => {
  connectionCount = Math.max(0, connectionCount - 1);
  if (connectionCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
};

// Force disconnect — logout ke time
export const forceDisconnectPOSSocket = () => {
  connectionCount = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};