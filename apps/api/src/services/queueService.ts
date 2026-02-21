/**
 * Queue Service
 * Core queue operations (add, remove, get patients)
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus, CheckInMethod, QueueEntry } from '@prisma/client';
import { recalculatePositionsAndStatuses, getNextPosition } from './positionService.js';
import { emitQueueUpdate, emitPatientUpdate, emitAllPatientUpdates } from './notificationService.js';
import { getQueueStats, getStartOfToday, computeSmartWaitEstimate, invalidateStatsCache } from './statsService.js';
import { brand } from '../lib/brand.js';

export interface AddPatientInput {
  clinicId: string;
  patientPhone?: string;
  patientName?: string;
  checkInMethod?: CheckInMethod;
  appointmentTime?: Date;
  arrivedAt?: Date;
}

export interface AddPatientResult {
  entry: QueueEntry;
  isAlreadyCheckedIn: boolean;
  existingEntry?: QueueEntry;
}

/**
 * Format a phone number to standard international format.
 * Uses the brand's country code (e.g. +216 for Tunisia, +33 for France).
 */
export function formatPhoneNumber(phone: string): string {
  const cc = brand.phone.countryCode;
  return phone.startsWith(cc)
    ? phone
    : `${cc}${phone.replace(/\D/g, '')}`;
}

/**
 * Add a patient to the queue
 * Uses a transaction to ensure atomicity of duplicate check + position get + create
 */
export async function addPatient(input: AddPatientInput): Promise<AddPatientResult> {
  const {
    clinicId,
    patientPhone,
    patientName,
    checkInMethod = CheckInMethod.MANUAL,
    appointmentTime,
    arrivedAt,
  } = input;

  const formattedPhone = patientPhone ? formatPhoneNumber(patientPhone) : '';

  // Use transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // Check for duplicate within transaction (skip if no phone)
    if (formattedPhone) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingEntry = await tx.queueEntry.findFirst({
        where: {
          clinicId,
          patientPhone: formattedPhone,
          status: {
            in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
          },
          arrivedAt: { gte: today },
        },
      });

      if (existingEntry) {
        return { entry: existingEntry, isAlreadyCheckedIn: true, existingEntry };
      }
    }

    // Get next position within transaction
    const maxPosition = await tx.queueEntry.findFirst({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (maxPosition?.position || 0) + 1;

    // Create queue entry
    const entry = await tx.queueEntry.create({
      data: {
        clinicId,
        patientPhone: formattedPhone,
        patientName,
        position,
        status: QueueStatus.WAITING,
        checkInMethod,
        appointmentTime,
        ...(arrivedAt && { arrivedAt }),
      },
    });

    return { entry, isAlreadyCheckedIn: false };
  });

  if (result.isAlreadyCheckedIn) {
    return result as AddPatientResult;
  }

  // Recalculate positions and statuses (uses its own transaction)
  await recalculatePositionsAndStatuses(clinicId);

  // Invalidate stats cache so next fetch gets fresh data
  invalidateStatsCache(clinicId);

  // Fetch the updated entry
  const updatedEntry = await prisma.queueEntry.findUnique({
    where: { id: result.entry.id },
  });

  // Fire-and-forget: emit socket updates in background (don't block HTTP response)
  emitQueueUpdate(clinicId).catch(() => {});

  // If the new patient became IN_CONSULTATION or NOTIFIED, emit to their page
  if (updatedEntry && (updatedEntry.status === QueueStatus.IN_CONSULTATION || updatedEntry.status === QueueStatus.NOTIFIED)) {
    emitPatientUpdate(updatedEntry.id, updatedEntry.position, updatedEntry.status);
  }

  const finalEntry = updatedEntry || result.entry;

  return {
    entry: finalEntry,
    isAlreadyCheckedIn: false,
  };
}

/**
 * Remove a patient from the queue
 * Uses a transaction to ensure atomicity of verify + delete
 */
