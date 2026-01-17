/**
 * Notification Service
 * Handles real-time Socket.io notifications to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';
import { getQueueStats } from './statsService.js';

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
    console.log(`Emitted queue:updated to clinic:${clinicId}`);
  } catch (error) {
    console.error('Failed to emit queue update:', error);
  }
}

/**
 * Emit patient position/status update to a specific patient's status page
 */
export function emitPatientUpdate(entryId: string, position: number, status: string): void {
  const roomName = `patient:${entryId}`;
  console.log(`[Socket.io] Emitting 'patient:called' to room '${roomName}' with position=${position}, status=${status}`);
  emitToRoom(roomName, 'patient:called', { position, status });
}

/**
 * Emit position changes to all patients in a queue
 * Useful after reorder or when a patient leaves
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
    emitPatientUpdate(patient.id, patient.position, patient.status);
  }
}

