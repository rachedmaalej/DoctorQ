# BleSaf — Progressive Dashboard: Full Implementation Roadmap for Claude Code

> **Created:** ~Feb 18, 2026
> **Status:** Superseded by [PROGRESSIVE-SONAR-PLAN.md](PROGRESSIVE-SONAR-PLAN.md) (Feb 26, 2026). This plan was written against an older version of the codebase — several prerequisites (Socket.io auth, N+1 fix, JWT fallback) have since been resolved. Kept for historical reference.

**Document Purpose:** This file is a complete technical specification and implementation guide for Claude Code. It covers four sequential weeks of work to transform the current `DashboardPage.tsx` into a progressive, confidence-aware command center. Each section includes the exact files to modify, the data structures to introduce, and the component logic to implement. Follow the weeks in order — each layer depends on the previous one being stable and deployed.

**Stack Reminder:** React + TypeScript, Node.js/Express, Prisma ORM, Socket.io, Zustand, Tailwind CSS, PostgreSQL.

---

## Prerequisites: Do These First (Before Week 1)

These two fixes are blockers. The progressive dashboard depends on a secure real-time layer and performant queue operations. Do not skip.

### P1 — Fix Socket.io Authentication Bypass

**File:** `api/src/index.ts` (lines 70–85)

**Current broken code:**
```typescript
socket.on('join:clinic', ({ clinicId, token }) => {
  // TODO: Verify token  ← NOT IMPLEMENTED
  socket.join(`clinic:${clinicId}`);  // Anyone can join any room
});
```

**Required fix:**
```typescript
socket.on('join:clinic', async ({ clinicId, token }) => {
  try {
    const verified = verifyToken(token);
    if (!verified || verified.clinicId !== clinicId) {
      return socket.disconnect();
    }
    socket.join(`clinic:${clinicId}`);
  } catch {
    socket.disconnect();
  }
});
```

**Also required:** Import and use your existing `verifyToken` function from `api/src/lib/auth.ts`. Ensure the function is exported if it isn't already.

---

### P2 — Fix N+1 Query in Queue Operations

**File:** `api/src/routes/queue.ts`

**Current problem:** Every queue mutation (add, remove, call next) executes N individual `update` calls to recalculate positions — one per patient. With 30 patients, that's ~35 queries per button click.

**Required fix:** Replace all position recalculation loops with a single raw SQL batch update. Create a shared utility function and call it from every mutation endpoint:

```typescript
// api/src/services/queue/recalculate.ts  ← CREATE THIS FILE

import { prisma } from '../lib/prisma';

export async function recalculatePositions(clinicId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "QueueEntry"
    SET position = subq.new_pos,
        status = CASE
          WHEN subq.new_pos = 1 THEN 'IN_CONSULTATION'
          WHEN subq.new_pos = 2 THEN 'NOTIFIED'
          ELSE 'WAITING'
        END
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "arrivedAt") as new_pos
      FROM "QueueEntry"
      WHERE "clinicId" = ${clinicId}
      AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
    ) subq
    WHERE "QueueEntry".id = subq.id
  `;
}
```

Replace every instance of manual position recalculation loops in `queue.ts` with a single call to `recalculatePositions(clinicId)`.

---

### P3 — Remove Demo Credentials from Login Page

**File:** `web/src/pages/LoginPage.tsx` (lines 69, 111)

Remove the "Quick Login (Demo)" button and any hardcoded credential constants entirely. This is a 5-minute task. Do it now.

---

### P4 — Remove JWT Fallback Secret

**File:** `api/src/lib/auth.ts` (line 5)

Remove any hardcoded fallback JWT secret string. The application must throw a clear startup error if `JWT_SECRET` is not set in the environment:

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}
```

---

## Week 1: Restructure — 3-Zone Layout + Bottom Sheet Drawer

**Goal:** Reorganize the existing DashboardPage into a clean 3-zone information hierarchy and move secondary tools into a slide-up drawer. No new features are added this week. Trial clinics should notice a cleaner interface — nothing should break.

### 1.1 — Extract `useDashboard` Custom Hook

**Current problem:** `DashboardPage.tsx` has 428 lines and 13+ state variables, mixing UI rendering, business logic, socket management, and animation state. This makes it impossible to test or extend cleanly.

**Action:** Create a new file `web/src/hooks/useDashboard.ts` and migrate all state and logic into it. The component file should be left as a pure rendering layer.

**File to create:** `web/src/hooks/useDashboard.ts`

```typescript
// This hook owns ALL dashboard state and side effects.
// DashboardPage.tsx will import this and render only.

import { useEffect, useState, useCallback } from 'react';
import { useQueueStore } from '../stores/queueStore';
import { useSocket } from './useSocket';
import { useClinicMaturity } from './useClinicMaturity'; // Created in Week 2

export function useDashboard(clinicId: string) {
  const { queue, addPatient, removePatient, callNext } = useQueueStore();
  const { socket, isConnected } = useSocket(clinicId);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null); // For undo system (Week 3)
  const [isDoctorPresent, setIsDoctorPresent] = useState(false);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    socket.on('queue:updated', (updatedQueue) => {
      useQueueStore.getState().setQueue(updatedQueue);
    });
    return () => {
      socket.off('queue:updated');
    };
  }, [socket]);

  const handleCallNext = useCallback(async () => {
    // Undo logic added in Week 3 — placeholder for now
    await callNext(clinicId);
  }, [clinicId, callNext]);

  return {
    queue,
    isDoctorPresent,
    setIsDoctorPresent,
    isDrawerOpen,
    setIsDrawerOpen,
    isConnected,
    handleCallNext,
    pendingAction,
    setPendingAction,
  };
}
```

