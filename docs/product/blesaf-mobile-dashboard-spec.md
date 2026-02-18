# BleSaf Mobile Receptionist Dashboard — Implementation Specification

> This document describes the exact UI, layout, components, interactions, colors, and behavior of the redesigned receptionist mobile dashboard. Implement this as the actual BleSaf React application. The reference HTML mock is at `blesaf-mobile-redesign.html`.

---

## 1. Design System

### 1.1 Color Tokens

```
--bg:             #F6F5F0    (page background, warm off-white)
--surface:        #FFFFFF    (card backgrounds)
--surface-alt:    #F0EFEA    (secondary surfaces, inactive toggles)
--border:         #E8E6DF    (all borders, dividers)
--text-primary:   #1A1A1A    (headings, names, primary content)
--text-secondary: #6B6960    (labels, descriptions)
--text-tertiary:  #9E9B90    (hints, placeholders, timestamps)
--accent:         #0F7B6C    (primary brand teal — buttons, highlights, cards)
--accent-light:   #E8F5F1    (accent backgrounds, stat chip highlight)
--accent-dark:    #0A5C50    (hover/active states, gradient endpoint)
--red:            #D94F3B    (long wait indicator >50min)
--red-light:      #FDF0ED    (red badge background)
--amber:          #D4920B    (medium wait 20-50min, priority badge)
--amber-light:    #FEF7E6    (amber badge background)
--green:          #2D8B4E    (short wait <20min, doctor present)
--green-light:    #EDF7F0    (green badge background)
--blue:           #3B7DD9    (stepped-out badge)
--blue-light:     #EDF3FC    (blue badge background)
```

### 1.2 Shadows

```
--shadow-sm:    0 1px 2px rgba(0,0,0,0.04)
--shadow-md:    0 4px 12px rgba(0,0,0,0.06)
--shadow-lg:    0 8px 32px rgba(0,0,0,0.10)
--shadow-float: 0 6px 24px rgba(15,123,108,0.25)   (floating CTA only)
```

### 1.3 Border Radii

```
--radius:    12px   (cards, buttons, inputs)
--radius-sm: 8px    (smaller cards, badges)
--radius-xs: 6px    (tiny elements)
```

### 1.4 Typography

- **Font family:** `'DM Sans', 'IBM Plex Sans Arabic', sans-serif`
- Arabic toggle uses `'IBM Plex Sans Arabic'` specifically
- All weights used: 400, 500, 600, 700

### 1.5 Icons

- **Google Material Symbols Rounded** (not Material Icons)
- Import: `Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`
- Filled icons use: `font-variation-settings: 'FILL' 1`

---

## 2. Page Layout

The dashboard is a single mobile screen (375×812 viewport). The layout is a vertical scroll with a fixed floating CTA at the bottom.

```
┌──────────────────────────┐
│  Header (clinic + stats) │  fixed-ish (scrolls with content)
│  Quick-Add Bar           │
│  "En consultation" card  │
│  "File d'attente" list   │
│  ...queue items...       │
│                          │
│  ┌────────────────────┐  │  ← floating, position:absolute bottom:0
│  │ Appeler Suivant CTA│  │     with gradient fade background
│  └────────────────────┘  │
└──────────────────────────┘
```

Padding: content uses `padding: 0 20px` consistently. Screen has `padding-bottom: 100px` to clear the floating CTA.

---

## 3. Components — Screen 1: Queue View (Main Screen)

### 3.1 Header

```
┌─────────────────────────────────────┐
│ Cabinet Dr. Jebali      عربي Présent│
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────────┐  │
│  │  8   │  │  14  │  │  ~18:45  │  │
│  │EN ATT│  │ VUS  │  │FIN ESTIM.│  │
│  └──────┘  └──────┘  └──────────┘  │
└─────────────────────────────────────┘
```

**Clinic name:** 17px, weight 700, `--text-primary`, letter-spacing -0.02em

**Language toggle button:** Pill shape (border-radius: 100px), `--surface` background, `--border` border, 12px font, weight 600, `--text-secondary`. Text: "عربي" using IBM Plex Sans Arabic.

**Doctor presence toggle:** Pill with green dot + "Présent" text. Background: `--green-light`, border: `rgba(45,139,78,0.15)`. Green dot: 8×8px circle, `--green`. Text: 12px, weight 600, `--green`. When doctor is absent: switch to red styling with "Absent" text.

