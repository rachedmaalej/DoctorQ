# BleSaf - Project Status & Technical Summary

**Last updated:** February 4, 2026
**Version:** 0.6.0

---

## 1. Product Description

**BleSaf** (formerly DoctorQ) is a self-service SaaS queue management system for medical clinics in Tunisia. It enables doctors to discover, sign up, and start using BleSaf without admin intervention.

### The Problem
In Tunisia, doctors give appointments for a specific **day**, not a specific **time**. Patients arrive and wait 1-3 hours with no visibility into when they'll be seen. This wastes patients' time and creates frustration for both patients and doctors.

### The Solution
A lightweight web app where:
1. Patients check in (QR code, manual entry, or WhatsApp)
2. They see their real-time position and estimated wait time
3. They receive SMS/WhatsApp notifications when their turn approaches
4. They can wait elsewhere (cafe, car, home) and arrive just in time

### Target Market
- **Primary users:** Receptionists at independent doctor practices in Tunisia
- **Secondary users:** Doctors themselves
- **End users:** Patients (via SMS/WhatsApp, no app install needed)

### Business Model
- **Pricing:** 50 TND/month (~$16 USD) or 500 TND/year (2 months free)
- **Trial:** 30-day free trial with 50 SMS credits included
- **SMS credits:** Sold separately (Starter: 100/10TND, Standard: 300/25TND, Pro: 1000/70TND)
- **Break-even:** ~10 clinics
- **Target:** 50+ clinics for viable business

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **Styling** | Tailwind CSS 3.4 |
| **State** | Zustand 4.4 |
| **Forms** | React Hook Form 7 + Zod validation |
| **Real-time** | Socket.io (client + server) |
| **i18n** | react-i18next (French + Arabic with RTL) |
| **Backend** | Node.js 20+ / Express 4 / TypeScript |
| **Database** | PostgreSQL 15+ (Supabase-hosted) |
| **ORM** | Prisma 5.8 |
| **Auth** | JWT (jsonwebtoken) |
| **QR Codes** | qrcode library |
| **Email** | Resend API |
| **Payments** | Konnect (Tunisian payment gateway) |
| **SMS** | Twilio (planned) |
| **Monitoring** | Prometheus (prom-client) |
| **Scheduling** | node-cron |
| **Testing** | Vitest + Playwright + Testing Library |
| **Hosting** | Vercel (frontend) + Railway (backend) |

---

## 3. Project Structure

```
IjaTawa/
├── apps/
│   ├── web/                          # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/           # 26 components (4,201 lines)
│   │   │   │   ├── admin/            # Admin dashboard components (5 files)
│   │   │   │   ├── layout/           # Header (1 file)
│   │   │   │   ├── md3/              # Material Design 3 components (3 files)
│   │   │   │   ├── patient/          # Patient view components (6 files)
│   │   │   │   ├── queue/            # Queue management components (6 files)
│   │   │   │   └── ui/              # Reusable UI (5 files)
│   │   │   ├── data/                 # Static data (fun facts, 2 files)
│   │   │   ├── hooks/                # Custom hooks (3 files, 668 lines)
│   │   │   ├── i18n/                 # Translations (806 lines across 2 locales)
│   │   │   ├── lib/                  # Utilities (8 files, 6 with tests)
│   │   │   ├── pages/                # Page components (10 files, 3,587 lines)
│   │   │   ├── stores/               # Zustand stores (2 files, 303 lines)
│   │   │   └── types/                # TypeScript types (1 file, 247 lines)
│   │   └── public/                   # Static assets
│   │
│   └── api/                          # Node.js backend
│       ├── src/
│       │   ├── routes/               # Express routes (7 files, 1,879 lines)
│       │   ├── services/             # Business logic (8 files, 2,544 lines)
│       │   ├── lib/                  # Utilities (8 files, 984 lines)
│       │   ├── types/                # TypeScript types (1 file)
│       │   └── index.ts              # Server entry (350 lines)
│       └── prisma/
│           └── schema.prisma         # Database schema (231 lines)
│
├── docs/                             # Documentation & design assets
│   ├── business/                     # Business plans, presentations
│   ├── design/                       # Mockups, wireframes, MD3 system
│   ├── Go-to-Market Strategy/        # SaaS launch documentation
│   ├── planning/                     # MVP spec, project phases
│   ├── roadmap/                      # Scalability, monitoring plans
│   └── technical/                    # API spec, deployment guide
│
├── brief/                            # UI screenshots & mockups
├── Dockerfile                        # Railway deployment
├── railway.json                      # Railway config
├── vercel.json                       # Vercel config
└── package.json                      # Monorepo root (pnpm workspaces)
```

