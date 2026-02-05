/**
 * Notification Service
 * Handles real-time Socket.io notifications and SMS to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';
import { getQueueStats } from './statsService.js';
import { sendSms, buildSmsBody, type SmsTemplate } from '../lib/sms.js';

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

/**
 * Send SMS notification to a patient
 * Checks SMS credits before sending, deducts on success
 */
export async function sendSmsNotification(
  entryId: string,
  template: SmsTemplate
): Promise<boolean> {
  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            language: true,
            smsCredits: true,
            avgConsultationMins: true,
          },
        },
      },
    });

    if (!entry || !entry.clinic) return false;

    // Check SMS credits
    if (entry.clinic.smsCredits <= 0) {
      console.log(`[SMS] No credits remaining for clinic ${entry.clinic.name}`);
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const lang = (entry.clinic.language === 'ar' ? 'ar' : 'fr') as 'fr' | 'ar';

    const body = buildSmsBody(template, {
      clinicName: entry.clinic.name,
      position: entry.position,
      waitTime: entry.position * entry.clinic.avgConsultationMins,
      remaining: entry.position - 1,
      statusLink: `${frontendUrl}/patient/${entry.id}`,
    }, lang);

    const result = await sendSms(entry.patientPhone, body);

    if (result.success) {
      // Deduct SMS credit
      await prisma.clinic.update({
        where: { id: entry.clinic.id },
        data: {
          smsCredits: { decrement: 1 },
          smsCreditsUsed: { increment: 1 },
        },
      });
    }

    return result.success;
  } catch (error) {
    console.error('[SMS] Notification error:', error);
    return false;
  }
}