**Stats strip:** 3 equal-width chips in a flex row, gap 8px.
- Each chip: `--surface` bg, `--border` border, `--radius-sm` corners, padding 10px 12px, centered text.
- Value: 22px, weight 700, `--text-primary`, line-height 1, letter-spacing -0.03em
- Label: 11px, weight 500, `--text-tertiary`, uppercase, letter-spacing 0.04em
- First chip ("En attente") is highlighted: `--accent-light` bg, `rgba(15,123,108,0.15)` border, value uses `--accent` color.

### 3.2 Quick-Add Bar

Horizontal flex row, gap 8px, margin 0 20px.

**Input:** flex:1, height 48px, `--surface` bg, 1.5px solid `--border`, `--radius` corners, padding 0 16px, 15px font. Placeholder: "Nom du patient...", `--text-tertiary`. On focus: border changes to `--accent`.

**Button:** 48×48px, `--accent` bg, `--radius` corners, white `person_add` icon (22px). On press: scale(0.94), bg becomes `--accent-dark`.

**Behavior:** Receptionist types a name → taps button → Add Patient bottom sheet slides up with the name pre-filled.

### 3.3 Current Patient Card ("En consultation")

Section header: "EN CONSULTATION" — 13px, weight 600, `--text-tertiary`, uppercase, letter-spacing 0.06em, padding 18px 20px 8px.

Card: margin 0 20px, `--accent` background, `--radius` corners, padding 16px, white text, position relative, overflow hidden. Decorative circle: `::after` pseudo-element, 100×100px circle, `rgba(255,255,255,0.07)`, positioned top -30px right -30px.

**Content:**
- Label: "PATIENT ACTUEL" — 11px, weight 600, uppercase, letter-spacing 0.08em, opacity 0.7
- Name: 20px, weight 700, letter-spacing -0.02em
- Meta: "Arrivé à {time} · Consultation depuis {X} min" — 13px, opacity 0.7

**Action buttons** (flex row, gap 8px, margin-top 14px):
1. **"→ Suivant"** (primary): white bg, `--accent` text, white border. Height 36px, border-radius 100px, 13px weight 600. Icon: `arrow_forward` 16px.
2. **Phone button** (secondary): `rgba(255,255,255,0.1)` bg, `rgba(255,255,255,0.3)` border, white text. Icon: `phone`.

> **IMPORTANT:** There is NO "Terminer" button. The primary action is "Suivant" (call next patient), which implicitly marks the current consultation as complete. This avoids redundancy with the floating "Appeler Suivant" CTA at the bottom.

### 3.4 Queue List

Section header: "FILE D'ATTENTE" — same styling as "En consultation" header.

List container: padding 4px 20px, flex column, gap 2px.

**Each queue item** is a horizontal flex row:

```
┌───┬──────────────────┬──────────┬────┬───┐
│ # │ Name             │ [Badge]  │ 📞 │ ⋮ │
│   │ ● Xmin · 📱      │          │    │   │
└───┴──────────────────┴──────────┴────┴───┘
```

- **Position circle:** 28×28px, border-radius 50%, `--surface-alt` bg, 13px weight 700, `--text-secondary`. First item: `--accent-light` bg, `--accent` text.
- **Name:** 15px, weight 600, `--text-primary`, ellipsis overflow
- **Detail line:** 12px, `--text-tertiary`, flex row with gap 6px
  - Wait dot: 7×7px circle. Colors by wait time:
    - Green (`--green`): < 20 minutes
    - Amber (`--amber`): 20–50 minutes
    - Red (`--red`): > 50 minutes
  - Wait text: "{X} min" or "{X}h{XX}"
  - Phone indicator: "📱" emoji shown if patient has a phone number linked
- **Badges** (pill shaped, 10px weight 700, uppercase, letter-spacing 0.05em, padding 3px 8px, border-radius 100px):
  - `PRIORITAIRE`: `--amber-light` bg, `--amber` text
  - `SORTI`: `--blue-light` bg, `--blue` text
  - `SANS TÉL.`: `--surface-alt` bg, `--text-tertiary` text, weight 600
- **Action buttons** (flex row, gap 4px):
  - Phone icon button: 36×36px circle, transparent bg, `--text-tertiary`. On press: `--green-light` bg, `--green` color. **Disabled** (opacity 0.2, no pointer events) when patient has no phone.
  - More menu button: `more_vert` icon, same styling.
