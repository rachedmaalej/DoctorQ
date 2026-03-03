/**
 * Notification Service
 * Handles real-time Socket.io notifications and Web Push to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';
import { getQueueStats, computeSmartWaitEstimate } from './statsService.js';
import { sendPushToEntry, isPushConfigured } from '../lib/webpush.js';
import { logger } from '../lib/logger.js';

/**
 * Emit queue update to clinic dashboard
 * Sends the full queue and stats to all connected clinic clients
 */
export async function emitQueueUpdate(clinicId: string): Promise<void> {
  try {
    // Get updated queue
    const queue = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Get updated stats
    const stats = await getQueueStats(clinicId);

    // Emit to clinic room
    emitToRoom(`clinic:${clinicId}`, 'queue:updated', { queue, stats });
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
): void {
  const roomName = `patient:${entryId}`;
  logger.debug({ room: roomName, position, status, estimatedWaitMins, confidence }, 'Emitting patient:called');
  emitToRoom(roomName, 'patient:called', { position, status, estimatedWaitMins, confidence });

  // Send Web Push for critical statuses (non-blocking — fire and forget)
  if (isPushConfigured()) {
    if (status === QueueStatus.NOTIFIED) {
      const peopleAhead = Math.max(0, position - 1);
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
    } else if (position <= 3 && status === QueueStatus.WAITING) {
      sendPushToEntry(entryId, {
        title: 'Vous avancez',
        body: `Encore ${Math.max(0, position - 1)} personne${position > 2 ? 's' : ''} devant vous.`,
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
  });

  for (const patient of patients) {
    const { estimatedWaitMins, confidence } = await computeSmartWaitEstimate(
      clinicId,
      patient.position,
      patient.doctorId,
    );
    emitPatientUpdate(patient.id, patient.position, patient.status, estimatedWaitMins, confidence);
  }
}
