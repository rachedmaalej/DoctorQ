# BleSaf Mobile Dashboard — Complete Redesign Guide

> **What this document is:** The single source of truth for every screen in the BleSaf mobile receptionist dashboard. It explains what each screen does, how screens connect, and what goes where. For pixel-level CSS values, open the companion HTML mocks — this document tells you which file and which tab to look at.
>
> **Companion files (open both in a browser at 375px):**
> - `blesaf-mobile-redesign.html` — Screens: **File d'attente**, **Ajouter patient**, **Confirmation**
> - `blesaf-mobile-redesign-v2.html` — Screens: **Matin**, **Ouverte**, **Fermeture**, **File vidée**, **Résumé**

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Design System (Shared)](#2-design-system-shared)
3. [Shared Components](#3-shared-components)
4. [Screen Map — What Lives Where](#4-screen-map--what-lives-where)
5. [Screen A: File d'attente (Active Queue)](#5-screen-a-file-dattente-active-queue)
6. [Screen B: Ajouter Patient (Add Patient Sheet)](#6-screen-b-ajouter-patient-add-patient-sheet)
7. [Screen C: Confirmation (Post-Add)](#7-screen-c-confirmation-post-add)
8. [Screen D: Matin (Pre-Open Morning)](#8-screen-d-matin-pre-open-morning)
9. [Screen E: Ouverte (Open Queue with Lifecycle)](#9-screen-e-ouverte-open-queue-with-lifecycle)
10. [Screen F: Fermeture (Closing / Draining)](#10-screen-f-fermeture-closing--draining)
11. [Screen G: File vidée (All Done)](#11-screen-g-file-vidée-all-done)
12. [Screen H: Résumé (End-of-Day Summary)](#12-screen-h-résumé-end-of-day-summary)
13. [Bottom Sheets](#13-bottom-sheets)
14. [Queue Lifecycle State Machine](#14-queue-lifecycle-state-machine)
15. [User Flows](#15-user-flows)
16. [Element Visibility Matrix](#16-element-visibility-matrix)
17. [Animations](#17-animations)
18. [Data Requirements](#18-data-requirements)
19. [Implementation Notes](#19-implementation-notes)

---

## 1. The Big Picture

The BleSaf mobile dashboard is used by **one person all day: the clinic receptionist**. She manages patients on her phone while sitting at the front desk. The dashboard covers two concerns:

1. **Queue lifecycle** — opening the clinic in the morning, managing patients through the day, closing, and reviewing a summary at night.
2. **Patient management** — adding patients (with or without phone numbers), calling the next one, marking consultations complete, handling edge cases (stepped-out, priority, phoneless).

These two concerns are split across two HTML mocks because they were designed in sequence, but in the final app they are **one unified view** — a single React component that conditionally renders based on queue state, with bottom sheets for patient add and context actions.

### How the two mocks relate

| Mock file | What it shows | When it applies |
|-----------|--------------|-----------------|
| `blesaf-mobile-redesign.html` | The patient management layer — adding patients, phone number handling, post-add confirmation. Also shows the active queue and end-of-day summary. | Any time the queue is OPEN and the receptionist is adding/managing patients |
| `blesaf-mobile-redesign-v2.html` | The queue lifecycle layer — morning pre-open, active queue with status pill, closing state, all-done state, end-of-day summary. | All day — this is the structural backbone of the whole experience |

In the final build, these merge into one component. The v2 lifecycle is the **skeleton** (which screen you see depends on queue status), and the v1 patient flows are **overlays** (bottom sheets that appear on top of the OPEN screen when adding patients).

---

## 2. Design System (Shared)

Both mocks use the **exact same design tokens**. Every color, shadow, radius, and font is identical.

### 2.1 Colors

```
BACKGROUNDS
  --bg:           #F6F5F0    warm off-white — page background, NOT pure white
  --surface:      #FFFFFF    cards, inputs, sheets
  --surface-alt:  #F0EFEA    inactive chips, muted backgrounds, divider zones
  --border:       #E8E6DF    all borders, separators, inactive outlines

TEXT
  --text-primary:   #1A1A1A  headings, patient names, stat numbers
  --text-secondary: #6B6960  form labels, supporting text
  --text-tertiary:  #9E9B90  meta info, placeholders, section headers

BRAND / ACCENT (teal)
  --accent:       #0F7B6C    primary actions, CTA buttons, brand
  --accent-light: #E8F5F1    accent chip backgrounds, highlights
  --accent-dark:  #0A5C50    pressed states on accent buttons

SEMANTIC
  --red:          #D94F3B    long wait (>45min), danger
  --red-light:    #FDF0ED
  --amber:        #D4920B    medium wait (21-45min), closing/warning
  --amber-light:  #FEF7E6
  --green:        #2D8B4E    short wait (≤20min), doctor present, success
  --green-light:  #EDF7F0
  --blue:         #3B7DD9    stepped-out badge, informational
  --blue-light:   #EDF3FC
```

### 2.2 Shadows

```
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.04)
  --shadow-md:    0 4px 12px rgba(0,0,0,0.06)
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.10)
  --shadow-float: 0 6px 24px rgba(15,123,108,0.25)   ← CTA button only
```

### 2.3 Radii

```
  --radius:    12px   standard cards, inputs, buttons
  --radius-sm:  8px   chips, tags, smaller elements
  --radius-xs:  6px   timeline segments, small insets
```

### 2.4 Typography

**Fonts:** DM Sans (Latin) + IBM Plex Sans Arabic (Arabic/RTL)

**Key sizes used across all screens:**

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
| Clinic name | 17px | 700 | -0.02em | |
| Current patient name | 20px | 700 | -0.02em | White on accent bg |
| Stat chip value | 22px | 700 | -0.03em | Tabular numerals |
| Queue item name | 15px | 600 | — | |
| Input text | 15px | 400 | — | |
| Section header | 13px | 600 | 0.06em | UPPERCASE |
| Stat chip label | 11px | 500 | 0.04em | UPPERCASE |
| Status pill | 12px | 600 | — | |
| Badge text | 10px | 700 | 0.05em | UPPERCASE |
| Queue item detail | 12px | 400 | — | Tertiary color |
| Floating CTA | 16px | 700 | — | White |
| Summary big number | 56px | 700 | -0.04em | White on gradient |
| Summary hero title | 22px | 700 | -0.02em | White |
| Form sheet title | 18px | 700 | — | |
| Add-submit button | 16px | 700 | — | White |

### 2.5 Icons

**Library:** Google Material Symbols Rounded, variable axis import.

Default: **outlined** (FILL 0). Specific icons use **filled** (FILL 1):
- `check_circle` — in confirmation card, current patient "Terminer" button, all-done card
- Status bar icons (signal, wifi, battery) — always filled
- Doctor presence toggle icons — filled

All other icons are outlined.

---

## 3. Shared Components

These components are reused across multiple screens. Build them as standalone sub-components.

### 3.1 Header

Present on **every screen**. Contains:

```
┌──────────────────────────────────────────┐
│ Cabinet Dr. Jebali      [عربي] [Status]  │
│                                          │
│ [8 En attente] [14 Vus] [~18:45 Fin]    │  ← stats strip (OPEN/CLOSING only)
└──────────────────────────────────────────┘
```

- **Outer:** `padding: 8px 20px 14px`, `flex-column`, `gap: 12px`
- **Top row:** `flex`, `space-between`, `align-center`
- **Right cluster:** `flex`, `gap: 8px`, `align-center` — contains lang toggle + status pill (or doctor toggle in v1)
- **Stats strip:** only rendered in OPEN and CLOSING states

→ **Pixel reference:** Open either HTML mock — the header is identical in both.

### 3.2 Status Pill

Indicates current queue state. **Tappable in OPEN and CLOSING** (opens bottom sheet). Not tappable in PRE_OPEN or CLOSED.

| State | Background | Text | Dot Color | Dot Anim | Label |
|-------|-----------|------|----------|----------|-------|
| PRE_OPEN | transparent | `--text-tertiary` | `--border` | none | "Non ouverte" |
| OPEN | `--green-light` | `--green` | `--green` | none | "Ouvert" |
| CLOSING | `--amber-light` | `--amber` | `--amber` | pulse 1.5s | "Fermeture…" |
| CLOSED | `--surface-alt` | `--text-tertiary` | — (no dot) | — | "Terminée" |

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` — visible in all 5 tabs, changes per state.

### 3.3 Stats Strip

Three equal-width chips in a row. First chip is highlighted (accent background).

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│    8     │ │    14    │ │  ~18:45  │
│ EN ATTENTE│ │   VUS    │ │FIN ESTIMÉE│
└──────────┘ └──────────┘ └──────────┘
```

- **Chip:** `flex: 1`, `background: --surface`, `border: 1px solid --border`, `border-radius: --radius-sm`, `padding: 10px 12px`, `text-align: center`
- **Highlighted chip:** `background: --accent-light`, `border-color: rgba(15,123,108,0.15)`, value color becomes `--accent`
- **In CLOSING state:** first label changes from "En attente" to "Restants"

→ **Pixel reference:** Both HTML mocks, visible on any active queue screen.

### 3.4 Quick-Add Bar

The primary patient intake control. Name input + accent-colored submit button.

```
┌─────────────────────────────┐ ┌────┐
│ Nom du patient...           │ │ +👤│
└─────────────────────────────┘ └────┘
```

- **Input:** `flex: 1`, `height: 48px`, `background: --surface`, `border: 1.5px solid --border`, `border-radius: --radius`, `padding: 0 16px`
- **Button:** `48px × 48px`, `background: --accent`, `border-radius: --radius`, `person_add` icon (22px)
- **Behavior:** Typing a name and tapping the button opens the Add Patient bottom sheet (Screen B) with the name pre-filled
- **Visibility:** Only shown in OPEN state. Hidden in PRE_OPEN, CLOSING, ALL_DONE, CLOSED.
- **When sheet is open:** Input shows the entered name with accent border/background, button is dimmed (0.3 opacity)

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "File d'attente" tab (active state), "Ajouter patient" tab (dimmed state).

### 3.5 Current Patient Card

The accent-colored card showing who's currently in consultation.

```
┌────────────────────────────── accent bg ─┐
│ PATIENT ACTUEL                    ○ decor │
│ Sami Ben Amor                            │
│ Arrivé à 16:30 · Consultation depuis 8min│
│                                          │
│ [✓ Terminer]  [📞]                       │
└──────────────────────────────────────────┘
```

- **Container:** `margin: 0 20px`, `background: --accent`, `border-radius: --radius`, `padding: 16px`, white text
- **Decorative circle:** `::after` pseudo-element — `100px × 100px` circle, `top: -30px`, `right: -30px`, `rgba(255,255,255,0.07)`
- **Primary button ("Terminer"):** white background, accent text, pill shape
- **Secondary button (phone):** semi-transparent white border, outlined
- **Visibility:** Only when a patient is IN_CONSULTATION (OPEN or CLOSING states)

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "File d'attente" tab (the teal card).

### 3.6 Queue List

The scrollable list of waiting patients.

Each item has:
```
[#] Name                [badge?]  [📞] [⋮]
    ● 12 min · 📱
```

**Position circle:** `28px × 28px`, `border-radius: 50%`
- First item: `background: --accent-light`, `color: --accent`
- Other items: `background: --surface-alt`, `color: --text-secondary`
- Exception: In PRE_OPEN list, ALL items get accent styling

**Wait-time dot:** `7px × 7px` circle — color by threshold:
- ≤20 min → green
- 21-45 min → amber
- >45 min → red

**Badges** (optional per patient):
| Badge | Background | Text Color | Label |
|-------|-----------|-----------|-------|
| Priority | `--amber-light` | `--amber` | "Prioritaire" |
| Stepped out | `--blue-light` | `--blue` | "Sorti" |
| No phone | `--surface-alt` | `--text-tertiary` | "Sans tél." |

**Phone icon button:** Active (tappable) for patients with phone. `opacity: 0.2` and `pointer-events: none` for phoneless patients.

**Phone indicator in detail line:** Patients with a linked phone show a `📱` emoji after the wait time. Phoneless patients show nothing.

**Item separator:** `border-bottom: 1px solid --border` (last item: no border).

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "File d'attente" tab — 7 patients shown with all badge types and wait-dot colors.

### 3.7 Floating CTA

Bottom-pinned action button. Two variants:

| Variant | Background | Text | When |
|---------|-----------|------|------|
| Green "Ouvrir" | `--green` | "Ouvrir la file" | PRE_OPEN |
| Accent "Appeler" | `--accent` | "Appeler Suivant · {name}" | OPEN, CLOSING |

**Container:** `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`, `padding: 12px 20px 32px`, `background: linear-gradient(to top, --bg 60%, transparent)`, `pointer-events: none`

**Button:** `pointer-events: all`, `width: 100%`, `height: 56px`, `border-radius: 16px`, `box-shadow: --shadow-float`

**Breathing glow:** `::after` pseudo-element with `rgba(255,255,255,0.15)`, `animation: 3s ease-in-out infinite` opacity pulsing (0 → 1 → 0). Only on the accent variant.

**Not visible:** In ALL_DONE and CLOSED states (those screens have their own action buttons).

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "File d'attente" tab (accent variant). `blesaf-mobile-redesign-v2.html` → "Matin" tab (green variant).

### 3.8 Section Header

Simple uppercase label used above content groups.

- `padding: 18px 20px 8px`, `font-size: 13px`, `font-weight: 600`, `color: --text-tertiary`, `text-transform: uppercase`, `letter-spacing: 0.06em`
- Label text changes by context: "EN CONSULTATION", "FILE D'ATTENTE", "RESTANTS" (closing state), "PRÉ-INSCRITS" (pre-open)

---

## 4. Screen Map — What Lives Where

This table maps every screen to its HTML file, tab name, and the queue state it represents.

| # | Screen Name | HTML File | Tab Name | Queue State | Primary Purpose |
|---|------------|-----------|----------|-------------|-----------------|
| A | File d'attente | v1 `blesaf-mobile-redesign.html` | "File d'attente" | OPEN | Full active queue with patient list, add bar, current patient, floating CTA |
| B | Ajouter patient | v1 `blesaf-mobile-redesign.html` | "Ajouter patient" | OPEN (overlay) | Bottom sheet for adding a new patient with optional phone number |
| C | Confirmation | v1 `blesaf-mobile-redesign.html` | "Confirmation" | OPEN (overlay) | Post-add sheet showing success, QR/SMS fallbacks for phoneless patients |
| D | Matin | v2 `blesaf-mobile-redesign-v2.html` | "☀️ Matin" | PRE_OPEN | Morning welcome screen, pre-registered list, "Ouvrir la file" CTA |
| E | Ouverte | v2 `blesaf-mobile-redesign-v2.html` | "🟢 Ouverte" | OPEN | Active queue with status pill + lifecycle controls (tappable pill opens sheet) |
| F | Fermeture | v2 `blesaf-mobile-redesign-v2.html` | "🟡 Fermeture" | CLOSING | Draining queue with amber banner, "Restants" labels, pulsing pill |
| G | File vidée | v2 `blesaf-mobile-redesign-v2.html` | "✅ File vidée" | CLOSING (empty) | All-done card with "Terminer la journée" / "Rouvrir" choice |
| H | Résumé | v2 `blesaf-mobile-redesign-v2.html` | "📊 Résumé" | CLOSED | Shareable summary card with stats, timeline, export/new day actions |

### How they compose in the final app

```
Queue State          Base Screen              Available Overlays
─────────────        ───────────              ──────────────────
PRE_OPEN     →       Screen D (Matin)         none
OPEN         →       Screen E (Ouverte)       Screen B (Add Patient sheet)
                                              Screen C (Confirmation sheet)
                                              Status Bottom Sheet (from pill tap)
                                              Patient Context Sheet (from ⋮ tap)
CLOSING      →       Screen F (Fermeture)     Status Bottom Sheet (from pill tap)
                                              Patient Context Sheet (from ⋮ tap)
CLOSING+empty →      Screen G (File vidée)    Status Bottom Sheet (from pill tap)
CLOSED       →       Screen H (Résumé)        none
```

---

## 5. Screen A: File d'attente (Active Queue)

**Source:** `blesaf-mobile-redesign.html` → tab "File d'attente"

**What it shows:** The core working screen for a busy afternoon. The receptionist sees everything at once — who's in consultation, who's waiting, how long they've been waiting, and who doesn't have a phone linked.

### Content stack (top to bottom)

1. **Status bar** (fake iOS chrome — for mock only)
2. **Header** with clinic name + lang toggle + doctor presence toggle
3. **Stats strip** — 3 chips: En attente (highlighted, 8), Vus (14), Fin estimée (~18:45)
4. **Quick-add bar** — name input + person_add button
5. **Section header** — "EN CONSULTATION"
6. **Current patient card** — Sami Ben Amor, arrival time, consultation duration, Terminer + phone buttons
7. **Section header** — "FILE D'ATTENTE"
8. **Queue list** — 7 patients demonstrating all states:
   - #1 Fatma Khaldi — green dot, 12min, has phone
   - #2 Mehdi Trabelsi — green dot, 18min, has phone, **Prioritaire** badge
   - #3 Amira Mansour — amber dot, 32min, **Sans tél.** badge, phone icon disabled
   - #4 Karim Gharbi — amber dot, 41min, has phone, **Sorti** badge
   - #5 Nour Haddad — red dot, 55min, has phone
   - #6 Youssef Chahed — red dot, 58min, **Sans tél.** badge, phone icon disabled
   - #7 Leila Sassi — red dot, 1h02, has phone
9. **Floating CTA** — "Appeler Suivant · Fatma K." with breathing glow

### Key design decisions visible in this screen

- **Doctor presence toggle** (green pill, top-right) is separate from the status pill — it just indicates "Présent" / "Absent"
- **Phone emoji** 📱 appears inline in the queue item detail line for patients with phones — subtle but scannable
- **"Sans tél." badge** is deliberately muted (surface-alt background, tertiary text) — it's informational, not alarming
- **"Sorti" badge** uses blue (not red) — it's a status, not a problem
- **"Prioritaire" badge** uses amber — visible but not confused with wait-time amber dots
- **Wait-time colors** escalate: green → amber → red as wait increases
- **First position circle is accent-colored** — the receptionist's eye naturally goes there for "who's next"

### Differences from Screen E (v2 Ouverte)

Screen A and Screen E show the same queue state (OPEN) but with different header controls:
- **Screen A** has a doctor presence toggle (green "Présent" pill) — this is the v1 approach
- **Screen E** has a status pill (green "Ouvert") that's tappable to open the lifecycle control sheet — this is the v2 approach

In the final build, use Screen E's approach (status pill) as the primary header control, and move the doctor presence toggle into the bottom sheet (as shown in v2).

---

## 6. Screen B: Ajouter Patient (Add Patient Sheet)

**Source:** `blesaf-mobile-redesign.html` → tab "Ajouter patient"

**What it shows:** After the receptionist types a name in the quick-add bar and taps the button, this bottom sheet slides up with the complete add-patient form.

### What happens before this screen

1. Receptionist types "Mme Haddad" in the quick-add input
2. Taps the `person_add` button
3. The add-patient bottom sheet slides up from below (spring animation)
4. The quick-add input in the background shows "Mme Haddad" with accent border/background, dimmed to 0.3 opacity
5. A dark overlay (`rgba(0,0,0,0.3)`) covers the background content

### Sheet content (top to bottom)

1. **Handle** — 36px × 4px rounded bar, centered
2. **Title** — "Nouveau patient" (18px, 700 weight)
3. **Subtitle** — "Sera en position #9 · Attente estimée ~2h" (13px, tertiary)
4. **Appointment toggle** — Segmented control with two options:
   - "Sans rendez-vous" (default active) — icon: `queue`
   - "Avec rendez-vous" — icon: `calendar_today`
   - When "Avec rendez-vous" is selected, a time input appears below
5. **Name field** — Label with person icon + "Nom du patient", input pre-filled and readonly with `.filled` styling (accent border, accent-light bg)
6. **Appointment time field** — (conditional, only when "Avec rendez-vous" active) Label with schedule icon + "Heure du rendez-vous", time input defaulting to current-ish time
7. **Phone field** — Label with phone icon + "Numéro de téléphone" + "(optionnel)" tag in tertiary, +216 prefix block + number input, hint text "Permet d'appeler le patient et de suivre sa position"
8. **QR fallback card** — Accent-light background, QR code icon in accent square, text: "**Pas de numéro ?** Le patient peut scanner le QR du comptoir pour s'inscrire lui-même."
9. **Submit button** — "✓ Ajouter à la file" — full-width, 52px height, accent background

### Appointment toggle component

```
┌─────────────────────┬─────────────────────┐
│ ≡ Sans rendez-vous  │ 📅 Avec rendez-vous │
└─────────────────────┴─────────────────────┘
```

- **Container:** `flex`, `background: --surface-alt`, `border-radius: --radius-sm`, `padding: 4px`, full width
- **Option button:** `flex: 1`, `height: 40px`, `border-radius: --radius-xs`, `font-size: 13px`, `font-weight: 600`
- **Active option:** `background: --surface`, `color: --text-primary`, `box-shadow: --shadow-sm`
- **Inactive option:** `background: transparent`, `color: --text-tertiary`
- **Transition:** 0.2s on background and color
- Default: "Sans rendez-vous" is active, time field hidden
- Tapping "Avec rendez-vous" activates it and reveals the time field with a slide-down animation

### Phone input anatomy

```
┌────────┐ ┌─────────────────────┐
│  +216  │ │ XX XXX XXX          │
└────────┘ └─────────────────────┘
ⓘ Permet d'appeler le patient...
```

- **Prefix block:** `height: 48px`, `background: --surface-alt`, `border: 1.5px solid --border`, non-editable
- **Number input:** `flex: 1`, `height: 48px`, `inputmode: numeric`, placeholder "XX XXX XXX"
- **Hint line:** `font-size: 12px`, `color: --text-tertiary`, info icon (14px) + text

### What happens after submit

Tapping "Ajouter à la file" transitions to Screen C (Confirmation). The sheet content cross-fades or replaces in-place.

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "Ajouter patient" tab. All form components, spacing, colors, and the appointment toggle are visible.

---

## 7. Screen C: Confirmation (Post-Add)

**Source:** `blesaf-mobile-redesign.html` → tab "Confirmation"

**What it shows:** After successfully adding a patient, the sheet transforms to show a success confirmation and — critically — offers ways to link a phoneless patient to their queue position.

### Sheet content (top to bottom)

1. **Handle** — same as add sheet
2. **Confirmation card** — centered, accent-light background:
   - Green check circle: `48px × 48px`, accent background, white `check_circle` icon (**filled**, FILL 1), 28px
   - Patient name: "Mme Haddad" (18px, 700)
   - Position info: "Position #9 · Attente estimée ~2h" (14px, accent color, 600 weight)
3. **Conditional section (phoneless patients only):**
   - Label: "Aucun numéro renseigné. Pour lier la patiente :" (13px, 600, secondary color)
   - Three action cards (dashed border):

| Card | Icon Color | Icon | Title | Description |
|------|-----------|------|-------|-------------|
| QR Code | accent | `qr_code_2` | "Montrer le QR code" | "La patiente scanne pour suivre sa position" |
| SMS | green | `sms` | "Envoyer le lien par SMS" | "Saisir le numéro et envoyer le lien de suivi" |
| Phone | blue | `phone` | "Ajouter le numéro plus tard" | "Via le menu du patient dans la file" |

4. **Return button** — "Terminé — Retour à la file" — full-width, `--surface-alt` background, `--text-secondary` text

### Action card anatomy (link-share-card)

```
┌─ dashed border ────────────────────────────────────┐
│ [colored icon]  Title text               [chevron]  │
│                 Description text                     │
└────────────────────────────────────────────────────┘
```

- **Container:** `padding: 14px 16px`, `background: --bg`, `border: 1.5px dashed --border`, `border-radius: --radius-sm`, `margin-bottom: 10px`
- **Icon block:** `40px × 40px`, `border-radius: 10px`, colored background matching type
- **Active state:** `:active` changes background to `--surface-alt` and border to accent
- **Chevron:** `chevron_right` icon, 18px, tertiary color

### If the patient HAS a phone

The phoneless section and action cards are hidden. The confirmation card appears alone with a simpler success message, then auto-dismisses after ~2s or the receptionist taps "Terminé".

### Background state change

While the confirmation sheet is visible, the stats strip behind it updates: "En attente" count increments (8 → 9), "Fin estimée" adjusts (~18:45 → ~19:05).

→ **Pixel reference:** `blesaf-mobile-redesign.html` → "Confirmation" tab. Shows the full phoneless variant with all 3 action cards.

---

## 8. Screen D: Matin (Pre-Open Morning)

**Source:** `blesaf-mobile-redesign-v2.html` → tab "☀️ Matin"

**What it shows:** The first thing the receptionist sees when she opens the app in the morning. The queue hasn't opened yet. Some patients may have pre-registered via QR code overnight.

### Content stack (top to bottom)

1. **Status bar**
2. **Header** — clinic name + lang toggle + status pill ("Non ouverte" — gray, hollow)
3. **No stats strip** (queue isn't open yet — no numbers to show)
4. **No quick-add bar** (can't add patients before opening)
5. **Morning welcome card:**

```
┌───────────────────────────────────────────┐
│ ☀️                                         │
│ Bonjour, Dr. Jebali                       │
│ Votre journée va commencer                │
│                                           │
│ [👥 3 patients pré-inscrits]   ← accent pill│
└───────────────────────────────────────────┘
```

   - **Container:** `margin: 0 20px`, `background: --surface`, `border-radius: --radius`, `padding: 24px 20px`, `border: 1px solid --border`
   - **Emoji:** ☀️, displayed at natural size
   - **Title:** "Bonjour, Dr. {lastName}" — 20px, 700 weight
   - **Subtitle:** "Votre journée va commencer" — 14px, 400, secondary color
   - **Pre-registered badge:** Accent pill with group icon + "3 patients pré-inscrits" — only shown if count > 0

6. **Section header** — "PRÉ-INSCRITS" (only if pre-registered patients exist)
7. **Pre-registered list** — Same layout as queue list BUT:
   - **All position circles use accent styling** (not just #1) — differentiates from regular queue
   - **Detail line format:** "📱 Inscrit(e) à {time}" — showing registration time, not wait time
   - **No wait-time dots** (they haven't started waiting yet)
   - **No action buttons** (can't call patients before queue opens)

8. **Floating CTA** — green variant: "Ouvrir la file" with `arrow_forward` icon
   - `background: --green` (not accent) — deliberately different to signal "this starts the day"

### Pre-registered patient format

```
[1]  Ahmed Ben Salah
     📱 Inscrit(e) à 08:04
```

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` → "☀️ Matin" tab. The morning card and pre-registered list are fully rendered.

---

## 9. Screen E: Ouverte (Open Queue with Lifecycle)

**Source:** `blesaf-mobile-redesign-v2.html` → tab "🟢 Ouverte"

**What it shows:** The active queue after the receptionist tapped "Ouvrir la file". This is structurally the same as Screen A (File d'attente) but adds the lifecycle layer.

### Differences from Screen A

| Feature | Screen A (v1) | Screen E (v2) |
|---------|--------------|---------------|
| Status indicator | Doctor presence toggle (green "Présent" pill) | **Status pill** (green "Ouvert") — tappable |
| Tapping status | Toggles doctor present/absent | Opens status control bottom sheet |
| Doctor presence | In header | Moved inside the bottom sheet |
| Lifecycle controls | None | Full open/close/reopen via bottom sheet |

### Status pill behavior

The green "Ouvert" pill in the header is **tappable**. Tapping it opens the **Status Control Bottom Sheet** (see [Section 13.1](#131-status-control-bottom-sheet)) which contains:
- Queue status indicator ("File ouverte depuis 08:50")
- "Fermer la file" button (amber) — transitions to CLOSING
- Doctor presence toggles (Présent / Absent)

### Everything else

The queue list, current patient card, stats strip, quick-add bar, floating CTA, and section headers are identical to Screen A. Use Screen A's mock for the detailed pixel reference of queue items.

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` → "🟢 Ouverte" tab for the status pill and sheet. `blesaf-mobile-redesign.html` → "File d'attente" for the complete queue list with all patient states.

---

## 10. Screen F: Fermeture (Closing / Draining)

**Source:** `blesaf-mobile-redesign-v2.html` → tab "🟡 Fermeture"

**What it shows:** The receptionist closed the queue — no new patients can join. Remaining patients are still being seen. The UI shifts to an amber-tinted "winding down" mode.

### What changes from OPEN

| Element | OPEN | CLOSING |
|---------|------|---------|
| Status pill | Green "Ouvert" | Amber "Fermeture…" with **pulsing dot** |
| Quick-add bar | Visible | **Replaced by closing banner** |
| Stats label #1 | "En attente" | **"Restants"** |
| Section header | "FILE D'ATTENTE" | **"RESTANTS"** |
| Floating CTA | Still "Appeler Suivant" | Same — still calling patients |
| Bottom sheet (pill tap) | OPEN variant | **CLOSING variant** (with "Rouvrir" button) |

### Closing banner (replaces quick-add bar)

```
┌────────── amber-light bg ─────────────────┐
│ ⓘ File fermée — plus de nouveaux patients │
└───────────────────────────────────────────┘
```

- **Container:** `margin: 0 20px`, `background: --amber-light`, `border: 1px solid rgba(212,146,11,0.15)`, `border-radius: --radius-sm`, `padding: 12px 16px`
- **Icon:** `info` (18px), amber color
- **Text:** 13px, 600 weight, amber color
- **Layout:** `flex`, `gap: 10px`, `align-center`

### Everything else stays

The queue list continues to show remaining patients. Current patient card shows if someone's in consultation. Floating CTA remains "Appeler Suivant" — the receptionist keeps calling patients until the list is empty.

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` → "🟡 Fermeture" tab. The amber banner, pulsing pill, and "Restants" labels are all visible.

---

## 11. Screen G: File vidée (All Done)

**Source:** `blesaf-mobile-redesign-v2.html` → tab "✅ File vidée"

**What it shows:** The queue was closing, and now the last patient has been seen. The screen presents a decision: end the day or reopen.

### Important: this is NOT a new queue state in the data model

In the state machine, this is still `CLOSING`. The UI detects that `queue.length === 0` while in CLOSING and shows this card instead of the empty queue list. The pill stays amber "Fermeture…".

### Content stack

1. **Header** with amber pill (still "Fermeture…")
2. **No stats strip** (nothing to count)
3. **No quick-add** (queue is closed)
4. **All-done card:**

```
┌──────────────────────────────────────────┐
│              ✅ (green circle)            │
│    Tous les patients ont été vus          │
│                                          │
│  [27 patients] [14min att.] [8min cons.] │
│                                          │
│  ┌───── accent, full width ─────────┐    │
│  │  Terminer la journée             │    │
│  └──────────────────────────────────┘    │
│  ┌───── outline, full width ────────┐    │
│  │  Rouvrir la file                 │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

- **Green check circle:** `56px × 56px`, `background: --green`, white `check_circle` icon (**filled**, FILL 1)
- **Title:** "Tous les patients ont été vus" — 18px, 700, primary
- **Summary stats row:** 3 mini-chips showing day totals (patients, avg wait, avg consult)
- **Primary action:** "Terminer la journée" — accent background, white text, `--shadow-float`
- **Secondary action:** "Rouvrir la file" — outline button, `border: 1.5px solid --border`, secondary text

### No floating CTA

This screen doesn't have the floating CTA — the action buttons are embedded in the card.

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` → "✅ File vidée" tab.

---

## 12. Screen H: Résumé (End-of-Day Summary)

**Source:** `blesaf-mobile-redesign-v2.html` → tab "📊 Résumé"
**Also visible (simpler version):** `blesaf-mobile-redesign.html` → tab "Résumé du jour"

**What it shows:** The day is over. A shareable summary card showing how many patients were seen, average times, and a visual timeline. Both mocks show this screen; v2 has the more complete version with status pill and lifecycle context.

### Content stack

1. **Header** with gray "Terminée" pill (no dot, not tappable)
2. **Summary card** — the hero. Designed to be **screenshot-friendly** (self-contained visual):

```
┌── white card, 20px border-radius ────────────────┐
│ ┌── gradient hero (accent → dark accent) ──────┐ │
│ │ Lundi 16 Février 2026                     ○  │ │
│ │ Dr. Karim Jebali                             │ │
│ │ Cabinet d'Ophtalmologie · El Menzah          │ │
│ │                                              │ │
│ │ 27 patients vus                              │ │
│ └──────────────────────────────────────────────┘ │
│ ┌─────────────┬──────────────┐                   │
│ │   14 min    │    8 min     │                   │
│ │ Attente moy.│ Consult. moy.│                   │
│ ├─────────────┼──────────────┤                   │
│ │    08:45    │    18:42     │                   │
│ │ Premier pt. │ Dernier pt.  │                   │
│ └─────────────┴──────────────┘                   │
│                                                  │
│ [B] BleSaf              [Partager]               │
└──────────────────────────────────────────────────┘
```

- **Hero gradient:** `linear-gradient(135deg, --accent 0%, #0A5C50 100%)`
- **Decorative circle:** `::before`, `160px × 160px`, `top: -40px`, `right: -20px`, `rgba(255,255,255,0.06)`
- **Big number:** 56px, 700 weight, -0.04em tracking
- **Stats grid:** `grid-template-columns: 1fr 1fr`, `gap: 1px`, `background: --border` (creates grid lines between cells)
- **Footer:** BleSaf brand mark (20px accent square with "B") + "Partager" pill button

3. **Timeline bar:**

```
┌─────────────────────────────────────┐
│ ACTIVITÉ DE LA JOURNÉE              │
│                                     │
│ [=== 9 pts ===][─][===== 18 pts ===]│
│ 8:45      Pause 12h-14h       18:42 │
└─────────────────────────────────────┘
```

- **Container:** `--surface` background, `--radius` border-radius, `border: 1px solid --border`, `--shadow-sm`
- **Bar segments:** `height: 32px`, flex proportions (morning:lunch:afternoon = 3:1:4)
- **Morning:** accent at 0.6 opacity
- **Lunch:** surface-alt, tertiary text "—"
- **Afternoon:** accent at full opacity
- **Labels below:** `font-size: 11px`, `color: --text-tertiary`

4. **Action bar:**

```
┌────────────────┐  ┌────────────────┐
│  ↓ Exporter    │  │ → Nlle journée │
└────────────────┘  └────────────────┘
```

- Two buttons, `flex: 1`, `height: 48px`, `border-radius: --radius`
- "Exporter": outline (surface bg, border)
- "Nouvelle journée": accent bg, white text

→ **Pixel reference:** `blesaf-mobile-redesign-v2.html` → "📊 Résumé" tab (complete version with header). `blesaf-mobile-redesign.html` → "Résumé du jour" tab (card + timeline + actions, without lifecycle header).

---

## 13. Bottom Sheets

### 13.1 Status Control Bottom Sheet

**Source:** `blesaf-mobile-redesign-v2.html` → tap the status pill on "🟢 Ouverte" or "🟡 Fermeture" tabs.

Opens when the receptionist taps the status pill. Contains lifecycle controls.

**Shared structure:**
- Overlay: `rgba(0,0,0,0.3)`, fade in 0.3s
- Panel: `border-radius: 20px 20px 0 0`, `padding: 8px 20px 36px`, spring animation `cubic-bezier(0.32, 0.72, 0, 1)` over 0.35s
- Handle: `36px × 4px`, `--border` color, centered

**OPEN variant:**
- Status indicator: green dot + "File ouverte depuis {time}"
- Action: amber "Fermer la file" button + helper text "Les patients restants seront vus"
- Doctor toggles: Présent (green, check_circle filled) / Absent (red, cancel filled)

**CLOSING variant:**
- Status indicator: amber pulsing dot + "File en cours de fermeture"
- Action: green "Rouvrir la file" button
- Doctor toggles: same as OPEN

### 13.2 Patient Context Bottom Sheet

**Source:** `blesaf-mobile-redesign.html` — referenced in the v1 mock structure but shown implicitly through the `more_vert` buttons.

Opens when the receptionist long-presses or taps the `⋮` (more_vert) button on a queue item.

**Contains action rows:**

| Icon Color | Icon | Label | Description |
|-----------|------|-------|-------------|
| amber | `priority_high` | "Marquer prioritaire" | "Remonter dans la file" |
| blue | `directions_walk` | "Marquer sorti" | "Parti temporairement" |
| green | `phone` | "Appeler le patient" | "Appel téléphonique" |
| red | `person_remove` | "Retirer de la file" | "Supprimer définitivement" |

Each action row: `padding: 14px 12px`, icon in `40px × 40px` colored square, label (15px 600) + desc (12px tertiary).

### 13.3 Add Patient Bottom Sheet

This is Screen B — documented in [Section 6](#6-screen-b-ajouter-patient-add-patient-sheet). It slides up from the quick-add bar interaction.

### 13.4 Confirmation Bottom Sheet

This is Screen C — documented in [Section 7](#7-screen-c-confirmation-post-add). It replaces the add sheet content after submission.

---

## 14. Queue Lifecycle State Machine

```
                  ┌──────────────────────────────────┐
                  │                                  │
                  ▼                                  │
PRE_OPEN ──→ OPEN ──→ CLOSING ──→ CLOSED            │
                ▲          │                         │
                │          │ (queue empties           │
                │          │  + "Rouvrir")            │
                └──────────┘                         │
                                                     │
                               (queue empties         │
                                + "Terminer")─────────┘
```

| Action | From | To | What changes |
|--------|------|----|-------------|
| Tap "Ouvrir la file" | PRE_OPEN | OPEN | Morning card disappears. Stats strip, quick-add, queue list appear. Pre-registered patients become active queue. CTA: green → accent. Pill: gray → green. |
| Tap "Fermer la file" (in sheet) | OPEN | CLOSING | Quick-add → amber banner. Labels: "En attente" → "Restants". Pill: green → amber pulsing. |
| Tap "Rouvrir la file" (in sheet) | CLOSING | OPEN | Reverse of close. New session created. |
| Last patient seen | CLOSING | CLOSING (UI: all-done) | Queue list → all-done card. No floating CTA. "Terminer" / "Rouvrir" buttons in card. |
| Tap "Terminer la journée" | CLOSING (empty) | CLOSED | Summary screen appears. Pill: amber → gray "Terminée". |
| Tap "Nouvelle journée" | CLOSED | PRE_OPEN | Full reset to morning screen. |

---

## 15. User Flows

### 15.1 Morning Flow (Arrival → First Patient)

```
Receptionist opens app
  → Sees Screen D (Matin): "Bonjour, Dr. Jebali" + 3 pre-registered patients
  → Taps "Ouvrir la file"
  → Screen transitions to Screen E (Ouverte)
  → Pre-registered patients now appear in queue list
  → First walk-in arrives: receptionist types name in quick-add
  → Taps person_add button
  → Screen B (Ajouter patient) slides up
  → She optionally adds phone number, taps "Ajouter à la file"
  → Screen C (Confirmation) appears with QR fallback options
  → She taps "Terminé — Retour à la file"
  → Back to Screen E with updated queue
```

### 15.2 Steady State (Middle of Day)

```
Queue is OPEN, 8 patients waiting
  → Receptionist taps "Appeler Suivant · Fatma K."
  → Fatma's row disappears, next patient becomes #1
  → Current patient card updates (if doctor started consultation)
  → New patient walks in → quick-add → Screen B → Screen C → back
  → Patient calls saying they'll be late → tap ⋮ → "Marquer sorti" → blue badge appears
  → Elderly patient arrives → tap ⋮ → "Marquer prioritaire" → amber badge, reordered
```

### 15.3 End of Day Flow

```
Last few patients remaining
  → Receptionist taps green "Ouvert" pill
  → Status sheet opens
  → She taps "Fermer la file"
  → Screen transitions to Screen F (Fermeture)
  → Amber banner: "File fermée — plus de nouveaux patients"
  → She continues calling remaining patients via CTA
  → Last patient finishes consultation
  → Screen transitions to Screen G (File vidée)
  → All-done card: "Tous les patients ont été vus"
  → She taps "Terminer la journée"
  → Screen transitions to Screen H (Résumé)
  → She screenshots the summary card and shares it on WhatsApp
  → Done for the day
```

### 15.4 Reopen Flow (Unexpected Late Patient)

```
Queue is closing, 2 patients left
  → Doctor says "I can see one more"
  → Receptionist taps amber "Fermeture…" pill
  → Status sheet opens with "Rouvrir la file"
  → She taps "Rouvrir la file"
  → Screen transitions back to Screen E (Ouverte)
  → Quick-add bar reappears
  → She adds the late patient
```

---

## 16. Element Visibility Matrix

| Element | PRE_OPEN (D) | OPEN (E) | CLOSING (F) | CLOSING empty (G) | CLOSED (H) |
|---------|:----:|:----:|:----:|:----:|:----:|
| Status pill | ✅ gray | ✅ green (tappable) | ✅ amber pulsing (tappable) | ✅ amber pulsing (tappable) | ✅ gray "Terminée" |
| Stats strip | ❌ | ✅ | ✅ (label changes) | ❌ | ❌ |
| Quick-add bar | ❌ | ✅ | ❌ | ❌ | ❌ |
| Closing banner | ❌ | ❌ | ✅ | ❌ | ❌ |
| Morning welcome card | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pre-registered list | ✅ (if any) | ❌ | ❌ | ❌ | ❌ |
| Current patient card | ❌ | ✅ (if in consult) | ✅ (if in consult) | ❌ | ❌ |
| Queue list | ❌ | ✅ | ✅ | ❌ | ❌ |
| All-done card | ❌ | ❌ | ❌ | ✅ | ❌ |
| Summary card + timeline | ❌ | ❌ | ❌ | ❌ | ✅ |
| Floating CTA | ✅ green "Ouvrir" | ✅ accent "Appeler" | ✅ accent "Appeler" | ❌ | ❌ |
| Bottom sheet (pill tap) | ❌ | ✅ OPEN variant | ✅ CLOSING variant | ✅ CLOSING variant | ❌ |
| Add patient sheet | ❌ | ✅ (on demand) | ❌ | ❌ | ❌ |
| Confirmation sheet | ❌ | ✅ (after add) | ❌ | ❌ | ❌ |

---

## 17. Animations

All animations are defined in both HTML mocks with identical CSS.

### 17.1 Entrance Stagger

```css
@keyframes slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Applied with 0.05s delays between elements. Used on PRE_OPEN screen elements and the OPEN queue list.

### 17.2 Bottom Sheet Spring

```css
transform: translateY(100%) → translateY(0)
transition: 0.35s cubic-bezier(0.32, 0.72, 0, 1)
```

Overlay fades in over 0.3s.

### 17.3 Button Press

- Large buttons: `transform: scale(0.97)` on `:active`
- Square icon buttons (quick-add, etc.): `transform: scale(0.94)` + darker background
- Small circular icon buttons: background color change only

### 17.4 Closing Pill Dot Pulse

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
animation: pulse-dot 1.5s ease infinite;
```

Only active in CLOSING state.

### 17.5 CTA Breathing Glow

```css
@keyframes pulse-cta {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
```

White overlay (`rgba(255,255,255,0.15)`) on accent CTA button, `3s ease-in-out infinite`.

### 17.6 Appointment Time Field Reveal

When toggling "Avec rendez-vous", the time field slides down:

```css
max-height: 0 → auto (via max-height transition or explicit height)
opacity: 0 → 1
transition: 0.3s ease
```

---

## 18. Data Requirements

### PRE_OPEN (Screen D)
```typescript
{
  clinicName: string;           // "Cabinet Dr. Jebali"
  doctorLastName: string;       // "Jebali"
  queueStatus: 'PRE_OPEN';
  preRegisteredPatients: Array<{
    id: string;
    name: string;
    position: number;
    registeredAt: Date;         // "08:04"
    hasPhone: boolean;
  }>;
}
```

### OPEN (Screens A, E + overlay B, C)
```typescript
{
  clinicName: string;
  queueStatus: 'OPEN';
  stats: {
    waiting: number;            // 8
    seen: number;               // 14
    estimatedEnd: string;       // "~18:45"
  };
  currentPatient: {             // null if no one in consultation
    name: string;
    arrivedAt: string;          // "16:30"
    consultingMinutes: number;  // 8
    hasPhone: boolean;
  } | null;
  queue: Array<{
    id: string;
    position: number;           // 1, 2, 3...
    name: string;
    waitMinutes: number;        // drives wait-dot color
    hasPhone: boolean;          // drives 📱 indicator + phone button state
    badge: 'priority' | 'stepped-out' | 'no-phone' | null;
    hasAppointment: boolean;
    appointmentTime: string | null;
  }>;
  nextPatientPreview: string;   // "Fatma K." — for CTA label
}
```

### Add Patient (Screen B)
```typescript
{
  patientName: string;          // pre-filled from quick-add
  predictedPosition: number;    // #9
  estimatedWait: string;        // "~2h"
  phoneNumber?: string;         // optional, +216 XXXXXXXX
  hasAppointment: boolean;      // toggle state
  appointmentTime?: string;     // "17:30" if hasAppointment
}
```

### Confirmation (Screen C)
```typescript
{
  patientName: string;          // "Mme Haddad"
  position: number;             // 9
  estimatedWait: string;        // "~2h"
  hasPhone: boolean;            // determines if fallback options show
}
```

### CLOSING (Screen F)
Same as OPEN but:
- `queueStatus: 'CLOSING'`
- `stats.waiting` label becomes "Restants"
- `queueClosedAt: Date` (for "File fermée depuis X min")

### CLOSING empty (Screen G)
```typescript
{
  queueStatus: 'CLOSING';
  queueEmpty: true;             // triggers all-done card
  daySummary: {
    totalPatients: number;      // 27
    avgWaitMinutes: number;     // 14
    avgConsultMinutes: number;  // 8
  };
}
```

### CLOSED (Screen H)
```typescript
{
  queueStatus: 'CLOSED';
  summary: {
    date: string;               // "Lundi 16 Février 2026"
    doctorName: string;         // "Dr. Karim Jebali"
    specialty: string;          // "Cabinet d'Ophtalmologie"
    location: string;           // "El Menzah"
    totalPatients: number;      // 27
    avgWaitMinutes: number;     // 14
    avgConsultMinutes: number;  // 8
    firstPatientTime: string;   // "08:45"
    lastPatientTime: string;    // "18:42"
    sessions: Array<{           // for timeline bar
      type: 'morning' | 'lunch' | 'afternoon';
      patients: number;
      flex: number;             // proportional width
    }>;
  };
}
```

---

## 19. Implementation Notes

### 19.1 Architecture

This is a **single React component** (`<ReceptionistDashboard />`) that conditionally renders based on `queueStatus`. It is NOT multiple pages with a router.

```
<ReceptionistDashboard>
  {status === 'PRE_OPEN'  && <PreOpenScreen />}
  {status === 'OPEN'      && <OpenScreen />}
  {status === 'CLOSING'   && (queueEmpty ? <AllDoneScreen /> : <ClosingScreen />)}
  {status === 'CLOSED'    && <SummaryScreen />}

  {/* Overlays (portaled or absolute positioned) */}
  {addSheetOpen            && <AddPatientSheet />}
  {confirmSheetOpen        && <ConfirmationSheet />}
  {statusSheetOpen         && <StatusControlSheet />}
  {contextSheetOpen        && <PatientContextSheet />}
</ReceptionistDashboard>
```

### 19.2 Mobile-first

Target: **375px width**. The component fills its container. No desktop breakpoints needed — this is phone-only.

### 19.3 Scrolling

The `phone-screen` container scrolls vertically with `padding-bottom: 100px` to clear the floating CTA. The floating CTA uses `position: absolute` with a gradient background that fades content beneath it.

### 19.4 RTL Support

The `عربي` toggle switches the entire UI to right-to-left. Use CSS logical properties (`margin-inline-start`, `padding-inline-end`) or Tailwind's native RTL utilities. The Arabic font (IBM Plex Sans Arabic) is already loaded.

### 19.5 Bottom Sheet Layering

Multiple sheets can theoretically be open, but in practice only one overlay is active at a time:
- The status sheet opens from the pill
- The add sheet opens from the quick-add button
- The context sheet opens from the ⋮ button on a queue item
- The confirmation sheet replaces the add sheet after submission

All sheets share the same overlay (`rgba(0,0,0,0.3)`) and the same spring animation curve.

### 19.6 Real-time Updates

The dashboard receives live updates via Socket.io:
- Patient positions shift when someone is called or removed
- Wait-time dots change color as time passes
- Stats strip numbers update (waiting count, seen count, estimated end)
- Current patient card appears/disappears as consultations start/end

### 19.7 The Summary Card is Shareable

The summary card (Screen H) is designed to be screenshot-friendly. The gradient hero + stats grid + BleSaf footer form a self-contained visual that looks good when shared on WhatsApp or social media. The "Partager" button triggers native share (Web Share API or fallback).

### 19.8 How to Use the HTML Mocks During Development

1. Open `blesaf-mobile-redesign.html` in Chrome at 375px width
2. Open `blesaf-mobile-redesign-v2.html` in a second tab at 375px width
3. Use the tab navigation in each mock to switch between screens
4. Open DevTools → Elements to inspect any component's exact CSS values
5. Your React output should be **visually indistinguishable** from the mock at 375px

Every design token, spacing value, border-radius, shadow, font-size, and color is embedded in the CSS of the HTML files. The mocks ARE the spec — this document explains the intent and connections between them.
