# AuSuivant Dashboard Redesign v2 — Receptionist Command Center for French MSPs

## Design Philosophy

The previous spec described a "schedule-first, multi-doctor dashboard." This revision corrects the foundational user model behind that description.

The **primary user is the secrétaire médicale** — the receptionist managing a shared waiting room for 3–5 independent, peer-status practitioners (*libéraux*) in a *Maison de Santé Pluriprofessionnelle* (MSP). She is simultaneously on the phone, greeting a patient at the counter, and monitoring four separate consultation rooms. Her mental model is not "view Dr. Martin's queue then switch to Dr. Leroy's." Her mental model is: **"This room. All patients. Who is waiting for whom. What is happening right now."**

The **secondary persona is the receptionist away from the desk** — on a tablet at a second entrance, at a satellite counter, or briefly stepping away. Mobile is not for doctors. Doctors in MSPs use their own clinical software (Doctolib, Hellodoc, their LGC). They do not manage waiting rooms on phones.

This shapes every architectural decision that follows.

### The Four Truths of French General Practice

1. **Walk-ins are structural, not exceptional.** French GPs accept an average of 6.61 unscheduled consultations per day — nearly a third of their schedule. Dedicated *créneaux de régulation* (buffer slots) are built into agendas by design. Any timeline that only shows named appointments is lying about the actual schedule.

2. **Delay is a communication problem, not just a visibility problem.** 7 in 10 French GPs run late regularly; 4 in 10 do so systematically. The receptionist's job is not merely to see the delay — it is to **tell waiting patients** about it before frustration builds. This requires an action, not just a metric.

3. **The secrétaire is the judgment layer.** She knows which patients take longer, adjusts slots on the fly, triages urgency at the door, and handles the phone simultaneously. The UI must support this judgment work, not replace it with automation.

4. **No hierarchy between doctors.** In an MSP, all practitioners are equal *libéraux*. The receptionist manages across peers. Doctor-switching must be quick but secondary — she always sees the full room first.

---

## Doctolib Coexistence Position

This must be defined before any schedule feature is built, because it determines what data lives where.

**AuSuivant is the waiting room layer, not the booking layer.** Doctolib (or Maiia, or MonDocteur) owns appointment booking. AuSuivant owns what happens after the patient walks through the door.

**Integration strategy for the timeline:**
- AuSuivant imports today's appointment schedule from Doctolib via read-only webhook or polling (Phase 2).
- Until that integration exists, the receptionist manually marks "expected patients" at session start, or the timeline is populated from walk-in check-ins only.
- The spec must **never build features that require receptionists to enter appointments twice** — once in Doctolib and once in AuSuivant. This would cause immediate rejection.

**Phase gate:** The schedule timeline (Phase 2) must ship a Doctolib import option or clearly document that manual entry is a deliberate choice for clinics not yet on Doctolib.

---

## Architecture Overview

### The Core Mental Model: One Room, All Doctors

The default view always shows **every patient currently waiting**, with their assigned doctor as a visual property (color-coded badge, doctor initial) of each row. Doctor filtering is a secondary action for specific edge cases (separate floors, very large practices). This is the single most important architectural correction from v1.

### Desktop Layout (lg+): 2-Column + Floating Detail

```
+----------------------------------------------------------------+
| ASTopbar: [Logo]  [Clinic Name]              [gear] [Dr pills] |
+----------------------------------------------------------------+
| ASDailyKPIStrip: 12 attendus | 8 vus | ⌛ 18min | 2 absents  |
+----------------------------------------------------------------+
| ASDoctorStatusBar:                                             |
| [● Martin En consult +15min ▸ Appeler] [○ Leroy Libre ▸]     |
| [◐ Ngo Pause] [✕ Bernard Absent — Gérer les créneaux]        |
+-----------------------------+----------------------------------+
| AGENDA (360px)              | SALLE D'ATTENTE (flex-1)         |
|                             |                                  |
| 09:00 [arrived] Dupont      | [+ Patient]  [Rechercher]        |
| 09:15 [waiting] Martin P.   |                                  |
| 09:30 [créneau libre] ----  | 1. [M] Dupont M.  09:00  14min  |
| 09:45 [arrived] Petit S.    | 2. [L] Martin P.  09:15   8min  |
| 10:00 [noshow!!] Bernard L. | 3. [M] Bernard    --:--  22min  |
| 10:15 [créneau libre] ----  |    ⚡ Urgent                     |
| 10:30 [expected] Rousseau   | 4. [L] Petit S.   09:45   3min  |
|                             |                                  |
+-----------------------------+----------------------------------+
                                    [Detail drawer slides in on row click]
```

