/**
 * Consultation duration urgency thresholds and style mappings.
 */

export const CONSULTATION_DURATION_THRESHOLDS = {
  /** Minutes before a consultation is considered "running long" */
  WARNING_MINUTES: 15,
  /** Minutes before a consultation is considered "overlong" */
  OVERLONG_MINUTES: 30,
} as const;

export type DurationUrgency = 'normal' | 'warning' | 'overlong';

export function getDurationUrgency(elapsedMinutes: number): DurationUrgency {
  if (elapsedMinutes >= CONSULTATION_DURATION_THRESHOLDS.OVERLONG_MINUTES) return 'overlong';
  if (elapsedMinutes >= CONSULTATION_DURATION_THRESHOLDS.WARNING_MINUTES) return 'warning';
  return 'normal';
}

export const URGENCY_STYLES: Record<DurationUrgency, {
  rowBg: string;
  rowBorder: string;
  timerColor: string;
  dividerColor: string;
  buttonBg: string;
}> = {
  normal: {
    rowBg: '#EDF3FC',
    rowBorder: '#DBEAFE',
    timerColor: '#3B7DD9',
    dividerColor: '#DBEAFE',
    buttonBg: '#3B7DD9',
  },
  warning: {
    rowBg: '#FEF7E6',
    rowBorder: '#FEF3C7',
    timerColor: '#D4920B',
    dividerColor: '#FEF3C7',
    buttonBg: '#D4920B',
  },
  overlong: {
    rowBg: '#FDF0ED',
    rowBorder: '#FEE2E2',
    timerColor: '#D94F3B',
    dividerColor: '#FEE2E2',
    buttonBg: '#D94F3B',
  },
};
