import { useCallback } from 'react';
import { api } from '@/lib/api';
import { QueueStatus } from '@/types';

export function usePatientActions(onRefresh: () => void) {
  const markUrgent = useCallback(async (patientId: string) => {
    await api.toggleUrgent(patientId);
    onRefresh();
  }, [onRefresh]);

  const transferToDoctor = useCallback(async (patientId: string, targetDoctorId: string, sourceDoctorId?: string) => {
    await api.transferPatient(sourceDoctorId || '', patientId, targetDoctorId);
    onRefresh();
  }, [onRefresh]);

  const markNoShow = useCallback(async (patientId: string) => {
    await api.updatePatientStatus(patientId, { status: QueueStatus.NO_SHOW });
    onRefresh();
  }, [onRefresh]);

  const callIn = useCallback(async (patientId: string) => {
    await api.updatePatientStatus(patientId, { status: QueueStatus.IN_CONSULTATION });
    onRefresh();
  }, [onRefresh]);

  const markDone = useCallback(async (patientId: string) => {
    await api.updatePatientStatus(patientId, { status: QueueStatus.COMPLETED });
    onRefresh();
  }, [onRefresh]);

  return {
    markUrgent,
    transferToDoctor,
    markNoShow,
    callIn,
    markDone,
  };
}