**File to modify:** `web/src/pages/DashboardPage.tsx`

After extraction, this file should shrink to under 120 lines. It imports `useDashboard` and renders three zones. All logic lives in the hook.

---

### 1.2 — Build the 3-Zone Layout

**File to modify:** `web/src/pages/DashboardPage.tsx`

The layout must be divided into three explicit, visually separated zones. Use this structure:

```
┌──────────────────────────────────────┐
│  ZONE A — Current State Header       │  Fixed height, ~180px
│  Clinic name • Doctor toggle         │
│  "4 patients in queue"               │
│  [Call Next Patient] ← primary CTA   │
├──────────────────────────────────────┤
│  ZONE B — Live Queue                 │  Fills remaining screen height
│  Scrollable patient list             │  Scrollable
│  Each row: Name • Position • Wait    │
│  time estimate • Remove button       │
├──────────────────────────────────────┤
│  ↑ Swipe up for more tools ↑        │  Fixed 48px handle bar
└──────────────────────────────────────┘
```

**Zone A — Implementation notes:**
- Background: your primary brand color (green for BleSaf / red for AuSuivant)
- Queue count displayed large (text-4xl font-bold)
- "Call Next Patient" button must be the single most prominent interactive element on the page — full width on mobile, large and centered on desktop
- Doctor presence toggle remains here but is visually secondary (small toggle in top-right corner)

**Zone B — Implementation notes:**
- Remove `SAMPLE_PATIENTS` hardcoded demo array entirely — it does not belong in a component
- Each patient row displays: queue position number, name, estimated wait time
- Wait time estimate formula: `position × averageConsultationMinutes` — use a clinic-level setting defaulting to 10 minutes per patient
- "Remove from queue" action remains per-row but is an icon button (trash icon), not a text label
- Add `aria-label="Remove [patient name] from queue"` to every icon button

**Zone C — Bottom Sheet Drawer:**

Create a new reusable component: `web/src/components/BottomDrawer.tsx`

```typescript
// web/src/components/BottomDrawer.tsx

interface BottomDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function BottomDrawer({ isOpen, onToggle, children }: BottomDrawerProps) {
  return (
    <>
      {/* Handle bar — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center py-3 bg-white border-t border-gray-200"
        aria-label={isOpen ? 'Close tools drawer' : 'Open tools drawer'}
      >
        <div className="w-8 h-1 rounded-full bg-gray-300 mb-1" />
        <span className="text-xs text-gray-500 ml-2">
          {isOpen ? 'Fermer' : 'Plus d\'outils'}
        </span>
      </button>

      {/* Drawer content */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="p-6">
          {children}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
}
```

**What goes inside the drawer (Week 1 contents):**
- "Add Patient Manually" form (moved from wherever it currently lives)
- Doctor settings shortcut
- "Export today's queue" button (can be a placeholder for now)
- Stats section (placeholder card with grayed content — will be activated in Week 2)

---

### 1.3 — Stop Redundant API Refetch After Mutations

**File:** `web/src/stores/queueStore.ts`

**Current problem:**
```typescript
await api.addPatient(data);
const response = await api.getQueue(); // WASTEFUL — Socket.io already pushes updates
```

**Fix:** After every mutation (add, remove, callNext), do NOT manually refetch the queue. The Socket.io `queue:updated` event from the server handles the state update. Remove all `getQueue()` calls that follow mutations.

Confirm the backend emits `queue:updated` with the full updated queue after every mutation. If it doesn't, add the emission to each relevant route handler in `api/src/routes/queue.ts`.

---

### 1.4 — Remove console.log Statements

**Files:** All files under `api/src/` and `web/src/`

The critique identified 56 console.log statements in the production bundle. Run this and remove all non-error logging:

```bash
grep -rn "console.log" web/src/ api/src/
```

Replace any logging that is genuinely needed for debugging with a proper logger (e.g., `pino` on the backend) that can be silenced in production via `NODE_ENV` check.

---

### Week 1 Completion Checklist
- [ ] `useDashboard` hook extracted, `DashboardPage.tsx` under 120 lines
- [ ] 3-zone layout renders correctly on mobile and desktop
- [ ] `BottomDrawer` component works with open/close animation
- [ ] `SAMPLE_PATIENTS` array removed entirely
- [ ] No redundant `getQueue()` calls after mutations
- [ ] 56 console.log statements removed
- [ ] All existing functionality (add patient, remove, call next, doctor toggle) still works

---

## Week 2: Maturity Model + Feature Flags