Doctor pills in topbar = at-a-glance status for all doctors. Clicking a pill opens the doctor's action panel (not a filter). The waiting room always shows all patients.

### Mobile Layout (<lg): Receptionist-First

```
+-----------------------------+
| [Logo]  [Clinic]   [gear]   |
+-----------------------------+
| [● Martin +15] [○ Leroy]    |  <- Scrollable doctor pills
+-----------------------------+
| 12 att. | 8 vus | ⌛18min   |  <- KPI strip (compact)
+-----------------------------+
| [ Salle d'attente ] [Agenda]|  <- Tab bar
+-----------------------------+
|                             |
| 1. [M] Dupont M.  14min  ⋮ |
| 2. [L] Martin P.   8min  ⋮ |
| 3. [M] Bernard    22min ⚡⋮ |
| 4. [L] Petit S.    3min  ⋮ |
|                             |
+-----------------------------+
| [+ Patient]  [▸ Suivant…]   |  <- Fixed bottom bar
+-----------------------------+
```

"Suivant…" opens a bottom sheet asking which doctor to call next for — it is never a single global action.

---

## Component Inventory

### NEW Components (`apps/web/src/components/ausuivant/`)

| Component | Purpose | Key Design Decision |
|---|---|---|
| `ASDesktopLayout.tsx` | 2-column CSS grid shell (lg+) | No persistent 3rd column; detail is a drawer |
| `ASMobileLayout.tsx` | Tabbed shell with fixed bottom bar | Salle d'attente tab is default, not Agenda |
| `ASScheduleTimeline.tsx` | Left-column appointment timeline | Supports 3 slot types: named / créneau libre / non-programmé |
| `ASScheduleSlot.tsx` | Single slot row with status dot and actions | Créneau libre slots show "Affecter" CTA |
| `ASDoctorStatusBar.tsx` | Horizontal doctor pills with state + actions | Each pill has inline "▸ Appeler suivant" when libre |
| `ASDoctorActionPanel.tsx` | Slide-down panel per doctor from status bar | Contains: call next, mark absent, notify delay, manage slots |
| `ASQuickActionBar.tsx` | [+ Patient] + [▸ Suivant…] actions | "Suivant" opens doctor selector sheet |
| `ASDailyKPIStrip.tsx` | Compact metrics row | Attendus / Vus / Attente moy / Absents / Retard |
| `ASWaitingRoom.tsx` | Full-room patient list (ALL doctors by default) | Doctor shown as colored initial badge per row |
| `ASPatientRow.tsx` | Single patient row with visible actions | Urgency flag, doctor badge, wait time, action menu |
| `ASPatientDetailDrawer.tsx` | Slide-in right drawer on row click | Replaces persistent 280px column |
| `ASNoShowBanner.tsx` | Orange alert for overdue expected patients | Per-doctor grouping, bulk "Marquer absent" action |
| `ASDelayNotifyAction.tsx` | "Prévenir les patients" inline action | Triggered from doctor pill when delay > threshold |
| `ASDoctorAbsenceModal.tsx` | Workflow for marking a doctor absent | Options: close all slots / reassign patients / keep open |
| `ASUrgencyFlag.tsx` | Urgent marker on patient rows | Visual only; reorders within doctor queue, not across |
| `ASTransferPatientSheet.tsx` | Bottom sheet for inter-doctor transfer | Select target doctor + confirm |
| `ASCallNextSheet.tsx` | Bottom sheet: "Pour quel médecin?" | Used by global "Suivant…" button on mobile |
| `ASDoctoLibImportBanner.tsx` | One-time prompt to import today's schedule | Shows on first load if no appointmentTime data |

