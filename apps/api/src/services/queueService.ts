/**
 * Queue Service
 * Core queue operations (add, remove, get patients)
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus, CheckInMethod, Priority, QueueEntry } from '@prisma/client';
import { recalculatePositionsAndStatuses, getNextPosition } from './positionService.js';
import { emitQueueUpdate, emitPatientUpdate, emitAllPatientUpdates } from './notificationService.js';
import { emitToRoom, emitDoctorState } from '../lib/socket.js';
import { getQueueStats, getStartOfToday, computeSmartWaitEstimate, invalidateStatsCache } from './statsService.js';
import { buildDailySnapshot, buildHourlySnapshots, buildDoctorSnapshots, type SnapshotEntry } from './metricsService.js';
import { brand } from '../lib/brand.js';
import { logger } from '../lib/logger.js';

export interface AddPatientInput {
  clinicId: string;
  patientPhone?: string;
  patientName?: string;
  checkInMethod?: CheckInMethod;
  appointmentTime?: Date;
  arrivedAt?: Date;
  doctorId?: string;
  isUrgent?: boolean;
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
    doctorId,
    isUrgent = false,
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
        priority: isUrgent ? Priority.urgent : Priority.normal,
        ...(doctorId && { doctorId }),
        ...(arrivedAt && { arrivedAt }),
      },
    });

    return { entry, isAlreadyCheckedIn: false };
  });

  if (result.isAlreadyCheckedIn) {
    return result as AddPatientResult;
  }

  // Upsert Patient record for autocomplete & visit tracking (non-critical, fire-and-forget)
  if (formattedPhone) {
    try {
      const patient = await prisma.patient.upsert({
        where: { clinicId_phone: { clinicId, phone: formattedPhone } },
        create: {
          clinicId,
          name: patientName || '',
          phone: formattedPhone,
          visitCount: 1,
        },
        update: {
          visitCount: { increment: 1 },
          ...(patientName && { name: patientName }),
        },
      });
      await prisma.queueEntry.update({
        where: { id: result.entry.id },
        data: { patientId: patient.id },
      });
    } catch (err) {
      // Non-critical — queue entry is already created, log and continue
      logger.warn({ err }, 'Failed to upsert Patient record');
    }
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
  emitAllPatientUpdates(clinicId).catch(() => {});

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
export async function callNextPatient(clinicId: string, doctorId?: string): Promise<QueueEntry | null> {
  // Use transaction to ensure atomicity
  const promotedId = await prisma.$transaction(async (tx) => {
    // Complete the current IN_CONSULTATION patient (scoped to doctor if provided)
    const currentInConsultation = await tx.queueEntry.findFirst({
      where: {
        clinicId,
        status: QueueStatus.IN_CONSULTATION,
        ...(doctorId && { doctorId }),
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

    // Find next patient to promote (scoped to doctor if provided)
    // When doctorId is given, also include unassigned patients (doctorId: null)
    const nextPatient = await tx.queueEntry.findFirst({
      where: {
        clinicId,
        ...(doctorId && { OR: [{ doctorId }, { doctorId: null }] }),
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
        isSteppedOut: false,
      },
      orderBy: { position: 'asc' },
    });

    if (!nextPatient) return null;

    // Directly promote to IN_CONSULTATION (bypasses global recalculation
    // which depends on clinic.isDoctorPresent — unreliable in multi-doctor mode)
    await tx.queueEntry.update({
      where: { id: nextPatient.id },
      data: {
        status: QueueStatus.IN_CONSULTATION,
        calledAt: new Date(),
        // Assign the calling doctor if the patient was unassigned
        ...(doctorId && !nextPatient.doctorId && { doctorId }),
      },
    });

    // Set the doctor to 'consulting' state (they were 'free' after previous Terminer)
    if (doctorId) {
      await tx.doctor.update({
        where: { id: doctorId },
        data: { state: 'consulting', stateUpdatedAt: new Date() },
      });
    }

    return nextPatient.id;
  });

  // Invalidate stats cache so next fetch gets fresh seen count
  invalidateStatsCache(clinicId);

  if (!promotedId) {
    // Fire-and-forget: don't block the response on socket emissions
    emitQueueUpdate(clinicId).catch(() => {});
    return null;
  }

  // Recalculate positions and notifications for the rest of the queue
  await recalculatePositionsAndStatuses(clinicId);

  // Return the promoted patient
  const calledPatient = await prisma.queueEntry.findFirst({
    where: { id: promotedId },
  });

  // Emit doctor state change if applicable
  if (doctorId) {
    emitDoctorState(clinicId, doctorId, 'consulting');
  }

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
 *
 * 1. Auto-completes IN_CONSULTATION patients
 * 2. Snapshots enriched stats into DailyStat, HourlyStat, DoctorDailyStat
 * 3. Deletes WAITING/NOTIFIED entries (stale queue)
 * 4. Prunes terminal entries (COMPLETED/NO_SHOW/CANCELLED) from previous days
 */
