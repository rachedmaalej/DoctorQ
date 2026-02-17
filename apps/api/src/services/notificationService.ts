/**
 * Notification Service
 * Handles real-time Socket.io notifications to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';
import { getQueueStats, computeSmartWaitEstimate } from './statsService.js';
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
 * Emit patient position/status update to a specific patient's status page
 * Includes estimatedWaitMins so the patient page stays accurate after position changes.
 */
export function emitPatientUpdate(
  entryId: string,
  position: number,
  status: string,
  estimatedWaitMins?: number,
): void {
  const roomName = `patient:${entryId}`;
  logger.debug({ room: roomName, position, status, estimatedWaitMins }, 'Emitting patient:called');
  emitToRoom(roomName, 'patient:called', { position, status, estimatedWaitMins });
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
    const { estimatedWaitMins } = await computeSmartWaitEstimate(
      clinicId,
      patient.position,
      patient.doctorId,
    );
    emitPatientUpdate(patient.id, patient.position, patient.status, estimatedWaitMins);
  }
}



