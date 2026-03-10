# AuSuivant — UI Design Brief
## For Claude Code: Apply to All UI Components and Screens

> **This document is the single source of truth for all visual, typographic, spacing, and interaction decisions in the AuSuivant web application.**  
> Every component, screen, and state must conform to these guidelines.

---

## 1. Product Context & Design Philosophy

### Who Uses This App

AuSuivant has **two simultaneous users** whose needs must coexist in every UI decision:

**Primary User — La Secrétaire Médicale (Receptionist)**  
She works at the front desk of a French medical cabinet. Her day is a constant juggle: 20–60 incoming calls per day, patients arriving at the desk, the doctor running late, patients growing visibly impatient in the waiting room behind her. She is under chronic low-grade stress. She cannot afford to *think* about the interface — she needs to *see* what she needs in under 2 seconds and act in under 3 taps. She is often working on a desktop monitor or a dedicated tablet mounted at reception. She may have moderate digital literacy — she uses Doctolib, a dossier médical logiciel, and her phone. She is not a developer or power user.

**Secondary User — Le Patient en Salle d'Attente**  
He or she is sitting in the waiting room, often anxious (cardiology visit, ophthalmology exam, a sick child). They may be elderly, may have poor eyesight, and are glancing at a wall-mounted display from 3–4 meters away. They need one piece of information: *am I close to being called?* The display must be readable from across the room without effort.

### The Core Emotional Contract

The app must feel like a **trusted colleague, not a piece of software**. When the receptionist glances at it, she should feel: *"I know exactly what's happening. I'm in control."*  
When the patient looks at the display: *"I am not forgotten. I know where I stand."*

### Design Direction: "Cabinet Calme"

**One-sentence vision**: *The visual language of a high-end French pharmacy — precise, serene, authoritative, human.*

Think: the calm clarity of a well-run French *pharmacie*, the quiet confidence of SNCF design, the warmth of linen paper. Not a startup app. Not a hospital system. Not a tech company. A professional tool designed for care environments — elegant in its restraint, generous in its information hierarchy, soothing in its palette.

**Avoid at all costs**:  
- Doctolib's exact blue (#0070D1) — too associated with booking, wrong context  
- Purple gradients — generic SaaS look, no place here  
- Aggressive dashboard aesthetics — too "data center", too cold  
- Bouncy micro-animations — inappropriate for a stressed receptionist  
- Generic sans-serif + white card grids — indistinguishable from a hundred other SaaS apps  

---

## 2. Color System

### Philosophy
The palette is built on **teal as the anchor of trust**, **warm cream as the breathing ground**, and **amber as the single accent of urgency** — never red as a primary alert color (red in medical contexts triggers alarm disproportionate to the actual trigger). Red is reserved only for genuine system errors.

### Primary Colors

```css
/* Teal — The Brand Anchor */
--color-primary-900: #0D3D38;   /* Deepest: headers, logo mark */
--color-primary-700: #166B62;   /* Main interactive: primary buttons, active nav */
--color-primary-500: #1B8C80;   /* Default brand teal: key UI elements */
--color-primary-300: #5BB8AE;   /* Lighter: hover states, secondary elements */
--color-primary-100: #C8EAE7;   /* Pale: backgrounds of selected states, tags */
--color-primary-50:  #EBF7F6;   /* Near-white: subtle surface tints */
```

### Neutrals (Warm, Not Clinical)
```css
/* Warm whites and grays — avoid pure #FFFFFF and #F5F5F5 (too cold) */
--color-neutral-950: #1A1F1E;   /* Near-black: primary text */
--color-neutral-800: #2E3534;   /* Secondary text, icons */
--color-neutral-600: #5C6866;   /* Placeholder text, disabled labels */
--color-neutral-400: #98A8A6;   /* Borders, dividers */
--color-neutral-200: #D9E2E1;   /* Card borders, table lines */
--color-neutral-100: #EDF2F1;   /* Subtle backgrounds (hover rows) */
--color-neutral-50:  #F6F9F8;   /* Page background — warm off-white, NOT pure white */
--color-surface:     #FAFCFC;   /* Card/panel background — slightly cooler than page bg */
--color-white:       #FFFFFF;   /* Use sparingly: modal overlays, inverted text only */
```

