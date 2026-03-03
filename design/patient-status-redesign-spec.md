# Patient Status Page — Redesign Implementation Spec

**Target file:** `apps/web/src/pages/PatientStatusPage.tsx`  
**Related components:** `apps/web/src/components/patient/`  
**i18n files:** `apps/web/src/i18n/fr.json` + `apps/web/src/i18n/ar.json`

---

## Overview

This spec describes all visual and copy changes to the patient-facing status page resulting from a UX audit. The changes fall into four categories:

1. **Copy fixes** — gender-neutral French to avoid grammatical errors
2. **Personalization** — patient's first name shown on all states (not just the last two)
3. **Redundancy removal** — information shown twice (in the circle and in text) is consolidated
4. **Layout** — elements use `justify-content: space-between` to breathe and fill the full screen height

---

## 1. Layout System

### Full-Height Distribution

The page body must distribute its elements vertically across the **full available height** using flexbox space-between. No element should have a fixed `margin-bottom` that creates dead space at the bottom of the screen.

```tsx
// Page body wrapper
<div className="flex flex-col items-center flex-1 px-5 pt-2 pb-5 justify-between">
  {/* Elements here are evenly distributed top-to-bottom */}
</div>
```

**Remove** any hardcoded `mb-*` / `mt-*` spacing between the major elements (name tag, status label, time, circle, info card, alert, button). Let `justify-content: space-between` handle all vertical gaps.

**Exception:** padding inside components (e.g. info card rows, alert text) should retain comfortable internal padding — see token values below.

### Spacing Tokens

| Token | Value | Used for |
|-------|-------|----------|
| Page horizontal padding | `px-5` (20px) | Left/right margin of all content |
| Page top padding | `pt-2` (8px) | Below the header |
| Page bottom padding | `pb-5` (20px) | Above the footer |
| Info card row padding | `py-3 px-3.5` (12px / 14px) | Each row inside the info card |
| Alert padding | `py-3 px-3.5` | Alert pill |
| Ghost button padding | `py-3 px-3.5` | "Je m'absente" button |

---

## 2. Progress Circle

### Size

Increase from the current small size to **112 × 112px**.

```tsx
<div className="relative w-28 h-28 flex-shrink-0">
  <svg
    className="w-28 h-28 -rotate-90"
    viewBox="0 0 112 112"
  >
    {/* Track */}
    <circle cx="56" cy="56" r="48" fill="none" stroke={trackColor} strokeWidth="5" />
    {/* Progress arc */}
    <circle
      cx="56" cy="56" r="48"
      fill="none"
      stroke={accentColor}
      strokeWidth="5"
      strokeLinecap="round"
      strokeDasharray="301.59"
      strokeDashoffset={dashOffset}
    />
  </svg>
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-3xl font-bold leading-none">{position}</span>
    <span className="text-[8px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
      {t('status.devantVous')}
    </span>
  </div>
</div>
```

### Arc Progress Formula

The arc fills as the patient advances through the queue. Use initial total queue size at check-in (`initialPosition`) vs current `position`:

```ts
const circumference = 301.59 // 2 * π * 48
const progress = 1 - (position / initialPosition)
const dashOffset = circumference - (progress * circumference)
// Cap: never show 100% full (that's handled by screens 5–6)
```

### Per-State Dash Offsets (reference values)

| Position | `initialPosition` assumed | `dashOffset` |
|----------|--------------------------|-------------|
| 5 of 5 | 5 | 272 |
| 4 of 5 | 5 | 241 |
| 3 of 5 | 5 | 196 |
| 2 of 5 | 5 | 133 |

### Number Size Inside Circle

```tsx
// Inside circle number
<span className="text-3xl font-bold leading-none" style={{ color: accentColor }}>
  {position}
</span>
```

---

## 3. Patient Name — Shown on All States

The patient's first name must appear on **every screen**, not just states 5 and 6. Place it as a quiet greeting line directly below the page header, above the status label.

```tsx
// Name tag — always present
<p className="text-sm font-medium text-center text-gray-500">
  {t('status.bonjour')}, <strong className="font-bold text-gray-800">{patientName}</strong>
</p>
```

**i18n key:** `status.bonjour` → `"Bonjour"` (FR) / `"مرحباً"` (AR)

If `patientName` is empty or unavailable, hide this line entirely (do not show "Bonjour, ").

---

## 4. Redundancy Fixes — What to Remove

### 4a. "N personnes devant vous" text line

**Remove** the text line that reads *"5 personnes devant vous"* / *"4 personnes devant vous"* etc. that appears below the time estimate. This information is already displayed inside the circle (`5 / DEVANT VOUS`). Showing it twice is redundant.

