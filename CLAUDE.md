# CLAUDE.md - DoctorQ Development Guide

## Project Overview

**DoctorQ** is a virtual queue management system for independent medical practices in Tunisia. It solves the problem of unpredictable wait times when patients have day-appointments (no specific time slot) by letting them track their position in real-time via SMS/WhatsApp.

### The Problem We're Solving
In Tunisia, doctors give appointments for a specific **day**, not a specific **time**. Patients arrive and wait their turn, often for 1-3 hours, with no visibility into when they'll be seen. This wastes patients' time and means doctors meet frustrated patients.

### Our Solution
A lightweight web app where:
1. Patients check in (QR code, manual, or WhatsApp)
2. They see their real-time position and estimated wait
3. They receive SMS/WhatsApp notifications when their turn approaches
4. They can wait elsewhere (café, car, home) and arrive just in time

### Target Users
- **Primary:** Receptionists at independent doctor practices
- **Secondary:** The doctors themselves
- **End users:** Patients (via SMS/WhatsApp, no app install needed)

### Business Model
- 50 TND/month (~$16 USD) per clinic
- Break-even at ~10 clinics
- Target: 50+ clinics for viable business

---

## Tech Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (lightweight) or React Context
- **Real-time:** Socket.io-client
- **PWA:** Workbox for offline support
- **i18n:** react-i18next (French + Arabic with RTL)
- **Forms:** React Hook Form + Zod validation

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js or Fastify
- **Language:** TypeScript
- **Real-time:** Socket.io
- **Validation:** Zod
- **Auth:** Simple JWT (clinic login only, no patient auth)

### Database
- **Primary:** PostgreSQL 15+
- **ORM:** Prisma
- **Migrations:** Prisma Migrate

### External Services
- **SMS:** Twilio (primary) or local Tunisian provider
- **WhatsApp:** WhatsApp Business API via Meta Cloud API (P1, not MVP)
- **Hosting:** Vercel (frontend) + Railway or Render (backend)
- **Domain:** Namecheap or similar

---

## Project Structure

```
doctorq/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # Reusable UI components
│   │   │   │   ├── queue/      # Queue-specific components
│   │   │   │   └── layout/     # Layout components
│   │   │   ├── pages/
│   │   │   │   ├── doctor/     # Doctor/receptionist views
│   │   │   │   ├── patient/    # Patient status view
│   │   │   │   └── checkin/    # Check-in page
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities, API client
│   │   │   ├── i18n/           # Translations (fr, ar)
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # TypeScript types
│   │   └── public/
│   │
│   └── api/                    # Node.js backend
│       ├── src/
│       │   ├── routes/         # Express routes
│       │   ├── services/       # Business logic
│       │   ├── lib/            # Utilities, SMS client
│       │   ├── socket/         # Socket.io handlers
│       │   └── types/          # TypeScript types
│       └── prisma/
│           └── schema.prisma   # Database schema
│
├── packages/
│   └── shared/                 # Shared types, constants
│       ├── types/
│       └── constants/
│
└── docs/
    ├── wireframes.html         # Interactive wireframes
    └── MVP-SPECIFICATION.md    # Full spec document
```

---

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Clinic {
  id                  String       @id @default(uuid())
  name                String
  doctorName          String?
  phone               String?
  address             String?
  language            String       @default("fr") // fr, ar
  avgConsultationMins Int          @default(15)
  isActive            Boolean      @default(true)
  
  // Auth
  email               String       @unique
  passwordHash        String
  
  // Settings
  notifyAtPosition    Int          @default(2)  // Notify when X patients away
  enableWhatsApp      Boolean      @default(false)
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  queueEntries        QueueEntry[]
  dailyStats          DailyStat[]
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
  notifiedAt    DateTime?   // When "almost your turn" sent
  calledAt      DateTime?   // When called for consultation
  completedAt   DateTime?
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([clinicId, status])
  @@index([clinicId, arrivedAt])
}

