# MediBook - Full Feature Specification

## 1. Introduction

### 1.1 Purpose
MediBook is an appointment scheduling system for Tunisian medical clinics. It enables receptionists to manage appointments efficiently and integrates with DoctorQ for same-day queue management.

### 1.2 Target Users

| User Type | Description | Primary Actions |
|-----------|-------------|-----------------|
| Receptionist | Front desk staff | Schedule, reschedule, cancel appointments; check patients in |
| Doctor | Medical practitioner | View personal schedule, update appointment status |
| Patient | End user | Receives SMS reminders (no direct app access) |

### 1.3 Business Context
- Tunisian clinics manage 20-50 appointments daily
- Current methods: paper, WhatsApp, phone calls
- Problems: double-bookings, forgotten appointments, no reminders
- Integration with DoctorQ creates a complete clinic workflow

## 2. User Stories

### 2.1 Receptionist Stories

**Scheduling:**
- As a receptionist, I want to see all appointments in a calendar view so I can understand the day's schedule at a glance
- As a receptionist, I want to create appointments by selecting a time slot so I can quickly book patients
- As a receptionist, I want to search for existing patients so I don't create duplicate records
- As a receptionist, I want to reschedule appointments by dragging them so I can quickly adjust the schedule
- As a receptionist, I want to cancel appointments with a reason so we have a record

**Patient Management:**
- As a receptionist, I want to add new patients with their contact info so I can book their first appointment
- As a receptionist, I want to view a patient's appointment history so I know their visit patterns
- As a receptionist, I want to update patient contact info so reminders reach them

**Check-in:**
- As a receptionist, I want to check patients in with one click so they appear in DoctorQ
- As a receptionist, I want to see which appointments are checked in so I know who has arrived

### 2.2 Doctor Stories

**Schedule View:**
- As a doctor, I want to view my daily schedule so I know who I'm seeing
- As a doctor, I want to see patient notes for each appointment so I'm prepared
- As a doctor, I want to mark appointments as completed so the record is updated

### 2.3 System Stories

**Reminders:**
- The system should send SMS reminders 24 hours before appointments
- The system should send SMS reminders 1 hour before appointments
- The system should track which reminders have been sent

**Integration:**
- When a patient is checked in, they should appear in DoctorQ queue
- When DoctorQ marks a patient as completed, the appointment status should update

## 3. Functional Requirements

### 3.1 Authentication

| Requirement | Description |
|-------------|-------------|
| AUTH-001 | Use shared JWT authentication with DoctorQ |
| AUTH-002 | Token stored in localStorage |
| AUTH-003 | Auto-redirect to login when token expires |
| AUTH-004 | SSO: logged into DoctorQ = logged into MediBook |

### 3.2 Calendar Views

| Requirement | Description |
|-------------|-------------|
| CAL-001 | Month view showing all appointments as colored blocks |
| CAL-002 | Week view showing 7-day timeline with time slots |
| CAL-003 | Day view showing detailed timeline for single day |
| CAL-004 | Navigation: today, prev, next buttons |
| CAL-005 | Color-coding by doctor (configurable colors) |
| CAL-006 | Click empty slot to create appointment |
| CAL-007 | Click appointment to view/edit details |
| CAL-008 | Drag appointment to reschedule |

### 3.3 Appointment Management

| Requirement | Description |
|-------------|-------------|
| APT-001 | Create appointment: patient, doctor, date, time, duration, reason |
| APT-002 | Edit appointment: change any field |
| APT-003 | Cancel appointment: with optional reason |
| APT-004 | Reschedule: change date/time, preserves other details |
| APT-005 | Duration options: 15, 30, 45, 60 minutes |
| APT-006 | Prevent double-booking (same doctor, overlapping times) |
| APT-007 | Show appointment status: scheduled, confirmed, checked-in, completed, cancelled, no-show |

### 3.4 Patient Management

| Requirement | Description |
|-------------|-------------|
| PAT-001 | Create patient: name, phone (required), email, DOB, gender, notes |
| PAT-002 | Search patients by name or phone |
| PAT-003 | Edit patient details |
| PAT-004 | View patient appointment history |
| PAT-005 | Set reminder preference: SMS, WhatsApp, none |
| PAT-006 | Unique constraint: clinic + phone number |