### MODIFIED Components

| Component | Changes |
|---|---|
| `AuSuivantDashboard.tsx` | Rewrite as responsive shell routing to ASDesktopLayout / ASMobileLayout |
| `ASTopbar.tsx` | Add doctor status pills (desktop); remove session badge |
| `ASAddPatientSheet.tsx` | Add `doctorId` dropdown + `isUrgent` toggle + `creneauId` linkage |
| `ausuivant.css` | Add grid tokens, slot status colors, doctor color tokens, remove 430px max-width on desktop |

### REMOVED Components (replaced)

| Component | Replaced By |
|---|---|
| `ASHeroMetrics.tsx` | `ASDailyKPIStrip` |
| `ASSessionControls.tsx` | `ASDoctorStatusBar` |
| `ASCallNextButton.tsx` | `ASQuickActionBar` + `ASCallNextSheet` |
| `ASConsultationBar.tsx` | Integrated into `ASDoctorStatusBar` |
| `ASQueueSection.tsx` | `ASWaitingRoom` |
| `ASQueueCard.tsx` | `ASPatientRow` |
| `ASFAB.tsx` | `ASQuickActionBar` |

### KEPT As-Is

| Component | Reason |
|---|---|
| `ASSettingsPanel.tsx` | No changes needed |
| `ASSummaryCard.tsx` | End-of-day summary, defer redesign |

---

## New Data Concepts

### Three Schedule Slot Types

```typescript
type SlotType =
  | 'named'           // Specific patient booked (RDV classique)
  | 'regulation'      // Reserved open slot (créneau de régulation)  
  | 'unplanned';      // Walk-in that filled an unplanned gap (after the fact)
```

The timeline must display all three. Regulation slots show as `──── Créneau libre ────` with an "Affecter" action. This is how GPs actually design their days.

### Doctor States (Extended)

```typescript
type DoctorState =
  | 'consulting'      // In active consultation
  | 'free'            // Between patients, ready to call next
  | 'pause'           // Short break (declared)
  | 'absent_today'    // Called in sick or not present this session
  | 'home_visit'      // Out for a domicile visit (has return ETA)
  | 'inactive';       // Not working today (scheduled off)
```

`absent_today` and `home_visit` are new states that require an action workflow, not just a visual.

### Patient Priority

```typescript
type PatientPriority = 'normal' | 'urgent';
```

Urgent patients are flagged at check-in or promoted by the receptionist. They float to the top of their assigned doctor's sub-queue within the shared waiting room. They do not jump ahead of other doctors' urgent patients.

---

## New Hooks & State

### `useScheduleView` (revised)

```typescript
function useScheduleView(
  queue: QueueEntry[],
  doctors: Doctor[],
  slots: ScheduleSlot[],        // NEW: includes regulation slots
  graceMinutes: number,
  doctoLibImported: boolean     // NEW: flag for Doctolib data
) {
  return {
    namedSlots,           // QueueEntry[] with appointmentTime
    regulationSlots,      // ScheduleSlot[] of type 'regulation'
    walkIns,              // QueueEntry[] without appointmentTime
    noShowCandidates,     // Expected entries past grace period
    delayByDoctor,        // Map<doctorId, delayMinutes>
    doctorStatuses,       // Map<doctorId, DoctorState>
    importStatus,         // 'none' | 'pending' | 'imported'
  };
}
```

### `useWaitingRoom` (new — replaces doctor filter)

```typescript
// Replaces useDoctorFilter. Default view is all patients.
// Doctor filter is a secondary, optional override.
function useWaitingRoom(queue: QueueEntry[], doctors: Doctor[]) {
  return {
    allPatients,           // Full room, sorted by: urgent first, then wait time
    byDoctor,              // Map<doctorId, QueueEntry[]> for per-doctor views
    activeDoctorFilter,    // string | null — null means "show all" (default)
    setDoctorFilter,       // Only used for large practices with separate rooms
    patientsByPriority,    // urgent patients surfaced at top of their doctor queue
  };
}
```

