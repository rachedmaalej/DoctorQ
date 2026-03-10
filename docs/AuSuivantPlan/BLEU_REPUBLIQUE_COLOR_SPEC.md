# Bleu République — Complete Color Specification
## Drop-in replacement for Section 1 (Design Direction) + Section 2 (Color System) of AUSUIVANT_DESIGN_BRIEF.md

> **How to use this file**: Replace the `### Design Direction` block in Section 1 and the entirety of Section 2 in your design brief with the content below. All other sections (Typography, Spacing, Components, etc.) remain unchanged — they are color-agnostic.

---

## SECTION 1 PATCH — Design Direction (replace "Cabinet Calme" block)

### Design Direction: "Service Public Raffiné"

**One-sentence vision**: *The quiet authority of a French institution, stripped of its bureaucracy — navy as deep as a Sénat door, warm ivoire like an ordonnance pad, terracotta like the rooftops of Haussmann.*

This is not a tech product that entered healthcare. This is a tool that was *born* inside French medical culture. The visual register draws from institutions the French secretary already trusts instinctively: the CPAM notice, the Ameli interface, the dossier médical cover — but reimagined with the craft of a Paris design studio. Navy projects authority and permanence. Ivoire-Haussmann as the ground color evokes the warmth of paper without any digital coldness. Terracotta is the single warm accent — human, Mediterranean, culturally specific to France — used only to draw the eye to what matters most.

**Competitive anchor**: Every major actor in the French medical software market has chosen a version of blue, green, or purple. Doctolib uses `#0070D1` (bright, booking-energy, patient-facing). Maiia uses sage-green. Qare uses deep violet. **No one owns the institutional navy + terracotta space.** AuSuivant's claim to that territory is both strategically uncontested and emotionally resonant with the French medical receptionist.

**The terracotta rule**: Terracotta (`#C05C2E`) is used for one thing and one thing only — the moment that requires the receptionist's attention. A patient running late. A delay warning. A badge that says *act now*. It must never appear decoratively. Its rarity is what gives it power.

**Avoid at all costs**:
- Doctolib's bright blue (`#0070D1`) — wrong energy, wrong context, confusing
- Pure white backgrounds — too digital, too cold for the French medical register
- Teal or mint — already used by the previous palette direction, risks confusion if both exist in the codebase
- Orange — too close to terracotta, will dilute the accent's uniqueness
- Gradients of any kind — inappropriate for the institutional seriousness of this palette

---

## SECTION 2 — Color System (Bleu République)

### Philosophy
The palette is built on **navy as the anchor of institutional trust**, **ivoire-Haussmann as the breathing ground**, and **terracotta as the single accent of urgency and human warmth**. The navy family is cool and precise; the neutral family deliberately pulls warm (cream, not grey) to prevent the interface from feeling like a government terminal. The terracotta accent is the only warm color in the entire primary interface — its isolation is intentional and must be preserved.

---

### Primary Colors — Navy (Brand Anchor)

```css
/* Navy — Bleu République, The Brand Anchor */
--color-primary-900: #1A2744;   /* Deepest navy: sidebar background, logo mark, modal headers */
--color-primary-700: #1E3A6E;   /* Dark navy: primary buttons, active nav items */
--color-primary-500: #2952A3;   /* Brand navy: key UI elements, links, focus rings */
--color-primary-300: #6B8CC7;   /* Medium blue: hover states, secondary interactive elements */
--color-primary-100: #C5D4EE;   /* Pale blue: selected state backgrounds, tag fills */
--color-primary-50:  #EDF1F9;   /* Near-white blue: subtle tints, active row backgrounds */
```

**Usage rules for the navy scale:**
- `900` is the sidebar. Nothing else should be this dark except modal overlays and the display screen.
- `700` is the action color — every primary button, every active state.
- `500` is the brand expression — used sparingly as the "identity" anchor (logo, key metric numbers, section headings).
- `300` and below are supporting infrastructure: hover, selection, accent fills.
- Never use `500` as a background for text — contrast is insufficient. Use `700` or `900` instead.

---