### 3.5 Doctor Management

| Requirement | Description |
|-------------|-------------|
| DOC-001 | Create doctor: name, specialty, phone, email, calendar color |
| DOC-002 | Set working hours per day of week |
| DOC-003 | Set default appointment duration |
| DOC-004 | Deactivate doctor (soft delete) |
| DOC-005 | Filter calendar by doctor |

### 3.6 DoctorQ Integration

| Requirement | Description |
|-------------|-------------|
| INT-001 | Check-in button on appointment creates QueueEntry in DoctorQ |
| INT-002 | Pass appointment time to DoctorQ for priority sorting |
| INT-003 | Link QueueEntry back to Appointment via ID |
| INT-004 | Update appointment status when queue status changes |
| INT-005 | Show queue position on checked-in appointments |

### 3.7 SMS Reminders

| Requirement | Description |
|-------------|-------------|
| SMS-001 | Send reminder 24 hours before appointment |
| SMS-002 | Send reminder 1 hour before appointment |
| SMS-003 | Track sent status to prevent duplicates |
| SMS-004 | Respect patient reminder preferences |
| SMS-005 | Include: clinic name, doctor, date, time |

### 3.8 Real-time Updates

| Requirement | Description |
|-------------|-------------|
| RT-001 | Calendar updates in real-time when another user creates/edits appointment |
| RT-002 | Appointment status changes propagate immediately |
| RT-003 | Socket.io room per clinic |

## 4. Non-Functional Requirements

### 4.1 Performance

| Requirement | Description |
|-------------|-------------|
| PERF-001 | Calendar loads in < 2 seconds |
| PERF-002 | Appointment creation < 500ms |
| PERF-003 | Search results < 300ms |

### 4.2 Usability

| Requirement | Description |
|-------------|-------------|
| USE-001 | Support French and Arabic languages |
| USE-002 | RTL layout for Arabic |
| USE-003 | Mobile-responsive design |
| USE-004 | Keyboard navigation for common actions |

### 4.3 Security

| Requirement | Description |
|-------------|-------------|
| SEC-001 | All API endpoints require authentication |
| SEC-002 | Clinic can only access own data |
| SEC-003 | HTTPS in production |
| SEC-004 | Input validation on all forms |

### 4.4 Reliability

| Requirement | Description |
|-------------|-------------|
| REL-001 | Graceful handling of network errors |
| REL-002 | Optimistic updates with rollback on failure |
| REL-003 | Reconnection logic for Socket.io |

## 5. Data Model

### 5.1 Doctor