**Total TypeScript:** ~23,400 lines across both apps

---

## 4. Database Schema

### Models (7 tables)

| Model | Purpose | Fields |
|-------|---------|--------|
| **Clinic** | Clinic accounts & settings | 30+ fields (auth, subscription, onboarding, SMS credits, settings) |
| **QueueEntry** | Individual patient queue entries | 13 fields + 11 indexes for performance |
| **DailyStat** | Daily aggregated statistics | 6 fields, unique on [clinicId, date] |
| **PaymentRecord** | Payment tracking | 10 fields (amount in millimes) |
| **SubscriptionEvent** | Subscription lifecycle events | 6 fields (trial, payment, cancellation) |
| **SmsPackagePurchase** | SMS credit purchases | 7 fields |

### Enums (4)

| Enum | Values |
|------|--------|
| **QueueStatus** | WAITING, NOTIFIED, IN_CONSULTATION, COMPLETED, NO_SHOW, CANCELLED |
| **CheckInMethod** | QR_CODE, MANUAL, WHATSAPP, SMS |
| **SubscriptionStatus** | TRIAL, ACTIVE, PAST_DUE, EXPIRED, CANCELLED |
| **SubscriptionPlan** | MONTHLY (50 TND), YEARLY (500 TND) |

### Key Clinic Fields
- **Auth:** email (unique), passwordHash, emailVerified, emailVerificationToken, passwordResetToken
- **Subscription:** subscriptionStatus, subscriptionPlan, trialEndsAt, subscriptionEndsAt
- **SMS:** smsCredits, smsCreditsUsed
- **Settings:** avgConsultationMins, notifyAtPosition, isDoctorPresent, businessType, showAppointments
- **Onboarding:** onboardingCompleted, onboardingStep
- **Tracking:** lastLoginAt, createdAt, updatedAt

---

## 5. API Endpoints

### Authentication (`/api/auth/`) - 3 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Clinic login (returns JWT + clinic data + UI labels) |
| POST | `/logout` | Yes | Logout (client-side token removal) |
| GET | `/me` | Yes | Get current authenticated clinic |

### Queue Management (`/api/queue/`) - 7 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get today's queue (all entries + stats) |
| POST | `/` | Yes | Add patient to queue (phone, name, appointment time) |
| POST | `/next` | Yes | Call next waiting patient to consultation |
| PATCH | `/:id/status` | Yes | Update patient status (complete, no-show, cancel) |
| DELETE | `/:id` | Yes | Remove patient from queue |
| GET | `/patient/:entryId` | No | Public: Get patient position & status |
| POST | `/checkin/:clinicId` | No | Public: Patient self check-in via QR |

### Clinic Settings (`/api/clinic/`) - 3 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get clinic settings |
| PATCH | `/` | Yes | Update clinic settings (name, doctor, consultation time, presence) |
| GET | `/qr` | Yes | Generate QR code for patient check-in |

### Self-Service Signup (`/api/signup/`) - 5 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | No | Register new clinic (30-day trial + 50 SMS) |
| POST | `/verify-email` | No | Verify email with token |
| POST | `/resend-verification` | No | Resend verification email |
| POST | `/forgot-password` | No | Request password reset email |
| POST | `/reset-password` | No | Reset password with token |