```tsx
// DELETE this element from all waiting states (1–4):
// <p className="text-sm text-gray-500">{position} {t('status.personnesDevantVous')}</p>
```

### 4b. Info card rows that duplicate visible data

**State 3** (`position === 3`): Remove the row `Personnes devant vous | 3`. The circle already shows this. Keep only `Durée moy. par patient`.

**State 4** (`position === 2`): Remove both rows `Encore | 2 patients` and `Estimation | ~15 min`. Both duplicate information already shown in the time display and circle. Replace the entire card with a single row: `Durée moy. par patient | ~X min`.

### 4c. State 5 — repeated "Vous passez après"

The status label reads *"Vous passez après"* and the body text previously said *"Vous passez juste après."* — same message twice. Remove the body text phrase and keep only the status label. The body text should only describe what is happening now:

```tsx
// State 5 body text — CORRECT:
<p>{t('status.consultationEnCours')}</p>
// "La consultation en cours se termine bientôt."
// NOT: "Vous passez juste après." ← REMOVE
```

---

## 5. Copy Changes — Gender-Neutral French

The app does not know the patient's gender. All gendered constructions must be replaced with neutral alternatives.

### Complete Copy Replacement Table

| Location | Old (gendered) | New (neutral) | i18n key |
|---|---|---|---|
| State 5 — status label | `"VOUS ÊTES LE PROCHAIN"` | `"Vous passez après"` | `status.vousPassezApres` |
| State 5 — heading | `"Vous êtes le prochain"` | `"C'est presque votre tour"` | `status.cEstPresqueVotreTour` |
| State 5 — subtext | `"Le patient actuel est en consultation. Vous passez juste après."` | `"La consultation en cours se termine bientôt."` | `status.consultationEnCours` |
| State 6 — status label | `"C'EST VOTRE TOUR"` | `"C'est votre tour"` | `status.cestVotreTour` |

No other copy on the page contains gendered constructions. The phrases `"On vous attend"`, `"Ne vous éloignez pas"`, `"Restez dans la salle d'attente"`, and `"Restez devant la porte"` are all already gender-neutral.

---

## 6. The Six Visual States

The page renders one of six states based on `status` (QueueStatus) and `position`. Each state has a distinct **color theme**, **status label**, **hero content**, **info card**, and **alert/instruction**.

### Color Theme System

Define a `theme` object derived from the current state and pass it down:

```ts
type StatusTheme = {
  accent: string      // main color for label, time, circle number
  accentHex: string   // raw hex for SVG (strokeColor)
  trackHex: string    // raw hex for SVG circle track
  alertBg: string     // Tailwind class
  alertText: string   // Tailwind class
}

const THEMES = {
  teal: {
    accent: 'text-teal-700',
    accentHex: '#0F7B6C',
    trackHex: '#E0EDE9',
    alertBg: 'bg-teal-50',
    alertText: 'text-teal-900',
  },
  amber: {
    accent: 'text-amber-700',
    accentHex: '#A67C00',
    trackHex: '#F5E8C0',
    alertBg: 'bg-amber-50',
    alertText: 'text-amber-900',
  },
  green: {
    accent: 'text-green-800',
    accentHex: '#1E6B3C',
    trackHex: '#C8EDD5',
    alertBg: 'bg-green-50',
    alertText: 'text-green-900',
  },
}

function getTheme(status: QueueStatus, position: number): StatusTheme {
  if (status === 'IN_CONSULTATION') return THEMES.green
  if (status === 'NOTIFIED') return THEMES.green
  if (position <= 3) return THEMES.amber
  return THEMES.teal
}
```

---

### State 1 — Longue attente (`WAITING`, position ≥ 5)

**Theme:** Teal

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label | `"Attente estimée"` |
| Time hero | `"~59 min"` (large, teal) |
| Circle | Position number, arc ~10% filled |
| Info card row 1 | `Durée moy. par patient` / `~12 min` |
| Info card row 2 | `Basé sur` / `l'historique récent` |
| Alert | ☕ `"Vous avez le temps pour un café"` (teal bg) |
| Ghost button | 🚶 `"Je m'absente un moment"` |

**Threshold:** Show coffee suggestion when `estimatedWaitMins > 30`.

---

### State 2 — Attente modérée (`WAITING`, position 4)

**Theme:** Teal

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label | `"Attente estimée"` |
| Time hero | `"~32 min"` (large, teal) |
| Circle | 4, arc ~20% filled |
| Info card row 1 | `Durée moy. par patient` / `~12 min` |
| Info card row 2 | `Basé sur` / `les consultations du jour` |
| Alert | ⏳ `"Encore un peu de patience…"` (amber-tinted bg) |
| Ghost button | 🚶 `"Je m'absente un moment"` |