export async function archiveAndClearQueue(clinicId: string): Promise<{ archived: number; deleted: number }> {
  // Step 1: Auto-complete any patients still IN_CONSULTATION
  await prisma.queueEntry.updateMany({
    where: { clinicId, status: QueueStatus.IN_CONSULTATION },
    data: { status: QueueStatus.COMPLETED, completedAt: new Date() },
  });

  // Step 2: Fetch all today's entries for snapshot building
  const startOfToday = getStartOfToday();
  const todayEntries = await prisma.queueEntry.findMany({
    where: { clinicId, arrivedAt: { gte: startOfToday } },
    select: {
      arrivedAt: true, calledAt: true, completedAt: true,
      status: true, checkInMethod: true, appointmentTime: true,
      priority: true, doctorId: true,
    },
  }) as SnapshotEntry[];

  // Step 3: Build and write enriched snapshots (only if there were patients)
  if (todayEntries.length > 0) {
    const daily = buildDailySnapshot(clinicId, todayEntries, startOfToday);
    const hourly = buildHourlySnapshots(clinicId, todayEntries, startOfToday);
    const doctorStats = buildDoctorSnapshots(clinicId, todayEntries, startOfToday);

    // Upsert DailyStat
    await prisma.dailyStat.upsert({
      where: { clinicId_date: { clinicId, date: daily.date } },
      create: daily,
      update: {
        dayOfWeek: daily.dayOfWeek,
        totalPatients: daily.totalPatients,
        completed: daily.completed,
        noShows: daily.noShows,
        cancelled: daily.cancelled,
        avgWaitMins: daily.avgWaitMins,
        avgConsultationMins: daily.avgConsultationMins,
        maxWaitMins: daily.maxWaitMins,
        minWaitMins: daily.minWaitMins,
        totalWaitMins: daily.totalWaitMins,
        totalConsultMins: daily.totalConsultMins,
        patientsWithWait: daily.patientsWithWait,
        patientsWithConsult: daily.patientsWithConsult,
        checkInQr: daily.checkInQr,
        checkInManual: daily.checkInManual,
        checkInWhatsapp: daily.checkInWhatsapp,
        walkIns: daily.walkIns,
        appointments: daily.appointments,
        emergencies: daily.emergencies,
        peakHour: daily.peakHour,
      },
    });

    // Upsert HourlyStat entries
    for (const h of hourly) {
      await prisma.hourlyStat.upsert({
        where: { clinicId_date_hour: { clinicId, date: h.date, hour: h.hour } },
        create: h,
        update: {
          dayOfWeek: h.dayOfWeek,
          arrivals: h.arrivals,
          completed: h.completed,
          noShows: h.noShows,
          totalWaitMins: h.totalWaitMins,
          totalConsultMins: h.totalConsultMins,
          patientsWithWait: h.patientsWithWait,
          checkInQr: h.checkInQr,
          checkInManual: h.checkInManual,
        },
      });
    }

    // Upsert DoctorDailyStat entries
    for (const d of doctorStats) {
      await prisma.doctorDailyStat.upsert({
        where: { clinicId_doctorId_date: { clinicId, doctorId: d.doctorId, date: d.date } },
        create: d,
        update: {
          totalPatients: d.totalPatients,
          completed: d.completed,
          noShows: d.noShows,
          totalWaitMins: d.totalWaitMins,
          totalConsultMins: d.totalConsultMins,
          patientsWithWait: d.patientsWithWait,
          patientsWithConsult: d.patientsWithConsult,
        },
      });
    }
  }

  // Step 4: Delete WAITING/NOTIFIED entries (stale queue)
  const deleted = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
    },
  });

  // Step 5: Prune terminal entries from previous days (already archived)
  const pruned = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: { in: [QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED] },
      arrivedAt: { lt: startOfToday },
    },
  });

  if (pruned.count > 0) {
    logger.info(`[Archive] Clinic ${clinicId}: pruned ${pruned.count} terminal entries from previous days`);
  }

  invalidateStatsCache(clinicId);
  emitQueueUpdate(clinicId).catch(() => {});

  return { archived: todayEntries.length, deleted: deleted.count };
}

