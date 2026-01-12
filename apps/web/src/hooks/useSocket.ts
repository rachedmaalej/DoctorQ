import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { QueueEntry, QueueStats } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Create a singleton socket that lives outside React
// This ensures it persists across component mounts/unmounts and HMR
let socket: Socket | null = null;

// Store pending room joins to retry on reconnect
let pendingClinicRoom: { clinicId: string; token: string } | null = null;
let pendingPatientRoom: string | null = null;

function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket.io] Creating singleton socket to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected with id:', socket?.id);
      // Re-join pending rooms on connect/reconnect
      if (pendingClinicRoom) {
        console.log('[Socket.io] Re-joining pending clinic room:', pendingClinicRoom.clinicId);
        socket?.emit('join:clinic', pendingClinicRoom);
      }
      if (pendingPatientRoom) {
        console.log('[Socket.io] Re-joining pending patient room:', pendingPatientRoom);
        socket?.emit('join:patient', { entryId: pendingPatientRoom });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error.message);
    });
  }
  return socket;
}

// Clean up socket on HMR for development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('[Socket.io] HMR - disposing socket');
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    pendingClinicRoom = null;
    pendingPatientRoom = null;
  });
}

interface UseSocketOptions {
  onQueueUpdated?: (data: { queue: QueueEntry[]; stats: QueueStats }) => void;
  onPatientCalled?: (data: { position: number; status: string }) => void;
  onPositionChanged?: (data: { entryId: string; newPosition: number; estimatedWait: number }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketInstance = getSocket();

  // Store callbacks in refs to keep them fresh without re-running effect
  const onQueueUpdatedRef = useRef(options.onQueueUpdated);
  const onPatientCalledRef = useRef(options.onPatientCalled);
  const onPositionChangedRef = useRef(options.onPositionChanged);

  // Update refs when callbacks change
  useEffect(() => {
    onQueueUpdatedRef.current = options.onQueueUpdated;
    onPatientCalledRef.current = options.onPatientCalled;
    onPositionChangedRef.current = options.onPositionChanged;
  }, [options.onQueueUpdated, options.onPatientCalled, options.onPositionChanged]);

  // Set up event listeners
  useEffect(() => {
    const handleQueueUpdated = (data: { queue: QueueEntry[]; stats: QueueStats }) => {
      console.log('[Socket.io] Received queue:updated event', data);
      onQueueUpdatedRef.current?.(data);
    };

    const handlePatientCalled = (data: { position: number; status: string }) => {
      console.log('[Socket.io] Received patient:called event', data);
      onPatientCalledRef.current?.(data);
    };

    const handlePositionChanged = (data: { entryId: string; newPosition: number; estimatedWait: number }) => {
      console.log('[Socket.io] Received position:changed event', data);
      onPositionChangedRef.current?.(data);
    };

    const handleJoinedClinic = (data: { clinicId: string }) => {
      console.log('[Socket.io] Successfully joined clinic room:', data.clinicId);
    };

    const handleJoinedPatient = (data: { entryId: string }) => {
      console.log('[Socket.io] Successfully joined patient room:', data.entryId);
    };

    socketInstance.on('queue:updated', handleQueueUpdated);
    socketInstance.on('patient:called', handlePatientCalled);
    socketInstance.on('position:changed', handlePositionChanged);
    socketInstance.on('joined:clinic', handleJoinedClinic);
    socketInstance.on('joined:patient', handleJoinedPatient);

    return () => {
      socketInstance.off('queue:updated', handleQueueUpdated);
      socketInstance.off('patient:called', handlePatientCalled);
      socketInstance.off('position:changed', handlePositionChanged);
      socketInstance.off('joined:clinic', handleJoinedClinic);
      socketInstance.off('joined:patient', handleJoinedPatient);
    };
  }, [socketInstance]);

  const joinClinicRoom = useCallback((clinicId: string, token: string) => {
    console.log('[Socket.io] joinClinicRoom called, clinicId:', clinicId, 'connected:', socketInstance.connected);

    // Store for reconnection
    pendingClinicRoom = { clinicId, token };

    if (socketInstance.connected) {
      console.log('[Socket.io] Emitting join:clinic for room:', clinicId);
      socketInstance.emit('join:clinic', { clinicId, token });
    } else {
      console.log('[Socket.io] Socket not connected yet, will join on connect');
      // The connect handler in getSocket() will handle joining
    }
  }, [socketInstance]);

  const joinPatientRoom = useCallback((entryId: string) => {
    console.log('[Socket.io] joinPatientRoom called, entryId:', entryId, 'connected:', socketInstance.connected);

    // Store for reconnection
    pendingPatientRoom = entryId;

    if (socketInstance.connected) {
      console.log('[Socket.io] Emitting join:patient for room:', entryId);
      socketInstance.emit('join:patient', { entryId });
    } else {
      console.log('[Socket.io] Socket not connected yet, will join on connect');
      // The connect handler in getSocket() will handle joining
    }
  }, [socketInstance]);

  return {
    socket: socketInstance,
    joinClinicRoom,
    joinPatientRoom,
  };
}
