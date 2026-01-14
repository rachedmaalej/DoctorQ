import { z } from 'zod';

// Tunisia phone number validation
const phoneRegex = /^(\+216)?[2459]\d{7}$/;

export const phoneSchema = z.string().regex(phoneRegex, {
  message: 'Invalid Tunisian phone number. Must be +216XXXXXXXX format.',
});

// Time format validation (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeSchema = z.string().regex(timeRegex, {
  message: 'Invalid time format. Use HH:MM (e.g., 09:00)',
});

// Date format validation (YYYY-MM-DD)
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Invalid date format. Use YYYY-MM-DD',
});

// Working hours schema
export const dayHoursSchema = z.object({
  start: timeSchema,
  end: timeSchema,
}).nullable();

export const workingHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
}).optional();

// ============================================
// Doctor Schemas
// ============================================

export const createDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialty: z.string().optional(),
  phone: phoneSchema.optional(),
  email: z.string().email('Invalid email').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  slotDuration: z.number().int().min(5).max(120).optional(),
  workingHours: workingHoursSchema,
});

export const updateDoctorSchema = createDoctorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ============================================
// Patient Schemas
// ============================================

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema,
  email: z.string().email('Invalid email').optional(),
  dateOfBirth: dateSchema.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  notes: z.string().optional(),
  preferredDoctorId: z.string().uuid().optional(),
  reminderPreference: z.enum(['SMS', 'WHATSAPP', 'NONE']).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// ============================================
// Appointment Schemas
// ============================================

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  date: dateSchema,
  startTime: timeSchema,
  duration: z.number().int().min(5).max(180),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  duration: z.number().int().min(5).max(180).optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// Query Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const appointmentQuerySchema = paginationSchema.extend({
  date: dateSchema.optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const patientSearchSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// ============================================
// Helper Functions
// ============================================

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('216')) {
    return `+${cleaned}`;
  }
  return `+216${cleaned}`;
}

export function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
