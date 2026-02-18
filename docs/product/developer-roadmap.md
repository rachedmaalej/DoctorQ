# BleSaf Developer Roadmap: Building a Self-Service SaaS Platform

**Date:** February 9, 2026

---

## The Core Principle: Work in Layers, Not Features

The mistake most developers make is trying to build everything at once. Instead, think of your work in **four layers**, each building on the previous one. You ship each layer as a complete, working unit before moving to the next.

---

## Layer 1: Foundation & Security Hardening (Week 1–2)

**Do this first because nothing else matters if the foundation is broken.**

You already have a working MVP. Before adding any SaaS features, fix the critical issues that would embarrass you if a real doctor signed up tomorrow.

### What to build (in order):

1. **Fix Socket.io authentication** — This is your most critical security gap. Any client can join any clinic room right now. Implement token verification. (~2 hours)

   ```typescript
   socket.on('join:clinic', async ({ clinicId, token }) => {
     try {
       const verified = verifyToken(token);
       if (verified?.clinicId !== clinicId) {
         return socket.disconnect();
       }
       socket.join(`clinic:${clinicId}`);
     } catch {
       socket.disconnect();
     }
   });
   ```

2. **Remove all demo/hardcoded artifacts** — Demo credentials on login page, SAMPLE_PATIENTS array, console.log statements (56 of them). Strip it all. (~1 hour)

3. **Add rate limiting** — Express-rate-limit on your public endpoints (check-in, login). (~1 hour)

4. **Batch position updates** — Replace the N+1 query pattern with a single raw SQL update. The current approach breaks at 30+ patients. (~4 hours)

   ```typescript
   await prisma.$executeRaw`
     UPDATE "QueueEntry"
     SET position = subq.new_pos,
         status = CASE
           WHEN subq.new_pos = 1 THEN 'IN_CONSULTATION'
           WHEN subq.new_pos = 2 THEN 'NOTIFIED'
           ELSE status
         END
     FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY "arrivedAt") as new_pos
       FROM "QueueEntry"
       WHERE "clinicId" = ${clinicId}
       AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
     ) subq
     WHERE "QueueEntry".id = subq.id
   `;
   ```

5. **Extract shared utilities** — Phone formatting, time formatting, constants. Do this now so you don't duplicate more code as you add SaaS features. (~2 hours)

**✅ Deliverable:** The same app, but hardened. No new features visible to users.

---

## Layer 2: Auth & Multi-Tenancy Infrastructure (Week 3–5)

**This is the most important architectural layer. Get this right and everything else flows naturally.**

Right now your app assumes a single clinic context. To become a SaaS, you need proper tenant isolation and self-service auth flows.

### What to build (in order):

### 2.1. Auth Flow Pages

These are non-negotiable for self-service:

- Email verification page (post-signup)
- Password reset request page
- Password reset confirmation page

Build these as standalone, clean pages. They're simple but essential for trust.

### 2.2. Simplified Signup Flow

Reduce to **3 fields maximum**:

- Email
- Password
- Clinic name

Everything else (phone, address, speciality, working hours) gets collected *after* they're inside the app, in a settings page or progressive onboarding. This is the single biggest conversion lever you have.

### 2.3. Tenant-Scoped Middleware

Create a middleware that extracts `clinicId` from the authenticated user's JWT and scopes all database queries. Every route handler should go through this. This replaces any place you're currently passing `clinicId` as a URL parameter or relying on client input.

```
middleware/
├── authenticate.ts    // Verifies JWT, attaches user to req
├── tenantScope.ts     // Extracts clinicId, attaches to req
└── authorize.ts       // Role-based checks (admin vs doctor vs receptionist)
```

### 2.4. Settings Page

A single page where the doctor can manage:

- Clinic profile (name, address, phone, speciality)
- Working hours
- Doctor presence toggle (move this from dashboard to settings)
- Account settings (change password, email)

This is where you collect all the info you removed from the signup form.

### 2.5. Subscription/Trial Tracking Model

Add to your database:

- `trialStartDate`, `trialEndDate`, `subscriptionStatus` on the Clinic model
- A middleware that checks subscription status and returns appropriate responses
- Don't build payments yet — just the data model and the gates

**✅ Deliverable:** A doctor can sign up with email + password + clinic name, verify their email, reset their password, configure their clinic in settings, and use the app within a 14-day trial window.

---

## Layer 3: Onboarding Experience & Patient UX Fixes (Week 6–7)

**Now that people can sign up, make sure they succeed.**

### What to build (in order):

### 3.1. Welcome Screen + Guided Setup

When a doctor signs up and logs in for the first time, don't drop them into an empty dashboard. Show a welcome screen with 3 setup steps:

- "Set your clinic hours" → links to settings
- "Share your check-in link" → shows the patient-facing URL/QR code
- "Add your first patient" → opens add patient modal

