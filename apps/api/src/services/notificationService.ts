/**
 * Notification Service
 * Handles real-time Socket.io notifications and SMS to clinics and patients
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';
import { getQueueStats, computeSmartWaitEstimate } from './statsService.js';
import { sendSms, buildSmsBody, type SmsTemplate } from '../lib/sms.js';
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
      logger.warn({ clinicName: entry.clinic.name }, 'No SMS credits remaining');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const lang = (entry.clinic.language === 'ar' ? 'ar' : 'fr') as 'fr' | 'ar';

    const { estimatedWaitMins } = await computeSmartWaitEstimate(
      entry.clinicId,
      entry.position,
      entry.doctorId
    );

    const body = buildSmsBody(template, {
      clinicName: entry.clinic.name,
      position: entry.position,
      waitTime: estimatedWaitMins,
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
    logger.error({ err: error }, 'SMS notification error');
    return false;
  }
}

