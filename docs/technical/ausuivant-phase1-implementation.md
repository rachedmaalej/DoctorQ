# AuSuivant Phase 1: Foundation — Full Room View

**Status:** Implemented (March 2026)
**Branch:** `main` (uncommitted)
**Plan reference:** `.claude/plans/spicy-sniffing-quill.md`

---

## Overview

Phase 1 is the first deliverable of a 5-phase redesign that transforms the AuSuivant mobile dashboard from a flat compact queue into a **receptionist command center** for French multi-doctor clinics. This phase delivers a significantly better waiting room experience as a drop-in upgrade to the existing single-column layout, without yet introducing the schedule timeline or desktop 2-column view.

### Core Insight

French clinics think in scheduled time, not flat queues. The real power user is the **secretaire medicale** — managing 3-4 doctors, a ringing phone, and a room of anxious patients simultaneously. Phase 1 builds the waiting room foundation that all subsequent phases extend.

### What Changed

- Patient list upgraded from swipe-based cards to **visible-action rows** with doctor badges, urgency flags, and action menus
- New **KPI strip** replacing hero metrics with compact, always-visible stats
- New **quick action bar** with [+ Patient] and [Suivant (N)] buttons
- New **"Pour quel medecin?" bottom sheet** for per-doctor call-next
- New **urgency toggle** (priority system superseding isEmergency)
- New **`useWaitingRoom` hook** with sorting (urgent-first), doctor grouping, and filtering
- Brand variant renamed from `compact` to `schedule` across codebase

---

## Files Changed