**Goal:** Introduce a clinic maturity state that drives progressive feature revelation. New clinics see a focused, simple interface. Experienced clinics see the full feature set. Premium teasers appear at the right behavioral moment.

### 2.1 — Database Schema Update

**File:** `api/prisma/schema.prisma`

Add the following fields to the `Clinic` model:

```prisma
model Clinic {
  // ... all existing fields ...

  // Progressive dashboard fields
  onboardingStage      OnboardingStage @default(NEWCOMER)
  totalPatientsServed  Int             @default(0)
  firstQRCheckinAt     DateTime?       // Set when first real QR check-in occurs
  lastActiveDate       DateTime?       // Updated daily on any queue activity
}

enum OnboardingStage {
  NEWCOMER     // Day 0–3 or fewer than 10 total patients served
  ACTIVATED    // Has had at least 1 real QR code check-in
  ENGAGED      // 50+ patients served OR 7+ days active
  POWER_USER   // 200+ patients served OR 30+ days active
}
```

Run migration:
```bash
npx prisma migrate dev --name add_onboarding_stage
```

---

### 2.2 — Backend: Stage Progression Logic

**File to create:** `api/src/services/maturity.ts`

```typescript
import { prisma } from '../lib/prisma';
import { OnboardingStage } from '@prisma/client';

export async function evaluateAndUpdateStage(clinicId: string): Promise<void> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      onboardingStage: true,
      totalPatientsServed: true,
      firstQRCheckinAt: true,
      createdAt: true,
    }
  });

  if (!clinic) return;

  const daysSinceCreation = Math.floor(
    (Date.now() - clinic.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStage: OnboardingStage = clinic.onboardingStage;

  // Stage progression rules — stages only move forward, never backward
  if (clinic.onboardingStage === 'NEWCOMER' && clinic.firstQRCheckinAt) {
    newStage = 'ACTIVATED';
  }

  if (
    clinic.onboardingStage === 'ACTIVATED' &&
    (clinic.totalPatientsServed >= 50 || daysSinceCreation >= 7)
  ) {
    newStage = 'ENGAGED';
  }

  if (
    clinic.onboardingStage === 'ENGAGED' &&
    (clinic.totalPatientsServed >= 200 || daysSinceCreation >= 30)
  ) {
    newStage = 'POWER_USER';
  }

  if (newStage !== clinic.onboardingStage) {
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { onboardingStage: newStage }
    });
  }
}
```

**Call this function** inside the queue check-in route (after a patient is added) and inside the "call next" route (after a patient is marked complete and `totalPatientsServed` is incremented).

Also, when a patient checks in via QR code for the **first time**, set `firstQRCheckinAt`:

```typescript
// In the QR check-in handler, after creating the QueueEntry:
const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
if (!clinic.firstQRCheckinAt) {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { firstQRCheckinAt: new Date() }
  });
}
await evaluateAndUpdateStage(clinicId);
```

---

### 2.3 — Backend: Expose Stage in Auth Response

**File:** `api/src/routes/auth.ts` (or wherever login/session data is returned)

Include `onboardingStage` in the clinic object returned on login and on the `/api/clinic/me` endpoint. The frontend needs this to initialize the maturity hook without an extra API call.

---

### 2.4 — Frontend: `useClinicMaturity` Hook

**File to create:** `web/src/hooks/useClinicMaturity.ts`

This hook is the single source of truth for what features are visible. Every progressive reveal is driven by the `features` object it returns.

```typescript
import { useClinicStore } from '../stores/clinicStore';

type ClinicStage = 'NEWCOMER' | 'ACTIVATED' | 'ENGAGED' | 'POWER_USER';

interface ClinicFeatures {
  showQRPromptBanner: boolean;       // Prominent QR setup prompt
  showStatsDrawer: boolean;          // Stats section in drawer
  showExportButton: boolean;         // Export queue data
  showAdvancedSettings: boolean;     // Per-consultation-time settings etc.
  showUpgradeTeasers: boolean;       // Grayed premium features with upgrade CTA
  showDailySummaryPreview: boolean;  // Preview card of daily stats
}

function computeFeatures(stage: ClinicStage): ClinicFeatures {
  return {
    showQRPromptBanner:      stage === 'NEWCOMER',
    showStatsDrawer:         stage === 'ENGAGED' || stage === 'POWER_USER',
    showExportButton:        stage === 'POWER_USER',
    showAdvancedSettings:    stage === 'ENGAGED' || stage === 'POWER_USER',
    showUpgradeTeasers:      stage === 'ACTIVATED' || stage === 'ENGAGED',
    showDailySummaryPreview: stage === 'ENGAGED' || stage === 'POWER_USER',
  };
}

export function useClinicMaturity() {
  const { clinic } = useClinicStore();
  const stage: ClinicStage = clinic?.onboardingStage ?? 'NEWCOMER';
  const features = computeFeatures(stage);
  
  return { stage, features };
}
```

---

### 2.5 — Frontend: Apply Feature Flags in Dashboard

**File:** `web/src/pages/DashboardPage.tsx`

