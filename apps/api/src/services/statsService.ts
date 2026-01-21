/**
 * Queue Statistics Service
 * Handles calculation of queue metrics (wait times, seen count, etc.)
 * Includes caching for performance optimization
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { QueueStats } from '../types/index.js';
import { cache, CacheKeys, CacheTTL } from '../lib/cache.js';

/**
 * Get the start of today in the local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Calculate queue statistics for a clinic
 * - waiting: patients currently waiting (WAITING + NOTIFIED)
 * - seen: patients seen today (IN_CONSULTATION + COMPLETED)
 * - avgWait: average wait time from arrival to consultation (minutes) - TODAY ONLY
 * - lastConsultationMins: duration of most recent completed consultation
 * - noShows: patients marked as NO_SHOW today
 * - maxWait: longest wait time today (minutes)
 *
 * Results are cached for 10 seconds to reduce database load
 */
export async function getQueueStats(clinicId: string): Promise<QueueStats> {
  // Check cache first
  const cacheKey = CacheKeys.stats(clinicId);
  const cached = cache.get<QueueStats>(cacheKey);
  if (cached) {
    return cached;
  }

  const startOfToday = getStartOfToday();

  // Fetch from database
  const [waitingInQueue, seenPatientsToday, noShowsToday, lastCompletedPatient] = await Promise.all([
    // Count patients waiting in queue (WAITING + NOTIFIED, excluding IN_CONSULTATION)
    prisma.queueEntry.count({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    }),
    // Get patients that have COMPLETED consultation TODAY (for seen count and average wait calculation)
    prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: QueueStatus.COMPLETED,
        arrivedAt: {
          gte: startOfToday,
        },
      },
      select: { arrivedAt: true, calledAt: true },
    }),
    // Count no-shows today
    prisma.queueEntry.count({
      where: {
        clinicId,
        status: QueueStatus.NO_SHOW,
        arrivedAt: {
          gte: startOfToday,
        },
      },
    }),
    // Get the most recently completed patient to calculate last consultation duration
    prisma.queueEntry.findFirst({
      where: {
        clinicId,
        status: QueueStatus.COMPLETED,
        calledAt: { not: null },
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      select: { calledAt: true, completedAt: true },
    }),
  ]);

  // Filter entries that have both arrivedAt and calledAt timestamps
  const patientsWithWaitTime = seenPatientsToday.filter(
    (entry) => entry.arrivedAt && entry.calledAt
  );

  let avgWait: number | null = null;
  let maxWait: number | null = null;

  if (patientsWithWaitTime.length > 0) {
    const waitTimes = patientsWithWaitTime.map((entry) => {
      return Math.round((entry.calledAt!.getTime() - entry.arrivedAt!.getTime()) / 60000);
    });

    const totalWait = waitTimes.reduce((sum, wait) => sum + wait, 0);
    avgWait = Math.round(totalWait / patientsWithWaitTime.length);
    maxWait = Math.max(...waitTimes);
  }

  // Calculate last consultation duration
  let lastConsultationMins: number | null = null;
  if (lastCompletedPatient?.calledAt && lastCompletedPatient.completedAt) {
    const duration = lastCompletedPatient.completedAt.getTime() - lastCompletedPatient.calledAt.getTime();
    lastConsultationMins = Math.round(duration / 60000);
  }

  const stats: QueueStats = {
    waiting: waitingInQueue,
    seen: seenPatientsToday.length,
    avgWait,
    lastConsultationMins,
    noShows: noShowsToday,
    maxWait,
  };

  // Cache the result
  cache.set(cacheKey, stats, CacheTTL.STATS);

  return stats;
}

/**
 * Reset statistics by deleting all completed entries
 * Also invalidates the stats cache
 */
export async function resetStats(clinicId: string): Promise<number> {
  const result = await prisma.queueEntry.deleteMany({
    where: {
      clinicId,
      status: QueueStatus.COMPLETED,
    },
  });

  // Invalidate cache
  cache.delete(CacheKeys.stats(clinicId));

  return result.count;
}

/**
 * Invalidate stats cache for a clinic
 * Call this when queue changes (add, remove, call next, etc.)
 */
export function invalidateStatsCache(clinicId: string): void {
  cache.delete(CacheKeys.stats(clinicId));
}