### Semantic / Status Colors
```css
/* Status: used for patient queue states — deliberate, NOT traffic light cliché */
--color-status-waiting:     #5B8DB8;   /* Waiting — calm blue. Patient is in queue, no urgency */
--color-status-called:      #1B8C80;   /* Called — teal. It's their turn, positive action */
--color-status-consultation:#0D3D38;   /* In consultation — dark teal. Locked / in progress */
--color-status-late:        #D4860A;   /* Late / delay — amber. Attention without alarm */
--color-status-completed:   #98A8A6;   /* Completed — grey. Neutral, done, moved on */

/* Semantic system colors */
--color-success:  #1F7A4A;   /* Confirmed, saved, done */
--color-warning:  #D4860A;   /* Delay, attention required */
--color-error:    #C0392B;   /* System error ONLY — never for patient status */
--color-info:     #2F6FA8;   /* Informational tooltips, help text */
```

### Accent Color
```css
/* Amber — the only warm accent, used sparingly */
--color-accent-500: #E89B1A;   /* Primary accent: CTAs in highlighted states, badges */
--color-accent-100: #FDF0D5;   /* Accent background: highlighted card tints */
--color-accent-700: #A36B0A;   /* Accent text: on light amber backgrounds */
```

### Dark Mode (Waiting Room Display Mode)
```css
/* Patient-facing wall display uses a dark mode for readability from distance */
--display-bg:       #0F1918;   /* Deep dark teal-black */
--display-surface:  #162421;   /* Slightly lighter panels */
--display-border:   #2A3E3C;   /* Subtle panel borders */
--display-text:     #E8F2F1;   /* Primary text on dark */
--display-muted:    #7A9C99;   /* Secondary text */
--display-accent:   #4DD4C8;   /* Bright teal: highlighted patient number */
```

---

## 3. Typography

### Philosophy
The type system must work across two completely different contexts:
1. **Receptionist interface** (desktop/tablet, close reading, dense information, frequent updates)
2. **Patient display** (wall screen, reading from 3–5 meters, large numbers, low information density)

Use **two typefaces only**. Never add a third without explicit justification.

### Font Stack

**Display / Headings: `DM Serif Display`**
```
font-family: 'DM Serif Display', Georgia, serif;
```
- Used for: screen titles, waiting room display numbers, large stat headers
- Character: classical but contemporary, refined authority, distinctly French sensibility
- Import from Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');`

**UI / Body: `Sora`**
```
font-family: 'Sora', system-ui, sans-serif;
```
- Used for: all interface text — buttons, labels, tables, form fields, navigation, body copy
- Character: geometric but warm, excellent x-height for readability under stress, subtly distinct from the usual Inter/Roboto
- Import: `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`

**Monospace (numbers, IDs, timestamps): `JetBrains Mono`**
```
font-family: 'JetBrains Mono', 'Courier New', monospace;
```
- Used for: patient ticket numbers, queue positions, timestamps, any numeric data that must align in columns
- Import: `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');`

### Type Scale (Fluid, using rem)
```css
--text-xs:    0.75rem;    /* 12px — legal notes, footnotes */
--text-sm:    0.875rem;   /* 14px — secondary labels, help text */
--text-base:  1rem;       /* 16px — default body text, table rows */
--text-md:    1.125rem;   /* 18px — primary labels, card titles */
--text-lg:    1.25rem;    /* 20px — section headers */
--text-xl:    1.5rem;     /* 24px — page titles */
--text-2xl:   2rem;       /* 32px — dashboard metrics */
--text-3xl:   2.5rem;     /* 40px — hero numbers */
--text-display: 4rem;     /* 64px — patient-facing display number */
--text-display-xl: 6rem;  /* 96px — large wall display primary number */
```