### `useDoctorActions` (new)

```typescript
function useDoctorActions(doctorId: string) {
  return {
    callNext,              // Call next patient for this specific doctor
    markAbsent,            // Open absence workflow modal
    notifyDelay,           // Send delay notification to this doctor's waiting patients
    togglePause,
    setHomeVisit,          // Mark as on home visit with ETA
  };
}
```

### `usePatientActions` (new)

```typescript
function usePatientActions(patientId: string) {
  return {
    markUrgent,            // Set priority = 'urgent'
    transferToDoctor,      // Open ASTransferPatientSheet
    markNoShow,
    callIn,                // "Appeler le patient" — update status to consulting
    markDone,
  };
}
```

### Modifications to `useDashboard.ts`

Add:
- `doctors: Doctor[]` with fetch on mount from `/api/clinic/doctors`
- `handleMarkNoShow(id)`
- `handleMarkDoctorAbsent(doctorId, options: AbsenceOptions)`
- `handleTransferPatient(patientId, targetDoctorId)`
- `handleMarkUrgent(patientId)`
- `handleNotifyDelay(doctorId)` — broadcasts delay notification to this doctor's waiting patients
- Expose `scheduleSlots` (regulation + named) in return value

---

## Backend Changes

### 1. Schedule Slots Table (Phase 2)

```prisma
model ScheduleSlot {
  id          String     @id @default(cuid())
  clinicId    String
  doctorId    String
  date        DateTime
  startTime   DateTime
  endTime     DateTime
  slotType    SlotType   @default(named)
  patientId   String?    // null for regulation slots
  doctoLibId  String?    // Doctolib booking reference if imported
  
  clinic      Clinic     @relation(fields: [clinicId], references: [id])
  doctor      Doctor     @relation(fields: [doctorId], references: [id])
  patient     QueueEntry? @relation(fields: [patientId], references: [id])
}

enum SlotType {
  named
  regulation
  unplanned
}
```

### 2. Add Fields to QueueEntry

```prisma
model QueueEntry {
  // ... existing fields ...
  doctorId    String?
  priority    Priority  @default(normal)
  isUrgent    Boolean   @default(false)
  slotId      String?   // links to ScheduleSlot if from named appointment
  
  doctor      Doctor?   @relation(fields: [doctorId], references: [id])
  slot        ScheduleSlot? @relation(fields: [slotId], references: [id])
}

enum Priority {
  normal
  urgent
}
```

### 3. Doctor Model Extensions

```prisma
model Doctor {
  // ... existing fields ...
  state           DoctorState  @default(inactive)
  stateUpdatedAt  DateTime?
  homeVisitETA    DateTime?    // for home_visit state
  colorToken      String       // e.g. "blue", "teal", "amber" — drives UI badge color
}

enum DoctorState {
  consulting
  free
  pause
  absent_today
  home_visit
  inactive
}
```

### 4. New API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/clinic/doctors/:id/state` | Update doctor state (consulting / free / pause / absent / home_visit) |
| `POST` | `/api/clinic/doctors/:id/absence` | Trigger absence workflow — close slots, optionally reassign patients |
| `POST` | `/api/queue/:id/transfer` | Transfer patient to a different doctor's queue |
| `POST` | `/api/queue/:id/urgent` | Toggle patient urgency flag |
| `POST` | `/api/clinic/notify-delay` | Send delay notification to all waiting patients of a given doctor |
| `GET` | `/api/clinic/schedule/today` | Fetch today's named + regulation slots (optionally from Doctolib import) |
| `POST` | `/api/clinic/schedule/import-doctolib` | Phase 2: Import today's appointments from Doctolib |

### 5. Add to Existing Endpoints

`POST /api/queue/add` — Add to Zod schema:
- `doctorId?: string`
- `isUrgent?: boolean`
- `slotId?: string`

`apps/web/src/types/index.ts` — Add to `AddPatientData`:
- `doctorId?: string`
- `isUrgent?: boolean`
- `slotId?: string`

