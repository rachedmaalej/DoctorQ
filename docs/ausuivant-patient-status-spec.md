# AuSuivant Patient Status Page — Implementation Specification

**Version:** 2.0
**Target:** Mobile-first patient-facing queue status page (max-width: 430px)
**Language:** French (formal "vous" throughout)
**Reference mockup:** `ausuivant-patient-status.html`

---

## 1. Core Concept — A Living, Mood-Shifting Experience

Unlike a traditional status page with static fields, this page is a **single evolving screen** that transforms its personality as the patient moves through the queue. The background color shifts, the content cards change type, and the hero estimate shrinks — all creating a sense of **forward momentum** without requiring the patient to do anything.

The page has **8 discrete states** mapped to queue position, but transitions between them feel continuous and organic. There is no stepper, no timeline widget, no position number exposed. The patient sees only what matters: **how long** and **what to do**.

---

## 2. Design Foundation

### 2.1 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Hero time estimate | `Fraunces` (serif, variable) | 500 | 56–72px |
| Called/Done titles | `Fraunces` (serif, variable) | 500–600 | 24–32px |
| Visit summary values | `Fraunces` (serif, variable) | 500 | 26px |
| Body / UI | `DM Sans` (sans-serif, variable) | 300–700 | 11–16px |
| Fallback stack | `sans-serif` | — | — |

Load from Google Fonts:
```
DM Sans: ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700
Fraunces: ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700
```

### 2.2 Color Tokens

```
--bg:             #F8F7F4    (default page background — warm off-white)
--surface:        #FFFFFF    (cards)
--surface-alt:    #F0EFEB    (secondary surfaces, RDV context bar)
--border:         #E8E6E1    (card borders, dividers)
--text-primary:   #1A1917    (headings, strong text)
--text-secondary: #6E6B63    (body copy, descriptions)
--text-tertiary:  #A09B92    (hints, labels, metadata)
--accent:         #1B6B4A    (primary green — connection dot, called state, CTAs)
--accent-soft:    #E6F2EC    (green tint backgrounds)
--accent-mid:     #3A9B6E    (unused in v1 — reserved for future)
--warm:           #C4841D    (amber — "stay close" urgency)
--warm-soft:      #FEF7EC    (amber tint backgrounds)
--warm-border:    #F0DDB8    (amber border for alert/stay cards)
--danger:         #B5352A    (destructive actions — quit confirmation)
--danger-soft:    #FDF0EE    (red tint backgrounds)
--called-bg:      #F0F9F4    (called state page tint — unused, bg uses phase class)
--called-accent:  #1B6B4A    (called state accent)
```

### 2.3 Mood Background Colors (phase-dependent)

The full-screen background behind all content shifts color to signal proximity:

| Phase | Background | Emotional tone |
|-------|-----------|----------------|
| `far` | `#F8F7F4` | Neutral warm — "you have time" |
| `mid` | `#F7F5F0` | Slightly warmer — "progressing" |
| `soon` | `#FBF8F1` | Warm amber undertone — "getting close" |
| `next` | `#F5F0E8` | Warm sand — "imminent" |
| `called` | `#EFF8F3` | Cool green — "go now" |
| `done` | `#F8F7F4` | Back to neutral — "finished" |

Transition: `0.8s cubic-bezier(0.22, 1, 0.36, 1)`

### 2.4 Radii and Shadows

```
--radius:    14px   (main cards, context cards)
--radius-sm: 10px   (small elements, buttons, inputs, alert banner)
--radius-lg: 20px   (modal sheet, reserved)
```

No shadow tokens used on this page — relies on borders and background contrast instead, keeping the feel lighter and calmer than the doctor dashboard.

### 2.5 Global Resets

Same as doctor dashboard:
- `box-sizing: border-box` on all elements
- `-webkit-tap-highlight-color: transparent`
- `-webkit-font-smoothing: antialiased`
- Body: `max-width: 430px; margin: 0 auto; min-height: 100dvh; overflow-x: hidden; position: relative`

---

## 3. Page Architecture

The page has two layers:

### Layer 1: Mood Background
```html
<div class="mood-bg phase-far"></div>
```
- `position: fixed; inset: 0; max-width: 430px; margin: 0 auto; z-index: 0`
- Class toggles between `phase-far`, `phase-mid`, `phase-soon`, `phase-next`, `phase-called`, `phase-done`
- Background color transitions with `--transition-mood` (0.8s)

