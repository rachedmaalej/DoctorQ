/**
 * Position Service
 * Handles queue position calculation and status management
 * Uses batch SQL updates for optimal performance
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';

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
    select: { queueMode: true, rdvGraceMinutes: true },
  });
  const queueMode = clinic?.queueMode ?? 'RDV_PRIORITY';
  const graceMinutes = clinic?.rdvGraceMinutes ?? 15;

  // Always derive presence from individual doctor states
  const activeDoctorCount = await prisma.doctor.count({
    where: {
      clinicId,
      isActive: true,
      state: { in: ['consulting', 'free'] },
    },
  });
  const doctorPresent = activeDoctorCount > 0;

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
                       CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END ASC,
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
                       CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END ASC,
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
                       CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END ASC,
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

    // Step 2: Reset NOTIFIED to WAITING, and reset excess IN_CONSULTATION
    // (keep only the most recently called patient per doctor)
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'WAITING'
      WHERE "clinicId" = ${clinicId}
      AND status = 'NOTIFIED'
    `;

    // Reset IN_CONSULTATION entries that are NOT the most recently called per doctor
    await tx.$executeRaw`
      UPDATE "QueueEntry" e
      SET status = 'WAITING'
      FROM (
        SELECT id FROM "QueueEntry"
        WHERE "clinicId" = ${clinicId}
        AND status = 'IN_CONSULTATION'
        AND id NOT IN (
          SELECT DISTINCT ON ("doctorId") id
          FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'IN_CONSULTATION'
          AND "doctorId" IS NOT NULL
          ORDER BY "doctorId", "calledAt" DESC NULLS LAST
        )
      ) excess
      WHERE e.id = excess.id
    `;

    if (doctorPresent) {
      // Promote one patient per CONSULTING doctor to IN_CONSULTATION
      // Only if that doctor doesn't already have a patient in consultation
      // (the kept entry from above satisfies this — skip doctors who already have one)
      await tx.$executeRaw`
        UPDATE "QueueEntry" e
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE(e."calledAt", NOW())
        FROM (
          SELECT DISTINCT ON (qe."doctorId") qe.id
          FROM "QueueEntry" qe
          JOIN "Doctor" d ON d.id = qe."doctorId"
          WHERE qe."clinicId" = ${clinicId}
          AND qe.status = 'WAITING'
          AND qe."isSteppedOut" = false
          AND qe."doctorId" IS NOT NULL
          AND d."isActive" = true
          AND d.state = 'consulting'
          AND NOT EXISTS (
            SELECT 1 FROM "QueueEntry" existing
            WHERE existing."doctorId" = qe."doctorId"
            AND existing."clinicId" = ${clinicId}
            AND existing.status = 'IN_CONSULTATION'
          )
          ORDER BY qe."doctorId", qe.position ASC
        ) sub
        WHERE e.id = sub.id
      `;

      // Second per consulting doctor → NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry" e
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE(e."notifiedAt", NOW())
        FROM (
          SELECT DISTINCT ON (qe."doctorId") qe.id
          FROM "QueueEntry" qe
          JOIN "Doctor" d ON d.id = qe."doctorId"
          WHERE qe."clinicId" = ${clinicId}
          AND qe.status = 'WAITING'
          AND qe."isSteppedOut" = false
          AND qe."doctorId" IS NOT NULL
          AND d."isActive" = true
          AND d.state = 'consulting'
          ORDER BY qe."doctorId", qe.position ASC
        ) sub
        WHERE e.id = sub.id
      `;

      // For 'free' doctors, promote first patient to NOTIFIED (they're next up when Suivant is clicked)
      await tx.$executeRaw`
        UPDATE "QueueEntry" e
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE(e."notifiedAt", NOW())
        FROM (
          SELECT DISTINCT ON (qe."doctorId") qe.id
          FROM "QueueEntry" qe
          JOIN "Doctor" d ON d.id = qe."doctorId"
          WHERE qe."clinicId" = ${clinicId}
          AND qe.status = 'WAITING'
          AND qe."isSteppedOut" = false
          AND qe."doctorId" IS NOT NULL
          AND d."isActive" = true
          AND d.state = 'free'
          ORDER BY qe."doctorId", qe.position ASC
        ) sub
        WHERE e.id = sub.id
      `;
    } else {
      // No doctor present: first non-stepped-out → NOTIFIED, no IN_CONSULTATION
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

    // Auto-sync doctor states based on IN_CONSULTATION patients
    // Doctors with an IN_CONSULTATION patient → 'consulting'
    await tx.$executeRaw`
      UPDATE "Doctor" d
      SET state = 'consulting', "stateUpdatedAt" = NOW()
      WHERE d."clinicId" = ${clinicId}
      AND d."isActive" = true
      AND d.state = 'free'
      AND EXISTS (
        SELECT 1 FROM "QueueEntry" qe
        WHERE qe."doctorId" = d.id
        AND qe."clinicId" = ${clinicId}
        AND qe.status = 'IN_CONSULTATION'
      )
    `;

    // Doctors without IN_CONSULTATION patient → 'free' (only if currently 'consulting')
    await tx.$executeRaw`
      UPDATE "Doctor" d
      SET state = 'free', "stateUpdatedAt" = NOW()
      WHERE d."clinicId" = ${clinicId}
      AND d."isActive" = true
      AND d.state = 'consulting'
      AND NOT EXISTS (
        SELECT 1 FROM "QueueEntry" qe
        WHERE qe."doctorId" = d.id
        AND qe."clinicId" = ${clinicId}
        AND qe.status = 'IN_CONSULTATION'
      )
    `;
  });

  // Always emit updated doctors list
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  emitToRoom(`clinic:${clinicId}`, 'doctors:updated', { doctors });
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
  // Always derive presence from individual doctor states
  const activeDoctorCount = await prisma.doctor.count({
    where: {
      clinicId,
      isActive: true,
      state: { in: ['consulting', 'free'] },
    },
  });
  const doctorPresent = activeDoctorCount > 0;

  await prisma.$transaction(async (tx) => {
    // Reset NOTIFIED to WAITING
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'WAITING'
      WHERE "clinicId" = ${clinicId}
      AND status = 'NOTIFIED'
    `;

    // Reset excess IN_CONSULTATION (keep only most recently called per doctor)
    await tx.$executeRaw`
      UPDATE "QueueEntry" e
      SET status = 'WAITING'
      FROM (
        SELECT id FROM "QueueEntry"
        WHERE "clinicId" = ${clinicId}
        AND status = 'IN_CONSULTATION'
        AND id NOT IN (
          SELECT DISTINCT ON ("doctorId") id
          FROM "QueueEntry"
          WHERE "clinicId" = ${clinicId}
          AND status = 'IN_CONSULTATION'
          AND "doctorId" IS NOT NULL
          ORDER BY "doctorId", "calledAt" DESC NULLS LAST
        )
      ) excess
      WHERE e.id = excess.id
    `;

    if (doctorPresent) {
      // Per-doctor promotion: one patient per consulting doctor → IN_CONSULTATION
      // Only if doctor doesn't already have a patient in consultation
      await tx.$executeRaw`
        UPDATE "QueueEntry" e
        SET status = 'IN_CONSULTATION',
            "calledAt" = COALESCE(e."calledAt", NOW())
        FROM (
          SELECT DISTINCT ON (qe."doctorId") qe.id
          FROM "QueueEntry" qe
          JOIN "Doctor" d ON d.id = qe."doctorId"
          WHERE qe."clinicId" = ${clinicId}
          AND qe.status = 'WAITING'
          AND qe."isSteppedOut" = false
          AND qe."doctorId" IS NOT NULL
          AND d."isActive" = true
          AND d.state IN ('consulting', 'free')
          AND NOT EXISTS (
            SELECT 1 FROM "QueueEntry" existing
            WHERE existing."doctorId" = qe."doctorId"
            AND existing."clinicId" = ${clinicId}
            AND existing.status = 'IN_CONSULTATION'
          )
          ORDER BY qe."doctorId", qe.position ASC
        ) sub
        WHERE e.id = sub.id
      `;

      // Second per doctor → NOTIFIED
      await tx.$executeRaw`
        UPDATE "QueueEntry" e
        SET status = 'NOTIFIED',
            "notifiedAt" = COALESCE(e."notifiedAt", NOW())
        FROM (
          SELECT DISTINCT ON (qe."doctorId") qe.id
          FROM "QueueEntry" qe
          JOIN "Doctor" d ON d.id = qe."doctorId"
          WHERE qe."clinicId" = ${clinicId}
          AND qe.status = 'WAITING'
          AND qe."isSteppedOut" = false
          AND qe."doctorId" IS NOT NULL
          AND d."isActive" = true
          AND d.state IN ('consulting', 'free')
          ORDER BY qe."doctorId", qe.position ASC
        ) sub
        WHERE e.id = sub.id
      `;
    } else {
      // No doctor present: first non-stepped-out → NOTIFIED
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

    // Auto-sync doctor states based on IN_CONSULTATION patients
    await tx.$executeRaw`
      UPDATE "Doctor" d
      SET state = 'consulting', "stateUpdatedAt" = NOW()
      WHERE d."clinicId" = ${clinicId}
      AND d."isActive" = true
      AND d.state = 'free'
      AND EXISTS (
        SELECT 1 FROM "QueueEntry" qe
        WHERE qe."doctorId" = d.id
        AND qe."clinicId" = ${clinicId}
        AND qe.status = 'IN_CONSULTATION'
      )
    `;

    await tx.$executeRaw`
      UPDATE "Doctor" d
      SET state = 'free', "stateUpdatedAt" = NOW()
      WHERE d."clinicId" = ${clinicId}
      AND d."isActive" = true
      AND d.state = 'consulting'
      AND NOT EXISTS (
        SELECT 1 FROM "QueueEntry" qe
        WHERE qe."doctorId" = d.id
        AND qe."clinicId" = ${clinicId}
        AND qe.status = 'IN_CONSULTATION'
      )
    `;
  });

  // Always emit updated doctors list
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  emitToRoom(`clinic:${clinicId}`, 'doctors:updated', { doctors });
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
