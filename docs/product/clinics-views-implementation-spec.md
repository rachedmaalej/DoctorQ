# Clinics Views — Desktop & Mobile Implementation Specification

## BleSaf "Emerald Cards" & AuSuivant "Warm Beige Editorial"

**Scope:** 8 total views — Clinics Directory (desktop + mobile) and Individual Clinic Detail (desktop + mobile) for each brand. This document provides every color, spacing, typography, component behavior, and responsive breakpoint needed to implement without referencing mockups.

**Prerequisite:** This spec extends the admin dashboard spec (`ADMIN-DASHBOARD-IMPLEMENTATION-SPEC.md`). Design tokens, fonts, and the top navigation bar are defined there. This document covers only the Clinics tab and Clinic Detail page.

---

## Table of Contents

1. [Routing & File Structure](#1-routing--file-structure)
2. [Shared Design Tokens Quick Reference](#2-shared-design-tokens-quick-reference)
3. [View 1 & 2: Clinics Directory — Desktop](#3-clinics-directory--desktop)
4. [View 3 & 4: Clinics Directory — Mobile](#4-clinics-directory--mobile)
5. [View 5 & 6: Clinic Detail — Desktop](#5-clinic-detail--desktop)
6. [View 7 & 8: Clinic Detail — Mobile](#6-clinic-detail--mobile)
7. [Data Contracts](#7-data-contracts)
8. [Responsive Breakpoint Strategy](#8-responsive-breakpoint-strategy)
9. [Interaction States](#9-interaction-states)
10. [Accessibility](#10-accessibility)
11. [Brand Differences Quick Reference](#11-brand-differences-quick-reference)

---

## 1. Routing & File Structure

### Routes

```
/admin/clinics              → Clinics Directory (list view)
/admin/clinics/:clinicId    → Individual Clinic Detail
```

### File Structure (extends existing admin structure)

```
web/src/pages/admin/
├── clinics/
│   ├── ClinicsDirectoryPage.tsx       # Renders brand-appropriate directory
│   ├── ClinicDetailPage.tsx           # Renders brand-appropriate detail
│   ├── blesaf/
│   │   ├── BlesafClinicsDirectory.tsx
│   │   ├── BlesafClinicDetail.tsx
│   │   └── components/
│   │       ├── ClinicTable.tsx         # Desktop table
│   │       ├── ClinicMobileList.tsx    # Mobile card list
│   │       ├── ClinicDetailHeader.tsx  # Name + pills + actions
│   │       ├── SubscriptionCard.tsx
│   │       ├── ClinicInfoGrid.tsx
│   │       ├── TodayActivityStats.tsx
│   │       └── WeeklyChart.tsx
│   ├── ausuivant/
│   │   ├── AusuivantClinicsDirectory.tsx
│   │   ├── AusuivantClinicDetail.tsx
│   │   └── components/
│   │       ├── ClinicTable.tsx
│   │       ├── ClinicMobileList.tsx
│   │       ├── ClinicDetailHeader.tsx
│   │       ├── SubscriptionCard.tsx
│   │       ├── ClinicInfoGrid.tsx
│   │       ├── TodayActivityStats.tsx
│   │       └── WeeklyChart.tsx
│   └── shared/
│       ├── hooks/
│       │   ├── useClinicList.ts
│       │   ├── useClinicDetail.ts
│       │   └── useClinicActivity.ts
│       ├── types.ts
│       └── OverflowMenu.tsx           # Shared ⋯ menu component
```

### Responsive Detection

Use a shared hook for viewport:

```typescript
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // ... resize listener
  return isMobile;
};
```

The same page component renders desktop or mobile layout based on this hook — NOT separate routes.

---

## 2. Shared Design Tokens Quick Reference

These are repeated from the admin dashboard spec for convenience. Use the same Tailwind theme extension or CSS variables.

### BleSaf "Emerald Cards"

| Token | Value | Usage |
|-------|-------|-------|
| `navBg` | `#1a3c34` | Top nav, mobile nav |
| `navTabInactive` | `#7aa38d` | Inactive tab text |
| `navTabActive` | `#ffffff` | Active tab text |
| `navTabIndicator` | `#2a9d6e` | Active tab underline |
| `pageBg` | `#f7f5f1` | Content background |
| `cardBg` | `#ffffff` | Cards, table |
| `cardBorder` | `#e8e5df` | Card borders, input borders |
| `rowBorder` | `#f3f0ec` | Table row dividers |
| `textPrimary` | `#1a1a2e` | Primary text |
| `textMuted` | `#999999` | Labels, timestamps |
| `textSubtle` | `#666666` | Secondary labels |
| `primary` | `#2a9d6e` | CTA buttons, active indicators |
| `infoLabelColor` | `#2a9d6e` | Clinic info field labels |
| `hoverBg` | `#faf8f5` | Row hover |
| `activeBg` | `#f0ede7` | Mobile row tap |
| `headingFont` | `'Outfit'` | Headings, brand, button text |
| `bodyFont` | `'DM Sans'` | Body, table, labels |
| `cardRadius` | `14px` | Cards |
| `buttonRadius` | `7px` | Buttons |
| `pillRadius` | `100px` | Status badges |

### AuSuivant "Warm Beige Editorial"

| Token | Value | Usage |
|-------|-------|-------|
| `navBg` | `#1a1a2e` | Top nav (dark navy) |
| `navTabInactive` | `#777777` | Inactive tab text |
| `navTabActive` | `#ffffff` | Active tab text (NO underline) |
| `pageBg` | `#f4f1ec` | Content background (warmer) |
| `cardBg` | `#ffffff` | Cards, table |
| `cardBorder` | `#e5e0d8` | Card borders (warmer) |
| `rowBorder` | `#f0ebe4` | Table row dividers (warmer) |
| `textPrimary` | `#1a1a2e` | Primary text |
| `textMuted` | `#999999` | Labels |
| `textSubtle` | `#777777` | Secondary labels |
| `primary` | `#c0392b` | CTA buttons, active indicators |
| `infoLabelColor` | `#c0392b` | Clinic info field labels |
| `hoverBg` | `#f9f6f2` | Row hover |
| `activeBg` | `#ebe7e0` | Mobile row tap |
| `headingFont` | `'Playfair Display'` | Headings, brand |
| `bodyFont` | `'DM Sans'` | Body, buttons, table |
| `cardRadius` | `12px` | Cards |
| `buttonRadius` | `7px` | Buttons |
| `pillRadius` | `100px` | Status badges |

### Shared Status Pill Colors (both brands)

| Status | Background | Text | Label (EN) | Label (FR) |
|--------|------------|------|------------|------------|
| Trial | `#fef3c7` | `#92400e` | `TRIAL` | `ESSAI` |
| Active | `#dcfce7` | `#166534` | `Active` | `Actif` |
| Doctor Present | `#dbeafe` | `#1e40af` | `Doctor Present` | `Médecin Présent` |
| At Risk | `#fee2e2` | `#991b1b` | `At Risk` | `À Risque` |
| Churned | `#f3f4f6` | `#6b7280` | `Churned` | `Résilié` |

---

## 3. Clinics Directory — Desktop

This section applies to both BleSaf and AuSuivant. Differences are noted inline.

### 3.1 Page Layout

```
┌────────────────────────────────────────────────────────────┐
│  TOP NAV BAR  (as defined in admin dashboard spec)          │
│  "Clinics" tab is active                                    │
├────────────────────────────────────────────────────────────┤
│  CONTENT AREA                                               │
│                                                             │
│  ┌─ Toolbar ─────────────────────────────────────────────┐ │
│  │ "Clinic Directory"          [Search] [Filter] [Filter] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Table Card ──────────────────────────────────────────┐ │
│  │ TH: Clinic | Subscription | Trial Ends | Last Active  │ │
│  │     | Patients | Joined | Actions                     │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ Row: [name + email] [pill] [date] [time] [n] [date]   │ │
│  │      [Extend] [Upgrade] [View]                        │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ Row: ...                                              │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ "Showing N of N clinics"                              │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Toolbar

- **Layout:** `display: flex; justify-content: space-between; align-items: center`
- **Margin bottom:** `1rem`
- **Left: Page title**
  - BleSaf: "Clinic Directory", Outfit 700, `1.15rem`
  - AuSuivant: "Répertoire des Cabinets", Playfair Display 600, `1.2rem`
- **Right: Controls row** (`display: flex; gap: 0.4rem; align-items: center`)
  - **Search input:**
    - `width: 200px` (BleSaf) / `220px` (AuSuivant)
    - `padding: 0.45rem 0.85rem`
    - `border: 1px solid {cardBorder}`
    - `border-radius: 7px`
    - `background: #fff`
    - `font-size: 0.78rem; color: #999`
    - Placeholder: "Search name, doctor, email..." / "Rechercher nom, médecin, email..."
  - **Filter dropdowns** (3 total):
    - `padding: 0.4rem 0.6rem`
    - `border: 1px solid {cardBorder}`
    - `border-radius: 7px`
    - `background: #fff`
    - `font-size: 0.75rem; color: #666` (BleSaf) / `#777` (AuSuivant)
    - Options:
      1. "All Activity" / "Toute activité" → filter by last active timeframe
      2. "All Plans" / "Tous les plans" → filter by subscription status
      3. "All Payments" / "Tous paiements" → filter by payment status

### 3.3 Table Card

- **Container:** `background: #fff; border-radius: {cardRadius}; border: 1px solid {cardBorder}; overflow: hidden`

#### Table Header

- Columns with sort icons where indicated:

| Column | Label (EN) | Label (FR) | Sortable | Width Hint |
|--------|-----------|-----------|----------|------------|
| Clinic | `Clinic ↑` | `Cabinet ↑` | Yes (default: alpha ASC) | ~25% |
| Subscription | `Subscription` | `Abonnement` | No | ~10% |
| Trial Ends | `Trial Ends` | `Fin d'essai` | No | ~10% |
| Last Active | `Last Active ↕` | `Dernière activité ↕` | Yes | ~12% |
| Patients | `Patients ↕` | `Patients ↕` | Yes | ~8% |
| Joined | `Joined ↕` | `Inscrit ↕` | Yes | ~10% |
| Actions | `Actions` | `Actions` | No | ~25% |

- **Header cells:**
  - `padding: 0.65rem 1.2rem`
  - `font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em`
  - `color: #999; font-weight: 500`
  - `border-bottom: 1px solid {cardBorder}`
  - Sort arrows: use Lucide `ArrowUp`, `ArrowUpDown` icons (10px) inline after text

#### Table Body Rows

- **Cell padding:** `0.75rem 1.2rem`
- **Row divider:** `border-bottom: 1px solid {rowBorder}`
- **Last row:** no bottom border
- **Hover:** `background: {hoverBg}`
- **Clinic cell** (two-line):
  - Name: DM Sans 600, `0.82rem`, `color: {textPrimary}`
  - Email: DM Sans 400, `0.7rem`, `color: #999`
  - Layout: `display: flex; flex-direction: column`
- **Subscription cell:** Status pill (see shared pill colors above)
- **Trial Ends cell:** Date string (DD/MM/YYYY) or "—" if no trial end. DM Sans 400, `0.82rem`
- **Last Active cell:** Relative time ("Today", "Yesterday", "Never", "2 hours ago") or absolute. DM Sans 400, `0.82rem`
- **Patients cell:** Integer. DM Sans 400, `0.82rem`
- **Joined cell:** Date string (DD/MM/YYYY). DM Sans 400, `0.82rem`
- **Actions cell:**
  - `display: flex; gap: 0.25rem`
  - Three buttons:
    1. **Extend** / **Prolonger** — `color: {primary}; border-color: {primary}` (accent button)
    2. **Upgrade** / **Upgrader** — `color: {textPrimary}; border-color: {cardBorder}` (neutral)
    3. **View** / **Voir** — `color: {textPrimary}; border-color: {cardBorder}` (neutral)
  - All buttons: `padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.7rem; border: 1px solid; background: #fff; cursor: pointer`

#### Table Footer

- **"Showing N of N clinics"** / **"N cabinets sur N"**
- `padding: 0.7rem 1.2rem; font-size: 0.75rem; color: #999`

---

## 4. Clinics Directory — Mobile

**Breakpoint:** `< 768px`

### 4.1 Mobile Layout

```
┌──────────────────────────────┐
│  MOBILE NAV BAR               │
│  [Logo Brand] [+New] [☰]     │
├──────────────────────────────┤
│  SCROLLABLE TAB STRIP         │
│  [Overview] [•Clinics•] [...] │
├──────────────────────────────┤
│  CONTENT                      │
│                               │
│  [Search full-width] [Filters]│
│                               │
│  ┌─ Card ──────────────────┐ │
│  │ Clinic Name       [PILL]›│ │
│  │ email@addr               │ │
│  │ ────────────────────────  │ │
│  │ Clinic Name       [PILL]›│ │
│  │ email@addr               │ │
│  │ ────────────────────────  │ │
│  │ "N of N clinics"         │ │
│  └──────────────────────────┘ │
└──────────────────────────────┘
```

### 4.2 Mobile Nav Bar

- **Layout:** `display: flex; align-items: center; justify-content: space-between`
- **Padding:** `0.7rem 1rem`
- **Background:** `{navBg}`
- **Left: Brand**
  - Logo mark: `22×22px`, `border-radius: 5px`, background `{primary}`
  - Brand text: "BleSaf" / "AuSuivant", headingFont 700 / 600, `0.95rem`
- **Right:** `display: flex; gap: 0.4rem; align-items: center`
  - **CTA button (condensed):** "+ New" / "+ Nouveau"
    - `font-size: 0.72rem; padding: 0.35rem 0.65rem`
    - Same colors as desktop CTA
  - **Hamburger:** `☰` icon (or Lucide `Menu`), `color: #fff`, `font-size: 1.1rem`, no background/border
    - Opens: slide-out drawer or dropdown with full nav links + Logout

### 4.3 Scrollable Tab Strip

- **Container:** `display: flex; overflow-x: auto; scrollbar-width: none` (hide scrollbar)
- **Background:** same as nav (`{navBg}`)
- **Padding:** `0 1rem 0.5rem`
- **Tab links:** same font/size as desktop tabs but `0.78rem`, `white-space: nowrap; flex-shrink: 0`
- **Active state:**
  - BleSaf: `color: #fff; border-bottom: 2px solid #2a9d6e`
  - AuSuivant: `color: #fff` (NO underline)

### 4.4 Mobile Content Area

- **Padding:** `1rem`

#### Search + Filters Row

- **Layout:** `display: flex; gap: 0.4rem; margin-bottom: 0.8rem`
- **Search:** `flex: 1` (takes remaining space)
  - Same styling as desktop but no fixed width
  - Shorter placeholder: "Search clinics..." / "Rechercher..."
- **Filters button:** Replaces the 3 individual dropdowns
  - `padding: 0.4rem 0.6rem; border-radius: 7px; font-size: 0.75rem`
  - `border: 1px solid {cardBorder}; background: #fff`
  - `color: #666` (BleSaf) / `#777` (AuSuivant)
  - Text: "Filters" / "Filtres"
  - On tap: Opens a bottom sheet or dropdown with the 3 filter options

#### Clinic List (replaces table)

- **Container:** Same `.card` styling (white, rounded, bordered)
- **No table headers** — data is self-explanatory in card format
- **Each item:**
  - `display: flex; align-items: center; justify-content: space-between`
  - `padding: 0.85rem 1rem`
  - `border-bottom: 1px solid {rowBorder}`
  - Last item: no bottom border
  - **Active (tap) state:** `background: {activeBg}`
  - Entire row is tappable → navigates to `/admin/clinics/:clinicId`
  - **Left side** (`flex-direction: column; min-width: 0` — enables text truncation):
    - Name: DM Sans 600, `0.88rem`, `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
    - Email: DM Sans 400, `0.72rem`, `color: #999`
  - **Right side** (`display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0`):
    - Status pill (Trial/Active/etc.)
    - Chevron: `›` character, `color: #ccc; font-size: 0.85rem`

#### Footer

- Same "N of N clinics" / "N sur N cabinets" text, same styling

---

## 5. Clinic Detail — Desktop

### 5.1 Page Layout

```
┌────────────────────────────────────────────────────────────┐
│  TOP NAV BAR  ("Clinics" tab active)                        │
├────────────────────────────────────────────────────────────┤
│  CONTENT AREA                                               │
│                                                             │
│  [←] Cabinet Médical Dr Hafsia [Trial] [Active] [Doctor]   │
│       Dr Ghassen Hafsia           [Login] [Pause] [Reset] X│
│                                                             │
│  [Overview] [Patients] [Billing] [Settings]                 │
│  ───────────────────────────────────────────                │
│                                                             │
│  ┌─ Subscription Card ───────────────────────────────────┐ │
│  │ Status: TRIAL           Trial: 29 days left           │ │
│  │ [===progress bar===]    Trial ends: 16/03/2026        │ │
│  │ [  Extend Trial  ] [      Upgrade      ]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Clinic Info Card ────────────────────────────────────┐ │
│  │ EMAIL        PHONE         LANGUAGE      SPÉCIALITÉ   │ │
│  │ ghassen@..   +216...       French        Autre        │ │
│  │ AVG CONSULT  NOTIFY AT     CREATED       LAST LOGIN   │ │
│  │ 10 Min       #2            14/02/2026    Never        │ │
│  │ ONBOARDING                 ADDRESS                    │ │
│  │ Step 1/4                   Soukra Medical...          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Today's Activity ────────────────────────────────────┐ │
│  │ [Waiting:0] [InConsult:0] [Completed:0] [NoShow:0] [X]│ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ This Week Chart ─────────────────────────────────────┐ │
│  │ [bar][bar][bar][bar][bar][bar][bar]                    │ │
│  │  lun. mar. mer. jeu. ven. sam. dim.                   │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Detail Header

- **Layout:** `display: flex; align-items: flex-start; gap: 0.8rem; flex-wrap: wrap`
- **Left cluster** (`flex: 1; min-width: 260px`):
  - **Back button:**
    - `30×30px`, `border-radius: 7px`
    - `border: 1px solid {cardBorder}; background: #fff`
    - Icon: Lucide `ArrowLeft` (16px), `color: #666` (BleSaf) / `#777` (AuSuivant)
    - On click: navigate back to `/admin/clinics`
  - **Title row** (`display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap`):
    - Clinic name: headingFont, `1.2rem` (BleSaf Outfit 700) / `1.25rem` (AuSuivant Playfair 600)
    - Status pills (inline, `gap: 0.25rem`): Trial pill + Active pill + Doctor Present pill
  - **Subtitle:** Doctor name, DM Sans 400, `0.78rem`, `color: #999`
- **Right cluster: Actions** (`display: flex; gap: 0.4rem; align-items: center; margin-left: auto`)
  - 4 buttons shown on desktop:

| Button | Label (EN) | Label (FR) | Style |
|--------|-----------|-----------|-------|
| Login as Clinic | "Login as Clinic" | "Se connecter en tant que cabinet" | Filled: `bg: {primary}; color: #fff; padding: 0.4rem 0.75rem; border-radius: 7px; font-weight: 600; font-size: 0.76rem` |
| Pause | "Pause" | "Pause" | Outline amber: `border: 1px solid #f59e0b; color: #f59e0b; padding: 0.4rem 0.7rem; border-radius: 7px; font-weight: 600; font-size: 0.76rem` |
| Reset Password | "Reset Password" | "Réinitialiser MDP" | Outline neutral: `border: 1px solid #c5c0b8 (BleSaf) / #c5bfb5 (AuSuivant); color: #555 / #666; padding: 0.4rem 0.7rem; border-radius: 7px; font-size: 0.76rem` |
| Delete | "Delete" | "Supprimer" | Text only: `background: none; border: none; color: #dc2626 (BleSaf) / #c0392b (AuSuivant); font-weight: 600; font-size: 0.76rem` |

### 5.3 Detail Sub-Tabs

- **Layout:** `display: flex; gap: 0; border-bottom: 1px solid {cardBorder}`
- **Margin:** `0.6rem 0 1.2rem`
- **Tabs:**
  - BleSaf (EN): "Overview" (active), "Patients", "Billing", "Settings"
  - AuSuivant (FR): "Vue d'ensemble" (active), "Patients", "Facturation", "Paramètres"
- **Tab styling:**
  - `padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 500; border-bottom: 2px solid transparent`
  - Inactive: `color: #999`
  - Active:
    - BleSaf: `color: #1a3c34; border-bottom-color: #2a9d6e`
    - AuSuivant: `color: #1a1a2e; border-bottom-color: #c0392b`

### 5.4 Subscription Card

- **Container:** `background: #fff; border-radius: {cardRadius}; border: 1px solid {cardBorder}; padding: 1.3rem; margin-bottom: 1.2rem`
- **Section label:** headingFont (Outfit/Playfair), `0.72rem`, `font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 0.8rem`
  - BleSaf: "Subscription" / AuSuivant: "Abonnement"
- **Key-value rows:**
  - `display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid {rowBorder}`
  - Last row: no bottom border
  - Key: DM Sans 400, `0.82rem`, `color: {textSubtle}`
  - Value: DM Sans 600, `0.82rem`, `color: {textPrimary}`
  - Trial-highlighted value: `color: {primary}` (green for BleSaf, red for AuSuivant)
- **Rows:**

| Key (EN) | Key (FR) | Value | Highlighted? |
|----------|----------|-------|-------------|
| Status | Statut | "TRIAL" / "ESSAI" | Yes |
| Trial | Essai | "29 days left" / "29 jours restants" | Yes |
| Trial ends | Fin d'essai | "16/03/2026" | No |

- **Progress bar:** (rendered between trial row and trial ends row)
  - `height: 4px; background: {cardBorder}; border-radius: 2px; margin: 0.3rem 0 0; width: 100%`
  - Fill: `height: 100%; background: {primary}; border-radius: 2px`
  - Fill width: `(daysElapsed / totalTrialDays) * 100%`
- **Action buttons:**
  - `display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.8rem`
  - **Extend:** `background: none; border: 1px solid #c5c0b8 / #c5bfb5; color: {textPrimary}; padding: 0.55rem; border-radius: 9px; font-weight: 600; font-size: 0.82rem; text-align: center`
    - Label: "Extend Trial" / "Prolonger l'essai"
  - **Upgrade:** `background: {primary}; color: #fff; border: none; padding: 0.55rem; border-radius: 9px; font-weight: 600; font-size: 0.82rem; text-align: center`
    - Label: "Upgrade" / "Upgrader"

### 5.5 Clinic Info Card

- **Container:** Same as Subscription Card
- **Section label:** "Clinic Info" / "Informations du Cabinet"
- **Grid:** `display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem 1.5rem`
- **Each info item:**
  - Label: `font-size: 0.62rem; color: {infoLabelColor}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.15rem; font-weight: 500`
    - BleSaf label color: `#2a9d6e` (green)
    - AuSuivant label color: `#c0392b` (red)
  - Value: DM Sans 500, `0.85rem`, `color: {textPrimary}`

**Fields:**

| Label (EN) | Label (FR) | Data Source |
|-----------|-----------|-------------|
| Email | Email | `clinic.email` |
| Phone | Téléphone | `clinic.phone` |
| Language | Langue | `clinic.language` |
| Spécialité | Spécialité | `clinic.specialty` |
| Avg Consultation | Consultation Moy. | `clinic.avgConsultationMinutes` + " Min" |
| Notify at Position | Notifier à la Position | "#" + `clinic.notifyAtPosition` |
| Created | Créé le | `clinic.createdAt` (DD/MM/YYYY) |
| Last Login | Dernière Connexion | `clinic.lastLoginAt` or "Never" / "Jamais" |
| Onboarding | Onboarding | "Step X/4 — {stepName}" / "Étape X/4 — {stepName}" |
| Address | Adresse | `clinic.address` |

### 5.6 Today's Activity Card

- **Container:** Same as other cards
- **Section label:** "Today's Activity" / "Activité du Jour"
- **Stat grid:** `display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.6rem`
- **Each stat box:**
  - `background: #fff; padding: 0.8rem; border-radius: 10px; border: 1px solid {cardBorder}; text-align: center`
  - Label: `font-size: 0.62rem; color: #999; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem`
  - Value: headingFont (Outfit / Playfair Display), `1.3rem`, `font-weight: 700`

| Stat | Label (EN) | Label (FR) | Value Color |
|------|-----------|-----------|-------------|
| Waiting | Waiting | En Attente | default (`{textPrimary}`) |
| In Consultation | In Consultation | En Consultation | default |
| Completed | Completed | Terminés | `#16a34a` (green) |
| No Shows | No Shows | Absents | `#dc2626` (red) |
| Cancelled | Cancelled | Annulés | default |

### 5.7 Weekly Chart Card

- **Container:** `background: #fff; border-radius: {cardRadius}; border: 1px solid {cardBorder}; padding: 1.1rem; margin-bottom: 1.2rem`
- **Section label:** "This Week" / "Cette Semaine"
- **Chart:** `display: flex; justify-content: space-around; align-items: flex-end; height: 60px; gap: 0.4rem`
- **Each bar column** (`flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem`):
  - **Bar:** `width: 100%; max-width: 32px; border-radius: 3px 3px 0 0; min-height: 3px`
    - BleSaf bar color: `#e8f5ee` (light green tint)
    - AuSuivant bar color: `#fde8e6` (light red tint)
    - Active bar (with data): `background: {primary}` with height proportional to value
    - Empty bar: just the tint color at `min-height: 3px`
  - **Value label:** `font-size: 0.62rem; color: #999`
  - **Day label (desktop):** `font-size: 0.62rem; color: #999`
    - Days: "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."

---

## 6. Clinic Detail — Mobile

**Breakpoint:** `< 768px`

### 6.1 Mobile Layout

```
┌───────────────────────────┐
│ MOBILE NAV  [Brand]   [☰]│
├───────────────────────────┤
│                           │
│ [←] Cabinet Médical Dr H. │
│     Dr Ghassen Hafsia     │
│     [Trial][Active][Doc]  │
│           [Login] [⋯]    │
│                           │
│ [Overview][Patients][...]  │
│ ──────────────────────     │
│                           │
│ ┌─ Subscription ────────┐│
│ │ Status      TRIAL     ││
│ │ Trial    29 days left  ││
│ │ [====progress====]     ││
│ │ Trial ends 16/03/2026  ││
│ │ [Extend]   [Upgrade]   ││
│ └────────────────────────┘│
│                           │
│ ┌─ Clinic Info ─────────┐│
│ │ EMAIL    PHONE         ││
│ │ val      val           ││
│ │ LANGUAGE SPÉCIALITÉ    ││
│ │ val      val           ││
│ │ ... (2-col grid)       ││
│ └────────────────────────┘│
│                           │
│ ┌─ Today's Activity ────┐│
│ │ [Waiting] [In Consult] ││
│ │ [Completed] [No Shows] ││
│ │ [    Cancelled       ] ││
│ └────────────────────────┘│
│                           │
│ ┌─ This Week ───────────┐│
│ │ [L][M][M][J][V][S][D] ││
│ └────────────────────────┘│
└───────────────────────────┘
```

### 6.2 Mobile Detail Header

- **Layout:** `display: flex; align-items: flex-start; gap: 0.5rem`
- **Back button:** Same as desktop (`30×30px`)
- **Center content** (`flex: 1; min-width: 0`):
  - Clinic name: headingFont, `1.02rem`, `font-weight: 700 (BleSaf) / 600 (AuSuivant); line-height: 1.3`
  - Doctor subtitle: DM Sans 400, `0.73rem`, `color: #999`
  - Pills row: `display: flex; gap: 0.2rem; margin-top: 0.25rem; flex-wrap: wrap`
    - **Abbreviated pill labels on mobile:**
      - "Doctor Present" → "Doctor" / "Médecin Présent" → "Médecin"
      - "Trial" and "Active" stay the same / "Essai" and "Actif" stay the same
- **Right actions** (`display: flex; gap: 0.3rem; align-items: center; flex-shrink: 0; margin-top: 0.1rem`):
  - **Login button (condensed):**
    - BleSaf: "Login", `font-size: 0.76rem`
    - AuSuivant: "Connexion", `font-size: 0.72rem; padding: 0.35rem 0.6rem`
    - Same filled style as desktop Login button
  - **Overflow menu button (⋯):**
    - `30×30px; border-radius: 7px; border: 1px solid {cardBorder}; background: #fff`
    - `color: #666 (BleSaf) / #777 (AuSuivant); font-size: 1rem`
    - Displays "⋯" (horizontal ellipsis) or Lucide `MoreHorizontal` icon
    - On tap: Opens a dropdown/bottom sheet with:
      1. "Pause" / "Pause" (amber text)
      2. "Reset Password" / "Réinitialiser MDP"
      3. "Delete" / "Supprimer" (red text, last item, separated with divider)

### 6.3 Mobile Sub-Tabs

- Same as desktop tabs but with `overflow-x: auto; scrollbar-width: none`
- Extends full width: `margin: 0.5rem -1rem 1rem; padding: 0 1rem` (bleeds into parent padding)
- Each tab: `flex-shrink: 0; white-space: nowrap`

### 6.4 Mobile Subscription Card

- Identical layout to desktop — key-value rows, progress bar, and 2-button grid all fit within mobile width
- Button labels may be shortened:
  - "Extend Trial" → "Extend" / "Prolonger l'essai" → "Prolonger"
  - "Upgrade" → "Upgrade" / "Upgrader" → "Upgrader" (stays same)

### 6.5 Mobile Clinic Info Card

- **Grid changes:** `grid-template-columns: repeat(2, 1fr)` (down from 4)
- **Fields shown (8 of 10):** Omit "Onboarding" and "Address" on mobile — these are available in the Settings sub-tab
- **Label abbreviations for mobile:**

| Desktop Label (EN) | Mobile Label (EN) | Desktop (FR) | Mobile (FR) |
|--------------------|--------------------|--------------|-------------|
| Avg Consultation | Avg Consult. | Consultation Moy. | Consult. Moy. |
| Notify at Position | Notify at | Notifier à la Position | Notifier à |
| Last Login | Last Login | Dernière Connexion | Connexion |

- **Email value:** Add `word-break: break-all; font-size: 0.78rem` to prevent overflow

### 6.6 Mobile Today's Activity

- **Grid changes:** `grid-template-columns: repeat(2, 1fr)` (2×2 layout)
- **5th stat (Cancelled/Annulés):** `grid-column: 1 / -1` (spans full width)
- **Stat label abbreviation:** "In Consultation" → "In Consult." / "En Consultation" → "En Consult."
- All other styling stays same

### 6.7 Mobile Weekly Chart

- **Day label abbreviation:** Single letter instead of abbreviated name
  - Desktop: "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."
  - Mobile: "L", "M", "M", "J", "V", "S", "D"
- Chart height and bar styling stays the same — 7 narrow bars fit well on 375px

---

## 7. Data Contracts

### 7.1 Clinic List (extends from admin dashboard spec)

```typescript
// GET /api/admin/clinics
interface AdminClinic {
  id: string;
  name: string;
  email: string;
  doctorName: string | null;
  phone: string | null;
  language: string;
  specialty: string | null;
  subscription: 'TRIAL' | 'ACTIVE' | 'CHURNED' | 'EXPIRED';
  trialEndsAt: string | null;
  patientsTotal: number;
  lastActiveAt: string | null;
  joinedAt: string;
  healthScore: number;
  churnRisk: 'high' | 'medium' | 'low' | null;
}
```

### 7.2 Clinic Detail

```typescript
// GET /api/admin/clinics/:clinicId
interface AdminClinicDetail extends AdminClinic {
  avgConsultationMinutes: number;
  notifyAtPosition: number;
  address: string | null;
  onboardingStep: number;          // 1-4
  onboardingStepName: string;      // "Account", "Clinic", "Queue", "Launch"
  lastLoginAt: string | null;
  createdAt: string;
  isDoctorPresent: boolean;
  isActive: boolean;               // account status (not subscription)
  todayActivity: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
  };
  weeklyActivity: {
    day: string;          // "lun.", "mar.", etc.
    dayShort: string;     // "L", "M", etc.
    count: number;
  }[];                   // Always 7 items (Mon-Sun)
}
```

### 7.3 Admin Actions

```typescript
// POST /api/admin/clinics/:clinicId/extend-trial
// body: { days: number }

// POST /api/admin/clinics/:clinicId/upgrade
// body: { plan: 'BASIC' | 'PRO' }

// POST /api/admin/clinics/:clinicId/pause

// POST /api/admin/clinics/:clinicId/reset-password

// DELETE /api/admin/clinics/:clinicId

// POST /api/admin/clinics/:clinicId/login-as
// Returns: { token: string, redirectUrl: string }
```

---

## 8. Responsive Breakpoint Strategy

| Breakpoint | Applied Changes |
|------------|-----------------|
| `≥ 768px` | Desktop layout — full table, 4-col info grid, 5-col stats, all action buttons visible |
| `< 768px` | Mobile layout — card list replaces table, 2-col info grid, 2×2+1 stats, overflow menu |

Implementation approach: Use `useIsMobile()` hook (or Tailwind `md:` prefix) to conditionally render desktop vs mobile components. Do NOT render both and hide with CSS — render only the appropriate one for performance.

---

## 9. Interaction States

### Table/List Rows

| State | Desktop | Mobile |
|-------|---------|--------|
| Default | No background | No background |
| Hover | `background: {hoverBg}` | N/A (no hover on touch) |
| Active/Tap | N/A | `background: {activeBg}` |
| Focus (keyboard) | `outline: 2px solid {primary}; outline-offset: -2px` | Same |

### Action Buttons

| Button | Hover | Active | Focus |
|--------|-------|--------|-------|
| Login (filled) | Darken bg 10% | Darken 15%, `transform: scale(0.98)` | `outline: 2px solid {primary}; outline-offset: 2px` |
| Pause (amber outline) | `background: rgba(245,158,11,0.08)` | `background: rgba(245,158,11,0.15)` | `outline: 2px solid #f59e0b` |
| Reset (neutral outline) | `background: {hoverBg}` | Darken border | Standard focus |
| Delete (text only) | `text-decoration: underline` | Darken color | Standard focus |
| Overflow ⋯ | `background: {hoverBg}` | `background: {activeBg}` | Standard focus |

### Overflow Menu (mobile)

- Opens on tap of ⋯ button
- Appears as: dropdown menu (desktop-like) or bottom sheet (native feel)
- Menu items: `padding: 0.7rem 1rem; font-size: 0.85rem; border-bottom: 1px solid {rowBorder}`
- Delete item: `color: {primary for AuSuivant = red} / #dc2626 for BleSaf`, separated by a thicker divider or extra padding
- Tap outside or swipe down to dismiss
- Backdrop: `rgba(0,0,0,0.3)` for bottom sheet

### Progress Bar

- **Animated fill on load:** CSS transition `width 600ms ease-out` — bar fills from 0 to actual width on mount

### Page Transitions

- Content fades in: `opacity: 0 → 1`, `translateY: 8px → 0`, `duration: 300ms ease-out`
- Cards stagger: each card delays `50ms` after the previous

---

## 10. Accessibility

### ARIA

| Element | Attribute | Value |
|---------|-----------|-------|
| Top nav tabs | `role` | `tablist` |
| Each nav tab | `role`, `aria-selected` | `tab`, `true/false` |
| Search input | `aria-label` | "Search clinics" / "Rechercher des cabinets" |
| Filters button (mobile) | `aria-haspopup`, `aria-expanded` | `true`, `true/false` |
| Clinic list item (mobile) | `role` | `link` (navigational) |
| Clinic table | implicit `table` | via semantic `<table>` |
| Detail sub-tabs | `role` | `tablist` |
| Each detail tab | `role`, `aria-selected` | `tab`, `true/false` |
| Overflow ⋯ button | `aria-label`, `aria-haspopup` | "More actions" / "Plus d'actions", `menu` |
| Overflow menu | `role` | `menu` |
| Menu items | `role` | `menuitem` |
| Progress bar | `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | `progressbar`, current%, 0, 100 |
| Stat boxes | `role` | `status` |
| Weekly chart bars | `aria-label` | "Monday: 0 patients" / "Lundi : 0 patients" |

### Keyboard Navigation

- **Tab order:** Nav → CTA → Search → Filters → Table rows (each focusable) → Actions within row
- **Mobile list items:** `tabindex="0"`, Enter/Space to navigate
- **Overflow menu:** Escape to close, Arrow keys to navigate items, Enter to activate
- **Sub-tabs:** Left/Right arrow to switch tabs

### Touch Targets

- All tappable elements on mobile: minimum `44×44px` touch target
- Clinic list items: row height ≥ 44px (met via padding)
- Overflow menu button: `30×30px` visual but `44×44px` touch area via padding/negative margin

---

## 11. Brand Differences Quick Reference

| Aspect | BleSaf "Emerald Cards" | AuSuivant "Warm Beige Editorial" |
|--------|------------------------|----------------------------------|
| **Language** | English | French |
| **Nav background** | `#1a3c34` (dark green) | `#1a1a2e` (dark navy) |
| **Active tab indicator** | White text + green underline | White text only (NO underline) |
| **CTA / primary** | `#2a9d6e` (green) | `#c0392b` (red) |
| **Page background** | `#f7f5f1` | `#f4f1ec` (warmer) |
| **Card border** | `#e8e5df` | `#e5e0d8` (warmer) |
| **Card radius** | `14px` | `12px` |
| **Row border** | `#f3f0ec` | `#f0ebe4` (warmer) |
| **Heading font** | Outfit (sans-serif) | Playfair Display (serif) |
| **Title "Directory"** | "Clinic Directory" (Outfit 700) | "Répertoire des Cabinets" (Playfair 600) |
| **Info label color** | `#2a9d6e` (green) | `#c0392b` (red) |
| **Trial highlight** | `color: #2a9d6e` | `color: #c0392b` |
| **Progress bar fill** | `#2a9d6e` | `#c0392b` |
| **Chart bar tint** | `#e8f5ee` (green tint) | `#fde8e6` (red tint) |
| **Extend button accent** | `color: #2a9d6e; border: #2a9d6e` | `color: #c0392b; border: #c0392b` |
| **Delete text color** | `#dc2626` | `#c0392b` |
| **Hover bg** | `#faf8f5` | `#f9f6f2` |
| **Active/tap bg** | `#f0ede7` | `#ebe7e0` |
| **Muted text** | `#666` secondary, `#999` tertiary | `#777` secondary, `#999` tertiary |
| **Mobile CTA label** | "+ New" | "+ Nouveau" |
| **Mobile login label** | "Login" | "Connexion" |
| **Mobile filters label** | "Filters" | "Filtres" |
| **Footer count** | "Showing N of N clinics" | "N cabinets sur N" |
| **Day labels (desktop)** | "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim." | Same (French) |
| **Day labels (mobile)** | "L", "M", "M", "J", "V", "S", "D" | Same |
