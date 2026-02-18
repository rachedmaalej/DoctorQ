# BleSaf Mobile Receptionist Dashboard — Developer Spec

> **Purpose of this document:** Provide every detail a developer needs to build the receptionist mobile dashboard exactly as designed in the `blesaf-mobile-redesign.html` mock. This is not a features list — it is a pixel-level construction manual. Read it top-to-bottom before writing any code.

---

## Table of Contents

1. [Design System (Tokens)](#1-design-system-tokens)
2. [Global Layout & Typography](#2-global-layout--typography)
3. [Shared Components](#3-shared-components)
4. [Screen 1 — PRE_OPEN (Morning)](#4-screen-1--pre_open-morning)
5. [Screen 2 — OPEN (Active Queue)](#5-screen-2--open-active-queue)
6. [Screen 3 — CLOSING (Draining Queue)](#6-screen-3--closing-draining-queue)
7. [Screen 4 — ALL_DONE (Queue Empty After Closing)](#7-screen-4--all_done-queue-empty-after-closing)
8. [Screen 5 — CLOSED (End-of-Day Summary)](#8-screen-5--closed-end-of-day-summary)
9. [Bottom Sheet — Status Control](#9-bottom-sheet--status-control)
10. [State Machine & Transitions](#10-state-machine--transitions)
11. [Element Visibility Matrix](#11-element-visibility-matrix)
12. [Animation & Motion](#12-animation--motion)
13. [Data Requirements Per Screen](#13-data-requirements-per-screen)
14. [Iconography Reference](#14-iconography-reference)

---

## 1. Design System (Tokens)

### 1.1 Color Palette

```
BACKGROUNDS
  --bg:           #F6F5F0    (warm off-white page background)
  --surface:      #FFFFFF    (card/input backgrounds)
  --surface-alt:  #F0EFEA    (muted surface, inactive chips, divider zones)
  --border:       #E8E6DF    (all borders, separators, inactive outlines)

TEXT
  --text-primary:   #1A1A1A  (headings, names, numbers)
  --text-secondary: #6B6960  (supporting labels, body copy)
  --text-tertiary:  #9E9B90  (meta info, placeholders, section headers)

BRAND / ACCENT (teal)
  --accent:       #0F7B6C    (primary actions, active states, brand elements)
  --accent-light: #E8F5F1    (accent chip backgrounds, subtle highlights)
  --accent-dark:  #0A5C50    (pressed/active state on accent buttons)

SEMANTIC COLORS
  --red:          #D94F3B    (long wait indicators, danger, destructive actions)
  --red-light:    #FDF0ED
  --amber:        #D4920B    (medium wait indicators, closing/warning states)
  --amber-light:  #FEF7E6
  --green:        #2D8B4E    (short wait indicators, open/success states)
  --green-light:  #EDF7F0
  --blue:         #3B7DD9    (informational badges like "Sorti")
  --blue-light:   #EDF3FC
```

### 1.2 Shadows

```
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.04)     (subtle card edges)
  --shadow-md:    0 4px 12px rgba(0,0,0,0.06)     (elevated cards like summary)
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.10)     (modals, sheets)
  --shadow-float: 0 6px 24px rgba(15,123,108,0.25) (floating CTA — tinted with accent)
```

### 1.3 Border Radii

```
  --radius:    12px   (cards, inputs, buttons, default)
  --radius-sm: 8px    (stat chips, smaller cards)
  --radius-xs: 6px    (timeline bar segments)
```

### 1.4 Typography

**Font stack:** `'DM Sans', 'IBM Plex Sans Arabic', sans-serif`

DM Sans is the primary Latin font. IBM Plex Sans Arabic handles Arabic glyphs (the language toggle button uses this as its primary font).

Google Fonts import:
```
DM Sans: weights 400, 500, 600, 700 (also italic 400)
IBM Plex Sans Arabic: weights 300, 400, 500, 600, 700
```

**Type scale (used in the mock):**

| Role | Size | Weight | Tracking | Transform | Color |
|------|------|--------|----------|-----------|-------|
| Clinic name | 17px | 700 | -0.02em | — | `--text-primary` |
| Current patient name | 20px | 700 | -0.02em | — | #fff |
| Stat chip value | 22px | 700 | -0.03em | — | `--text-primary` or `--accent` |
| Queue item name | 15px | 600 | — | — | `--text-primary` |
| Quick-add input | 15px | 400 | — | — | `--text-primary` |
| Section header | 13px | 600 | 0.06em | UPPERCASE | `--text-tertiary` |
| Stat chip label | 11px | 500 | 0.04em | UPPERCASE | `--text-tertiary` |
| Status pill text | 12px | 600 | — | — | varies by state |
| Badge text | 10px | 700 | 0.05em | UPPERCASE | varies by badge type |
| Lang toggle | 12px | 600 | — | — | `--text-secondary` |
| Queue item detail | 12px | 400 | — | — | `--text-tertiary` |
| CP label (above name) | 11px | 600 | 0.08em | UPPERCASE | #fff at 0.7 opacity |
| CP meta line | 13px | 400 | — | — | #fff at 0.7 opacity |
| Floating CTA text | 16px | 700 | — | — | #fff |
| Floating CTA next-name | 14px | 400 | — | — | #fff at 0.8 opacity |
| Morning card title | 20px | 700 | -0.02em | — | `--text-primary` |
| Morning card subtitle | 14px | 400 | — | — | `--text-secondary` |
| Summary hero title | 22px | 700 | -0.02em | — | #fff |
| Summary big number | 56px | 700 | -0.04em | — | #fff |

### 1.5 Icons

**Library:** Google Material Symbols Rounded

Import with variable axis:
```
opsz: 20..48, wght: 100..700, FILL: 0..1, GRAD: -50..200
```

Default rendering: outlined (FILL 0). Filled icons (FILL 1) are used selectively — see [Iconography Reference](#14-iconography-reference) for which icons use fill.

---

## 2. Global Layout & Typography

The dashboard is a mobile-first single-screen app. No page navigation — the entire view changes based on queue state.

- **Page background:** `--bg` (#F6F5F0)
- **Content padding:** horizontal `20px` from screen edge for most elements
- **Scrollable area:** the full phone screen scrolls vertically, with `padding-bottom: 100px` to clear the floating CTA
- **Scrollbar:** hidden (`-webkit-scrollbar: none`)
- **No horizontal overflow**
- **RTL support:** the app supports Arabic — the `عربي` toggle switches direction. IBM Plex Sans Arabic is loaded for this. Use Tailwind's native RTL or CSS logical properties.

---

## 3. Shared Components

These components appear across multiple screens. Build them once.

### 3.1 Header

Present on ALL five screens. Structure:

```
┌─────────────────────────────────────────────┐
│ [Clinic Name]              [عربي] [Status]  │
│                                             │
│ [Stat Chip] [Stat Chip] [Stat Chip]         │  ← only on OPEN / CLOSING
└─────────────────────────────────────────────┘
```

**Layout:**
- Outer container: `padding: 8px 20px 14px`, `flex-direction: column`, `gap: 12px`
- Top row: `flex`, `justify-content: space-between`, `align-items: center`
- Left: Clinic name text
- Right: `flex`, `gap: 8px`, `align-items: center` — contains lang toggle + status pill

**Clinic name:**
- `font-size: 17px`, `font-weight: 700`, `letter-spacing: -0.02em`, `color: --text-primary`

**Language toggle button:**
- `background: --surface`, `border: 1px solid --border`, `border-radius: 100px`
- `padding: 5px 12px`, `font-size: 12px`, `font-weight: 600`
- `color: --text-secondary`
- `font-family: 'IBM Plex Sans Arabic', sans-serif`
- Displays "عربي" in default (French) mode

### 3.2 Status Pill

The primary queue-state indicator. Sits in the header's top-right, next to the lang toggle. **Tapping it opens the Status Control Bottom Sheet** (see section 9).

**Shared structure:** `flex`, `align-items: center`, `gap: 6px`, `border-radius: 100px`, `padding: 5px 12px 5px 9px`, `font-size: 12px`, `font-weight: 600`, `cursor: pointer`, `border: 1px solid transparent`

Contains a dot (`.pill-dot`: `8px × 8px` circle) + text label.

**States:**

| State | Class | Background | Text Color | Border | Dot Color | Dot Animation | Label Text |
|-------|-------|-----------|-----------|--------|----------|--------------|-----------|
| PRE_OPEN | `.pre-open` | `--surface-alt` | `--text-tertiary` | `--border` | `--text-tertiary` at 0.4 opacity | none | "Pas ouvert" |
| OPEN | `.open` | `--green-light` | `--green` | `rgba(45,139,78,0.15)` | `--green` solid | none | "Ouvert" |
| CLOSING | `.closing` | `--amber-light` | `--amber` | `rgba(212,146,11,0.15)` | `--amber` solid | `pulse-dot` 1.5s ease infinite | "Fermeture…" |
| CLOSED | `.closed` | `--surface-alt` | `--text-tertiary` | `--border` | **no dot rendered** | none | "Terminée" |

**Pulse animation for closing dot:**
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

### 3.3 Stats Strip

A row of three equally-sized stat chips. Present on OPEN and CLOSING screens.

**Container:** `flex`, `gap: 8px`, full width within header (below the top row)

**Each chip:**
- `flex: 1`, `background: --surface`, `border: 1px solid --border`, `border-radius: --radius-sm` (8px)
- `padding: 10px 12px`, `text-align: center`
- `.value`: `font-size: 22px`, `font-weight: 700`, `line-height: 1`, `letter-spacing: -0.03em`, `color: --text-primary`
- `.label`: `font-size: 11px`, `font-weight: 500`, `margin-top: 3px`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `color: --text-tertiary`

**First chip highlighted** (`.highlight`):
- `background: --accent-light`, `border-color: rgba(15,123,108,0.15)`
- `.value` color overridden to `--accent`

**Content per state:**

| State | Chip 1 (highlighted) | Chip 2 | Chip 3 |
|-------|---------------------|--------|--------|
| OPEN | `{waitingCount}` / "En attente" | `{seenCount}` / "Vus" | `~{estimatedEndTime}` / "Fin estimée" |
| CLOSING | `{remainingCount}` / "Restants" | `{seenCount}` / "Vus" | `~{estimatedEndTime}` / "Fin estimée" |

Note the label change: "En attente" → "Restants" when closing. This is a deliberate language shift — "restants" (remaining) implies a countdown.

### 3.4 Quick-Add Bar

A text input + submit button row for adding patients inline (without opening a modal).

**Container:** `margin: 0 20px`, `flex`, `gap: 8px`, `align-items: center`

**Input:**
- `flex: 1`, `height: 48px`
- `background: --surface`, `border: 1.5px solid --border`, `border-radius: --radius` (12px)
- `padding: 0 16px`, `font-size: 15px`, `color: --text-primary`
- `placeholder: "Nom du patient..."`, placeholder color `--text-tertiary`
- On focus: `border-color: --accent`

**Submit button:**
- `width: 48px`, `height: 48px` (square), `border-radius: --radius` (12px)
- `background: --accent`, `color: #fff`, no border
- Centered icon: `person_add` at 22px
- `:active` state: `transform: scale(0.94)`, `background: --accent-dark`

**Visibility:** ONLY during OPEN state. Hidden in PRE_OPEN, CLOSING, and CLOSED.

### 3.5 Section Header

Simple uppercase label row used above content sections.

- `padding: 18px 20px 8px`, `flex`, `justify-content: space-between`, `align-items: center`
- Text: `font-size: 13px`, `font-weight: 600`, `color: --text-tertiary`, `text-transform: uppercase`, `letter-spacing: 0.06em`

### 3.6 Current Patient Card

Accent-colored card showing who the doctor is currently seeing.

**Container:**
- `margin: 0 20px`, `background: --accent`, `border-radius: --radius` (12px), `padding: 16px`
- `color: #fff`, `position: relative`, `overflow: hidden`
- **Decorative circle:** `::after` pseudo-element — `position: absolute`, `top: -30px`, `right: -30px`, `width: 100px`, `height: 100px`, `border-radius: 50%`, `background: rgba(255,255,255,0.07)`. Pure decoration.

**Content:**
- `.cp-label`: "Patient actuel" — `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `opacity: 0.7`, `margin-bottom: 6px`
- `.cp-name`: Patient full name — `font-size: 20px`, `font-weight: 700`, `letter-spacing: -0.02em`
- `.cp-meta`: "Arrivé à {time} · Consultation depuis {duration} min" — `font-size: 13px`, `opacity: 0.7`, `margin-top: 2px`
- `.cp-actions`: `flex`, `gap: 8px`, `margin-top: 14px`

**Action buttons inside card:**

Base button style: `height: 36px`, `padding: 0 14px`, `border-radius: 100px`, `border: 1.5px solid rgba(255,255,255,0.3)`, `background: rgba(255,255,255,0.1)`, `color: #fff`, `font-size: 13px`, `font-weight: 600`, icon at 16px. `:active` → `background: rgba(255,255,255,0.2)`.

Primary variant (`.primary`): `background: #fff`, `color: --accent`, `border-color: #fff`.

**Buttons present:**
1. Primary: `arrow_forward` icon + "Suivant" (calls next patient — main workflow shortcut)
2. Secondary: `phone` icon only (call current patient)

### 3.7 Queue List

The main waiting list. Each item is a row.

**Container:** `padding: 4px 20px`, `flex-direction: column`, `gap: 2px`

**Each queue item:**
- `flex`, `align-items: center`, `gap: 12px`, `padding: 12px 0`
- `border-bottom: 1px solid --border` (last item has no border)

**Item structure (left to right):**

1. **Position circle** (`.qi-position`):
   - `width: 28px`, `height: 28px`, `border-radius: 50%`
   - Default: `background: --surface-alt`, `color: --text-secondary`
   - **First item only:** `background: --accent-light`, `color: --accent`
   - `font-size: 13px`, `font-weight: 700`, centered text
   - Displays the queue position number (1, 2, 3…)

2. **Info block** (`.qi-info`):
   - `flex: 1`, `min-width: 0` (for text truncation)
   - **Name**: `font-size: 15px`, `font-weight: 600`, `color: --text-primary`, single line with ellipsis truncation
   - **Detail line**: `font-size: 12px`, `color: --text-tertiary`, `flex`, `align-items: center`, `gap: 6px`, `margin-top: 1px`
     - Contains a **wait-time dot** + wait time text + optional phone emoji (📱)

3. **Wait-time dot** (inside detail line):
   - `width: 7px`, `height: 7px`, `border-radius: 50%`
   - Color thresholds (implement these as business logic):
     - **Green** (`--green`): ≤ 20 minutes
     - **Amber** (`--amber`): 21–45 minutes
     - **Red** (`--red`): > 45 minutes

4. **Badge** (optional, between info and actions):
   - `font-size: 10px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`
   - `padding: 3px 8px`, `border-radius: 100px`
   - Badge types:
     - `.priority`: `background: --amber-light`, `color: --amber` — text "Prioritaire"
     - `.stepped-out`: `background: --blue-light`, `color: --blue` — text "Sorti"
     - `.no-phone`: `background: --surface-alt`, `color: --text-tertiary`, `font-weight: 600` — text "Sans tél."

5. **Action buttons** (`.qi-actions`):
   - `flex`, `gap: 4px`
   - Each button: `width: 36px`, `height: 36px`, `border-radius: 50%`, no border, `background: transparent`, `color: --text-tertiary`, icon at 20px
   - `:active` → `background: --surface-alt`
   - `.disabled` class: `opacity: 0.2`, `pointer-events: none` (used on phone button when patient has no phone)
   - Two buttons per item:
     - `phone` icon (call/SMS patient) — disabled if no phone number
     - `more_vert` icon (overflow menu for move, remove, etc.)

### 3.8 Floating CTA

A full-width button pinned to the bottom of the screen. The most important action at any moment.

**Outer container:**
- `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`
- `padding: 12px 20px 32px` (extra bottom padding for safe area)
- `background: linear-gradient(to top, var(--bg) 60%, transparent)` — fades content beneath it
- `pointer-events: none` on container (so scroll works through gradient), `pointer-events: all` on button
- `z-index: 50`

**Button:**
- `width: 100%`, `height: 56px`, `border-radius: 16px`, `border: none`
- `font-size: 16px`, `font-weight: 700`, `color: #fff`
- `flex`, `align-items: center`, `justify-content: center`, `gap: 10px`
- Icon at 22px
- `:active` → `transform: scale(0.97)`

**Variants:**

| State | Class | Background | Shadow | Icon | Label |
|-------|-------|-----------|--------|------|-------|
| PRE_OPEN | `.green` | `--green` | `0 6px 24px rgba(45,139,78,0.3)` | `play_arrow` | "Ouvrir la file" |
| OPEN | `.accent` | `--accent` | `--shadow-float` | `arrow_forward` | "Appeler Suivant · {nextPatientFirstName} {lastInitial}." |
| CLOSING | `.accent` | `--accent` | `--shadow-float` | `arrow_forward` | "Appeler Suivant · {nextPatientFirstName} {lastInitial}." |
| CLOSED | — | — | — | — | **Hidden (do not render)** |

**Pulse glow on `.accent` variant:**
```css
.float-cta-btn.accent::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.15);
  border-radius: inherit;
  opacity: 0;
  animation: pulse-cta 3s ease-in-out infinite;
}
@keyframes pulse-cta {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
```

This is a subtle breathing glow that draws the eye to the primary action.

**Next-name portion:** The " · Fatma K." after "Appeler Suivant" uses: `font-weight: 400`, `opacity: 0.8`, `font-size: 14px`. It previews who will be called — reducing anxiety about pressing the wrong button.

---

## 4. Screen 1 — PRE_OPEN (Morning)

**When shown:** Queue day exists but hasn't been opened yet. This is the first screen the receptionist sees when opening the app in the morning.

**Why it exists:** Patients may have already scanned the clinic's QR code before the receptionist arrived. This screen acknowledges their presence and gives the receptionist a one-tap path to start the day.

### Layout (top to bottom)

1. **Header** — clinic name + `عربي` toggle + status pill in `pre-open` state ("Pas ouvert", gray)
   - **No stats strip** (day hasn't started — no data to show)

2. **Morning Welcome Card** — centered card with greeting + pre-registered count
3. **Section header** — "Pré-inscrits"
4. **Pre-registered patient list** — shows who checked in early
5. **Floating CTA** — "Ouvrir la file" (green variant)

### 4.1 Morning Welcome Card

**Container:**
- `margin: 20px 20px 0`, `background: --surface`, `border: 1px solid --border`
- `border-radius: --radius` (12px), `padding: 28px 24px`, `text-align: center`

**Content:**
- **Emoji:** "☀️" at `font-size: 36px`, `margin-bottom: 12px`
- **Title:** "Bonjour, Dr. {lastName}" — `font-size: 20px`, `font-weight: 700`, `color: --text-primary`, `letter-spacing: -0.02em`
- **Subtitle:** "Des patients se sont déjà pré-inscrits via le QR code en salle d'attente." — `font-size: 14px`, `color: --text-secondary`, `margin-top: 6px`, `line-height: 1.5`
- **Count badge:** inline-flex pill — `background: --accent-light`, `color: --accent`, `padding: 6px 14px`, `border-radius: 100px`, `font-size: 13px`, `font-weight: 700`, `margin-top: 16px`
  - Contains `group` icon (16px) + text "{count} patients pré-inscrits"

**Empty state (0 pre-registered):**
Same card but subtitle changes to "Aucun patient pré-inscrit." and the count badge is not rendered.

### 4.2 Pre-Registered Patient List

Simpler than the full queue list — no action buttons, no badges, no wait dots.

**Each item:**
- `flex`, `align-items: center`, `gap: 12px`, `padding: 12px 0`
- `border-bottom: 1px solid --border` (last item: none)

**Item structure:**
1. **Position circle:** same styling as queue list's first-item style — `background: --accent-light`, `color: --accent`, 28×28, text centered. ALL positions use this accent style (not just #1) because they're all "first" — they arrived before the queue opened.
2. **Info block:**
   - Name: `font-size: 15px`, `font-weight: 600`, `color: --text-primary`
   - Meta: `font-size: 12px`, `color: --text-tertiary`, `margin-top: 1px`
     - Format: "📱 Inscrit(e) à {time}" if self-check-in via phone, or "Inscrit(e) à {time}" if added by receptionist (no phone emoji)

### 4.3 Hidden Elements

- Stats strip: hidden
- Quick-add bar: hidden
- Current patient card: hidden
- Full queue list: hidden (pre-registered list shown instead)

---

## 5. Screen 2 — OPEN (Active Queue)

**When shown:** Receptionist has tapped "Ouvrir la file". Queue is accepting patients and doctor is seeing them.

**Why it exists:** This is the core working screen. 90% of the receptionist's time is spent here.

### Layout (top to bottom)

1. **Header** — clinic name + `عربي` + status pill in `open` state ("Ouvert", green). Tapping pill opens the bottom sheet.
2. **Stats strip** — 3 chips: waiting count (highlighted), seen count, estimated end time
3. **Quick-add bar** — text input + submit button
4. **Section header** — "En consultation"
5. **Current patient card** — accent card with patient name, time info, action buttons
6. **Section header** — "File d'attente"
7. **Queue list** — all waiting patients with position, name, wait time, badges, actions
8. **Floating CTA** — "Appeler Suivant · {name}" (accent variant with breathing glow)

All components are as described in Section 3. No unique elements on this screen — it's the composition of shared components.

### 5.1 Queue item ordering

Items are ordered by position number (1 = next to be called, ascending). The position number in the circle matches the display order.

### 5.2 Wait time display format

- Under 60 minutes: "{X} min" (e.g., "12 min", "41 min")
- 60 minutes and over: "{X}h{YY}" (e.g., "1h02", "1h24")
- The 📱 emoji appears after the time string when the patient has a phone number on file

---

## 6. Screen 3 — CLOSING (Draining Queue)

**When shown:** Receptionist tapped "Fermer la file" from the OPEN status sheet. Queue is no longer accepting new patients but the doctor is still seeing the remaining ones.

**Why it exists:** This is the wind-down state. The receptionist and doctor can see how many patients remain and estimate when they'll be done.

### Layout (top to bottom)

1. **Header** — status pill in `closing` state ("Fermeture…", amber with pulsing dot). Tapping opens the CLOSING variant of the bottom sheet.
2. **Stats strip** — 3 chips: **remaining** count (highlighted, label is "Restants" not "En attente"), seen count, estimated end time
3. **Closing banner** — amber info bar replacing the quick-add bar position
4. **Section header** — "En consultation"
5. **Current patient card** — same as OPEN screen
6. **Section header** — "Restants" (not "File d'attente")
7. **Queue list** — remaining patients only
8. **Floating CTA** — "Appeler Suivant · {name}" (same accent variant as OPEN)

### 6.1 Closing Banner

Replaces the quick-add bar (which is hidden in this state).

**Style:**
- `margin: 0 20px 8px`, `padding: 10px 14px`
- `background: --amber-light`, `border: 1px solid rgba(212,146,11,0.15)`
- `border-radius: --radius-sm` (8px)
- `flex`, `align-items: center`, `gap: 10px`
- `font-size: 13px`, `font-weight: 600`, `color: --amber`
- Icon: `info` at 18px
- Text: "File fermée — plus de nouveaux patients"

### 6.2 Section header label change

The section header above the queue list changes from "File d'attente" to "Restants" — reinforcing the countdown mental model.

---

## 7. Screen 4 — ALL_DONE (Queue Empty After Closing)

**When shown:** The queue reaches zero patients while in CLOSING state. The last patient has been seen.

**Why it exists:** This is the decision point. The receptionist chooses: end the day (generate summary) or reopen (it was just a lunch break). The screen is intentionally calm and congratulatory.

**Note:** This is NOT a separate queue state in the data model. The queue state is still CLOSING — this screen is a **UI-only view** triggered by `queueState === CLOSING && waitingCount === 0 && inConsultationCount === 0`.

### Layout (top to bottom)

1. **Header** — clinic name + status pill still showing `closing` ("Fermeture…" amber) — it hasn't been finalized yet
   - **No stats strip** (nothing to count)
2. **All-Done Card** — centered card with success state and two choices

### 7.1 All-Done Card

**Container:**
- `margin: 40px 20px 20px` (extra top margin to center vertically), `background: --surface`
- `border: 1px solid --border`, `border-radius: --radius` (12px)
- `padding: 32px 24px`, `text-align: center`

**Content:**

1. **Success icon circle:**
   - `width: 56px`, `height: 56px`, `border-radius: 50%`
   - `background: --green-light`, `color: --green`
   - Centered `check_circle` icon at 28px, **FILL 1** (filled)
   - `margin: 0 auto 16px`

2. **Title:** "Tous les patients ont été vus"
   - `font-size: 18px`, `font-weight: 700`, `color: --text-primary`

3. **Summary stats row:**
   - `flex`, `justify-content: center`, `gap: 24px`, `margin: 16px 0`
   - Three stat blocks, each:
     - `.ads-value`: `font-size: 24px`, `font-weight: 700`, `color: --accent`, `letter-spacing: -0.02em`
     - `.ads-label`: `font-size: 11px`, `color: --text-tertiary`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `margin-top: 2px`
   - Stats shown: `{totalPatients}` / "Patients", `{avgWait} min` / "Attente moy.", `{avgConsult} min` / "Consult. moy."

4. **Action buttons:**
   - `flex-direction: column`, `gap: 10px`, `margin-top: 20px`
   - Each button: `width: 100%`, `height: 52px`, `border-radius: --radius` (12px), `font-size: 15px`, `font-weight: 700`, `flex`, centered, `gap: 8px`

   **Primary** ("Terminer la journée"):
   - `background: --accent`, `border: none`, `color: #fff`, `box-shadow: --shadow-float`
   - Icon: `summarize` at 20px

   **Secondary** ("Rouvrir la file"):
   - `background: transparent`, `border: 1.5px solid --border`, `color: --text-secondary`
   - Icon: `refresh` at 20px

### 7.2 No Floating CTA

The floating CTA is NOT rendered on this screen. The action buttons are inside the card itself.

---

## 8. Screen 5 — CLOSED (End-of-Day Summary)

**When shown:** Receptionist tapped "Terminer la journée" from the All-Done screen. The day is finalized.

**Why it exists:** Provides a satisfying end-of-day wrap-up. The summary card is designed to be **shareable** — doctors post these in WhatsApp groups and on social media, which is organic marketing for BleSaf.

### Layout (top to bottom)

1. **Header** — status pill in `closed` state ("Terminée", gray, no dot)
   - **No stats strip**
2. **Summary Card** — the main shareable artifact
3. **Timeline Bar** — visual breakdown of the day's activity
4. **Action Bar** — export + new day buttons

### 8.1 Summary Card

A single elevated card with hero section + stats grid + footer.

**Outer container:** `margin: 20px`, `background: --surface`, `border-radius: 20px`, `overflow: hidden`, `box-shadow: --shadow-md`

**8.1.1 Hero Section:**
- `background: linear-gradient(135deg, --accent 0%, #0A5C50 100%)`
- `padding: 28px 24px 32px`, `color: #fff`
- `position: relative`, `overflow: hidden`
- **Decorative circle:** `::before` — `position: absolute`, `top: -40px`, `right: -20px`, `width: 160px`, `height: 160px`, `border-radius: 50%`, `background: rgba(255,255,255,0.06)`
- Content:
  - Date: `font-size: 13px`, `font-weight: 500`, `opacity: 0.7`, `margin-bottom: 4px` — format "Mardi 17 Février 2026"
  - Doctor name: `font-size: 22px`, `font-weight: 700`, `letter-spacing: -0.02em`
  - Clinic subtitle: `font-size: 14px`, `opacity: 0.7`, `margin-top: 2px` — "{specialty} · {location}"
  - Big number: `margin-top: 28px`, `flex`, `align-items: baseline`, `gap: 8px`
    - Number: `font-size: 56px`, `font-weight: 700`, `line-height: 1`, `letter-spacing: -0.04em`
    - Unit: `font-size: 18px`, `font-weight: 500`, `opacity: 0.7` — "patients vus"

**8.1.2 Stats Grid:**
- `display: grid`, `grid-template-columns: 1fr 1fr`, `gap: 1px`, `background: --border` (the 1px gap IS the border between cells)
- Each cell: `background: --surface`, `padding: 20px`, `text-align: center`
  - `.ss-value`: `font-size: 24px`, `font-weight: 700`, `color: --text-primary`, `letter-spacing: -0.02em`
  - `.ss-label`: `font-size: 12px`, `color: --text-tertiary`, `margin-top: 4px`
- Four cells (2×2 grid):
  - "14 min" / "Attente moyenne"
  - "8 min" / "Consultation moy."
  - "08:32" / "Premier patient"
  - "19:05" / "Dernier patient"

**8.1.3 Footer:**
- `padding: 16px 24px`, `flex`, `align-items: center`, `justify-content: space-between`
- Left: BleSaf branding — `flex`, `align-items: center`, `gap: 6px`
  - Brand mark: `20px × 20px` square, `background: --accent`, `border-radius: 5px`, centered white "B" at `font-size: 11px`, `font-weight: 800`
  - "BleSaf" text: `font-size: 13px`, `font-weight: 600`, `color: --text-tertiary`
- Right: Share button — `flex`, `align-items: center`, `gap: 6px`, `background: --accent`, `color: #fff`, `border-radius: 100px`, `padding: 10px 20px`, `font-size: 14px`, `font-weight: 600`
  - Icon: `share` at 18px

### 8.2 Timeline Bar

Shows the day's activity as a horizontal stacked bar with morning/lunch/afternoon segments.

**Container:** `margin: 0 20px 20px`, `background: --surface`, `border-radius: --radius` (12px), `padding: 18px 20px`, `box-shadow: --shadow-sm`, `border: 1px solid --border`

**Title:** "Activité de la journée" — section header style (`font-size: 13px`, `font-weight: 600`, `color: --text-tertiary`, `text-transform: uppercase`, `letter-spacing: 0.06em`, `margin-bottom: 14px`)

**Bar:**
- `height: 32px`, `background: --surface-alt`, `border-radius: --radius-xs` (6px), `flex`, `overflow: hidden`
- **Segments** are flex children with proportional `flex` values:
  - Morning: `background: --accent` at `opacity: 0.6`, text "{X} pts", `font-size: 10px`, `font-weight: 700`, `color: rgba(255,255,255,0.9)`
  - Lunch: `background: --surface-alt`, text "—", `color: --text-tertiary`
  - Afternoon: `background: --accent` (full opacity), text "{X} pts", same typography
- Flex proportions should be based on relative session duration (e.g., `flex: 3`, `flex: 1`, `flex: 4`)

**Labels below bar:**
- `flex`, `justify-content: space-between`, `margin-top: 6px`, `font-size: 11px`, `color: --text-tertiary`
- Left: start time, Center: "Pause {start}–{end}", Right: end time

### 8.3 Action Bar

Two buttons at the bottom of the summary.

**Container:** `padding: 0 20px 36px`, `flex`, `gap: 10px`

**Each button:**
- `flex: 1`, `height: 48px`, `border-radius: --radius` (12px)
- `font-size: 14px`, `font-weight: 600`
- `flex`, centered, `gap: 8px`
- Icon at 18px

**"Exporter" button (default):**
- `border: 1.5px solid --border`, `background: --surface`, `color: --text-secondary`
- Icon: `download`

**"Nouvelle journée" button (primary):**
- `background: --accent`, `border-color: --accent`, `color: #fff`
- Icon: `arrow_forward`

---

## 9. Bottom Sheet — Status Control

A bottom sheet that slides up when the user taps the status pill. Contains queue control actions + doctor presence toggle.

### 9.1 Overlay

- `position: absolute`, `inset: 0`, `background: rgba(0,0,0,0.3)`, `z-index: 99`
- Default: `opacity: 0`, `pointer-events: none`
- When open: `opacity: 1`, `pointer-events: all`
- Transition: `opacity 0.3s`
- Tapping overlay closes the sheet

### 9.2 Sheet Panel

- `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`
- `background: --surface`, `border-radius: 20px 20px 0 0`, `z-index: 100`
- `padding: 8px 20px 36px`
- `box-shadow: 0 -4px 32px rgba(0,0,0,0.12)`
- Default: `transform: translateY(100%)`
- When open: `transform: translateY(0)`
- Transition: `transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)` (spring-like ease)

**Handle:** `width: 36px`, `height: 4px`, `background: --border`, `border-radius: 100px`, `margin: 8px auto 16px`

### 9.3 Sheet Content — OPEN variant

Shown when queue is in OPEN state.

1. **Status indicator row:**
   - `flex`, `align-items: center`, `gap: 10px`, `padding: 12px 0 16px`, `border-bottom: 1px solid --border`, `margin-bottom: 16px`
   - Green dot: `width: 10px`, `height: 10px`, `border-radius: 50%`, `background: --green`
   - Text block:
     - Label: "File ouverte" — `font-size: 15px`, `font-weight: 700`, `color: --text-primary`
     - Meta: "Depuis {openedAt} · {addedCount} patients ajoutés" — `font-size: 12px`, `color: --text-tertiary`, `margin-top: 1px`

2. **Close queue button:**
   - Full-width, `height: 48px`, `border-radius: --radius`
   - `background: --amber-light`, `border: 1.5px solid rgba(212,146,11,0.15)`, `color: --amber`
   - `font-size: 15px`, `font-weight: 600`
   - Icon: `block` at 18px
   - Text: "Fermer la file"

3. **Helper text:** below button
   - `font-size: 12px`, `color: --text-tertiary`, `text-align: center`
   - "Les patients en attente seront vus, mais plus de nouveaux."

4. **Doctor presence section:**
   - Section label: "Présence du médecin" — `font-size: 11px`, `font-weight: 600`, `color: --text-tertiary`, `text-transform: uppercase`, `letter-spacing: 0.06em`, `margin: 16px 0 10px`, `padding-top: 12px`, `border-top: 1px solid --border`
   - Two toggle buttons in a row: `flex`, `gap: 8px`
     - Each: `flex: 1`, `height: 42px`, `border-radius: --radius-sm` (8px), `border: 1.5px solid --border`, `background: transparent`, `font-size: 13px`, `font-weight: 600`, `color: --text-tertiary`, centered, `gap: 6px`
     - Active state (`.active-green`): `background: --green-light`, `border-color: rgba(45,139,78,0.2)`, `color: --green`
     - "Présent" button: `check_circle` icon (FILL 1) + "Présent"
     - "Absent" button: `cancel` icon + "Absent"

### 9.4 Sheet Content — CLOSING variant

Shown when queue is in CLOSING state.

1. **Status indicator row:**
   - Amber dot (with pulse animation): `background: --amber`, `animation: pulse-dot 1.5s ease infinite`
   - Label: "File en cours de fermeture"
   - Meta: "{remainingCount} patients restants"

2. **Reopen button:**
   - `background: --green-light`, `border: 1.5px solid rgba(45,139,78,0.15)`, `color: --green`
   - Icon: `refresh` at 18px
   - Text: "Rouvrir la file"

3. **Helper text:**
   - "Accepter à nouveau des patients (ex : après pause)."

4. **Doctor presence section:** Same as OPEN variant.

---

## 10. State Machine & Transitions

```
                  ┌──────────────────────────────┐
                  │                              │
                  ▼                              │
PRE_OPEN ──→ OPEN ──→ CLOSING ──→ CLOSED        │
                ▲          │                     │
                │          │ (queue empty +       │
                │          │  "Rouvrir")          │
                └──────────┘                     │
                                                 │
                               (queue empty +     │
                                "Terminer")───────┘
```

| Trigger | From | To | UI Action |
|---------|------|-----|-----------|
| Receptionist taps "Ouvrir la file" | PRE_OPEN | OPEN | Pre-registered patients become active queue. Stats strip appears. Quick-add bar appears. CTA changes to "Appeler Suivant". |
| Receptionist taps "Fermer la file" in sheet | OPEN | CLOSING | Quick-add bar replaced by amber banner. Stats "En attente" → "Restants". Section header changes. Pill turns amber. |
| Receptionist taps "Rouvrir la file" in sheet | CLOSING | OPEN | Reverse of above. New session created in QueueDay. |
| Queue empties while CLOSING | CLOSING | (still CLOSING — UI changes) | Queue list disappears. All-Done card appears with "Terminer" / "Rouvrir" choices. |
| Receptionist taps "Terminer la journée" | CLOSING (empty) | CLOSED | Summary generated. Summary screen shown. |
| Receptionist taps "Nouvelle journée" | CLOSED | PRE_OPEN (next day) | Reset. Back to morning screen. |

---

## 11. Element Visibility Matrix

| Element | PRE_OPEN | OPEN | CLOSING | CLOSING (empty) | CLOSED |
|---------|----------|------|---------|-----------------|--------|
| Status pill | ✅ gray | ✅ green | ✅ amber pulsing | ✅ amber pulsing | ✅ gray "Terminée" |
| Stats strip | ❌ | ✅ | ✅ | ❌ | ❌ |
| Quick-add bar | ❌ | ✅ | ❌ | ❌ | ❌ |
| Closing banner | ❌ | ❌ | ✅ | ❌ | ❌ |
| Morning card | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pre-registered list | ✅ (if any) | ❌ | ❌ | ❌ | ❌ |
| Current patient card | ❌ | ✅ (if in consult) | ✅ (if in consult) | ❌ | ❌ |
| Queue list | ❌ | ✅ | ✅ | ❌ | ❌ |
| All-done card | ❌ | ❌ | ❌ | ✅ | ❌ |
| Summary card | ❌ | ❌ | ❌ | ❌ | ✅ |
| Timeline bar | ❌ | ❌ | ❌ | ❌ | ✅ |
| Action bar | ❌ | ❌ | ❌ | ❌ | ✅ |
| Floating CTA | ✅ "Ouvrir" | ✅ "Appeler" | ✅ "Appeler" | ❌ | ❌ |
| Bottom sheet (pill tap) | ❌ | ✅ OPEN variant | ✅ CLOSING variant | ✅ CLOSING variant | ❌ |

---

## 12. Animation & Motion

### 12.1 Entrance Animations

On initial screen load, elements cascade in with a stagger:

```css
@keyframes slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Apply with sequential delays: 0.05s, 0.1s, 0.15s, 0.2s, 0.25s, 0.3s for successive elements.

Used on: the PRE_OPEN morning screen elements (header, morning card, section header, list items).

### 12.2 Bottom Sheet

- Entry: `transform: translateY(100%) → translateY(0)`, `0.35s`, `cubic-bezier(0.32, 0.72, 0, 1)` — feels like a spring
- Overlay: `opacity: 0 → 1`, `0.3s ease`

### 12.3 Button Press Feedback

All tappable elements use `:active` transforms:
- Primary buttons: `transform: scale(0.97)`
- Square icon buttons: `transform: scale(0.94)` + background color change
- Small icon buttons: background color only

### 12.4 Status Pill Dot Pulse

Only on CLOSING state: the amber dot fades in/out at `1.5s ease infinite`.

### 12.5 Floating CTA Breathing Glow

The accent-variant CTA has a slow `3s ease-in-out infinite` glow using a white overlay `::after` pseudo-element.

---

## 13. Data Requirements Per Screen

### PRE_OPEN
```typescript
{
  clinicName: string;          // "Cabinet Dr. Jebali"
  doctorLastName: string;      // "Jebali" (for morning greeting)
  queueStatus: 'PRE_OPEN';
  preRegisteredPatients: Array<{
    id: string;
    name: string;
    position: number;
    registeredAt: Date;        // e.g. 08:04
    hasPhone: boolean;         // show 📱 emoji or not
  }>;
}
```

### OPEN
```typescript
{
  clinicName: string;
  queueStatus: 'OPEN';
  stats: {
    waitingCount: number;
    seenCount: number;
    estimatedEndTime: string;  // "~18:45"
  };
  currentPatient: {
    name: string;
    arrivedAt: string;         // "16:30"
    consultingSinceMinutes: number;
  } | null;
  queue: Array<{
    id: string;
    position: number;
    name: string;
    waitMinutes: number;
    hasPhone: boolean;
    badge: 'priority' | 'stepped-out' | 'no-phone' | null;
  }>;
  nextPatientPreview: string;  // "Fatma K." for floating CTA
  dayOpenedAt: string;         // "08:32" for bottom sheet
  totalAddedToday: number;     // for bottom sheet
  isDoctorPresent: boolean;
}
```

### CLOSING
```typescript
{
  // Same as OPEN, plus:
  queueStatus: 'CLOSING';
  stats: {
    remainingCount: number;    // replaces waitingCount
    seenCount: number;
    estimatedEndTime: string;
  };
}
```

### ALL_DONE (CLOSING with empty queue)
```typescript
{
  clinicName: string;
  queueStatus: 'CLOSING';     // still CLOSING in data model
  queueEmpty: true;
  daySummary: {
    totalPatients: number;
    avgWaitMinutes: number;
    avgConsultMinutes: number;
  };
}
```

### CLOSED (Summary)
```typescript
{
  clinicName: string;
  queueStatus: 'CLOSED';
  summary: {
    date: string;              // "Mardi 17 Février 2026"
    doctorFullName: string;    // "Dr. Karim Jebali"
    specialty: string;         // "Cabinet d'Ophtalmologie"
    location: string;          // "El Menzah"
    totalPatientsSeen: number;
    avgWaitMinutes: number;
    avgConsultMinutes: number;
    firstPatientTime: string;  // "08:32"
    lastPatientTime: string;   // "19:05"
    sessions: Array<{
      label: string;           // "morning" | "afternoon"
      patientCount: number;
      flexWeight: number;      // for timeline bar proportions
    }>;
    breakLabel: string;        // "Pause 12h–14h"
  };
}
```

---

## 14. Iconography Reference

All icons are from **Google Material Symbols Rounded**. Default: outlined (FILL 0). Filled (FILL 1) exceptions are marked.

| Usage | Icon Name | Size | FILL |
|-------|-----------|------|------|
| Quick-add submit | `person_add` | 22px | 0 |
| Next patient (CTA + CP card) | `arrow_forward` | 22px (CTA), 16px (card) | 0 |
| Call patient | `phone` | 20px (list), 16px (card) | 0 |
| Overflow menu | `more_vert` | 20px | 0 |
| Open queue CTA | `play_arrow` | 22px | 0 |
| Share summary | `share` | 18px | 0 |
| Export summary | `download` | 18px | 0 |
| New day | `arrow_forward` | 18px | 0 |
| All-done check | `check_circle` | 28px | **1** |
| End day button | `summarize` | 20px | 0 |
| Reopen queue | `refresh` | 20px / 18px | 0 |
| Close queue | `block` | 18px | 0 |
| Closing banner info | `info` | 18px | 0 |
| Doctor present | `check_circle` | 16px | **1** |
| Doctor absent | `cancel` | 16px | 0 |
| Pre-registered count | `group` | 16px | 0 |
| Status bar: signal | `signal_cellular_alt` | 16px | **1** |
| Status bar: wifi | `wifi` | 16px | **1** |
| Status bar: battery | `battery_full` / `battery_5_bar` / `battery_3_bar` / `battery_2_bar` | 16px | **1** |

---

## Implementation Notes

1. **This is a single-page view, not a router.** The "screen" changes are conditional renders based on `queueStatus` and `queueEmpty`. No URL changes needed for these views.

2. **The bottom sheet is a local UI state**, not a route. It opens/closes via a boolean toggle. The overlay and sheet share the open/close state.

3. **The floating CTA gradient** prevents content from being obscured behind the button. The gradient must be on the container, with `pointer-events: none` on the container and `pointer-events: all` on the button itself.

4. **The summary card is designed to be screenshot-friendly.** The card itself (hero + stats + footer) is a self-contained unit that looks good when screenshotted and shared on WhatsApp. The timeline and action bar are outside the card.

5. **Wait-time dot thresholds are configurable.** The mock uses green ≤20min, amber 21–45min, red >45min. These should be constants, not hardcoded.

6. **The pre-registered list uses accent-colored position circles for ALL items** (not just #1). This differentiates it from the normal queue list where only #1 is accent.

7. **Section header text changes by state.** "File d'attente" (OPEN) → "Restants" (CLOSING). Same component, different label.

8. **Stats chip label changes by state.** "En attente" (OPEN) → "Restants" (CLOSING). The highlighted first chip always shows the count of patients yet to be seen.

9. **The status pill is not tappable in PRE_OPEN or CLOSED states.** It only opens the bottom sheet during OPEN and CLOSING.

10. **Arabic RTL support:** When the language is switched to Arabic, the entire layout mirrors. Use CSS logical properties (`padding-inline-start` instead of `padding-left`, etc.) or Tailwind's built-in RTL utilities.
