// MediBook Type Definitions

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ReminderType = 'SMS' | 'WHATSAPP' | 'NONE';

export interface Clinic {
  id: string;
  name: string;
  doctorName?: string;
  phone?: string;
  address?: string;
  language: string;
  avgConsultationMins: number;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  color?: string;
  workingHours?: WorkingHours;
  slotDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
}

export interface DayHours {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  notes?: string;
  preferredDoctor?: string;
  reminderPreference: ReminderType;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  queueEntryId?: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  doctor?: Doctor;
  patient?: Patient;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// Calendar types
export interface CalendarDayView {
  date: string;
  appointments: Appointment[];
  summary: {
    total: number;
    scheduled: number;
    confirmed: number;
    checkedIn: number;
    completed: number;
  };
}

export interface CalendarWeekView {
  weekStart: string;
  weekEnd: string;
  days: CalendarDayView[];
}

export interface CalendarMonthView {
  month: string;
  days: { date: string; count: number }[];
}

export interface TimeSlot {
  doctorId: string;
  doctorName: string;
  start: string;
  end: string;
}

export interface AvailableSlots {
  date: string;
  slots: TimeSlot[];
}

// Form types
export interface AppointmentFormData {
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  duration: number;
  reason?: string;
  notes?: string;
}

export interface PatientFormData {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  notes?: string;
  reminderPreference?: ReminderType;
}

// Check-in response
export interface CheckInResponse {
  appointmentId: string;
  queueEntryId: string;
  position: number;
  estimatedWait: number;
  status: 'CHECKED_IN';
}
