# AuSuivant Phases 2-5: Implementation Plan

**Prerequisite:** Phase 1 (Foundation — Full Room View) is complete.
**Plan source:** `.claude/plans/spicy-sniffing-quill.md` (original design spec)
**Phase 1 reference:** `docs/technical/ausuivant-phase1-implementation.md`

---

## Table of Contents

1. [Phase 2: Schedule View + Doctolib Position](#phase-2-schedule-view--doctolib-position)
2. [Phase 3: Multi-Doctor Infrastructure + Mobile](#phase-3-multi-doctor-infrastructure--mobile)
3. [Phase 4: Desktop 2-Column Layout](#phase-4-desktop-2-column-layout)
4. [Phase 5: Polish + Cleanup](#phase-5-polish--cleanup)
5. [Cross-Phase: Data Model Changes](#cross-phase-data-model-changes)
6. [Cross-Phase: Socket Events](#cross-phase-socket-events)
7. [Cross-Phase: API Endpoints](#cross-phase-api-endpoints)

---

## Phase 2: Schedule View + Doctolib Position

### Goal

Build the appointment timeline and take a definitive position on Doctolib (France's dominant booking platform) coexistence. Add regulation slot configuration so the timeline has real value from day one.

**Core principle:** AuSuivant is the **waiting room layer**, not the booking layer. Doctolib owns appointment booking. AuSuivant owns what happens after the patient walks through the door.

### Tasks

#### 2.1 — ScheduleSlot Prisma Model (Migration)

Create a new `ScheduleSlot` model to represent today's appointment slots.

**File:** `apps/api/prisma/schema.prisma`

```prisma
model ScheduleSlot {
  id          String    @id @default(cuid())
  clinicId    String
  doctorId    String
  date        DateTime  @db.Date
  startTime   DateTime
  endTime     DateTime
  slotType    SlotType  @default(named)
  patientId   String?
  doctoLibId  String?   // External booking reference for future import

  clinic      Clinic    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  doctor      Doctor    @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patient     QueueEntry? @relation(fields: [patientId], references: [id], onDelete: SetNull)

  @@index([clinicId, date])
  @@index([doctorId, date])
}

enum SlotType {
  named
  regulation
  unplanned
}
```

**Also add to QueueEntry:**
```prisma
slotId    String?     // FK to ScheduleSlot (null = walk-in)
```

**Migration command:**
```bash
cd apps/api && npx prisma migrate dev --name add-schedule-slots
```

**Relations to add:**
- `Doctor` model: add `scheduleSlots ScheduleSlot[]`
- `Clinic` model: add `scheduleSlots ScheduleSlot[]`

#### 2.2 — Schedule API Endpoint

**File:** `apps/api/src/routes/schedule.ts` (NEW)

```
GET  /api/clinic/schedule/today     — Fetch today's named + regulation slots
POST /api/clinic/schedule/import-doctolib — Phase 2 stub: returns 501
```

**File:** `apps/api/src/services/scheduleService.ts` (NEW)

Functions:
- `getTodaySlots(clinicId: string)` — Returns all slots for today, joined with QueueEntry if linked
- `createRegulationSlots(clinicId: string, doctorId: string, config: RegulationConfig)` — Auto-generates buffer slots based on doctor's working hours + regulation config
- `linkPatientToSlot(slotId: string, queueEntryId: string)` — Links a walk-in to a regulation slot
- `importFromDoctolib(clinicId: string)` — Stub, returns 501

**Regulation config per doctor** (stored on Doctor or a new config table):
```typescript
interface RegulationConfig {
  slotsPerHour: number;   // default: 1
  slotDurationMins: number; // default: 15
}
```

#### 2.3 — ASScheduleTimeline Component

**File:** `apps/web/src/components/ausuivant/ASScheduleTimeline.tsx` (NEW)

Left-column timeline showing today's slots in chronological order. Three visual treatments:

| Slot Type | Visual | Status Indicators |
|-----------|--------|-------------------|
| **Named RDV** | Solid card, patient name, appointment time | `expected` / `arrived` / `consulting` / `completed` / `noshow` / `late` |
| **Creneau de regulation** | Dashed outline, "Creneau libre" or patient name if filled | "Affecter" CTA when empty |
| **Non-programme** | Grouped at bottom as "Sans RDV" section | Ordered by arrival time |

**Props:**
```typescript
interface ASScheduleTimelineProps {
  slots: ScheduleSlot[];
  walkIns: QueueEntry[];
  onAssignToSlot: (slotId: string) => void; // Opens add-patient with slot pre-linked
  onPatientClick: (entryId: string) => void;
}
```

#### 2.4 — ASScheduleSlot Component

**File:** `apps/web/src/components/ausuivant/ASScheduleSlot.tsx` (NEW)

Single slot row in the timeline.

- Left border colored by doctor's color token
- Status dot (color-coded): expected (grey), arrived (green), consulting (blue), completed (muted), noshow (red), late (amber)
- Time display: `09:15` format
- Patient name or "Creneau libre" for regulation slots
- Actions: click to open patient detail, "Affecter" button for empty regulation slots

**Slot status colors (CSS tokens to add to `ausuivant.css`):**
```css
--slot-expected:   #9C9690;
--slot-arrived:    #1B6B4A;
--slot-consulting: #2C5F8A;
--slot-completed:  #6B6560;
--slot-noshow:     #C0392B;
--slot-late:       #C4841D;
--slot-regulation: #D4CFC8;
```

#### 2.5 — ASNoShowBanner Component

**File:** `apps/web/src/components/ausuivant/ASNoShowBanner.tsx` (NEW)

Orange alert banner appearing when patients are past their appointment time + grace period without checking in.

- Grouped by doctor: "Dr. Martin: Dupont (09:15), Leroy (09:30)"
- Bulk "Marquer absent" action per doctor
- Individual dismiss per patient

#### 2.6 — ASDoctolibImportBanner Component

**File:** `apps/web/src/components/ausuivant/ASDoctolibImportBanner.tsx` (NEW)

One-time prompt shown on first dashboard load when no schedule data exists for today.

Three options reflecting the decision gate:
- A: "Importer depuis Doctolib" (if API access obtained)
- B: "Saisir les creneaux du jour" (manual entry)
- C: "Continuer sans agenda" (dismiss)

Stores dismissal in `localStorage` with date key so it shows again the next day.

#### 2.7 — useScheduleView Hook

**File:** `apps/web/src/hooks/useScheduleView.ts` (NEW)

Pure derivation hook — no API calls, just transforms data from `useDashboard`.

```typescript
function useScheduleView(
  queue: QueueEntry[],
  doctors: Doctor[],
  slots: ScheduleSlot[],
  graceMinutes: number,
  doctolibImported: boolean
) {
  return {
    namedSlots,         // QueueEntry[] with appointmentTime
    regulationSlots,    // ScheduleSlot[] of type 'regulation'
    walkIns,            // QueueEntry[] without appointmentTime
    noShowCandidates,   // Expected entries past grace period
    delayByDoctor,      // Map<doctorId, delayMinutes>
    doctorStatuses,     // Map<doctorId, DoctorState> (derived from queue)
    importStatus,       // 'none' | 'pending' | 'imported'
  };
}
```

#### 2.8 — Regulation Slot Config in Settings

**File:** `apps/web/src/components/ausuivant/ASSettingsPanel.tsx` (MODIFY)

Add a "Creneaux de regulation" section per doctor:
- Number of buffer slots per hour (default: 1, range: 0-4)
- Slot duration (default: 15 min, options: 10/15/20/30)

Backend auto-generates regulation `ScheduleSlot` rows for today based on config + doctor's working hours from `clinicHours`.

#### 2.9 — Doctolib Import Stub

**File:** `apps/api/src/routes/schedule.ts`

```typescript
router.post('/import-doctolib', authMiddleware, async (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Doctolib import not yet available' }
  });
});
```

#### 2.10 — Decision Gate (Pre-Merge Requirement)

Before merging Phase 2, the team must define which path to take:

| Path | Condition | Implementation |
|------|-----------|----------------|
| **A** | Doctolib API read access obtained | Import live appointment data |
| **B** | No API access | Manual "Saisie des creneaux du jour" flow |
| **C** | Clinic not on Doctolib | Free-form timeline with manual entries |

**The spec never requires receptionists to enter appointments twice.**

### Phase 2 — Modified Files Summary

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `ScheduleSlot` model, `SlotType` enum, `slotId` on QueueEntry |
| `apps/api/src/routes/schedule.ts` | NEW — today's slots + import stub |
| `apps/api/src/services/scheduleService.ts` | NEW — slot CRUD, regulation generation |
| `apps/web/src/components/ausuivant/ASScheduleTimeline.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASScheduleSlot.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASNoShowBanner.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASDoctolibImportBanner.tsx` | NEW |
| `apps/web/src/hooks/useScheduleView.ts` | NEW |
| `apps/web/src/components/ausuivant/ASSettingsPanel.tsx` | Add regulation config |
| `apps/web/src/components/ausuivant/ASAddPatientSheet.tsx` | Add `slotId` linkage + `appointmentTime` pre-fill |
| `apps/web/src/components/ausuivant/ausuivant.css` | Add slot status color tokens |
| `apps/web/src/hooks/useDashboard.ts` | Fetch schedule slots, expose `scheduleSlots` |
| `apps/web/src/types/index.ts` | Add `ScheduleSlot`, `SlotType` types |

### Phase 2 — Verification Checklist

- [ ] Timeline shows all 3 slot types with distinct visual treatment
- [ ] Regulation slots show "Affecter" CTA that opens add-patient with slot pre-linked
- [ ] No-show banner appears per-doctor for patients past grace period
- [ ] Doctolib import banner shown on first load with no schedule data
- [ ] Dismissing Doctolib banner persists for the day (localStorage)
- [ ] Regulation slot configuration works in settings per doctor
- [ ] Walk-ins appear in "Sans RDV" overflow section at bottom of timeline
- [ ] Late arrivals show original appointment time with "arrived late" secondary text
- [ ] Slot type is immutable after creation (named stays named, regulation stays regulation)

---

## Phase 3: Multi-Doctor Infrastructure + Mobile

### Goal

Bundle the full multi-doctor state management with a production-quality mobile layout. This is the largest phase — it introduces doctor state machines, absence workflows, delay notifications, inter-doctor transfers, and the complete mobile shell.

### Prerequisite Schema Changes

**Doctor model extensions** (Prisma migration):

```prisma
model Doctor {
  // ... existing fields ...

  state             DoctorState  @default(inactive)
  stateUpdatedAt    DateTime?
  homeVisitETA      DateTime?
  colorToken        String       @default("blue")  // blue|teal|amber|plum|rose|slate

  // ... existing relations ...
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

**Migration:**
```bash
cd apps/api && npx prisma migrate dev --name add-doctor-state
```

**Backfill strategy:** All existing doctors get `state: 'inactive'`, `colorToken` assigned by creation order (first = "blue", second = "teal", etc.).

### Tasks

#### 3.1 — ASDoctorStatusBar Component

**File:** `apps/web/src/components/ausuivant/ASDoctorStatusBar.tsx` (NEW)

Horizontal scrollable strip of doctor pills. Each pill shows the doctor's current state at a glance.

```typescript
interface ASDoctorStatusBarProps {
  doctors: Doctor[];
  onDoctorClick: (doctorId: string) => void;
  onCallNextForDoctor: (doctorId: string) => void;
}
```

Scrollable on mobile (horizontal overflow), wraps on desktop.

#### 3.2 — ASDoctorPill Component

**File:** `apps/web/src/components/ausuivant/ASDoctorPill.tsx` (NEW)

Single doctor representation in the status bar.

**Visual states:**

| State | Color | Icon | Label | Actions |
|-------|-------|------|-------|---------|
| `consulting` | Doctor's color token | Pulse dot | "En consult +Xmin" | Inline [Suivant] |
| `free` | Doctor's color token | Check | "Libre" | Inline [Suivant] |
| `pause` | Muted | Pause | "Pause" | Click to resume |
| `absent_today` | Grey | X | "Absent" | "Gerer les creneaux" |
| `home_visit` | Blue | Home | "Visite — retour ~HHh" | None |
| `inactive` | Grey | Dash | Hidden by default | — |

**Inline [Suivant] button:** Visible on `consulting` and `free` states when patients are waiting. On larger screens, provides a direct per-doctor call-next without opening the sheet.

**Click behavior:** Opens `ASDoctorActionPanel` slide-down panel.

#### 3.3 — ASDoctorActionPanel Component

**File:** `apps/web/src/components/ausuivant/ASDoctorActionPanel.tsx` (NEW)

Slide-down panel that appears below a clicked doctor pill. Contains contextual actions:

- **Appeler le suivant** — Same as inline [Suivant], calls next for this doctor
- **Marquer absent aujourd'hui** — Opens `ASDoctorAbsenceModal`
- **Prevenir du retard** — Opens `ASDelayNotifyAction` (shown when delay > threshold)
- **Visite a domicile** — Mark doctor as on home visit, enter ETA
- **Pause / Reprendre** — Toggle pause state

#### 3.4 — ASDoctorAbsenceModal Component

**File:** `apps/web/src/components/ausuivant/ASDoctorAbsenceModal.tsx` (NEW)

3-option workflow triggered when marking a doctor absent:

**Option A: "Fermer les creneaux"**
- All remaining named slots for this doctor marked cancelled
- Regulation slots closed
- Patients with phone numbers receive notification (Socket.io primary, WhatsApp secondary)
- Patients without numbers surfaced in `ASNoShowBanner` for verbal notification

**Option B: "Reaffecter aux medecins disponibles"**
- "Available" = doctors in `free`, `consulting`, or `pause` state (NOT `absent_today`, `home_visit`, `inactive`)
- Distribution: queue-length-balanced (assign to doctor with fewest WAITING entries)
- Named RDV patients keep original appointment time in target queue
- Walk-ins appended at end of target queue
- **Preview before confirming:** "3 patients vers Dr. Martin, 2 vers Dr. Leroy — Confirmer?"
- Manual override available per patient before confirming

**Option C: "Laisser ouverts"**
- Slots remain, another doctor covers informally
- Doctor pill shows "Absent (couvert)"

#### 3.5 — ASDelayNotifyAction Component

**File:** `apps/web/src/components/ausuivant/ASDelayNotifyAction.tsx` (NEW)

Pre-filled delay message with multi-path delivery:

```
"Dr. Martin est actuellement en retard d'environ 15 minutes."
```

**Delivery channels (per-patient priority):**

| Channel | Condition | Cost |
|---------|-----------|------|
| Socket.io status page | Patient checked in via QR/link, has live connection | Free |
| WhatsApp notification | Patient has phone number on file | Per-message |
| Verbal (receptionist) | No phone, not on status page — surfaced as "non-joignables" | Free |

Backend endpoint: `POST /api/clinic/notify-delay` iterates waiting patients for the doctor and dispatches via best available channel.

After sending, pill shows "Patients prevenus" confirmation.

#### 3.6 — ASTransferPatientSheet Component

**File:** `apps/web/src/components/ausuivant/ASTransferPatientSheet.tsx` (NEW)

Bottom sheet for inter-doctor patient transfer:
- Shows available doctors with current queue lengths
- Select target doctor, confirm transfer
- Badge color changes in real time via socket

**Backend:** `POST /api/queue/:id/transfer` — updates `doctorId`, emits `patient:transferred` socket event.

#### 3.7 — useDoctorActions Hook

**File:** `apps/web/src/hooks/useDoctorActions.ts` (NEW)

```typescript
function useDoctorActions(doctorId: string) {
  return {
    callNext,         // Call next patient for this specific doctor
    markAbsent,       // Open absence workflow (returns absence options)
    notifyDelay,      // Send delay notification
    togglePause,      // Toggle pause state
    setHomeVisit,     // Mark as on home visit with ETA
  };
}
```

Sources API client from singleton `api` import. Socket client via `useSocket` for real-time event emission.

#### 3.8 — usePatientActions Hook

**File:** `apps/web/src/hooks/usePatientActions.ts` (NEW)

```typescript
function usePatientActions(patientId: string) {
  return {
    markUrgent,          // Set priority = 'urgent'
    transferToDoctor,    // Update doctorId
    markNoShow,          // Set status = NO_SHOW
    callIn,              // Set status = IN_CONSULTATION
    markDone,            // Set status = COMPLETED
  };
}
```

#### 3.9 — Backend: Doctor State Management

**File:** `apps/api/src/routes/doctor.ts` (MODIFY — add new endpoints)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/clinic/doctors/:id/state` | Update doctor state (consulting/free/pause/absent/home_visit/inactive) |
| `POST` | `/api/clinic/doctors/:id/absence` | Trigger absence workflow (close/reassign/keep open) |

**File:** `apps/api/src/services/doctorService.ts` (MODIFY)

Add functions:
- `updateDoctorState(clinicId, doctorId, state, opts?)` — Validates state transitions, updates DB, emits socket event
- `handleAbsence(clinicId, doctorId, option: 'close' | 'reassign' | 'keep')` — Executes the chosen absence workflow
- `reassignPatients(clinicId, fromDoctorId)` — Queue-length-balanced redistribution with preview

#### 3.10 — Backend: Transfer + Delay Endpoints

**File:** `apps/api/src/routes/queue.ts` (MODIFY)

```
POST /api/queue/:id/transfer    — Transfer patient to different doctor
  Body: { targetDoctorId: string }
```

**File:** `apps/api/src/routes/clinic.ts` (MODIFY)

```
POST /api/clinic/notify-delay   — Send delay notification to doctor's waiting patients
  Body: { doctorId: string, message?: string }
```

#### 3.11 — Socket Events (All New)

| Event | Payload | Direction |
|-------|---------|-----------|
| `doctor:state` | `{ doctorId, state, eta? }` | server -> client |
| `patient:urgent` | `{ patientId, isUrgent }` | server -> client |
| `patient:transferred` | `{ patientId, fromDoctorId, toDoctorId }` | server -> client |
| `delay:notified` | `{ doctorId, delayMinutes }` | server -> client |

**File:** `apps/api/src/lib/socket.ts` (MODIFY) — Add emit helpers for new events.

#### 3.12 — ASMobileLayout Component

**File:** `apps/web/src/components/ausuivant/ASMobileLayout.tsx` (NEW)

Complete mobile shell with:

```
+-------------------------------+
| [Logo]  [Clinic]   [gear]     |
+-------------------------------+
| [* Martin +15] [o Leroy]      |  <- Scrollable doctor pills
+-------------------------------+
| 12 att. | 8 vus | attente 18m |  <- KPI strip (compact)
+-------------------------------+
| [ Salle d'attente ] [ Agenda ]|  <- Tab bar (Salle is default)
+-------------------------------+
|                                |
| Patient list OR Timeline       |  <- Depends on active tab
|                                |
+-------------------------------+
| [+ Patient]  [> Suivant...]   |  <- Fixed bottom bar
+-------------------------------+
```

- Default tab: "Salle d'attente" (waiting room)
- Second tab: "Agenda" (schedule timeline from Phase 2)
- Doctor pills scroll horizontally above KPI strip

#### 3.13 — ASPatientDetailDrawer (Mobile Variant)

**File:** `apps/web/src/components/ausuivant/ASPatientDetailDrawer.tsx` (NEW)

Bottom sheet on mobile, opened by tapping a patient row. Contains:
- Full patient info (name, phone, arrival time, appointment time)
- Doctor assignment with transfer option
- All patient actions (urgent, transfer, no-show, call in, complete)
- Close on outside tap or swipe down

### Phase 3 — Modified Files Summary

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Doctor: `state`, `stateUpdatedAt`, `homeVisitETA`, `colorToken` fields + `DoctorState` enum |
| `apps/api/src/routes/doctor.ts` | Add state + absence endpoints |
| `apps/api/src/routes/queue.ts` | Add transfer endpoint |
| `apps/api/src/routes/clinic.ts` | Add notify-delay endpoint |
| `apps/api/src/services/doctorService.ts` | Add state management, absence workflow, reassignment |
| `apps/api/src/lib/socket.ts` | Add emit helpers for 4 new events |
| `apps/web/src/components/ausuivant/ASDoctorStatusBar.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASDoctorPill.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASDoctorActionPanel.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASDoctorAbsenceModal.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASDelayNotifyAction.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASTransferPatientSheet.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASMobileLayout.tsx` | NEW |
| `apps/web/src/components/ausuivant/ASPatientDetailDrawer.tsx` | NEW |
| `apps/web/src/hooks/useDoctorActions.ts` | NEW |
| `apps/web/src/hooks/usePatientActions.ts` | NEW |
| `apps/web/src/hooks/useDashboard.ts` | Add doctor state handling, transfer, delay notification |
| `apps/web/src/types/index.ts` | Add `DoctorState` type, extend `Doctor` interface with state fields |
| `apps/web/src/lib/api.ts` | Add doctor state, absence, transfer, delay API methods |
| `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx` | Wire mobile layout, doctor status bar |

### Phase 3 — Verification Checklist

- [ ] Doctor status bar shows all doctors with 6-state visual treatments
- [ ] Clicking a doctor pill opens the action panel
- [ ] Absence workflow correctly executes all 3 options (close/reassign/keep)
- [ ] Reassignment preview shows patient distribution before confirming
- [ ] Delay notification sends to correct doctor's patients only (multi-path delivery)
- [ ] Patient transfer updates badge color in real time via socket
- [ ] `doctor:state` socket events received by all connected dashboards
- [ ] Mobile "Salle d'attente" is default tab
- [ ] "Agenda" tab shows Phase 2 timeline
- [ ] [Suivant...] bottom-bar button opens doctor picker sheet
- [ ] Patient detail bottom sheet opens on row tap (mobile)
- [ ] Doctor color tokens persist across sessions (stored in DB)

---

## Phase 4: Desktop 2-Column Layout

### Goal

Full desktop layout with all data and state from Phases 1-3. Two columns, no persistent third column — patient detail opens as a slide-out drawer.

### Layout

```
+----------------------------------------------------------------+
| ASTopbar: [Logo]  [Clinic Name]              [gear] [Dr pills] |
+----------------------------------------------------------------+
| ASDailyKPIStrip: 12 attendus | 8 vus | attente 18min | 2 abs  |
+----------------------------------------------------------------+
| ASDoctorStatusBar:                                             |
| [* Martin En consult +15min > Appeler] [o Leroy Libre >]      |
| [~ Ngo Pause] [x Bernard Absent -- Gerer les creneaux]        |
+-----------------------------+----------------------------------+
| AGENDA (360px)              | SALLE D'ATTENTE (flex-1)         |
|                             |                                  |
| 09:00 [arrived] Dupont      | [+ Patient]  [Rechercher]        |
| 09:15 [waiting] Martin P.   |                                  |
| 09:30 [creneau libre] ----  | 1. [M] Dupont M.  09:00  14min  |
| 09:45 [arrived] Petit S.    | 2. [L] Martin P.  09:15   8min  |
| 10:00 [noshow!] Bernard L.  | 3. [M] Bernard    --:--  22min  |
| 10:15 [creneau libre] ----  |    ! Urgent                      |
| 10:30 [expected] Rousseau   | 4. [L] Petit S.   09:45   3min  |
|                             |                                  |
+-----------------------------+----------------------------------+
                         [Detail drawer slides from right on row click]
```

### Tasks

#### 4.1 — ASDesktopLayout Component

**File:** `apps/web/src/components/ausuivant/ASDesktopLayout.tsx` (NEW)

2-column CSS grid shell for `lg+` breakpoints.

```css
/* CSS grid tokens (add to ausuivant.css) */
--column-schedule:  360px;
--drawer-detail:    360px;
--row-patient:       56px;
--row-slot:          72px;
--doctor-pill-h:     36px;
```

```typescript
interface ASDesktopLayoutProps {
  // All data props passed through from DashboardPage
  clinic: Clinic;
  queue: QueueEntry[];
  stats: QueueStats;
  doctors: Doctor[];
  scheduleSlots: ScheduleSlot[];
  // ... action handlers
}
```

Grid structure:
```css
.as-desktop-grid {
  display: grid;
  grid-template-columns: var(--column-schedule) 1fr;
  gap: 0;
  min-height: calc(100dvh - topbar - kpi - statusbar);
}
```

Left column: `ASScheduleTimeline` (Phase 2)
Right column: `ASWaitingRoom` (Phase 1) with search bar and [+ Patient] button above

#### 4.2 — ASPatientDetailDrawer (Desktop Variant)

**File:** `apps/web/src/components/ausuivant/ASPatientDetailDrawer.tsx` (MODIFY)

Add desktop mode: slide-in drawer from the right edge, 360px wide.

- Opens on patient row click
- Closes on Esc, outside click, or close button
- Does NOT push the grid — overlays on top
- Contains same actions as mobile bottom sheet variant
- Smooth slide animation (200ms, ease-out)

Shared component with mobile — uses `useMediaQuery` or CSS to switch between bottom-sheet and side-drawer behavior.

#### 4.3 — ASTopbar Update (Desktop)

**File:** `apps/web/src/components/ausuivant/ASTopbar.tsx` (MODIFY)

On desktop (`lg+`), show doctor pills inline at the right side of the topbar. This provides at-a-glance doctor status without a separate status bar row.

On mobile, topbar stays as-is (pills are in the separate `ASDoctorStatusBar`).

#### 4.4 — DashboardPage Routing

**File:** `apps/web/src/pages/DashboardPage.tsx` (MODIFY)

```typescript
// <lg (mobile): ASMobileLayout (Phase 3)
// lg+ (desktop): ASDesktopLayout (Phase 4)
{webBrand.theme.dashboard.variant === 'schedule' ? (
  <>
    <div className="lg:hidden">
      <ASMobileLayout {...mobileProps} />
    </div>
    <div className="hidden lg:block">
      <ASDesktopLayout {...desktopProps} />
    </div>
  </>
) : (
  // BleSaf unchanged
)}
```

#### 4.5 — Keyboard Shortcuts

Add keyboard shortcuts for power-user receptionist workflow:

| Key | Action |
|-----|--------|
| `N` | Open call-next sheet (or call if single doctor) |
| `A` | Open add-patient modal |
| `Esc` | Close current drawer/sheet/modal |
| `U` | Toggle urgent on selected patient |

**Implementation:** `useEffect` with `keydown` listener in `ASDesktopLayout`, respecting focus state (don't trigger when typing in inputs).

### Phase 4 — Modified Files Summary

| File | Change |
|------|--------|
| `apps/web/src/components/ausuivant/ASDesktopLayout.tsx` | NEW — 2-column grid shell |
| `apps/web/src/components/ausuivant/ASPatientDetailDrawer.tsx` | MODIFY — add desktop slide-in variant |
| `apps/web/src/components/ausuivant/ASTopbar.tsx` | MODIFY — inline doctor pills on desktop |
| `apps/web/src/components/ausuivant/ausuivant.css` | Add grid tokens, desktop breakpoints, remove 430px max-width on desktop |
| `apps/web/src/pages/DashboardPage.tsx` | Route `schedule` variant + `lg+` to `ASDesktopLayout` |
| `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx` | May be refactored into ASMobileLayout or kept as wrapper |

### Phase 4 — Verification Checklist

- [ ] Desktop 2-column grid renders correctly at `lg+` breakpoint
- [ ] Left column (360px) shows schedule timeline
- [ ] Right column (flex-1) shows waiting room with search + add patient
- [ ] Detail drawer slides in from right on row click without disturbing grid
- [ ] Doctor pills visible in topbar on desktop
- [ ] Keyboard shortcuts: N (call next), A (add patient), Esc (close), U (urgent)
- [ ] Keyboard shortcuts don't fire when typing in input fields
- [ ] Mobile layout unchanged — still uses `ASMobileLayout`
- [ ] BleSaf desktop unchanged — still uses `DesktopDashboard`

---

## Phase 5: Polish + Cleanup

### Goal

Remove deprecated components, complete the `isEmergency` -> `priority` migration, add animations, empty states, accessibility, and advanced configuration UX.

### Tasks

#### 5.1 — Animations

- Staggered fade-up animations for patient rows on initial load and queue changes
- Smooth tab transitions between "Salle d'attente" and "Agenda" (mobile)
- Drawer open/close transitions (slide + fade)
- Doctor pill state change micro-animations (color transitions)

#### 5.2 — Empty States

Four distinct empty states:

| Condition | Visual |
|-----------|--------|
| No patients in queue | Smiley + "Aucun patient en attente" (already in Phase 1) |
| No doctors configured | Illustration + "Configurez vos medecins dans les parametres" |
| All patients seen for the day | Checkmark + "Tous les patients ont ete vus! Bonne journee." |
| Timeline empty (no Doctolib data) | Calendar icon + Doctolib import prompt |

#### 5.3 — Remove Deprecated Components

Delete these files entirely:

| File | Replaced By |
|------|------------|
| `apps/web/src/components/ausuivant/ASHeroMetrics.tsx` | `ASDailyKPIStrip` |
| `apps/web/src/components/ausuivant/ASSessionControls.tsx` | `ASDoctorStatusBar` |
| `apps/web/src/components/ausuivant/ASCallNextButton.tsx` | `ASQuickActionBar` + `ASCallNextSheet` |
| `apps/web/src/components/ausuivant/ASConsultationBar.tsx` | Integrated into `ASDoctorPill` |
| `apps/web/src/components/ausuivant/ASQueueSection.tsx` | `ASWaitingRoom` |
| `apps/web/src/components/ausuivant/ASQueueCard.tsx` | `ASPatientRow` |
| `apps/web/src/components/ausuivant/ASFAB.tsx` | `ASQuickActionBar` |

**Verify no imports remain before deleting.** Use `grep -r "ASHeroMetrics\|ASSessionControls\|ASCallNextButton\|ASConsultationBar\|ASQueueSection\|ASQueueCard\|ASFAB" apps/web/src/` to check.

#### 5.4 — Drop `isEmergency` Column

**Prisma migration:**

```bash
cd apps/api && npx prisma migrate dev --name drop-is-emergency
```

Remove from `QueueEntry`:
```diff
- isEmergency   Boolean       @default(false)
```

**Pre-migration checklist:**
- [ ] No backend code reads `isEmergency` (search: `isEmergency`)
- [ ] No frontend code reads `isEmergency` (search: `isEmergency`)
- [ ] All urgency logic uses `priority` enum
- [ ] `AddPatientData.isEmergency` removed from `apps/web/src/types/index.ts`
- [ ] `onEmergency` prop removed from all components

#### 5.5 — Advanced Regulation Slot Configuration

Enhance the basic Phase 2 regulation config with:
- Custom time ranges per slot (not just uniform hourly distribution)
- Drag-and-drop reordering of slots in settings
- Per-day configuration (different regulation patterns Mon-Fri)

#### 5.6 — Accessibility Audit

| Requirement | Component |
|-------------|-----------|
| Keyboard navigation for all interactive elements | All buttons, menus, sheets |
| ARIA labels on doctor state pills | `ASDoctorPill` — `aria-label="Dr. Martin, en consultation depuis 15 minutes"` |
| Screen reader announcements for state changes | `aria-live="polite"` region for queue updates |
| Focus trapping in modals/sheets | `ASCallNextSheet`, `ASDoctorAbsenceModal`, `ASPatientDetailDrawer` |
| Focus visible indicators | All clickable elements |
| Color contrast (WCAG AA) | All text on colored backgrounds |

#### 5.7 — Home Visit ETA Behavior

When `homeVisitETA` passes, the doctor state does **NOT** auto-revert to `free`. Instead:
- Pill shows "Retard visite" in amber when ETA is past
- Receptionist manually updates via "De retour" action in the action panel
- This prevents automated state changes that could confuse the receptionist

### Phase 5 — Modified Files Summary

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Remove `isEmergency` from QueueEntry |
| `apps/web/src/types/index.ts` | Remove `isEmergency` from `QueueEntry` and `AddPatientData` |
| `apps/web/src/components/ausuivant/ASHeroMetrics.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASSessionControls.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASCallNextButton.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASConsultationBar.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASQueueSection.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASQueueCard.tsx` | DELETE |
| `apps/web/src/components/ausuivant/ASFAB.tsx` | DELETE |
| Various components | Add ARIA labels, focus management, animations |
| `apps/web/src/components/ausuivant/ausuivant.css` | Animation keyframes, transitions |

### Phase 5 — Verification Checklist

- [ ] All 7 deprecated components deleted, no dangling imports
- [ ] `isEmergency` column dropped — migration applied, zero code references remain
- [ ] Empty states render correctly for all 4 conditions
- [ ] Animations: staggered fade-up, tab transitions, drawer slides
- [ ] Accessibility: all interactive elements keyboard-navigable
- [ ] ARIA labels on doctor state pills — screen reader reads state correctly
- [ ] No focus traps — Esc always closes the current overlay
- [ ] No console errors on first load without schedule data
- [ ] Home visit ETA past: pill shows "Retard visite", does not auto-revert
- [ ] Color contrast passes WCAG AA on all colored badges

---

## Cross-Phase: Data Model Changes

Summary of all schema changes across phases, relative to the current schema.

### Current State (Post-Phase 1)

```
Doctor: id, clinicId, name, specialty, isActive, avgConsultationMins
QueueEntry: ... priority Priority @default(normal) (added Phase 1)
```

### Phase 2 Additions

```prisma
// NEW model
model ScheduleSlot {
  id, clinicId, doctorId, date, startTime, endTime, slotType, patientId, doctoLibId
}

enum SlotType { named, regulation, unplanned }

// QueueEntry addition
slotId String?   // FK to ScheduleSlot
```

### Phase 3 Additions

```prisma
// Doctor additions
state             DoctorState  @default(inactive)
stateUpdatedAt    DateTime?
homeVisitETA      DateTime?
colorToken        String       @default("blue")

enum DoctorState { consulting, free, pause, absent_today, home_visit, inactive }
```

### Phase 5 Removals

```prisma
// QueueEntry removal
- isEmergency   Boolean  @default(false)
```

### Frontend Type Changes

**`apps/web/src/types/index.ts`:**

```typescript
// Phase 2: Add
export interface ScheduleSlot {
  id: string;
  clinicId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotType: 'named' | 'regulation' | 'unplanned';
  patientId: string | null;
  doctoLibId: string | null;
}

// Phase 3: Extend Doctor
export interface Doctor {
  // ... existing fields ...
  state: DoctorState;
  stateUpdatedAt: string | null;
  homeVisitETA: string | null;
  colorToken: string;
}

export type DoctorState = 'consulting' | 'free' | 'pause' | 'absent_today' | 'home_visit' | 'inactive';

// Phase 2: Extend AddPatientData
export interface AddPatientData {
  // ... existing fields ...
  slotId?: string;
}

// Phase 5: Remove from QueueEntry and AddPatientData
// - isEmergency
```

---

## Cross-Phase: Socket Events

All new socket events introduced across phases.

| Phase | Event | Payload | Direction |
|-------|-------|---------|-----------|
| 3 | `doctor:state` | `{ doctorId: string, state: DoctorState, eta?: string }` | server -> client |
| 3 | `patient:urgent` | `{ patientId: string, isUrgent: boolean }` | server -> client |
| 3 | `patient:transferred` | `{ patientId: string, fromDoctorId: string, toDoctorId: string }` | server -> client |
| 3 | `delay:notified` | `{ doctorId: string, delayMinutes: number }` | server -> client |

All events are emitted to the `clinic:{clinicId}` room so all connected dashboards receive them.

---

## Cross-Phase: API Endpoints

All new endpoints introduced across phases.

| Phase | Method | Path | Purpose |
|-------|--------|------|---------|
| 1 | `POST` | `/api/queue/:id/urgent` | Toggle patient urgency |
| 2 | `GET` | `/api/clinic/schedule/today` | Fetch today's slots |
| 2 | `POST` | `/api/clinic/schedule/import-doctolib` | Import stub (501) |
| 3 | `POST` | `/api/clinic/doctors/:id/state` | Update doctor state |
| 3 | `POST` | `/api/clinic/doctors/:id/absence` | Trigger absence workflow |
| 3 | `POST` | `/api/queue/:id/transfer` | Transfer patient to different doctor |
| 3 | `POST` | `/api/clinic/notify-delay` | Send delay notification |

**Modified existing endpoints:**

| Phase | Method | Path | Change |
|-------|--------|------|--------|
| 1 | `POST` | `/api/queue/next` | Added `?doctorId=` query param |
| 1 | `POST` | `/api/queue` | Added `doctorId`, `isUrgent` to body schema |
| 2 | `POST` | `/api/queue` | Added `slotId` to body schema |

---

## Component Inventory (Final State After Phase 5)

### Active Components

| Component | Introduced | Purpose |
|-----------|-----------|---------|
| `AuSuivantDashboard.tsx` | Phase 1 (rewritten) | Responsive shell routing to Mobile/Desktop |
| `ASTopbar.tsx` | Pre-existing (modified P4) | Top bar with logo, clinic name, settings, doctor pills (desktop) |
| `ASDailyKPIStrip.tsx` | Phase 1 | Compact metrics strip |
| `ASPatientRow.tsx` | Phase 1 | Patient row with badges and action menu |
| `ASWaitingRoom.tsx` | Phase 1 | Patient list container |
| `ASQuickActionBar.tsx` | Phase 1 | Fixed bottom bar [+ Patient] [Suivant] |
| `ASCallNextSheet.tsx` | Phase 1 (rewritten) | "Pour quel medecin?" bottom sheet |
| `ASAddPatientSheet.tsx` | Pre-existing (modified P2) | Add patient with doctor/slot/urgency fields |
| `ASSettingsPanel.tsx` | Pre-existing (modified P2) | Settings with regulation config |
| `ASScheduleTimeline.tsx` | Phase 2 | Appointment timeline (left column desktop, tab mobile) |
| `ASScheduleSlot.tsx` | Phase 2 | Single timeline slot |
| `ASNoShowBanner.tsx` | Phase 2 | No-show alert per doctor |
| `ASDoctolibImportBanner.tsx` | Phase 2 | One-time Doctolib prompt |
| `ASDoctorStatusBar.tsx` | Phase 3 | Horizontal doctor pill strip |
| `ASDoctorPill.tsx` | Phase 3 | Single doctor state pill |
| `ASDoctorActionPanel.tsx` | Phase 3 | Slide-down doctor action menu |
| `ASDoctorAbsenceModal.tsx` | Phase 3 | 3-option absence workflow |
| `ASDelayNotifyAction.tsx` | Phase 3 | Delay notification sender |
| `ASTransferPatientSheet.tsx` | Phase 3 | Inter-doctor transfer picker |
| `ASMobileLayout.tsx` | Phase 3 | Complete mobile shell with tabs |
| `ASPatientDetailDrawer.tsx` | Phase 3/4 | Patient detail (bottom sheet mobile, side drawer desktop) |
| `ASDesktopLayout.tsx` | Phase 4 | 2-column CSS grid desktop shell |
| `utils.ts` | Phase 1 | Shared utility functions |
| `ausuivant.css` | Pre-existing (modified all phases) | Design tokens and animations |

### Deleted Components (Phase 5)

| Component | Reason |
|-----------|--------|
| `ASHeroMetrics.tsx` | Replaced by `ASDailyKPIStrip` |
| `ASSessionControls.tsx` | Replaced by `ASDoctorStatusBar` |
| `ASCallNextButton.tsx` | Replaced by `ASQuickActionBar` |
| `ASConsultationBar.tsx` | Integrated into `ASDoctorPill` |
| `ASQueueSection.tsx` | Replaced by `ASWaitingRoom` |
| `ASQueueCard.tsx` | Replaced by `ASPatientRow` |
| `ASFAB.tsx` | Replaced by `ASQuickActionBar` |

### Hooks

| Hook | Phase | Purpose |
|------|-------|---------|
| `useWaitingRoom` | Phase 1 | Sort, group, filter patients |
| `useScheduleView` | Phase 2 | Derive timeline data from queue + slots |
| `useDoctorActions` | Phase 3 | Doctor state mutation API |
| `usePatientActions` | Phase 3 | Patient action mutation API |
| `useDashboard` | Pre-existing (modified P1-P3) | Main orchestration hook |

---

## BleSaf Regression Guard

Throughout all phases, BleSaf must remain completely unaffected:

- [ ] BleSaf shows `ReceptionistDashboard` (mobile) + `DesktopDashboard` (desktop)
- [ ] Zero AuSuivant-specific components rendered in BleSaf mode
- [ ] Brand routing in `DashboardPage.tsx` correctly gates on `variant === 'schedule'`
- [ ] All existing BleSaf tests pass
- [ ] No new CSS from `ausuivant.css` leaks into BleSaf (scoped to `.as-dashboard`)

Run after each phase:
```bash
VITE_BRAND=blesaf pnpm test:web
VITE_BRAND=france pnpm test:web
```

---

## Suggested Implementation Order Within Phases

### Phase 2 (recommended sub-order)
1. Schema migration (ScheduleSlot + slotId on QueueEntry)
2. `scheduleService.ts` backend
3. `GET /api/clinic/schedule/today` endpoint
4. `useScheduleView` hook
5. `ASScheduleSlot` component
6. `ASScheduleTimeline` component
7. `ASNoShowBanner` component
8. `ASDoctolibImportBanner` component
9. Settings panel regulation config
10. Wire into `AuSuivantDashboard` / `useDashboard`

### Phase 3 (recommended sub-order)
1. Schema migration (Doctor state fields + DoctorState enum)
2. `doctorService.ts` state management functions
3. Doctor state + absence endpoints
4. Socket event emitters
5. `ASDoctorPill` component
6. `ASDoctorStatusBar` component
7. `ASDoctorActionPanel` component
8. `ASDoctorAbsenceModal` component
9. `ASDelayNotifyAction` component
10. `ASTransferPatientSheet` component
11. `useDoctorActions` + `usePatientActions` hooks
12. Transfer + delay backend endpoints
13. `ASMobileLayout` shell
14. `ASPatientDetailDrawer` (mobile bottom sheet)
15. Wire everything into dashboard

### Phase 4 (recommended sub-order)
1. CSS grid tokens in `ausuivant.css`
2. `ASDesktopLayout` component
3. `ASPatientDetailDrawer` desktop variant
4. `ASTopbar` desktop doctor pills
5. `DashboardPage` routing update
6. Keyboard shortcuts
7. Remove 430px max-width on desktop

### Phase 5 (recommended sub-order)
1. Verify zero references to deprecated components
2. Delete deprecated components
3. Verify zero references to `isEmergency`
4. Drop `isEmergency` migration
5. Empty states
6. Animations
7. Accessibility audit + fixes
8. Advanced regulation config