- **Divider:** 1px solid `--border` bottom border on each item. Last item: no border.

### 3.5 Floating "Appeler Suivant" CTA

Pinned to bottom of the screen view (position: absolute, bottom: 0, left: 0, right: 0).

**Gradient fade:** `linear-gradient(to top, var(--bg) 60%, transparent)`, padding 12px 20px 32px.

**Button:** Full width, height 56px, `--accent` bg, border-radius 16px, white text. Font: 16px weight 700.

Content: `→ Appeler Suivant · {next patient first name + initial}` — the next patient's abbreviated name is shown in 14px, weight 400, opacity 0.8.

Shadow: `--shadow-float`. On press: scale(0.97).

**Subtle pulse animation:** A `::after` pseudo-element with `rgba(255,255,255,0.15)` overlay fades in and out on a 3-second infinite loop, giving a gentle breathing glow effect.

---

## 4. Components — Screen 2: Add Patient Bottom Sheet

Triggered when the receptionist taps the quick-add button.

### 4.1 Sheet Container

- Position absolute, bottom 0, full width
- `--surface` background, border-radius 20px 20px 0 0
- Padding: 8px 20px 36px
- Shadow: `0 -4px 32px rgba(0,0,0,0.12)`
- z-index: 100
- Slides up: `transform: translateY(100%)` → `translateY(0)` with `cubic-bezier(0.32, 0.72, 0, 1)` over 350ms
- Max-height: 80%, overflow-y: auto

**Backdrop overlay:** Full-screen `rgba(0,0,0,0.3)`, z-index 99, fades in 300ms.

**Drag handle:** Centered 36×4px pill, `--border` bg, border-radius 100px, margin 8px auto 16px.

### 4.2 Sheet Header

- **Title:** "Nouveau patient" — 18px, weight 700, `--text-primary`
- **Subtitle:** "Sera en position #{n} · Attente estimée ~{time}" — 13px, `--text-tertiary`, margin-bottom 16px

### 4.3 RDV Toggle (Appointment Type)

Segmented control, flex row, `--surface-alt` bg, `--radius-sm` corners, padding 3px, margin-bottom 20px.

Two options, each flex:1:
1. **"Sans rendez-vous"** (icon: `queue`) — DEFAULT active
2. **"Avec rendez-vous"** (icon: `calendar_today`)

Each option: padding 10px 8px, border-radius 6px, 13px weight 600, `--text-tertiary`. Centered content with icon (16px) + text, gap 6px.

**Active state:** `--surface` bg, `--text-primary` color, `--shadow-sm` box-shadow.

**Behavior:** Toggling to "Avec rendez-vous" smoothly animates a time input field into view below the name field. Toggling back hides it.

### 4.4 Form Fields

**Name field:**
- Label: `person` icon + "Nom du patient" — 13px, weight 600, `--text-secondary`, flex row, gap 6px
- Input: full width, height 48px, `--bg` background, 1.5px solid `--border`, `--radius-sm`, padding 0 16px, 15px font
- On focus: border `--accent`, bg white
- When pre-filled: border `--accent`, bg `--accent-light` (class `.filled`)

**Appointment time field** (conditionally shown):
- Label: `schedule` icon + "Heure du rendez-vous" — same label styling
- Input: `type="time"`, same input styling, `font-variant-numeric: tabular-nums`
- **Animation:** Container has `max-height: 0; overflow: hidden; opacity: 0` by default. When visible: `max-height: 80px; opacity: 1; margin-bottom: 16px`. Transition: 300ms ease on max-height, 250ms ease on opacity.

**Phone field:**
- Label: `phone` icon + "Numéro de téléphone" + "(optionnel)" in lighter weight
- Layout: flex row with static prefix + input
  - Prefix: "+216" — height 48px, padding 0 14px, `--surface-alt` bg, 1.5px solid `--border`, `--radius-sm`, 15px weight 600, `--text-secondary`
  - Input: flex 1, placeholder "XX XXX XXX", inputMode="numeric"
- Hint below: `info` icon + "Permet d'appeler le patient et de suivre sa position" — 12px, `--text-tertiary`, margin-top 6px

### 4.5 QR Fallback Card

Flex row, gap 14px, padding 14px 16px, `--accent-light` bg, `rgba(15,123,108,0.12)` border, `--radius-sm` corners, margin-bottom 16px.

