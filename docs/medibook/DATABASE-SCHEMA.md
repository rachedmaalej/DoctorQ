# MediBook - Database Schema

## Overview

MediBook extends the existing DoctorQ database schema by adding three new models: Doctor, Patient, and Appointment. These models integrate with the existing Clinic model.

## Entity Relationship Diagram

```
┌──────────────────┐
│      Clinic      │
│  (from DoctorQ)  │
├──────────────────┤
│ id               │
│ name             │
│ email            │
│ ...              │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│ Doctor │ │Patient │ │QueueEnt│ │Appointment │
├────────┤ ├────────┤ ├────────┤ ├────────────┤
│clinicId│ │clinicId│ │clinicId│ │clinicId    │
│name    │ │name    │ │        │ │doctorId ───┼──► Doctor
│...     │ │phone   │ │        │ │patientId ──┼──► Patient
└────┬───┘ └───┬────┘ └────────┘ │queueEntryId┼──► QueueEntry
     │         │                 └────────────┘
     │         │                      │
     └─────────┴──────────────────────┘
                 Appointment links to both
```

## Prisma Schema

### New Models

```prisma
// apps/medibook-api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// EXISTING MODELS (from DoctorQ)
// ============================================

model Clinic {
  id                  String       @id @default(uuid())
  name                String
  doctorName          String?
  phone               String?
  address             String?
  language            String       @default("fr")
  avgConsultationMins Int          @default(15)
  isActive            Boolean      @default(true)

  email               String       @unique
  passwordHash        String

  notifyAtPosition    Int          @default(2)
  enableWhatsApp      Boolean      @default(false)

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // DoctorQ relations
  queueEntries        QueueEntry[]
  dailyStats          DailyStat[]

  // MediBook relations (NEW)
  doctors             Doctor[]
  patients            Patient[]
  appointments        Appointment[]
}

model QueueEntry {
  id            String      @id @default(uuid())
  clinicId      String
  clinic        Clinic      @relation(fields: [clinicId], references: [id])

  patientName   String?
  patientPhone  String
  position      Int

  status        QueueStatus @default(WAITING)
  checkInMethod CheckInMethod @default(MANUAL)

  arrivedAt     DateTime    @default(now())
  notifiedAt    DateTime?
  calledAt      DateTime?
  completedAt   DateTime?

  // MediBook integration (NEW)
  appointmentTime DateTime?
  appointmentId   String?     // Link to Appointment

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([clinicId, status])
  @@index([clinicId, arrivedAt])
}

enum QueueStatus {
  WAITING
  NOTIFIED
  IN_CONSULTATION
  COMPLETED
  NO_SHOW
  CANCELLED
}

enum CheckInMethod {
  QR_CODE
  MANUAL
  WHATSAPP
  SMS
  APPOINTMENT   // NEW: via MediBook
}

model DailyStat {
  id            String   @id @default(uuid())
  clinicId      String
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  date          DateTime @db.Date
  totalPatients Int      @default(0)
  avgWaitMins   Int?
  noShows       Int      @default(0)

  @@unique([clinicId, date])
}

// ============================================
// NEW MODELS (for MediBook)
// ============================================

model Doctor {
  id              String        @id @default(uuid())
  clinicId        String
  clinic          Clinic        @relation(fields: [clinicId], references: [id])

  name            String
  specialty       String?
  phone           String?
  email           String?
  color           String?       // Hex color for calendar (e.g., "#4f46e5")

  // Working hours stored as JSON for flexibility
  // Format: { "monday": { "start": "09:00", "end": "17:00" }, ... }
  workingHours    Json?

  // Default appointment duration in minutes
  slotDuration    Int           @default(15)

  isActive        Boolean       @default(true)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  appointments    Appointment[]

  @@index([clinicId])
  @@index([clinicId, isActive])
}

model Patient {
  id              String        @id @default(uuid())
  clinicId        String
  clinic          Clinic        @relation(fields: [clinicId], references: [id])

  name            String
  phone           String        // Required - used for reminders
  email           String?
  dateOfBirth     DateTime?
  gender          Gender?
  notes           String?       // Internal notes (allergies, preferences, etc.)

  // Preferences
  preferredDoctor String?       // Reference to Doctor.id
  reminderPreference ReminderType @default(SMS)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  appointments    Appointment[]

  // Phone must be unique within a clinic
  @@unique([clinicId, phone])
  @@index([clinicId])
  @@index([clinicId, name])
}

model Appointment {
  id              String        @id @default(uuid())
  clinicId        String
  clinic          Clinic        @relation(fields: [clinicId], references: [id])

  doctorId        String
  doctor          Doctor        @relation(fields: [doctorId], references: [id])

  patientId       String
  patient         Patient       @relation(fields: [patientId], references: [id])

  // Scheduling
  date            DateTime      @db.Date     // Date only (2024-01-15)
  startTime       DateTime                   // Full datetime for start
  endTime         DateTime                   // Full datetime for end
  duration        Int                        // Duration in minutes

  // Status tracking
  status          AppointmentStatus @default(SCHEDULED)

  // Details
  reason          String?       // Reason for visit
  notes           String?       // Additional notes

  // Reminders
  reminder24hSent Boolean       @default(false)
  reminder1hSent  Boolean       @default(false)

  // Integration with DoctorQ
  queueEntryId    String?       // Link to QueueEntry when checked in

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Indexes for common queries
  @@index([clinicId, date])
  @@index([doctorId, date])
  @@index([patientId])
  @@index([status])
}

// ============================================
// ENUMS
// ============================================

enum AppointmentStatus {
  SCHEDULED       // Appointment booked, not yet confirmed
  CONFIRMED       // Patient confirmed (via SMS reply or phone)
  CHECKED_IN      // Patient arrived, linked to QueueEntry
  IN_PROGRESS     // Currently with doctor
  COMPLETED       // Appointment finished
  CANCELLED       // Cancelled by clinic or patient
  NO_SHOW         // Patient didn't arrive
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ReminderType {
  SMS
  WHATSAPP
  NONE
}
```

