# Progressive Sonar Dashboard — Implementation Plan

> **Created:** Feb 26, 2026
> **Status:** Active. Supersedes [PROGRESSIVE-DASHBOARD-IMPLEMENTATION.md](PROGRESSIVE-DASHBOARD-IMPLEMENTATION.md) (~Feb 18, 2026). Written against the current codebase state; reuses existing components rather than rebuilding.
> **Visual reference:** [blesaf-sonar-final.html](blesaf-sonar-final.html) (Sonar mockup), [progressive-dashboard-stages.html](progressive-dashboard-stages.html) (4-stage showcase)

## Context

BleSaf's current dashboard shows all features from day 1, which overwhelms new clinic users. The goal is to implement a **progressive dashboard** that starts minimal (add patient, call next, share WhatsApp link) and gradually reveals stats, context menus, lifecycle features, and advanced settings as the clinic's usage grows. The visual foundation is the "Sonar" mockup (`design/blesaf-sonar-final.html`) — a 3-zone layout with a pulsing "Add Patient" chip at the bottom.

**Approach: Modify existing code, not rebuild.** The data layer (useDashboard hook, queueStore, Socket.io) stays untouched. We transform `BlesafDashboard` into the Sonar layout, add a backend maturity system, and conditionally render features based on maturity stage.

---

## Phase 0: Maturity System (Backend Foundation)

Everything depends on this. The frontend needs `maturityStage` from the Clinic object.

### 0.1 — Schema: add fields to Clinic model
**File:** `apps/api/prisma/schema.prisma` (after line 101, before `createdAt`)

```prisma
// Progressive maturity
maturityStage         String    @default("NEWCOMER") // NEWCOMER | ACTIVATED | ENGAGED | POWER_USER
totalPatientsServed   Int       @default(0)
firstQrCheckinAt      DateTime?
```

Use `String` not enum — avoids data-loss migrations if stages change later.
Run: `cd apps/api && npx prisma migrate dev --name add_maturity_fields`

### 0.2 — Create maturity evaluation service
**Create:** `apps/api/src/services/maturityService.ts`

- `evaluateMaturity(clinicId)` → reads clinic, computes stage, writes if changed
- Stages only move forward:
  - NEWCOMER → ACTIVATED: `firstQrCheckinAt` is set
  - ACTIVATED → ENGAGED: `totalPatientsServed >= 50` OR account age >= 7 days
  - ENGAGED → POWER_USER: `totalPatientsServed >= 200` OR account age >= 30 days

### 0.3 — Wire into auth + cron
**Modify:** `apps/api/src/routes/auth.ts`
- Call `evaluateMaturity()` on POST `/login` (after `lastLoginAt` update)
- Include `maturityStage` in clinic response on both `/login` and `GET /me`

**Modify:** `apps/api/src/lib/scheduler.ts`
- Call `evaluateMaturity()` in the midnight cron for each active clinic

### 0.4 — Increment totalPatientsServed on completion
**Modify:** `apps/api/src/services/queueService.ts`
- When a patient is marked COMPLETED: `prisma.clinic.update({ data: { totalPatientsServed: { increment: 1 } } })`

### 0.5 — Set firstQrCheckinAt on first QR check-in
**Modify:** `apps/api/src/services/queueService.ts` (or QR check-in route)
- When `checkInMethod === 'QR_CODE'` and `clinic.firstQrCheckinAt` is null: set it
- Also set `activationFirstPatient = true` (feeds existing activation checklist)

### 0.6 — Frontend type + hook
**Modify:** `apps/web/src/types/index.ts` — add `maturityStage?: string` to Clinic interface

**Create:** `apps/web/src/hooks/useClinicMaturity.ts`

```typescript
export function useClinicMaturity() → { stage, features }
```

Feature flags: `showStats`, `showContextMenus`, `showLifecycle`, `showClosingWorkflow`, `showWhatsAppBulk`, `showDailySummary`, `showPreRegistration`, `showExport`, `showActivationChecklist`

### 0.7 — Seed existing clinics
One-time migration script: Count historical COMPLETED entries per clinic from DailyStat and populate `totalPatientsServed`. Without this, existing clinics restart at NEWCOMER.

---

## Phase 1: Sonar Layout (Mobile Visual Transformation)

Transform `BlesafDashboard` into the Sonar 3-zone layout from the mockup.

### 1.1 — Redesign BSHeader → Zone A
**Modify:** `apps/web/src/components/blesaf/BSHeader.tsx` (currently 78 lines)