### Layer 2: Content
```html
<div class="content">
  [all visible UI]
</div>
```
- `position: relative; z-index: 1; min-height: 100dvh; display: flex; flex-direction: column`

### Content Section Order (top to bottom):

```
┌─────────────────────────────────────┐
│  HEADER (clinic + connection dot)    │
├─────────────────────────────────────┤
│  ALERT BANNER (conditional)          │
├─────────────────────────────────────┤
│  RDV CONTEXT BAR (conditional)       │
├─────────────────────────────────────┤
│  HERO SECTION (estimate/called/done) │  ← flex: 1, vertically centered
├─────────────────────────────────────┤
│  CONTEXT CARD (conditional)          │
├─────────────────────────────────────┤
│  VISIT SUMMARY (post-visit only)     │
├─────────────────────────────────────┤
│  FOOTER: "Gérer ma place" button     │  ← margin-top: auto (pushed to bottom)
├─────────────────────────────────────┤
│  BRAND FOOTER                        │
└─────────────────────────────────────┘
```

### Floating Elements:
- **Progress toast** — fixed, top: 80px, centered, z-index: 200
- **Quit confirmation modal** — fixed overlay, z-index: 500

---

## 4. Component Specifications

### 4.1 Header

**Padding:** `16px 20px 12px`
**Layout:** `flex; align-items: flex-start; justify-content: space-between`

**Left side:**
- Clinic name: `"Cabinet Dr. Pierre Martin"` — 15px, weight 600, `--text-primary`, letter-spacing -0.2px
- Doctor name: `"Médecin généraliste"` — 13px, `--text-secondary`, margin-top 1px

**Right side — Connection indicator:**
- Green dot: 8×8px circle, `--accent` background, `flex-shrink: 0`, margin-top 8px
- `::after` pseudo-element: ring pulse animation
  - Absolute positioned, inset -3px, border-radius 50%, `1.5px solid --accent`
  - Animation `conn-pulse`: 2.5s infinite, opacity oscillates 0→0.3→0 while scale goes 1→1.4→1

This dot is the **only** real-time connection indicator. No "En direct" badge, no "connecté" text. Just a quietly breathing green dot that disappears from conscious attention but reassures subconsciously.

### 4.2 Alert Banner (Doctor Absence)

**Visibility:** Conditional — shown only when doctor is absent. Animated show/hide via `max-height` + `opacity`.

**Container:** `margin: 0 20px 8px; padding: 12px 16px; border-radius: --radius-sm`
**Layout:** `flex; align-items: center; gap: 10px`