### Font Weights
```css
--font-light:    300;   /* Decorative only, large sizes */
--font-regular:  400;   /* Body text, secondary labels */
--font-medium:   500;   /* Primary labels, navigation, buttons */
--font-semibold: 600;   /* Section headers, important values, CTAs */
--font-bold:     700;   /* Page titles, alert labels, display numbers */
```

### Line Heights
```css
--leading-tight:  1.2;   /* Headings, display text */
--leading-snug:   1.35;  /* Sub-headings, card titles */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed:1.7;   /* Long-form text, tooltips */
```

### Letter Spacing
```css
--tracking-tight:  -0.02em;  /* Large display headings */
--tracking-normal:  0;       /* Body text */
--tracking-wide:   0.05em;   /* ALL-CAPS labels, small tags */
--tracking-wider:  0.08em;   /* Status badges, category labels */
```

### Typography Rules
- **All-caps text** must use `--tracking-wider` and `--font-semibold`
- **Numbers in queue context** always use `JetBrains Mono` with tabular-nums
- **Never use italic for UI labels** — italic is reserved for DM Serif Display only
- **Minimum font size**: `--text-sm` for any interactive or important element; `--text-xs` only for truly supplementary information

---

## 4. Spacing & Layout

### Spacing Scale (4px base)
```css
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px — default component padding */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px — section padding */
--space-8:   2rem;      /* 32px — card padding, major gaps */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px — page section separators */
--space-16:  4rem;      /* 64px — major page sections */
--space-24:  6rem;      /* 96px — hero spacing */
```

### Grid & Layout
- **Receptionist dashboard**: 12-column grid, max-width 1400px, 32px gutters, 24px edge margins
- **Tablet (reception desk, 1024px)**: 8-column grid, 24px gutters
- **Patient display (landscape wall screen)**: 2-zone layout — left 35% for queue status, right 65% for now-serving hero
- **Sidebar navigation width**: 240px expanded, 72px collapsed (icon-only mode)
- **Content column max-width**: 960px for forms; 1200px for dashboards; unconstrained for display mode

### Border Radius
```css
--radius-sm:   4px;    /* Subtle: input fields, small badges */
--radius-md:   8px;    /* Default: cards, buttons, dropdowns */
--radius-lg:   12px;   /* Panels, modals */
--radius-xl:   16px;   /* Large cards, patient status tiles */
--radius-2xl:  24px;   /* Feature cards, display panels */
--radius-full: 9999px; /* Pills, avatar circles, toggle switches */
```

---

## 5. Component Specifications

### Navigation Sidebar
- Background: `--color-primary-900`
- Active item: `--color-primary-500` background, `--color-white` text
- Inactive item: `--color-primary-700` on hover, `rgba(255,255,255,0.6)` text at rest
- Logo lockup: DM Serif Display, `--color-white`, 20px
- Bottom section (user profile, settings): separated by a `1px` border at `rgba(255,255,255,0.15)`

### Top App Bar (receptionist view)
- Height: 64px
- Background: `--color-surface`
- Bottom border: `1px solid --color-neutral-200`
- Contains: breadcrumb (left), current date/time displayed in JetBrains Mono (center), doctor status indicators (right), user avatar
- Clock updates every second — use tabular-nums to prevent layout shift

### Patient Queue Card
Each patient in the queue is represented by a card:
```
┌─────────────────────────────────────────┐
│  [#] Ticket No.    [Status Badge]        │
│  Nom du patient                          │
│  Médecin · Heure RDV · Temps d'attente   │
│  [Action buttons: Appeler / Passer / ✕] │
└─────────────────────────────────────────┘
```
- Card background: `--color-surface`
- Border: `1px solid --color-neutral-200`
- Border-left: `4px solid [status color]` — the colored left stripe is the instant visual indicator
- Border-radius: `--radius-xl`
- Ticket number: JetBrains Mono, `--text-2xl`, `--font-bold`
- Patient name: Sora, `--text-md`, `--font-semibold`
- Secondary info: Sora, `--text-sm`, `--color-neutral-600`
- Hover state: `--color-neutral-100` background, subtle `box-shadow: 0 4px 12px rgba(27, 140, 128, 0.08)`

