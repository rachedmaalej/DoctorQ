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
import { computeWaitMetrics } from './metricsService.js';

// Re-export for backward compatibility (other files import from statsService)
export { getStartOfToday } from '../lib/timezone.js';

// ─── Types ───

export type EstimateSource = 'today_weighted' | 'doctor_ema' | 'weekly_history' | 'clinic_fallback';

export interface EffectiveAvgResult {
  avgMins: number;
  source: EstimateSource;
  sampleSize: number;
}

export interface SmartWaitEstimate {
  estimatedWaitMins: number;
  minWaitMins: number;
  maxWaitMins: number;
  effectiveAvgMins: number;
  confidence: 'high' | 'medium' | 'low';
  doctorAbsent: boolean;
}

// ─── Queue Statistics ───

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

  // Parallel queries for better throughput under concurrent load
  const [waitingInQueue, seenPatientsToday, noShowsToday, lastCompletedPatient] = await Promise.all([
    prisma.queueEntry.count({
      where: {
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
      },
    }),
    prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: QueueStatus.COMPLETED,
        arrivedAt: { gte: startOfToday },
      },
      select: { arrivedAt: true, calledAt: true },
    }),
    prisma.queueEntry.count({
      where: {
        clinicId,
        status: QueueStatus.NO_SHOW,
        arrivedAt: { gte: startOfToday },
      },
    }),
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

  // Use centralized metrics for wait time calculation
  const waitMetrics = computeWaitMetrics(
    seenPatientsToday.map(e => ({ arrivedAt: e.arrivedAt, calledAt: e.calledAt, completedAt: null }))
  );
  const avgWait = waitMetrics.avgMins;
  const maxWait = waitMetrics.maxMins;

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

// ─── Cache Invalidation ───

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
  cache.delete(`noShowRate:${clinicId}`);
}

// ─── Effective Consultation Average (Waterfall) ───

/**
 * Get the best available average consultation duration for a clinic/doctor.
 * Returns detailed result including which data source was used.
 *
 * Uses a priority waterfall:
 *   1. Today's recency-weighted average (if >= 3 completed patients)
 *      — recent consultations weighted more heavily via exponential decay
 *   2. Doctor's rolling EMA (if doctorId provided and doctor exists)
 *   3. Recent 7-day weighted historical average from DailyStat
 *   4. Clinic's static avgConsultationMins (ultimate fallback)
 *
 * Cached per clinic+doctor combination.
 */
export async function getEffectiveConsultationAvgDetailed(
  clinicId: string,
  doctorId?: string | null
): Promise<EffectiveAvgResult> {
  const cacheKey = CacheKeys.effectiveAvg(clinicId, doctorId);
  const cached = cache.get<EffectiveAvgResult>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const startOfToday = getStartOfToday();

  // Priority 1: Today's recency-weighted consultation average
  const todayCompleted = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: QueueStatus.COMPLETED,
      arrivedAt: { gte: startOfToday },
      calledAt: { not: null },
      completedAt: { not: null },
    },
    select: { calledAt: true, completedAt: true },
    orderBy: { completedAt: 'desc' }, // Most recent first
  });

  // Filter to reasonable durations (1-120 min) to exclude anomalies
  const durations = todayCompleted
    .map((e) => Math.round((e.completedAt!.getTime() - e.calledAt!.getTime()) / 60000))
    .filter((d) => d >= 1 && d <= 120);

  if (durations.length >= 3) {
    // Recency-weighted average with exponential decay
    // durations[0] is most recent (weight=1), durations[1] gets 0.7, etc.
    const alpha = 0.7;
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < durations.length; i++) {
      const weight = Math.pow(alpha, i);
      weightedSum += durations[i] * weight;
      totalWeight += weight;
    }
    const result: EffectiveAvgResult = {
      avgMins: Math.round(weightedSum / totalWeight),
      source: 'today_weighted',
      sampleSize: durations.length,
    };
    cache.set(cacheKey, result, CacheTTL.EFFECTIVE_AVG);
    return result;
  }

  // Priority 2: Doctor's rolling EMA (auto-updated after each consultation)
  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { avgConsultationMins: true },
    });
    if (doctor) {
      const result: EffectiveAvgResult = {
        avgMins: doctor.avgConsultationMins,
        source: 'doctor_ema',
        sampleSize: 1,
      };
      cache.set(cacheKey, result, CacheTTL.EFFECTIVE_AVG);
      return result;
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
    const result: EffectiveAvgResult = {
      avgMins: Math.round(weightedSum / totalWeight),
      source: 'weekly_history',
      sampleSize: recentStats.length,
    };
    cache.set(cacheKey, result, CacheTTL.EFFECTIVE_AVG);
    return result;
  }

  // Priority 4: Clinic's static default
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { avgConsultationMins: true },
  });
  const result: EffectiveAvgResult = {
    avgMins: clinic?.avgConsultationMins ?? 10,
    source: 'clinic_fallback',
    sampleSize: 0,
  };
  cache.set(cacheKey, result, CacheTTL.EFFECTIVE_AVG);
  return result;
}