**Variant `alert-warning`:**
- Background: `--warm-soft` (#FEF7EC)
- Text color: `#8B5E14` (dark amber)
- Border: `1px solid --warm-border` (#F0DDB8)

**Content:**
- Info-circle icon: 16×16px, same amber color
- Text: `"Le Dr. Martin reprendra les consultations "` + `<strong>"vers 17h30"</strong>`
  - Line-height: 1.35
  - `<strong>` elements: weight 600

**Hidden state:** `max-height: 0; opacity: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0`
**Transition:** `all 0.4s ease`

**CRITICAL DESIGN DECISION:** The alert gives a **specific return time** ("vers 17h30"), never a vague "Il sera de retour prochainement." Patients need actionable information, not empty reassurance.

### 4.3 RDV Context Bar

**Visibility:** Conditional — shown only for patients with appointments. Same animated show/hide as alert.

**Container:** `margin: 0 20px 4px; padding: 8px 14px; border-radius: --radius-sm`
- Background: `--surface-alt`
- Font-size: 12px, `--text-secondary`
- Layout: `flex; align-items: center; gap: 8px`

**Content:**
- Calendar icon: 14×14px, `--text-tertiary`
- Text: `"Votre RDV était à "` + `<span class="rdv-time">"16h30"</span>` + `" — retard estimé : "` + `<span>"~50 min"</span>`
- `.rdv-time`: weight 600, `--text-primary`

**Hidden state:** Same as alert — `max-height: 0; opacity: 0; padding: 0 14px; margin-bottom: 0`

**DESIGN NOTE:** This acknowledges the appointment time and quantifies the delay. It's honest — the patient already knows they're late; pretending otherwise destroys trust. The delay estimate updates as position changes.

### 4.4 Hero Section — Wait Estimate

**Container:** `flex: 1; flex-direction: column; align-items: center; justify-content: center; text-align: center`
**Padding:** `32px 20px 24px`
**Min-height:** 260px

This section vertically centers in available space (between header/banners and context card/footer), creating a calm focus point.

#### 4.4.1 Eyebrow Label

**Style:** 11px, uppercase, letter-spacing 1.8px, weight 600, margin-bottom 8px
**Color transitions by phase:**
- `far`, `mid`: `--text-tertiary` (muted)
- `soon`: `--warm` (amber urgency)
- `next`: `--accent` (green — imminent)

**Copy varies by state:**
- Far/mid: `"Attente estimée"`
- Soon: `"Bientôt votre tour"`
- Next: `"Vous êtes le prochain"`

#### 4.4.2 Hero Time

**Font:** Fraunces, weight 500, letter-spacing -3px, line-height 0.95
**Three size classes:**
- `.size-xl`: 72px — used for times ≥1 hour
- `.size-lg`: 64px — used for times 15–59 minutes
- `.size-md`: 56px — reserved for very short times

**Time suffix (h/min):** 0.5em of parent size, weight 300, letter-spacing -1px, opacity 0.6

**Format examples:**
- `~1h 40min` → `~1<span class="hero-time-suffix">h</span> 40<span class="hero-time-suffix">min</span>`
- `~48 min` → `~48<span class="hero-time-suffix"> min</span>`
- `~15 min` → `~15<span class="hero-time-suffix"> min</span>`

**Update animation:** On time change, apply `countPulse` animation (scale 1→1.06→1 over 0.5s), then remove class after 600ms.

**Transition:** `all 0.5s cubic-bezier(0.22, 1, 0.36, 1)` — smooths size class changes.

#### 4.4.3 Subtext

**Style:** 15px, `--text-secondary`, margin-top 10px
**Content:** `<strong>[N]</strong> personne(s) devant vous`
- `<strong>`: `--text-primary`, weight 600
- Singular: `"1 personne devant vous"`, Plural: `"6 personnes devant vous"`

### 4.5 Called Hero State

**Replaces** the hero estimate section when patient is called. `display: none` by default, `display: flex` when active.

**Container:** `flex-direction: column; align-items: center; justify-content: center; text-align: center`
**Padding:** `40px 20px`
**Min-height:** 280px

**Components (top to bottom):**

1. **Breathing icon circle:** 72×72px, `--accent` background, white door/arrow icon 32×32px, margin-bottom 24px
   - Animation `called-breathe`: box-shadow pulses from `0 0 0 0 rgba(27,107,74,0.2)` to `0 0 0 16px rgba(27,107,74,0)` over 2s infinite
   - Icon: Lucide `log-in` — door with arrow entering

2. **Title:** `"Vous pouvez entrer"` — Fraunces, 32px, weight 600, `--accent`, letter-spacing -1px, margin-bottom 8px
   - **NOT** "C'est votre tour!" or all-caps. Calm, directive, respectful.

3. **Subtitle:** `"Le Dr. Martin vous attend."` + line break + `"Rendez-vous dans le cabinet."` — 16px, `--text-secondary`, line-height 1.5

**CRITICAL DESIGN DECISIONS:**
- No confetti, no celebration animation
- No patient name shown (RGPD — anyone might see the screen)
- Title is a **gentle instruction**, not an exclamation
- The breathing circle creates a sense of "come now" without anxiety

### 4.6 Done Hero State

**Replaces** the hero section after consultation is complete. `display: none` by default, `display: flex` when active.

**Container:** Same layout as called hero.
**Padding:** `40px 20px`
**Min-height:** 280px

1. **Icon circle:** 64×64px, `--surface-alt` background (muted, not green), checkmark icon 28×28px in `--accent`, margin-bottom 20px

2. **Title:** `"Merci pour votre visite"` — Fraunces, 24px, weight 500, `--text-primary`, letter-spacing -0.5px, margin-bottom 6px

3. **Subtitle:** `"Chez le Dr. Pierre Martin"` — 14px, `--text-secondary`

### 4.7 Context Card

A **shape-shifting card** that changes its visual treatment and content based on the patient's proximity in the queue. Three visual variants:

#### Variant: `ctx-leave` (far from turn)
- Background: `--surface` (#FFFFFF)
- Border: `1px solid --border` (#E8E6E1)
- Icon box: `--surface-alt` bg, `--text-secondary` icon

#### Variant: `ctx-stay` (getting close)
- Background: `--warm-soft` (#FEF7EC)
- Border: `1px solid --warm-border` (#F0DDB8)
- Icon box: `rgba(196,132,29,0.12)` bg, `--warm` icon

#### Variant: `ctx-ready` (next in line)
- Background: `--accent-soft` (#E6F2EC)
- Border: `1px solid rgba(27,107,74,0.15)`
- Icon box: `rgba(27,107,74,0.1)` bg, `--accent` icon

**Container:** `margin: 0 20px 16px; padding: 16px 18px; border-radius: --radius`
**Transition:** `all 0.8s cubic-bezier(0.22, 1, 0.36, 1)` — matches mood transition

**Card anatomy:**
```
┌──────────────────────────────────┐
│  [icon 32×32]  Title text         │
│                                   │
│  Body text with <strong> spans    │
│                                   │
│  ─────────────────────────────── │  ← optional divider
│  Me prévenir avant    [toggle]   │  ← optional notify row
└──────────────────────────────────┘
```

**Icon row:** `flex; align-items: center; gap: 10px; margin-bottom: 8px`
- Icon box: 32×32px, border-radius 8px, centered icon 18×18px
- Title: weight 600, 14px, `--text-primary`

**Body:** 13px, `--text-secondary`, line-height 1.5. `<strong>` elements: `--text-primary`, weight 600.

**Three icon types used:**
- `exit` (Lucide `log-in`): door with arrow — "you can leave"
- `location` (Lucide `map-pin`): pin marker — "stay close"
- `check` (checkmark polyline): "prepare yourself"

**Notification toggle (conditional, only shown in far/mid phases):**
- Container: `margin-top: 12px; padding-top: 12px; border-top: 1px solid --border`
- Layout: `flex; space-between; align-items: center`
- Label: `"Me prévenir avant mon tour"` — 13px, `--text-secondary`, weight 500
- Toggle switch: same spec as doctor dashboard (44×24px, --accent when on, --border when off, 18×18 white knob)

**Appear animation:** When card content changes, apply `slideDown` animation: `opacity: 0; translateY(-8px)` → `opacity: 1; translateY(0)` over 0.4s ease.

### 4.8 Visit Summary (Post-Visit)

**Visibility:** Only shown in the "done" state. `display: none` by default.

**Container:** `margin: 0 20px; padding: 18px; background: --surface; border-radius: --radius; border: 1px solid --border`

**Header:** `"VOTRE VISITE AUJOURD'HUI"` — 12px, uppercase, letter-spacing 1px, `--text-tertiary`, weight 600, margin-bottom 14px

**Stats row:** `flex; gap: 20px; margin-bottom: 16px`
Two stat items:
1. Value: `"48 min"` — Fraunces, 26px, weight 500, `--text-primary`, letter-spacing -1px, line-height 1.1
   Label: `"temps d'attente"` — 11px, `--text-tertiary`, margin-top 2px
2. Value: `"17h49"`
   Label: `"heure de consultation"`

**CTA button:** Full width, `padding: 12px; background: --accent-soft; color: --accent; border-radius: --radius-sm`
- 13px, weight 600
- Hover: `background: #D6ECE2`
- Copy: `"Reprendre RDV avec le Dr. Martin"`

**PURPOSE:** This card drives **stickiness** — it summarizes the visit (validating the patient's experience), and offers a direct re-booking CTA, converting a queue user into a returning AuSuivant user.

### 4.9 Footer — "Gérer ma place" Button

**Container:** `padding: 16px 20px 32px; margin-top: auto`
- `margin-top: auto` pushes this to the bottom of the flex column

**Button:** Full width, `padding: 12px; border-radius: --radius-sm`
- Background: transparent
- Border: `1px solid --border`
- 13px, `--text-tertiary`, weight 500
- Layout: `flex; items-center; justify-content: center; gap: 6px`
- Icon: three-dots (more-horizontal), 15×15px
- Copy: `"Gérer ma place"`
- Hover: `--surface` bg, `--text-secondary` color, border-color `--text-tertiary`

**Visibility:** Hidden during "called" and "done" states.

**On click:** Opens the quit confirmation modal.

**CRITICAL DESIGN DECISION:** This replaces the dangerous bare "Quitter la file" text link from the original. The quit action is buried inside a neutral "manage" button, requiring two deliberate taps to actually leave the queue.

### 4.10 Brand Footer

**Container:** `text-align: center; padding: 12px 20px 20px`
**Text:** `"Propulsé par "` + link `"AuSuivant"` — 11px, `--text-tertiary`, letter-spacing 0.3px
**Link:** `--accent` color, weight 600, no underline

### 4.11 Progress Toast

**Position:** `fixed; top: 80px; left: 50%; transform: translateX(-50%)`
**z-index:** 200

**Style:**
- Background: `--text-primary` (#1A1917)
- Color: white
- Padding: `10px 20px`
- Border-radius: 40px (pill shape)
- 13px, weight 500, white-space: nowrap
- Shadow: `0 8px 24px rgba(0,0,0,0.15)`
- Layout: `flex; items-center; gap: 8px`
- Up-chevron icon: 16×16px

**Hidden state:** `opacity: 0; transform: translateX(-50%) translateY(-20px); pointer-events: none`
**Visible state:** `opacity: 1; transform: translateX(-50%) translateY(0)`
**Transition:** `all 0.35s cubic-bezier(0.22, 1, 0.36, 1)`

**Behavior:** Appears on queue position change, stays visible for 2.5 seconds, then fades out.

### 4.12 Quit Confirmation Modal

**Overlay:** `fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500`
- Layout: `flex; align-items: flex-end; justify-content: center`
- Hidden: `opacity: 0; pointer-events: none`
- Open: `opacity: 1; pointer-events: auto`
- Transition: `opacity 0.25s ease`
- Clicking overlay (outside sheet) closes modal

**Sheet:** Bottom-sheet style
- `background: white; border-radius: 20px 20px 0 0; max-width: 430px; width: 100%`
- Padding: `24px 20px 36px`
- Hidden: `translateY(100%)`
- Open: `translateY(0)`
- Transition: `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)`

**Content:**
1. Drag handle: 36×4px, #D9D9D9, centered, margin `0 auto 20px`
2. Title: `"Annuler votre place ?"` — 18px, weight 700, letter-spacing -0.3px, margin-bottom 8px
3. Description: `"Vous perdrez votre position actuelle dans la file d'attente et devrez vous réinscrire si vous souhaitez consulter le Dr. Martin."` — 14px, `--text-secondary`, line-height 1.5, margin-bottom 24px
   - Note: `Dr.&nbsp;Martin` uses non-breaking space
4. Actions (flex column, gap 8px):
   - **Danger button:** `"Oui, annuler ma place"` — `--danger` bg, white text, full width, padding 14px, `--radius-sm`, 15px weight 600
   - **Cancel button:** `"Non, je reste dans la file"` — `--surface-alt` bg, `--text-primary` text, same sizing

---

## 5. State Machine — The 8 States

The page progresses through 8 states. Each state is a complete configuration of all visible elements.

### State Definition Schema

```typescript
interface PatientState {
  phase: 'far' | 'mid' | 'soon' | 'next' | 'called' | 'done';
  position: number;           // Queue position (0 = called, -1 = done)
  ahead: number;              // People ahead in queue

  // Hero section (mutually exclusive with showCalled/showDone)
  time?: string;              // HTML string with <span> suffixes
  timeSize?: 'size-xl' | 'size-lg' | 'size-md';
  eyebrow?: string;
  subtext?: string;           // HTML string with <strong>
  showCalled?: boolean;
  showDone?: boolean;

  // Alert banner
  alert: boolean;
  alertText?: string;         // HTML string with <strong>

  // RDV context
  rdv: boolean;
  rdvDelay?: string;

  // Context card (null = hidden)
  ctx: 'leave' | 'stay' | 'ready' | null;
  ctxTitle?: string;
  ctxBody?: string;           // HTML string with <strong>
  ctxIconType?: 'exit' | 'location' | 'check';
  showNotify?: boolean;       // Show notification toggle in card

  // Post-visit
  showSummary?: boolean;

  // Toast (shown on transition INTO this state)
  toast: string | null;
}
```

### Complete State Table

#### State 0 — Position #7 (Initial, far)
```
phase:     far
position:  7
ahead:     6
time:      ~1h 40min                    (size-xl)
eyebrow:   "Attente estimée"
subtext:   "<strong>6</strong> personnes devant vous"
alert:     TRUE → "Le Dr. Martin reprendra les consultations <strong>vers 17h30</strong>"
rdv:       TRUE → delay "~50 min"
ctx:       leave
  title:   "Vous avez le temps de sortir"
  body:    "Nous vous enverrons une notification <strong>15 minutes avant votre tour</strong>. Restez joignable."
  icon:    exit
  notify:  TRUE
toast:     null (initial state, no toast)
```

#### State 1 — Position #6 (far, doctor returned)
```
phase:     far
position:  6
ahead:     5
time:      ~1h 25min                    (size-xl)
eyebrow:   "Attente estimée"
subtext:   "<strong>5</strong> personnes devant vous"
alert:     FALSE (doctor is back)
rdv:       TRUE → delay "~45 min"
ctx:       leave
  title:   "Vous avez le temps de sortir"
  body:    "Nous vous enverrons une notification <strong>15 minutes avant votre tour</strong>. Restez joignable."
  icon:    exit
  notify:  TRUE
toast:     "Vous avancez — encore 5 personnes"
```

#### State 2 — Position #5 (mid)
```
phase:     mid
position:  5
ahead:     4
time:      ~1h 05min                    (size-xl)
eyebrow:   "Attente estimée"
subtext:   "<strong>4</strong> personnes devant vous"
alert:     FALSE
rdv:       TRUE → delay "~35 min"
ctx:       leave
  title:   "Vous pouvez encore sortir"
  body:    "Il reste environ <strong>1 heure</strong> avant votre passage. Notification automatique activée."
  icon:    exit
  notify:  TRUE
toast:     "Vous avancez — encore 4 personnes"
```

#### State 3 — Position #4 (mid, getting closer)
```
phase:     mid
position:  4
ahead:     3
time:      ~48 min                      (size-lg — drops to smaller size)
eyebrow:   "Attente estimée"
subtext:   "<strong>3</strong> personnes devant vous"
alert:     FALSE
rdv:       FALSE (RDV context hidden — delay no longer relevant)
ctx:       leave
  title:   "Restez à proximité"
  body:    "Votre tour approche. Évitez de trop vous éloigner du cabinet."
  icon:    location (map-pin)
  notify:  TRUE
toast:     "Vous avancez — encore 3 personnes"
```

#### State 4 — Position #3 (soon)
```
phase:     soon
position:  3
ahead:     2
time:      ~32 min                      (size-lg)
eyebrow:   "Bientôt votre tour"         ← eyebrow changes!
subtext:   "<strong>2</strong> personnes devant vous"
alert:     FALSE
rdv:       FALSE
ctx:       stay                          ← card turns amber!
  title:   "Restez à proximité du cabinet"
  body:    "Votre tour arrive bientôt. Préparez votre <strong>carte vitale</strong> et vos documents."
  icon:    location
  notify:  FALSE (toggle hidden — too late to toggle off)
toast:     "Plus que 2 personnes devant vous"
```

#### State 5 — Position #2 (next)
```
phase:     next
position:  2
ahead:     1
time:      ~15 min                      (size-lg)
eyebrow:   "Vous êtes le prochain"      ← eyebrow changes again!
subtext:   "<strong>1</strong> personne devant vous"   ← singular!
alert:     FALSE
rdv:       FALSE
ctx:       ready                         ← card turns green!
  title:   "Préparez-vous"
  body:    "Vous serez appelé(e) dans quelques minutes. Restez dans la salle d'attente."
  icon:    check
  notify:  FALSE
toast:     "Vous êtes le prochain !"
```

#### State 6 — Called
```
phase:       called
showCalled:  TRUE                       ← hero section replaced with called hero
alert:       FALSE
rdv:         FALSE
ctx:         null (hidden)
footer:      HIDDEN
toast:       null
```

#### State 7 — Done
```
phase:       done
showDone:    TRUE                       ← hero section replaced with done hero
alert:       FALSE
rdv:         FALSE
ctx:         null (hidden)
showSummary: TRUE                       ← visit summary card visible
footer:      HIDDEN
toast:       null
```

---

## 6. Transition Logic

When moving from state N to state N+1:

### 6.1 Background
1. Update `.mood-bg` class to `phase-[newPhase]`
2. CSS transition handles the color shift (0.8s)

### 6.2 Alert Banner
- If `state.alert` is true: remove `.hidden` class, update inner HTML
- If false: add `.hidden` class
- CSS `max-height` + `opacity` transition handles animation (0.4s)

### 6.3 RDV Context
- Same show/hide pattern as alert
- Update delay text when visible

### 6.4 Hero Section
Three mutually exclusive views:
1. **Estimate view** (`heroSection`): shown when neither `showCalled` nor `showDone`
   - Update eyebrow text
   - Update time HTML and size class
   - Apply `countPulse` animation to time, remove after 600ms
   - Update subtext HTML
2. **Called view** (`calledHero`): shown when `showCalled` is true
   - Hide `heroSection` (`display: none`)
   - Add `.active` class to `calledHero`
3. **Done view** (`doneHero`): shown when `showDone` is true
   - Hide `heroSection` (`display: none`)
   - Remove `.active` from `calledHero`, add `.active` to `doneHero`

### 6.5 Context Card
- If `state.ctx` is null: `display: none`
- Otherwise: `display: block`, update class to `ctx-[variant]`
- Update title, body HTML, icon SVG path
- Show/hide notification toggle based on `showNotify`
- Apply `slideDown` animation (0.4s), remove after 500ms

### 6.6 Visit Summary
- `display: block` if `showSummary` is true, `display: none` otherwise

### 6.7 Footer
- `display: none` during called/done states, `display: block` otherwise

### 6.8 Toast
- If `state.toast` is not null and this is an animated transition:
  - Set toast text
  - Add `.visible` class
  - After 2500ms, remove `.visible` class

---

## 7. All Animations

### 7.1 Page Load — Staggered Fade Up

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

| Element | Class | Delay |
|---------|-------|-------|
| Header | `.fade-up` | 0s |
| Alert + RDV | `.fade-up-d1` | 0.08s |
| Hero section | `.fade-up-d2` | 0.16s |
| Context card | `.fade-up-d3` | 0.24s |

All: 0.5s duration, ease timing, `animation-fill-mode: both`

### 7.2 Connection Dot Pulse

```css
@keyframes conn-pulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.4); }
}
```
Duration: 2.5s, ease-in-out, infinite. Applied to `::after` pseudo-element.

### 7.3 Time Update Pulse

```css
@keyframes countPulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
```
Duration: 0.5s, ease. Applied temporarily on time change, removed after 600ms.

### 7.4 Context Card Slide Down

```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```
Duration: 0.4s, ease, fill both. Applied when context card content changes.

### 7.5 Called Icon Breathing

```css
@keyframes called-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(27, 107, 74, 0.2); }
  50% { box-shadow: 0 0 0 16px rgba(27, 107, 74, 0); }
}
```
Duration: 2s, ease-in-out, infinite. Creates a "come now" pulsing ring around the called icon.

### 7.6 Mood Background Transition

Not a keyframe — uses CSS transition:
```css
transition: background 0.8s cubic-bezier(0.22, 1, 0.36, 1);
```

---

## 8. Data Structures

### 8.1 Patient Queue Status (from API)

```typescript
interface PatientQueueStatus {
  id: string;
  clinicId: string;
  clinicName: string;              // "Cabinet Dr. Pierre Martin"
  doctorName: string;              // "Dr. Pierre Martin"
  doctorSpecialty: string;         // "Médecin généraliste"

  position: number;                // 1-indexed, 0 = being seen
  peopleAhead: number;
  estimatedWaitMinutes: number;
  status: 'waiting' | 'notified' | 'called' | 'in-consultation' | 'completed';

  type: 'rdv' | 'walk-in';
  appointmentTime?: string;        // "16:30", only for rdv
  appointmentDelayMinutes?: number;

  doctorAbsent: boolean;
  doctorReturnTime?: string;       // "17h30"

  isConnected: boolean;            // WebSocket connection status
}
```

### 8.2 Phase Derivation Logic

```typescript
function derivePhase(status: PatientQueueStatus): Phase {
  if (status.status === 'completed') return 'done';
  if (status.status === 'called' || status.status === 'in-consultation') return 'called';
  if (status.peopleAhead <= 1) return 'next';
  if (status.peopleAhead <= 2) return 'soon';
  if (status.peopleAhead <= 4) return 'mid';
  return 'far';
}
```

### 8.3 Context Card Derivation

```typescript
function deriveContextCard(phase: Phase): ContextType {
  if (phase === 'called' || phase === 'done') return null;
  if (phase === 'next') return 'ready';
  if (phase === 'soon') return 'stay';
  return 'leave';  // far, mid
}
```

### 8.4 Eyebrow Derivation

```typescript
function deriveEyebrow(phase: Phase): string {
  if (phase === 'next') return 'Vous êtes le prochain';
  if (phase === 'soon') return 'Bientôt votre tour';
  return 'Attente estimée';  // far, mid
}
```

### 8.5 Time Size Derivation

```typescript
function deriveTimeSize(minutes: number): string {
  if (minutes >= 60) return 'size-xl';
  if (minutes >= 15) return 'size-lg';
  return 'size-md';
}
```

### 8.6 Time Format

```typescript
function formatWaitTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `~${h}<span class="hero-time-suffix">h</span> ${String(m).padStart(2, '0')}<span class="hero-time-suffix">min</span>`;
  }
  return `~${minutes}<span class="hero-time-suffix"> min</span>`;
}
```

---

## 9. Real-Time Update Strategy

### 9.1 What Changes in Real-Time

Via WebSocket:
- Queue position / people ahead
- Estimated wait time
- Doctor absence status + return time
- Patient status transitions (waiting → called → completed)

### 9.2 Estimate Display Rules

**CRITICAL — never show estimate increasing by more than 5 minutes in a single update.**

If the backend sends an estimate 6+ minutes higher than current display:
- Option A: Show a **range** instead: `"Entre 1h20 et 2h00"`
- Option B: Use a **rolling average** to smooth the increase over 2-3 updates
- Option C: Cap display increase at +5min per update, catch up gradually

This prevents the trust-destroying experience from the original app where a patient advances in line but sees their wait time jump up by 25 minutes.

### 9.3 Toast Triggers

Show a progress toast whenever `peopleAhead` decreases. Toast messages:
- If ahead > 3: `"Vous avancez — encore [N] personnes"`
- If ahead = 2: `"Plus que 2 personnes devant vous"`
- If ahead = 1: `"Vous êtes le prochain !"`

### 9.4 Phase Transitions

On every WebSocket update, re-derive phase. If phase changes:
1. Transition mood background
2. Update eyebrow
3. Swap context card variant
4. Show relevant toast

---

## 10. SVG Icon Reference

All icons are inline SVGs, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`.

| Name | Usage | Path Data |
|------|-------|-----------|
| **info-circle** | Alert banner | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` |
| **calendar** | RDV context | `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` |
| **chevron-up** | Toast icon | `<polyline points="18 15 12 9 6 15"/>` |
| **log-in** | Exit icon, called icon | `<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>` |
| **map-pin** | Location icon | `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>` |
| **check** | Ready icon, done icon | `<polyline points="20 6 9 17 4 12"/>` |
| **more-horizontal** | Manage button | `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>` |

---

## 11. Accessibility Requirements

- Connection dot should have `aria-label="Connexion active"` (or hidden, since it's decorative status)
- Alert banner should use `role="alert"` for screen reader announcements
- Toggle switch should use `role="switch"` with `aria-checked`
- Modal should trap focus when open, be closable via Escape key
- All interactive elements: minimum 44×44px touch target (manage button, toggle, modal buttons)
- Toast should use `role="status"` and `aria-live="polite"`
- Hero time content should have an `aria-label` with plain text version (e.g., "environ 1 heure 40 minutes")
- Color-only phase changes are accompanied by text changes (eyebrow, context card), satisfying colorblind accessibility

---

## 12. Key Design Principles (for implementer reference)

1. **One question answered:** The patient's only question is "How much longer?" — the giant centered time estimate answers it instantly without scanning.

2. **No exposed system state:** No position numbers, no "Position #7", no timeline steppers. The patient sees people-ahead count and time estimate only. Position is an internal concept.

3. **Mood, not data:** The shifting background color and evolving context card create an emotional journey from "relax" → "get ready" → "go now" without requiring the patient to read or interpret data.

4. **Estimates never jump up visibly:** Even if backend data shows increased wait, the display smooths it. A patient who advances in line should never see their estimate get worse — that destroys all trust.

5. **RGPD default:** No patient name is ever shown on this screen — not at check-in, not when called, not in the done state. Anyone might see the screen.

6. **Calm "called" state:** No confetti, no all-caps "C'EST VOTRE TOUR!", no celebration. A breathing green circle and `"Vous pouvez entrer"` — directive, calm, respectful.

7. **Protected quit:** The quit action requires two deliberate taps (manage → confirm), not an exposed text link that can be accidentally hit.

8. **Honest doctor absence:** When the doctor is away, show a **specific return time** ("vers 17h30"), not "Il sera de retour prochainement." Patients can plan around a time; they can't plan around vagueness.

9. **Stickiness through post-visit summary:** The done state shows wait time data and a re-booking CTA, converting a one-time queue user into a returning AuSuivant patient.

10. **Context cards give actionable advice:** "Vous avez le temps de sortir" with notification toggle, "Préparez votre carte vitale" — not generic platitudes. Each phase tells the patient what to **do**.