### Status Badges
Small pill labels on patient cards:
```css
/* Badge base */
padding: 3px 10px;
border-radius: var(--radius-full);
font-family: 'Sora';
font-size: var(--text-xs);
font-weight: var(--font-semibold);
letter-spacing: var(--tracking-wider);
text-transform: uppercase;

/* Per-status colors */
.badge-waiting      { background: #E8F0F8; color: #2F6FA8; }
.badge-called       { background: var(--color-primary-100); color: var(--color-primary-700); }
.badge-consultation { background: #E8F0EE; color: var(--color-primary-900); }
.badge-late         { background: var(--color-accent-100); color: var(--color-accent-700); }
.badge-completed    { background: var(--color-neutral-100); color: var(--color-neutral-600); }
```

### Buttons
```css
/* Primary Button — Main CTA (Appeler le patient, Confirmer) */
.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-white);
  font-family: 'Sora';
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  letter-spacing: 0.01em;
  transition: background 150ms ease, box-shadow 150ms ease;
}
.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: 0 4px 16px rgba(27, 107, 98, 0.3);
}

/* Secondary Button — Passive actions (Passer, Modifier) */
.btn-secondary {
  background: transparent;
  color: var(--color-primary-500);
  border: 1.5px solid var(--color-primary-300);
  /* Same padding/typography as primary */
}
.btn-secondary:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
}

/* Danger Button — Retirer, Annuler */
.btn-danger {
  background: transparent;
  color: var(--color-error);
  border: 1.5px solid rgba(192, 57, 43, 0.3);
}
.btn-danger:hover {
  background: rgba(192, 57, 43, 0.06);
  border-color: var(--color-error);
}

/* Ghost / Icon Button — for compact actions in table rows */
.btn-ghost {
  background: transparent;
  color: var(--color-neutral-600);
  border: none;
  padding: 6px 8px;
}
.btn-ghost:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-950);
}
```

### Form Inputs
```css
.input {
  background: var(--color-surface);
  border: 1.5px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: 'Sora';
  font-size: var(--text-base);
  color: var(--color-neutral-950);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(27, 140, 128, 0.12);
}
.input::placeholder { color: var(--color-neutral-500); }
.input-label {
  font-family: 'Sora';
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-neutral-800);
  margin-bottom: var(--space-2);
  letter-spacing: 0.01em;
}
```

### Stats / KPI Cards (receptionist dashboard)
```
┌──────────────────────────────┐
│  En attente                  │
│  [Large number]              │
│  [Trend indicator]           │
└──────────────────────────────┘
```
- Background: `--color-surface`
- Border: `1px solid --color-neutral-200`
- The metric number: DM Serif Display, `--text-3xl` or `--text-2xl`, `--font-bold`, `--color-primary-700`
- Label: Sora, `--text-sm`, `--font-medium`, `--color-neutral-600`, all-caps, `--tracking-wider`
- Trend indicator: small up/down arrow with color (green/amber) — never red for normal business trend

### Data Tables (patient list)
```css
.table-header {
  font-family: 'Sora';
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-neutral-600);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: var(--space-3) var(--space-4);
  border-bottom: 2px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}
.table-row {
  border-bottom: 1px solid var(--color-neutral-100);
  transition: background 100ms ease;
}
.table-row:hover { background: var(--color-primary-50); }
.table-row:last-child { border-bottom: none; }
.table-cell {
  font-family: 'Sora';
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-4);
  color: var(--color-neutral-950);
}
.table-cell-number {
  font-family: 'JetBrains Mono';
  font-variant-numeric: tabular-nums;
}
```

