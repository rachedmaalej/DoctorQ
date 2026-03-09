/**
 * Centralized Metrics Service
 *
 * Single source of truth for all statistical calculations:
 * wait time, consultation duration, and daily/hourly snapshots.
 *
 * NO other file should duplicate these calculations.
 */

import { QueueStatus, CheckInMethod } from '@prisma/client';

// ─── Types ───

/** Minimal timing fields needed from QueueEntry */
export interface TimingEntry {
  arrivedAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
}

/** Full QueueEntry fields needed for snapshot building */
export interface SnapshotEntry extends TimingEntry {
  status: QueueStatus;
  checkInMethod: CheckInMethod;
  appointmentTime: Date | null;
  priority: 'normal' | 'urgent';
  doctorId: string | null;
}

export interface WaitMetrics {
  avgMins: number | null;
  maxMins: number | null;
  minMins: number | null;
  totalMins: number;
  count: number;
}

export interface ConsultMetrics {
  avgMins: number | null;
  totalMins: number;
  count: number;
}

export interface DailySnapshotInput {
  clinicId: string;
  date: Date;
  dayOfWeek: number;
  totalPatients: number;
  completed: number;
  noShows: number;
  cancelled: number;
  avgWaitMins: number | null;
  avgConsultationMins: number | null;
  maxWaitMins: number | null;
  minWaitMins: number | null;
  totalWaitMins: number;
  totalConsultMins: number;
  patientsWithWait: number;
  patientsWithConsult: number;
  checkInQr: number;
  checkInManual: number;
  checkInWhatsapp: number;
  walkIns: number;
  appointments: number;
  emergencies: number;
  peakHour: number | null;
}

export interface HourlySnapshotInput {
  clinicId: string;
  date: Date;
  hour: number;
  dayOfWeek: number;
  arrivals: number;
  completed: number;
  noShows: number;
  totalWaitMins: number;
  totalConsultMins: number;
  patientsWithWait: number;
  checkInQr: number;
  checkInManual: number;
}

export interface DoctorSnapshotInput {
  clinicId: string;
  doctorId: string;
  date: Date;
  totalPatients: number;
  completed: number;
  noShows: number;
  totalWaitMins: number;
  totalConsultMins: number;
  patientsWithWait: number;
  patientsWithConsult: number;
}

// ─── Core Calculations ───

/**
 * Compute wait time metrics (arrivedAt → calledAt) from a set of entries.
 *
 * Excludes the last patient (latest calledAt) to avoid distortion from
 * receptionists who forget to close the queue — the last patient often
 * stays IN_CONSULTATION until auto-completed at midnight.
 */
export function computeWaitMetrics(entries: TimingEntry[]): WaitMetrics {
  const withWait = entries.filter(e => e.arrivedAt && e.calledAt);

  if (withWait.length === 0) {
    return { avgMins: null, maxMins: null, minMins: null, totalMins: 0, count: 0 };
  }

  // Sort by calledAt ascending, exclude last patient
  const sorted = [...withWait].sort(
    (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
  );
  const forCalc = sorted.length > 1 ? sorted.slice(0, -1) : sorted;

  const waitTimes = forCalc.map(e =>
    Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000)
  );

  const totalMins = waitTimes.reduce((sum, w) => sum + w, 0);
  const avgMins = Math.round(totalMins / forCalc.length);
  const maxMins = Math.max(...waitTimes);
  const minMins = Math.min(...waitTimes);

  return { avgMins, maxMins, minMins, totalMins, count: forCalc.length };
}

/**
 * Compute consultation duration metrics (calledAt → completedAt).
 * Same last-patient exclusion logic.
 */
export function computeConsultMetrics(entries: TimingEntry[]): ConsultMetrics {
  const withConsult = entries.filter(e => e.calledAt && e.completedAt);

  if (withConsult.length === 0) {
    return { avgMins: null, totalMins: 0, count: 0 };
  }

  const sorted = [...withConsult].sort(
    (a, b) => a.completedAt!.getTime() - b.completedAt!.getTime()
  );
  const forCalc = sorted.length > 1 ? sorted.slice(0, -1) : sorted;

  const durations = forCalc.map(e =>
    Math.round((e.completedAt!.getTime() - e.calledAt!.getTime()) / 60000)
  );

  const totalMins = durations.reduce((sum, d) => sum + d, 0);
  const avgMins = Math.round(totalMins / forCalc.length);

  return { avgMins, totalMins, count: forCalc.length };
}

// ─── Snapshot Builders ───

/**
 * Get the hour (0-23) in Africa/Tunis timezone from a Date.
 */
function getTunisHour(date: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Africa/Tunis',
    }).format(date),
    10
  );
}

/**
 * Get the day of week (0=Sun..6=Sat) in Africa/Tunis timezone.
 */
