// src/services/posSocket.js
import { io } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://hotel-resturant-mangement-system.onrender.com'
  : 'http://localhost:5000';

let socket = null;

export const getPOSSocket = () => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/pos`, {
      transports: ['websocket'],          // prefer websocket
      reconnection: true,                 // ← critical
      reconnectionAttempts: 10,           // try 10 times
      reconnectionDelay: 1000,            // 1s delay
      reconnectionDelayMax: 5000,         // max 5s
      timeout: 20000,
      autoConnect: false,                 // we control connect manually
      withCredentials: true,
      forceNew: false,
    });

    // Add global debug listeners (remove in production if you want)
    socket.on('connect', () => {
      console.log('[POS Socket] ✅ Connected to namespace /pos');
    });

    socket.on('disconnect', (reason) => {
      console.log('[POS Socket] ⚠️ Disconnected:', reason);
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

/**
 * Connect with token – safe to call multiple times
 */
export const connectPOSSocket = (token = null) => {
  const s = getPOSSocket();

  // Update auth token every time (in case it changed)
  if (token) {
    s.auth = { token };
  } else {
    // Fallback to localStorage if no token passed
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      s.auth = { token: storedToken };
    }
  }

  // Only connect if not already connected
  if (!s.connected && !s.connecting) {
    console.log('[POS Socket] Attempting connection...');
    s.connect();
  }

  return s;
};

/**
 * Disconnect – use with caution, only when logging out
 */
export const disconnectPOSSocket = () => {
  if (socket && socket.connected) {
    console.log('[POS Socket] Disconnecting...');
    socket.disconnect();
    socket = null; // Reset only on explicit disconnect
  }
};