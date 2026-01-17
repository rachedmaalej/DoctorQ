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
 * Rules:
 * - Position #1 should always be IN_CONSULTATION
 * - Position #2 should always be NOTIFIED
 * - All others should be WAITING
 *
 * Position ordering:
 * - Preserves current position order (just renumbers to fill gaps)
 * - This respects any manual reordering done by the receptionist
 * - New patients are added at the end via getNextPosition()
 *
 * OPTIMIZED: Uses batch SQL update instead of N individual updates
 * This reduces N queries to just 3-4 queries regardless of queue size
 */
export async function recalculatePositionsAndStatuses(clinicId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Step 1: Renumber positions to fill gaps (e.g., after a patient is removed)
    // Preserves current order - just assigns sequential numbers 1, 2, 3...
    await tx.$executeRaw`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 ORDER BY position ASC
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

    // Step 2: Update status for position #1 to IN_CONSULTATION
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'IN_CONSULTATION',
          "calledAt" = COALESCE("calledAt", NOW())
      WHERE "clinicId" = ${clinicId}
      AND position = 1
      AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
    `;

    // Step 3: Update status for position #2 to NOTIFIED
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'NOTIFIED',
          "notifiedAt" = COALESCE("notifiedAt", NOW())
      WHERE "clinicId" = ${clinicId}
      AND position = 2
      AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
    `;

    // Step 4: Update status for positions 3+ to WAITING
    await tx.$executeRaw`
      UPDATE "QueueEntry"
      SET status = 'WAITING'
      WHERE "clinicId" = ${clinicId}
      AND position > 2
      AND status IN ('NOTIFIED', 'IN_CONSULTATION')
    `;
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
 * Shifts other patients accordingly and updates statuses
 *
 * The new position is preserved by recalculatePositionsAndStatuses()
 * which simply renumbers to fill gaps without re-sorting.
 */
export async function reorderPatient(
  clinicId: string,
  entryId: string,
  oldPosition: number,
  newPosition: number
): Promise<void> {
  // Temporarily set moved patient's position to 0 to avoid conflicts
  await prisma.queueEntry.update({
    where: { id: entryId },
    data: { position: 0 },
  });

  // Shift other patients
  if (newPosition < oldPosition) {
    // Moving up: shift patients between newPosition and oldPosition down
    await prisma.queueEntry.updateMany({
      where: {
        clinicId,
        position: { gte: newPosition, lt: oldPosition },
        id: { not: entryId },
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
      data: { position: { increment: 1 } },
    });
  } else {
    // Moving down: shift patients between oldPosition and newPosition up
    await prisma.queueEntry.updateMany({
      where: {
        clinicId,
        position: { gt: oldPosition, lte: newPosition },
        id: { not: entryId },
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
      data: { position: { decrement: 1 } },
    });
  }

  // Set the moved patient to new position
  await prisma.queueEntry.update({
    where: { id: entryId },
    data: { position: newPosition },
  });
}

/**
 * Update statuses based on current positions using batch SQL
 * OPTIMIZED: Uses 3 batch queries instead of N individual updates
 */
export async function updateStatusesAfterReorder(clinicId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
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