- Icon: 40×40px square with 10px radius, `--accent` bg, white `qr_code_2` icon (20px)
- Text: "**Pas de numéro ?** Le patient peut scanner le QR du comptoir pour s'inscrire lui-même." — 13px, `--accent-dark`, weight 500, line-height 1.4. Bold part: weight 700.

### 4.6 Submit Button

Full width, height 52px, `--accent` bg, `--radius` corners, white text. Content: `check` icon (20px) + "Ajouter à la file" — 16px weight 700. On press: scale(0.97), bg `--accent-dark`.

---

## 5. Components — Screen 3: Post-Add Confirmation Sheet

Appears after successfully adding a patient. Same sheet container as Screen 2.

### 5.1 Confirmation Card

`--accent-light` bg, `rgba(15,123,108,0.12)` border, `--radius` corners, padding 20px, centered text, margin-bottom 16px.

- Check circle: 48×48px, `--accent` bg, centered, white `check_circle` icon (28px, filled).
- Name: 18px, weight 700, `--text-primary`
- Position: "Position #{n} · Attente estimée ~{time}" — 14px, weight 600, `--accent`

### 5.2 Phone Linking Options (shown when no phone was entered)

Section subtitle: "Aucun numéro renseigné. Pour lier la patiente :" — 13px, weight 600, `--text-secondary`, margin-bottom 12px.

Three tappable cards, each a flex row:

```
┌──────┬──────────────────────┬───┐
│ icon │ Title                │ > │
│      │ Description          │   │
└──────┴──────────────────────┴───┘
```

Each card: padding 14px 16px, `--bg` bg, 1.5px dashed `--border`, `--radius-sm`, margin-bottom 10px, gap 12px. On press: `--surface-alt` bg, `--accent` border.

1. **Montrer le QR code** — icon: `qr_code_2` in accent square (40×40, 10px radius, `--accent-light` bg, `--accent` color). Desc: "La patiente scanne pour suivre sa position"
2. **Envoyer le lien par SMS** — icon: `sms` in green square (`--green-light` bg, `--green` color). Desc: "Saisir le numéro et envoyer le lien de suivi"
3. **Ajouter le numéro plus tard** — icon: `phone` in blue square (`--blue-light` bg, `--blue` color). Desc: "Via le menu du patient dans la file"

Title: 14px, weight 700, `--text-primary`. Desc: 12px, `--text-tertiary`. Arrow: `chevron_right` 18px, `--text-tertiary`.

### 5.3 Return Button

Full width, height 52px, `--surface-alt` bg, `--text-secondary` text. Label: "Terminé — Retour à la file". Same button shape as submit. Returns to queue view.

---

## 6. Components — Screen 4: End-of-Day Summary

This screen is shown when the doctor's day ends. It's a shareable summary card.

### 6.1 Summary Card

Margin 20px, `--surface` bg, border-radius 20px, overflow hidden, `--shadow-md`.

**Hero section:** `linear-gradient(135deg, var(--accent) 0%, #0A5C50 100%)`, padding 28px 24px 32px, white text, relative positioned. Decorative circle: `::before`, 160×160px, `rgba(255,255,255,0.06)`, top -40px right -20px.

- Date: "Lundi 16 Février 2026" — 13px, weight 500, opacity 0.7
- Doctor: "Dr. Karim Jebali" — 22px, weight 700, letter-spacing -0.02em
- Specialty: "Cabinet d'Ophtalmologie · El Menzah" — 14px, opacity 0.7
- Big number: "27" in 56px weight 700 (letter-spacing -0.04em) + "patients vus" in 18px weight 500 opacity 0.7, baseline-aligned, gap 8px, margin-top 28px

**Stats grid:** 2×2 grid, gap 1px (creates border lines via `--border` bg on grid container). Each cell: `--surface` bg, padding 20px, centered.
- Value: 24px, weight 700, `--text-primary`, letter-spacing -0.02em
- Label: 12px, `--text-tertiary`

Four stats:
1. "14 min" / "Attente moyenne"
2. "8 min" / "Consultation moy."
3. "08:45" / "Premier patient"
4. "18:42" / "Dernier patient"

**Footer:** Flex row, space-between, padding 16px 24px.
- Left: BleSaf branding — 20×20px square (5px radius, `--accent` bg, white "B" in 11px weight 800) + "BleSaf" text (13px, weight 600, `--text-tertiary`)
- Right: "Partager" button — `--accent` bg, white, pill shape (border-radius 100px), padding 10px 20px, 14px weight 600, `share` icon 18px

