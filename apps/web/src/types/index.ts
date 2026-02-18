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

// ─── Admin V3 Types (Dashboard Redesign) ─────────────────────

export interface ClinicSummary {
  id: string;
  name: string;
  doctorEmail: string;
  plan: 'TRIAL' | 'PAID' | 'CHURNED';
  trialEndsAt: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  lastActiveDaysAgo: number | null;
  patientsLast30Days: number;
  avgPatientsPerDay: number;
  qrCheckInCount30d: number;
  totalCheckInCount30d: number;
  qrAdoptionRate: number;
  healthScore: 1 | 2 | 3 | 4;
  healthLabel: 'Strong' | 'Good' | 'Fair' | 'Weak';
  healthColor: 'green' | 'orange' | 'red';
  churnRisk: 'high' | 'medium' | 'low' | 'none';
  isInternal: boolean;
  sessionHistory: number[];
  daysUntilTrialExpires: number | null;
}

export interface FinancialSummary {
  currentMrr: number;
  activeTrials: number;
  trialsExpiringSoon: number;
  trialsExpiringThisWeek: number;
  highIntentTrials: number;
  atRiskTrials: number;
  projectedMrrBestCase: number;
  projectedMrrLikely: number;
  projectedMrrConservative: number;
  arpu: number;
  conversionPipeline: ClinicSummary[];
  revenueHistory: Array<{
    month: string;
    totalMrr: number;
    newMrr: number;
    churnedMrr: number;
    net: number;
  }>;
}

export interface EngagementSummary {
  totalCheckIns30d: number;
  qrCheckIns30d: number;
  manualCheckIns30d: number;
  whatsappCheckIns30d: number;
  qrAdoptionRate: number;
  avgPatientsPerClinicPerDay: number;
  multiDoctorClinicsCount: number;
  onboardingFunnel: {
    signedUp: number;
    clinicSetup: number;
    qrCodeGenerated: number;
    firstPatientCheckedIn: number;
    firstQrScan: number;
  };
  clinicBreakdown: ClinicSummary[];
  recommendedActions: Array<{
    priority: number;
    color: 'green' | 'orange' | 'gray';
    title: string;
    meta: string;
  }>;
  peakCheckinHour: string;
}

// ─── Admin V4 Types (Clinic Detail Redesign) ────────────────

export interface ClinicDetailEnriched {
  id: string;
  name: string;
  doctorName: string;
  doctorEmail: string;
  phone: string;
  address: string;
  language: string;
  specialty: string;
  joinedAt: string;

  plan: 'TRIAL' | 'PAID' | 'CHURNED';
  trialEndsAt: string | null;
  daysUntilTrialExpires: number | null;
  trialProgressPercent: number;
  adminExtensionsGiven: number;

  healthScore: 1 | 2 | 3 | 4;
  healthLabel: 'Strong' | 'Good' | 'Fair' | 'Weak';
  healthColor: 'green' | 'orange' | 'red';
  churnRisk: 'high' | 'medium' | 'low' | 'none';
  suggestedAction: {
    label: string;
    sublabel: string;
    cta: string;
    urgency: 'high' | 'medium' | 'low';
  };

  patientsAllTime: number;
  patientsLast30Days: number;
  avgPatientsPerDay: number;
  qrAdoptionRate: number;
  qrCheckInsLast30Days: number;
  manualCheckInsLast30Days: number;
  whatsappCheckInsLast30Days: number;
  avgWaitTimeMinutes: number;
  avgWaitTimeChangeVsLastWeek: number;
  avgConsultationMinutes: number;
  avgConsultationConfigured: number;
  noShowRate: number;
  peakHourRange: string;
  lastLoginAt: string | null;
  lastActiveDaysAgo: number | null;

  notifyAtPosition: number;
  qrCodeActive: boolean;
  qrCodeLastScannedAt: string | null;
  isActive: boolean;

  onboardingStep: number;
  onboardingTotalSteps: number;
  onboardingStepLabel: string;
  onboardingComplete: boolean;

  todayActivity: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
    avgWaitMinutesToday: number | null;
    qrCheckInsToday: number;
    totalCheckInsToday: number;
    peakHourToday: string | null;
    dayLabel: string;
  };
  typicalActivity: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
    avgWaitMinutes: number | null;
  };

  weeklyChartData: {
    days: Array<{
      label: string;
      thisWeek: number;
      lastWeek: number;
      isToday: boolean;
    }>;
    thisWeekTotal: number;
    lastWeekTotal: number;
    weekOnWeekChangePct: number;
    bestDayLabel: string;
    avgWaitThisWeek: number | null;
  };
  monthlyChartData: {
    days: Array<{ date: string; count: number }>;
    peakDayLabel: string;
    activeDays: number;
    zeroDays: number;
    avgPerActiveDay: number;
  };
  methodChartData: {
    manual: number;
    qr: number;
    whatsapp: number;
    totalLast30Days: number;
    qrGrowing: boolean;
    qrGrowthNote: string | null;
  };

  timeline: Array<{
    id: string;
    icon: 'check' | 'star' | 'warning' | 'admin' | 'info';
    color: 'green' | 'brand' | 'orange' | 'admin' | 'gray';
    title: string;
    meta: string;
    timestamp: string;
    isAdminAction: boolean;
    adminBadgeLabel?: string;
  }>;

  recentPatients: Array<{
    sequenceNumber: number;
    date: string;
    arrivedAt: string;
    waitMinutes: number | null;
    consultMinutes: number | null;
    checkInMethod: 'QR' | 'MANUAL' | 'WHATSAPP';
    status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'IN_CONSULTATION';
    notes: string | null;
  }>;
}
