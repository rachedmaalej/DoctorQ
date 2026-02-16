# AuSuivant Doctor Dashboard — Implementation Specification

**Version:** 2.0
**Target:** Mobile-first doctor dashboard (max-width: 430px)
**Language:** French (formal "vous" throughout)
**Reference mockup:** `ausuivant-dashboard-v2.html`

---

## 1. Design Foundation

### 1.1 Typography

| Role | Font | Weight | Size | Tracking |
|------|------|--------|------|----------|
| Brand / hero numbers | `Fraunces` (serif, variable) | 500–600 | 18–44px | -0.3px to -2px |
| Body / UI | `DM Sans` (sans-serif, variable) | 300–700 | 11–19px | varies |
| Fallback stack | `-apple-system, sans-serif` | — | — | — |

Load from Google Fonts:
```
DM Sans: ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700
Fraunces: ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300
```

### 1.2 Color Tokens

```
--bg:             #F7F6F3    (page background — warm off-white)
--surface:        #FFFFFF    (cards, sheets, topbar)
--surface-alt:    #F0EFEC    (secondary surfaces, muted inputs)
--border:         #E4E2DD    (standard borders)
--border-light:   #ECEAE5    (subtle dividers)
--text-primary:   #1A1A1A    (headings, primary text)
--text-secondary: #6B6560    (body text, descriptions)
--text-tertiary:  #9C9690    (hints, labels, metadata)
--accent:         #1B6B4A    (primary green — brand, CTAs, active states)
--accent-light:   #E8F5EE    (green tint backgrounds)
--accent-hover:   #15553B    (green hover/pressed)
--warning:        #C4841D    (amber — notified status, priority)
--warning-light:  #FFF8EC    (amber tint backgrounds)
--danger:         #C0392B    (red — remove, destructive actions)
--danger-light:   #FDEEEC    (red tint backgrounds)
--blue:           #2C5F8A    (consultation status)
--blue-light:     #EDF3F8    (blue tint backgrounds)
```

### 1.3 Shadows

```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)
--shadow-md: 0 2px 8px rgba(0,0,0,0.06)
--shadow-lg: 0 4px 20px rgba(0,0,0,0.08)
```

### 1.4 Border Radii

```
--radius:    12px   (cards, buttons, main containers)
--radius-sm:  8px   (small elements, inputs, position badges)
--radius-lg: 16px   (large containers)
```

### 1.5 Global Resets

- `box-sizing: border-box` on all elements
- `-webkit-tap-highlight-color: transparent`
- `-webkit-font-smoothing: antialiased`
- Body: `max-width: 430px; margin: 0 auto; min-height: 100dvh; overflow-x: hidden;`

---

## 2. Page Layout — Top to Bottom

The dashboard is a single scrollable page. Sections appear in this exact order:

```
┌─────────────────────────────────┐
│  TOPBAR (sticky)                │
├─────────────────────────────────┤
│  HERO METRICS                   │
├─────────────────────────────────┤
│  SESSION CONTROLS               │
├─────────────────────────────────┤
│  PRIMARY ACTION (Call Next)     │
├─────────────────────────────────┤
│  ACTIVE CONSULTATION BAR        │
├─────────────────────────────────┤
│  SECTION HEADER: File d'attente │
├─────────────────────────────────┤
│  QUEUE LIST (scrollable cards)  │
│    Card 1 (notified)            │
│    Card 2                       │
│    Card 3                       │
│    Card 4                       │
├─────────────────────────────────┤
│  SECTION HEADER: Bilan          │
├─────────────────────────────────┤
│  SUMMARY CARD (dark)            │
└─────────────────────────────────┘
  [FAB: + button, fixed bottom-right]
```

**Overlays (above everything):**
- Add Patient bottom sheet (z-index: 210)
- Settings full-screen slide panel (z-index: 210)
- Dark overlay behind each (z-index: 200)

---

## 3. Component Specifications

### 3.1 Topbar