export async function removePatient(clinicId: string, entryId: string): Promise<boolean> {
  // Use transaction to ensure atomicity
  const deleted = await prisma.$transaction(async (tx) => {
    // Verify entry belongs to clinic
    const entry = await tx.queueEntry.findFirst({
      where: { id: entryId, clinicId },
    });

    if (!entry) {
      return false;
    }

    await tx.queueEntry.delete({ where: { id: entryId } });
    return true;
  });

  if (!deleted) {
    return false;
  }

  // Recalculate positions and statuses (outside transaction for notifications)
  await recalculatePositionsAndStatuses(clinicId);

  // Invalidate stats cache so next fetch gets fresh data
  invalidateStatsCache(clinicId);

  // Fire-and-forget: emit socket updates in background
  emitQueueUpdate(clinicId).catch(() => {});
  emitAllPatientUpdates(clinicId).catch(() => {});

  return true;
}

/**
 * Call the next patient (complete current, advance queue)
 * Uses a transaction to ensure atomicity of complete + advance operations
 */
export async function callNextPatient(clinicId: string): Promise<QueueEntry | null> {
  // Use transaction to ensure atomicity
  const hasRemainingPatients = await prisma.$transaction(async (tx) => {
    // Complete the current IN_CONSULTATION patient
    const currentInConsultation = await tx.queueEntry.findFirst({
      where: {
        clinicId,
        status: QueueStatus.IN_CONSULTATION,
      },
    });

    if (currentInConsultation) {
      await tx.queueEntry.update({
        where: { id: currentInConsultation.id },
        data: {
          status: QueueStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Auto-update doctor's avgConsultationMins via Exponential Moving Average
      if (currentInConsultation.calledAt && currentInConsultation.doctorId) {
        const durationMins = Math.round(
          (Date.now() - currentInConsultation.calledAt.getTime()) / 60000
        );
        // Only update for reasonable durations (1-120 min) to filter anomalies
        if (durationMins >= 1 && durationMins <= 120) {
          const doctor = await tx.doctor.findUnique({
            where: { id: currentInConsultation.doctorId },
            select: { avgConsultationMins: true },
          });
          if (doctor) {
            const alpha = 0.3;
            const newAvg = Math.round(
              alpha * durationMins + (1 - alpha) * doctor.avgConsultationMins
            );
            await tx.doctor.update({
              where: { id: currentInConsultation.doctorId },
              data: { avgConsultationMins: newAvg },
            });
          }
        }
      }

      // Auto-update clinic's avgConsultationMins via EMA (works even without doctorId)
      if (currentInConsultation.calledAt) {
        const durationMins = Math.round(
          (Date.now() - currentInConsultation.calledAt.getTime()) / 60000
        );
        if (durationMins >= 1 && durationMins <= 120) {
          const clinicRecord = await tx.clinic.findUnique({
            where: { id: clinicId },
            select: { avgConsultationMins: true },
          });
          if (clinicRecord) {
            const alpha = 0.3;
            const newAvg = Math.round(
              alpha * durationMins + (1 - alpha) * clinicRecord.avgConsultationMins
            );
            await tx.clinic.update({
              where: { id: clinicId },
              data: { avgConsultationMins: newAvg },
            });
          }
        }
      }
    }

    // Check if there are remaining patients
    const remainingCount = await tx.queueEntry.count({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    });

    return remainingCount > 0;
  });

  // Invalidate stats cache so next fetch gets fresh seen count
  invalidateStatsCache(clinicId);

  if (!hasRemainingPatients) {
    // Fire-and-forget: don't block the response on socket emissions
    emitQueueUpdate(clinicId).catch(() => {});
    return null;
  }

  // Recalculate positions and statuses (uses its own transaction)
  await recalculatePositionsAndStatuses(clinicId);

  // Return the new IN_CONSULTATION patient immediately
  const calledPatient = await prisma.queueEntry.findFirst({
    where: {
      clinicId,
      status: QueueStatus.IN_CONSULTATION,
    },
  });

  // Fire-and-forget: emit socket updates in background (don't block HTTP response)
  emitQueueUpdate(clinicId).catch(() => {});
  emitAllPatientUpdates(clinicId).catch(() => {});

  return calledPatient;
}

/**
 * Patient leaves the queue voluntarily
 * Uses a transaction to ensure atomicity of status check + update
 */
export async function patientLeaveQueue(entryId: string): Promise<{ success: boolean; clinicId?: string }> {
  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.queueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return { success: false };
    }

    // Check if patient can leave
    const nonLeavableStatuses: QueueStatus[] = [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW];
    if (nonLeavableStatuses.includes(entry.status)) {
      return { success: false };
    }

    // Update status to CANCELLED
    await tx.queueEntry.update({
      where: { id: entryId },
      data: { status: QueueStatus.CANCELLED },
    });

    return { success: true, clinicId: entry.clinicId };
  });

  if (!result.success) {
    return { success: false };
  }

  const clinicId = result.clinicId!;

  // Recalculate and notify (outside transaction for notifications)
  await recalculatePositionsAndStatuses(clinicId);

  // Invalidate stats cache so next fetch gets fresh data
  invalidateStatsCache(clinicId);

  // Fire-and-forget: emit socket updates in background
  emitQueueUpdate(clinicId).catch(() => {});
  emitAllPatientUpdates(clinicId).catch(() => {});

  // Notify the leaving patient
  emitPatientUpdate(entryId, 0, QueueStatus.CANCELLED);

  return { success: true, clinicId };
}