/**
 * Backward-compatible wrapper — returns just the average minutes.
 */
export async function getEffectiveConsultationAvg(
  clinicId: string,
  doctorId?: string | null
): Promise<number> {
  const result = await getEffectiveConsultationAvgDetailed(clinicId, doctorId);
  return result.avgMins;
}

// ─── No-Show Rate ───

/**
 * Get the historical no-show rate for a clinic.
 * Combines today's data with recent 7-day DailyStat history.
 * Returns a rate between 0 and 0.3 (capped at 30% max discount).
 */
async function getNoShowRate(clinicId: string): Promise<number> {
  const cacheKey = `noShowRate:${clinicId}`;
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  const startOfToday = getStartOfToday();

  // Today's data
  const [todayTotal, todayNoShows] = await Promise.all([
    prisma.queueEntry.count({
      where: {
        clinicId,
        arrivedAt: { gte: startOfToday },
        status: {
          in: [
            QueueStatus.COMPLETED,
            QueueStatus.NO_SHOW,
            QueueStatus.IN_CONSULTATION,
            QueueStatus.WAITING,
            QueueStatus.NOTIFIED,
          ],
        },
      },
    }),
    prisma.queueEntry.count({
      where: {
        clinicId,
        arrivedAt: { gte: startOfToday },
        status: QueueStatus.NO_SHOW,
      },
    }),
  ]);

  // Recent 7-day DailyStat history
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentStats = await prisma.dailyStat.findMany({
    where: {
      clinicId,
      date: { gte: sevenDaysAgo, lt: startOfToday },
    },
    select: { totalPatients: true, noShows: true },
  });

  // Combine today + history
  let totalPatients = todayTotal;
  let totalNoShows = todayNoShows;
  for (const stat of recentStats) {
    totalPatients += stat.totalPatients;
    totalNoShows += stat.noShows;
  }

  // Need at least 10 total patients for a meaningful rate
  const rate = totalPatients >= 10 ? totalNoShows / totalPatients : 0;

  // Cap at 30% max discount
  const cappedRate = Math.min(rate, 0.3);

  cache.set(cacheKey, cappedRate, CacheTTL.EFFECTIVE_AVG);
  return cappedRate;
}

// ─── Smart Wait Estimate ───

