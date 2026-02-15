/**
 * Queue Statistics Service
 * Handles calculation of queue metrics (wait times, seen count, etc.)
 * Includes caching for performance optimization
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';
import { QueueStats } from '../types/index.js';
import { cache, CacheKeys, CacheTTL } from '../lib/cache.js';
import { getStartOfToday } from '../lib/timezone.js';

// Re-export for backward compatibility (other files import from statsService)
export { getStartOfToday } from '../lib/timezone.js';

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

  // Sequential queries to prevent pgbouncer pool exhaustion
  const waitingInQueue = await prisma.queueEntry.count({
    where: {
      clinicId,
      status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
    },
  });
  const seenPatientsToday = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: QueueStatus.COMPLETED,
      arrivedAt: { gte: startOfToday },
    },
    select: { arrivedAt: true, calledAt: true },
  });
  const noShowsToday = await prisma.queueEntry.count({
    where: {
      clinicId,
      status: QueueStatus.NO_SHOW,
      arrivedAt: { gte: startOfToday },
    },
  });
  const lastCompletedPatient = await prisma.queueEntry.findFirst({
    where: {
      clinicId,
      status: QueueStatus.COMPLETED,
      calledAt: { not: null },
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    select: { calledAt: true, completedAt: true },
  });

  // Filter entries that have both arrivedAt and calledAt timestamps
  const patientsWithWaitTime = seenPatientsToday.filter(
    (entry) => entry.arrivedAt && entry.calledAt
  );

  let avgWait: number | null = null;
  let maxWait: number | null = null;

  if (patientsWithWaitTime.length > 0) {
    // Exclude the last patient called (latest calledAt) from averages.
    // Receptionists often forget to close the queue, so the last patient
    // stays IN_CONSULTATION until auto-completed at midnight, distorting times.
    const sorted = [...patientsWithWaitTime].sort(
      (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
    );
    const forAverage = sorted.length > 1 ? sorted.slice(0, -1) : sorted;

    const waitTimes = forAverage.map((entry) => {
      return Math.round((entry.calledAt!.getTime() - entry.arrivedAt!.getTime()) / 60000);
    });

    const totalWait = waitTimes.reduce((sum, wait) => sum + wait, 0);
    avgWait = Math.round(totalWait / forAverage.length);
    maxWait = Math.max(...waitTimes);
  }

  // Calculate last consultation duration (use second-to-last if available,
  // since the last patient's completedAt is often auto-set at midnight)
  let lastConsultationMins: number | null = null;
  if (lastCompletedPatient?.calledAt && lastCompletedPatient.completedAt) {
    const duration = lastCompletedPatient.completedAt.getTime() - lastCompletedPatient.calledAt.getTime();
    lastConsultationMins = Math.round(duration / 60000);
  }

  // Smart effective average — same source used by patient status page
  const effectiveAvgMins = await getEffectiveConsultationAvg(clinicId);

  const stats: QueueStats = {
    waiting: waitingInQueue,
    seen: seenPatientsToday.length,
    avgWait,
    lastConsultationMins,
    noShows: noShowsToday,
    maxWait,
    effectiveAvgMins,
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
  cache.invalidatePattern(`effectiveAvg:${clinicId}:`);
}

/**
 * Get the best available average consultation duration for a clinic/doctor.
 * Uses a priority waterfall:
 *   1. Today's median consultation duration (if ≥3 completed patients)
 *   2. Doctor's rolling EMA (if doctorId provided and doctor exists)
 *   3. Recent 7-day historical average from DailyStat
 *   4. Clinic's static avgConsultationMins (ultimate fallback)
 *
 * Cached for 30 seconds per clinic+doctor combination.
 */