New layout to match mockup:
- **Row 1:** Clinic name + language toggle + doctor presence pill (green dot + "Présent") + settings gear
- **Row 2:** Big patient count (`font-size: 34px; font-weight: 800`) + remaining time chip with schedule icon
- **Row 3:** Current patient inline — "En consultation" label, patient name (24px bold), arrival/duration meta, "Terminer" button + phone button
- **Row 4:** "Appeler Suivant" full-width CTA with next patient preview

New props: `currentPatient`, `onCallNext`, `onCompleteConsultation`, `isCallingNext`, `canCallNext`, `nextPatientName`, `nextPatientWait`, `showStats` (maturity flag)

When `showStats === false` (NEWCOMER): hide the stats row and timer chip, only show patient count.

### 1.2 — Update BSQueueList → Zone B
**Modify:** `apps/web/src/components/blesaf/BSQueueList.tsx`

Add per mockup:
- Check-in method badge with icon (`qr_code_2` for QR, `edit` for Manual)
- Arrival time column (right-aligned, "10:24" / "arrivée")
- `more_vert` button per row (behavior depends on maturity — simple remove for NEWCOMER, context sheet for ENGAGED+)
- "FILE D'ATTENTE" header with count badge

### 1.3 — Create Sonar Chip → Zone C
**Create:** `apps/web/src/components/blesaf/BSSonarChip.tsx`

- Drag pill + sonar chip with `person_add` icon + "Ajouter un patient"
- Two CSS ring animations (sonar-expand keyframes, 3s cycle, 0.65s stagger)
- `onClick` → opens existing BSAddPatientSheet

### 1.4 — Update BlesafDashboard composition
**Modify:** `apps/web/src/components/blesaf/BlesafDashboard.tsx`

New structure:
```
<div className="bs-dashboard">
  <div className="bs-screen"> (scrollable)
    <BSHeader ... />           ← Zone A (green, current patient + CTA inside)
    <BSQueueList ... />        ← Zone B (cream, scrollable)
    {empty && <EmptyState />}
  </div>
  <BSSonarChip onClick={…} /> ← Zone C (fixed bottom)
  <BSAddPatientSheet ... />    ← Existing, triggered by sonar chip
</div>
```

Remove: `BSQuickAdd` (replaced by sonar chip), `BSFloatingCTA` (CTA moves into Zone A header), `BSCurrentPatient` standalone render (merged into BSHeader).

### 1.5 — Wire into DashboardPage
**Modify:** `apps/web/src/pages/DashboardPage.tsx`

Replace `ReceptionistDashboard` with `BlesafDashboard` in the mobile Tunisia branch. Pass `clinic` prop (needed for clinic name in header).

### 1.6 — Update CSS design tokens
**Modify:** `apps/web/src/components/blesaf/blesaf.css`

Update to match mockup: `--green: #2A7A52`, `--green-dk: #1F5E3E`, `--cream: #F2F0EB`, `--cream-dk: #E8E5DF`, `--border: #E0DDD7`. Add Zone A/B/C layout classes and sonar animation keyframes.

---

## Phase 2: Progressive Feature Unlocking (Mobile)

Wire `useClinicMaturity` into the Sonar dashboard to show/hide features per stage.

### Stage Map

| Feature | NEWCOMER | ACTIVATED | ENGAGED | POWER_USER |
|---------|----------|-----------|---------|------------|
| Add patient (sonar chip) | yes | yes | yes | yes |
| Call next (Zone A CTA) | yes | yes | yes | yes |
| Queue list (basic rows) | yes | yes | yes | yes |
| WhatsApp share (per patient, in add sheet) | yes | yes | yes | yes |
| Stats row in header | - | yes | yes | yes |
| Timer chip in header | - | yes | yes | yes |
| Activation checklist | yes | auto-dismiss | - | - |
| Context menus (more_vert) | remove only | remove only | full sheet | full sheet |
| Closing workflow | - | - | yes | yes |
| WhatsApp bulk | - | - | yes | yes |
| Daily summary card | - | - | yes | yes |
| Lifecycle screens (PRE_OPEN/CLOSED) | - | - | - | yes |
| Pre-registration list | - | - | - | yes |
| Export | - | - | - | yes |

### Implementation

**Modify:** `apps/web/src/components/blesaf/BlesafDashboard.tsx`