/**
 * Lazy daily reset: ensures today's midnight cleanup ran for a clinic.
 * If the midnight cron missed (server downtime, restart), this runs the
 * same cleanup on the first queue fetch of the day. Idempotent — safe to
 * call multiple times (checks lastDailyResetAt before doing any work).
 */
export async function ensureDailyReset(clinicId: string): Promise<boolean> {
  const startOfToday = getStartOfToday();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { lastDailyResetAt: true },
  });

  if (!clinic) return false;

  // If reset already ran today, no-op
  if (clinic.lastDailyResetAt && clinic.lastDailyResetAt >= startOfToday) {
    return false;
  }

  logger.info(`[Lazy Reset] Clinic ${clinicId}: midnight reset missed, running now...`);

  const { archived, deleted } = await archiveAndClearQueue(clinicId);

  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      isDoctorPresent: false,
      announcement: null,
      announcementAt: null,
      lastDailyResetAt: new Date(),
    },
  });

  emitToRoom(`clinic:${clinicId}`, 'doctor:presence', {
    clinicId,
    isDoctorPresent: false,
  });
  emitToRoom(`clinic:${clinicId}:patients`, 'doctor:presence', {
    clinicId,
    isDoctorPresent: false,
  });

  logger.info(`[Lazy Reset] Clinic ${clinicId}: archived ${archived}, deleted ${deleted}`);
  return true;
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
          enableStepOut: true,
        },
      },
    },
  });

  if (!entry) {
    return null;
  }

  // Auto-expire step-out if > 60 minutes (check-on-access pattern)
  if (entry.isSteppedOut && entry.steppedOutAt) {
    const elapsed = Date.now() - new Date(entry.steppedOutAt).getTime();
    if (elapsed > 60 * 60 * 1000) {
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { isSteppedOut: false, steppedOutAt: null },
      });
      entry.isSteppedOut = false;
      entry.steppedOutAt = null;
    }
  }

  const { estimatedWaitMins, effectiveAvgMins, confidence, doctorAbsent } = await computeSmartWaitEstimate(
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
    isSteppedOut: entry.isSteppedOut,
    stepOutCount: entry.stepOutCount,
    steppedOutAt: entry.steppedOutAt,
    estimatedWaitMins,
    avgConsultationMins: effectiveAvgMins,
    confidence,
    doctorAbsent,
    clinicName: entry.clinic.name,
    doctorName: entry.clinic.doctorName,
    doctorGender: entry.clinic.doctorGender,
    isDoctorPresent: entry.clinic.isDoctorPresent,
    announcement: entry.clinic.announcement,
    announcementAt: entry.clinic.announcementAt,
    specialty: entry.clinic.specialty,
    funFactsEnabled: entry.clinic.funFactsEnabled,
    enableStepOut: entry.clinic.enableStepOut,
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

  // When a patient is completed/no-show, set their doctor to 'free' state
  // This prevents auto-promotion of the next patient until the receptionist clicks "Suivant"
  if ((status === QueueStatus.COMPLETED || status === QueueStatus.NO_SHOW) && updated.doctorId) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: updated.doctorId, clinicId, state: 'consulting' },
    });
    if (doctor) {
      await prisma.doctor.update({
        where: { id: updated.doctorId },
        data: { state: 'free', stateUpdatedAt: new Date() },
      });
      emitDoctorState(clinicId, updated.doctorId, 'free');
    }
  }

  // Recalculate positions if status changed (outside transaction for notifications)
  if (status !== QueueStatus.WAITING) {
    await recalculatePositionsAndStatuses(clinicId);
  }

  // Invalidate stats cache so next fetch gets fresh data
  invalidateStatsCache(clinicId);

  // Fire-and-forget: emit socket updates in background
  emitQueueUpdate(clinicId).catch(() => {});
  emitAllPatientUpdates(clinicId).catch(() => {});

  return updated;
}
