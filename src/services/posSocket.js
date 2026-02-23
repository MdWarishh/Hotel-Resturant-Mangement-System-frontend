// frontend/services/posSocket.js

import { io } from 'socket.io-client';

// ✅ FIX: Socket URL alag hona chahiye — /api prefix nahi chahiye socket ke liye
// NEXT_PUBLIC_API_URL = http://localhost:5000/api  ← HTTP routes ke liye
// Socket URL = http://localhost:5000               ← Socket ke liye (no /api)
const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
  'http://localhost:5000';

console.log('[POS Socket] Socket base URL:', SOCKET_BASE_URL);

let socket = null;

export const getPOSSocket = () => {
  if (!socket) {
    socket = io(`${SOCKET_BASE_URL}/pos`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
      withCredentials: true,
      forceNew: false,
    });

    socket.on('connect', () => {
      console.log('[POS Socket] ✅ Connected to namespace /pos');
      console.log('[POS Socket] Socket ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[POS Socket] ⚠️ Disconnected:', reason);
      if (reason === 'io server disconnect') {
        console.log('[POS Socket] Server disconnected, reconnecting...');
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[POS Socket] ❌ Connection error:', error.message);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[POS Socket] 🔄 Reconnected after', attempt, 'attempts');
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[POS Socket] 🔄 Reconnection attempt', attempt);
    });
  }
  return socket;
};

export const connectPOSSocket = (token = null) => {
  const s = getPOSSocket();

  if (token) {
    s.auth = { token };
  } else {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      s.auth = { token: storedToken };
    }
  }

  if (!s.connected && !s.connecting) {
    console.log('[POS Socket] Attempting connection...');
    s.connect();
  }

  return s;
};

export const disconnectPOSSocket = () => {
  if (socket && socket.connected) {
    console.log('[POS Socket] Disconnecting...');
    socket.disconnect();
    socket = null;
  }
};