**Position:** `sticky; top: 0; z-index: 100`
**Background:** `--surface` with `1px solid --border-light` bottom border
**Padding:** `12px 20px`
**Layout:** `flex; align-items: center; justify-content: space-between`

**Left side (flex, gap: 12px):**
- Brand text: `"AuSuivant"` — Fraunces serif, 18px, weight 600, color `--accent`, letter-spacing -0.3px
- Session status (flex, gap: 8px):
  - Green dot: 8×8px circle, `--accent` background, `pulse-dot` animation (opacity oscillates between 1 and 0.4 over 2s)
  - Label: `"En consultation"` — DM Sans 13px, weight 500, color `--text-secondary`

**Right side:**
- Settings gear button: 36×36px, transparent background, `--text-secondary` color, 20×20px Lucide `settings` icon. Hover: `--surface-alt` background. Triggers `openSettings()`

### 3.2 Hero Metrics

**Background:** `--surface` with `1px solid --border-light` bottom border
**Padding:** `20px 20px 16px`

**Primary row (flex, align-items: baseline, gap: 8px, margin-bottom: 12px):**
- Count: `"4"` — Fraunces, 44px, weight 600, line-height 1, `--text-primary`, letter-spacing -2px. On screens ≤380px: 38px.
- Label: `"patients en attente"` — DM Sans, 15px, weight 400, `--text-secondary`

**Stats row (flex, gap: 20px):**
Each stat is a flex row (align-items: center, gap: 6px):
1. Clock icon (15×15px, `--text-tertiary`) + `"Attente moy. "` (13px, `--text-secondary`) + `"18 min"` (weight 600, `--text-primary`)
2. X icon (15×15px, `--text-tertiary`) + `"Fin estimée "` (13px, `--text-secondary`) + `"~18h11"` (weight 600, `--text-primary`)

### 3.3 Session Controls

**Container:** `padding: 10px 20px; background: --surface`
**Controls:** flex row, gap 8px

Two buttons, each `flex: 1`:
- **Default:** padding 10px, `--radius-sm`, 1px solid `--border`, `--surface` bg, 13px weight 500, `--text-secondary`, flex centered with gap 6px. 16×16px icon.
- **Active state:** `--accent-light` bg, `--accent` text, border-color `rgba(27,107,74,0.2)`
- Hover: `--surface-alt` bg

**Button 1 (active by default):** Checkmark-circle icon + `"Consultations actives"`
**Button 2:** Pause icon + `"Mettre en pause"`

Clicking one makes it active and deactivates the other (toggle group).

### 3.4 Primary Action — "Call Next" Button

**Container:** `padding: 16px 20px`