### Subscription (`/api/subscription/`) - 6 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get subscription status |
| POST | `/checkout` | Yes | Initiate Konnect payment for subscription |
| POST | `/webhook` | No | Konnect payment webhook |
| GET | `/sms` | Yes | Get SMS credit balance & packages |
| POST | `/sms/purchase` | Yes | Purchase SMS credits |
| GET/POST | `/onboarding` | Yes | Get/update onboarding progress |

### Admin (`/api/admin/`) - 7 endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/metrics` | Admin | Business intelligence metrics with trends |
| GET | `/clinics` | Admin | List all clinics with health status |
| POST | `/clinics` | Admin | Create new clinic |
| GET | `/clinics/:id` | Admin | Detailed clinic analytics |
| DELETE | `/clinics/:id` | Admin | Delete clinic and all data |
| POST | `/clinics/:id/payment` | Admin | Record manual payment |
| POST | `/clinics/:id/impersonate` | Admin | Login as clinic (support) |

### Metrics (`/metrics`) - 1 endpoint
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/metrics` | No | Prometheus-format metrics |

**Total: 32 API endpoints**

---

## 6. Real-time (Socket.io)

### Events (Server → Client)
- `queue:updated` - Full queue refresh (sent to clinic room)
- `patient:called` - Patient status change (sent to patient room)
- `position:changed` - Position update (sent to clinic patients room)
- `doctor:presence` - Doctor online/offline status

### Events (Client → Server)
- `join:clinic` - Join clinic room (JWT-authenticated)
- `join:patient` - Join patient room (public, by entry ID)

---

## 7. Frontend Pages

### Public Pages (4)
| Page | Route | Lines | Description |
|------|-------|-------|-------------|
| **LandingPage** | `/` | 433 | Marketing page: hero, problem/solution, pricing, FAQ, CTA |
| **LoginPage** | `/login` | 122 | Login form with dev quick-login buttons |
| **SignupPage** | `/signup` | 265 | 6-field registration with Zod validation |
| **CheckInPage** | `/checkin/:clinicId` | 228 | Patient self check-in via QR code |

### Protected Pages (6)
| Page | Route | Lines | Description |
|------|-------|-------|-------------|
| **DashboardPage** | `/dashboard` | 241 | Queue management (desktop + mobile layouts) |
| **OnboardingPage** | `/onboarding` | 470 | 3-step wizard (clinic setup, QR code, tutorial) |
| **SubscriptionPage** | `/subscription` | 288 | Plan management, SMS credits, upgrade flows |
| **PatientStatusPage** | `/patient/:entryId` | 597 | Real-time patient position with animated UI |
| **AdminDashboard** | `/admin` | 505 | Business intelligence command center |
| **ClinicDetailPage** | `/admin/clinic/:id` | 438 | Individual clinic analytics & management |

### Key Components (26 total)

**Queue Management:**
- `QueueList` (432 lines) - Sortable patient list with drag support
- `MobileDashboard` (639 lines) - Full mobile-optimized dashboard
- `AddPatientModal` (196 lines) - Patient registration form
- `QRCodeCard` / `QRCodeModal` - QR display & poster printing
- `QueueStats` - Waiting/seen/average wait metrics

**Patient Experience:**
- `TicketCard` / `CompactTicketCard` - Ticket-style position display
- `PatientJourneyVisual` - Animated step-by-step journey
- `WaitEstimateCard` - Wait time estimation
- `WaitingRoomVisual` - Visual waiting room representation
- `FunFactCard` - Fun facts to pass the time (2 data sets: general + eye-specific)

**Admin:**
- `MetricCardWithTrend` - Metric display with trend arrows
- `ClinicRankingCard` - Top clinics by patient volume
- `ChurnRiskCard` - At-risk clinic monitoring
- `CreateClinicModal` - New clinic creation form
- `RecordPaymentModal` - Manual payment recording

**UI:**
- `Logo` - BleSaf brand logo
- `LanguageSwitcher` - FR/AR toggle
- `Toast` - Notification toasts
- `ConfirmModal` - Action confirmation dialogs
- `Confetti` - Celebration animation

---

## 8. Custom Hooks

| Hook | Lines | Purpose |
|------|-------|---------|
| `useDashboard` | 434 | Dashboard state: queue polling, sound notifications, doctor presence, stats |
| `useSocket` | 192 | Socket.io singleton connection, room management, event handlers |
| `useUILabels` | 42 | Dynamic labels based on business type (medical vs. retail) |

---

## 9. State Management (Zustand)

| Store | Lines | State |
|-------|-------|-------|
| `authStore` | 143 | Authentication: token, clinic, login/logout, checkAuth, role detection |
| `queueStore` | 160 | Queue: entries, stats, add/remove/update, optimistic updates |

---

## 10. Backend Services

| Service | Lines | Functions |
|---------|-------|-----------|
| `adminService` | 928 | getMetricsWithTrends, getClinicHealth, getClinicDetail, createClinic, deleteClinic, recordPayment, impersonateClinic |
| `subscriptionService` | 440 | getSubscriptionStatus, initiateCheckout, handleWebhook, getSmsPackages, purchaseSmsCredits, getOnboardingStatus, updateOnboarding |
| `queueService` | 397 | addPatient, callNextPatient, updateStatus, removePatient, getTodayQueue, checkInPatient |
| `signupService` | 339 | registerClinic, verifyEmail, resendVerification, requestPasswordReset, resetPassword |
| `positionService` | 203 | recalculatePositions (handles pinned/manual ordering) |
| `statsService` | 161 | getTodayStats, getHistory |
| `notificationService` | 67 | notifyPatient, sendAlmostTurnSMS, sendYourTurnSMS (stub - needs Twilio) |
| `index` (barrel) | 9 | Re-exports all services |

---

## 11. Backend Utilities

| Library | Lines | Purpose |
|---------|-------|---------|
| `email` | 442 | Resend API integration with FR/AR email templates (verification, welcome, password reset) |
| `cache` | 138 | In-memory TTL cache with auto-cleanup |
| `metrics` | 109 | Prometheus metrics (HTTP requests, active sockets, queue operations) |
| `konnect` | 102 | Konnect payment gateway (initPayment, getPaymentDetails) |
| `auth` | 74 | JWT sign/verify, authMiddleware, admin whitelist check |
| `prisma` | 47 | Prisma client singleton with connection logging |
| `scheduler` | 47 | node-cron: midnight queue reset (Africa/Tunis timezone) |
| `socket` | 25 | Socket.io instance getter/setter |

---

## 12. Internationalization

- **Languages:** French (fr) + Arabic (ar)
- **Translation keys:** ~200 per language (407 + 399 lines)
- **RTL support:** Automatic direction switching for Arabic
- **Sections covered:** auth, dashboard, queue, patient, checkin, admin, landing, signup, onboarding, subscription, common

---

## 13. Deployment Infrastructure

### Production URLs
| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `https://web-zeta-five-39.vercel.app` |
| Backend | Railway | `https://doctorqapi-production-ac8b.up.railway.app` |
| Health check | Railway | `https://doctorqapi-production-ac8b.up.railway.app/health` |