## Field Descriptions

### Doctor

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `clinicId` | UUID | Foreign key to Clinic |
| `name` | String | Full name of the doctor |
| `specialty` | String? | Medical specialty (e.g., "General Practice") |
| `phone` | String? | Contact phone number |
| `email` | String? | Contact email |
| `color` | String? | Hex color for calendar display (e.g., "#4f46e5") |
| `workingHours` | JSON? | Working schedule per day of week |
| `slotDuration` | Int | Default appointment duration (default: 15 min) |
| `isActive` | Boolean | Soft delete flag |

**workingHours JSON format:**
```json
{
  "monday": { "start": "09:00", "end": "17:00" },
  "tuesday": { "start": "09:00", "end": "17:00" },
  "wednesday": { "start": "09:00", "end": "13:00" },
  "thursday": { "start": "09:00", "end": "17:00" },
  "friday": { "start": "09:00", "end": "17:00" },
  "saturday": null,
  "sunday": null
}
```

### Patient

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `clinicId` | UUID | Foreign key to Clinic |
| `name` | String | Full name of the patient |
| `phone` | String | Contact phone (required, unique per clinic) |
| `email` | String? | Contact email |
| `dateOfBirth` | DateTime? | Date of birth |
| `gender` | Enum? | MALE, FEMALE, or OTHER |
| `notes` | String? | Internal notes (allergies, medical history, etc.) |
| `preferredDoctor` | String? | UUID of preferred doctor |
| `reminderPreference` | Enum | SMS, WHATSAPP, or NONE |

### Appointment

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `clinicId` | UUID | Foreign key to Clinic |
| `doctorId` | UUID | Foreign key to Doctor |
| `patientId` | UUID | Foreign key to Patient |
| `date` | Date | Appointment date (YYYY-MM-DD) |
| `startTime` | DateTime | Start time (full datetime) |
| `endTime` | DateTime | End time (full datetime) |
| `duration` | Int | Duration in minutes |
| `status` | Enum | Current appointment status |
| `reason` | String? | Reason for visit |
| `notes` | String? | Additional notes |
| `reminder24hSent` | Boolean | Whether 24h reminder was sent |
| `reminder1hSent` | Boolean | Whether 1h reminder was sent |
| `queueEntryId` | String? | Link to DoctorQ QueueEntry |