### 6. Socket Events (New)

| Event | Payload | Direction |
|---|---|---|
| `doctor:state` | `{ doctorId, state, eta? }` | server → client |
| `patient:urgent` | `{ patientId, isUrgent }` | server → client |
| `patient:transferred` | `{ patientId, fromDoctorId, toDoctorId }` | server → client |
| `delay:notified` | `{ doctorId, delayMinutes }` | server → client |

---

## Design Tokens (ausuivant.css additions)

```css
/* Schedule slot status */
--slot-expected:   #9C9690;   /* gray — not yet arrived */
--slot-arrived:    #1B6B4A;   /* green — checked in */
--slot-consulting: #2C5F8A;   /* blue — in consultation */
--slot-completed:  #6B6560;   /* muted — done */
--slot-noshow:     #C0392B;   /* red — absent */
--slot-late:       #C4841D;   /* amber — past time, within grace */
--slot-regulation: #D4CFC8;   /* light gray — créneau libre */

/* Per-doctor color system (6 tokens, assigned on doctor creation) */
--doctor-blue:     #2C5F8A;
--doctor-teal:     #0F7B6C;
--doctor-amber:    #C4841D;
--doctor-plum:     #7B4FA0;
--doctor-rose:     #B04060;
--doctor-slate:    #4A5568;

/* Desktop grid */
--column-schedule:  360px;
--column-detail:    0px;       /* No persistent detail column */
--drawer-detail:    360px;     /* Detail drawer width */
--row-patient:       56px;
--row-slot:          72px;
--doctor-pill-h:     36px;

/* Remove max-width on desktop, keep on mobile */
```

---

## Implementation Phases

### Phase 1: Foundation — Full Room View (2–3 weeks)

The first deliverable is a flat upgrade to the existing single-column dashboard. No schedule view, no multi-doctor, but a significantly better waiting room.

**Build:**
- `useWaitingRoom` hook (replaces `useDoctorFilter` — default is all patients, no filter)
- `ASDailyKPIStrip` (replaces `ASHeroMetrics`)
- `ASPatientRow` with:
  - Doctor color badge (initial + color dot)
  - Visible action buttons: Call In | Done | ⚡ Urgent | ⋮ Menu
  - No swipe gestures on desktop
- `ASWaitingRoom` container (replaces `ASQueueSection`)
- `ASQuickActionBar` with `[+ Patient]` and `[▸ Suivant…]`
- `ASCallNextSheet` — bottom sheet asking "Pour quel médecin ?" (even in single-doctor mode, structure is correct)
- `ASUrgencyFlag` — visual + `handleMarkUrgent` action
- Backend: add `doctorId`, `isUrgent` to `AddPatientInput` and Zod schema

**Wire into:** existing `AuSuivantDashboard` as a flat drop-in. Still single-column, still mobile-only, but now with doctor badges, urgency, and correct "call next" pattern.

**Verification:** Patient rows show doctor initial badge. Urgent flag floats patient to top of their doctor's sub-section. "Suivant" always asks which doctor.

---

### Phase 2: Schedule View + Doctolib Position (2–3 weeks)

Build the timeline and take a definitive position on external booking systems.

**Build:**
- `ScheduleSlot` model (Prisma migration)
- `GET /api/clinic/schedule/today` endpoint
- `ASScheduleTimeline` with three slot types:
  - Named slot: patient name + status dot
  - Regulation slot: `──── Créneau libre ──── [Affecter]`
  - Unplanned: walk-in that was inserted outside any slot
- `ASScheduleSlot` component
- `ASNoShowBanner` — grouped by doctor, bulk "Marquer absent" action
- `ASDoctoLibImportBanner` — one-time prompt on first load with no schedule data
- `useScheduleView` hook
- Backend: `POST /api/clinic/schedule/import-doctolib` (stub if Doctolib API not yet available — return 501 with clear error message)

**Decision gate:** Before merging Phase 2, the team must define:
- A: Doctolib API read access obtained → import live
- B: No API access → manual "Saisie des créneaux du jour" flow in the add-patient sheet
- C: Clinic not on Doctolib → free-form timeline with manual entries

