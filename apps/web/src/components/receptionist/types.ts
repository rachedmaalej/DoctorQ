import type { QueueEntry, QueueStats, Clinic } from '@/types';

export type QueueScreenStatus = 'PRE_OPEN' | 'OPEN' | 'CLOSING' | 'CLOSED';

export type BadgeType = 'priority' | 'emergency' | 'stepped-out' | 'no-phone' | null;

/** Snapshot persisted to localStorage when the receptionist ends the day */
export interface ClosedDaySummary {
  totalPatientsSeen: number;
  avgWaitMinutes: number;
  avgConsultMinutes: number;
  firstPatientTime: string;
  lastPatientTime: string;
}

/** Props passed from DashboardPage → ReceptionistDashboard */
export interface ReceptionistDashboardProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  clinic: Clinic | null;
  isDoctorPresent: boolean;
  onCallNext: () => void;
  onRemovePatient: (id: string) => void;
  onReorderPatient: (id: string, newPosition: number) => void;
  onCompleteConsultation: () => void;
  onToggleDoctorPresent: () => void;
  isTogglingPresence?: boolean;
  isCallingNext: boolean;
  onOpenSettings?: () => void;
  /** Increment to close the SideDrawer from outside (e.g. settings backdrop dismiss) */
  closeDrawerTrigger?: number;
}

export interface PreRegisteredPatient {
  id: string;
  name: string;
  position: number;
  registeredAt: string; // e.g. "08:04"
  hasPhone: boolean;
}

export interface QueuePatient {
  id: string;
  position: number;
  name: string;
  waitMinutes: number;
  hasPhone: boolean;
  phone: string;
  badge: BadgeType;
}

export interface CurrentPatientData {
  name: string;
  arrivedAt: string; // "16:30"
  consultingSinceMinutes: number;
  phone: string;
}

export interface StatsData {
  waitingCount: number;
  seenCount: number;
  maxWait: number | null;
}

export interface ClosingStatsData {
  remainingCount: number;
  seenCount: number;
  maxWait: number | null;
}

export interface DaySummaryBrief {
  totalPatients: number;
  avgWaitMinutes: number;
  avgConsultMinutes: number;
}

export interface TimelineSession {
  label: string; // "morning" | "afternoon"
  patientCount: number;
  flexWeight: number;
}

export interface SummaryData {
  date: string; // "Mardi 17 Février 2026"
  doctorFullName: string; // "Dr. Karim Jebali"
  specialty: string; // "Cabinet d'Ophtalmologie"
  location: string; // "El Menzah"
  totalPatientsSeen: number;
  avgWaitMinutes: number;
  avgConsultMinutes: number;
  firstPatientTime: string; // "08:32"
  lastPatientTime: string; // "19:05"
  timeSavedMinutes?: number; // Total wait mins saved by remote check-in patients
  sessions: TimelineSession[];
  breakLabel: string; // "Pause 12h–14h"
}

export interface DashboardData {
  clinicName: string;
  doctorLastName: string;
  queueStatus: QueueScreenStatus;
  preRegisteredPatients: PreRegisteredPatient[];
  stats: StatsData;
  closingStats: ClosingStatsData;
  currentPatient: CurrentPatientData | null;
  queue: QueuePatient[];
  nextPatientPreview: string; // "Fatma K."
  dayOpenedAt: string; // "08:32"
  totalAddedToday: number;
  isDoctorPresent: boolean;
  daySummaryBrief: DaySummaryBrief;
  summary: SummaryData;
}