Import and use `useClinicMaturity` inside the `useDashboard` hook (already stubbed in Week 1). Apply feature flags across the dashboard:

```tsx
// In DashboardPage.tsx render:
const { features } = useClinicMaturity();

// Zone A — show QR prompt banner only for newcomers
{features.showQRPromptBanner && <QRPromptBanner clinicId={clinicId} />}

// Inside BottomDrawer:
{features.showStatsDrawer 
  ? <StatsDrawerContent />
  : features.showUpgradeTeasers 
    ? <LockedFeatureTeaser feature="statistics" />
    : null
}

{features.showExportButton && <ExportButton clinicId={clinicId} />}
```

---

### 2.6 — Build Required Sub-Components

**File to create:** `web/src/components/QRPromptBanner.tsx`

Shown only to NEWCOMER stage clinics. Disappears permanently after first QR check-in.

```tsx
export function QRPromptBanner({ clinicId }: { clinicId: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
      <span className="text-2xl">📱</span>
      <div>
        <p className="font-semibold text-amber-900 text-sm">
          Activez votre file d'attente digitale
        </p>
        <p className="text-amber-700 text-xs mt-1">
          Affichez votre QR code à l'accueil pour que les patients s'inscrivent automatiquement.
        </p>
        <button className="mt-2 text-xs font-semibold text-amber-900 underline">
          Voir mon QR code →
        </button>
      </div>
    </div>
  );
}
```

**File to create:** `web/src/components/LockedFeatureTeaser.tsx`

Shown for features not yet unlocked, with contextual upgrade messaging:

```tsx
interface LockedFeatureTeaserProps {
  feature: 'statistics' | 'export' | 'multi-doctor';
  plan?: 'Pro';
}

const TEASER_COPY = {
  statistics: {
    label: 'Vos statistiques détaillées',
    description: 'Temps d\'attente moyen, pic d\'affluence, tendances hebdomadaires.',
  },
  export: {
    label: 'Export des données',
    description: 'Exportez l\'historique de votre file en CSV.',
  },
  'multi-doctor': {
    label: 'Support multi-médecin',
    description: 'Gérez plusieurs médecins avec des files séparées.',
  },
};

export function LockedFeatureTeaser({ feature, plan = 'Pro' }: LockedFeatureTeaserProps) {
  const copy = TEASER_COPY[feature];
  return (
    <div className="relative rounded-xl border border-gray-200 p-4 opacity-60 cursor-not-allowed select-none">
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl z-10">
        <div className="text-center">
          <span className="text-lg">🔒</span>
          <p className="text-xs font-semibold text-gray-700 mt-1">Plan {plan}</p>
          <button className="mt-1 text-xs text-blue-600 underline pointer-events-auto cursor-pointer">
            Voir les offres
          </button>
        </div>
      </div>
      <p className="font-semibold text-sm text-gray-800">{copy.label}</p>
      <p className="text-xs text-gray-500 mt-1">{copy.description}</p>
    </div>
  );
}
```

---

### Week 2 Completion Checklist
- [ ] Prisma migration applied, `onboardingStage` field exists on Clinic model
- [ ] `evaluateAndUpdateStage` called after every patient check-in and completion
- [ ] `firstQRCheckinAt` set correctly on first QR check-in
- [ ] `onboardingStage` returned by `/api/clinic/me`
- [ ] `useClinicMaturity` hook returns correct features per stage
- [ ] QR prompt banner visible for NEWCOMER, invisible for ACTIVATED+
- [ ] Stats section visible for ENGAGED+, locked teaser for ACTIVATED
- [ ] Stage transitions work end-to-end (test manually by manipulating DB values)

---

## Week 3: Undo System + Calm Design Language

**Goal:** Remove all emotionally inappropriate design (confetti, fun facts, patronizing content). Introduce a 10-second undo mechanism for irreversible queue actions. Redesign the patient-facing status page to prioritize wait time information.

### 3.1 — Undo System for Queue Actions

**Concept:** When the doctor triggers a state-changing action (Call Next, Remove Patient), the UI updates **optimistically** and immediately, but the actual database write is **deferred by 10 seconds**. A dismissible toast gives the doctor a recovery window. If the toast is dismissed without cancellation, the write commits normally.

**File to modify:** `web/src/hooks/useDashboard.ts`

Add undo infrastructure:

```typescript
// Types
interface PendingAction {
  type: 'CALL_NEXT' | 'REMOVE_PATIENT';
  patientId: string;
  patientName: string;
  previousQueue: QueueEntry[]; // Snapshot for rollback
  timer: ReturnType<typeof setTimeout>;
}

// Inside useDashboard hook:
const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

const handleCallNext = useCallback(async () => {
  const currentQueueSnapshot = [...useQueueStore.getState().queue];
  const nextPatient = currentQueueSnapshot[0];
  if (!nextPatient) return;

  // 1. Optimistic UI update — happens immediately
  useQueueStore.getState().optimisticCallNext();

  // 2. Schedule the actual API call with a 10-second delay
  const timer = setTimeout(async () => {
    try {
      await api.callNext(clinicId);
    } catch (error) {
      // If the real call fails, rollback
      useQueueStore.getState().setQueue(currentQueueSnapshot);
    }
    setPendingAction(null);
  }, 10000);

  // 3. Register the pending action for the undo toast
  setPendingAction({
    type: 'CALL_NEXT',
    patientId: nextPatient.id,
    patientName: nextPatient.name,
    previousQueue: currentQueueSnapshot,
    timer,
  });
}, [clinicId]);

const handleUndo = useCallback(() => {
  if (!pendingAction) return;
  clearTimeout(pendingAction.timer);
  useQueueStore.getState().setQueue(pendingAction.previousQueue); // Rollback
  setPendingAction(null);
}, [pendingAction]);
```

