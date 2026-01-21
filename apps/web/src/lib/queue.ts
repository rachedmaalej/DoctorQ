/**
 * Queue calculation utilities
 * Extracted for testability and reuse
 */

/**
 * Calculate estimated wait time based on queue position
 * @param position - Current position in queue (1-indexed)
 * @param avgConsultationMins - Average consultation time in minutes
 * @returns Estimated wait time in minutes
 */
export function calculateEstimatedWait(
  position: number,
  avgConsultationMins: number = 10
): number {
  // Position #1 still waits for the person in consultation to finish
  // Position #2 waits for person in consultation + person #1, etc.
  return Math.max(0, position) * avgConsultationMins;
}

/**
 * Format wait time as human-readable string
 * @param minutes - Number of minutes
 * @returns Formatted string like "< 5 min", "~30 min", "~1h 15min"
 */
export function formatWaitTime(minutes: number): string {
  if (minutes < 5) return '< 5 min';
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `~${hours}h`;
  }
  return `~${hours}h ${remainingMins}min`;
}

/**
 * Calculate queue position for display (excluding patient in consultation)
 * Used for toast messages when reordering
 * @param absolutePosition - The absolute position (1 = in consultation)
 * @returns Display position (1 = first in waiting queue)
 */
export function getQueueDisplayPosition(absolutePosition: number): number {
  // Position 1 is in consultation, so queue display starts at 1 for position 2
  return absolutePosition > 1 ? absolutePosition - 1 : 1;
}

/**
 * Determine if a move constitutes an emergency (jumping to front)
 * @param newPosition - The new absolute position
 * @param currentPosition - The current absolute position
 * @returns True if this is an emergency priority move
 */
export function isEmergencyMove(
  newPosition: number,
  currentPosition: number
): boolean {
  // Emergency = moving to position 1 (next to be called) from far back
  return newPosition === 1 && currentPosition > 2;
}

/**
 * Recalculate positions for a queue after removing an entry
 * @param queue - Array of queue entries with position property
 * @param removedPosition - The position that was removed
 * @returns Updated queue with recalculated positions
 */
export function recalculatePositions<T extends { position: number }>(
  queue: T[],
  removedPosition: number
): T[] {
  return queue.map((entry) => ({
    ...entry,
    position:
      entry.position > removedPosition ? entry.position - 1 : entry.position,
  }));
}

/**
 * Get the next patient to be called from a queue
 * @param queue - Array of queue entries with status property
 * @returns The first WAITING or NOTIFIED patient, or undefined
 */
export function getNextPatient<T extends { status: string }>(
  queue: T[]
): T | undefined {
  return queue.find(
    (p) => p.status === 'WAITING' || p.status === 'NOTIFIED'
  );
}

/**
 * Count patients with a specific status
 * @param queue - Array of queue entries with status property
 * @param statuses - Status values to count
 * @returns Number of patients matching any of the statuses
 */
export function countByStatus<T extends { status: string }>(
  queue: T[],
  ...statuses: string[]
): number {
  return queue.filter((p) => statuses.includes(p.status)).length;
}
