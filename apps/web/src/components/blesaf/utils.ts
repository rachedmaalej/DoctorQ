import { getWaitingMinutes } from '@/lib/time';

/**
 * Get wait dot color based on elapsed wait time.
 * Green: <20 min, Amber: 20-50 min, Red: >50 min
 */
export function getWaitDotColor(arrivedAt: string): 'green' | 'amber' | 'red' {
  const mins = getWaitingMinutes(arrivedAt);
  if (mins < 20) return 'green';
  if (mins < 50) return 'amber';
  return 'red';
}

/**
 * Format wait time display: "12 min" or "1h02"
 */
export function formatWaitTime(arrivedAt: string): string {
  const mins = getWaitingMinutes(arrivedAt);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
  }
  return `${mins} min`;
}

/**
 * Abbreviate a full name: "Fatma Khaldi" → "Fatma K."
 */
export function abbreviateName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Calculate estimated end time string: "~18:45"
 */
export function calculateEndEstimate(
  waitingCount: number,
  avgConsultMins: number,
  remainingCurrentMins: number
): string {
  const now = new Date();
  const totalMins = remainingCurrentMins + (waitingCount > 0 ? (waitingCount - 1) * avgConsultMins : 0);
  const endTime = new Date(now.getTime() + totalMins * 60000);
  return `~${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
}

/**
 * Get consultation duration in minutes from calledAt timestamp.
 */
export function getConsultationMinutes(calledAt: string): number {
  const called = new Date(calledAt);
  const now = new Date();
  return Math.floor((now.getTime() - called.getTime()) / 60000);
}

/**
 * Format time from ISO string to HH:MM
 */
export function formatTimeShort(dateInput: string): string {
  const date = new Date(dateInput);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