### New Files (7)

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/useWaitingRoom.ts` | Core hook: sorts patients (urgent-first, then by position), groups by doctor, provides filtering and per-doctor waiting counts |
| `apps/web/src/components/ausuivant/ASDailyKPIStrip.tsx` | Compact metrics strip: En attente, Vus, Attente moy., Absents |
| `apps/web/src/components/ausuivant/ASPatientRow.tsx` | Patient row with position number, doctor color badge, urgency badge, RDV/Sans RDV tags, wait time, estimated wait, and action menu dropdown |
| `apps/web/src/components/ausuivant/ASWaitingRoom.tsx` | Container rendering `ASPatientRow` list with empty state ("Aucun patient en attente") |
| `apps/web/src/components/ausuivant/ASQuickActionBar.tsx` | Fixed bottom bar with [+ Patient] and [Suivant (N)] buttons |
| `apps/web/src/components/ausuivant/ASCallNextSheet.tsx` | Bottom sheet asking "Pour quel medecin?" — shows per-doctor buttons with waiting counts (multi-doctor) or simple confirm (single-doctor) |
| `apps/web/src/components/ausuivant/utils.ts` | Utility functions: `formatDisplayName` (RGPD), `formatArrivalTime`, `calculateEstimatedEndTime`, `getConsultationDuration`, `formatPhoneInput` |

### Modified Files (9)

| File | Changes |
|------|---------|
| `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx` | Rewritten — new props (`doctors`, `onCallNextForDoctor`, `onMarkUrgent`), uses `useWaitingRoom` hook, wires all new Phase 1 components |
| `apps/web/src/components/ausuivant/ausuivant.css` | Added 6 doctor color CSS custom properties (`--doctor-blue` through `--doctor-slate`) |
| `apps/web/src/hooks/useDashboard.ts` | Added `doctors` state, doctor fetching effect (when `multiDoctorEnabled`), `handleMarkUrgent`, `handleCallNextForDoctor` callbacks |
| `apps/web/src/stores/queueStore.ts` | `callNext` now accepts optional `doctorId` parameter, passes through to `api.callNext(doctorId)` |
| `apps/web/src/lib/api.ts` | `callNext(doctorId?)` appends `?doctorId=` query param; new `toggleUrgent(id)` method |
| `apps/web/src/lib/brand.ts` | Dashboard variant type: `'compact'` renamed to `'schedule'`; France config updated |
| `apps/web/src/pages/DashboardPage.tsx` | Passes `doctors`, `handleCallNextForDoctor`, `handleMarkUrgent` to AuSuivantDashboard; variant check updated to `'schedule'` |
| `apps/api/src/routes/queue.ts` | Call-next route extracts `doctorId` from query params; new `POST /:id/urgent` endpoint for toggling patient urgency |
| `apps/api/src/services/queueService.ts` | `callNextPatient(clinicId, doctorId?)` scopes IN_CONSULTATION completion and remaining-patient queries by doctor |

### Brand Variant Rename (`compact` -> `schedule`, 6 files)

| File | Change |
|------|--------|
| `apps/web/src/lib/brand.ts` | Type definition + France config value |
| `apps/web/src/App.tsx` | Conditional route rendering |
| `apps/web/src/pages/DashboardPage.tsx` | Mobile dashboard variant check |
| `apps/web/src/pages/admin/AdminDashboard.tsx` | Admin variant reference |
| `apps/web/src/pages/admin/clinics/ClinicDetailPage.tsx` | Clinic detail variant |
| `apps/web/src/pages/admin/clinics/ClinicsDirectoryPage.tsx` | Clinics directory variant |

---

## Architecture Details

### useWaitingRoom Hook

**Location:** `apps/web/src/hooks/useWaitingRoom.ts`

Replaces the previous flat queue rendering with structured patient management.

```typescript
function useWaitingRoom(queue: QueueEntry[], doctors: Doctor[]) {
  return {
    allPatients,          // Sorted: urgent first, IN_CONSULTATION first, then by position
    byDoctor,             // Map<string | null, QueueEntry[]> — grouped and sorted per-doctor
    activeDoctorFilter,   // string | null — null = show all (default)
    setDoctorFilter,      // For future Phase 3 doctor filtering
    waitingByDoctor,      // Map<string, number> — waiting counts per doctor (for ASCallNextSheet)
  };
}
```

**Sort order:** `urgent` priority first, then `IN_CONSULTATION` status first, then by backend-computed `position`. This ensures urgent patients always appear at the top of their doctor's sub-queue without jumping across doctor boundaries.

**Active statuses:** Only `WAITING`, `NOTIFIED`, and `IN_CONSULTATION` entries are shown. `COMPLETED`, `NO_SHOW`, and `CANCELLED` are filtered out.

### ASPatientRow Component

**Location:** `apps/web/src/components/ausuivant/ASPatientRow.tsx`

The core visual unit replacing `ASQueueCard`. Key differences:

- **Visible action menu** (three-dot dropdown) instead of swipe gestures — works on desktop and mobile
- **Doctor color badge** — circular initial (e.g., "M" for Dr. Martin) with deterministic color assignment
- **Multiple status badges**: Urgent (red), NOTIFIE (amber), RDV time or "Sans RDV" (grey)
- **RGPD-compliant display**: Names shown as "Prenom N." format via `formatDisplayName()`
- **Estimated wait time**: Calculated from position * avgConsultationMins
- **Arrival time**: Shown as "Arrivee HHhMM" format

**Doctor Color System:**

```typescript
const DOCTOR_COLORS = [
  { bg: '#EDF3F8', fg: '#2C5F8A' }, // blue
  { bg: '#E8F5EE', fg: '#0F7B6C' }, // teal
  { bg: '#FFF8EC', fg: '#C4841D' }, // amber
  { bg: '#F3EDF8', fg: '#7B4FA0' }, // plum
  { bg: '#FDEEEC', fg: '#B04060' }, // rose
  { bg: '#F0F0F0', fg: '#4A5568' }, // slate
];
```

Colors are assigned deterministically by doctor index in the `doctors` array. Unassigned patients get slate. The `getDoctorColor()` helper is exported for reuse in `ASCallNextSheet`.

### ASCallNextSheet — Multi-Doctor Flow

**Location:** `apps/web/src/components/ausuivant/ASCallNextSheet.tsx`

Bottom sheet that opens when the receptionist taps "Suivant" in the quick action bar.

**Multi-doctor mode** (doctors configured):
- Shows each active doctor as a button with: circular initial, name, waiting count
- Doctor-colored styling matches patient row badges
- Disabled (50% opacity) when a doctor has 0 patients waiting
- Tapping a doctor calls `onCallNextForDoctor(doctorId)` and closes the sheet

**Single-doctor mode** (no doctors configured):
- Shows a single green "Appeler le prochain patient" confirm button
- Calls `onCallNextGlobal()` and closes the sheet

This ensures a consistent UX pattern — the receptionist always goes through the sheet, never accidentally calls globally.

### Quick Action Bar

**Location:** `apps/web/src/components/ausuivant/ASQuickActionBar.tsx`

Fixed at the bottom of the screen with two buttons:

- **[+ Patient]** — outlined, opens `ASAddPatientSheet`
- **[Suivant (N)]** — solid green accent, opens `ASCallNextSheet`. Shows waiting count. Disabled when `waitingCount === 0` or doctor is not present.

Respects `safe-area-inset-bottom` for notched devices. Max-width 430px centered.

### Daily KPI Strip

**Location:** `apps/web/src/components/ausuivant/ASDailyKPIStrip.tsx`

Compact horizontal strip showing 4 metrics separated by thin dividers:

| Metric | Source | Highlight |
|--------|--------|-----------|
| En attente | `waitingCount` prop | Green accent when > 0 |
| Vus | `stats.seen` | None |
| Attente moy. | `stats.avgWait` | None (shows "—" if unavailable) |
| Absents | `stats.noShows` | Orange warning when > 0 |

---

## Backend Changes

### Per-Doctor Call-Next

**`apps/api/src/services/queueService.ts` — `callNextPatient(clinicId, doctorId?)`**

The function now accepts an optional `doctorId` parameter that scopes three operations:

1. **Complete current IN_CONSULTATION**: Only completes the patient currently in consultation **for that doctor** (or globally if no doctorId)
2. **Check remaining patients**: Only counts WAITING/NOTIFIED patients **for that doctor**
3. **Promote next patient**: After `recalculatePositionsAndStatuses()`, finds the first WAITING/NOTIFIED patient **for that doctor**

This enables parallel consultations across doctors — Doctor A can call their next patient while Doctor B is still consulting.

The EMA (Exponential Moving Average) for `avgConsultationMins` updates both the specific doctor's avg and the clinic-wide avg on each completion.

### Urgency Toggle Endpoint

**`POST /api/queue/:id/urgent`**

New endpoint in `apps/api/src/routes/queue.ts`:

```
POST /api/queue/:id/urgent
Auth: Required (clinic JWT)
Gate: Subscription required

