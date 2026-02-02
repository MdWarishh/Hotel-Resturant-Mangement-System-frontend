import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  'http://localhost:5000';

let socket = null;

/**
 * POS Socket Singleton
 * - Shared across POS screens
 */
export const getPOSSocket = () => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/pos`, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

/**
 * Connect socket safely
 */
export const connectPOSSocket = (token) => {
  const s = getPOSSocket();

  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }

  return s;
};

/**
 * Disconnect socket
 */
export const disconnectPOSSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};