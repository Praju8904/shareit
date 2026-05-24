import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook that manages the Socket.IO connection lifecycle.
 * Handles device registration, room management, and nearby device discovery.
 *
 * @param {string} deviceName - The display name for this device
 * @param {string} deviceType - The type of device ('desktop', 'mobile', 'tablet')
 * @returns {Object} Socket state and control functions
 */
export default function useSocket(deviceName, deviceType) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [roomCode, setRoomCode] = useState(null);
  const [roomPeers, setRoomPeers] = useState([]);

  useEffect(() => {
    // Connect directly to the backend to avoid Vite proxy ECONNABORTED errors
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // ── Connection Events ──────────────────────────────────────────────

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
      // Register this device with the signaling server
      socket.emit('register', { deviceName, deviceType });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
      setRoomCode(null);
      setRoomPeers([]);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after all attempts');
    });

    // ── Application Events ─────────────────────────────────────────────

    socket.on('registered', ({ socketId: id }) => {
      console.log('[Socket] Registered with ID:', id);
      setSocketId(id);
    });

    socket.on('nearby-devices', (devices) => {
      console.log('[Socket] Nearby devices:', devices);
      setNearbyDevices(devices);
    });

    socket.on('room-created', ({ roomCode: code }) => {
      console.log('[Socket] Room created:', code);
      setRoomCode(code);
    });

    socket.on('room-joined', ({ roomCode: code, peers }) => {
      console.log('[Socket] Joined room:', code, 'Peers:', peers);
      setRoomCode(code);
      setRoomPeers(peers);
    });

    socket.on('peer-joined', ({ peerId, deviceName: name, deviceType: type }) => {
      console.log('[Socket] Peer joined:', peerId, name, type);
      setRoomPeers((prev) => {
        // Prevent duplicate entries
        if (prev.some((p) => p.peerId === peerId)) return prev;
        return [...prev, { peerId, deviceName: name, deviceType: type }];
      });
    });

    socket.on('peer-left', ({ peerId }) => {
      console.log('[Socket] Peer left:', peerId);
      setRoomPeers((prev) => prev.filter((p) => p.peerId !== peerId));
    });

    // ── Cleanup ────────────────────────────────────────────────────────

    return () => {
      console.log('[Socket] Cleaning up connection');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [deviceName, deviceType]);

  // ── Exposed Actions ────────────────────────────────────────────────────

  const createRoom = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[Socket] Cannot create room: not connected');
      return;
    }
    console.log('[Socket] Creating room...');
    socket.emit('create-room');
  }, []);

  const joinRoom = useCallback((code) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[Socket] Cannot join room: not connected');
      return;
    }
    if (!code || typeof code !== 'string') {
      console.warn('[Socket] Invalid room code');
      return;
    }
    const sanitized = code.toUpperCase().trim();
    console.log('[Socket] Joining room:', sanitized);
    socket.emit('join-room', { roomCode: sanitized });
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[Socket] Cannot leave room: not connected');
      return;
    }
    console.log('[Socket] Leaving room');
    socket.emit('leave-room');
    setRoomCode(null);
    setRoomPeers([]);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    socketId,
    nearbyDevices,
    roomCode,
    roomPeers,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