Response: { data: { id: string, priority: 'normal' | 'urgent' } }
```

Toggles a patient's `priority` between `normal` and `urgent`. After toggling:
1. Calls `recalculatePositionsAndStatuses(clinicId)` — backend position calculation respects priority
2. Emits `queue:update` via Socket.io to all dashboard clients
3. Emits patient-specific updates via Socket.io

The `Priority` enum (`normal` | `urgent`) is defined in Prisma and supersedes the legacy `isEmergency: Boolean` field. The `isEmergency` field still exists in the schema but is no longer read or written by new code. Full removal is deferred to Phase 5.

### Call-Next Query Parameter

**`POST /api/queue/next?doctorId=<id>`**

The existing call-next endpoint now reads an optional `doctorId` query parameter:

```typescript
const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined;
const newInConsultation = await callNextPatient(clinicId, doctorId);
```

Backward compatible — omitting `doctorId` preserves the existing global call-next behavior.

---

## Frontend API Layer Changes

### `apps/web/src/lib/api.ts`

```typescript
// Updated: accepts optional doctorId
async callNext(doctorId?: string): Promise<{ called: QueueEntry; notified: QueueEntry[] }> {
  const url = doctorId ? `/api/queue/next?doctorId=${doctorId}` : '/api/queue/next';
  return this.request(url, { method: 'POST' });
}

