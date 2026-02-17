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
 * Rules (when doctor IS present):
 * - Position #1 → IN_CONSULTATION
 * - Position #2 → NOTIFIED
 * - All others → WAITING
 *
 * Rules (when doctor is NOT present):
 * - Position #1 → NOTIFIED (next up, but no active consultation)
 * - All others → WAITING
 * - No patient is placed IN_CONSULTATION
 *
 * Position ordering priority:
 * 1. Manually reordered patients (priorityOrder IS NOT NULL) - ordered by priorityOrder timestamp
 * 2. Patients with appointments - ordered by appointmentTime
 * 3. Walk-in patients (no appointment) - ordered by arrivedAt
 *
 * This ensures:
 * - Manual reordering by receptionist is PERSISTENT and takes highest priority
 * - Patients with appointments are seen before walk-ins
 * - Within each group, earlier times come first
 *
 * OPTIMIZED: Uses batch SQL update instead of N individual updates
 */
export async function recalculatePositionsAndStatuses(clinicId: string): Promise<void> {
  // Check doctor presence to determine status rules
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { isDoctorPresent: true },
  });
  const doctorPresent = clinic?.isDoctorPresent ?? false;

  await prisma.$transaction(async (tx) => {
    // Step 1: Renumber positions based on priority rules
    // Order: 1) Manually pinned (priorityOrder NOT NULL), 2) Appointments, 3) Walk-ins
    await tx.$executeRaw`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 ORDER BY
                   -- First: manually reordered patients keep their relative order
                   CASE WHEN "priorityOrder" IS NOT NULL THEN 0 ELSE 1 END ASC,
                   "priorityOrder" ASC NULLS LAST,
                   -- Second: patients with appointments (earlier appointments first)
                   CASE WHEN "appointmentTime" IS NOT NULL THEN 0 ELSE 1 END ASC,
                   "appointmentTime" ASC NULLS LAST,
                   -- Third: walk-ins by arrival time
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

    if (doctorPresent) {
      // Doctor present: position #1 → IN_CONSULTATION, #2 → NOTIFIED, 3+ → WAITING

      // Step 2a: Update status for position #1 to IN_CONSULTATION
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE("calledAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 1
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      // Step 2b: Update status for position #2 to NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 2
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      // Step 2c: Update status for positions 3+ to WAITING
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'WAITING'
        WHERE "clinicId" = ${clinicId}
        AND position > 2
        AND status IN ('NOTIFIED', 'IN_CONSULTATION')
      `;
    } else {
      // Doctor NOT present: position #1 → NOTIFIED, 2+ → WAITING, no IN_CONSULTATION

      // Step 2a: Position #1 → NOTIFIED (next up, ready when doctor arrives)
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 1
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      // Step 2b: Positions 2+ → WAITING
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'WAITING'
        WHERE "clinicId" = ${clinicId}
        AND position > 1
        AND status IN ('NOTIFIED', 'IN_CONSULTATION')
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
    if (doctorPresent) {
      // Update position #1 to IN_CONSULTATION
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE("calledAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 1
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      // Update position #2 to NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 2
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      // Update positions 3+ to WAITING
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'WAITING'
        WHERE "clinicId" = ${clinicId}
        AND position > 2
        AND status IN ('NOTIFIED', 'IN_CONSULTATION')
      `;
    } else {
      // Doctor NOT present: position #1 → NOTIFIED, 2+ → WAITING
      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE("notifiedAt", NOW())
        WHERE "clinicId" = ${clinicId}
        AND position = 1
        AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
      `;

      await tx.$executeRaw`
        UPDATE "QueueEntry"
        SET status = 'WAITING'
        WHERE "clinicId" = ${clinicId}
        AND position > 1
        AND status IN ('NOTIFIED', 'IN_CONSULTATION')
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
