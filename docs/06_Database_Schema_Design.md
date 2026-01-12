# Database Schema Design - DoctorQ

**Document Version:** 1.0
**Last Updated:** January 11, 2026
**Database:** PostgreSQL 15+
**ORM:** Prisma 5.x
**Status:** Ready for Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Complete Prisma Schema](#complete-prisma-schema)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Model Specifications](#model-specifications)
5. [Indexes & Performance](#indexes--performance)
6. [Migration Strategy](#migration-strategy)
7. [Seed Data](#seed-data)
8. [Query Patterns](#query-patterns)

---

## Overview

### Design Principles
- **Simplicity First:** Minimal tables for MVP (3 models: Clinic, QueueEntry, DailyStat)
- **Scalability Ready:** Schema supports future multi-doctor, analytics features
- **Performance Optimized:** Strategic indexes on high-query columns
- **Data Integrity:** Foreign keys, constraints, default values
- **Audit Trail:** CreatedAt/updatedAt timestamps on all models

### Database Choice: PostgreSQL
**Why PostgreSQL over MongoDB/MySQL:**
- ✅ Strong ACID compliance for queue consistency
- ✅ Excellent JSON support for future flexibility
- ✅ Native support for date/time operations (critical for queue logic)
- ✅ Advanced indexing (composite, partial)
- ✅ Free tier availability (Railway, Render, Supabase)

---

## Complete Prisma Schema

```prisma
// File: prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

/// Queue entry status progression: WAITING → NOTIFIED → IN_CONSULTATION → COMPLETED
/// Alternative paths: WAITING → NO_SHOW or WAITING → CANCELLED
enum QueueStatus {
  WAITING          // Patient in queue, waiting for turn
  NOTIFIED         // "Almost your turn" notification sent (P1 feature)
  IN_CONSULTATION  // Currently with doctor
  COMPLETED        // Consultation finished
  NO_SHOW          // Patient didn't arrive when called
  CANCELLED        // Manually removed by receptionist
}

/// How the patient joined the queue (determines notification channel)
enum CheckInMethod {
  QR_CODE    // Scanned QR code at clinic
  MANUAL     // Added by receptionist
  WHATSAPP   // Checked in via WhatsApp bot (P1)
  SMS        // Sent keyword via SMS (P2)
}

// ============================================
// MODELS
// ============================================

/// Clinic/Doctor account (one per independent practice)
model Clinic {
  id        String   @id @default(uuid())

  // Basic Information
  name      String   // e.g., "Cabinet Dr. Ahmed Ben Salem"
  doctorName String? // Optional: "Dr. Ahmed Ben Salem"
  phone     String?  // Clinic phone number for contact
  address   String?  // Physical address (for future map feature)

  // Settings
  language            String  @default("fr") // "fr" or "ar" for SMS/UI language
  avgConsultationMins Int     @default(15)   // Average time per patient (for wait estimates)
  notifyAtPosition    Int     @default(2)    // Send "almost turn" when this many patients away (P1)
  enableWhatsApp      Boolean @default(false) // WhatsApp notifications enabled (P1)

  // Account Status
  isActive  Boolean  @default(true) // Subscription active/inactive

  // Authentication
  email        String @unique // Login email
  passwordHash String         // Bcrypt hashed password

  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  queueEntries QueueEntry[]
  dailyStats   DailyStat[]

  @@index([email])
  @@index([isActive])
}

/// Individual queue entry for a patient visit
model QueueEntry {
  id       String @id @default(uuid())

  // Clinic Relation
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Patient Information
  patientName  String? // Optional: patient's name (privacy consideration)
  patientPhone String  // Required: +216XXXXXXXX format for Tunisia

  // Queue Metadata
  position       Int         // Position in queue (1 = next, 2 = after next, etc.)
  status         QueueStatus @default(WAITING)
  checkInMethod  CheckInMethod @default(MANUAL)

  // Timestamps
  arrivedAt   DateTime  @default(now()) // When patient checked in
  notifiedAt  DateTime? // When "almost turn" SMS sent (P1)
  calledAt    DateTime? // When doctor called patient (status → IN_CONSULTATION)
  completedAt DateTime? // When consultation finished (status → COMPLETED)

  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Indexes for performance
  @@index([clinicId, status])           // Fast filtering: "get all waiting patients for clinic X"
  @@index([clinicId, arrivedAt])        // Fast ordering: "get queue sorted by arrival time"
  @@index([clinicId, position, status]) // Composite for position queries
  @@index([patientPhone])               // Fast lookup: "find patient by phone"
}

/// Daily statistics per clinic (for analytics)
model DailyStat {
  id String @id @default(uuid())

  // Clinic Relation
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Date
  date Date @db.Date // Date for this stat snapshot

  // Metrics
  totalPatients Int  @default(0) // Total patients seen this day
  avgWaitMins   Int? // Average wait time in minutes (calculated at end of day)
  noShows       Int  @default(0) // Count of NO_SHOW status entries

  // Ensure one stat record per clinic per day
  @@unique([clinicId, date])
  @@index([clinicId, date])
}
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    CLINIC ||--o{ QUEUE_ENTRY : "has many"
    CLINIC ||--o{ DAILY_STAT : "has many"

    CLINIC {
        uuid id PK
        string name
        string doctorName
        string phone
        string address
        string language
        int avgConsultationMins
        int notifyAtPosition
        boolean enableWhatsApp
        boolean isActive
        string email UK
        string passwordHash
        timestamp createdAt
        timestamp updatedAt
    }

    QUEUE_ENTRY {
        uuid id PK
        uuid clinicId FK
        string patientName
        string patientPhone
        int position
        enum status
        enum checkInMethod
        timestamp arrivedAt
        timestamp notifiedAt
        timestamp calledAt
        timestamp completedAt
        timestamp createdAt
        timestamp updatedAt
    }

    DAILY_STAT {
        uuid id PK
        uuid clinicId FK
        date date
        int totalPatients
        int avgWaitMins
        int noShows
    }
```

---

## Model Specifications

### Clinic Model

**Purpose:** Represents an independent doctor's practice/clinic account.

**Key Fields:**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `name` | String | Yes | - | Display name: "Cabinet Dr. Ahmed" |
| `doctorName` | String | No | - | Optional: "Dr. Ahmed Ben Salem" |
| `email` | String | Yes | - | Unique login email |
| `passwordHash` | String | Yes | - | Bcrypt hash (10 rounds) |
| `language` | String | Yes | "fr" | "fr" or "ar" for SMS templates |
| `avgConsultationMins` | Int | Yes | 15 | Default 15 min per patient |
| `notifyAtPosition` | Int | Yes | 2 | P1: notify when 2 patients away |
| `isActive` | Boolean | Yes | true | Subscription status |

**Constraints:**
- `email` must be unique (enforced by `@unique`)
- `passwordHash` must be bcrypt with 10+ rounds
- `language` must be "fr" or "ar" (validated in application layer)

**Example Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cabinet Dr. Ahmed Ben Salem",
  "doctorName": "Dr. Ahmed Ben Salem",
  "phone": "+216 71 123 456",
  "address": "15 Rue de Marseille, La Marsa, Tunisia",
  "email": "dr.ahmed@example.tn",
  "passwordHash": "$2b$10$...",
  "language": "fr",
  "avgConsultationMins": 15,
  "notifyAtPosition": 2,
  "enableWhatsApp": false,
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-01T10:00:00Z"
}
```

---

### QueueEntry Model

**Purpose:** Individual patient's queue entry for a specific day.

**Key Fields:**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key (used in status page URL) |
| `clinicId` | UUID | Yes | - | Foreign key to Clinic |
| `patientPhone` | String | Yes | - | +216XXXXXXXX format |
| `patientName` | String | No | - | Optional for privacy |
| `position` | Int | Yes | - | 1-based position (1 = next) |
| `status` | Enum | Yes | WAITING | See QueueStatus enum |
| `checkInMethod` | Enum | Yes | MANUAL | See CheckInMethod enum |
| `arrivedAt` | DateTime | Yes | now() | Check-in timestamp |
| `calledAt` | DateTime | No | - | When status → IN_CONSULTATION |
| `completedAt` | DateTime | No | - | When status → COMPLETED |

**Status Transitions:**
```
WAITING → IN_CONSULTATION → COMPLETED
WAITING → NO_SHOW (if patient doesn't arrive when called)
WAITING → CANCELLED (manually removed)
WAITING → NOTIFIED → IN_CONSULTATION (P1 with "almost turn" feature)
```

**Example Record:**
```json
{
  "id": "abc12345-e29b-41d4-a716-446655440001",
  "clinicId": "550e8400-e29b-41d4-a716-446655440000",
  "patientPhone": "+216 98 123 456",
  "patientName": "Ahmed Trabelsi",
  "position": 3,
  "status": "WAITING",
  "checkInMethod": "QR_CODE",
  "arrivedAt": "2026-01-11T09:30:00Z",
  "notifiedAt": null,
  "calledAt": null,
  "completedAt": null,
  "createdAt": "2026-01-11T09:30:00Z",
  "updatedAt": "2026-01-11T09:30:00Z"
}
```

---

### DailyStat Model

**Purpose:** Daily aggregated statistics per clinic for analytics.

**Key Fields:**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | Yes | Auto | Primary key |
| `clinicId` | UUID | Yes | - | Foreign key to Clinic |
| `date` | Date | Yes | - | Date for this stat snapshot |
| `totalPatients` | Int | Yes | 0 | Count of COMPLETED entries |
| `avgWaitMins` | Int | No | - | Average (calledAt - arrivedAt) |
| `noShows` | Int | Yes | 0 | Count of NO_SHOW entries |

**Unique Constraint:** `[clinicId, date]` ensures one record per clinic per day.

**Example Record:**
```json
{
  "id": "stat1234-e29b-41d4-a716-446655440002",
  "clinicId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-01-11",
  "totalPatients": 28,
  "avgWaitMins": 42,
  "noShows": 2
}
```

---

## Indexes & Performance

### Index Strategy

**1. Clinic Indexes**
```prisma
@@index([email])      // Fast login lookup
@@index([isActive])   // Filter active subscriptions
```
**Query Pattern:** `SELECT * FROM Clinic WHERE email = ?` (login)

---

**2. QueueEntry Indexes**
```prisma
@@index([clinicId, status])           // Primary queue query
@@index([clinicId, arrivedAt])        // Ordering by time
@@index([clinicId, position, status]) // Position-based queries
@@index([patientPhone])               // Patient lookup
```

**Query Patterns:**
```sql
-- Get today's waiting queue for clinic (MOST COMMON)
SELECT * FROM QueueEntry
WHERE clinicId = ? AND status IN ('WAITING', 'NOTIFIED')
ORDER BY position ASC;

-- Get patient by phone (status page lookup)
SELECT * FROM QueueEntry
WHERE patientPhone = ? AND status != 'COMPLETED'
ORDER BY arrivedAt DESC LIMIT 1;

-- Recalculate positions after removal
SELECT * FROM QueueEntry
WHERE clinicId = ? AND status = 'WAITING'
ORDER BY arrivedAt ASC;
```

**Performance Targets:**
- Queue list query: <50ms for 100 entries
- Patient lookup: <20ms
- Position update (batch): <100ms for 50 entries

---

**3. DailyStat Indexes**
```prisma
@@index([clinicId, date])  // Time-series queries
```

**Query Pattern:**
```sql
-- Get last 30 days of stats
SELECT * FROM DailyStat
WHERE clinicId = ? AND date >= ?
ORDER BY date DESC;
```

---

### Index Maintenance

**Automatic:**
- Prisma generates indexes from `@@index` directives
- PostgreSQL auto-vacuums maintain index health

**Manual (if needed at scale):**
```sql
-- Reindex if query performance degrades
REINDEX INDEX "QueueEntry_clinicId_status_idx";

-- Analyze table statistics
ANALYZE QueueEntry;
```

---

## Migration Strategy

### Initial Migration (Week 1)

**Step 1: Initialize Prisma**
```bash
# Install Prisma
pnpm add prisma @prisma/client

# Initialize (creates prisma/schema.prisma)
pnpm prisma init
```

**Step 2: Set Database URL**
```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/doctorq?schema=public"
```

**Step 3: Create Migration**
```bash
# Generate migration from schema.prisma
pnpm prisma migrate dev --name init

# This creates:
# - prisma/migrations/20260111_init/migration.sql
# - Applies migration to database
# - Generates Prisma Client
```

**Generated SQL (preview):**
```sql
-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED');
CREATE TYPE "CheckInMethod" AS ENUM ('QR_CODE', 'MANUAL', 'WHATSAPP', 'SMS');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    -- ... all fields
    CONSTRAINT "Clinic_email_key" UNIQUE ("email")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    -- ... all fields
    CONSTRAINT "QueueEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    -- ... all fields
    CONSTRAINT "DailyStat_clinicId_date_key" UNIQUE ("clinicId", "date")
);

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_status_idx" ON "QueueEntry"("clinicId", "status");
-- ... more indexes
```

---

### Adding Fields (Non-Breaking Changes)

**Example: Add "visitReason" field to QueueEntry**

**Step 1: Update schema.prisma**
```prisma
model QueueEntry {
  // ... existing fields
  visitReason String? // New optional field
}
```

**Step 2: Generate migration**
```bash
pnpm prisma migrate dev --name add_visit_reason
```

**Step 3: Backfill (if needed)**
```typescript
// Optional: Set default value for existing records
await prisma.queueEntry.updateMany({
  where: { visitReason: null },
  data: { visitReason: "Non spécifié" }
});
```

---

### Schema Changes (Breaking Changes)

**Example: Rename "doctorName" to "physicianName"**

**Step 1: Create migration with manual SQL**
```bash
pnpm prisma migrate create --name rename_doctor_to_physician
```

**Step 2: Edit migration file**
```sql
-- prisma/migrations/20260201_rename/migration.sql
ALTER TABLE "Clinic" RENAME COLUMN "doctorName" TO "physicianName";
```

**Step 3: Update schema.prisma**
```prisma
model Clinic {
  physicianName String? // Renamed from doctorName
}
```

**Step 4: Apply migration**
```bash
pnpm prisma migrate deploy
```

---

### Production Migration Checklist

- [ ] Test migration on staging database first
- [ ] Backup production database before migration
- [ ] Run migration during low-traffic window
- [ ] Verify migration success: `pnpm prisma migrate status`
- [ ] Regenerate Prisma Client: `pnpm prisma generate`
- [ ] Restart application to use new schema

---

## Seed Data

### Seed Script for Development/Testing

**File:** `prisma/seed.ts`

```typescript
import { PrismaClient, QueueStatus, CheckInMethod } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Test Clinic
  const clinic = await prisma.clinic.upsert({
    where: { email: 'dr.ahmed@test.tn' },
    update: {},
    create: {
      name: 'Cabinet Dr. Ahmed Ben Salem - TEST',
      doctorName: 'Dr. Ahmed Ben Salem',
      email: 'dr.ahmed@test.tn',
      passwordHash: await bcrypt.hash('password123', 10),
      phone: '+216 71 123 456',
      address: '15 Rue de Marseille, La Marsa 2078',
      language: 'fr',
      avgConsultationMins: 15,
      notifyAtPosition: 2,
      enableWhatsApp: false,
      isActive: true,
    },
  });

  console.log('✅ Created clinic:', clinic.name);

  // 2. Create Queue Entries (simulate active queue)
  const patients = [
    { name: 'Fatma Ben Ali', phone: '+216 98 111 111', status: 'IN_CONSULTATION' as QueueStatus, position: 1 },
    { name: 'Mohamed Trabelsi', phone: '+216 98 222 222', status: 'WAITING' as QueueStatus, position: 2 },
    { name: 'Sonia Khelifi', phone: '+216 98 333 333', status: 'WAITING' as QueueStatus, position: 3 },
    { name: 'Karim Jaziri', phone: '+216 98 444 444', status: 'WAITING' as QueueStatus, position: 4 },
    { name: 'Amina Gharbi', phone: '+216 98 555 555', status: 'WAITING' as QueueStatus, position: 5 },
  ];

  for (const patient of patients) {
    await prisma.queueEntry.create({
      data: {
        clinicId: clinic.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        position: patient.position,
        status: patient.status,
        checkInMethod: CheckInMethod.QR_CODE,
        arrivedAt: new Date(Date.now() - (60 - patient.position * 10) * 60000), // Stagger arrival times
        calledAt: patient.status === 'IN_CONSULTATION' ? new Date() : null,
      },
    });
  }

  console.log(`✅ Created ${patients.length} queue entries`);

  // 3. Create Sample Daily Stats (last 7 days)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.dailyStat.upsert({
      where: {
        clinicId_date: {
          clinicId: clinic.id,
          date: date,
        },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        date: date,
        totalPatients: Math.floor(Math.random() * 20) + 15, // 15-35 patients
        avgWaitMins: Math.floor(Math.random() * 30) + 30,  // 30-60 min avg
        noShows: Math.floor(Math.random() * 3),            // 0-2 no-shows
      },
    });
  }

  console.log('✅ Created 7 days of statistics');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add to package.json:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Run seed:**
```bash
pnpm prisma db seed
```

---

## Query Patterns

### Common Queries with Prisma

#### 1. Get Today's Queue for Clinic

```typescript
// Get all waiting/notified patients ordered by position
const queue = await prisma.queueEntry.findMany({
  where: {
    clinicId: clinicId,
    status: { in: ['WAITING', 'NOTIFIED'] },
  },
  orderBy: { position: 'asc' },
  select: {
    id: true,
    patientName: true,
    patientPhone: true,
    position: true,
    status: true,
    arrivedAt: true,
  },
});
```

**Performance:** <50ms with index on `[clinicId, status]`

---

#### 2. Add Patient to Queue

```typescript
// Get current max position
const lastEntry = await prisma.queueEntry.findFirst({
  where: { clinicId, status: 'WAITING' },
  orderBy: { position: 'desc' },
  select: { position: true },
});

const newPosition = (lastEntry?.position || 0) + 1;

// Create new entry
const entry = await prisma.queueEntry.create({
  data: {
    clinicId,
    patientPhone: '+216 98 123 456',
    patientName: 'Ahmed Trabelsi',
    position: newPosition,
    status: 'WAITING',
    checkInMethod: 'QR_CODE',
  },
});
```

---

#### 3. Call Next Patient

```typescript
// Find next patient in queue
const nextPatient = await prisma.queueEntry.findFirst({
  where: { clinicId, status: 'WAITING' },
  orderBy: { position: 'asc' },
});

if (!nextPatient) throw new Error('No patients waiting');

// Update to IN_CONSULTATION
const updated = await prisma.queueEntry.update({
  where: { id: nextPatient.id },
  data: {
    status: 'IN_CONSULTATION',
    calledAt: new Date(),
  },
});

// Send "your turn" notification here
await sendSMS(updated.patientPhone, `🎉 C'EST VOTRE TOUR!`);
```

---

#### 4. Recalculate Positions After Removal

```typescript
// Get all waiting patients ordered by arrival time
const waitingPatients = await prisma.queueEntry.findMany({
  where: { clinicId, status: 'WAITING' },
  orderBy: { arrivedAt: 'asc' },
});

// Update positions in batch
await prisma.$transaction(
  waitingPatients.map((patient, index) =>
    prisma.queueEntry.update({
      where: { id: patient.id },
      data: { position: index + 1 },
    })
  )
);
```

**Performance:** <100ms for 50 entries with transaction

---

#### 5. Get Patient Status (Public Endpoint)

```typescript
// Find active queue entry by ID (from SMS link)
const entry = await prisma.queueEntry.findUnique({
  where: { id: entryId },
  include: {
    clinic: {
      select: {
        name: true,
        doctorName: true,
        avgConsultationMins: true,
      },
    },
  },
});

if (!entry || entry.status === 'COMPLETED') {
  throw new Error('Queue entry not found or completed');
}

// Calculate estimated wait
const estimatedWait = entry.position * entry.clinic.avgConsultationMins;

return {
  position: entry.position,
  estimatedWaitMins: estimatedWait,
  status: entry.status,
  clinicName: entry.clinic.name,
};
```

---

### Batch Operations

#### Daily Stats Calculation (Cron Job)

```typescript
// Run at end of day (11:59 PM) via cron
async function calculateDailyStats(clinicId: string, date: Date) {
  // Get all completed entries for the day
  const completedEntries = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: 'COMPLETED',
      completedAt: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  // Calculate average wait time
  const avgWaitMins =
    completedEntries.reduce((sum, entry) => {
      const wait = (entry.calledAt!.getTime() - entry.arrivedAt.getTime()) / 60000;
      return sum + wait;
    }, 0) / completedEntries.length;

  // Count no-shows
  const noShows = await prisma.queueEntry.count({
    where: {
      clinicId,
      status: 'NO_SHOW',
      arrivedAt: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  // Upsert daily stat
  await prisma.dailyStat.upsert({
    where: { clinicId_date: { clinicId, date } },
    update: {
      totalPatients: completedEntries.length,
      avgWaitMins: Math.round(avgWaitMins),
      noShows,
    },
    create: {
      clinicId,
      date,
      totalPatients: completedEntries.length,
      avgWaitMins: Math.round(avgWaitMins),
      noShows,
    },
  });
}
```

---

## Related Documents

- [05_Technical_Architecture.md](05_Technical_Architecture.md) - Overall system architecture
- [11_API_Specification.md](11_API_Specification.md) - API endpoints using these models
- [12_Testing_Plan.md](12_Testing_Plan.md) - Database testing strategies

---

**Status:** ✅ **APPROVED** - Ready for Prisma migration
