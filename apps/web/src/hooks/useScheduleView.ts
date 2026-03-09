import { useMemo } from 'react';
import type { QueueEntry, ScheduleSlot, Doctor } from '@/types';

export type ImportStatus = 'none' | 'pending' | 'imported';

export interface ScheduleViewData {
  namedSlots: ScheduleSlot[];
  regulationSlots: ScheduleSlot[];
  walkIns: QueueEntry[];
  noShowCandidates: ScheduleSlot[];
  delayByDoctor: Map<string, number>;
  doctorStatuses: Map<string, 'free' | 'consulting' | 'late'>;
  importStatus: ImportStatus;
}

export function useScheduleView(
  queue: QueueEntry[],
  _doctors: Doctor[],
  slots: ScheduleSlot[],
  graceMinutes: number,
  doctolibImported: boolean,
): ScheduleViewData {
  return useMemo(() => {
    const now = Date.now();

    // Split slots by type
    const namedSlots = slots
      .filter((s) => s.slotType === 'named')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const regulationSlots = slots
      .filter((s) => s.slotType === 'regulation')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Walk-ins: queue entries without a linked slot and no appointment time
    const linkedEntryIds = new Set(
      slots.filter((s) => s.queueEntry).map((s) => s.queueEntry!.id),
    );
    const walkIns = queue.filter(
      (e) =>
        !linkedEntryIds.has(e.id) &&
        !e.appointmentTime &&
        (e.status === 'WAITING' || e.status === 'NOTIFIED' || e.status === 'IN_CONSULTATION'),
    );

    // No-show candidates: named slots past start + grace with no queue entry arrived
    const noShowCandidates = namedSlots.filter((s) => {
      if (s.queueEntry) return false; // patient already linked
      if (!s.patientName) return false; // no expected patient
      const slotTime = new Date(s.startTime).getTime();
      return now > slotTime + graceMinutes * 60000;
    });

    // Delay per doctor: how many minutes behind schedule
    const delayByDoctor = new Map<string, number>();
    const slotsByDoctor = new Map<string, ScheduleSlot[]>();
    for (const s of namedSlots) {
      const arr = slotsByDoctor.get(s.doctorId) || [];
      arr.push(s);
      slotsByDoctor.set(s.doctorId, arr);
    }
    for (const [doctorId, dSlots] of slotsByDoctor) {
      // Find first slot that should be done but isn't
      const lastOverdue = dSlots.find((s) => {
        const endTime = new Date(s.endTime).getTime();
        return now > endTime && s.queueEntry && s.queueEntry.status !== 'COMPLETED';
      });
      if (lastOverdue) {
        const delayMs = now - new Date(lastOverdue.endTime).getTime();
        delayByDoctor.set(doctorId, Math.round(delayMs / 60000));
      }
    }

    // Doctor statuses derived from queue
    const doctorStatuses = new Map<string, 'free' | 'consulting' | 'late'>();
    for (const entry of queue) {
      if (!entry.doctorId) continue;
      if (entry.status === 'IN_CONSULTATION') {
        doctorStatuses.set(entry.doctorId, 'consulting');
      }
    }
    for (const [doctorId, delay] of delayByDoctor) {
      if (!doctorStatuses.has(doctorId) && delay > 0) {
        doctorStatuses.set(doctorId, 'late');
      }
    }

    const importStatus: ImportStatus = doctolibImported
      ? 'imported'
      : slots.length > 0
        ? 'imported'
        : 'none';

    return {
      namedSlots,
      regulationSlots,
      walkIns,
      noShowCandidates,
      delayByDoctor,
      doctorStatuses,
      importStatus,
    };
  }, [queue, _doctors, slots, graceMinutes, doctolibImported]);
}
