/**
 * Position Service
 * Handles queue position calculation and status management
 * Uses batch SQL updates for optimal performance
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';

/**
 * Recalculate positions and auto-assign statuses for a clinic's queue
 *
 * Status rules (when doctor IS present):
 * - Position #1 → IN_CONSULTATION
 * - Position #2 → NOTIFIED
 * - All others → WAITING
 *
 * Status rules (when doctor is NOT present):
 * - Position #1 → NOTIFIED (next up, but no active consultation)
 * - All others → WAITING
 * - No patient is placed IN_CONSULTATION
 *
 * Position ordering depends on clinic's queueMode:
 *
 * RDV_PRIORITY (default):
 *   IN_CONSULTATION > Emergency > Manual reorder > Appointments > Walk-ins (arrivedAt)
 *
 * FIFO:
 *   IN_CONSULTATION > Emergency > Manual reorder > arrivedAt (appointments are informational)
 *
 * RDV_ON_TIME:
 *   IN_CONSULTATION > Emergency > Manual reorder > On-time appointments > Walk-ins (arrivedAt)
 *   (RDV patients who arrive more than rdvGraceMinutes late lose appointment priority)
 *
 * OPTIMIZED: Uses batch SQL update instead of N individual updates
 */
export async function recalculatePositionsAndStatuses(clinicId: string): Promise<void> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { isDoctorPresent: true, queueMode: true, rdvGraceMinutes: true },
  });
  const doctorPresent = clinic?.isDoctorPresent ?? false;
  const queueMode = clinic?.queueMode ?? 'RDV_PRIORITY';
  const graceMinutes = clinic?.rdvGraceMinutes ?? 15;

  // Auto-expire stepped-out patients after 60 minutes
  await prisma.$executeRaw`
    UPDATE "QueueEntry"
    SET "isSteppedOut" = false, "steppedOutAt" = NULL
    WHERE "clinicId" = ${clinicId}
    AND "isSteppedOut" = true
    AND "steppedOutAt" < NOW() - INTERVAL '60 minutes'
  `;

  await prisma.$transaction(async (tx) => {
    // Step 1: Renumber positions based on queue mode
    switch (queueMode) {
      case 'FIFO':
        // Strict arrival order — appointments are informational only
        await tx.$executeRaw`
          WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                     ORDER BY
                       CASE WHEN status = 'IN_CONSULTATION' THEN 0 ELSE 1 END ASC,
                       CASE WHEN "isEmergency" = true THEN 0 ELSE 1 END ASC,
                       CASE WHEN "priorityOrder" IS NOT NULL THEN 0 ELSE 1 END ASC,
                       "priorityOrder" ASC NULLS LAST,
                       "arrivedAt" ASC
                   ) as new_position
            FROM "QueueEntry"
            WHERE "clinicId" = ${clinicId}
            AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
          )
          UPDATE "QueueEntry"
          SET position = ranked.new_position
          FROM ranked
          WHERE "QueueEntry".id = ranked.id
        `;
        break;

      case 'RDV_ON_TIME':
        // Appointments get priority only if patient arrived within grace period
        await tx.$executeRaw`
          WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                     ORDER BY
                       CASE WHEN status = 'IN_CONSULTATION' THEN 0 ELSE 1 END ASC,
                       CASE WHEN "isEmergency" = true THEN 0 ELSE 1 END ASC,
                       CASE WHEN "priorityOrder" IS NOT NULL THEN 0 ELSE 1 END ASC,
                       "priorityOrder" ASC NULLS LAST,
                       CASE WHEN "appointmentTime" IS NOT NULL
                            AND "arrivedAt" <= "appointmentTime" + INTERVAL '1 minute' * ${graceMinutes}
                            THEN 0 ELSE 1 END ASC,
                       "appointmentTime" ASC NULLS LAST,
                       "arrivedAt" ASC
                   ) as new_position
            FROM "QueueEntry"
            WHERE "clinicId" = ${clinicId}
            AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
          )
          UPDATE "QueueEntry"
          SET position = ranked.new_position
          FROM ranked
          WHERE "QueueEntry".id = ranked.id
        `;
        break;

      default: // RDV_PRIORITY
        // Appointments always have priority over walk-ins
        await tx.$executeRaw`
          WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                     ORDER BY
                       CASE WHEN status = 'IN_CONSULTATION' THEN 0 ELSE 1 END ASC,
                       CASE WHEN "isEmergency" = true THEN 0 ELSE 1 END ASC,
                       CASE WHEN "priorityOrder" IS NOT NULL THEN 0 ELSE 1 END ASC,
                       "priorityOrder" ASC NULLS LAST,
                       CASE WHEN "appointmentTime" IS NOT NULL THEN 0 ELSE 1 END ASC,
                       "appointmentTime" ASC NULLS LAST,
                       "arrivedAt" ASC
                   ) as new_position
            FROM "QueueEntry"
            WHERE "clinicId" = ${clinicId}
            AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
          )
          UPDATE "QueueEntry"
          SET position = ranked.new_position
          FROM ranked
          WHERE "QueueEntry".id = ranked.id
        `;
        break;
    }

    // Step 2: First, reset all active entries to WAITING (clean slate)
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'WAITING'
      WHERE "clinicId" = ${clinicId}
      AND status IN ('NOTIFIED', 'IN_CONSULTATION')
    `;

    if (doctorPresent) {
      // Doctor present: first non-stepped-out patient → IN_CONSULTATION,
      // second non-stepped-out → NOTIFIED, stepped-out patients stay WAITING

      // Step 2a: First non-stepped-out active patient → IN_CONSULTATION
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE("calledAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;

      // Step 2b: Second non-stepped-out active patient → NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;
    } else {
      // Doctor NOT present: first non-stepped-out → NOTIFIED, no IN_CONSULTATION

      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;
    }
  });
}

/**
 * Legacy function name for backward compatibility
 */
export async function recalculatePositions(clinicId: string): Promise<void> {
  return recalculatePositionsAndStatuses(clinicId);
}

/**
 * Reorder a patient to a new position
 * Sets priorityOrder on ALL active patients to make the change persistent
 *
 * When a patient is manually moved:
 * - ALL active patients get priorityOrder timestamps based on their new positions
 * - This ensures the entire queue order is frozen and won't change on recalculation
 * - Future patients (without priorityOrder) will be added after all manually-ordered ones
 */
export async function reorderPatient(
  clinicId: string,
  entryId: string,
  oldPosition: number,
  newPosition: number
): Promise<void> {
  const now = new Date();

  // Get ALL active patients in current order
  const allPatients = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
    },
    orderBy: { position: 'asc' },
    select: { id: true, position: true },
  });

  // Build the new order by moving the patient
  const patientIds = allPatients.map(p => p.id);
  const movedPatientIndex = patientIds.findIndex(id => id === entryId);

  if (movedPatientIndex === -1) return;

  // Remove from old position and insert at new position
  patientIds.splice(movedPatientIndex, 1);
  patientIds.splice(newPosition - 1, 0, entryId);

  // Assign priorityOrder timestamps to ALL patients to preserve the complete order
  // This ensures the order is "frozen" and won't change on next recalculation
  await prisma.$transaction(async (tx) => {
    let timestamp = now.getTime();

    for (let i = 0; i < patientIds.length; i++) {
      await tx.queueEntry.update({
        where: { id: patientIds[i] },
        data: {
          position: i + 1,
          priorityOrder: new Date(timestamp + i),
        },
      });
    }
  });
}

/**
 * Update statuses based on current positions using batch SQL
 * Respects doctor presence — same rules as recalculatePositionsAndStatuses()
 * OPTIMIZED: Uses batch queries instead of N individual updates
 */
export async function updateStatusesAfterReorder(clinicId: string): Promise<void> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { isDoctorPresent: true },
  });
  const doctorPresent = clinic?.isDoctorPresent ?? false;

  await prisma.$transaction(async (tx) => {
    // Reset all to WAITING first (clean slate)
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'WAITING'
      WHERE "clinicId" = ${clinicId}
      AND status IN ('NOTIFIED', 'IN_CONSULTATION')
    `;

    if (doctorPresent) {
      // First non-stepped-out → IN_CONSULTATION
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE("calledAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;

      // Second non-stepped-out → NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;
    } else {
      // Doctor NOT present: first non-stepped-out → NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'WAITING'
          AND "isSteppedOut" = false
          ORDER BY position ASC
          LIMIT 1
        )
      `;
    }
  });
}

/**
 * Get the next position number for a new patient
 */
export async function getNextPosition(clinicId: string): Promise<number> {
  const maxPosition = await prisma.queueEntry.findFirst({
    where: {
      clinicId,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
      },
    },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return (maxPosition?.position || 0) + 1;
}