/**
 * Get the active queue for a clinic
 */
export async function getQueue(clinicId: string) {
  // Sequential to prevent pgbouncer pool exhaustion
  const queue = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
      },
    },
    orderBy: { position: 'asc' },
  });
  const stats = await getQueueStats(clinicId);

  return { queue, stats };
}

/**
 * Clear all active patients from the queue
 */
export async function clearQueue(clinicId: string): Promise<number> {
  const result = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
      },
    },
  });

  invalidateStatsCache(clinicId);
  emitQueueUpdate(clinicId).catch(() => {});

  return result.count;
}

/**
 * Archive daily stats and clear the queue for midnight reset.
 * Unlike clearQueue(), this:
 * 1. Auto-completes IN_CONSULTATION patients
 * 2. Saves stats to DailyStat before deleting
 * 3. Only deletes WAITING/NOTIFIED (keeps COMPLETED/NO_SHOW)
 */
export async function archiveAndClearQueue(clinicId: string): Promise<{ archived: number; deleted: number }> {
  // Step 1: Auto-complete any patients still IN_CONSULTATION
  await prisma.queueEntry.updateMany({
    where: { clinicId, status: QueueStatus.IN_CONSULTATION },
    data: { status: QueueStatus.COMPLETED, completedAt: new Date() },
  });

  // Step 2: Snapshot today's stats into DailyStat
  const startOfToday = getStartOfToday();
  const totalPatients = await prisma.queueEntry.count({
    where: { clinicId, arrivedAt: { gte: startOfToday } },
  });
  const noShows = await prisma.queueEntry.count({
    where: { clinicId, status: QueueStatus.NO_SHOW, arrivedAt: { gte: startOfToday } },
  });
  const patientsWithWait = await prisma.queueEntry.findMany({
    where: { clinicId, status: QueueStatus.COMPLETED, arrivedAt: { gte: startOfToday }, calledAt: { not: null } },
    select: { arrivedAt: true, calledAt: true, completedAt: true },
  });

  // Exclude the last patient (latest calledAt) from average calculation.
  // Receptionists often forget to close the queue, so the last patient's
  // timing data is unreliable.
  let avgWaitMins: number | null = null;
  if (patientsWithWait.length > 0) {
    const sorted = [...patientsWithWait].sort(
      (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
    );
    const forAverage = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
    const total = forAverage.reduce((sum, e) =>
      sum + Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000), 0);
    avgWaitMins = Math.round(total / forAverage.length);
  }

  // Calculate average consultation duration (completedAt - calledAt)
  let avgConsultationMins: number | null = null;
  const patientsWithConsult = patientsWithWait.filter(e => e.calledAt && e.completedAt);
  if (patientsWithConsult.length > 0) {
    // Exclude last patient (may have been auto-completed at midnight)
    const sorted = [...patientsWithConsult].sort(
      (a, b) => a.completedAt!.getTime() - b.completedAt!.getTime()
    );
    const forAverage = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
    const totalDuration = forAverage.reduce((sum, e) =>
      sum + Math.round((e.completedAt!.getTime() - e.calledAt!.getTime()) / 60000), 0);
    avgConsultationMins = Math.round(totalDuration / forAverage.length);
  }

  // Upsert DailyStat (only if there were patients)
  if (totalPatients > 0) {
    const today = new Date(startOfToday);
    today.setUTCHours(12, 0, 0, 0); // Noon UTC to avoid date boundary issues
    await prisma.dailyStat.upsert({
      where: { clinicId_date: { clinicId, date: today } },
      create: { clinicId, date: today, totalPatients, avgWaitMins, avgConsultationMins, noShows },
      update: { totalPatients, avgWaitMins, avgConsultationMins, noShows },
    });
  }

  // Step 3: Delete only WAITING/NOTIFIED entries
  const deleted = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
    },
  });

  invalidateStatsCache(clinicId);
  emitQueueUpdate(clinicId).catch(() => {});

  return { archived: totalPatients, deleted: deleted.count };
}