/**
 * Compute a smart wait time estimate for a patient at a given position.
 *
 * Accounts for:
 *   - Time already elapsed in the current consultation
 *   - Today's recency-weighted consultation durations
 *   - Per-doctor averages via EMA
 *   - Historical daily averages as fallback
 *   - No-show discount (reduces estimate based on historical no-show rate)
 *   - Doctor presence (flags when estimate is uncertain)
 *
 * Returns confidence level based on data quality:
 *   - high: today's weighted avg with >= 3 samples and position <= 5
 *   - medium: today's data at higher positions, or doctor EMA / weekly history
 *   - low: clinic fallback or doctor absent
 *
 * NOTE: This formula assumes single-doctor clinics. When multi-doctor support
 * is developed, divide fullConsultationsAhead by active doctor count.
 *
 * TODO: Appointment-time intelligence
 * Appointment-time intelligence would require a separate appointments table
 * to know about future bookings. Currently, QueueEntry only exists after
 * check-in, so we can't predict queue insertions from upcoming appointments
 * that haven't arrived yet. When RDV_PRIORITY or RDV_ON_TIME is active,
 * walk-in patients could have their estimates adjusted upward if we knew
 * about scheduled appointments between now and (now + estimatedWait).
 * This would require:
 * 1. A separate Appointment model (clinicId, patientPhone, scheduledTime, status)
 * 2. Querying upcoming appointments in the estimated wait window
 * 3. Adding a "potential insertions" count to the walk-in estimate
 */
export async function computeSmartWaitEstimate(
  clinicId: string,
  position: number,
  doctorId?: string | null
): Promise<SmartWaitEstimate> {
  const avgResult = await getEffectiveConsultationAvgDetailed(clinicId, doctorId);
  // Floor at 1 min to prevent 0 × N = 0 estimates when avg is missing/zero
  const effectiveAvgMins = Math.max(1, avgResult.avgMins);

  // Check doctor presence
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { isDoctorPresent: true },
  });
  const doctorAbsent = !(clinic?.isDoctorPresent ?? true);

  if (position <= 0) {
    return { estimatedWaitMins: 0, minWaitMins: 0, maxWaitMins: 0, effectiveAvgMins, confidence: 'high', doctorAbsent };
  }

  // Get no-show discount
  const noShowRate = await getNoShowRate(clinicId);

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
    // Apply no-show discount: some patients ahead may not show up
    const discountedAhead = fullConsultationsAhead * (1 - noShowRate);
    estimatedWaitMins = Math.round(remaining + discountedAhead * effectiveAvgMins);
  } else {
    // No one in consultation (doctor absent or between patients)
    const fullAhead = Math.max(0, position - 1);
    const discountedAhead = fullAhead * (1 - noShowRate);
    estimatedWaitMins = Math.round(discountedAhead * effectiveAvgMins);
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';

  if (doctorAbsent) {
    confidence = 'low';
  } else if (avgResult.source === 'clinic_fallback') {
    confidence = 'low';
  } else if (avgResult.source === 'today_weighted' && avgResult.sampleSize >= 3 && position <= 5) {
    confidence = 'high';
  } else if (avgResult.source === 'today_weighted' && avgResult.sampleSize >= 3) {
    confidence = 'medium'; // Today's data is good but high position amplifies uncertainty
  } else {
    // doctor_ema or weekly_history
    confidence = 'medium';
  }

  const capped = Math.max(0, estimatedWaitMins);

  // Range: √n scaling with absolute cap
  // Each consultation ahead is an independent random variable — uncertainty grows with √n, not n.
  // Cap at ±20 min so the total spread never exceeds 40 min (actionable, not anxiety-inducing).
  const patientsAhead = Math.max(0, position - 1);
  const variabilityFactors: Record<string, number> = { high: 0.3, medium: 0.5, low: 0.7 };
  const vf = variabilityFactors[confidence];
  const maxMarginCap = 20;
  const marginMins = Math.min(maxMarginCap, Math.round(effectiveAvgMins * vf * Math.sqrt(patientsAhead)));
  const minWaitMins = Math.max(0, capped - marginMins);
  const maxWaitMins = capped + marginMins;

  return {
    estimatedWaitMins: capped,
    minWaitMins,
    maxWaitMins,
    effectiveAvgMins,
    confidence,
    doctorAbsent,
  };
}