Track completion of these steps. Show a progress indicator. This is your activation checklist.

### 3.2. Empty States

Every screen that could be empty (queue list, dashboard stats) needs a helpful empty state with a clear call to action, not a blank void.

### 3.3. Patient Status Page Fixes

High impact, moderate effort:

- Replace position number with **"X people ahead of you"**
- Replace fun facts with **estimated wait time** (position × average consultation time)
- Replace confetti with a **calm, clear "Your turn" screen**
- Add subtle animations when position changes (toast notification: "You moved up!")

### 3.4. Phone Input Fix

- Show format guide (`+216 XX XXX XXX`)
- Show digit counter
- Give specific error messages ("Enter 8 digits after +216")

### 3.5. QR Code Generation

Each clinic gets a unique check-in URL. Generate a downloadable/printable QR code that the doctor can display in their waiting room. This is a huge "wow moment" — it makes the product feel real and tangible.

**✅ Deliverable:** A new doctor signs up, gets guided through setup, prints a QR code for their waiting room, and their first patient has a smooth check-in experience.

---

## Layer 4: Admin Dashboard & Payment Integration (Week 8–10)

**Only build this once you have the self-service flow working end-to-end.**

### What to build (in order):

### 4.1. Admin Dashboard Improvements

You already have an admin panel. Enhance it with:

- List of all clinics with subscription status, trial end date, last active date
- Ability to extend trials, activate/deactivate clinics
- Basic usage metrics (patients served per clinic per day)
- Filter/search clinics

### 4.2. Trial Expiration Flow

- Email notifications at 3 days, 1 day before trial ends
- In-app banner warning when trial is expiring
- Grace period screen after trial expires (can view data but not add patients)
- This is where you push them toward payment

### 4.3. Payment Integration

For Tunisia, research options (Flouci, Konnect, or manual bank transfer with admin approval as an interim). Build:

- Pricing page (within the app, post-trial)
- Payment flow
- Webhook handler to activate subscription on successful payment
- Receipt generation

### 4.4. Subscription Management

In the doctor's settings page:

- Current plan status
- Next billing date
- Cancel/downgrade option

**✅ Deliverable:** Complete self-service lifecycle — signup → trial → payment → active subscription → renewal, all manageable by the doctor without your intervention.

---

## Target Codebase Structure

Refactor progressively, not all at once. Evolve toward this:

```
api/src/
├── middleware/
│   ├── authenticate.ts
│   ├── tenantScope.ts
│   ├── authorize.ts
│   ├── rateLimiter.ts
│   └── subscriptionGate.ts
├── services/
│   ├── queue/
│   │   ├── positionService.ts
│   │   ├── notificationService.ts
│   │   └── queueService.ts
│   ├── authService.ts
│   ├── clinicService.ts
│   ├── subscriptionService.ts
│   └── socketService.ts
├── routes/
│   ├── queue.ts          (thin handlers, ~200 lines)
│   ├── auth.ts
│   ├── clinic.ts
│   ├── subscription.ts
│   └── admin.ts
├── lib/
│   ├── validation.ts
│   ├── phone.ts
│   ├── time.ts
│   └── constants.ts
└── index.ts

web/src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── onboarding/
│   │   └── WelcomePage.tsx
│   ├── settings/
│   │   └── SettingsPage.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   └── MobileDashboard.tsx
│   ├── patient/
│   │   ├── CheckInPage.tsx
│   │   └── PatientStatusPage.tsx
│   └── admin/
│       └── AdminDashboard.tsx
├── hooks/
│   ├── useQueue.ts
│   ├── useSocket.ts
│   └── useOnboarding.ts
├── components/
│   └── (shared components)
└── lib/
    ├── phone.ts
    ├── time.ts
    └── api.ts
```

---

## Summary: The Order That Matters

| Order | Layer | Focus | Timeline | Why This Order |
|-------|-------|-------|----------|----------------|
| **1** | Foundation | Security + performance fixes | Week 1–2 | Can't build on a broken base |
| **2** | Auth & Multi-Tenancy | Signup, verification, settings, tenant isolation | Week 3–5 | The infrastructure that makes SaaS possible |
| **3** | Onboarding & UX | Welcome flow, guided setup, patient UX fixes | Week 6–7 | Makes users succeed after signing up |
| **4** | Admin & Payments | Trial management, payments, admin tools | Week 8–10 | Monetization comes after activation |

---

## Key Takeaway

**Don't jump to Layer 4 because it feels like the "SaaS part."** Layers 2 and 3 are what determine whether doctors actually stay and pay. A doctor who signs up, gets confused, and leaves will never see your payment page.

Work sequentially. Ship each layer. Get at least one real clinic using it before moving to the next layer. That feedback loop is worth more than any amount of planning.