export async function getEffectiveConsultationAvg(
  clinicId: string,
  doctorId?: string | null
): Promise<number> {
  const cacheKey = CacheKeys.effectiveAvg(clinicId, doctorId);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const startOfToday = getStartOfToday();

  // Priority 1: Today's median consultation duration
  const todayCompleted = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: QueueStatus.COMPLETED,
      arrivedAt: { gte: startOfToday },
      calledAt: { not: null },
      completedAt: { not: null },
    },
    select: { calledAt: true, completedAt: true },
  });

  // Filter to reasonable durations (1-120 min) to exclude anomalies
  const durations = todayCompleted
    .map((e) => Math.round((e.completedAt!.getTime() - e.calledAt!.getTime()) / 60000))
    .filter((d) => d >= 1 && d <= 120);

  if (durations.length >= 3) {
    durations.sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    const median = durations.length % 2 === 0
      ? Math.round((durations[mid - 1] + durations[mid]) / 2)
      : durations[mid];
    cache.set(cacheKey, median, CacheTTL.EFFECTIVE_AVG);
    return median;
  }

  // Priority 2: Doctor's rolling EMA (auto-updated after each consultation)
  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { avgConsultationMins: true },
    });
    if (doctor) {
      cache.set(cacheKey, doctor.avgConsultationMins, CacheTTL.EFFECTIVE_AVG);
      return doctor.avgConsultationMins;
    }
  }

  // Priority 3: Recent 7-day historical average from DailyStat
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentStats = await prisma.dailyStat.findMany({
    where: {
      clinicId,
      date: { gte: sevenDaysAgo, lt: startOfToday },
      avgConsultationMins: { not: null },
    },
    select: { date: true, avgConsultationMins: true },
    orderBy: { date: 'desc' },
  });

  if (recentStats.length > 0) {
    // Weighted average: more recent days get higher weight
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 0; i < recentStats.length; i++) {
      const weight = recentStats.length - i; // Most recent = highest weight
      weightedSum += recentStats[i].avgConsultationMins! * weight;
      totalWeight += weight;
    }
    const weightedAvg = Math.round(weightedSum / totalWeight);
    cache.set(cacheKey, weightedAvg, CacheTTL.EFFECTIVE_AVG);
    return weightedAvg;
  }

  // Priority 4: Clinic's static default
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { avgConsultationMins: true },
  });
  const fallback = clinic?.avgConsultationMins ?? 10;
  cache.set(cacheKey, fallback, CacheTTL.EFFECTIVE_AVG);
  return fallback;
}

/**
 * Compute a smart wait time estimate for a patient at a given position.
 * Accounts for:
 *   - Time already elapsed in the current consultation
 *   - Today's actual consultation durations (median)
 *   - Per-doctor averages via EMA
 *   - Historical daily averages as fallback
 */
export async function computeSmartWaitEstimate(
  clinicId: string,
  position: number,
  doctorId?: string | null
): Promise<{ estimatedWaitMins: number; effectiveAvgMins: number }> {
  const effectiveAvgMins = await getEffectiveConsultationAvg(clinicId, doctorId);

  if (position <= 0) {
    return { estimatedWaitMins: 0, effectiveAvgMins };
  }

  // Find the current IN_CONSULTATION patient to account for elapsed time
  const currentPatient = await prisma.queueEntry.findFirst({
    where: {
      clinicId,
      status: QueueStatus.IN_CONSULTATION,
    },
    select: { calledAt: true },
  });

  let estimatedWaitMins: number;

  if (currentPatient?.calledAt) {
    // Doctor is actively seeing someone — account for elapsed time
    const elapsedMins = (Date.now() - currentPatient.calledAt.getTime()) / 60000;
    const remaining = Math.max(0, effectiveAvgMins - elapsedMins);
    const fullConsultationsAhead = Math.max(0, position - 2);
    estimatedWaitMins = Math.round(remaining + fullConsultationsAhead * effectiveAvgMins);
  } else {
    // No one in consultation (doctor absent or between patients)
    estimatedWaitMins = Math.max(0, position - 1) * effectiveAvgMins;
  }

  return { estimatedWaitMins: Math.max(0, estimatedWaitMins), effectiveAvgMins };
}