function getTunisDayOfWeek(date: Date): number {
  const dayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Africa/Tunis',
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

/**
 * Build a full DailyStat snapshot from QueueEntry records for a given day.
 */
export function buildDailySnapshot(
  clinicId: string,
  entries: SnapshotEntry[],
  date: Date,
): DailySnapshotInput {
  const completed = entries.filter(e => e.status === QueueStatus.COMPLETED);
  const noShows = entries.filter(e => e.status === QueueStatus.NO_SHOW);
  const cancelled = entries.filter(e => e.status === QueueStatus.CANCELLED);

  const waitMetrics = computeWaitMetrics(completed);
  const consultMetrics = computeConsultMetrics(completed);

  // Check-in method counts (across all entries, not just completed)
  const checkInQr = entries.filter(e => e.checkInMethod === CheckInMethod.QR_CODE).length;
  const checkInManual = entries.filter(e => e.checkInMethod === CheckInMethod.MANUAL).length;
  const checkInWhatsapp = entries.filter(e => e.checkInMethod === CheckInMethod.WHATSAPP).length;

  // Walk-in vs appointment
  const appointmentEntries = entries.filter(e => e.appointmentTime !== null);
  const walkInEntries = entries.filter(e => e.appointmentTime === null);
  const emergencyEntries = entries.filter(e => e.priority === 'urgent');

  // Peak hour (by arrivedAt)
  const hourCounts = new Map<number, number>();
  for (const e of entries) {
    const hour = getTunisHour(e.arrivedAt);
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  let peakHour: number | null = null;
  let peakCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > peakCount) {
      peakHour = hour;
      peakCount = count;
    }
  }

  const dayOfWeek = getTunisDayOfWeek(date);

  // Normalize date to noon UTC to avoid date boundary issues
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(12, 0, 0, 0);

  return {
    clinicId,
    date: normalizedDate,
    dayOfWeek,
    totalPatients: entries.length,
    completed: completed.length,
    noShows: noShows.length,
    cancelled: cancelled.length,
    avgWaitMins: waitMetrics.avgMins,
    avgConsultationMins: consultMetrics.avgMins,
    maxWaitMins: waitMetrics.maxMins,
    minWaitMins: waitMetrics.minMins,
    totalWaitMins: waitMetrics.totalMins,
    totalConsultMins: consultMetrics.totalMins,
    patientsWithWait: waitMetrics.count,
    patientsWithConsult: consultMetrics.count,
    checkInQr,
    checkInManual,
    checkInWhatsapp,
    walkIns: walkInEntries.length,
    appointments: appointmentEntries.length,
    emergencies: emergencyEntries.length,
    peakHour,
  };
}

/**
 * Build HourlyStat snapshots grouped by arrivedAt hour.
 * Returns one entry per active hour (not all 24).
 */
export function buildHourlySnapshots(
  clinicId: string,
  entries: SnapshotEntry[],
  date: Date,
): HourlySnapshotInput[] {
  const byHour = new Map<number, SnapshotEntry[]>();

  for (const e of entries) {
    const hour = getTunisHour(e.arrivedAt);
    if (!byHour.has(hour)) byHour.set(hour, []);
    byHour.get(hour)!.push(e);
  }

  const dayOfWeek = getTunisDayOfWeek(date);
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(12, 0, 0, 0);

  const snapshots: HourlySnapshotInput[] = [];

  for (const [hour, hourEntries] of byHour) {
    const completed = hourEntries.filter(e => e.status === QueueStatus.COMPLETED);
    const waitMetrics = computeWaitMetrics(completed);
    const consultMetrics = computeConsultMetrics(completed);

    snapshots.push({
      clinicId,
      date: normalizedDate,
      hour,
      dayOfWeek,
      arrivals: hourEntries.length,
      completed: completed.length,
      noShows: hourEntries.filter(e => e.status === QueueStatus.NO_SHOW).length,
      totalWaitMins: waitMetrics.totalMins,
      totalConsultMins: consultMetrics.totalMins,
      patientsWithWait: waitMetrics.count,
      checkInQr: hourEntries.filter(e => e.checkInMethod === CheckInMethod.QR_CODE).length,
      checkInManual: hourEntries.filter(e => e.checkInMethod === CheckInMethod.MANUAL).length,
    });
  }

  return snapshots;
}

/**
 * Build DoctorDailyStat snapshots grouped by doctorId.
 * Skips entries with null doctorId.
 */
export function buildDoctorSnapshots(
  clinicId: string,
  entries: SnapshotEntry[],
  date: Date,
): DoctorSnapshotInput[] {
  const byDoctor = new Map<string, SnapshotEntry[]>();

  for (const e of entries) {
    if (!e.doctorId) continue;
    if (!byDoctor.has(e.doctorId)) byDoctor.set(e.doctorId, []);
    byDoctor.get(e.doctorId)!.push(e);
  }

  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(12, 0, 0, 0);

  const snapshots: DoctorSnapshotInput[] = [];

  for (const [doctorId, docEntries] of byDoctor) {
    const completed = docEntries.filter(e => e.status === QueueStatus.COMPLETED);
    const waitMetrics = computeWaitMetrics(completed);
    const consultMetrics = computeConsultMetrics(completed);

    snapshots.push({
      clinicId,
      doctorId,
      date: normalizedDate,
      totalPatients: docEntries.length,
      completed: completed.length,
      noShows: docEntries.filter(e => e.status === QueueStatus.NO_SHOW).length,
      totalWaitMins: waitMetrics.totalMins,
      totalConsultMins: consultMetrics.totalMins,
      patientsWithWait: waitMetrics.count,
      patientsWithConsult: consultMetrics.count,
    });
  }

  return snapshots;
}
