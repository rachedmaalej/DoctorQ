# AuSuivant — Azur Médical Design System
## Implementation Specification for Claude Code

**Version:** 1.0  
**Scope:** Full front-end redesign of the AuSuivant dashboard (web + mobile) using the Azur Médical palette and Outfit/DM Sans typography pairing.  
**Stack:** React · TypeScript · Tailwind CSS v3.4+  
**i18n:** French (primary) · Arabic RTL (secondary)

---

## 0. Before You Start — Setup Checklist

Complete these steps before touching any component:

```bash
# 1. Install Google Fonts via npm (or add to index.html)
npm install @fontsource/outfit @fontsource/dm-sans

# 2. Confirm Tailwind version supports native RTL
npx tailwindcss --version  # must be 3.4+

# 3. Remove tailwindcss-rtl plugin if present (native RTL replaces it)
# In tailwind.config.ts: remove require('tailwindcss-rtl') from plugins[]
```

In `src/main.tsx` (or `src/index.tsx`), import fonts:

```tsx
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/dm-sans/300.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
```

---

## 1. Design Tokens

### 1.1 Color Palette

Define all colors as CSS custom properties in `src/styles/tokens.css`. Never use raw hex values in components — always reference a token.

```css
/* src/styles/tokens.css */
:root {
  /* ── Primary ─────────────────────────────────── */
  --color-primary:          #1A3C8F;   /* Deep cobalt — navbar, CTAs, active states */
  --color-primary-dark:     #122B6B;   /* Hover/pressed state for primary */
  --color-primary-light:    #E8EEF9;   /* Tinted backgrounds, selected row highlight */
  --color-primary-subtle:   #F2F5FB;   /* Page background */

  /* ── Accent ──────────────────────────────────── */
  --color-accent:           #E8712A;   /* Warm amber — Terminer CTA, destructive actions */
  --color-accent-dark:      #C45B1A;   /* Hover/pressed state for accent */
  --color-accent-soft:      #FEF0E6;   /* Accent tinted background */

  /* ── Surfaces ────────────────────────────────── */
  --color-bg:               #F2F5FB;   /* App background */
  --color-surface:          #FFFFFF;   /* Cards, modals, inputs */
  --color-surface-raised:   #FFFFFF;   /* Elevated surface (same, shadows do the work) */

  /* ── Text ────────────────────────────────────── */
  --color-text-primary:     #0D1B3E;   /* Body text, patient names */
  --color-text-secondary:   #3D5080;   /* Subheadings, section labels */
  --color-text-muted:       #6B7A99;   /* Metadata, timestamps, placeholders */
  --color-text-disabled:    #B0B9CC;   /* Disabled states */
  --color-text-on-primary:  #FFFFFF;   /* Text on primary-colored backgrounds */
  --color-text-on-accent:   #FFFFFF;   /* Text on accent-colored backgrounds */

  /* ── Borders ─────────────────────────────────── */
  --color-border:           #DDE3F0;   /* Default border */
  --color-border-strong:    #B0BDD8;   /* Focused input border, table header separator */
  --color-border-subtle:    #EDF0F7;   /* Very subtle dividers */

  /* ── Status — Patient states ─────────────────── */
  --color-status-waiting:   #E8712A;   /* Orange — WAITING */
  --color-status-notified:  #2D5FBF;   /* Blue — NOTIFIED (patient called, not in yet) */
  --color-status-in-consult:#1A7A4A;   /* Green — IN_CONSULTATION */
  --color-status-urgent:    #C0392B;   /* Red — URGENCE priority */
  --color-status-done:      #6B7A99;   /* Muted — completed */

  /* ── Status backgrounds (soft tints) ─────────── */
  --color-status-waiting-bg:   #FEF0E6;
  --color-status-notified-bg:  #EAF0FC;
  --color-status-in-consult-bg:#E8F5EE;
  --color-status-urgent-bg:    #FDECEA;
  --color-status-done-bg:      #F2F3F5;

  /* ── Feedback ────────────────────────────────── */
  --color-success:          #1A7A4A;
  --color-success-bg:       #E8F5EE;
  --color-warning:          #B87A00;
  --color-warning-bg:       #FFF8E1;
  --color-error:            #C0392B;
  --color-error-bg:         #FDECEA;
  --color-info:             #1A3C8F;
  --color-info-bg:          #E8EEF9;

  /* ── Doctor presence indicator ───────────────── */
  --color-doctor-present:   #1A7A4A;
  --color-doctor-absent:    #C0392B;

  /* ── Shadows ─────────────────────────────────── */
  --shadow-card:            0 1px 3px rgba(13,27,62,0.06), 0 1px 2px rgba(13,27,62,0.04);
  --shadow-dropdown:        0 4px 16px rgba(13,27,62,0.12), 0 2px 6px rgba(13,27,62,0.06);
  --shadow-modal:           0 20px 60px rgba(13,27,62,0.18), 0 4px 16px rgba(13,27,62,0.08);
  --shadow-navbar:          0 1px 0 rgba(13,27,62,0.10);
}
```