**File to create:** `web/src/components/UndoToast.tsx`

```tsx
interface UndoToastProps {
  action: PendingAction;
  onUndo: () => void;
  secondsRemaining: number;
}

export function UndoToast({ action, onUndo, secondsRemaining }: UndoToastProps) {
  const message = action.type === 'CALL_NEXT'
    ? `${action.patientName} appelé(e)`
    : `${action.patientName} retiré(e) de la file`;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gray-900 text-white rounded-xl p-4 flex items-center justify-between shadow-xl z-50 animate-slide-up">
      <div>
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Confirmation dans {secondsRemaining}s...
        </p>
      </div>
      <button
        onClick={onUndo}
        className="ml-4 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold flex-shrink-0 hover:bg-gray-100 transition-colors"
      >
        Annuler
      </button>
    </div>
  );
}
```

Render `UndoToast` in `DashboardPage.tsx` whenever `pendingAction !== null`. Use a `useEffect` to drive a countdown timer for the `secondsRemaining` display.

Also add `optimisticCallNext` to `queueStore.ts` — it shifts the queue state locally without an API call, so the UI feels instant.

---

### 3.2 — Remove Confetti from All Contexts

**Search and remove:**
```bash
grep -rn "confetti\|Confetti\|react-confetti" web/src/
```

Remove all confetti imports, components, and trigger logic. This affects:
- `web/src/pages/PatientStatusPage.tsx` — the "Your Turn" celebration
- Any other location where it appears

---

### 3.3 — Redesign Patient Status Page

**File:** `web/src/pages/PatientStatusPage.tsx`

**Current problems:** 488 lines of complex state configuration, fun facts displayed instead of wait times, confetti explosion when called, no position change notifications.

**Required redesign — information hierarchy:**

```
┌──────────────────────────────────┐
│  Clinic name (top, small)        │
├──────────────────────────────────┤
│                                  │
│   2 personnes devant vous       │  ← HERO: people ahead (not position number)
│   ≈ 18 minutes d'attente        │  ← HERO: wait estimate, large
│                                  │
│   [Simple progress bar]          │  ← Visual progress, no chairs metaphor
│                                  │
├──────────────────────────────────┤
│  Vous êtes en file depuis 9h12   │  ← Secondary info
│  Mise à jour: il y a 30 sec      │  ← Freshness indicator
├──────────────────────────────────┤
│  [Quitter la file]               │  ← Low visual weight
└──────────────────────────────────┘
```

**Key changes to implement:**

**A) Show people ahead, not position number:**
```typescript
// Position 1 = in consultation (0 people ahead)
// Position 2 = 1 person ahead
// Position 3 = 2 people ahead
const peopleAhead = Math.max(0, patient.position - 1);
const heroText = peopleAhead === 0
  ? "C'est bientôt votre tour"
  : `${peopleAhead} personne${peopleAhead > 1 ? 's' : ''} devant vous`;
```

**B) Replace fun facts with live wait estimate:**
```typescript
// Remove: random health fact display
// Add: dynamic wait estimate that updates when Socket.io pushes updates
const waitMinutes = peopleAhead * (clinic.avgConsultationMinutes ?? 10);
const waitText = waitMinutes === 0
  ? 'Préparez-vous !'
  : `≈ ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} d'attente`;
```

**C) Replace "Your Turn" confetti with calm green screen:**
```tsx
// When patient.status === 'IN_CONSULTATION':
return (
  <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center text-white p-6">
    <div className="text-6xl mb-6">✓</div>
    <h1 className="text-3xl font-bold text-center mb-3">
      C'est votre tour
    </h1>
    <p className="text-lg text-center text-green-100">
      Veuillez vous diriger vers le cabinet.
    </p>
  </div>
);
```

**D) Add position change notification:**
```typescript
// In PatientStatusPage.tsx, track previous position in a ref
const prevPositionRef = useRef(patient.position);

useEffect(() => {
  if (patient.position < prevPositionRef.current && patient.position > 1) {
    // Show a subtle toast: "Vous avancez ! Plus que X personnes devant vous."
    showPositionToast(peopleAhead);
  }
  prevPositionRef.current = patient.position;
}, [patient.position]);
```

**E) Protect the "Leave Queue" button:**
```tsx
// Require confirmation — no modal, just a two-tap pattern:
const [confirmLeave, setConfirmLeave] = useState(false);