### Toast Notifications / Alerts
```css
/* Toasts appear top-right, stack downward, auto-dismiss after 5s */
.toast {
  background: var(--color-neutral-950);
  color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  font-family: 'Sora';
  font-size: var(--text-sm);
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  /* Colored left border by type */
  border-left: 4px solid var(--color-primary-500); /* success */
  /* or: var(--color-warning) for warning */
  /* or: var(--color-error) for error */
}
```

---

## 6. Patient-Facing Wall Display Screen

This is a completely separate screen mode (fullscreen, dark). It is projected/displayed on a wall-mounted TV or monitor in the waiting room.

### Layout (1920×1080 landscape)
```
┌────────────────────────────────────────────────────────────────┐
│  CABINET [Name]              [Clock in JetBrains Mono]         │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│   FILE D'ATTENTE         │     MAINTENANT APPELÉ               │
│                          │                                     │
│   #001 — Dr. Martin  ●   │     TICKET                          │
│   #002 — Dr. Lebrun  ●   │     [HUGE NUMBER]                   │
│   #003 — Dr. Martin  ◌   │     → Dr. Martin                   │
│   #004 — Dr. Lebrun  ◌   │     Salle 2                        │
│                          │                                     │
│   [4 patients en attente]│     [Votre numéro est prêt]        │
│                          │                                     │
└──────────────────────────┴─────────────────────────────────────┘
│  Merci de votre patience · Temps d'attente estimé : ~12 min    │
└────────────────────────────────────────────────────────────────┘
```

### Display Mode Specifics
- Background: `--display-bg` (`#0F1918`)
- Primary large number: DM Serif Display, `--text-display-xl`, `--display-accent` (`#4DD4C8`), bold
- "MAINTENANT APPELÉ" header: Sora, all-caps, `--tracking-wider`, `--font-semibold`, `--display-muted`
- Queue list items: Sora, `--text-xl`, `--display-text`
- Active item in queue: teal dot `●`, passive items: hollow dot `◌`
- Footer strip: `rgba(255,255,255,0.04)` background, smaller text
- When a patient is called: brief animation — the number "flies" from queue to center hero zone (CSS transform + opacity, 600ms ease-out). No sound unless explicitly enabled.

---

## 7. Iconography

### Icon Library: Lucide Icons
Use Lucide exclusively. Do not mix icon libraries.

Key icons by use:
- `Clock` — temps d'attente, horodatage
- `Users` — file d'attente, compteur patients
- `UserCheck` — patient appelé
- `ChevronRight` / `ArrowRight` — navigation, flow direction
- `Bell` / `BellRing` — notification, alerte
- `Calendar` — rendez-vous, planning
- `Stethoscope` — médecin (use sparingly — not in dense tables)
- `AlertCircle` — warning (amber)
- `CheckCircle2` — confirmation (green)
- `X` / `XCircle` — close, remove
- `Settings2` — configuration (not `Settings` gear — too generic)
- `LayoutDashboard` — tableau de bord
- `ListOrdered` — file d'attente vue liste

### Icon Sizing
```css
--icon-sm:  16px;   /* Inline with text, table cells */
--icon-md:  20px;   /* Buttons, nav items */
--icon-lg:  24px;   /* Standalone, card headers */
--icon-xl:  32px;   /* Empty states, feature callouts */
```

Icon stroke width: `1.5px` for `--icon-md` and above; `2px` only for `--icon-sm` (to maintain visibility).

---

## 8. Motion & Animation

### Principles
- **Purposeful, not decorative**: every animation must communicate state change, guide attention, or reduce perceived wait time
- **Calm**: durations lean longer than typical UI (200–500ms) — fast animations feel hectic, wrong for the medical context
- **No bouncing**: ease-out and ease-in-out only. Never `bounce` or `elastic` easings.