---

### State 3 — Bientôt votre tour (`WAITING`, position 3)

**Theme:** Amber

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label | `"Bientôt votre tour"` |
| Time hero | `"~24 min"` (large, amber) |
| Circle | 3, arc ~40% filled |
| Info card row 1 | `Durée moy. par patient` / `~8 min` |
| ~~Info card row 2~~ | ~~`Personnes devant vous \| 3`~~ — **REMOVED** (redundant with circle) |
| Alert | 📍 `"Restez dans la salle d'attente"` (amber bg) |
| Ghost button | **Hidden** from this state onward |

---

### State 4 — Préparez-vous (`NOTIFIED` or `WAITING`, position 2)

**Theme:** Amber

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label | `"Préparez-vous"` |
| Time hero | `"~15 min"` (large, amber) |
| Circle | 2, arc ~60% filled |
| Info card row 1 | `Durée moy. par patient` / `~8 min` |
| ~~Info card rows~~  | ~~`Encore \| 2 patients`~~ and ~~`Estimation \| ~15 min`~~ — **BOTH REMOVED** (all duplicated above) |
| Alert | ⚠️ `"Ne vous éloignez pas — c'est bientôt à vous"` (amber bg) |
| Ghost button | **Hidden** |

---

### State 5 — Vous passez après (`NOTIFIED`, position 1)

**Theme:** Green

No time display or progress circle on this state. Replace with a centered avatar icon + focused message.

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label | `"Vous passez après"` ← **was "VOUS ÊTES LE PROCHAIN"** |
| Heading | `"C'est presque votre tour"` ← **was "Vous êtes le prochain"** |
| Avatar circle | Person icon, green bg, pulsing ring |
| Body text | `"La consultation en cours se termine bientôt."` ← **was "Vous passez juste après." REMOVED** |
| Alert | 📍 `"Restez devant la porte du cabinet"` (green bg) |

**Avatar circle implementation:**
```tsx
<div className="relative w-28 h-28 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
  {/* Pulsing rings */}
  <div className="absolute inset-0 rounded-full border border-green-700 opacity-25 scale-110" />
  <div className="absolute inset-0 rounded-full border border-green-700 opacity-12 scale-125" />
  <UserIcon className="w-10 h-10 text-green-700" />
</div>
```

---

### State 6 — C'est votre tour (`IN_CONSULTATION`)

**Theme:** Green (page background shifts to `#F0FAF4`)

No circle, no info card, no time display.

| Element | Content |
|---------|---------|
| Name tag | `"Bonjour, [Prénom]"` |
| Status label (uppercase) | `"C'est votre tour"` |
| Heading | `"On vous attend !"` (large, bold, green) |
| Door icon circle | Door/arrow icon, green bg, rings |
| Body text | `"Dirigez-vous vers la salle de consultation."` |
| Primary CTA button | ✓ `"J'arrive !"` (full-width, solid green) |

**CTA button:**
```tsx
<button
  onClick={handleArrival}
  className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
  style={{ backgroundColor: '#2D9156' }}
>
  <CheckIcon className="w-4 h-4" />
  {t('status.jArrive')}
</button>
```

---

## 7. Info Card — Unified Schema

Apply a consistent structure to the info card across all states. Only rows 1 and 2 vary; never show data that is already displayed elsewhere on the screen.

```tsx
<div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
  {rows.map((row, i) => (
    <div
      key={row.key}
      className={`flex justify-between items-center py-3 px-3.5 text-xs ${
        i > 0 ? 'border-t border-gray-200' : ''
      }`}
    >
      <span className="text-gray-500">{row.label}</span>
      <span className="font-semibold text-gray-800">{row.value}</span>
    </div>
  ))}
</div>
```

### Info card rows per state

| State | Row 1 | Row 2 |
|-------|-------|-------|
| 1 (pos ≥ 5) | Durée moy. par patient / `~12 min` | Basé sur / `l'historique récent` |
| 2 (pos 4) | Durée moy. par patient / `~12 min` | Basé sur / `les consultations du jour` |
| 3 (pos 3) | Durée moy. par patient / `~X min` | — (single row only) |
| 4 (pos 2) | Durée moy. par patient / `~X min` | — (single row only) |
| 5 (pos 1) | No card | — |
| 6 (IN_CONSULTATION) | No card | — |

---

## 8. i18n Strings

### French (`fr.json`) — add/update under `"status"` namespace