### 1.2 Tailwind Configuration

Extend `tailwind.config.ts` to reference these tokens:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
          subtle:  'var(--color-primary-subtle)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark:    'var(--color-accent-dark)',
          soft:    'var(--color-accent-soft)',
        },
        surface: 'var(--color-surface)',
        border:  {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
          subtle:  'var(--color-border-subtle)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          disabled:  'var(--color-text-disabled)',
        },
        status: {
          waiting:    'var(--color-status-waiting)',
          notified:   'var(--color-status-notified)',
          inConsult:  'var(--color-status-in-consult)',
          urgent:     'var(--color-status-urgent)',
          done:       'var(--color-status-done)',
        },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],         // Body / UI copy
        display: ['Outfit', 'sans-serif'],             // Headings / logo / labels
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['17px', { lineHeight: '26px' }],
        xl:    ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm:   '6px',
        DEFAULT: '8px',
        md:   '10px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        pill: '100px',
      },
      boxShadow: {
        card:     'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal:    'var(--shadow-modal)',
        navbar:   'var(--shadow-navbar)',
      },
      spacing: {
        // Component-level spacing rhythm
        'card-padding-sm': '12px',
        'card-padding':    '16px',
        'card-padding-lg': '24px',
        'section-gap':     '12px',
        'page-padding-x':  '24px',
        'page-padding-y':  '20px',
      },
      transitionTimingFunction: {
        'ease-ui': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast:    '100ms',
        DEFAULT: '150ms',
        slow:    '250ms',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 2. Typography Rules

### 2.1 Font Roles

| Role | Font | Weight | Use Case |
|------|------|--------|----------|
| `font-display` | Outfit | 600–700 | Logo wordmark, section headings, stat numbers, navbar brand |
| `font-display` | Outfit | 500 | Doctor names, patient names (large), tab labels |
| `font-sans` | DM Sans | 400 | Body text, metadata, descriptions, input values |
| `font-sans` | DM Sans | 500 | Button labels, badge text, emphasis in body |
| `font-sans` | DM Sans | 600 | Subheadings at small sizes, secondary CTAs |

### 2.2 Text Style Reference

Use these consistent text style combinations throughout the app:

```tsx
// Typography utility classes — define in globals.css for reuse
// or apply directly in components as shown below

// ── Page / Section Headings ──────────────────────────────────────
// e.g. "File d'attente", "Médecins"
className="font-display text-xl font-semibold text-text-primary tracking-tight"

// ── Stat Numbers (count of patients, minutes)
// e.g. the "4" in "4 en attente"
className="font-display text-3xl font-bold text-text-primary tabular-nums"

// ── Stat Labels (uppercase tiny labels under numbers)
// e.g. "EN ATTENTE", "ATTENTE MAX"
className="font-display text-2xs font-semibold uppercase tracking-widest text-text-muted"

// ── Doctor / Patient Names (primary list item)
className="font-display text-base font-semibold text-text-primary"

// ── Patient Name (in consultation card — prominent)
className="font-display text-xl font-bold text-text-primary"

// ── Metadata / Timestamps
// e.g. "Arrivée 10:32 · 12 min"
className="font-sans text-xs text-text-muted"

// ── Section Labels (uppercase dividers)
// e.g. "EN CONSULTATION", "FILE D'ATTENTE"
className="font-display text-2xs font-semibold uppercase tracking-[0.10em] text-text-secondary"

// ── Body / Description Text
className="font-sans text-sm text-text-secondary leading-relaxed"

// ── Input Values
className="font-sans text-sm text-text-primary"

// ── Input Placeholders (via CSS, not className)
// color: var(--color-text-muted)

// ── Wait Estimate in Queue Row
// e.g. "~15", "MIN EST."
// Number:
className="font-display text-sm font-bold text-text-muted tabular-nums"
// Unit label:
className="font-display text-2xs text-text-muted uppercase tracking-wider"

// ── Navbar brand wordmark
className="font-display text-lg font-bold text-white tracking-tight"
```

### 2.3 Prohibited Typography Patterns

- **Never use `font-sans` for headings or stat numbers** — always `font-display` (Outfit).
- **Never mix both fonts in the same sentence.**
- **Never use `font-weight: 400` for any clickable label** (buttons, nav items must be ≥ 500).
- **Never use raw pixel sizes** — always use the Tailwind scale defined above.
- **Arabic RTL text:** Use `font-family: 'Cairo', 'DM Sans', sans-serif` via `dir="rtl"` wrapper. Do not set Arabic text in Outfit (not a variable Arabic font).

---

## 3. Component Specifications

### 3.1 Top Navigation Bar

```tsx
// Appearance
// Background: var(--color-primary) #1A3C8F
// Height: 52px (desktop) / 48px (mobile)
// Bottom border: none — uses shadow-navbar
// Position: sticky top-0 z-50

// Desktop layout (≥768px):
// [Logo wordmark] ────────────────── [Search] [+ Patient CTA] [Présent badge] [Menu]

// Mobile layout (<768px):
// [Logo] ─────────────────────────── [Présent badge] [Hamburger]

// Logo wordmark
<span className="font-display text-lg font-bold text-white tracking-tight">
  AuSuivant
</span>

// "Présent / Absent" toggle badge
// Present state:
<button className="flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5
                   text-white text-xs font-sans font-medium
                   hover:bg-white/25 transition-colors duration-fast">
  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
  Présent
</button>

// Absent state: bg-white/10, dot color: bg-red-400

// Hamburger / menu icon
// Use Material Design icon: menu (or close when open)
// Size: 20px, color: white, wrapper: w-8 h-8 rounded bg-white/15 hover:bg-white/25

// Progress bar (2-segment, directly below navbar)
// Height: 3px, no margin
// Segment 1 (primary tasks done): background var(--color-primary)
// Segment 2 (pending): background var(--color-accent)
// Full width, no border radius

// Shadow on navbar:
boxShadow: var(--shadow-navbar)  // 0 1px 0 rgba(13,27,62,0.10)
```

### 3.2 Doctor Cards

```tsx
// Container
<div className="bg-surface rounded-xl border border-border shadow-card p-4
                border-l-[3px] border-l-primary">
  // Active doctor: border-l-primary (#1A3C8F), 3px solid left accent
  // Free/absent doctor: border-l-border, opacity-70

  // Doctor name row
  <div className="flex items-center gap-2 mb-1">
    <span className="font-display text-base font-semibold text-text-primary">
      Dr. Martin
    </span>
    // Specialty tag
    <span className="font-sans text-2xs font-medium bg-border text-text-muted
                     rounded-pill px-2 py-0.5">
      Cardio
    </span>
  </div>

  // Stats line: "3 att. · 7 vus · 12m moy."
  <p className="font-sans text-xs text-text-muted mb-3">
    3 att. · 7 vus · 12m moy.
  </p>

  // Patient in consultation (inline card inside doctor card)
  <div className="rounded-lg p-3 mb-2"
       style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, white)' }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-display text-sm font-semibold text-text-primary">
          Dupont J.
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
          <span className="font-sans text-xs text-text-muted">
            En consultation · 8 min
          </span>
        </div>
      </div>
      // Terminer CTA button (accent)
      <TerminerButton />
    </div>
  </div>

  // Suivant secondary button
  <SuivantButton variant="secondary" fullWidth />
</div>
```

### 3.3 Button System

All buttons use `font-sans font-medium` (DM Sans). Never use `font-display` on buttons.

```tsx
// ── PRIMARY BUTTON (Suivant principal, + Patient)
// Background: var(--color-primary)
// Hover: var(--color-primary-dark)
// Text: white, font-medium, text-sm
// Height: 38px (default) / 32px (compact) / 44px (large)
// Border radius: rounded-lg (12px)
// Padding: px-4 py-2 (default)
className="inline-flex items-center justify-center gap-2
           bg-primary hover:bg-primary-dark active:scale-[0.98]
           text-white font-sans text-sm font-medium
           rounded-lg px-4 py-2 h-[38px]
           transition-all duration-fast ease-ui
           disabled:opacity-50 disabled:cursor-not-allowed"

// ── ACCENT / DESTRUCTIVE BUTTON (Terminer)
// Background: var(--color-accent)
// Hover: var(--color-accent-dark)
className="inline-flex items-center justify-center gap-1.5
           bg-accent hover:bg-accent-dark active:scale-[0.98]
           text-white font-sans text-sm font-medium
           rounded-lg px-3.5 py-1.5
           transition-all duration-fast ease-ui"

// ── SECONDARY BUTTON (Suivant inline in doctor card, cancel actions)
// Background: transparent, border: border-primary, text: primary
className="inline-flex items-center justify-center gap-2
           border border-primary text-primary bg-transparent
           hover:bg-primary-light
           font-sans text-sm font-medium rounded-lg px-4 py-2
           transition-all duration-fast ease-ui"

// ── GHOST BUTTON (icon-only actions, toolbar buttons)
className="inline-flex items-center justify-center
           text-text-muted hover:text-text-primary hover:bg-primary-light
           rounded-md w-8 h-8
           transition-colors duration-fast"

// ── PILL / TAG BUTTON (Salle / Agenda tab switcher)
className="inline-flex items-center gap-1.5
           rounded-pill px-4 py-1.5 text-sm font-medium font-sans
           transition-colors duration-fast"
// Active:   bg-primary text-white
// Inactive: bg-transparent text-text-secondary hover:bg-primary-light

// ── FULL-WIDTH SUIVANT PRINCIPAL (bottom CTA bar on mobile)
className="w-full flex items-center justify-between
           bg-primary hover:bg-primary-dark
           text-white font-sans text-sm font-semibold
           rounded-xl px-5 py-3.5 h-[52px]
           shadow-dropdown transition-all duration-fast"
```

### 3.4 Queue Entry Row

```tsx
// Container
<div className="bg-surface rounded-xl border border-border shadow-card
                px-4 py-3.5 flex items-center gap-3.5
                hover:border-border-strong hover:shadow-md
                transition-all duration-fast cursor-default">

  // Position number badge
  <div className="w-7 h-7 rounded-lg bg-primary-subtle border border-border
                  flex items-center justify-center flex-shrink-0">
    <span className="font-display text-xs font-bold text-text-secondary">
      {position}
    </span>
  </div>

  // Patient avatar (initial circle)
  <div className="w-8 h-8 rounded-full flex items-center justify-center
                  flex-shrink-0 font-display text-xs font-bold"
       style={{
         background: 'color-mix(in srgb, var(--color-primary) 15%, white)',
         color: 'var(--color-primary)',
       }}>
    {initial}
  </div>

  // Patient info (flex-1)
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-display text-sm font-semibold text-text-primary truncate">
        {name}
      </span>
      // Appointment time (if any)
      <span className="font-sans text-xs text-text-muted">{time}</span>
      // Status tags (see §3.6)
      {tags}
    </div>
    <p className="font-sans text-xs text-text-muted mt-0.5">
      Arrivée {arrivedAt} · {waitMin} min
    </p>
  </div>

  // Wait estimate (right-aligned)
  <div className="text-right flex-shrink-0">
    <span className="font-display text-sm font-bold text-text-muted tabular-nums">
      ~{estimateMin}
    </span>
    <span className="font-display text-2xs text-text-muted uppercase tracking-wider block">
      MIN EST.
    </span>
  </div>

  // Action menu trigger
  <button className="w-6 h-6 flex items-center justify-center
                     text-text-muted hover:text-text-primary
                     hover:bg-primary-light rounded-md
                     transition-colors duration-fast flex-shrink-0">
    ⋮  {/* Replace with MD3 MoreVert icon */}
  </button>
</div>
```

### 3.5 Stats Bar (top of dashboard)

```tsx
// Two-cell stats row below navbar (desktop: inline in header area; mobile: card)
<div className="grid grid-cols-2 gap-3 mb-4">
  <div className="bg-surface rounded-xl border border-border shadow-card p-3">
    <p className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                  text-text-muted mb-1">
      En attente
    </p>
    <p className="font-display text-3xl font-bold text-text-primary tabular-nums
                  leading-none">
      {waitingCount}
    </p>
    // Green dot for active queue
    <span className="mt-1 w-2 h-2 rounded-full bg-status-inConsult block" />
  </div>

  <div className="bg-surface rounded-xl border border-border shadow-card p-3">
    <p className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                  text-text-muted mb-1">
      Vus aujourd'hui
    </p>
    <p className="font-display text-3xl font-bold text-text-primary tabular-nums
                  leading-none">
      {seenCount}
    </p>
    <p className="font-sans text-xs text-text-muted mt-1">
      {maxWait} min attente max
    </p>
  </div>
</div>
```

### 3.6 Status Tags / Badges

```tsx
// Shared base classes for all tags
const tagBase = "inline-flex items-center gap-1 rounded-pill px-2 py-0.5
                 font-sans text-2xs font-semibold uppercase tracking-wide"

// URGENT
<span className={`${tagBase} bg-[var(--color-status-urgent-bg)] text-[var(--color-status-urgent)]`}>
  URGENT
</span>

// NOTIFIÉ
<span className={`${tagBase} bg-[var(--color-status-notified-bg)] text-[var(--color-status-notified)]`}>
  NOTIFIÉ
</span>

// SANS RDV
<span className={`${tagBase} bg-border text-text-muted`}>
  SANS RDV
</span>

// AVEC RDV (appointment confirmed)
<span className={`${tagBase} bg-[var(--color-status-in-consult-bg)] text-[var(--color-status-in-consult)]`}>
  RDV {time}
</span>

// PRIORITÉ MÉDICALE
<span className={`${tagBase} bg-accent-soft text-accent`}>
  PRIORITÉ MÉD.
</span>
```

### 3.7 Search Bar

```tsx
<div className="flex items-center gap-2">
  // Search input
  <div className="relative flex-1">
    // MD3 Search icon (left, 16px, color: text-muted)
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
      {/* Material Symbol: search */}
    </span>
    <input
      type="text"
      placeholder="Rechercher un patient..."
      className="w-full bg-surface border border-border rounded-lg
                 pl-9 pr-4 py-2 h-[38px]
                 font-sans text-sm text-text-primary
                 placeholder:text-text-muted
                 focus:outline-none focus:border-border-strong focus:ring-2
                 focus:ring-primary/15
                 transition-colors duration-fast"
    />
  </div>

  // Add patient button (icon + label on desktop, icon-only on mobile)
  <button className="inline-flex items-center gap-1.5
                     bg-primary hover:bg-primary-dark
                     text-white font-sans text-sm font-medium
                     rounded-lg px-4 py-2 h-[38px] flex-shrink-0
                     transition-colors duration-fast">
    {/* MD3 PersonAdd icon, 18px */}
    <span className="hidden sm:inline">＋ Patient</span>
    <span className="sm:hidden">{/* MD3 PersonAdd */}</span>
  </button>
</div>
```

### 3.8 Add Patient Modal

```tsx
// Overlay: bg-black/40 backdrop-blur-sm
// Modal: bg-surface rounded-2xl shadow-modal max-w-sm w-full mx-4

// Header: "Nouveau patient" in font-display text-xl font-bold text-text-primary

// Name input field
<div className="mb-4">
  <label className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                    text-text-secondary block mb-1.5">
    Nom du patient
  </label>
  <div className="relative">
    {/* MD3 Person icon, left */}
    <input
      className="w-full bg-surface border border-border rounded-lg
                 pl-9 pr-10 py-2.5 font-sans text-sm text-text-primary
                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
                 transition-colors duration-fast"
    />
    {/* MD3 Search icon, right (for autocomplete trigger) */}
  </div>
</div>

// Appointment type toggle (Sans rendez-vous / Avec rendez-vous)
<div className="grid grid-cols-2 gap-2 mb-4">
  // Active tab:
  <button className="rounded-lg py-2.5 text-sm font-medium font-sans
                     bg-primary text-white border border-primary
                     transition-colors duration-fast">
    Sans rendez-vous
  </button>
  // Inactive tab:
  <button className="rounded-lg py-2.5 text-sm font-medium font-sans
                     bg-transparent text-text-secondary border border-border
                     hover:bg-primary-light transition-colors duration-fast">
    Avec rendez-vous
  </button>
</div>

// Phone number input
<div className="mb-4">
  <label className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                    text-text-secondary block mb-1.5">
    Numéro de téléphone
    <span className="normal-case font-sans font-normal text-text-muted ml-1">(optionnel)</span>
  </label>
  <div className="flex gap-2">
    // Country prefix (read-only pill)
    <div className="flex items-center gap-1 bg-border/40 border border-border
                    rounded-lg px-3 text-sm font-sans font-medium text-text-secondary
                    flex-shrink-0">
      {/* Flag icon */} +216
    </div>
    <div className="relative flex-1">
      <input
        inputMode="tel"
        maxLength={8}
        placeholder="XX XXX XXX"
        aria-label="8 chiffres après +216, ex : 55 123 456"
        className="w-full border border-border rounded-lg px-3 py-2.5
                   font-sans text-sm text-text-primary
                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
                   transition-colors duration-fast"
      />
      // Character counter: "0/8" — position absolute right-3
      <span className="absolute right-3 top-1/2 -translate-y-1/2
                       font-sans text-xs text-text-muted tabular-nums">
        {charCount}/8
      </span>
    </div>
  </div>
  // Helper text (always visible, not just on error)
  <p className="font-sans text-xs text-text-muted mt-1.5">
    8 chiffres après +216, ex : 55 123 456
  </p>
  // Error state (replaces helper text)
  <p className="font-sans text-xs text-error mt-1.5">
    Entrez 8 chiffres valides (ex : 55 123 456)
  </p>
</div>

// Priorité médicale toggle
<div className="flex items-center justify-between rounded-xl
                bg-accent-soft border border-accent/20 px-4 py-3 mb-5">
  <div>
    <p className="font-sans text-sm font-medium text-text-primary">
      Priorité médicale
    </p>
    <p className="font-sans text-xs text-text-muted">Passe en position #2</p>
  </div>
  // Toggle: primary color when on, border-muted when off
</div>

// Submit CTA
<button className="w-full bg-primary hover:bg-primary-dark
                   text-white font-sans text-sm font-semibold
                   rounded-xl py-3.5 flex items-center justify-center gap-2
                   transition-colors duration-fast">
  → Ajouter à la file
</button>
```

### 3.9 Bottom Sheet / Action Drawer (mobile)

```tsx
// Trigger: tap ⋮ on a queue entry
// Behavior: slides up from bottom, 40% screen height, drag-to-dismiss

// Container
<div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl
                shadow-modal z-50 pb-safe">

  // Drag handle
  <div className="mx-auto w-10 h-1 bg-border rounded-full mt-3 mb-1" />

  // Patient name header
  <div className="px-5 py-3 border-b border-border-subtle">
    <p className="font-display text-base font-bold text-text-primary">{name}</p>
    <p className="font-sans text-xs text-text-muted">
      Position #{pos} · {waitMin} min d'attente
    </p>
  </div>

  // Action list items
  // Each row: icon (24px, color matches intent) + title + description + chevron
  // Urgence:       icon accent/red,    bg-accent-soft on icon wrapper
  // Copier URL:    icon primary,       bg-primary-light on icon wrapper
  // Retirer:       icon error,         bg-error-bg on icon wrapper

  // Action row structure:
  <button className="w-full flex items-center gap-4 px-5 py-4
                     hover:bg-primary-subtle transition-colors duration-fast">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
         style={{ background: 'var(--color-accent-soft)' }}>
      {/* MD3 icon, 20px, color: var(--color-accent) */}
    </div>
    <div className="flex-1 text-left">
      <p className="font-sans text-sm font-medium text-text-primary">Urgence</p>
      <p className="font-sans text-xs text-text-muted">Passe en priorité absolue</p>
    </div>
    <span className="text-text-muted text-sm">›</span>
  </button>
</div>
```

### 3.10 Success Toast / Confirmation Snackbar

```tsx
// After patient is added successfully (replaces confetti)
// Position: bottom of screen, above bottom CTA bar on mobile
// Animation: slide up from bottom, auto-dismiss after 4s

<div className="fixed bottom-[72px] left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px]
                bg-text-primary rounded-xl shadow-modal z-50
                flex items-center gap-3 px-4 py-3.5
                animate-slide-up">

  // Success checkmark
  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
    {/* MD3 CheckCircle icon, 18px, color: success */}
  </div>

  // Content
  <div className="flex-1 min-w-0">
    <p className="font-display text-sm font-semibold text-white truncate">
      {patientName}
    </p>
    <p className="font-sans text-xs text-white/60">
      Ajoutée · {type} · Pos. {position}
    </p>
  </div>

  // Quick actions (WhatsApp, View, Undo)
  <div className="flex gap-2 flex-shrink-0">
    <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                       flex items-center justify-center transition-colors duration-fast">
      {/* WhatsApp icon, 16px, color: white/70 */}
    </button>
    <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                       flex items-center justify-center transition-colors duration-fast">
      {/* MD3 Undo icon, 16px, color: white/70 */}
    </button>
  </div>
</div>

// Add to tailwind.config.ts keyframes:
// animate-slide-up: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { ... } }
```

### 3.11 Agenda Bar

```tsx
<button className="w-full bg-surface border border-border rounded-xl
                   px-4 py-3 flex items-center justify-between
                   hover:border-border-strong hover:shadow-card
                   transition-all duration-fast">
  <div className="flex items-center gap-2">
    {/* MD3 CalendarMonth icon, 16px, color: text-muted */}
    <span className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                     text-text-secondary">
      Agenda du jour
    </span>
    <span className="font-sans text-xs text-text-muted">· {count} créneaux</span>
  </div>
  <span className="text-text-muted text-sm">›</span>
</button>
```

---

## 4. Layout Structure

### 4.1 Page Layout (Desktop ≥768px)

```tsx
// Root layout
<div className="min-h-screen bg-primary-subtle">

  // Sticky navbar + progress bar (52px + 3px = 55px total)
  <Navbar />

  // Content wrapper
  <main className="max-w-[960px] mx-auto px-6 py-5 space-y-4">

    // Row 1: Stats
    <StatsBar />

    // Row 2: Doctor cards grid
    <section>
      <SectionLabel text="Médecins" count={doctorCount} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        {doctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
      </div>
    </section>

    // Row 3: Agenda bar
    <AgendaBar />

    // Row 4: Queue section
    <section>
      <QueueHeader />
      <div className="space-y-2 mt-2">
        {queue.map(e => <QueueEntry key={e.id} entry={e} />)}
      </div>
    </section>
  </main>
</div>
```

### 4.2 Page Layout (Mobile <768px)

```tsx
// Same structure, but:
// - Stats: 2-column grid of compact cards
// - Doctor cards: single column
// - Search bar: full width, no adjacent button (+ button floats as FAB)
// - Queue entries: full width, slightly reduced padding
// - Bottom CTA bar: fixed bottom-0, full width, height 56px, bg-primary

<div className="fixed bottom-0 left-0 right-0 bg-primary px-4 py-3 z-40
                flex items-center justify-between shadow-modal safe-area-bottom">
  // Left: "Au suivant" notice (fade in when next patient is known)
  <div className="flex items-center gap-2 text-white/70">
    {/* MD3 Person icon */}
    <span className="font-sans text-xs">
      Au suivant · {nextPatientName}
    </span>
  </div>
  // Right: Call next button
  <button className="bg-white text-primary font-sans text-sm font-semibold
                     rounded-xl px-5 py-2 flex items-center gap-2
                     hover:bg-white/90 transition-colors duration-fast">
    → Appeler Suivant
  </button>
</div>
```

### 4.3 Section Labels

```tsx
// Reusable section label with optional count badge
<div className="flex items-center gap-2 mb-2">
  <h2 className="font-display text-2xs font-semibold uppercase tracking-[0.10em]
                 text-text-secondary">
    {text}
  </h2>
  {count !== undefined && (
    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center
                     font-display text-2xs font-bold text-white">
      {count}
    </span>
  )}
</div>
```

---

## 5. Icon System

**Exclusive icon set: Material Design 3 (Material Symbols).**  
No emojis. No Lucide. No Font Awesome. No heroicons.

### 5.1 Setup

```html
<!-- In index.html <head> -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

```tsx
// Icon component wrapper
// src/components/ui/Icon.tsx
interface IconProps {
  name: string;           // MD3 icon name, e.g. "person_add", "search"
  size?: number;          // px, default 20
  filled?: boolean;       // FILL=1 vs FILL=0 (outline)
  weight?: number;        // 300–700, default 400
  className?: string;
}

export function Icon({ name, size = 20, filled = false, weight = 400, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className ?? ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
```

### 5.2 Icon Usage Map

| Context | Icon Name | Size | Filled | Color |
|---------|-----------|------|--------|-------|
| Add patient button | `person_add` | 18 | false | white |
| Search field | `search` | 16 | false | text-muted |
| Queue entry menu | `more_vert` | 20 | false | text-muted |
| Call phone | `call` | 18 | false | text-muted |
| Complete consultation | `check_circle` | 18 | true | white |
| Agenda / calendar | `calendar_month` | 16 | false | text-muted |
| Urgence action | `emergency` | 20 | false | accent |
| Copy URL action | `content_copy` | 20 | false | primary |
| Remove from queue | `person_remove` | 20 | false | error |
| Hamburger menu | `menu` | 20 | false | white |
| Close / X | `close` | 20 | false | text-muted |
| Chevron right | `chevron_right` | 20 | false | text-muted |
| Arrow forward (CTA) | `arrow_forward` | 18 | false | white |
| Doctor present dot | `circle` | 8 | true | doctor-present |
| WhatsApp share | Use SVG inline (not MD3) | 18 | — | white |
| Success toast check | `check_circle` | 18 | true | success |
| Undo action | `undo` | 18 | false | white/70 |

---

## 6. Form States & Validation

### 6.1 Input States

```css
/* Default */
border: 1px solid var(--color-border);
background: var(--color-surface);

/* Focus */
border-color: var(--color-primary);
box-shadow: 0 0 0 3px rgba(26, 60, 143, 0.12);

/* Error */
border-color: var(--color-error);
box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.10);

/* Disabled */
background: var(--color-primary-subtle);
border-color: var(--color-border-subtle);
color: var(--color-text-disabled);
cursor: not-allowed;

/* Read-only (e.g. +216 prefix) */
background: color-mix(in srgb, var(--color-border) 50%, white);
border-color: var(--color-border);
```

### 6.2 Phone Input — Specific Rules

- **The `+216` prefix must be a separate non-editable element**, not part of the input value.
- Set `inputMode="tel"` and `maxLength={8}` on the digit input.
- Show character counter `0/8` right-aligned inside the input field (absolute positioned).
- **Always show the helper text** "8 chiffres après +216, ex : 55 123 456" — do not hide it.
- On error: replace helper text with error message in `var(--color-error)`.
- Do not show error until the user has blurred the field (onBlur validation).

---

## 7. Motion & Animation

### 7.1 Transition Defaults

```css
/* Applied to all interactive elements via Tailwind shorthand */
transition-property: color, background-color, border-color, box-shadow, transform, opacity;
transition-duration: 150ms;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### 7.2 Key Animations

```css
/* In tailwind.config.ts → theme.extend.keyframes */
keyframes: {
  'slide-up': {
    '0%': { transform: 'translateY(16px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'slide-down-out': {
    '0%': { transform: 'translateY(0)', opacity: '1' },
    '100%': { transform: 'translateY(16px)', opacity: '0' },
  },
  'fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  'sheet-up': {
    '0%': { transform: 'translateY(100%)' },
    '100%': { transform: 'translateY(0)' },
  },
},
animation: {
  'slide-up':        'slide-up 200ms ease-out both',
  'slide-down-out':  'slide-down-out 150ms ease-in both',
  'fade-in':         'fade-in 200ms ease-out both',
  'scale-in':        'scale-in 200ms cubic-bezier(0.34,1.56,0.64,1) both',
  'sheet-up':        'sheet-up 300ms cubic-bezier(0.4,0,0.2,1) both',
},
```

### 7.3 Animation Usage Rules

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Modal open | `scale-in` | 200ms |
| Bottom sheet open | `sheet-up` | 300ms |
| Toast appear | `slide-up` | 200ms |
| Page transition | `fade-in` | 150ms |
| Button hover | CSS `transition` only | 150ms |
| Button press | `active:scale-[0.98]` | 100ms |
| New queue entry added | `slide-up` + highlight flash | 300ms |

**No confetti. No full-screen celebrations.** Patient confirmation is handled by the success toast (§3.10) only.

---

## 8. Internationalization (i18n)

### 8.1 Language Structure

```typescript
// All UI strings must be in i18n keys — no hardcoded French in JSX
// Primary: fr-FR
// Secondary: ar-TN (Tunisian Arabic, RTL)

// i18n key namespaces:
// common.*         — shared across views
// dashboard.*      — doctor dashboard
// queue.*          — queue entries and actions
// patient.*        — patient check-in flow
// auth.*           — login / signup
```

### 8.2 RTL Support

```tsx
// Root html element must set dir attribute based on locale
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

// In components, use Tailwind RTL variants instead of custom logic:
// ✅ Correct:
<div className="pl-4 rtl:pr-4 rtl:pl-0">

// ❌ Wrong (old tailwindcss-rtl plugin syntax — removed):
<div className="ltr:pl-4 pl-0">

// Border accent on doctor cards:
<div className="border-l-[3px] border-l-primary rtl:border-l-0 rtl:border-r-[3px] rtl:border-r-primary">

// Icon direction (chevrons, arrows must flip):
<Icon name="arrow_forward" className="rtl:rotate-180" />
<Icon name="chevron_right" className="rtl:rotate-180" />
```

---

## 9. Accessibility Requirements

Every component must meet WCAG 2.1 AA. Minimum requirements:

```tsx
// ── Color contrast ────────────────────────────────────────────────
// primary (#1A3C8F) on white:   contrast ratio ≥ 7:1 ✓
// accent  (#E8712A) on white:   contrast ratio ≥ 3:1 (large text only, buttons ≥18px or bold 14px)
// text-muted (#6B7A99) on white: contrast ratio ≥ 4.5:1 ✓

// ── Interactive elements ──────────────────────────────────────────
// All buttons and links must have:
aria-label="..."       // when no visible text
role="button"          // when a div/span acts as a button
tabIndex={0}           // keyboard accessibility

// Icon-only buttons MUST have aria-label:
<button aria-label="Ajouter un patient" className="...">
  <Icon name="person_add" />
</button>

// ── Focus ring ────────────────────────────────────────────────────
// Never use outline-none without a custom focus-visible replacement:
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

// ── Status indicators ─────────────────────────────────────────────
// Never use color alone to convey status — always pair with text or icon:
// ✅ <span className="text-status-urgent"><Icon name="emergency" /> URGENT</span>
// ❌ <span className="w-2 h-2 bg-status-urgent rounded-full" /> (color-only, no label)

// ── Form labels ───────────────────────────────────────────────────
// Every input must have an associated <label> or aria-label
// Phone input must have:
aria-label="Numéro de téléphone : 8 chiffres après +216"
aria-describedby="phone-helper"  // points to helper text element
// <p id="phone-helper">8 chiffres après +216, ex : 55 123 456</p>

// ── Modal / Bottom sheet ──────────────────────────────────────────
// Must trap focus while open
// Must restore focus to trigger element on close
// Must have role="dialog" and aria-modal="true"
// Must have aria-labelledby pointing to the title
```

---

## 10. What to Remove / Replace

The following patterns exist in the current codebase and must be eliminated during this redesign:

| Remove | Replace With |
|--------|--------------|
| `tailwindcss-rtl` plugin | Native Tailwind v3.4 RTL (`rtl:` prefix) |
| Confetti animation on "your turn" | Success toast (§3.10) |
| Random "fun facts" on patient status page | Real-time wait estimate update |
| Demo credentials in `LoginPage.tsx` | Remove entirely |
| `SAMPLE_PATIENTS` array in `DashboardPage.tsx` | Remove; use empty state component |
| `(clinic as any)` type assertions | Define proper TypeScript interfaces |
| `console.log` statements in production code | Remove all 56 instances before merge |
| Emojis used as icons (🔍, ✓, etc.) | Material Symbols icons via `<Icon>` component |
| Hardcoded color hex values in inline styles | CSS custom property tokens |

---

## 11. File & Component Naming Conventions

```
src/
├── components/
│   ├── ui/                    # Atomic / base components
│   │   ├── Button.tsx         # All button variants (props: variant, size, fullWidth)
│   │   ├── Icon.tsx           # MD3 icon wrapper
│   │   ├── Badge.tsx          # Status tags (variant: urgent | notified | sans-rdv | ...)
│   │   ├── Input.tsx          # Text input with label + helper + error states
│   │   ├── Toggle.tsx         # On/off toggle (doctor presence, priorité médicale)
│   │   └── SectionLabel.tsx   # Uppercase section header + optional count badge
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── PageWrapper.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── DoctorCard.tsx
│   │   ├── AgendaBar.tsx
│   │   ├── QueueHeader.tsx
│   │   ├── QueueEntry.tsx
│   │   ├── QueueList.tsx
│   │   └── BottomCTABar.tsx   # Mobile fixed bottom bar
│   └── modals/
│       ├── AddPatientModal.tsx
│       ├── PatientActionSheet.tsx  # Bottom sheet on mobile
│       └── SuccessToast.tsx
├── styles/
│   ├── tokens.css             # All CSS custom properties
│   └── globals.css            # Tailwind directives + base resets
└── lib/
    └── cn.ts                  # classnames/clsx utility
```

---

## 12. Acceptance Criteria

A component is considered complete when:

- [ ] All colors reference CSS tokens (zero raw hex in JSX/TSX)
- [ ] All text uses `font-display` (Outfit) or `font-sans` (DM Sans) per the role table in §2.1
- [ ] All icons use the `<Icon>` component with MD3 symbol names
- [ ] Button, input, and card states (hover, focus, active, disabled, error) are all implemented
- [ ] Mobile layout (<768px) and desktop layout (≥768px) are both tested
- [ ] RTL (`dir="rtl"`) is tested and directional classes use `rtl:` variants
- [ ] All icon-only buttons have `aria-label`
- [ ] No `console.log` remains
- [ ] No hardcoded demo data remains in the component
- [ ] TypeScript types are properly defined (no `as any`)

---

*End of specification. Questions or clarifications → reference the Azur Médical HTML prototype in `ausuivant-palette-exploration.html` as the visual source of truth.*
