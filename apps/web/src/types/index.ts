export enum QueueStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export enum CheckInMethod {
  QR_CODE = 'QR_CODE',
  MANUAL = 'MANUAL',
  WHATSAPP = 'WHATSAPP',
}

export interface QueueEntry {
  id: string;
  clinicId: string;
  doctorId: string | null;
  patientName: string | null;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  checkInMethod: CheckInMethod;
  appointmentTime: string | null;  // v0.3: Scheduled appointment time
  arrivedAt: string;
  notifiedAt: string | null;
  calledAt: string | null;
  completedAt: string | null;
}

export interface QueueStats {
  waiting: number;
  seen: number;
  avgWait: number | null;
  lastConsultationMins: number | null;
  noShows: number;
  maxWait: number | null;
  effectiveAvgMins: number;
}

export interface QueueResponse {
  queue: QueueEntry[];
  stats: QueueStats;
}

export interface UILabels {
  customer: string;       // "patient" or "client"
  customers: string;      // "patients" or "clients"
  presenceOn: string;     // "Docteur présent" or "Cabinet ouvert"
  presenceOff: string;    // "Docteur absent" or "Cabinet fermé"
  addCustomer: string;    // "Ajouter un patient" or "Ajouter un client"
  noCustomers: string;    // "Aucun patient..." or "Aucun client..."
}

export interface Clinic {
  id: string;
  name: string;
  doctorName: string | null;
  doctorGender: string | null;
  email: string;
  language: string;
  avgConsultationMins: number;
  notifyAtPosition: number;
  isDoctorPresent?: boolean;
  businessType?: string;        // "medical" (default) or "retail"
  showAppointments?: boolean;   // true (default) or false
  onboardingCompleted?: boolean;
  isAdmin?: boolean;
  uiLabels?: UILabels;          // Dynamic labels based on businessType
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
  avgConsultationMins: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  clinic: Clinic;
}

export interface AddPatientData {
  patientPhone: string;
  patientName?: string;
  appointmentTime?: string;  // v0.3: HH:MM format
  arrivedAt?: string;        // ISO string for demo/testing - defaults to now() if not provided
}

export interface UpdateStatusData {
  status: QueueStatus;
  completedAt?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Extended patient status returned by GET /api/queue/patient/:entryId
 * Includes additional context for patient status page
 */
export interface PatientStatusResponse extends QueueEntry {
  isDoctorPresent?: boolean;
  estimatedWaitMins?: number;
  avgConsultationMins?: number;
  clinicName?: string;
  doctorName?: string;
  doctorGender?: string | null;
  announcement?: string | null;
  announcementAt?: string | null;
  specialty?: string | null;
  funFactsEnabled?: boolean;
}

// ─── Admin Types ─────────────────────────────────────────────

export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'flat';
  isPositive: boolean;
}

export interface AdminMetrics {
  activeClinics: number;
  totalClinics: number;
  mrrTND: number;
  patientsToday: number;
  qrCheckinRate: number;
  atRiskClinics: number;
  paidThisMonth: number;
  overdueCount: number;
}

export interface ClinicRanking {
  id: string;
  name: string;
  doctorName: string | null;
  patientsThisMonth: number;
  trend: TrendData;
}