enum QueueStatus {
  WAITING
  NOTIFIED      // "Almost your turn" sent
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
```

---

## API Endpoints

### Authentication
```
POST /api/auth/login          # Clinic login
POST /api/auth/logout         # Logout
GET  /api/auth/me             # Get current clinic
```

### Queue Management (Requires Auth)
```
GET    /api/queue             # Get today's queue
POST   /api/queue             # Add patient to queue
POST   /api/queue/next        # Call next patient
PATCH  /api/queue/:id/status  # Update patient status
DELETE /api/queue/:id         # Remove patient from queue
POST   /api/queue/:id/notify  # Manually send notification
```

### Patient (Public)
```
GET  /api/patient/:id         # Get patient's position (by entry ID)
POST /api/checkin/:clinicId   # Patient self check-in
```

### Stats (Requires Auth)
```
GET /api/stats/today          # Today's statistics
GET /api/stats/history        # Historical stats (for analytics)
```

### Clinic Settings (Requires Auth)
```
GET   /api/clinic             # Get clinic settings
PATCH /api/clinic             # Update clinic settings
GET   /api/clinic/qr          # Generate QR code for check-in
```

---

## Real-time Events (Socket.io)

### Server → Client
```typescript
// Queue updated (sent to clinic room)
socket.to(`clinic:${clinicId}`).emit('queue:updated', {
  queue: QueueEntry[],
  stats: { waiting: number, seen: number, avgWait: number }
});

// Patient called (sent to specific patient)
socket.to(`patient:${entryId}`).emit('patient:called', {
  position: number,
  status: QueueStatus
});

// Position changed (sent to all waiting patients)
socket.to(`clinic:${clinicId}:patients`).emit('position:changed', {
  entryId: string,
  newPosition: number,
  estimatedWait: number
});
```

### Client → Server
```typescript
// Join clinic room (for doctor/receptionist)
socket.emit('join:clinic', { clinicId, token });

// Join patient room (for patient status page)
socket.emit('join:patient', { entryId });
```

---

## SMS Templates

### Configuration
```typescript
// Environment variables
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890  // Or Tunisian number

// SMS sending limit per clinic per day
SMS_DAILY_LIMIT=500
```

### Templates (i18n keys)
```typescript
const SMS_TEMPLATES = {
  QUEUE_JOINED: {
    fr: "{{clinicName}} - Vous êtes #{{position}} dans la file. Attente: ~{{waitTime}}min. Statut: {{link}}",
    ar: "{{clinicName}} - أنت رقم {{position}} في الطابور. الانتظار: ~{{waitTime}} دقيقة. الحالة: {{link}}"
  },
  ALMOST_TURN: {
    fr: "⚠️ {{clinicName}} - Plus que {{remaining}} patient(s) avant vous! Merci de vous rapprocher.",
    ar: "⚠️ {{clinicName}} - باقي {{remaining}} مريض قبلك! يرجى الاقتراب من العيادة."
  },
  YOUR_TURN: {
    fr: "🎉 {{clinicName}} - C'EST VOTRE TOUR! Présentez-vous à l'accueil.",
    ar: "🎉 {{clinicName}} - جاء دورك! تفضل للاستقبال."
  }
};
```

---

## Key Components

### Queue List (Doctor View)
```typescript
// components/queue/QueueList.tsx
interface QueueListProps {
  entries: QueueEntry[];
  onCallNext: () => void;
  onRemove: (id: string) => void;
  onNotify: (id: string) => void;
}
```

### Patient Position Card
```typescript
// components/patient/PositionCard.tsx
interface PositionCardProps {
  position: number;
  estimatedWaitMins: number;
  status: QueueStatus;
  patientsAhead: number;
}
```

### Add Patient Modal
```typescript
// components/queue/AddPatientModal.tsx
interface AddPatientForm {
  patientPhone: string;  // Required, +216 format
  patientName?: string;  // Optional
  visitReason?: string;  // Optional
}
```

---

## i18n Setup

### Directory Structure
```
src/i18n/
├── index.ts          # i18next config
├── locales/
│   ├── fr.json       # French translations
│   └── ar.json       # Arabic translations
```

### RTL Support
```typescript
// Detect language and apply RTL
const isRTL = i18n.language === 'ar';
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;
```

### Tailwind RTL
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),  // Adds rtl: and ltr: variants
  ],
}
```

---

## Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_DEFAULT_LANGUAGE=fr
```

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/doctorq

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# SMS (Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+xxx

# WhatsApp (future)
WHATSAPP_BUSINESS_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Development Commands

```bash
# Install dependencies (from root)
pnpm install

# Start development
pnpm dev              # Starts both frontend and backend
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only

# Database
pnpm db:push          # Push schema to DB
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
pnpm test:web         # Frontend tests
pnpm test:api         # Backend tests

# Build
pnpm build            # Build all
pnpm build:web        # Build frontend
pnpm build:api        # Build backend

# Lint & Format
pnpm lint             # ESLint
pnpm format           # Prettier
```

---

## Implementation Priority

### Week 1-2: Foundation
1. [ ] Project setup (monorepo with pnpm workspaces)
2. [ ] Database schema + Prisma setup
3. [ ] Basic Express API with auth
4. [ ] React app scaffold with Tailwind
5. [ ] Doctor queue dashboard (view only)
6. [ ] Add patient functionality
7. [ ] Call next patient functionality

### Week 3: Patient Flow
1. [ ] Patient check-in page (QR landing)
2. [ ] QR code generation
3. [ ] Patient status page
4. [ ] Socket.io real-time updates
5. [ ] Position auto-refresh

### Week 4: Notifications + i18n
1. [ ] Twilio SMS integration
2. [ ] Queue joined notification
3. [ ] "Almost turn" notification (2 patients away)
4. [ ] "Your turn" notification
5. [ ] French translations
6. [ ] Arabic translations + RTL

### Week 5-6: Polish + Pilot
1. [ ] Error handling & edge cases
2. [ ] Mobile responsive fixes
3. [ ] Loading states & optimistic updates
4. [ ] Deploy to staging
5. [ ] Pilot with 3 doctors
6. [ ] Bug fixes from feedback

---

## Testing Scenarios

### Critical Paths to Test
1. **Happy path:** Patient checks in → waits → gets notified → sees doctor
2. **No-show:** Patient checks in → never arrives → marked as no-show
3. **Manual add:** Receptionist adds patient without QR
4. **Queue reorder:** Patient removed mid-queue → positions update
5. **Offline:** What happens if connection drops?
6. **SMS failure:** Twilio fails → graceful degradation

### Test Data
```typescript
// Seed script should create:
// - 1 test clinic (Dr. Ahmed, La Marsa)
// - 5-10 patients in queue at various positions
// - Mix of statuses (waiting, notified, in_consultation)
```

---

## Common Patterns

### Estimated Wait Calculation
```typescript
function calculateEstimatedWait(
  position: number,
  avgConsultationMins: number
): number {
  // Simple: position * average consultation time
  // Future: Use ML model based on historical data
  return position * avgConsultationMins;
}
```

### Phone Number Validation (Tunisia)
```typescript
const TUNISIA_PHONE_REGEX = /^(\+216)?[2459]\d{7}$/;

function formatTunisianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('216')) {
    return `+${cleaned}`;
  }
  return `+216${cleaned}`;
}
```

### Position Recalculation
```typescript
async function recalculatePositions(clinicId: string) {
  const waiting = await prisma.queueEntry.findMany({
    where: { clinicId, status: 'WAITING' },
    orderBy: { arrivedAt: 'asc' }
  });
  
  await Promise.all(
    waiting.map((entry, index) =>
      prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: index + 1 }
      })
    )
  );
}
```

---

## Deployment Checklist

### Before Launch
- [ ] Environment variables set in production
- [ ] Database migrated
- [ ] SSL certificates configured
- [ ] SMS provider verified for Tunisia
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics setup (simple: Plausible or Umami)

### DNS/Domains
```
doctorq.tn           → Frontend (Vercel)
api.doctorq.tn       → Backend (Railway)
q.doctorq.tn         → Short URL for SMS links
```

---

## Known Limitations (MVP)

1. **Single doctor per clinic** - No multi-doctor support
2. **No appointment booking** - Only same-day queue
3. **No patient accounts** - Phone number is the identifier
4. **Basic analytics** - Just today's stats
5. **SMS only** - WhatsApp is P1 feature

---

## Useful Resources

- [Wireframes](/docs/wireframes.html) - Interactive UI mockups
- [MVP Spec](/docs/MVP-SPECIFICATION.md) - Full feature specification
- [Twilio Tunisia](https://www.twilio.com/en-us/guidelines/tn/sms) - SMS guidelines for Tunisia
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api) - For future integration
- [Tailwind RTL](https://github.com/20lives/tailwindcss-rtl) - RTL support plugin

---

## Questions for Claude Code

When developing, you can ask me to:
- "Create the queue service with add/remove/next functionality"
- "Build the patient status page with real-time updates"
- "Set up Twilio SMS integration with the templates"
- "Add Arabic translations and RTL support"
- "Create the QR code check-in flow"
- "Write tests for the queue position calculation"

I have full context on the business requirements, user flows, and technical decisions.
