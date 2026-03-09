import { useMemo, useState } from 'react';
import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';

const ACTIVE_STATUSES = [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION];

function isActive(entry: QueueEntry): boolean {
  return ACTIVE_STATUSES.includes(entry.status as QueueStatus);
}

function sortEntries(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    // Urgent patients first
    const aUrgent = a.priority === 'urgent' ? 0 : 1;
    const bUrgent = b.priority === 'urgent' ? 0 : 1;
    if (aUrgent !== bUrgent) return aUrgent - bUrgent;

    // IN_CONSULTATION first
    if (a.status === QueueStatus.IN_CONSULTATION && b.status !== QueueStatus.IN_CONSULTATION) return -1;
    if (b.status === QueueStatus.IN_CONSULTATION && a.status !== QueueStatus.IN_CONSULTATION) return 1;

    // Then by position (already computed by backend)
    return a.position - b.position;
  });
}

export function useWaitingRoom(queue: QueueEntry[], doctors: Doctor[]) {
  const [activeDoctorFilter, setDoctorFilter] = useState<string | null>(null);

  const activeEntries = useMemo(
    () => queue.filter(isActive),
    [queue]
  );

  // All patients sorted: urgent first, then by position
  const allPatients = useMemo(
    () => sortEntries(activeEntries),
    [activeEntries]
  );

  // Group by doctor
  const byDoctor = useMemo(() => {
    const map = new Map<string | null, QueueEntry[]>();
    for (const entry of activeEntries) {
      const key = entry.doctorId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    // Sort each group
    for (const [key, entries] of map) {
      map.set(key, sortEntries(entries));
    }
    return map;
  }, [activeEntries]);

  // Filtered view when a doctor filter is active
  const filteredPatients = useMemo(() => {
    if (!activeDoctorFilter) return allPatients;
    return allPatients.filter(e => e.doctorId === activeDoctorFilter);
  }, [allPatients, activeDoctorFilter]);

  // Waiting counts per doctor (for ASCallNextSheet)
  const waitingByDoctor = useMemo(() => {
    const map = new Map<string, number>();
    for (const doc of doctors) {
      map.set(doc.id, 0);
    }
    for (const entry of activeEntries) {
      if (entry.doctorId && (entry.status === QueueStatus.WAITING || entry.status === QueueStatus.NOTIFIED)) {
        map.set(entry.doctorId, (map.get(entry.doctorId) || 0) + 1);
      }
    }
    return map;
  }, [activeEntries, doctors]);

  // Unassigned waiting patients (no doctorId) — callable by any doctor
  const unassignedWaiting = useMemo(() => {
    return activeEntries.filter(
      (e) => !e.doctorId && (e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
    ).length;
  }, [activeEntries]);

  return {
    allPatients: filteredPatients,
    byDoctor,
    activeDoctorFilter,
    setDoctorFilter,
    waitingByDoctor,
    unassignedWaiting,
  };
}