export interface ChurnRiskClinic {
  id: string;
  name: string;
  doctorName: string | null;
  daysSinceLogin: number | null;
  lastPatientCount: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface AdminMetricsWithTrends extends AdminMetrics {
  period: 'today' | '7d' | '30d' | 'all';
  periodLabel: string;
  trends: {
    patients: TrendData;
    qrRate: TrendData;
    atRisk: TrendData;
    collection: TrendData;
  };
  patientsByDay: Array<{ date: string; count: number }>;
  revenueByMonth: Array<{ month: string; collected: number; expected: number }>;
  clinicRankings: ClinicRanking[];
  churnRiskClinics: ChurnRiskClinic[];
}

export interface ClinicHealth {
  id: string;
  name: string;
  doctorName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  patientsToday: number;
  avgWaitMins: number | null;
  status: 'active' | 'at_risk' | 'churned';
  paymentStatus: 'paid' | 'overdue' | 'none';
  // V2 subscription fields
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
}

export type ClinicDetailTab = 'overview' | 'patients' | 'billing' | 'settings';

export interface ClinicDetailDoctor {
  id: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
  avgConsultationMins: number;
}

export interface ClinicEditableFields {
  name?: string;
  doctorName?: string;
  phone?: string;
  email?: string;
  language?: string;
  avgConsultationMins?: number;
  businessType?: string;
  address?: string;
  notifyAtPosition?: number;
}

export interface ClinicDetail {
  clinic: {
    id: string;
    name: string;
    doctorName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    language: string;
    avgConsultationMins: number;
    businessType: string;
    isActive: boolean;
    isDoctorPresent: boolean;
    notifyAtPosition: number;
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    onboardingStep: number;
    onboardingCompleted: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  doctors: ClinicDetailDoctor[];
  todayStats: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
  };
  weeklyPatients: Array<{ date: string; count: number }>;
  monthlyStats: {
    totalPatients: number;
    avgWaitMins: number | null;
    qrRate: number;
  };
  allTimeStats: {
    totalPatients: number;
    avgWaitMins: number | null;
    qrRate: number;
  };
  recentEntries: Array<{
    id: string;
    patientName: string | null;
    patientPhone: string;
    status: string;
    checkInMethod: string;
    arrivedAt: string;
    calledAt: string | null;
    completedAt: string | null;
  }>;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  month: string;
  method: string;
  reference: string | null;
  status: string;
  paidAt: string;
}

export interface CreateClinicData {
  name: string;
  email: string;
  password: string;
  doctorName?: string;
  phone?: string;
  address?: string;
  language?: string;
  avgConsultationMins?: number;
  businessType?: string;
  showAppointments?: boolean;
}

export interface RecordPaymentData {
  amount: number;
  month: string;
  method: string;
  reference?: string;
  notes?: string;
}

// ─── Admin V2 Types ─────────────────────────────────────────

export type AdminTab = 'overview' | 'clinics' | 'financial' | 'engagement' | 'platform';

export interface SubscriptionMetrics {
  activeTrials: number;
  paidSubscriptions: number;
  expiredClinics: number;
  cancelledClinics: number;
  trialConversionRate: number;
  mrrActual: number;
  dailyActiveClinics: number;
}

export interface OnboardingFunnel {
  steps: Array<{
    step: number;
    name: string;
    count: number;
    dropOffRate: number;
  }>;
  totalSignups: number;
  completionRate: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  clinicId: string;
  clinicName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface FinancialAnalytics {
  mrr: number;
  mrrGrowthRate: number;
  arpu: number;
  cltv: number;
  churnRateRevenue: number;
  mrrHistory: Array<{
    month: string;
    totalMrr: number;
    newMrr: number;
    churnedMrr: number;
  }>;
  subscriptionBreakdown: {
    trial: number;
    monthlyActive: number;
    yearlyActive: number;
    pastDue: number;
    expired: number;
    cancelled: number;
  };
}

export interface FeatureAdoption {
  checkInMethods: {
    qrCode: { count: number; percentage: number };
    manual: { count: number; percentage: number };
    whatsApp: { count: number; percentage: number };
  };
  multiDoctorAdoption: number;
  avgPatientsPerClinicPerDay: number;
}

export interface PlatformHealth {
  services: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
  };
  clinicStats: {
    totalClinics: number;
    activeClinics: number;
    clinicsOnTrial: number;
    clinicsPaid: number;
  };
}

// ─── Daily Recap Types ─────────────────────────────────────────

export interface DailyRecapResponse {
  hasData: boolean;
  yesterday?: {
    totalPatients: number;
    avgWaitMins: number | null;
    avgConsultationMins: number | null;
    date: string;
  };
  previousDay?: {
    totalPatients: number;
    avgWaitMins: number | null;
    avgConsultationMins: number | null;
    date: string;
  } | null;
  monthlyAvg?: {
    avgPatients: number;
    avgWaitMins: number;
    avgConsultationMins: number;
  };
  trends?: {
    patients: { vsPrevDay: number; vsMonthly: number };
    avgWait: { vsPrevDay: number; vsMonthly: number };
    avgConsultation: { vsPrevDay: number; vsMonthly: number };
  };
}