**Button:** Full width, `padding: 18px 24px`, `--accent` bg, white text, `--radius` border-radius
- `box-shadow: 0 2px 12px rgba(27,107,74,0.2)`
- `::before` pseudo-element: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)` — subtle glass sheen
- Hover: `--accent-hover` bg, translateY(-1px), stronger shadow
- Active: translateY(0), reduced shadow

**Layout:** flex, space-between, items centered

**Left column (flex column, gap: 2px, text-align: left):**
- Eyebrow: `"APPELER LE SUIVANT"` — 12px, uppercase, letter-spacing 1px, opacity 0.75, weight 500
- Name: `"Léa L."` — 19px, weight 600, letter-spacing -0.3px. On ≤380px: 17px
- Meta: `"Arrivée à 15h51 · Avec rendez-vous"` — 12px, opacity 0.7

**Right:** Circle icon container — 44×44px, `rgba(255,255,255,0.15)` bg, white right-arrow icon (22×22px)

### 3.5 Active Consultation Bar

**Container:** `margin: 0 20px 8px; padding: 14px 16px`
- `--blue-light` bg, `--radius`, `1px solid rgba(44,95,138,0.1)` border
- flex, space-between, items centered

**Left (flex, gap: 10px):**
- Blue pulsing dot: 8×8px, `--blue`, `pulse-dot` animation at 1.5s
- Text: `"En consultation : "` (13px, `--blue`) + `"Nicolas D."` (weight 600)

**Right:** `"18 min"` — 12px, `--blue`, opacity 0.7, weight 500, `font-variant-numeric: tabular-nums`

### 3.6 Section Header

**Layout:** `padding: 20px 20px 10px; flex; space-between; items centered`

**Left:** Section title — 12px, uppercase, letter-spacing 1.2px, `--text-tertiary`, weight 600

**Right (for queue section):** RGPD toggle button — flex, gap 4px, eye icon (13×13px), text `"RGPD"`, 11px `--text-tertiary`. Hover: `--surface-alt` bg, padding 4px 8px, border-radius 6px.

### 3.7 Queue Cards

**List container:** `padding: 0 20px 100px; flex column; gap: 6px`

Each card is a layered structure enabling swipe-to-reveal:

```
┌───────────────────────────────────────┐
│  .queue-card  (overflow: hidden)      │
│  ┌─────────────────────────────────┐  │
│  │  .queue-card-inner (z-index: 2) │  │  ← slides left on swipe
│  │  [pos] [details]    [estimate]  │  │
│  └─────────────────────────────────┘  │
│  ┌──────────┬──────────┐              │
│  │ Priorité │ Retirer  │  (z-index:1) │  ← revealed behind inner
│  │  amber   │   red    │              │
│  └──────────┴──────────┘              │
└───────────────────────────────────────┘
```

**Card outer:** `--surface` bg, `--radius`, `1px solid --border-light`, `--shadow-sm`, `overflow: hidden`. Active press: `scale(0.99)`.

**Card inner:** `padding: 14px 16px; flex; items-center; gap: 14px; background: --surface; z-index: 2`
- Transition: `transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)`
- When swiped: `translateX(-140px)`

**Position badge:** 36×36px, `--radius-sm`, centered text, weight 600, 14px, `font-variant-numeric: tabular-nums`
- Default: `--surface-alt` bg, `--text-secondary` text
- Position 1 (notified): `--warning-light` bg, `--warning` text

**Details column (flex: 1, min-width: 0):**
- Name row (flex, gap: 8px, margin-bottom: 2px):
  - Name: weight 600, 15px, letter-spacing -0.2px. RGPD format: `"Prénom N."` (e.g., "Léa L.")
  - Tags (10px, 2px 7px padding, 20px radius, weight 600, uppercase, letter-spacing 0.5px):
    - `.tag-rdv`: `--accent-light` bg, `--accent` text, copy: `"RDV"`
    - `.tag-walk-in`: `--surface-alt` bg, `--text-tertiary` text, copy: `"SANS RDV"`
    - `.tag-notified`: `--warning-light` bg, `--warning` text, copy: `"NOTIFIÉE"` / `"NOTIFIÉ"`
- Meta row: 12px, `--text-tertiary`, copy format: `"Arrivée 15h51"`

**Estimate column (flex-shrink: 0, text-align: right):**
- For position 1: only label `"Prochaine"` (10px, uppercase, `--text-tertiary`)
- For positions 2+: value `"~12 min"` (13px, weight 500, `font-variant-numeric: tabular-nums`) + label `"Attente est."` (10px, uppercase, letter-spacing 0.3px, `--text-tertiary`)

**Hidden action buttons (positioned absolute, right: 0, top: 0, bottom: 0):**
Two buttons, each 70px wide, flex column centered, gap 4px, white text, 10px weight 600:
1. `.action-priority`: `--warning` bg, star icon (20×20), label `"Priorité"`
2. `.action-remove`: `--danger` bg, X icon (20×20), label `"Retirer"`

**Swipe hint (first card only):**
- Positioned absolute, right: 16px, vertically centered
- Left-arrow icon (14×14) + text `"glisser"` (11px, `--text-tertiary`)
- Appears after 2s delay, fades in over ~0.6s, stays visible, fades out by 6s total
- Arrow has a gentle horizontal oscillation animation (±6px over 1.5s)

**Swipe gesture behavior:**
1. `touchstart`: Record initial X position
2. `touchmove`: Calculate horizontal delta. If delta > 10px, translate `.queue-card-inner` left by `min(delta, 140)px` with no transition
3. `touchend`: If delta > 70px, snap to -140px (card is "swiped open"). Otherwise snap back to 0. Use `0.25s cubic-bezier(0.22,1,0.36,1)` easing
4. Only one card can be swiped open at a time — opening one closes others
5. Clicking outside any card closes all swiped cards

### 3.8 Summary Card (End-of-Day Bilan)

**Container:** `margin: 0 20px 12px; padding: 16px`
- Background: `linear-gradient(135deg, #1A1A1A 0%, #2D2B28 100%)` — dark warm card
- `--radius`, white text, `overflow: hidden`
- `::before` decorative circle: 120px, positioned -30px top-right, `rgba(255,255,255,0.04)`

**Header (flex, space-between, margin-bottom: 14px):**
- Title: `"Hier — mardi 15 février"` — 13px, weight 500, opacity 0.7
- Dismiss button: 28×28px circle, `rgba(255,255,255,0.1)` bg, `×` character, `rgba(255,255,255,0.5)` color

**Stats row (flex, gap: 24px):**
Three stat items, each:
- Value: Fraunces, 28px, weight 500, letter-spacing -1px, line-height 1.1
- Label: 11px, opacity 0.5, margin-top 2px

Data:
1. `"14"` / `"patients vus"`
2. `"12 min"` / `"attente moyenne"`
3. `"17h48"` / `"fin de journée"`

**Improvement footer (margin-top: 14px, padding-top: 12px, 1px solid rgba(255,255,255,0.1) top border):**
- Badge: `"↓ 23%"` — `rgba(27,107,74,0.3)` bg, `#7DD3A8` text, 12px weight 600, 2px 8px padding, 20px radius
- Text: `"d'attente vs. semaine précédente"` — 12px, opacity 0.6

### 3.9 Floating Action Button (FAB)

**Position:** Fixed, bottom: 24px, right: 24px (on mobile ≤430px). On wider screens: `right: calc(50% - 215px + 24px)` to stay within the 430px container.
**Size:** 56×56px circle
**Background:** `--text-primary` (#1A1A1A)
**Icon:** Plus icon, 24×24px, white, stroke-width 2.2
**Shadow:** `0 4px 16px rgba(0,0,0,0.2)`
**z-index:** 90

**States:**
- Hover: `scale(1.08)`, stronger shadow
- Active press: `scale(0.96)`
- Open (sheet visible): icon rotates 45° → becomes × close icon. Transition: `0.3s cubic-bezier(0.22,1,0.36,1)`

**Behavior:** Toggles the Add Patient bottom sheet. When sheet is open, clicking FAB closes it.

---

## 4. Add Patient Bottom Sheet

### 4.1 Sheet Container

- Fixed bottom, horizontally centered within 430px
- `border-radius: 20px 20px 0 0`, `--surface` bg
- `max-height: 92dvh`, `overflow-y: auto`, `overscroll-behavior: contain`
- z-index: 210
- Hidden by default: `translateY(100%)`
- Open state: `translateY(0)` — transition `0.4s cubic-bezier(0.22, 1, 0.36, 1)`

**Backdrop overlay:** Fixed fullscreen, `rgba(0,0,0,0)` → `rgba(0,0,0,0.4)` on open. z-index: 200. Clicking it closes the sheet.

### 4.2 Sheet Header

- Drag handle: 36×4px, `#D9D9D9`, centered, `margin: 10px auto 0`
- Header row: `padding: 16px 20px 0; flex; space-between; items-center`
  - Title: `"Ajouter un patient"` — 18px, weight 700, letter-spacing -0.3px
  - Close button: 32×32px circle, `--surface-alt` bg, X icon 18×18px, `--text-secondary`. Hover: `--border` bg

### 4.3 Form Body

**Padding:** 20px

#### Type Toggle (segmented control)
- Container: `--surface-alt` bg, `--radius-sm`, 3px padding, margin-bottom 20px
- Two buttons, each `flex: 1; padding: 10px 12px; border-radius: 6px`
  - Default: transparent bg, 13px weight 500, `--text-tertiary`
  - Selected: `--surface` bg, `--text-primary`, weight 600, `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`
  - Each has a 15×15 icon + text

**Option 1 (default selected):** Calendar icon + `"Avec rendez-vous"`
**Option 2:** Door icon + `"Sans rendez-vous"`

Selecting "Sans rendez-vous" collapses the appointment time field (animated).

#### Name Fields (side by side)
Row: `flex; gap: 8px`

Two identical groups, each `flex: 1`:
- Label: `"PRÉNOM"` / `"NOM"` — 12px, weight 600, uppercase, letter-spacing 0.8px, `--text-tertiary`, margin-bottom 6px
- Input: Full width, `padding: 13px 14px`, `1.5px solid --border`, `--radius-sm`, 15px, `--text-primary`
  - Placeholder: `"Marie"` / `"Dupont"` — `--text-tertiary`
  - Focus: border `--accent`, `box-shadow: 0 0 0 3px rgba(27,107,74,0.08)`
  - Error: border briefly flashes `--danger` for 2s

#### Phone Field
- Label: `"TÉLÉPHONE"` (same label style)
- Compound input (flex row, gap: 8px):
  - Prefix: `"+33"` — fixed 72px wide, `13px 10px` padding, `1.5px solid --border`, `--radius-sm`, `--surface-alt` bg, `--text-secondary`, centered text. This is a static div, not editable.
  - Number input: `flex: 1`, same input style, `type="tel"`, `inputmode="numeric"`, `maxlength="14"`, placeholder `"6 12 34 56 78"`
- Hint below: `"9 chiffres après l'indicatif · Utilisé pour les notifications"` — 11px, `--text-tertiary`, margin-top 5px

**Auto-formatting:** On input, strip non-digits, cap at 9 digits, format as `X XX XX XX XX` (insert space after positions 1, 3, 5, 7).

#### Appointment Time (conditional)
- Container with animated show/hide: `max-height: 0; opacity: 0; overflow: hidden` → `max-height: 90px; opacity: 1; margin-bottom: 16px` when type is "rdv"
- Transition: `0.3s cubic-bezier(0.22,1,0.36,1)`
- Label: `"HEURE DU RENDEZ-VOUS"`
- Input: `type="time"`, default value `"17:30"`, same input styling

#### Notes Field
- Label: `"NOTES"` + inline suffix `"— optionnel"` (in normal weight, no uppercase, no letter-spacing)
- Textarea: `min-height: 60px; max-height: 120px; resize: vertical`
  - `padding: 12px 14px`, `1.5px solid --border`, `--radius-sm`, 14px
  - Placeholder: `"Ex : patient prioritaire, personne âgée…"`
  - Focus: same accent border + shadow as inputs

#### Submit Button
- Full width, `padding: 16px`, `--accent` bg, white text, `--radius`
- 15px, weight 600
- `box-shadow: 0 2px 10px rgba(27,107,74,0.18)`
- Hover: `--accent-hover`, translateY(-1px)
- Active: translateY(0)
- Copy: `"Ajouter à la file d'attente"`

### 4.4 Success State

After successful submit, the form body is hidden and replaced with:

**Layout:** flex column, centered, `padding: 40px 20px`

1. **Success icon:** 56×56px circle, `--accent-light` bg, checkmark icon 28×28 in `--accent`. Animation: `successPop` — scales from 0.5 to 1 with opacity 0→1 over 0.4s, `cubic-bezier(0.22,1,0.36,1)`.

2. **Title:** `"Patient ajouté"` — 18px, weight 700, letter-spacing -0.3px

3. **Subtitle:** `"[Prénom] [N]. a été ajouté(e) à la file"` — 14px, `--text-secondary`. Dynamically built from form inputs. Example: `"Marie D. a été ajouté(e) à la file"`

4. **Position pill:** `"Position #5 dans la file"` — `--surface-alt` bg, 30px radius, 8px 18px padding, 13px weight 600, `--text-primary`

5. **Close button:** `"Fermer"` — `--surface-alt` bg, `--text-primary`, `--radius-sm`, 14px weight 600, `padding: 12px 48px`, margin-top 24px. Hover: `--border` bg.

**On close:** Reset form (clear all fields, switch back to form body view, close sheet).

**Side effect:** The hero count on the dashboard increments by 1 when patient is submitted.

---

## 5. Settings Panel

### 5.1 Panel Container

- Full-screen slide-over from right
- Fixed position, `width: 100%; max-width: 430px; height: 100dvh`
- `--bg` background
- z-index: 210
- Hidden: positioned off-screen to the right (`right: -100%`)
- Open: `right: 0` — transition `0.4s cubic-bezier(0.22, 1, 0.36, 1)`
- `overflow-y: auto; overscroll-behavior: contain`

**Backdrop:** Same dark overlay as Add Patient sheet. Clicking it closes settings.

### 5.2 Settings Topbar

**Position:** `sticky; top: 0; z-index: 5`
**Background:** `--surface`, `1px solid --border-light` bottom
**Padding:** `14px 20px`
**Layout:** flex, gap 12px, items centered

- Back button: 36×36px, transparent bg, left-chevron icon 20×20, `--text-primary`. Hover: `--surface-alt`
- Title: `"Paramètres"` — 17px, weight 700, letter-spacing -0.3px

### 5.3 Clinic Profile Card

**Container:** `margin: 12px 20px; padding: 16px`, `--surface` bg, `--radius`, `1px solid --border-light`
**Layout:** flex, gap 14px, items centered

- **Avatar:** 48×48px circle, `--accent` bg, white initials `"PM"` — Fraunces 20px, weight 600
- **Info column:**
  - Name: `"Dr. Pierre Martin"` — 15px, weight 600, letter-spacing -0.2px
  - Specialty: `"Médecin généraliste · Paris 11e"` — 12px, `--text-tertiary`
  - Plan badge: `"Essai gratuit · 12 jours restants"` — 11px weight 600, `--accent-light` bg, `--accent` text, 2px 8px padding, 20px radius, `display: inline-block`, margin-top 4px

### 5.4 Settings Sections

Each section:
- Container: `padding: 8px 0`
- Section label: `padding: 8px 20px 6px`, 11px uppercase, letter-spacing 1.2px, weight 600, `--text-tertiary`
- Group: `--surface` bg, bordered top and bottom with `1px solid --border-light`

Each item within a group:
- `padding: 14px 20px; flex; items-center; gap: 14px`
- `1px solid --border-light` bottom (except last child)
- Hover: `rgba(0,0,0,0.015)` bg
- Cursor: pointer

**Item anatomy:**
```
[icon-box 36×36] [content: title + desc] [right: value/toggle/chevron]
```

**Icon box:** 36×36px, `--radius-sm`, centered icon 18×18px
Color variants:
- `.si-green`: `--accent-light` bg, `--accent` icon
- `.si-blue`: `--blue-light` bg, `--blue` icon
- `.si-warm`: `--warning-light` bg, `--warning` icon
- `.si-gray`: `--surface-alt` bg, `--text-secondary` icon
- `.si-red`: `--danger-light` bg, `--danger` icon

**Content:** flex: 1, min-width: 0
- Title: 14px, weight 500, `--text-primary`
- Description: 12px, `--text-tertiary`, margin-top 1px

**Right column (flex-shrink: 0, flex, gap: 6px, items-center):**
- Value text: 13px, `--text-tertiary`, weight 500
- Status chip: 12px weight 600, 4px 10px padding, 20px radius, `--accent-light` bg, `--accent` text
- Chevron: Lucide right-chevron 16×16, `--border` color
- Toggle switch: 44×24px, 12px radius
  - On: `--accent` bg, knob at `left: 23px`
  - Off: `--border` bg, knob at `left: 3px`
  - Knob: 18×18px white circle, `box-shadow: 0 1px 3px rgba(0,0,0,0.15)`
  - Transition: `0.2s` for both bg and knob position

### 5.5 Complete Settings Items

#### Section: "MON CABINET"

| Icon | Color | Title | Description | Right |
|------|-------|-------|-------------|-------|
| House | si-green | Profil du cabinet | Nom, adresse, horaires d'ouverture | Chevron |
| Users | si-blue | Équipe & accès | Gérer les secrétaires et collaborateurs | Value "2 membres" + Chevron |
| Monitor | si-green | Affichage salle d'attente | Écran TV pour vos patients | Chip "Activé" + Chevron |

#### Section: "FILE D'ATTENTE"

| Icon | Color | Title | Description | Right |
|------|-------|-------|-------------|-------|
| Clock | si-warm | Durée moy. consultation | Utilisée pour estimer l'attente | Value "15 min" + Chevron |
| Bell | si-blue | Notifications patients | Prévenir quand leur tour approche | Toggle (on) |
| Eye | si-warm | Affichage des noms | Conformité RGPD | Value "Prénom N." + Chevron |
| Smartphone | si-gray | QR code d'enregistrement | Patients s'enregistrent eux-mêmes | Toggle (on) |

#### Section: "BILAN & RAPPORTS"

| Icon | Color | Title | Description | Right |
|------|-------|-------|-------------|-------|
| BarChart | si-green | Bilan de fin de journée | Résumé quotidien sur le tableau de bord | Toggle (on) |
| Mail | si-blue | Rapport hebdomadaire | E-mail chaque lundi avec vos statistiques | Toggle (on) |

#### Section: "COMPTE"

| Icon | Color | Title | Description | Right |
|------|-------|-------|-------------|-------|
| CreditCard | si-green | Abonnement | Essai gratuit · Expire le 28 fév. 2026 | Chevron |
| HelpCircle | si-gray | Aide & support | FAQ, contact, tutoriels | Chevron |
| Shield | si-gray | Confidentialité & RGPD | Politique de données, droits patients | Chevron |

### 5.6 Settings Footer

**Container:** `padding: 20px; text-align: center`

- **Logout button:** Full width, `padding: 12px`, `--radius-sm`, transparent bg, `1px solid --danger` border, `--danger` text, 14px weight 600. Hover: `--danger-light` bg. Copy: `"Se déconnecter"`
- **Version:** `"AuSuivant v1.0.0 · © 2026"` — 11px, `--text-tertiary`, margin-top 12px

---

## 6. Animations

### 6.1 Page Load — Staggered Fade Up

Each section animates in with a staggered delay:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

| Element | Duration | Delay |
|---------|----------|-------|
| Hero metrics | 0.4s | 0s |
| Primary action | 0.4s | 0.05s |
| Active consultation | 0.4s | 0.1s |
| Queue card 1 | 0.35s | 0.15s |
| Queue card 2 | 0.35s | 0.2s |
| Queue card 3 | 0.35s | 0.25s |
| Queue card 4 | 0.35s | 0.3s |
| Summary card | 0.4s | 0.35s |

All use `animation-fill-mode: both` (except hero metrics which uses default).

### 6.2 Pulse Animation (Status Dots)

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```
- Session indicator: 2s cycle
- Consultation dot: 1.5s cycle

### 6.3 Swipe Hint (First Card)

```css
@keyframes hint-fade {
  0% { opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes hint-slide {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-6px); }
}
```
- `hint-fade`: 4s duration, 2s start delay, forwards fill
- `hint-slide`: 1.5s infinite loop on the arrow icon

### 6.4 Success Icon Pop

```css
@keyframes successPop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```
Duration: 0.4s, `cubic-bezier(0.22, 1, 0.36, 1)`

### 6.5 Shared Transition Curve

Most UI transitions use `cubic-bezier(0.22, 1, 0.36, 1)` — this is an ease-out with a slight overshoot, giving animations a natural, responsive feel. Use this for sheets, swipe snapping, and panel slides.

Simple hover/focus transitions use `0.15s ease`.

---

## 7. Responsive Behavior

| Breakpoint | Adaptation |
|------------|------------|
| ≤430px | FAB positioned at `right: 24px` (default mobile) |
| >430px | Body constrained to 430px centered. FAB positioned at `right: calc(50% - 215px + 24px)`. Settings panel uses `transform: translateX` instead of `right` positioning |
| ≤380px | Hero count: 38px. Call-next name: 17px |

---

## 8. Data Structures

### 8.1 Queue Entry (for rendering cards)

```typescript
interface QueueEntry {
  id: string;
  position: number;               // 1-indexed
  firstName: string;
  lastName: string;
  displayName: string;            // RGPD-formatted: "Prénom N." e.g. "Léa L."
  arrivalTime: string;            // Formatted: "15h51"
  type: 'rdv' | 'walk-in';
  status: 'waiting' | 'notified' | 'in-consultation' | 'completed';
  estimatedWaitMinutes: number | null;  // null for position 1
  appointmentTime?: string;       // Only for type 'rdv'
  notes?: string;
}
```

### 8.2 Dashboard Stats

```typescript
interface DashboardStats {
  waitingCount: number;
  inConsultation: { name: string; durationMinutes: number } | null;
  averageWaitMinutes: number;
  estimatedEndTime: string;       // "~18h11"
  nextPatient: QueueEntry | null;
}
```

### 8.3 Add Patient Form Data

```typescript
interface AddPatientInput {
  firstName: string;              // Required
  lastName: string;               // Optional
  phone: string;                  // 9 digits (no prefix)
  type: 'rdv' | 'walkin';
  appointmentTime?: string;       // HH:MM, only when type='rdv'
  notes?: string;
}
```

### 8.4 Settings Configuration

```typescript
interface ClinicSettings {
  // Cabinet
  clinicProfile: { name: string; address: string; hours: string };
  teamMembers: number;
  waitingRoomDisplay: boolean;

  // Queue
  avgConsultationMinutes: number;  // Default: 15
  patientNotifications: boolean;   // Default: true
  nameDisplayMode: 'full' | 'first-initial' | 'initials';  // Default: 'first-initial'
  qrCodeEnabled: boolean;          // Default: true

  // Reports
  dailySummary: boolean;           // Default: true
  weeklyReport: boolean;           // Default: true

  // Account
  plan: 'trial' | 'pro' | 'premium';
  trialExpiresAt: string | null;
}
```

---

## 9. Accessibility Requirements

- All icon-only buttons must have `aria-label` attributes
- All form inputs must have associated `<label>` elements
- Toggle switches should use `role="switch"` with `aria-checked`
- Bottom sheet should trap focus when open
- Escape key should close open sheets/panels
- Color contrasts must meet WCAG AA (the palette above is designed for this)
- Touch targets: minimum 36×36px for all interactive elements (already met)

---

## 10. Key Design Principles (for implementer reference)

1. **Doctor's perspective first:** Every element answers "Who's next?" or "How's my day going?" — never "Here's all the system data."

2. **French medical professionalism:** No playful icons, no exclamation marks, no startup aesthetics. Clean, restrained, confident. Copy uses formal "vous."

3. **RGPD by default:** Names displayed as "Prénom N." format. Settings allow toggling between full / first-initial / initials-only.

4. **Actions hidden until needed:** Queue cards show only essential info by default. Swipe reveals priority/remove. No persistent icon bars.

5. **Session management, not presence toggle:** "Consultations actives" / "Mettre en pause" replaces the binary "Docteur présent" switch.

6. **Forward-looking estimates:** Show "Attente est. ~12 min" (time until consultation), not "63 min" (time since arrival).

7. **Stickiness through daily ritual:** The dark summary card and weekly email settings create reasons to return daily.

8. **Trial conversion embedded in context:** Plan status badge in settings profile card. No intrusive banners.