The feature ships with all three paths handled.

**Verification:** Timeline shows named + regulation slots. No-show banner appears for expected patients >15min past slot time. Doctolib import banner shows on fresh install.

---

### Phase 3: Multi-Doctor + Mobile (3–4 weeks)

Combine multi-doctor infrastructure with production-quality mobile. **Mobile ships in this phase, not Phase 5.**

**Build:**
- `ASDoctorStatusBar` with extended state pills: `En consult +15min` / `Libre` / `Pause` / `Absent` / `Visite domicile (retour 11h30)`
- Per-pill inline `▸ Appeler` action (calls next patient **for this specific doctor only**)
- `ASDoctorActionPanel` — slide-down from pill, contains:
  - Call next patient
  - Mark absent (opens `ASDoctorAbsenceModal`)
  - Notify delay (opens `ASDelayNotifyAction`)
  - Set home visit with ETA
  - Toggle pause
- `ASDoctorAbsenceModal` — 3-option workflow:
  1. Close all remaining slots (patients notified)
  2. Redistribute patients to available doctors
  3. Keep slots open (another doctor covers)
- `ASDelayNotifyAction` — composable message with delay minutes pre-filled: "Dr. Martin a un retard de ~20 minutes"
- `ASTransferPatientSheet` — select target doctor + confirm
- Doctor color token system — assigned on doctor creation, drives badge color across all components
- `usePatientActions` + `useDoctorActions` hooks
- `ASMobileLayout` with:
  - Scrollable doctor pills row (compact)
  - "Salle d'attente" as default tab, "Agenda" as second tab
  - Fixed bottom `ASQuickActionBar`
  - `ASCallNextSheet` identical to desktop
- Doctor model extensions (Prisma migration): `state`, `stateUpdatedAt`, `homeVisitETA`, `colorToken`
- All new socket events: `doctor:state`, `patient:urgent`, `patient:transferred`, `delay:notified`
- Backend: `POST /api/clinic/doctors/:id/state`, `/absence`, `POST /api/queue/:id/transfer`, `/urgent`, `/notify-delay`

**Verification:** 
- Add 2+ doctors. Doctor status bar shows all doctors with correct states.
- Marking Dr. Martin absent prompts the absence workflow.
- "Appeler suivant" on Dr. Martin's pill calls next patient for Martin only.
- Transfer patient from Martin to Leroy — row updates in real time.
- Mobile: Salle d'attente tab is default with all patients. Agenda tab shows timeline.

---

### Phase 4: Desktop 2-Column Layout (2 weeks)

Promote the desktop to its full layout now that all data and state are correct.

**Build:**
- `ASDesktopLayout` — 2-column CSS grid: `360px | flex-1`
- Left column: `ASScheduleTimeline`
- Right column: `ASWaitingRoom` + `ASDoctorStatusBar` above it
- `ASPatientDetailDrawer` — slides in from the right over the layout (not a persistent column):
  - Triggered by clicking any patient row
  - Shows: appointment info, wait time, doctor assigned, urgency, notes, actions
  - Dismisses on Escape or outside click
- Keyboard shortcuts: `N` = call next (opens sheet), `A` = add patient, `Esc` = close drawer, `U` = mark selected patient urgent
- `ASTopbar` update: doctor status pills inline at right of topbar (compact version of status bar for nav-level visibility)
- `DashboardPage.tsx` routing:
  - `variant === 'schedule'` + lg+ → `ASDesktopLayout`
  - `variant === 'schedule'` + <lg → `ASMobileLayout` (from Phase 3)

**Verification:** 3-column appearance (timeline + queue + open drawer) achieved via 2-column layout + overlay drawer. Doctor pills visible in topbar. Keyboard shortcuts functional on desktop.

---

### Phase 5: Polish + Empty States (1 week)

**Build:**
- Staggered fade-up animation for patient rows on mount
- Smooth tab transitions (mobile)
- Per-section empty states:
  - Waiting room empty: "Aucun patient en salle d'attente"
  - Timeline empty without Doctolib: prompt to add regulation slots or import
  - All doctors absent: clear "Cabinet fermé pour la session" state
