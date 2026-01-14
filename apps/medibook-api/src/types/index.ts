// MediBook API Type Definitions

import { Request } from 'express';

// ============================================
// Enums
// ============================================

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

// ============================================
// Working Hours
// ============================================

export interface DayHours {
  start: string; // HH:MM format
  end: string;   // HH:MM format
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

// ============================================
// Express Extensions
// ============================================

export interface AuthRequest extends Request {
  clinic?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================
// API Response Types
// ============================================

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

// ============================================
// Integration Types
// ============================================

export interface QueueWebhookEvent {
  event: 'queue:status_changed' | 'queue:position_changed' | 'queue:completed' | 'queue:no_show';
  queueEntryId: string;
  appointmentId?: string;
  status?: string;
  position?: number;
}

export interface CheckInResult {
  appointmentId: string;
  queueEntryId: string;
  position: number;
  estimatedWait: number;
  status: 'CHECKED_IN';
}

// ============================================
// Calendar Types
// ============================================

export interface TimeSlot {
  start: string;
  end: string;
}

export interface BookedSlot extends TimeSlot {
  appointmentId: string;
}

export interface DoctorAvailability {
  date: string;
  doctorId: string;
  workingHours: DayHours | null;
  availableSlots: TimeSlot[];
  bookedSlots: BookedSlot[];
}