### Animation Tokens
```css
--duration-instant:  100ms;   /* Hover feedback, focus rings */
--duration-fast:     200ms;   /* Button press feedback, badge state change */
--duration-normal:   300ms;   /* Card transitions, dropdown open/close */
--duration-slow:     500ms;   /* Modal appear, page transition */
--duration-display:  600ms;   /* Patient-facing display number call animation */

--ease-default:   cubic-bezier(0.25, 0.1, 0.25, 1);   /* Smooth all-purpose */
--ease-out:       cubic-bezier(0.0, 0.0, 0.2, 1);     /* Elements entering */
--ease-in:        cubic-bezier(0.4, 0.0, 1, 1);       /* Elements leaving */
```

### Specific Animations

**Patient Called (most important moment in the app)**  
When the receptionist clicks "Appeler", two things happen simultaneously:
1. The patient card in the queue shifts from `--color-status-waiting` border to `--color-status-called` border + badge changes — `--duration-fast`
2. On the wall display, the number animates with a scale: `transform: scale(0.8) → scale(1)` + `opacity: 0 → 1` over `--duration-display`. The previously displayed number fades out simultaneously.

**Queue card reorder** (when a patient moves up): `transition: transform 350ms var(--ease-out)` on the list container. Cards slide smoothly, not jump.

**Page entry**: No flashy entrance. Simply `opacity: 0 → 1` over `200ms`. The content is what matters.

**Retard indicator pulse**: When a patient has been waiting beyond the expected time, the amber left-border of their card gently pulses — `animation: pulse-amber 3s ease-in-out infinite` at low opacity. Subtle, not alarming.
```css
@keyframes pulse-amber {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 134, 10, 0); }
  50%       { box-shadow: 0 0 0 4px rgba(212, 134, 10, 0.2); }
}
```

---

## 9. Surface & Depth

### Elevation System (shadows)
```css
--shadow-0: none;
--shadow-1: 0 1px 3px rgba(15, 25, 24, 0.06), 0 1px 2px rgba(15, 25, 24, 0.04);
--shadow-2: 0 4px 8px rgba(15, 25, 24, 0.07), 0 2px 4px rgba(15, 25, 24, 0.04);
--shadow-3: 0 8px 20px rgba(15, 25, 24, 0.09), 0 4px 8px rgba(15, 25, 24, 0.05);
--shadow-4: 0 16px 40px rgba(15, 25, 24, 0.12), 0 8px 16px rgba(15, 25, 24, 0.06);
--shadow-modal: 0 24px 60px rgba(15, 25, 24, 0.2), 0 12px 24px rgba(15, 25, 24, 0.1);
```
- Page background: `--shadow-0`
- Default cards: `--shadow-1`
- Hovered/active cards: `--shadow-2`
- Floating panels, dropdowns: `--shadow-3`
- Modals: `--shadow-modal` + backdrop `rgba(15, 25, 24, 0.5)`

### Surface Hierarchy
```
Page background (#F6F9F8)
  └── Card / Panel surface (#FAFCFC)
        └── Elevated dropdown / Tooltip (#FFFFFF)
              └── Modal overlay (--shadow-modal)
```

---

## 10. Responsive Behavior

### Breakpoints
```css
--bp-mobile:  480px;   /* Not a primary target — app is desktop/tablet first */
--bp-tablet:  768px;   /* Tablet: reception desk mounted tablet */
--bp-desktop: 1024px;  /* Desktop: typical reception workstation */
--bp-wide:    1280px;  /* Wide desktop: dual-monitor setups */
--bp-display: 1920px;  /* Wall display: waiting room TV */
```

### Layout Adjustments
- **< 1024px (tablet)**: Sidebar collapses to icon-only automatically. Queue cards stack to full width. Stats row scrolls horizontally.
- **≥ 1024px (desktop)**: Full sidebar. 2-3 column grid for stats. Queue in scrollable list or kanban-style columns by doctor.
- **1920px+ (display mode)**: Full-screen dark mode. Two-zone layout. No navigation, no sidebar, no controls visible. This mode is toggled explicitly by the receptionist.