- `ASDelayNotifyAction` — refine message template, add "Envoyer à tous" vs. "Envoyer aux patients de Dr. X"
- `ASNoShowBanner` — auto-dismiss after 30 min if all no-shows actioned
- Remove all deprecated components: `ASHeroMetrics`, `ASSessionControls`, `ASCallNextButton`, `ASConsultationBar`, `ASQueueSection`, `ASQueueCard`, `ASFAB`
- Accessibility audit: all interactive elements keyboard-navigable, ARIA labels on doctor state pills

---

## Doctor Color System

Doctors are assigned one of 6 color tokens on creation. This token drives:
- The colored initial badge on every patient row in `ASWaitingRoom`
- The color of the doctor's pill in `ASDoctorStatusBar`
- The left-border accent on timeline slots in `ASScheduleTimeline`
- The header color in `ASPatientDetailDrawer`

This ensures that in a room with 4 doctors, the receptionist can identify at a glance which patients belong to which doctor without reading names.

```typescript
const DOCTOR_COLORS: DoctorColorToken[] = [
  'blue', 'teal', 'amber', 'plum', 'rose', 'slate'
];
// Assigned round-robin or chosen in doctor settings
```

---

## Key Interaction Patterns

### "Call Next" Flow (Multi-Doctor)

1. Receptionist clicks `[▸ Suivant…]` in bottom bar (or presses `N`)
2. `ASCallNextSheet` opens showing available doctors: `Dr. Martin (3 en attente)` / `Dr. Leroy (libre — 2 en attente)`
3. Receptionist selects a doctor
4. Next patient for that doctor is highlighted + announced
5. Doctor's state updates to `consulting` via `PATCH /api/clinic/doctors/:id/state`

Alternative: Doctor pill inline action `▸ Appeler` skips the sheet and calls next directly for that doctor.

### Doctor Absence Flow

1. Receptionist clicks Dr. Ngo's pill → `ASDoctorActionPanel` opens
2. Clicks "Marquer absent aujourd'hui"
3. `ASDoctorAbsenceModal` opens showing:
   - Ngo has 6 remaining scheduled patients today
   - Option A: "Fermer les créneaux" (mark slots as cancelled, patients notified if notification enabled)
   - Option B: "Réaffecter aux médecins disponibles" (distribute among present doctors)
   - Option C: "Laisser ouverts" (another doctor will cover informally)
4. Ngo's pill turns gray with `✕ Absent` state
5. If Option B chosen, affected patient rows update with new doctor badge color

### Urgency Flow

1. Patient arrives claiming severe pain
2. Receptionist clicks `⚡` icon on patient row (or in Add Patient sheet)
3. Patient row gets red `⚡ Urgent` badge
4. Patient rises to top of their assigned doctor's section in `ASWaitingRoom`
5. Doctor's next-patient indicator reflects the urgent patient
6. Socket event `patient:urgent` broadcasts to all connected sessions

### Inter-Doctor Transfer

1. Patient in Dr. Martin's queue needs to see Dr. Ngo instead
2. Receptionist clicks `⋮` menu on patient row → "Transférer vers..."
3. `ASTransferPatientSheet` opens: list of available doctors with queue lengths
4. Select Dr. Ngo → confirm
5. Patient row badge color changes from Martin-blue to Ngo-teal in real time
6. Socket event `patient:transferred` updates all connected sessions

### Delay Notification

1. `ASDoctorStatusBar` detects Dr. Martin's delay > 10 min (configurable threshold)
2. Pill shows `● Martin En consult +15min ⚠ Prévenir`
3. Receptionist clicks `⚠ Prévenir`
4. `ASDelayNotifyAction` opens with pre-filled message: "Dr. Martin est actuellement en retard d'environ 15 minutes. Merci de votre patience."
5. Receptionist confirms → `POST /api/clinic/notify-delay` sends notification to all patients waiting for Martin
6. Pill shows `✓ Patients prévenus`

---