### 6.2 Activity Timeline Bar

Below the card, margin 0 20px 20px. `--surface` bg, `--radius` corners, padding 18px 20px, `--shadow-sm`, 1px solid `--border`.

Title: "ACTIVITÉ DE LA JOURNÉE" — 13px, weight 600, `--text-tertiary`, uppercase, letter-spacing 0.06em, margin-bottom 14px.

Bar: 32px tall, `--surface-alt` bg, `--radius-xs` corners, flex row, overflow hidden.
- Morning segment: `--accent` bg, opacity 0.6, flex 3, text "9 pts"
- Lunch segment: `--surface-alt` bg, flex 1, `--text-tertiary` text "—"
- Afternoon segment: `--accent` bg, flex 4, text "18 pts"
- Text in segments: 10px, weight 700, `rgba(255,255,255,0.9)`

Labels below: flex row, space-between, margin-top 6px, 11px `--text-tertiary`. Values: start time, "Pause 12h–14h", end time.

### 6.3 Action Buttons

Flex row, gap 10px, padding 0 20px 36px.

1. **Exporter:** flex 1, height 48px, `--surface` bg, 1.5px solid `--border`, `--radius` corners, `--text-secondary`, 14px weight 600. Icon: `download` 18px.
2. **Nouvelle journée:** Same shape but `--accent` bg, `--accent` border, white text. Icon: `arrow_forward` 18px.

---

## 7. Interactions & Behavior

### 7.1 Adding a Patient — Full Flow

1. Receptionist types name in quick-add input (e.g., "Mme Haddad")
2. Taps the `person_add` button
3. **Bottom sheet slides up** (350ms, cubic-bezier ease) with:
   - Name pre-filled and highlighted (`.filled` state)
   - Position and wait estimate shown in subtitle
   - RDV toggle defaulting to "Sans rendez-vous"
   - Phone field empty with "(optionnel)" label
4. Receptionist optionally:
   - Toggles to "Avec rendez-vous" → time field animates in (300ms)
   - Enters phone number
5. Taps "Ajouter à la file"
6. **Confirmation sheet replaces form** showing:
   - Success card with check icon, name, position
   - If no phone entered: three linking options (QR, SMS, add later)
   - If phone was entered: skip linking options, show success only
7. Taps "Terminé — Retour à la file" → sheet slides down, queue updates with new patient

### 7.2 Calling Next Patient

Two identical triggers:
- **"→ Suivant" button** on the current patient card
- **"Appeler Suivant · {name}" floating CTA** at bottom

Both do the same thing: mark current patient as completed, advance the queue, put the next patient into the "En consultation" card.

### 7.3 Queue Item Actions (via ⋮ menu)

Long-pressing or tapping `more_vert` on a queue item opens a context sheet (bottom sheet) with actions:
- **Marquer prioritaire** — icon-amber, moves patient up
- **Marquer sorti** — icon-blue, flags patient as stepped out
- **Ajouter numéro** — icon-green, add phone number retroactively
- **Retirer de la file** — icon-red, removes patient (with confirmation)

### 7.4 Wait Time Dot Colors (Dynamic)

Calculate from `arrivedAt` timestamp:
- **Green** (`--green`): waited < 20 minutes
- **Amber** (`--amber`): waited 20–50 minutes
- **Red** (`--red`): waited > 50 minutes

### 7.5 Entry Animations

On initial load, elements stagger in with a slide-up-fade animation:
```css
@keyframes slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```
Duration: 400ms, ease-out. Delays increment by 50ms per group (header, stats, quick-add, current patient, each queue item pair).

---

## 8. Data Model Requirements

### 8.1 Queue Entry Fields

Each patient in the queue needs:

```typescript
interface QueueEntry {
  id: string;
  clinicId: string;
  position: number;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;           // Optional — drives phone icon state and 📱 indicator
  status: 'WAITING' | 'IN_CONSULTATION' | 'NOTIFIED' | 'COMPLETED' | 'CANCELLED';
  arrivedAt: Date;                // Used to calculate wait time and dot color
  appointmentTime?: Date;         // Only set when "Avec rendez-vous" was selected
  appointmentType: 'WALK_IN' | 'APPOINTMENT';  // Driven by RDV toggle
  isPriority: boolean;            // Shows PRIORITAIRE badge
  isSteppedOut: boolean;          // Shows SORTI badge
  notes?: string;
  consultationStartedAt?: Date;   // When moved to IN_CONSULTATION
}
```