{!confirmLeave ? (
  <button
    onClick={() => setConfirmLeave(true)}
    className="text-sm text-gray-400 underline mt-8"
  >
    Quitter la file
  </button>
) : (
  <div className="mt-8 text-center">
    <p className="text-sm text-gray-600 mb-3">
      Vous perdrez votre place. Confirmer ?
    </p>
    <div className="flex gap-3 justify-center">
      <button onClick={handleLeaveQueue} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
        Quitter
      </button>
      <button onClick={() => setConfirmLeave(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
        Rester
      </button>
    </div>
  </div>
)}
```

---

### 3.4 — Fix Phone Input UX

**Files:** `web/src/components/AddPatientModal.tsx` and `web/src/pages/CheckInPage.tsx`

**Create a shared utility first:** `web/src/lib/phone.ts`

```typescript
// Single source of truth for phone formatting — used everywhere
export const PHONE_PREFIX = '+216';
export const PHONE_DIGITS_REQUIRED = 8;

export function formatPhoneDisplay(digits: string): string {
  // Format: +216 XX XXX XXX
  const cleaned = digits.replace(/\D/g, '').slice(0, PHONE_DIGITS_REQUIRED);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0,2)} ${cleaned.slice(2)}`;
  return `${cleaned.slice(0,2)} ${cleaned.slice(2,5)} ${cleaned.slice(5)}`;
}

export function validatePhone(digits: string): string | null {
  if (digits.length !== PHONE_DIGITS_REQUIRED) {
    return `Entrez 8 chiffres après +216 (ex: +216 55 123 456)`;
  }
  return null;
}
```

**In both modal and check-in page, replace phone input with:**
```tsx
<div>
  <label className="text-sm font-medium text-gray-700">
    Numéro de téléphone
  </label>
  <div className="flex items-center border rounded-lg mt-1 focus-within:ring-2 focus-within:ring-blue-500">
    <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-l-lg border-r border-gray-300 select-none">
      +216
    </span>
    <input
      type="tel"
      inputMode="numeric"
      placeholder="XX XXX XXX"
      maxLength={10} // 8 digits + 2 spaces from formatting
      aria-label="Numéro de téléphone (8 chiffres après +216)"
      className="flex-1 px-3 py-2 text-sm rounded-r-lg outline-none"
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, '');
        setPhoneDigits(digits);
        setPhoneDisplay(formatPhoneDisplay(digits));
      }}
      value={phoneDisplay}
    />
  </div>
  {phoneError && (
    <p className="text-red-600 text-xs mt-1" role="alert">
      {phoneError}
    </p>
  )}
  <p className="text-gray-400 text-xs mt-1">
    Exemple : +216 55 123 456
  </p>
</div>
```

---

### 3.5 — Accessibility Pass

Add `aria-label` attributes to every icon-only button across the entire frontend. Run this audit:

```bash
# Find all icon buttons without aria-label
grep -rn "IconButton\|<button" web/src/ | grep -v "aria-label"
```

Minimum required aria-labels:
- All queue action buttons (Call Next, Remove Patient, Add Patient)
- Doctor presence toggle
- Drawer open/close button
- Leave queue button
- Any navigation icon

Also add `role="alert"` to all error messages so screen readers announce them automatically.

---

### Week 3 Completion Checklist
- [ ] Undo toast appears after "Call Next" and "Remove Patient" with 10-second countdown
- [ ] "Annuler" in the toast correctly rolls back the queue state
- [ ] All confetti removed from codebase
- [ ] Patient status page shows "X personnes devant vous" not position numbers
- [ ] Patient status page shows wait time estimate (not fun facts)
- [ ] "Your Turn" screen is calm green — no animation
- [ ] "Leave Queue" requires two taps
- [ ] Position change shows a subtle notification toast
- [ ] Phone input uses shared `phone.ts` utility in both modal and check-in page
- [ ] All icon buttons have aria-labels

---

## Week 4: End-of-Day Summary (WhatsApp + In-App)

**Goal:** Deliver an automatic end-of-day summary to each active doctor via WhatsApp (and as an in-app card), containing personalized stats that make the value of BleSaf quantifiable and shareable. This is the highest word-of-mouth feature in the entire roadmap.

### 4.1 — Data Foundation: Track Daily Stats

**File:** `api/prisma/schema.prisma`

Add a `DailyStats` model to persist per-clinic daily summaries:

```prisma
model DailyStats {
  id                    String   @id @default(cuid())
  clinicId              String
  clinic                Clinic   @relation(fields: [clinicId], references: [id])
  date                  DateTime // The calendar date this summary covers
  totalPatients         Int      @default(0)
  avgWaitMinutes        Float    @default(0)
  peakHour              Int?     // Hour of day (0–23) with most check-ins
  qrCheckins            Int      @default(0) // Patients who used QR code
  manualCheckins        Int      @default(0) // Patients added manually
  createdAt             DateTime @default(now())

  @@unique([clinicId, date])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_daily_stats
```

**File to create:** `api/src/services/stats/compute.ts`

```typescript
import { prisma } from '../../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function computeDailyStats(clinicId: string, date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const entries = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      arrivedAt: { gte: dayStart, lte: dayEnd },
      status: 'COMPLETED',
    },
    select: {
      arrivedAt: true,
      completedAt: true,
      checkInMethod: true, // 'QR' | 'MANUAL' | 'WHATSAPP'
    }
  });

  if (entries.length === 0) return null;

  const totalPatients = entries.length;

  const waitMinutes = entries
    .filter(e => e.completedAt)
    .map(e => (e.completedAt!.getTime() - e.arrivedAt.getTime()) / 60000);
  const avgWaitMinutes = waitMinutes.length > 0
    ? waitMinutes.reduce((a, b) => a + b, 0) / waitMinutes.length
    : 0;

  // Find peak hour
  const hourCounts: Record<number, number> = {};
  entries.forEach(e => {
    const hour = e.arrivedAt.getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  });
  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  const qrCheckins = entries.filter(e => e.checkInMethod === 'QR').length;
  const manualCheckins = entries.filter(e => e.checkInMethod === 'MANUAL').length;

  return {
    totalPatients,
    avgWaitMinutes: Math.round(avgWaitMinutes),
    peakHour: peakHour ? parseInt(peakHour) : null,
    qrCheckins,
    manualCheckins,
  };
}
```

**Note:** This requires a `checkInMethod` field on `QueueEntry`. Add it to the schema:
```prisma
model QueueEntry {
  // ... existing fields ...
  checkInMethod  String  @default("MANUAL") // 'QR' | 'MANUAL' | 'WHATSAPP'
}
```

Update the QR check-in handler to set `checkInMethod: 'QR'` when creating the entry.

---

### 4.2 — Backend: Scheduled Summary Job

**File to create:** `api/src/jobs/dailySummary.ts`

```typescript
import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { computeDailyStats } from '../services/stats/compute';
import { sendWhatsAppMessage } from '../services/whatsapp';
import { formatSummaryMessage } from '../services/stats/format';

// Run every day at 19:30 Tunisia time (UTC+1)
export function scheduleDailySummaryJob() {
  cron.schedule('30 18 * * *', async () => {  // 18:30 UTC = 19:30 Tunisia
    console.info('[DailySummary] Starting daily summary job');

    const activeClinics = await prisma.clinic.findMany({
      where: {
        lastActiveDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Active in last 24h
        },
        phone: { not: null },
      },
      select: { id: true, name: true, phone: true, onboardingStage: true }
    });

    for (const clinic of activeClinics) {
      try {
        const stats = await computeDailyStats(clinic.id, new Date());
        if (!stats || stats.totalPatients === 0) continue;

        // Persist for in-app display
        await prisma.dailyStats.upsert({
          where: { clinicId_date: { clinicId: clinic.id, date: new Date() } },
          create: { clinicId: clinic.id, date: new Date(), ...stats },
          update: stats,
        });

        // Send WhatsApp
        const message = formatSummaryMessage(clinic.name, stats);
        await sendWhatsAppMessage(clinic.phone!, message);

      } catch (error) {
        console.error(`[DailySummary] Failed for clinic ${clinic.id}:`, error);
        // Continue to next clinic — one failure must not stop others
      }
    }

    console.info(`[DailySummary] Completed for ${activeClinics.length} clinics`);
  });
}
```

**Install `node-cron`:**
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

**Register the job** in `api/src/index.ts`:
```typescript
import { scheduleDailySummaryJob } from './jobs/dailySummary';
scheduleDailySummaryJob();
```

---

### 4.3 — WhatsApp Message Formatting

**File to create:** `api/src/services/stats/format.ts`

```typescript
interface DailyStatsResult {
  totalPatients: number;
  avgWaitMinutes: number;
  peakHour: number | null;
  qrCheckins: number;
}

export function formatSummaryMessage(clinicName: string, stats: DailyStatsResult): string {
  const peakHourText = stats.peakHour !== null
    ? `⏰ Pic d'affluence : ${stats.peakHour}h–${stats.peakHour + 1}h`
    : '';

  const qrRateText = stats.qrCheckins > 0
    ? `📱 ${stats.qrCheckins} patient(s) via QR code`
    : '';

  return [
    `📊 *Résumé du jour — ${clinicName}*`,
    ``,
    `👥 Patients reçus : *${stats.totalPatients}*`,
    `⌛ Attente moyenne : *${stats.avgWaitMinutes} min*`,
    peakHourText,
    qrRateText,
    ``,
    `_Bonne soirée — BleSaf_`
  ].filter(Boolean).join('\n');
}
```

**Example output sent via WhatsApp:**
```
📊 Résumé du jour — Cabinet Dr. Ben Ali