## BleSaf Isolation

`variant: 'receptionist'` remains unchanged. BleSaf continues to use:
- Mobile: `ReceptionistDashboard`
- Desktop: `DesktopDashboard`
- Zero contact with any AuSuivant components

The `variant: 'compact'` rename to `variant: 'schedule'` in `brand.ts` is still required, as in the original spec.

---

## Brand Config Change

```typescript
// apps/web/src/lib/brand.ts
dashboard: {
  variant: 'schedule',   // was 'compact'
}
```

```typescript
// apps/web/src/pages/DashboardPage.tsx
// Mobile (<lg): variant === 'schedule' → ASMobileLayout (Phase 3+)
// Desktop (lg+): variant === 'schedule' → ASDesktopLayout (Phase 4+)
// Fallback during Phases 1–2: AuSuivantDashboard (rewritten, still single-column)
```

---

## Key Files to Modify

| File | Change |
|---|---|
| `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx` | Rewrite as responsive shell |
| `apps/web/src/components/ausuivant/ausuivant.css` | Extend with all new tokens; remove desktop max-width |
| `apps/web/src/pages/DashboardPage.tsx` | Route France desktop to ASDesktopLayout (Phase 4) |
| `apps/web/src/lib/brand.ts` | Rename variant compact → schedule |
| `apps/web/src/hooks/useDashboard.ts` | Add doctor fetching, all new action handlers |
| `apps/web/src/hooks/useWaitingRoom.ts` | New — replaces useDoctorFilter |
| `apps/web/src/hooks/useScheduleView.ts` | New |
| `apps/web/src/hooks/useDoctorActions.ts` | New |
| `apps/web/src/hooks/usePatientActions.ts` | New |
| `apps/api/src/services/queueService.ts` | Add doctorId, isUrgent, slotId to AddPatientInput; add transfer + urgent handlers |
| `apps/api/src/services/doctorService.ts` | New — state management, absence workflow, delay notification |
| `apps/api/src/services/scheduleService.ts` | New — slot CRUD, Doctolib import stub |
| `apps/api/src/routes/queue.ts` | Add doctorId, isUrgent, slotId to Zod; add transfer + urgent routes |
| `apps/api/src/routes/doctors.ts` | New — state, absence, notify-delay endpoints |
| `apps/api/src/routes/schedule.ts` | New — today's slots, import endpoint |
| `apps/web/src/types/index.ts` | Add doctorId, isUrgent, slotId to AddPatientData; add DoctorState, SlotType, Priority enums |
| `prisma/schema.prisma` | Add ScheduleSlot model; extend Doctor, QueueEntry |

---

## Verification Checklist

### Phase 1
- [ ] Patient rows show doctor initial badge in correct color
- [ ] Urgent flag floats patient to top of their doctor's sub-section
- [ ] "Suivant…" button always opens a doctor-selection sheet, never calls globally
- [ ] All patient actions are visible buttons, no swipe gestures on desktop

### Phase 2
- [ ] Timeline shows all three slot types with distinct visual treatment
- [ ] Regulation slots show "Affecter" CTA
- [ ] No-show banner appears for expected patients past grace period
- [ ] Doctolib import banner shown on first load with no schedule data

### Phase 3
- [ ] Doctor status bar shows all active doctors with extended state types
- [ ] Absence workflow correctly closes/redistributes slots
- [ ] Delay notification sends to correct doctor's patients only
- [ ] Patient transfer updates badge color in real time via socket
- [ ] Mobile "Salle d'attente" is default tab
- [ ] All mobile actions functional without swipe

### Phase 4
- [ ] Desktop 2-column grid renders correctly at lg+
- [ ] Patient detail drawer slides in on row click without disturbing layout
- [ ] Doctor pills visible in topbar at all times
- [ ] Keyboard shortcuts functional: N, A, Esc, U

### BleSaf regression
- [ ] BleSaf brand config shows ReceptionistDashboard (mobile) and DesktopDashboard (desktop)
- [ ] Zero AuSuivant components rendered in BleSaf mode
- [ ] All existing BleSaf tests pass