### Configuration
- **Dockerfile:** Node.js 20-slim, pnpm 9.15, Prisma generate + db push on startup
- **Railway:** Dockerfile builder, health check at `/health`, auto-restart on failure
- **Vercel:** Vite build, SPA rewrites (`/*` → `/`)
- **Database:** PostgreSQL on Supabase (pooler + direct connection)

### Environment Variables Required
| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | JWT signing key |
| `CORS_ORIGIN` | Backend | Allowed frontend origins (comma-separated) |
| `PORT` | Backend | Server port (default: 3001) |
| `RESEND_API_KEY` | Backend | Transactional email sending |
| `FROM_EMAIL` | Backend | Email sender address |
| `KONNECT_API_KEY` | Backend | Payment gateway |
| `KONNECT_WALLET_ID` | Backend | Payment receiving wallet |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_SOCKET_URL` | Frontend | Socket.io server URL |

---

## 14. Testing Infrastructure

| Tool | Scope | Status |
|------|-------|--------|
| **Vitest** | Unit tests (frontend + backend) | Configured, some tests written |
| **Testing Library** | React component tests | Configured |
| **Playwright** | E2E tests (desktop + mobile) | Configured, accessibility tests defined |
| **Lighthouse** | Performance audits | Script configured |

### Existing Test Files
- `apps/web/src/lib/phone.test.ts` (106 lines) - Phone number formatting/validation
- `apps/web/src/lib/queue.test.ts` (241 lines) - Queue position calculations
- `apps/web/src/lib/time.test.ts` (97 lines) - Time formatting utilities

---

## 15. What Has Been Developed (Complete)

### Core Queue System
- [x] Full queue CRUD (add, call next, update status, remove)
- [x] Real-time updates via Socket.io
- [x] Position auto-recalculation with manual reordering support
- [x] QR code generation for patient self-check-in
- [x] Patient self-check-in page (public, no auth required)
- [x] Patient real-time status page with animated ticket UI
- [x] Doctor presence toggle (open/closed)
- [x] Sound notifications for new patients
- [x] Duplicate patient detection (same phone, same day)
- [x] Appointment time support (scheduled vs. walk-in)
- [x] Daily queue auto-reset at midnight (Africa/Tunis timezone)

### Doctor/Receptionist Dashboard
- [x] Desktop layout with sidebar QR code
- [x] Mobile-optimized dashboard with swipeable cards
- [x] Real-time queue statistics (waiting, seen, avg wait, max wait, no-shows)
- [x] Patient status management (waiting → notified → in consultation → completed)
- [x] Add patient modal with phone validation (Tunisia +216)
- [x] Queue list with status badges and time indicators
- [x] Confirmation dialogs for destructive actions

### Patient Experience
- [x] Real-time position tracking
- [x] Estimated wait time calculation
- [x] Animated journey progress visualization
- [x] Ticket-style position card
- [x] Fun facts while waiting (general + eye-specific sets)
- [x] Doctor presence indicator
- [x] Confetti animation when turn arrives
- [x] QR code check-in flow

### Admin Command Center
- [x] Business intelligence dashboard with trend metrics
- [x] Clinic health monitoring (active, at-risk, churned)
- [x] Clinic ranking by patient volume
- [x] Churn risk detection (based on login recency)
- [x] Individual clinic detail pages with analytics
- [x] Create/delete clinic management
- [x] Manual payment recording
- [x] "Login as Clinic" impersonation for support
- [x] Weekly patient charts and monthly revenue tracking

### Authentication & Authorization
- [x] JWT-based clinic login
- [x] Admin role whitelist (admin@doctorq.tn)
- [x] Protected routes (frontend)
- [x] Auth middleware (backend)
- [x] Rate limiting on public endpoints

### Self-Service SaaS
- [x] Landing page with hero, pricing, FAQ sections
- [x] Self-service signup form (6 fields)
- [x] Email verification system (Resend API)
- [x] Password reset flow (email-based)
- [x] 30-day free trial with auto-provisioning
- [x] Onboarding wizard (3 steps: clinic setup, QR code, tutorial)
- [x] Subscription management page
- [x] Konnect payment gateway integration (init + webhook)
- [x] SMS credit system (balance tracking, package purchase)
- [x] Subscription status tracking (TRIAL → ACTIVE → EXPIRED)

### Internationalization
- [x] French translations (complete)
- [x] Arabic translations (complete)
- [x] RTL layout support
- [x] Language switcher component
- [x] Business type labels (medical: patient/doctor, retail: client/cabinet)

### Infrastructure
- [x] Monorepo with pnpm workspaces
- [x] Docker deployment (Railway)
- [x] SPA deployment (Vercel)
- [x] Prometheus metrics endpoint
- [x] In-memory caching layer
- [x] Health check endpoint
- [x] Production seed endpoint (protected by JWT secret)

---

## 16. What Remains to Be Developed

### High Priority (Pre-Launch Blockers)
- [ ] **SMS integration (Twilio)** - Notification service is stubbed; actual SMS sending not implemented
- [ ] **Email verification page** (`/verify-email`) - Frontend page missing; backend endpoint exists
- [ ] **Password reset page** (`/reset-password`) - Frontend page missing; backend endpoint exists
- [ ] **Auto-redirect to onboarding** - New clinics should be redirected to `/onboarding` after first login if `onboardingCompleted === false`
- [ ] **Subscription enforcement** - Expired trials/subscriptions should restrict access to dashboard
- [ ] **Konnect webhook testing** - Payment webhooks need end-to-end testing with real transactions
- [ ] **Email delivery testing** - Verify Resend emails reach inboxes (not spam)

### Medium Priority (Launch Quality)
- [ ] **Error boundaries** - React error boundaries for graceful crash handling
- [ ] **Offline support** - Service worker is partially configured (Workbox) but not fully functional
- [ ] **Toast notification polish** - Some actions lack user feedback
- [ ] **Settings page** - No dedicated settings page for clinics to manage their profile
- [ ] **Trial expiration warnings** - No proactive emails/UI warnings before trial ends
- [ ] **Payment history page** - Clinics can't view their payment history
- [ ] **Analytics dashboard for clinics** - Basic daily stats exist but no historical charts

### Low Priority (Post-Launch)
- [ ] **WhatsApp Business API integration** - Patient notifications via WhatsApp
- [ ] **Multi-doctor support** - Currently single doctor per clinic
- [ ] **Appointment booking** - Only same-day queue management
- [ ] **Patient accounts** - Phone number is the only identifier
- [ ] **E2E test suite** - Playwright configured but no tests written
- [ ] **Performance optimization** - Bundle splitting, image optimization
- [ ] **PWA offline mode** - Full offline queue management
- [ ] **SMS analytics** - Track delivery rates, costs per clinic
- [ ] **Automated billing** - Recurring Konnect payments
- [ ] **Custom branding** - Allow clinics to customize colors/logo

---

## 17. Key File Reference

### Frontend Entry Points
| File | Purpose |
|------|---------|
| `apps/web/src/main.tsx` | App bootstrap |
| `apps/web/src/App.tsx` | Router & route definitions |
| `apps/web/src/lib/api.ts` | API client (390 lines, all endpoints) |
| `apps/web/src/stores/authStore.ts` | Authentication state |
| `apps/web/src/hooks/useDashboard.ts` | Dashboard logic |
| `apps/web/src/hooks/useSocket.ts` | Socket.io connection |

### Backend Entry Points
| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | Server setup, middleware, routes, Socket.io |
| `apps/api/src/lib/auth.ts` | JWT helpers, admin check |
| `apps/api/src/lib/email.ts` | Email templates & sending |
| `apps/api/src/lib/konnect.ts` | Payment gateway |
| `apps/api/src/services/queueService.ts` | Core queue logic |
| `apps/api/src/services/adminService.ts` | Admin analytics |
| `apps/api/prisma/schema.prisma` | Database schema |

### Configuration
| File | Purpose |
|------|---------|
| `package.json` | Monorepo scripts |
| `pnpm-workspace.yaml` | Workspace definition |
| `Dockerfile` | Railway deployment |
| `railway.json` | Railway settings |
| `vercel.json` | Vercel settings |

---

## 18. Development Commands

```bash
# Install & run
pnpm install                    # Install all dependencies
pnpm dev                        # Start both frontend + backend
pnpm dev:web                    # Frontend only (Vite on :5173)
pnpm dev:api                    # Backend only (Express on :3001)

# Database
pnpm db:push                    # Push schema to database
pnpm db:migrate                 # Run Prisma migrations
pnpm db:studio                  # Open Prisma Studio GUI

# Build & deploy
pnpm build                      # Build both apps
pnpm build:web                  # Build frontend (Vite)
pnpm build:api                  # Build backend (tsc)

# Testing
pnpm test                       # Run all tests
pnpm test:web                   # Frontend tests (Vitest)
pnpm test:api                   # Backend tests (Vitest)
```

---

*This document is auto-generated from codebase analysis. For the latest changes, check git status and recent commits.*
