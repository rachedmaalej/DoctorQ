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
  SMS = 'SMS',
}

export interface QueueEntry {
  id: string;
  clinicId: string;
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
}

export interface QueueResponse {
  queue: QueueEntry[];
  stats: QueueStats;
}

export interface UILabels {
  customer: string;       // "patient" or "client"
  customers: string;      // "patients" or "clients"
  presenceOn: string;     // "Docteur présent" or "Magasin ouvert"
  presenceOff: string;    // "Docteur absent" or "Magasin fermé"
  addCustomer: string;    // "Ajouter un patient" or "Ajouter un client"
  noCustomers: string;    // "Aucun patient..." or "Aucun client..."
}

export interface Clinic {
  id: string;
  name: string;
  doctorName: string | null;
  email: string;
  language: string;
  avgConsultationMins: number;
  notifyAtPosition: number;
  isDoctorPresent?: boolean;
  businessType?: string;        // "medical" (default) or "retail"
  showAppointments?: boolean;   // true (default) or false
  uiLabels?: UILabels;          // Dynamic labels based on businessType
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
}

// ─── Admin Types ─────────────────────────────────────────────

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

export interface ClinicHealth {
  id: string;
  name: string;
  doctorName: string | null;
  lastLoginAt: string | null;
  patientsToday: number;
  avgWaitMins: number | null;
  status: 'active' | 'at_risk' | 'churned';
  paymentStatus: 'paid' | 'overdue' | 'none';
}

export interface ClinicDetail {
  clinic: {
    id: string;
    name: string;
    doctorName: string | null;
    email: string;
    phone: string | null;
    language: string;
    avgConsultationMins: number;
    businessType: string;
    isActive: boolean;
    isDoctorPresent: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
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
