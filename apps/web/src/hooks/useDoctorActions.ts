import { useCallback } from 'react';
import { api } from '@/lib/api';
import type { DoctorState } from '@/types';

export function useDoctorActions(onRefresh: () => void) {
  const updateState = useCallback(async (doctorId: string, state: DoctorState, homeVisitETA?: string) => {
    await api.updateDoctorState(doctorId, state, homeVisitETA);
    onRefresh();
  }, [onRefresh]);

  const callNext = useCallback(async (_doctorId: string) => {
    // Delegates to the existing callNext mechanism
    // This is handled by the dashboard's onCallNextForDoctor
  }, []);

  const markAbsent = useCallback(async (doctorId: string, option: 'close' | 'reassign' | 'keep' = 'keep') => {
    await api.handleDoctorAbsence(doctorId, option);
    onRefresh();
  }, [onRefresh]);

  const notifyDelay = useCallback(async (doctorId: string, delayMinutes?: number) => {
    await api.notifyDelay(doctorId, delayMinutes);
  }, []);

  const togglePause = useCallback(async (doctorId: string, currentState: DoctorState) => {
    const newState = currentState === 'pause' ? 'free' : 'pause';
    await api.updateDoctorState(doctorId, newState);
    onRefresh();
  }, [onRefresh]);

  const setHomeVisit = useCallback(async (doctorId: string, eta?: string) => {
    await api.updateDoctorState(doctorId, 'home_visit', eta);
    onRefresh();
  }, [onRefresh]);

  return {
    updateState,
    callNext,
    markAbsent,
    notifyDelay,
    togglePause,
    setHomeVisit,
  };
}
