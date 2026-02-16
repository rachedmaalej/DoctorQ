import type { ClinicHealth, ClinicDetail } from '@/types';

/** Re-export for convenience */
export type { ClinicHealth, ClinicDetail };

export type SortField = 'name' | 'lastActive' | 'patients' | 'joined';
export type SortDirection = 'asc' | 'desc';

export interface DirectoryFilters {
  activity: 'all' | 'today' | 'week' | 'month' | 'never';
  plan: 'all' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  payment: 'all' | 'paid' | 'overdue' | 'none';
}

export interface DirectorySort {
  field: SortField;
  direction: SortDirection;
}

export interface WeeklyDay {
  day: string;      // "lun.", "mar.", etc.
  dayShort: string; // "L", "M", etc.
  count: number;
  date: string;
}

/** Onboarding step names for display */
export const ONBOARDING_STEPS: Record<number, { en: string; fr: string }> = {
  1: { en: 'Account', fr: 'Compte' },
  2: { en: 'Clinic', fr: 'Cabinet' },
  3: { en: 'Queue', fr: 'File' },
  4: { en: 'Launch', fr: 'Lancement' },
};