```typescript
interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  color?: string;           // Hex color for calendar
  workingHours?: {
    [day: string]: {
      start: string;        // "09:00"
      end: string;          // "17:00"
    }
  };
  slotDuration: number;     // Default appointment duration
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Patient

```typescript
interface Patient {
  id: string;
  clinicId: string;
  name: string;
  phone: string;            // Required, unique per clinic
  email?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  notes?: string;
  preferredDoctor?: string;
  reminderPreference: 'SMS' | 'WHATSAPP' | 'NONE';
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 Appointment

```typescript
interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  date: Date;               // Date only
  startTime: Date;          // Time only
  endTime: Date;            // Time only
  duration: number;         // Minutes
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  queueEntryId?: string;    // Link to DoctorQ
  createdAt: Date;
  updatedAt: Date;
}

type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
```

## 6. API Design

### 6.1 Appointments

```
GET    /api/appointments?date=2024-01-15&doctorId=xxx
POST   /api/appointments
       Body: { patientId, doctorId, date, startTime, duration, reason?, notes? }
GET    /api/appointments/:id
PATCH  /api/appointments/:id
       Body: { date?, startTime?, duration?, status?, reason?, notes? }
DELETE /api/appointments/:id
POST   /api/appointments/:id/checkin
       -> Creates QueueEntry in DoctorQ, returns { queueEntryId, position }
```

### 6.2 Patients

```
GET    /api/patients?search=ahmed
POST   /api/patients
       Body: { name, phone, email?, dateOfBirth?, gender?, notes? }
GET    /api/patients/:id
PATCH  /api/patients/:id
GET    /api/patients/:id/history
       -> Returns past appointments
```

### 6.3 Doctors

```
GET    /api/doctors
POST   /api/doctors
       Body: { name, specialty?, phone?, email?, color?, workingHours?, slotDuration? }
GET    /api/doctors/:id
PATCH  /api/doctors/:id
GET    /api/doctors/:id/availability?date=2024-01-15
       -> Returns available time slots
```

### 6.4 Calendar

```
GET    /api/calendar/day/:date
       -> Returns appointments for single day
GET    /api/calendar/week/:date
       -> Returns appointments for week starting at date
GET    /api/calendar/month/:date
       -> Returns appointments for month
GET    /api/calendar/slots?doctorId=xxx&date=2024-01-15&duration=30
       -> Returns available slots for booking
```

## 7. User Interface

### 7.1 Pages

| Page | URL | Description |
|------|-----|-------------|
| Calendar | `/` | Main calendar view (default: week) |
| Day View | `/day/:date` | Detailed day timeline |
| Patients | `/patients` | Patient list and search |
| Patient Detail | `/patients/:id` | Single patient with history |
| Settings | `/settings` | Clinic settings, doctors |

### 7.2 Components

| Component | Description |
|-----------|-------------|
| Calendar | FullCalendar or react-big-calendar wrapper |
| AppointmentModal | Create/edit appointment form |
| PatientSearch | Autocomplete search for patients |
| DayTimeline | Vertical timeline for day view |
| AppointmentCard | Compact appointment display |
| QuickActions | Confirm, check-in, cancel buttons |

### 7.3 Design Tokens

Following DoctorQ's design system:
- Primary color: Fiery Ocean palette
- Font: System fonts (Arabic: Noto Sans Arabic)
- Spacing: Tailwind defaults (4px base)
- Border radius: 8px (md) for cards, 16px (lg) for modals

## 8. Integration Points

### 8.1 DoctorQ API Calls

**Check-in Flow:**
```typescript
// MediBook calls DoctorQ API
POST ${DOCTORQ_API_URL}/api/queue
Headers: { Authorization: Bearer ${token} }
Body: {
  patientPhone: patient.phone,
  patientName: patient.name,
  appointmentTime: appointment.startTime.toISOString(),
  appointmentId: appointment.id
}
Response: { id: "qe_xxx", position: 3 }
```

**Status Sync (Webhook):**
```typescript
// DoctorQ calls MediBook webhook
POST ${MEDIBOOK_API_URL}/api/integration/webhook
Body: {
  event: "queue:status_changed",
  queueEntryId: "qe_xxx",
  appointmentId: "apt_xxx",
  status: "COMPLETED"
}
```

### 8.2 Shared Resources

| Resource | How Shared |
|----------|------------|
| JWT Secret | Same env variable |
| Database | Same PostgreSQL instance |
| Clinic ID | Same UUID |
| Socket.io | Separate instances, same room naming |

## 9. Error Handling

### 9.1 User-Facing Errors

| Error | Message (FR) | Message (AR) |
|-------|--------------|--------------|
| Double booking | "Ce créneau est déjà pris" | "هذا الموعد محجوز مسبقاً" |
| Patient not found | "Patient introuvable" | "المريض غير موجود" |
| Network error | "Erreur de connexion" | "خطأ في الاتصال" |

### 9.2 API Error Responses

```typescript
interface ApiError {
  error: string;      // Error code
  message: string;    // Human-readable message
  details?: unknown;  // Additional context
}

// HTTP 400 - Validation error
// HTTP 401 - Unauthorized
// HTTP 404 - Not found
// HTTP 409 - Conflict (e.g., double booking)
// HTTP 500 - Server error
```

## 10. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Recurring appointments | P1 | Weekly, monthly recurrence |
| Online booking | P1 | Patient self-service booking |
| WhatsApp reminders | P2 | Alternative to SMS |
| Calendar sync | P2 | Google/Outlook integration |
| Reports | P3 | Appointment statistics |
| Multi-clinic | P3 | Single account, multiple locations |
