/**
 * Queue Service
 * Core queue operations (add, remove, get patients)
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus, CheckInMethod, QueueEntry } from '@prisma/client';
import { recalculatePositionsAndStatuses, getNextPosition } from './positionService.js';
import { emitQueueUpdate, emitPatientUpdate, emitAllPatientUpdates, sendSmsNotification } from './notificationService.js';
import { getQueueStats, getStartOfToday } from './statsService.js';

export interface AddPatientInput {
  clinicId: string;
  patientPhone: string;
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
 * Format a Tunisian phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  return phone.startsWith('+216')
    ? phone
    : `+216${phone.replace(/\D/g, '')}`;
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

  const formattedPhone = formatPhoneNumber(patientPhone);

  // Use transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // Check for duplicate within transaction
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

  // Fetch the updated entry
  const updatedEntry = await prisma.queueEntry.findUnique({
    where: { id: result.entry.id },
  });

  // Emit real-time update
  await emitQueueUpdate(clinicId);

  // If the new patient became IN_CONSULTATION or NOTIFIED, emit to their page
  if (updatedEntry && (updatedEntry.status === QueueStatus.IN_CONSULTATION || updatedEntry.status === QueueStatus.NOTIFIED)) {
    emitPatientUpdate(updatedEntry.id, updatedEntry.position, updatedEntry.status);
  }

  // Send SMS notification to patient (fire-and-forget)
  const finalEntry = updatedEntry || result.entry;
  sendSmsNotification(finalEntry.id, 'QUEUE_JOINED').catch(() => {});

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

  // Emit updates
  await emitQueueUpdate(clinicId);
  await emitAllPatientUpdates(clinicId);

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

  if (!hasRemainingPatients) {
    await emitQueueUpdate(clinicId);
    return null;
  }

  // Recalculate positions and statuses (uses its own transaction)
  await recalculatePositionsAndStatuses(clinicId);

  // Get updated patients and emit to each
  await emitQueueUpdate(clinicId);
  await emitAllPatientUpdates(clinicId);

  // Return the new IN_CONSULTATION patient
  const calledPatient = await prisma.queueEntry.findFirst({
    where: {
      clinicId,
      status: QueueStatus.IN_CONSULTATION,
    },
  });

  // Send SMS notifications (fire-and-forget)
  if (calledPatient) {
    sendSmsNotification(calledPatient.id, 'YOUR_TURN').catch(() => {});
  }

  // Send ALMOST_TURN to the NOTIFIED patient (position #2)
  const notifiedPatient = await prisma.queueEntry.findFirst({
    where: { clinicId, status: QueueStatus.NOTIFIED },
  });
  if (notifiedPatient) {
    sendSmsNotification(notifiedPatient.id, 'ALMOST_TURN').catch(() => {});
  }

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
  await emitQueueUpdate(clinicId);
  await emitAllPatientUpdates(clinicId);

  // Notify the leaving patient
  emitPatientUpdate(entryId, 0, QueueStatus.CANCELLED);

  return { success: true, clinicId };
}

/**
 * Get the active queue for a clinic
 */
export async function getQueue(clinicId: string) {
  const [queue, stats] = await Promise.all([
    prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    }),
    getQueueStats(clinicId),
  ]);

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

  await emitQueueUpdate(clinicId);

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
  const [totalPatients, noShows, patientsWithWait] = await Promise.all([
    prisma.queueEntry.count({
      where: { clinicId, arrivedAt: { gte: startOfToday } },
    }),
    prisma.queueEntry.count({
      where: { clinicId, status: QueueStatus.NO_SHOW, arrivedAt: { gte: startOfToday } },
    }),
    prisma.queueEntry.findMany({
      where: { clinicId, status: QueueStatus.COMPLETED, arrivedAt: { gte: startOfToday }, calledAt: { not: null } },
      select: { arrivedAt: true, calledAt: true },
    }),
  ]);

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

  // Upsert DailyStat (only if there were patients)
  if (totalPatients > 0) {
    const today = new Date(startOfToday);
    today.setUTCHours(12, 0, 0, 0); // Noon UTC to avoid date boundary issues
    await prisma.dailyStat.upsert({
      where: { clinicId_date: { clinicId, date: today } },
      create: { clinicId, date: today, totalPatients, avgWaitMins, noShows },
      update: { totalPatients, avgWaitMins, noShows },
    });
  }

  // Step 3: Delete only WAITING/NOTIFIED entries
  const deleted = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
    },
  });

  await emitQueueUpdate(clinicId);

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
          avgConsultationMins: true,
          isDoctorPresent: true,
          announcement: true,
          announcementAt: true,
        },
      },
    },
  });

  if (!entry) {
    return null;
  }

  const estimatedWaitMins = entry.position * entry.clinic.avgConsultationMins;

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
    avgConsultationMins: entry.clinic.avgConsultationMins,
    clinicName: entry.clinic.name,
    doctorName: entry.clinic.doctorName,
    isDoctorPresent: entry.clinic.isDoctorPresent,
    announcement: entry.clinic.announcement,
    announcementAt: entry.clinic.announcementAt,
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
  completedAt?: Date
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

  // Emit updates
  await emitQueueUpdate(clinicId);
  emitPatientUpdate(updated.id, updated.position, updated.status);

  return updated;
}