// New: toggle patient urgency
async toggleUrgent(id: string): Promise<{ id: string; priority: 'normal' | 'urgent' }> {
  return this.request(`/api/queue/${id}/urgent`, { method: 'POST' });
}
```

### `apps/web/src/stores/queueStore.ts`

```typescript
// Updated signature
callNext: async (doctorId?: string) => {
  await api.callNext(doctorId);
  // ...
}
```

### `apps/web/src/hooks/useDashboard.ts`

Three new additions:

1. **`doctors` state** — `useState<Doctor[]>([])`, fetched on mount when `clinic.multiDoctorEnabled`
2. **`handleMarkUrgent(id)`** — calls `api.toggleUrgent(id)`, shows toast, refreshes queue
3. **`handleCallNextForDoctor(doctorId)`** — calls `callNext(doctorId)`, shows toast with doctor name

All three are exposed in the hook's return value and passed through `DashboardPage` to `AuSuivantDashboard`.

---

## Utility Functions

**Location:** `apps/web/src/components/ausuivant/utils.ts`

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `formatDisplayName` | `"Marie Dupont"` | `"Marie D."` | RGPD-compliant name display |
| `formatArrivalTime` | ISO date string | `"15h51"` | French time format for arrival/appointment |
| `calculateEstimatedEndTime` | `(waitingCount, avgMins)` | `"~16h30"` | End-of-queue estimate |
| `getConsultationDuration` | ISO date string | `12` (minutes) | Duration since consultation started |
| `formatPhoneInput` | `"612345678"` | `"6 12 34 56 78"` | French phone display formatting |

---

## CSS Tokens Added

**`apps/web/src/components/ausuivant/ausuivant.css`**

```css
/* Doctor color tokens (added to existing .as-dashboard) */
--doctor-blue:   #2C5F8A;
--doctor-teal:   #0F7B6C;
--doctor-amber:  #C4841D;
--doctor-plum:   #7B4FA0;
--doctor-rose:   #B04060;
--doctor-slate:  #4A5568;
```

These are the CSS equivalents of the JavaScript `DOCTOR_COLORS` array. Currently used in CSS for future Phase 3 `ASDoctorPill` styling; JavaScript colors drive the Phase 1 inline styles on `ASPatientRow` and `ASCallNextSheet`.

---

## Component Tree

```
DashboardPage
  |-- AuSuivantDashboard (rewritten)
  |     |-- ASTopbar (unchanged)
  |     |-- ASDailyKPIStrip (NEW - replaces ASHeroMetrics)
  |     |-- ASSessionControls (kept for Phase 1, removed in Phase 5)
  |     |-- ASWaitingRoom (NEW - replaces ASQueueSection)
  |     |     |-- ASPatientRow (NEW - replaces ASQueueCard)
  |     |           |-- getDoctorColor() helper
  |     |           |-- formatDisplayName() utility
  |     |-- ASQuickActionBar (NEW - replaces ASFAB + ASCallNextButton)
  |     |-- ASCallNextSheet (rewritten for multi-doctor)
  |     |-- ASAddPatientSheet (unchanged)
  |     |-- ASSettingsPanel (unchanged)
  |
  |-- useWaitingRoom (NEW hook)
  |-- useDashboard (modified: +doctors, +handleMarkUrgent, +handleCallNextForDoctor)