/**
 * Get a patient's status (public endpoint)
 */
export async function getPatientStatus(entryId: string) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: {
      clinic: {
        select: {
          name: true,
          doctorName: true,
          doctorGender: true,
          avgConsultationMins: true,
          isDoctorPresent: true,
          announcement: true,
          announcementAt: true,
          specialty: true,
          funFactsEnabled: true,
        },
      },
    },
  });

  if (!entry) {
    return null;
  }

  const { estimatedWaitMins, effectiveAvgMins } = await computeSmartWaitEstimate(
    entry.clinicId,
    entry.position,
    entry.doctorId
  );

  return {
    id: entry.id,
    clinicId: entry.clinicId,
    patientName: entry.patientName,
    patientPhone: entry.patientPhone,
    position: entry.position,
    status: entry.status,
    checkInMethod: entry.checkInMethod,
    appointmentTime: entry.appointmentTime,
    arrivedAt: entry.arrivedAt,
    notifiedAt: entry.notifiedAt,
    calledAt: entry.calledAt,
    completedAt: entry.completedAt,
    estimatedWaitMins,
    avgConsultationMins: effectiveAvgMins,
    clinicName: entry.clinic.name,
    doctorName: entry.clinic.doctorName,
    doctorGender: entry.clinic.doctorGender,
    isDoctorPresent: entry.clinic.isDoctorPresent,
    announcement: entry.clinic.announcement,
    announcementAt: entry.clinic.announcementAt,
    specialty: entry.clinic.specialty,
    funFactsEnabled: entry.clinic.funFactsEnabled,
  };
}

/**
 * Update a patient's status
 * Uses a transaction to ensure atomicity of verify + update
 */
export async function updatePatientStatus(
  clinicId: string,
  entryId: string,
  status: QueueStatus,
  completedAt?: Date,
  calledAt?: Date
): Promise<QueueEntry | null> {
  // Use transaction to ensure atomicity
  const updated = await prisma.$transaction(async (tx) => {
    // Verify entry belongs to clinic
    const entry = await tx.queueEntry.findFirst({
      where: { id: entryId, clinicId },
    });

    if (!entry) {
      return null;
    }

    return tx.queueEntry.update({
      where: { id: entryId },
      data: {
        status,
        ...(calledAt && { calledAt }),
        ...(completedAt && { completedAt }),
      },
    });
  });

  if (!updated) {
    return null;
  }

  // Recalculate positions if status changed (outside transaction for notifications)
  if (status !== QueueStatus.WAITING) {
    await recalculatePositionsAndStatuses(clinicId);
  }

  // Invalidate stats cache so next fetch gets fresh data
  invalidateStatsCache(clinicId);

  // Fire-and-forget: emit socket updates in background
  emitQueueUpdate(clinicId).catch(() => {});
  emitPatientUpdate(updated.id, updated.position, updated.status);

  return updated;
}