### 8.2 Computed Display Values

```typescript
// Wait time display
const waitMinutes = Math.floor((now - entry.arrivedAt) / 60000);
const waitDisplay = waitMinutes >= 60
  ? `${Math.floor(waitMinutes/60)}h${String(waitMinutes%60).padStart(2,'0')}`
  : `${waitMinutes} min`;

// Wait dot color
const dotColor = waitMinutes < 20 ? 'green' : waitMinutes < 50 ? 'amber' : 'red';

// Has phone
const hasPhone = !!entry.phoneNumber;

// Badge (only one shown, priority order)
const badge = entry.isPriority ? 'priority'
  : entry.isSteppedOut ? 'stepped-out'
  : !hasPhone ? 'no-phone'
  : null;

// Consultation duration (for current patient)
const consultMinutes = Math.floor((now - entry.consultationStartedAt) / 60000);
```

### 8.3 Summary Stats (End-of-Day)

```typescript
interface DaySummary {
  date: Date;
  doctorName: string;
  specialty: string;
  location: string;
  totalPatientsSeen: number;
  averageWaitMinutes: number;
  averageConsultMinutes: number;
  firstPatientTime: string;       // "08:45"
  lastPatientTime: string;        // "18:42"
  morningCount: number;           // before lunch break
  afternoonCount: number;         // after lunch break
  lunchBreakStart: string;        // "12:00"
  lunchBreakEnd: string;          // "14:00"
}
```

---

## 9. Responsive Notes

- This is a **mobile-first** dashboard. The HTML mock is designed at 375px width.
- On larger screens, the dashboard should remain phone-width (max-width 480px, centered) or adapt to a wider layout with the same component proportions.
- Bottom sheets should be full-width on mobile, capped at ~400px on larger screens.
- The floating CTA stays pinned to the bottom of the viewport.
- All touch targets are minimum 36px (icon buttons) or 48px (inputs, main buttons).

---

## 10. i18n Notes

- All text in the mock is French. The app must support French, Arabic (RTL), and potentially English.
- The language toggle ("عربي") sits in the header and switches the entire interface direction and text.
- Arabic font: IBM Plex Sans Arabic (already loaded alongside DM Sans).
- RTL considerations: flex row order reverses, text alignment flips, icons that imply direction (arrows) should mirror.

---

## 11. Key Design Decisions (Rationale)

| Decision | Rationale |
|----------|-----------|
| **"Suivant" replaces "Terminer"** | "Terminer" and "Appeler Suivant" performed the same action. Single concept: "next patient." Two access points (card button + floating CTA) for convenience, not redundancy. |
| **Phone is optional in add form** | Most common scenario: patient walks in, receptionist adds name fast. Phone can be added later via QR, SMS link, or queue item menu. Never block the add. |
| **RDV toggle defaults to "Sans rendez-vous"** | Walk-ins dominate in Tunisian clinics. Appointment mode is the exception, not the rule. |
| **No "Terminer" without "Suivant"** | If the doctor needs to end the day (no next patient), use the end-of-day summary flow, not a standalone "terminate consultation" action. |
| **Post-add confirmation shows linking options** | When no phone was entered, the confirmation sheet immediately surfaces three ways to link the patient. This prevents "sans tél." entries from piling up unnoticed. |
| **Wait dot colors are time-based, not position-based** | A patient at position #2 who arrived 55 minutes ago should show red, not green. Wait time matters more than position. |
| **Floating CTA shows next patient's name** | "Appeler Suivant · Fatma K." removes the guessing — receptionist sees exactly who's next without scanning the list. |
| **Subtle pulse on CTA** | The gentle white glow animation draws attention to the primary action without being distracting. |
| **Stat chips in header** | Three key numbers always visible: queue length, patients seen today, estimated end time. Lets the doctor glance at the phone for a quick status without scrolling. |

---

## 12. File Reference

The complete HTML mock is available at `blesaf-mobile-redesign.html`. It contains all CSS inline (no external stylesheets except Google Fonts) and all the exact pixel values, colors, and spacing described above. When in doubt about a specific measurement or color, the HTML is the source of truth.