```json
{
  "status": {
    "bonjour": "Bonjour",
    "attenteEstimee": "Attente estimée",
    "bientotVotreTour": "Bientôt votre tour",
    "preparez": "Préparez-vous",
    "vousPassezApres": "Vous passez après",
    "cestVotreTour": "C'est votre tour",
    "cEstPresqueVotreTour": "C'est presque votre tour",
    "onVousAttend": "On vous attend !",
    "devantVous": "devant vous",
    "dureeMoyParPatient": "Durée moy. par patient",
    "baseSur": "Basé sur",
    "historiqueRecent": "l'historique récent",
    "consultationsDuJour": "les consultations du jour",
    "consultationEnCours": "La consultation en cours se termine bientôt.",
    "dirigezVous": "Dirigez-vous vers la salle de consultation.",
    "alertCafe": "Vous avez le temps pour un café",
    "alertPatience": "Encore un peu de patience…",
    "alertSalle": "Restez dans la salle d'attente",
    "alertNePasEloigner": "Ne vous éloignez pas — c'est bientôt à vous",
    "alertPorte": "Restez devant la porte du cabinet",
    "jeAbsente": "Je m'absente un moment",
    "jArrive": "J'arrive !"
  }
}
```

### Arabic (`ar.json`) — add/update under `"status"` namespace

```json
{
  "status": {
    "bonjour": "مرحباً",
    "attenteEstimee": "وقت الانتظار المتوقع",
    "bientotVotreTour": "دورك قريباً",
    "preparez": "استعد",
    "vousPassezApres": "أنت التالي",
    "cestVotreTour": "جاء دورك",
    "cEstPresqueVotreTour": "دورك على وشك أن يأتي",
    "onVousAttend": "نحن بانتظارك !",
    "devantVous": "أمامك",
    "dureeMoyParPatient": "متوسط مدة الاستشارة",
    "baseSur": "بناءً على",
    "historiqueRecent": "السجل الأخير",
    "consultationsDuJour": "استشارات اليوم",
    "consultationEnCours": "الاستشارة الحالية توشك على الانتهاء.",
    "dirigezVous": "توجّه إلى غرفة الاستشارة.",
    "alertCafe": "لديك وقت لتناول قهوة",
    "alertPatience": "بعض الصبر…",
    "alertSalle": "ابق في غرفة الانتظار",
    "alertNePasEloigner": "لا تبتعد — دورك قريب جداً",
    "alertPorte": "ابق أمام باب العيادة",
    "jeAbsente": "سأغيب لحظة",
    "jArrive": "أنا قادم !"
  }
}
```

---

## 9. "Je m'absente un moment" Button

Only visible on states 1 and 2 (position ≥ 4). Hide from state 3 onward.

```tsx
{position >= 4 && (
  <button className="w-full border border-gray-200 rounded-xl py-3 px-3.5 text-xs font-medium text-gray-500 flex items-center justify-center gap-1.5 flex-shrink-0">
    <WalkingIcon className="w-3.5 h-3.5" />
    {t('status.jeAbsente')}
  </button>
)}
```

---

## 10. Page Header (unchanged)

The page header remains as-is:
- Clinic name (left)
- Online status dot + language switcher (right)

No changes needed here.

---

## 11. Page Footer (unchanged)

- `"··· Options"` text link
- `"BleSaf"` brand mark

No changes needed here.

---

## 12. Summary of Changes Checklist

Use this to verify each change is applied:

- [ ] Body uses `flex flex-col justify-between` to fill full screen height
- [ ] All fixed `margin-bottom` between major layout elements removed
- [ ] Progress circle increased to `w-28 h-28` (112px)
- [ ] Circle number uses `text-3xl` (32px)
- [ ] Time hero uses `text-5xl` (46px)
- [ ] `"Bonjour, [Prénom]"` name tag added to **all 6 states**
- [ ] `"N personnes devant vous"` text line below the time removed from all states
- [ ] State 3 info card: `Personnes devant vous | 3` row removed
- [ ] State 4 info card: Both redundant rows removed; replaced with `Durée moy. par patient`
- [ ] State 5 body text: `"Vous passez juste après"` phrase removed
- [ ] State 5 status label: Changed from `"VOUS ÊTES LE PROCHAIN"` → `"Vous passez après"`
- [ ] State 5 heading: Changed from `"Vous êtes le prochain"` → `"C'est presque votre tour"`
- [ ] State 5 subtext: Changed from `"Le patient actuel est en consultation…"` → `"La consultation en cours se termine bientôt."`
- [ ] Info card row padding updated to `py-3 px-3.5`
- [ ] Alert padding updated to `py-3 px-3.5`
- [ ] All new i18n keys added to both `fr.json` and `ar.json`
- [ ] Ghost button hidden from state 3 (position ≤ 3) onward