---

## 11. Accessibility

- **Color contrast**: All text meets WCAG AA minimum (4.5:1 for normal, 3:1 for large). `--color-primary-500` on `--color-surface` is tested and compliant.
- **Focus states**: All interactive elements have explicit focus rings: `outline: 2px solid var(--color-primary-500); outline-offset: 2px;`. Never remove focus outlines.
- **Font sizes**: Minimum `14px` for any text the receptionist must read under time pressure. Minimum `16px` for primary actions.
- **Touch targets**: Minimum 44×44px for all buttons and interactive elements (tablet use).
- **Motion**: Respect `prefers-reduced-motion`. When set, disable all transitions and animations except instant state changes.
- **Language**: All UI copy is in French. Use formal "vous" in all patient-facing messages. Use direct language for receptionist interface.

---

## 12. Voice & Copy Tone

Even in micro-copy, the tone matters. AuSuivant speaks with the calm professionalism of a trained medical receptionist.

### Receptionist Interface
- **Action buttons**: Verbs in imperative, direct. `Appeler`, `Passer`, `Valider`, `Retirer de la file`
- **Status labels**: Nominal, factual. `En attente`, `Appelé`, `En consultation`, `Terminé`, `En retard`
- **Confirmations**: Brief, reassuring. `Patient appelé en salle 2.` (not "Félicitations!")
- **Empty states**: Warm but businesslike. `La salle d'attente est vide. Bonne journée !`
- **Error messages**: Clear, actionable, never blame. `Impossible de contacter le serveur. Réessayez dans quelques secondes.`

### Patient Display
- **Calling message**: `Ticket [N°] — Merci de vous diriger vers [Salle X]`
- **Wait message**: `Merci de patienter. Vous serez appelé(e) dans environ [N] minutes.`
- **General message (bottom ticker)**: Calm, reassuring. Formal "vous".

---

## 13. Implementation Notes for Claude Code

When applying this design system:

1. **Define all CSS variables in a single `:root {}` block** at the top of the global stylesheet or in a `design-tokens.css` file imported first.

2. **Never hardcode color values** in component files — always reference variables.

3. **Google Fonts import order**: DM Serif Display → Sora → JetBrains Mono. Use `display=swap` on all.

4. **Tailwind users**: If using Tailwind, extend the config with these tokens under `theme.extend`. Map every variable above to a Tailwind key (e.g., `primary: { 500: '#1B8C80' }`).

5. **Component library**: If using shadcn/ui or Radix, override the default CSS variables to match this system. AuSuivant should not look like a shadcn default installation.

6. **Dark mode**: The patient display dark mode is NOT the system `prefers-color-scheme` dark mode — it is an application-controlled mode (class `display-mode` on `<body>`). Do not conflate the two.

7. **Waiting room display** is a separate route (e.g., `/display`) that renders fullscreen with no navigation chrome. It auto-refreshes or uses WebSocket to receive queue updates from the receptionist interface.

8. **Numbers in the queue** must always use `font-variant-numeric: tabular-nums` to prevent layout shifts when values update.

9. **Skeleton loading states**: Use `--color-neutral-100` with a shimmer animation (`background: linear-gradient(90deg, --neutral-100 25%, --neutral-200 50%, --neutral-100 75%)`) while data loads. Never show empty cards.

10. **Z-index scale**:
    ```css
    --z-base:    0;
    --z-raised:  10;     /* Cards on hover */
    --z-dropdown:100;    /* Dropdown menus */
    --z-sticky:  200;    /* Sticky headers */
    --z-modal:   300;    /* Modal overlays */
    --z-toast:   400;    /* Toast notifications */
    --z-tooltip: 500;    /* Tooltips */
    ```