- Import `useClinicMaturity`
- Always call `useQueueLifecycle` (hooks can't be conditional), but only use its output when `features.showLifecycle`
- Conditionally render: context sheet, status sheet, WhatsApp bulk sheet, closing banner, summary cards
- Cherry-pick components from `receptionist/` directory (they're already standalone):
  - `PatientContextSheet` → used at ENGAGED+
  - `StatusSheet` → used at ENGAGED+
  - `ClosingBanner` → used at ENGAGED+
  - `AllDoneCard` → used at ENGAGED+
  - `MorningCard`, `PreRegisteredList` → used at POWER_USER
  - `SummaryCard`, `TimelineBar`, `SummaryActionBar` → used at POWER_USER

Lifecycle screens render as CONTENT in Zone B — Zone A header and Zone C sonar stay consistent across all screens.

---

## Phase 3: Desktop Progressive

**Modify:** `apps/web/src/components/dashboard/DesktopDashboard.tsx`

Apply same maturity flags:
- **NEWCOMER:** Hide stat cards, announcement button, QR mini-card. Simplified greeting. Basic queue rows.
- **ACTIVATED:** Stat cards + QR mini-card appear.
- **ENGAGED:** Announcement, reorder buttons, full greeting.
- **POWER_USER:** Emergency/priority, export, all features.

---

## Phase 4: Deprecate ReceptionistDashboard

After all features are ported into the Sonar layout:

1. Remove `ReceptionistDashboard` import from `DashboardPage.tsx`
2. Keep receptionist sub-components (they're imported by BlesafDashboard now)
3. The `useQueueLifecycle` hook, `PatientContextSheet`, `StatusSheet`, etc. remain in `receptionist/` dir as shared utilities

---

## Files Summary

### Create (3 files)
| File | Purpose |
|------|---------|
| `apps/api/src/services/maturityService.ts` | Backend maturity evaluation |
| `apps/web/src/hooks/useClinicMaturity.ts` | Frontend maturity hook + feature flags |
| `apps/web/src/components/blesaf/BSSonarChip.tsx` | Zone C sonar animation chip |

### Modify (13 files)
| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add 3 maturity fields to Clinic |
| `apps/api/src/routes/auth.ts` | Return maturityStage in login + /me |
| `apps/api/src/services/queueService.ts` | Increment totalPatientsServed, set firstQrCheckinAt |
| `apps/api/src/lib/scheduler.ts` | Call evaluateMaturity in midnight cron |
| `apps/web/src/types/index.ts` | Add maturityStage to Clinic type |
| `apps/web/src/components/blesaf/BlesafDashboard.tsx` | **Major**: Sonar composition + progressive features |
| `apps/web/src/components/blesaf/BSHeader.tsx` | **Major**: Becomes Zone A with current patient + CTA |
| `apps/web/src/components/blesaf/BSQueueList.tsx` | Add check-in badges, arrival times, context toggle |
| `apps/web/src/components/blesaf/blesaf.css` | **Major**: New tokens, zone styles, sonar animation |
| `apps/web/src/pages/DashboardPage.tsx` | Swap ReceptionistDashboard for BlesafDashboard |
| `apps/web/src/components/dashboard/DesktopDashboard.tsx` | Add maturity-based conditional rendering |
| `apps/web/src/i18n/locales/fr.json` | New translation keys |
| `apps/web/src/i18n/locales/ar.json` | New translation keys |

### Untouched (critical to note)
- `apps/web/src/hooks/useDashboard.ts` — data flow stays the same
- `apps/web/src/stores/queueStore.ts` — no changes
- `apps/web/src/components/blesaf/BSAddPatientSheet.tsx` — reused as-is
- `apps/web/src/components/receptionist/useQueueLifecycle.ts` — imported as-is
- `apps/web/src/components/receptionist/PatientContextSheet.tsx` — imported as-is

---

## Verification

### Phase 0
- Login response includes `maturityStage: "NEWCOMER"` for new clinics
- Add patient via QR → `firstQrCheckinAt` set, stage transitions to ACTIVATED on next login
- Mark 50 patients completed → stage transitions to ENGAGED
- Midnight cron updates stages for inactive clinics

### Phase 1
- Mobile Tunisia shows Sonar layout: green Zone A, cream Zone B, sonar chip Zone C
- Current patient displays inline in green header
- "Appeler Suivant" CTA works from Zone A
- Sonar chip opens BSAddPatientSheet
- Queue rows show check-in method badges + arrival times
- All queue operations (add, remove, call next, complete) work
- RTL layout correct for Arabic

### Phase 2
- NEWCOMER: no stats, simple more_vert (remove only), activation checklist visible
- ACTIVATED: stats row appears, checklist auto-dismisses
- ENGAGED: context menus, closing workflow, WhatsApp bulk
- POWER_USER: full lifecycle screens, pre-registration, export

### Phase 3
- Desktop renders progressive features matching mobile stages
- No regression at POWER_USER level
