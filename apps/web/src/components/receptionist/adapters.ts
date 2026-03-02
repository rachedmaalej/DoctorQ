import type { QueueEntry, QueueStats, Clinic } from '@/types';
import { QueueStatus } from '@/types';
import { getWaitingMinutes } from '@/lib/time';
import {
  abbreviateName,
  calculateEndEstimate,
  getConsultationMinutes,
  formatTimeShort,
} from '@/components/blesaf/utils';
import type {
  QueuePatient,
  CurrentPatientData,
  PreRegisteredPatient,
  StatsData,
  ClosingStatsData,
  DaySummaryBrief,
  SummaryData,
  ClosedDaySummary,
} from './types';

// ── Individual entry mappers ────────────────────────────────

export function toQueuePatient(entry: QueueEntry): QueuePatient {
  let badge: QueuePatient['badge'] = null;
  if (entry.isEmergency) badge = 'emergency';
  else if (!entry.patientPhone) badge = 'no-phone';

  return {
    id: entry.id,
    position: entry.position,
    name: abbreviateName(entry.patientName),
    waitMinutes: getWaitingMinutes(entry.arrivedAt),
    hasPhone: !!entry.patientPhone,
    phone: entry.patientPhone || '',
    badge,
  };
}

export function toCurrentPatient(entry: QueueEntry): CurrentPatientData {
  return {
    name: abbreviateName(entry.patientName) || 'Patient',
    arrivedAt: formatTimeShort(entry.arrivedAt),
    consultingSinceMinutes: entry.calledAt ? getConsultationMinutes(entry.calledAt) : 0,
    phone: entry.patientPhone || '',
  };
}

export function toPreRegisteredPatients(entries: QueueEntry[]): PreRegisteredPatient[] {
  return entries
    .filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
    .map((e, i) => ({
      id: e.id,
      name: e.patientName || 'Patient',
      position: i + 1,
      registeredAt: formatTimeShort(e.arrivedAt),
      hasPhone: !!e.patientPhone,
    }));
}

// ── Stats mappers ───────────────────────────────────────────

export function toStatsData(
  stats: QueueStats,
  queue: QueueEntry[],
  avgConsultMins: number,
): StatsData {
  const inConsult = queue.find(e => e.status === QueueStatus.IN_CONSULTATION);
  const elapsed = inConsult?.calledAt ? getConsultationMinutes(inConsult.calledAt) : 0;
  const remainingCurrent = Math.max(0, avgConsultMins - elapsed);

  return {
    waitingCount: stats.waiting,
    seenCount: stats.seen,
    estimatedEndTime: calculateEndEstimate(stats.waiting, avgConsultMins, remainingCurrent),
  };
}

export function toClosingStatsData(
  stats: QueueStats,
  queue: QueueEntry[],
  avgConsultMins: number,
): ClosingStatsData {
  const inConsult = queue.find(e => e.status === QueueStatus.IN_CONSULTATION);
  const elapsed = inConsult?.calledAt ? getConsultationMinutes(inConsult.calledAt) : 0;
  const remainingCurrent = Math.max(0, avgConsultMins - elapsed);

  return {
    remainingCount: stats.waiting,
    seenCount: stats.seen,
    estimatedEndTime: calculateEndEstimate(stats.waiting, avgConsultMins, remainingCurrent),
  };
}

export function toDaySummaryBrief(stats: QueueStats): DaySummaryBrief {
  return {
    totalPatients: stats.seen,
    avgWaitMinutes: stats.avgWait ? Math.round(stats.avgWait) : 0,
    avgConsultMinutes: Math.round(stats.effectiveAvgMins),
  };
}

// ── Summary for CLOSED screen ───────────────────────────────

export function toSummaryData(
  clinic: Clinic | null,
  closedSummary: ClosedDaySummary | null,
): SummaryData {
  const now = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const dateStr = `${dayNames[now.getDay()]} ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return {
    date: dateStr,
    doctorFullName: clinic?.doctorName ? `Dr. ${clinic.doctorName}` : (clinic?.name ?? ''),
    specialty: clinic?.name ?? '',
    location: '',
    totalPatientsSeen: closedSummary?.totalPatientsSeen ?? 0,
    avgWaitMinutes: closedSummary?.avgWaitMinutes ?? 0,
    avgConsultMinutes: closedSummary?.avgConsultMinutes ?? 0,
    firstPatientTime: closedSummary?.firstPatientTime ?? '--:--',
    lastPatientTime: closedSummary?.lastPatientTime ?? '--:--',
    sessions: [],
    breakLabel: '',
  };
}

// ── Helpers ─────────────────────────────────────────────────

export function extractLastName(doctorName: string | null): string {
  if (!doctorName) return '';
  const parts = doctorName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export function getNextPatientPreview(queue: QueueEntry[]): string {
  const next = queue.find(
    e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED,
  );
  return next ? abbreviateName(next.patientName) : '';
}

export function getTotalAddedToday(stats: QueueStats | null, queueLength: number): number {
  if (!stats) return queueLength;
  return stats.seen + stats.noShows + queueLength;
}