### Neutrals — Ivoire Haussmann (Warm, Not Administrative)

```css
/* Warm ivoire neutrals — the grain of French ordonnance paper, not a government terminal */
--color-neutral-950: #14181F;   /* Near-black: primary text — cooler than pure black, reads crisply on ivoire */
--color-neutral-800: #2B3240;   /* Secondary text, icons, inactive sidebar items */
--color-neutral-600: #5E6A7D;   /* Placeholder text, disabled labels, table secondary info */
--color-neutral-400: #9AA3B2;   /* Borders, dividers, inactive step indicators */
--color-neutral-200: #DAE0E8;   /* Card borders, table row separators */
--color-neutral-100: #EDF0F5;   /* Hover row background, subtle section tints */
--color-neutral-50:  #F7F6F2;   /* Page background — warm ivoire, NOT pure white, NOT grey */
--color-surface:     #FDFCF9;   /* Card/panel background — one step warmer than pure white */
--color-white:       #FFFFFF;   /* Use sparingly: inside modals, on dark backgrounds only */
```

**The ivoire decision explained**: The `50` tone `#F7F6F2` has a slight warm yellow-beige bias. This is deliberate — it evokes the paper world the French medical secretary has worked in for decades (ordonnances, dossiers, courriers CPAM). It is the single largest color on the interface (the page background) and it must never be replaced with `#F5F5F5` or `#F0F0F0` which read as digital and cold.

---

### Semantic / Status Colors

```css
/*
  Status colors for patient queue states.
  Design principle: the status strip (left border of queue card) must be
  readable at a glance across a busy reception desk.
  The navy family handles positive/neutral states.
  Terracotta handles urgency (en retard).
  Grey handles completed/closed states.
*/

--color-status-waiting:      #6B8CC7;   /* En attente — medium blue. Calm presence in queue. */
--color-status-called:       #2952A3;   /* Appelé — brand navy. Positive, "go" moment. */
--color-status-consultation: #1A2744;   /* En consultation — deep navy. Locked, in progress. */
--color-status-late:         #C05C2E;   /* En retard — terracotta. The ONLY warm color in status. */
--color-status-completed:    #9AA3B2;   /* Terminé — cool grey. Neutral, receded, done. */

/* Semantic system colors */
--color-success:  #1A6B3C;   /* Sauvegardé, confirmé, validé */
--color-warning:  #C05C2E;   /* En retard, attention requise — same as status-late for consistency */
--color-error:    #B03A2E;   /* Erreur système UNIQUEMENT — jamais pour un statut patient */
--color-info:     #2952A3;   /* Info tooltips, aide contextuelle — same as primary-500 */
```

**Status color logic**: In the Bleu République palette, the queue status strip tells the story entirely within the blue family — lighter blue for waiting, medium for called, deep navy for in-consultation. This creates a natural sense of *progression* — the patient moves from light to dark as they advance through the care journey. The terracotta for *en retard* is a deliberate break in this logic: it visually interrupts the blue continuum precisely because it *should* interrupt — something needs attention.

---

### Accent Color — Terracotta

```css
/*
  Terracotta is the only warm color in the entire interface.
  It appears in exactly three contexts:
  1. The "En retard" status (see above)
  2. The primary CTA in its highest-urgency highlighted state
     (e.g., "Appeler maintenant" when a patient has been waiting >25min)
  3. The amber-equivalent warning badge background

  It must NEVER appear decoratively.
  It must NEVER be used for general buttons, links, or navigation.
  Its rarity is what gives it visual authority.
*/

--color-accent-700: #8C3A1A;   /* Accent text: on terracotta-100 backgrounds, labels */
--color-accent-500: #C05C2E;   /* Primary terracotta: status borders, urgent badge fills */
--color-accent-300: #D98A69;   /* Lighter terracotta: hover on accent elements */
--color-accent-100: #FAE8DF;   /* Accent background: card tints, badge backgrounds */
--color-accent-50:  #FDF5F1;   /* Subtle accent tint: barely-there highlight */
```

---

### Dark Mode — Salle d'Attente Display Screen