```

### Components to Remove in Phase 5

These old components are still in the codebase but are no longer imported by `AuSuivantDashboard`:

| Component | Replaced By |
|-----------|------------|
| `ASHeroMetrics.tsx` | `ASDailyKPIStrip` |
| `ASCallNextButton.tsx` | `ASQuickActionBar` + `ASCallNextSheet` |
| `ASConsultationBar.tsx` | Integrated into `ASDoctorPill` (Phase 3) |
| `ASQueueSection.tsx` | `ASWaitingRoom` |
| `ASQueueCard.tsx` | `ASPatientRow` |
| `ASFAB.tsx` | `ASQuickActionBar` |

`ASSessionControls` is still actively used in Phase 1 but will be replaced by `ASDoctorStatusBar` in Phase 3.

---

## Data Flow

```
User taps "Suivant" in ASQuickActionBar
  -> ASCallNextSheet opens (bottom sheet)
  -> User taps a doctor
  -> AuSuivantDashboard.onCallNextForDoctor(doctorId)
  -> DashboardPage.handleCallNextForDoctor(doctorId)
  -> queueStore.callNext(doctorId)
  -> api.callNext(doctorId)
  -> POST /api/queue/next?doctorId=xxx
  -> queueService.callNextPatient(clinicId, doctorId)
     1. Complete current IN_CONSULTATION for this doctor
     2. recalculatePositionsAndStatuses(clinicId)
     3. Find next WAITING/NOTIFIED for this doctor
     4. Promote to IN_CONSULTATION
  -> Socket.io emits queue:update
  -> All dashboards refresh via useSocket
```

```
User taps "Marquer urgent" in ASPatientRow menu
  -> AuSuivantDashboard.onMarkUrgent(id)
  -> DashboardPage.handleMarkUrgent(id)
  -> api.toggleUrgent(id)
  -> POST /api/queue/:id/urgent
  -> Toggle priority: normal <-> urgent
  -> recalculatePositionsAndStatuses(clinicId)
  -> Socket.io emits queue:update + patient updates
  -> useWaitingRoom re-sorts: urgent patients float to top
```

---

## Testing Checklist

### Verified

- [x] Patient rows render with position numbers, names, wait times
- [x] Urgent badge (red "Urgent" tag) appears on flagged patients
- [x] "Sans RDV" tag shows for walk-in patients
- [x] KPI strip shows correct counts (En attente, Vus, Attente moy., Absents)
- [x] Quick action bar renders at bottom with [+ Patient] and [Suivant]
- [x] "Suivant" disabled when no patients or doctor not present
- [x] Doctor presence toggle works
- [x] Add patient sheet opens from [+ Patient]
- [x] Backend `POST /api/queue/:id/urgent` toggles priority correctly
- [x] Backend `POST /api/queue/next?doctorId=` scopes correctly

### To Verify (manual testing)

- [ ] Action menu dropdown opens and closes correctly
- [ ] "Marquer urgent" in menu toggles patient priority and re-sorts
- [ ] "Retirer" in menu triggers confirm modal and removes patient
- [ ] ASCallNextSheet opens with correct doctor list (multi-doctor clinic)
- [ ] ASCallNextSheet shows simple confirm (single-doctor clinic)
- [ ] Per-doctor call-next completes correct doctor's current patient
- [ ] Estimated wait times calculate correctly (position * avgMins)
- [ ] RGPD name formatting works ("Marie Dupont" -> "Marie D.")
- [ ] Socket.io real-time updates reflect urgency changes
- [ ] Empty state renders when no patients in queue

---

## What's Next: Phase 2

Phase 2 adds the **schedule timeline** and takes a position on Doctolib coexistence:

- `ScheduleSlot` Prisma model (named / regulation / unplanned)
- `ASScheduleTimeline` component (left column, desktop)
- `ASScheduleSlot` with status dots and actions
- `ASNoShowBanner` for overdue patients
- `ASDoctolibImportBanner` (one-time prompt)
- `useScheduleView` hook
- Regulation slot configuration in settings
- Decision gate: Doctolib API path A/B/C

See full plan in `.claude/plans/spicy-sniffing-quill.md`.
