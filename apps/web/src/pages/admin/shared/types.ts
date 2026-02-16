import type { TrendData } from '@/types';

export type { TrendData };

export interface AdminStatsVM {
  activeClinics: number;
  activeTrials: number;
  paidSubscriptions: number;
  mrr: number;
  conversionRate: number;
  weeklyPatients: number;
  dailyActive: number;
  deltas: {
    activeClinics: TrendData | null;
    paidSubscriptions: TrendData | null;
    mrr: TrendData | null;
    conversionRate: TrendData | null;
    weeklyPatients: TrendData | null;
  };
}

export interface AdminClinicVM {
  id: string;
  name: string;
  doctorName: string | null;
  email: string;
  subscriptionStatus: string;
  patientsToday: number;
  patientsThisMonth: number;
  trend: TrendData | null;
  lastActiveAt: string | null;
  initials: string;
  churnRisk: 'high' | 'medium' | 'low' | null;
}

export type ActivitySeverity = 'success' | 'warning' | 'danger' | 'info';

export interface ActivityEventVM {
  id: string;
  type: string;
  clinicId: string;
  clinicName: string;
  message: string;
  severity: ActivitySeverity;
  createdAt: string;
}
