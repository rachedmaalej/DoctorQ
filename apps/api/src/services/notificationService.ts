/**
 * Notification Service
 * Handles real-time Socket.io notifications and Web Push to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom, emitPublicQueueUpdate } from '../lib/socket.js';
import { getQueueStats, computeSmartWaitEstimate } from './statsService.js';
import { sendPushToEntry, isPushConfigured } from '../lib/webpush.js';
import { logger } from '../lib/logger.js';

/**
 * Emit queue update to clinic dashboard
 * Sends the full queue and stats to all connected clinic clients
 */
export async function emitQueueUpdate(clinicId: string): Promise<void> {
  try {
    // Parallelize queue fetch and stats — both are independent reads
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

    // Emit to clinic room
    emitToRoom(`clinic:${clinicId}`, 'queue:updated', { queue, stats });

    // Emit to public check-in page viewers (non-sensitive data only)
    const now = new Date();
    const waitingCount = queue.filter(
      (e) => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED
    ).length;
    const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Tunis' }));
    todayStart.setHours(0, 0, 0, 0);
    const [totalToday, clinic] = await Promise.all([
      prisma.queueEntry.count({ where: { clinicId, createdAt: { gte: todayStart } } }),
      prisma.clinic.findUnique({ where: { id: clinicId }, select: { isDoctorPresent: true, avgConsultationMins: true } }),
    ]);
    emitPublicQueueUpdate(clinicId, {
      waitingCount,
      totalToday,
      avgConsultMinutes: clinic?.avgConsultationMins ?? 10,
      isDoctorPresent: clinic?.isDoctorPresent ?? false,
      entries: queue.slice(0, 4).map((e) => ({
        position: e.position,
        initials: e.patientName ? e.patientName.trim().charAt(0).toUpperCase() : '?',
        status: e.status,
        waitMinutes: e.arrivedAt
          ? Math.max(0, Math.round((now.getTime() - new Date(e.arrivedAt).getTime()) / 60000))
          : 0,
      })),
    });

    logger.debug({ clinicId }, 'Emitted queue:updated');
  } catch (error) {
    logger.error({ err: error }, 'Failed to emit queue update');
  }
}

/**
 * Emit patient position/status update to a specific patient's status page.
 * Also sends Web Push notifications for critical status changes (NOTIFIED, IN_CONSULTATION).
 */
export function emitPatientUpdate(
  entryId: string,
  position: number,
  status: string,
  estimatedWaitMins?: number,
  confidence?: 'high' | 'medium' | 'low',
  isSteppedOut?: boolean,
  minWaitMins?: number,
  maxWaitMins?: number,
  hasEmergencyAhead?: boolean,
  positionInDoctorQueue?: number,
  patientsAheadForDoctor?: number,
): void {
  const roomName = `patient:${entryId}`;
  logger.debug({ room: roomName, position, status, estimatedWaitMins, confidence, isSteppedOut }, 'Emitting patient:called');
  emitToRoom(roomName, 'patient:called', {
    position, status, estimatedWaitMins, confidence, isSteppedOut,
    minWaitMins, maxWaitMins, hasEmergencyAhead,
    positionInDoctorQueue, patientsAheadForDoctor,
    updatedAt: new Date().toISOString(),
  });

  // Compute "people ahead" — prefer per-doctor count when available
  const peopleAhead = patientsAheadForDoctor ?? Math.max(0, position - 1);

  // Send Web Push for critical statuses (non-blocking — fire and forget)
  if (isPushConfigured()) {
    if (status === QueueStatus.NOTIFIED) {
      sendPushToEntry(entryId, {
        title: 'Votre tour approche !',
        body: peopleAhead === 1
          ? 'Plus qu\'une personne devant vous.'
          : `Plus que ${peopleAhead} personnes devant vous.`,
        tag: `queue-${entryId}`,
        url: `/patient/status/${entryId}`,
      }).catch((err) => logger.error({ err, entryId }, 'Push notification failed'));
    } else if (status === QueueStatus.IN_CONSULTATION) {
      sendPushToEntry(entryId, {
        title: 'C\'est votre tour !',
        body: 'Présentez-vous maintenant à l\'accueil.',
        tag: `queue-${entryId}`,
        url: `/patient/status/${entryId}`,
      }).catch((err) => logger.error({ err, entryId }, 'Push notification failed'));
    } else if (peopleAhead <= 2 && status === QueueStatus.WAITING) {
      sendPushToEntry(entryId, {
        title: 'Vous avancez',
        body: `Encore ${peopleAhead} personne${peopleAhead > 1 ? 's' : ''} devant vous.`,
        tag: `queue-${entryId}`,
        url: `/patient/status/${entryId}`,
      }).catch((err) => logger.error({ err, entryId }, 'Push notification failed'));
    }
  }
}

/**
 * Emit position changes to all patients in a queue
 * Recomputes wait estimates so patient pages show accurate numbers.
 */
export async function emitAllPatientUpdates(clinicId: string): Promise<void> {
  const patients = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
      },
    },
    orderBy: { position: 'asc' },
    select: {
      id: true, position: true, status: true, doctorId: true, isSteppedOut: true, priority: true,
    },
  });

  // Pre-compute urgent positions for emergency flag
  const urgentPositions = patients
    .filter(p => p.priority === 'urgent')
    .map(p => p.position);

  for (const patient of patients) {
    const { estimatedWaitMins, confidence, minWaitMins, maxWaitMins, positionInDoctorQueue, patientsAheadForDoctor } = await computeSmartWaitEstimate(
      clinicId,
      patient.position,
      patient.doctorId,
      patient.id,
    );
    const hasEmergencyAhead = urgentPositions.some(pos => pos < patient.position);
    emitPatientUpdate(
      patient.id, patient.position, patient.status,
      estimatedWaitMins, confidence, patient.isSteppedOut,
      minWaitMins, maxWaitMins, hasEmergencyAhead,
      positionInDoctorQueue, patientsAheadForDoctor,
    );
  }
}