## Appointment Status Flow

```
SCHEDULED ─────────────────────────────────────────┐
    │                                              │
    ▼                                              │
CONFIRMED ─────────────────────────────────────────┤
    │                                              │
    ▼                                              │
CHECKED_IN ────────────────────────────────────────┤
    │                                              │
    ▼                                              │
IN_PROGRESS ───────────────────────────────────────┤
    │                                              │
    ├──────────────┐                               │
    ▼              ▼                               │
COMPLETED      NO_SHOW                             │
                                                   │
                                        CANCELLED ◄┘
                                    (can happen from any status)
```

## Indexes

The schema includes indexes optimized for common queries:

| Model | Index | Purpose |
|-------|-------|---------|
| Doctor | `[clinicId]` | List doctors by clinic |
| Doctor | `[clinicId, isActive]` | List active doctors |
| Patient | `[clinicId]` | List patients by clinic |
| Patient | `[clinicId, name]` | Search patients by name |
| Appointment | `[clinicId, date]` | Get appointments for a day |
| Appointment | `[doctorId, date]` | Get doctor's appointments |
| Appointment | `[patientId]` | Get patient's history |
| Appointment | `[status]` | Filter by status |

## Migrations

### Initial Migration

To apply the schema:

```bash
# From apps/medibook-api directory
npx prisma db push

# Or for production with migration history
npx prisma migrate dev --name add_medibook_models
```

### Adding to Existing DoctorQ Database

Since MediBook shares the database with DoctorQ, we need to:

1. Add new models (Doctor, Patient, Appointment) to the shared schema
2. Update QueueEntry with `appointmentId` field
3. Add `APPOINTMENT` to CheckInMethod enum

```bash
# Generate migration
npx prisma migrate dev --name add_appointment_models

# Apply to production
npx prisma migrate deploy
```

## Sample Data

### Seed Script

```typescript
// apps/medibook-api/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get existing clinic from DoctorQ
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) throw new Error('No clinic found. Run DoctorQ seed first.');

  // Create sample doctor
  const doctor = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: 'Dr. Kamoun',
      specialty: 'General Practice',
      color: '#4f46e5',
      workingHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '13:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
      },
      slotDuration: 20,
    },
  });

  // Create sample patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: 'Ahmed Ben Ali',
        phone: '+21698765432',
        email: 'ahmed@example.com',
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: 'Fatma Trabelsi',
        phone: '+21655443322',
      },
    }),
  ]);

  // Create sample appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        clinicId: clinic.id,
        doctorId: doctor.id,
        patientId: patients[0].id,
        date: today,
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
        endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 09:30
        duration: 30,
        status: 'SCHEDULED',
        reason: 'Annual checkup',
      },
      {
        clinicId: clinic.id,
        doctorId: doctor.id,
        patientId: patients[1].id,
        date: today,
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
        endTime: new Date(today.getTime() + 10.33 * 60 * 60 * 1000), // 10:20
        duration: 20,
        status: 'CONFIRMED',
        reason: 'Follow-up',
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Queries

### Common Queries

**Get today's appointments for a clinic:**
```typescript
const appointments = await prisma.appointment.findMany({
  where: {
    clinicId: clinicId,
    date: today,
  },
  include: {
    doctor: true,
    patient: true,
  },
  orderBy: {
    startTime: 'asc',
  },
});
```

**Get doctor's availability:**
```typescript
const bookedSlots = await prisma.appointment.findMany({
  where: {
    doctorId: doctorId,
    date: date,
    status: { notIn: ['CANCELLED', 'NO_SHOW'] },
  },
  select: {
    startTime: true,
    endTime: true,
  },
});
```

**Search patients:**
```typescript
const patients = await prisma.patient.findMany({
  where: {
    clinicId: clinicId,
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { phone: { contains: searchTerm } },
    ],
  },
  take: 10,
});
```

**Get patient history:**
```typescript
const history = await prisma.appointment.findMany({
  where: {
    patientId: patientId,
    status: 'COMPLETED',
  },
  include: {
    doctor: true,
  },
  orderBy: {
    date: 'desc',
  },
});
```