```css
/*
  The patient-facing wall display uses a dedicated dark mode.
  This is NOT the system prefers-color-scheme dark mode.
  It is activated by the class `display-mode` on <body>,
  triggered explicitly by the receptionist.

  The dark palette is calibrated for legibility from 3–5 meters,
  on a consumer TV or monitor in a lit medical waiting room.
  The blue accent on dark (#6B8CC7) is chosen over the brighter
  teal (#4DD4C8) of the original palette — maintaining brand coherence
  in dark contexts while avoiding the 'tech startup' glow.
*/

--display-bg:       #0D1220;   /* Deep dark navy — base of the universe */
--display-surface:  #141C30;   /* Slightly lighter: panel backgrounds */
--display-border:   #1E2E50;   /* Subtle panel borders, dividers */
--display-text:     #EDF1F9;   /* Primary text on dark — matches primary-50 for brand coherence */
--display-muted:    #6B8CC7;   /* Secondary text, queue list items — primary-300 on dark */
--display-accent:   #92AFDF;   /* Bright navy-blue: the "NOW SERVING" number highlight */
--display-terracotta: #D98A69; /* Terracotta on dark — lightened for legibility at distance */
```

**Display accent note**: On the dark background, the large "NOW SERVING" number uses `--display-accent` (`#92AFDF`) rather than pure white. This maintains brand color identity even on the wall display — patients instinctively associate the color with AuSuivant's brand, not just a generic screen.

---

### Tailwind Config Extension

If using Tailwind CSS, extend `tailwind.config.js` with the following:

```js
theme: {
  extend: {
    colors: {
      primary: {
        900: '#1A2744',
        700: '#1E3A6E',
        500: '#2952A3',
        300: '#6B8CC7',
        100: '#C5D4EE',
        50:  '#EDF1F9',
      },
      neutral: {
        950: '#14181F',
        800: '#2B3240',
        600: '#5E6A7D',
        400: '#9AA3B2',
        200: '#DAE0E8',
        100: '#EDF0F5',
        50:  '#F7F6F2',
      },
      accent: {
        700: '#8C3A1A',
        500: '#C05C2E',
        300: '#D98A69',
        100: '#FAE8DF',
        50:  '#FDF5F1',
      },
      surface: '#FDFCF9',
      status: {
        waiting:      '#6B8CC7',
        called:       '#2952A3',
        consultation: '#1A2744',
        late:         '#C05C2E',
        completed:    '#9AA3B2',
      },
    },
  },
}
```

---

### Component Color Overrides (Bleu République specifics)

The following overrides apply on top of the general component spec in Section 5.
Only values that *change* from the teal version are listed here.

#### Navigation Sidebar
```css
/* Override Section 5 sidebar spec */
background:           var(--color-primary-900);  /* #1A2744 — deep navy */
active-item-bg:       var(--color-primary-500);  /* #2952A3 — brand navy */
active-item-text:     var(--color-white);
inactive-item-hover:  var(--color-primary-700);  /* #1E3A6E */
inactive-item-text:   rgba(237, 241, 249, 0.65); /* primary-50 at 65% — warm, not stark */
logo-color:           var(--color-white);
border-divider:       rgba(197, 212, 238, 0.12); /* primary-100 at 12% */
```

#### Primary Button
```css
/* Override Section 5 btn-primary spec */
background:       var(--color-primary-700);  /* #1E3A6E */
background-hover: var(--color-primary-900);  /* #1A2744 */
box-shadow-hover: 0 4px 16px rgba(30, 58, 110, 0.35);
/* Note: primary-500 (#2952A3) is intentionally NOT used for buttons —
   it reads as too "bright" in the navy family and competes with links */
```

#### Focus Rings
```css
/* All focus rings use primary-500 */
outline: 2px solid var(--color-primary-500);  /* #2952A3 */
outline-offset: 2px;
```

