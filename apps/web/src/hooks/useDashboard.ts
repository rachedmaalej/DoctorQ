import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQueueStore } from '@/stores/queueStore';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { QueueStatus } from '@/types';
import type { AddPatientData } from '@/types';

// Helper to create today's date with specific time (HH:MM)
function todayAt(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// Sample patients for demo (ordered by arrival time)
const SAMPLE_PATIENTS: AddPatientData[] = [
  { patientName: 'Kamel T', patientPhone: '+21654678678', arrivedAt: todayAt('10:50') },
  { patientName: 'Rached M', patientPhone: '+21626387742', appointmentTime: '10:00', arrivedAt: todayAt('10:55') },
  { patientName: 'Hela B', patientPhone: '+21655234567', appointmentTime: '10:15', arrivedAt: todayAt('11:00') },
  { patientName: 'Sandra M', patientPhone: '+21671233935', arrivedAt: todayAt('11:05') },
  { patientName: 'Jalila F', patientPhone: '+21622222567', appointmentTime: '10:30', arrivedAt: todayAt('11:25') },
  { patientName: 'Fethi B', patientPhone: '+21621999999', arrivedAt: todayAt('11:25') },
  { patientName: 'Samira K', patientPhone: '+21621999888', appointmentTime: '10:45', arrivedAt: todayAt('11:30') },
  { patientName: 'Mouna C', patientPhone: '+21620222111', arrivedAt: todayAt('11:50') },
  { patientName: 'Amin K', patientPhone: '+21623555000', appointmentTime: '11:00', arrivedAt: todayAt('11:50') },
  { patientName: 'Hejer K', patientPhone: '+21654414141', appointmentTime: '11:30', arrivedAt: todayAt('12:27') },
];

/**
 * Custom hook to manage dashboard state and actions
 * Encapsulates queue operations, doctor presence, and modal state
 */
export function useDashboard() {
  const { clinic } = useAuthStore();
  const { queue, stats, fetchQueue, addPatient, callNext, removePatient, reorderPatient, clearQueue, resetStats } = useQueueStore();

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);

  // Patient removal state
  const [patientToRemove, setPatientToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Queue operation state
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [exitingPatientId, setExitingPatientId] = useState<string | null>(null);
  const [isFillingQueue, setIsFillingQueue] = useState(false);

  // Doctor presence state
  const [isDoctorPresent, setIsDoctorPresent] = useState(() => {
    return clinic?.isDoctorPresent ?? false;
  });
  const [isTogglingPresence, setIsTogglingPresence] = useState(false);

  // Derived state
  const waitingCount = queue.filter(p => p.status === 'WAITING' || p.status === 'NOTIFIED').length;

  // Socket.io connection for real-time updates
  const { joinClinicRoom } = useSocket({
    onQueueUpdated: (data) => {
      logger.log('Dashboard received queue:updated event, refreshing queue');
      useQueueStore.getState().setQueue(data.queue, data.stats);
    },
    onDoctorPresence: (data) => {
      logger.log('[Doctor Presence] Socket event received:', data, 'clinic?.id:', clinic?.id);
      if (data.clinicId === clinic?.id) {
        logger.log('[Doctor Presence] Setting state from socket to:', data.isDoctorPresent);
        setIsDoctorPresent(data.isDoctorPresent);
      } else {
        logger.log('[Doctor Presence] Ignoring socket event - clinicId mismatch');
      }
    },
  });

  // Fetch initial queue data
  useEffect(() => {
    fetchQueue();
  }, []);

  // Polling fallback for cross-device sync when Socket.io doesn't work
  // Polls every 5 seconds to ensure dashboards stay in sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Sync doctor presence from clinic data when it changes (e.g., after login or page refresh)
  // This ensures we use the persisted value from the database
  useEffect(() => {
    if (clinic?.isDoctorPresent !== undefined) {
      logger.log('[Doctor Presence] Syncing from clinic data:', clinic.isDoctorPresent);
      setIsDoctorPresent(clinic.isDoctorPresent);
    }
  }, [clinic?.isDoctorPresent]);

  // Join clinic room for real-time updates
  useEffect(() => {
    logger.log('[Dashboard] useEffect - clinic?.id:', clinic?.id, 'typeof joinClinicRoom:', typeof joinClinicRoom);
    if (clinic?.id) {
      const token = localStorage.getItem('auth_token');
      logger.log('[Dashboard] Token from localStorage:', token ? 'present' : 'missing');
      if (token) {
        logger.log('[Dashboard] Calling joinClinicRoom with:', clinic.id);
        joinClinicRoom(clinic.id, token);
        logger.log('[Dashboard] joinClinicRoom call completed');
      }
    }
  }, [clinic?.id, joinClinicRoom]);

  // Call next patient handler with optimistic updates
  const handleCallNext = useCallback(async () => {
    if (isCallingNext) return;

    try {
      setIsCallingNext(true);

      // Find current IN_CONSULTATION patient for exit animation
      const currentPatient = queue.find(p => p.status === QueueStatus.IN_CONSULTATION);

      if (currentPatient) {
        // Start exit animation
        setExitingPatientId(currentPatient.id);

        // Optimistic update: remove current patient and shift positions immediately
        const optimisticQueue = queue
          .filter(p => p.id !== currentPatient.id)
          .map((p, index) => ({
            ...p,
            position: index + 1,
            status: index === 0 ? QueueStatus.IN_CONSULTATION : index === 1 ? QueueStatus.NOTIFIED : p.status
          }));

        // Update stats optimistically
        const optimisticStats = stats ? {
          ...stats,
          seen: stats.seen + 1,
          waiting: Math.max(0, stats.waiting - 1)
        } : null;

        // Apply optimistic update after animation starts
        setTimeout(() => {
          useQueueStore.getState().setQueue(optimisticQueue, optimisticStats!);
        }, 350);

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Fire API call - Socket.io will reconcile if needed
      callNext().catch(err => {
        fetchQueue();
        logger.error('Failed to call next:', err);
      });

      // Clear exiting state
      setExitingPatientId(null);
    } catch (error) {
      setExitingPatientId(null);
      logger.error('Failed to call next patient:', error);
    } finally {
      setIsCallingNext(false);
    }
  }, [isCallingNext, queue, stats, callNext, fetchQueue]);

  // Remove patient handlers
  const handleRemovePatient = useCallback((id: string) => {
    setPatientToRemove(id);
    setIsConfirmModalOpen(true);
  }, []);

  const confirmRemovePatient = useCallback(async () => {
    if (!patientToRemove) return;

    setIsRemoving(true);
    try {
      await removePatient(patientToRemove);
      setIsConfirmModalOpen(false);
      setPatientToRemove(null);
    } catch (error) {
      logger.error('Failed to remove patient:', error);
    } finally {
      setIsRemoving(false);
    }
  }, [patientToRemove, removePatient]);

  const cancelRemovePatient = useCallback(() => {
    setIsConfirmModalOpen(false);
    setPatientToRemove(null);
  }, []);

  // Clear queue handlers
  const confirmClearQueue = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearQueue();
      // Optimistically clear the local queue immediately
      useQueueStore.getState().setQueue([], stats ? { ...stats, waiting: 0 } : { waiting: 0, seen: 0, avgWait: null, lastConsultationMins: null });
      setIsClearQueueModalOpen(false);
    } catch (error) {
      logger.error('Failed to clear queue:', error);
      // If API fails, refresh to get current state
      await fetchQueue();
    } finally {
      setIsClearing(false);
    }
  }, [clearQueue, fetchQueue, stats]);

  const cancelClearQueue = useCallback(() => {
    setIsClearQueueModalOpen(false);
  }, []);

  // Toggle doctor presence
  const handleToggleDoctorPresent = useCallback(async () => {
    if (isTogglingPresence) return;

    const newValue = !isDoctorPresent;
    logger.log('[Doctor Presence] Toggle clicked, changing from', isDoctorPresent, 'to', newValue);
    setIsTogglingPresence(true);

    // Optimistic update
    setIsDoctorPresent(newValue);
    logger.log('[Doctor Presence] Optimistic update applied:', newValue);

    try {
      const result = await api.setDoctorPresence(newValue);
      logger.log('[Doctor Presence] API response:', result);
    } catch (error) {
      // Revert on error
      logger.error('[Doctor Presence] API error, reverting to:', !newValue);
      setIsDoctorPresent(!newValue);
      logger.error('Failed to update doctor presence:', error);
    } finally {
      setIsTogglingPresence(false);
      logger.log('[Doctor Presence] Toggle complete, current state:', newValue);
    }
  }, [isDoctorPresent, isTogglingPresence]);

  // Fill queue with sample patients for demo
  const handleFillQueue = useCallback(async () => {
    if (isFillingQueue) return;
    setIsFillingQueue(true);
    try {
      for (const patient of SAMPLE_PATIENTS) {
        try {
          await addPatient(patient);
        } catch (error) {
          logger.log(`Skipped ${patient.patientName}: already in queue or error`);
        }
      }
      // Explicitly refresh queue to ensure UI updates
      await fetchQueue();
    } finally {
      setIsFillingQueue(false);
    }
  }, [isFillingQueue, addPatient, fetchQueue]);

  return {
    // Store data
    clinic,
    queue,
    stats,
    waitingCount,

    // Modal state
    isAddModalOpen,
    setIsAddModalOpen,
    isQRModalOpen,
    setIsQRModalOpen,
    isConfirmModalOpen,
    isClearQueueModalOpen,
    setIsClearQueueModalOpen,

    // Loading states
    isRemoving,
    isClearing,
    isCallingNext,
    isFillingQueue,
    isTogglingPresence,

    // Animation state
    exitingPatientId,

    // Doctor presence
    isDoctorPresent,

    // Actions
    handleCallNext,
    handleRemovePatient,
    confirmRemovePatient,
    cancelRemovePatient,
    confirmClearQueue,
    cancelClearQueue,
    handleToggleDoctorPresent,
    handleFillQueue,
    reorderPatient,
    resetStats,
  };
}