👥 Patients reçus : 24
⌛ Attente moyenne : 18 min
⏰ Pic d'affluence : 10h–11h
📱 19 patients via QR code

Bonne soirée — BleSaf
```

---

### 4.4 — Backend: Expose Daily Stats via API

**File to modify:** `api/src/routes/clinic.ts` (or equivalent)

Add a new endpoint to return recent daily stats for the in-app summary card:

```typescript
// GET /api/clinic/:clinicId/stats/daily?days=7
router.get('/:clinicId/stats/daily', authenticate, async (req, res) => {
  const { clinicId } = req.params;
  const days = parseInt(req.query.days as string) ?? 7;

  const stats = await prisma.dailyStats.findMany({
    where: {
      clinicId,
      date: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    },
    orderBy: { date: 'desc' },
    take: days,
  });

  res.json({ stats });
});
```

---

### 4.5 — Frontend: In-App Daily Summary Card

**File to create:** `web/src/components/DailySummaryCard.tsx`

This card lives inside the BottomDrawer and is visible only when `features.showDailySummaryPreview` is true (ENGAGED stage+). It shows yesterday's stats with a gentle comparison to today.

```tsx
export function DailySummaryCard({ clinicId }: { clinicId: string }) {
  const { data: stats } = useQuery(['daily-stats', clinicId], () =>
    api.getDailyStats(clinicId, 7)
  );

  const yesterday = stats?.[0];
  if (!yesterday) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
        Hier
      </p>
      <div className="grid grid-cols-3 gap-3">
        <StatCell
          value={yesterday.totalPatients}
          label="patients"
          icon="👥"
        />
        <StatCell
          value={`${yesterday.avgWaitMinutes} min`}
          label="attente moy."
          icon="⌛"
        />
        <StatCell
          value={yesterday.peakHour ? `${yesterday.peakHour}h` : '—'}
          label="pic"
          icon="📈"
        />
      </div>
    </div>
  );
}

