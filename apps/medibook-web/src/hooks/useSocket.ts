import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Appointment } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

// Singleton socket instance (survives HMR)
let socketInstance: Socket | null = null;

interface UseSocketOptions {
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onAppointmentCancelled?: (data: { appointmentId: string; reason?: string }) => void;
  onPatientCheckedIn?: (data: { appointmentId: string; queueEntryId: string; position: number }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection
  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected:', socketInstance?.id);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!socketInstance) return;

    const handleAppointmentCreated = (data: { appointment: Appointment }) => {
      optionsRef.current.onAppointmentCreated?.(data.appointment);
    };

    const handleAppointmentUpdated = (data: { appointment: Appointment }) => {
      optionsRef.current.onAppointmentUpdated?.(data.appointment);
    };

    const handleAppointmentCancelled = (data: { appointmentId: string; reason?: string }) => {
      optionsRef.current.onAppointmentCancelled?.(data);
    };

    const handlePatientCheckedIn = (data: { appointmentId: string; queueEntryId: string; position: number }) => {
      optionsRef.current.onPatientCheckedIn?.(data);
    };

    socketInstance.on('appointment:created', handleAppointmentCreated);
    socketInstance.on('appointment:updated', handleAppointmentUpdated);
    socketInstance.on('appointment:cancelled', handleAppointmentCancelled);
    socketInstance.on('patient:checked_in', handlePatientCheckedIn);

    return () => {
      socketInstance?.off('appointment:created', handleAppointmentCreated);
      socketInstance?.off('appointment:updated', handleAppointmentUpdated);
      socketInstance?.off('appointment:cancelled', handleAppointmentCancelled);
      socketInstance?.off('patient:checked_in', handlePatientCheckedIn);
    };
  }, []);

  // Join clinic room
  const joinClinicRoom = useCallback((clinicId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('join:clinic', { clinicId });
      console.log('[Socket] Joining clinic room:', clinicId);
    } else {
      // Wait for connection
      socketInstance?.once('connect', () => {
        socketInstance?.emit('join:clinic', { clinicId });
        console.log('[Socket] Joining clinic room (after connect):', clinicId);
      });
    }
  }, []);

  // Leave clinic room
  const leaveClinicRoom = useCallback((clinicId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('leave:clinic', { clinicId });
      console.log('[Socket] Leaving clinic room:', clinicId);
    }
  }, []);

  return {
    socket: socketInstance,
    joinClinicRoom,
    leaveClinicRoom,
    isConnected: socketInstance?.connected ?? false,
  };
}

export default useSocket;