#### Patient Queue Card — Left Border Status Strip
```css
/* The 4px left border is the primary visual indicator */
.card-waiting:      border-left: 4px solid #6B8CC7;  /* blue — calm */
.card-called:       border-left: 4px solid #2952A3;  /* navy — action */
.card-consultation: border-left: 4px solid #1A2744;  /* deep navy — locked */
.card-late:         border-left: 4px solid #C05C2E;  /* terracotta — urgent */
.card-completed:    border-left: 4px solid #9AA3B2;  /* grey — done */
```

#### Status Badges
```css
.badge-waiting      { background: #E8EEF8; color: #2952A3; }
.badge-called       { background: var(--color-primary-100); color: var(--color-primary-700); }
.badge-consultation { background: #E2E7F0; color: var(--color-primary-900); }
.badge-late         { background: var(--color-accent-100); color: var(--color-accent-700); }
.badge-completed    { background: var(--color-neutral-100); color: var(--color-neutral-600); }
```

#### Input Focus State
```css
.input:focus {
  border-color: var(--color-primary-500);  /* #2952A3 */
  box-shadow: 0 0 0 3px rgba(41, 82, 163, 0.12);
}
```

#### KPI Metric Numbers (Dashboard)
```css
/* Override: metric numbers use primary-700 for authority, not primary-500 */
color: var(--color-primary-700);  /* #1E3A6E */
font-family: 'DM Serif Display', Georgia, serif;
```

#### Terracotta Pulse Animation (En retard)
```css
/* Same animation as Section 8, updated for terracotta */
@keyframes pulse-terracotta {
  0%, 100% { box-shadow: 0 0 0 0 rgba(192, 92, 46, 0); }
  50%       { box-shadow: 0 0 0 4px rgba(192, 92, 46, 0.22); }
}
/* Applied to .card-late */
animation: pulse-terracotta 3s ease-in-out infinite;
```

---

### Color Relationship Map

```
Page background     #F7F6F2   ← ivoire, the dominant canvas (85% of screen area)
  └── Card surface  #FDFCF9   ← near-white with warmth
        └── Sidebar #1A2744   ← deep navy, strong contrast anchor
              └── Active nav  #2952A3   ← brand navy

Primary action:     #1E3A6E   ← dark navy button
Brand expression:   #2952A3   ← logo, key numbers, links
Urgency / Warmth:   #C05C2E   ← terracotta, used once and powerfully

Text hierarchy:
  Primary body:     #14181F
  Secondary:        #2B3240
  Muted/disabled:   #5E6A7D
  Placeholder:      #9AA3B2
```

---

### What Must Not Change Between This and the Teal Version

If migrating from the teal (Cabinet Calme) palette to Bleu République:

| Element | Do NOT change | Reason |
|---|---|---|
| Typography | All font choices (DM Serif, Sora, JetBrains Mono) | Color-agnostic, still correct |
| Spacing scale | All `--space-*` tokens | Color-agnostic |
| Shadow system | All `--shadow-*` tokens (only update rgba values from teal to navy base) | Structure unchanged |
| Animation timings | All `--duration-*` and `--ease-*` tokens | Color-agnostic |
| Layout grid | All breakpoints, sidebar width, content columns | Color-agnostic |
| Accessibility rules | WCAG AA minimums, focus ring logic | Now use `#2952A3` as focus color |
| Copy tone | All French micro-copy guidelines | Color-agnostic |
| Display route | `/display` dark mode structure | Colors change, layout stays |

**Shadow base color update** (one change required):
```css
/* Replace rgba(15, 25, 24, x) teal-base shadows with navy-base: */
--shadow-1: 0 1px 3px rgba(20, 24, 31, 0.06), 0 1px 2px rgba(20, 24, 31, 0.04);
--shadow-2: 0 4px 8px rgba(20, 24, 31, 0.07), 0 2px 4px rgba(20, 24, 31, 0.04);
--shadow-3: 0 8px 20px rgba(20, 24, 31, 0.09), 0 4px 8px rgba(20, 24, 31, 0.05);
--shadow-4: 0 16px 40px rgba(20, 24, 31, 0.12), 0 8px 16px rgba(20, 24, 31, 0.06);
--shadow-modal: 0 24px 60px rgba(20, 24, 31, 0.2), 0 12px 24px rgba(20, 24, 31, 0.1);
```