function StatCell({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <div className="text-center">
      <p className="text-lg">{icon}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
```

---

### Week 4 Completion Checklist
- [ ] `DailyStats` model in Prisma, migration applied
- [ ] `checkInMethod` field on `QueueEntry`, set correctly on QR check-ins
- [ ] `computeDailyStats` calculates correctly (test with mock data)
- [ ] `node-cron` job schedules and fires at correct time
- [ ] WhatsApp message sends successfully to a test number
- [ ] Summary persisted to `DailyStats` table
- [ ] `/api/clinic/:clinicId/stats/daily` endpoint returns data
- [ ] `DailySummaryCard` renders correctly in drawer for ENGAGED+ stage
- [ ] Job fails gracefully per clinic (one error doesn't stop others)
- [ ] Tested end-to-end with a real clinic account

---

## Global Completion Checklist

Before considering this implementation production-ready:

- [ ] All 4 prerequisites completed (Socket.io auth, N+1 fix, remove demo creds, JWT secret)
- [ ] No `console.log` in production bundle
- [ ] No `as any` type assertions — all type safety gaps resolved
- [ ] All icon buttons have `aria-label` attributes
- [ ] `tailwindcss-rtl` plugin removed (Tailwind v3.4+ has native RTL)
- [ ] `SAMPLE_PATIENTS` demo array removed from `DashboardPage`
- [ ] Confetti removed from entire codebase
- [ ] Fun facts feature removed from patient status page
- [ ] Phone formatting consolidated to `web/src/lib/phone.ts`
- [ ] Time formatting consolidated to a shared `web/src/lib/time.ts` utility
- [ ] `useDashboard` hook extracted — `DashboardPage.tsx` under 120 lines
- [ ] `PatientStatusPage.tsx` under 200 lines
- [ ] Undo toast works for Call Next and Remove Patient
- [ ] Maturity stage transitions tested end-to-end
- [ ] Daily summary WhatsApp message tested with real number
- [ ] All existing functionality regression-tested after each week

---

## Architecture Reference: Final File Structure

After all four weeks, the project structure should look like this:

```
api/src/
├── jobs/
│   └── dailySummary.ts          ← NEW: Cron job
├── services/
│   ├── maturity.ts              ← NEW: Stage evaluation logic
│   ├── queue/
│   │   └── recalculate.ts       ← NEW: Batch position update
│   └── stats/
│       ├── compute.ts           ← NEW: Daily stats computation
│       └── format.ts            ← NEW: WhatsApp message formatting
├── routes/
│   ├── queue.ts                 ← MODIFIED: Uses recalculate.ts, thinner
│   ├── clinic.ts                ← MODIFIED: New daily stats endpoint
│   └── auth.ts                  ← MODIFIED: Returns onboardingStage
└── lib/
    └── auth.ts                  ← MODIFIED: No fallback JWT secret

web/src/
├── components/
│   ├── BottomDrawer.tsx         ← NEW
│   ├── UndoToast.tsx            ← NEW
│   ├── QRPromptBanner.tsx       ← NEW
│   ├── LockedFeatureTeaser.tsx  ← NEW
│   └── DailySummaryCard.tsx     ← NEW
├── hooks/
│   ├── useDashboard.ts          ← NEW: Extracted from DashboardPage
│   └── useClinicMaturity.ts     ← NEW: Feature flag hook
├── lib/
│   ├── phone.ts                 ← NEW: Shared phone formatting
│   └── time.ts                  ← NEW: Shared time formatting
└── pages/
    ├── DashboardPage.tsx        ← MODIFIED: < 120 lines, pure render
    └── PatientStatusPage.tsx    ← MODIFIED: Calm design, wait estimate
```
