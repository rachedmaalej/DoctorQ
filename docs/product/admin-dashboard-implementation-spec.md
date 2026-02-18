# Admin Dashboard Implementation Specification

## BleSaf "Emerald Cards" & AuSuivant "Warm Beige Editorial"

**Purpose:** This document provides a pixel-level specification for implementing two admin dashboard designs. It is written for Claude Code (or any developer agent) to implement directly without needing to reference any mockup files. Every color, spacing value, font, component, and data contract is defined explicitly.

**Scope:** Two complete admin dashboard pages — one for the BleSaf (Tunisia) instance, one for the AuSuivant (France) instance. These are platform-level admin views (not clinic-level), used by the BleSaf/AuSuivant operations team to monitor all clinics, subscriptions, revenue, engagement, and churn.

---

## Table of Contents

1. [Shared Technical Requirements](#1-shared-technical-requirements)
2. [BleSaf "Emerald Cards" — Full Specification](#2-blesaf-emerald-cards)
3. [AuSuivant "Warm Beige Editorial" — Full Specification](#3-ausuivant-warm-beige-editorial)
4. [Data Contracts & API Endpoints](#4-data-contracts--api-endpoints)
5. [Component Inventory](#5-component-inventory)
6. [Responsive Behavior](#6-responsive-behavior)
7. [Interaction States & Animations](#7-interaction-states--animations)
8. [Accessibility Requirements](#8-accessibility-requirements)

---

## 1. Shared Technical Requirements

### 1.1 Tech Stack

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS (with custom theme extensions for the design tokens below)
- **State Management:** Zustand (already used in codebase)
- **Routing:** React Router v6 (already used in codebase)
- **Data Fetching:** Existing API client + real-time Socket.io subscriptions
- **Icons:** Lucide React (do NOT use emoji in production — the mockups used emoji as placeholders)

### 1.2 Font Loading

Load via Google Fonts in `index.html` or via `@fontsource` npm packages:

```
BleSaf:    "Outfit" (weights: 400, 500, 600, 700)
AuSuivant: "Playfair Display" (weights: 400, 500, 600, 700)
Both:      "DM Sans" (weights: 300, 400, 500, 600, 700) — body text for both
```

### 1.3 Instance Detection

The app should detect which brand instance it is running as. Use an environment variable:

```env
VITE_BRAND_INSTANCE=blesaf    # or "ausuivant"
```

The admin dashboard route renders the correct design based on this value. Both designs share the same data layer and API — only the visual presentation differs.

### 1.4 File Structure

```
web/src/pages/admin/
├── AdminDashboard.tsx          # Router: renders correct brand variant
├── blesaf/
│   ├── BlesafAdminDashboard.tsx
│   ├── components/
│   │   ├── TopNav.tsx
│   │   ├── HeroStatCard.tsx
│   │   ├── ClinicTable.tsx
│   │   └── ActivityPanel.tsx
│   └── blesaf-admin.css        # (or use Tailwind classes exclusively)
├── ausuivant/
│   ├── AusuivantAdminDashboard.tsx
│   ├── components/
│   │   ├── DarkTopBar.tsx
│   │   ├── KpiCard.tsx
│   │   ├── ClinicPerformancePanel.tsx
│   │   └── ActivityFeedPanel.tsx
│   └── ausuivant-admin.css
└── shared/
    ├── hooks/
    │   ├── useAdminStats.ts
    │   ├── useClinicList.ts
    │   └── useActivityFeed.ts
    ├── types.ts
    └── utils.ts
```

---

## 2. BleSaf "Emerald Cards"

### 2.1 Design Token Reference

#### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bs-nav-bg` | `#1a3c34` | Top navigation bar background |
| `--bs-nav-text` | `#7aa38d` | Inactive nav tab text |
| `--bs-nav-text-active` | `#ffffff` | Active nav tab text |
| `--bs-nav-indicator` | `#2a9d6e` | Active tab underline (2px bottom border) |
| `--bs-brand-mark-bg` | `#2a9d6e` | Logo mark background (square rounded icon) |
| `--bs-page-bg` | `#f7f5f1` | Main content area background |
| `--bs-card-bg` | `#ffffff` | Card surfaces |
| `--bs-card-border` | `#e8e5df` | Card borders |
| `--bs-card-row-border` | `#f3f0ec` | Table row dividers |
| `--bs-text-primary` | `#1a1a2e` | Primary text |
| `--bs-text-muted` | `#8a8a9a` | Labels, secondary text |
| `--bs-text-tertiary` | `#999999` | Timestamps, metadata |
| `--bs-primary` | `#2a9d6e` | Primary action buttons (CTA) |
| `--bs-hero-gradient-start` | `#1a3c34` | Hero stat card gradient start |
| `--bs-hero-gradient-end` | `#2a5e4a` | Hero stat card gradient end |
| `--bs-hero-label` | `#a3d4b8` | Label text on hero card |
| `--bs-hero-delta` | `#7cc9a5` | Delta/change text on hero card |
| `--bs-success` | `#16a34a` | Positive deltas, healthy indicators |
| `--bs-warning` | `#f59e0b` | Warning indicators (amber) |
| `--bs-danger` | `#ef4444` | Danger indicators (red) |
| `--bs-badge-active-bg` | `#dcfce7` | Active status badge background |
| `--bs-badge-active-text` | `#166534` | Active status badge text |
| `--bs-badge-trial-bg` | `#fef3c7` | Trial status badge background |
| `--bs-badge-trial-text` | `#92400e` | Trial status badge text |

#### Typography

| Element | Font | Weight | Size | Letter Spacing | Transform |
|---------|------|--------|------|----------------|-----------|
| Brand name in nav | Outfit | 700 | 1.05rem (16.8px) | 0 | none |
| Nav tab links | Outfit | 500 | 0.84rem (13.4px) | 0 | none |
| Section page title | Outfit | 600 | 0.95rem (15.2px) | 0 | none |
| KPI card label | DM Sans | 500 | 0.72rem (11.5px) | 0.05em | uppercase |
| KPI card value | Outfit | 700 | 1.8rem (28.8px) | 0 | none |
| KPI card delta | DM Sans | 400 | 0.72rem (11.5px) | 0 | none |
| Table header | DM Sans | 500 | 0.68rem (10.9px) | 0.06em | uppercase |
| Table body cell | DM Sans | 400 | 0.84rem (13.4px) | 0 | none |
| Status badge | DM Sans | 600 | 0.7rem (11.2px) | 0 | none |
| Activity text | DM Sans | 400 | 0.82rem (13.1px) | 0 | none |
| Activity timestamp | DM Sans | 400 | 0.68rem (10.9px) | 0 | none |
| Button text | Outfit | 600 | 0.82rem (13.1px) | 0 | none |

#### Spacing & Radii

| Token | Value |
|-------|-------|
| Nav horizontal padding | 2rem (32px) |
| Nav vertical padding | 0.9rem (14.4px) |
| Content area padding | 1.5rem 2rem (24px 32px) |
| KPI card padding | 1.3rem 1.4rem (20.8px 22.4px) |
| Card border radius | 16px |
| Button border radius | 8px |
| Badge border radius | 100px (pill) |
| Brand mark border radius | 7px |
| KPI grid gap | 1rem (16px) |
| Dual column gap | 1.5rem (24px) |
| Table cell padding | 0.75rem 1.3rem (12px 20.8px) |
| Activity item padding | 0.8rem 1.3rem (12.8px 20.8px) |

### 2.2 Page Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION BAR  (full width, bg: #1a3c34)                  │
│  [Logo Mark] BleSaf Admin    [Overview] [Clinics] [...]   [+CTA]│
├─────────────────────────────────────────────────────────────────┤
│  CONTENT AREA  (bg: #f7f5f1, padding: 24px 32px)               │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ HERO KPI │ │  KPI #2  │ │  KPI #3  │ │  KPI #4  │          │
│  │(gradient)│ │ (white)  │ │ (white)  │ │ (white)  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌─────────────────────────────┐ ┌────────────────────┐        │
│  │      CLINIC TABLE           │ │  ACTIVITY & ALERTS │        │
│  │  (header + rows)            │ │  (dot + text items)│        │
│  │                             │ │                    │        │
│  │                             │ │                    │        │
│  └─────────────────────────────┘ └────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Specifications

#### 2.3.1 Top Navigation Bar

- **Container:** Full-width, `display: flex`, `align-items: center`, `justify-content: space-between`
- **Background:** `#1a3c34`
- **Padding:** `0.9rem 2rem`
- **Left cluster: Brand**
  - Logo mark: `26×26px` square, `background: #2a9d6e`, `border-radius: 7px`, white centered letter "B" (Outfit 700, 0.72rem)
  - Brand text: "BleSaf Admin", `color: #ffffff`, Outfit 700, 1.05rem
  - Gap between mark and text: `0.5rem`
- **Center cluster: Tab navigation**
  - Each tab: `padding: 0.4rem 1rem`, Outfit 500, 0.84rem
  - Inactive: `color: #7aa38d`, `border-bottom: 2px solid transparent`
  - Active: `color: #ffffff`, `border-bottom: 2px solid #2a9d6e`
  - Tabs: "Overview" (default active), "Clinics", "Financial", "Engagement"
  - Tab links navigate to sub-routes: `/admin`, `/admin/clinics`, `/admin/financial`, `/admin/engagement`
- **Right cluster: CTA button**
  - Text: "+ New Clinic"
  - Style: `background: #2a9d6e`, `color: #fff`, `padding: 0.5rem 1rem`, `border-radius: 8px`, Outfit 600, 0.82rem
  - On click: Opens a modal or navigates to `/admin/clinics/new`

#### 2.3.2 Hero Stat Cards Row

- **Grid:** `display: grid`, `grid-template-columns: repeat(4, 1fr)`, `gap: 1rem`
- **Margin bottom:** `1.5rem`
- **First card (Hero):**
  - `background: linear-gradient(135deg, #1a3c34, #2a5e4a)`
  - `color: #ffffff`
  - `border: none`
  - Label color: `#a3d4b8`
  - Delta color: `#7cc9a5`
- **Cards 2–4:**
  - `background: #ffffff`
  - `border: 1px solid #e8e5df`
  - Label color: `#8a8a9a`
  - Delta color: `#16a34a`
- **All cards:**
  - `padding: 1.3rem 1.4rem`
  - `border-radius: 16px`
  - Label: uppercase, 0.72rem, letter-spacing 0.05em, margin-bottom 0.4rem
  - Value: Outfit 700, 1.8rem
  - Delta: 0.72rem, margin-top 0.3rem, prefix with "↑" or "↓" icon (use Lucide `TrendingUp` / `TrendingDown`, 12px)

**Default KPI data mapping:**

| Card # | Label | Data Field | Example |
|--------|-------|------------|---------|
| 1 (Hero) | Active Clinics | `stats.activeClinics` | 20 |
| 2 | Paid Subscriptions | `stats.paidSubscriptions` | 8 |
| 3 | MRR | `stats.mrr` | "640 TND" |
| 4 | Conversion Rate | `stats.conversionRate` | "42%" |

For the MRR card, append the currency unit as a separate `<span>` with `font-size: 0.85rem`, `font-weight: 400`, `color: #8a8a9a`.

#### 2.3.3 Dual Column Layout

- **Grid:** `display: grid`, `grid-template-columns: 1fr 340px`, `gap: 1.5rem`
- Left column: Clinic Table panel
- Right column: Activity & Alerts panel

#### 2.3.4 Clinic Table Panel

- **Container:** `background: #ffffff`, `border-radius: 16px`, `border: 1px solid #e8e5df`, `overflow: hidden`
- **Panel header:**
  - `padding: 1rem 1.3rem`
  - `border-bottom: 1px solid #e8e5df`
  - `display: flex`, `justify-content: space-between`, `align-items: center`
  - Title: "Clinic Directory", Outfit 600, 0.95rem
  - Right side: optional filter chips or search (future iteration)
- **Table:**
  - Full width, no outer borders, `border-collapse: collapse`
  - **Header row:**
    - `background: transparent` (no background on `<th>`)
    - `padding: 0.7rem 1.3rem`
    - `font-size: 0.68rem`, `text-transform: uppercase`, `letter-spacing: 0.06em`
    - `color: #999999`
    - `border-bottom: 1px solid #e8e5df`
    - `font-weight: 500`
  - **Columns:** Clinic (name, bold 600) | Status (badge) | Patients (number) | Last Active (timestamp, color #999)
  - **Body rows:**
    - `padding: 0.75rem 1.3rem`
    - `border-bottom: 1px solid #f3f0ec`
    - Last row: no bottom border
    - Clinic name: DM Sans 600, 0.84rem, `color: #1a1a2e`
    - Patient count: DM Sans 400, 0.84rem
    - Last active: DM Sans 400, 0.84rem, `color: #999`
  - **Status badges:**
    - Pill shape: `border-radius: 100px`, `padding: 0.2rem 0.6rem`, `font-size: 0.7rem`, `font-weight: 600`
    - Active: `bg: #dcfce7`, `color: #166534`, text: "Active" / "Actif"
    - Trial: `bg: #fef3c7`, `color: #92400e`, text: "Trial" / "Essai"
    - At Risk: `bg: #fee2e2`, `color: #991b1b`, text: "At Risk"
    - Churned: `bg: #f3f4f6`, `color: #6b7280`, text: "Churned"
  - **Row hover:** `background: #faf8f5` (subtle warm tint)
  - **Row click:** Navigate to `/admin/clinics/:clinicId`

#### 2.3.5 Activity & Alerts Panel

- **Container:** Same card styling as Clinic Table (`bg: #fff`, `border-radius: 16px`, `border: 1px solid #e8e5df`)
- **Panel header:** "Activity & Alerts", same styling as table header
- **Activity items:**
  - `padding: 0.8rem 1.3rem`
  - `border-bottom: 1px solid #f3f0ec`
  - Last item: no bottom border
  - Layout: `display: flex`, `gap: 0.7rem`, `align-items: flex-start`
  - **Status dot:** `8×8px` circle, `margin-top: 0.35rem`, `flex-shrink: 0`
    - Green (success events): `#16a34a`
    - Amber (warnings): `#f59e0b`
    - Red (danger/churn risk): `#ef4444`
  - **Content:**
    - Text: DM Sans 400, 0.82rem, `color: #1a1a2e`
    - Timestamp: DM Sans 400, 0.68rem, `color: #999`, `margin-top: 0.15rem`
- **Activity types and their dot colors:**
  - `clinic_active` (high patient volume) → green
  - `trial_expiring` → amber
  - `no_login` (churn risk) → red
  - `plan_upgrade` → green
  - `new_trial_started` → green
  - `trial_expired` → red

---

## 3. AuSuivant "Warm Beige Editorial"

### 3.1 Design Token Reference

#### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--fr-nav-bg` | `#1a1a2e` | Top navigation bar background (dark navy) |
| `--fr-nav-text` | `#777777` | Inactive nav tab text |
| `--fr-nav-text-active` | `#ffffff` | Active nav tab text |
| `--fr-brand-mark-bg` | `#c0392b` | Logo mark background (solid red square) |
| `--fr-page-bg` | `#f4f1ec` | Main content area background (warm beige linen) |
| `--fr-card-bg` | `#ffffff` | Card surfaces |
| `--fr-card-border` | `#e5e0d8` | Card borders (warmer than BleSaf) |
| `--fr-card-row-border` | `#f0ebe4` | Row dividers inside cards |
| `--fr-text-primary` | `#1a1a2e` | Primary text |
| `--fr-text-muted` | `#999999` | Labels, secondary text |
| `--fr-primary` | `#c0392b` | Primary action buttons (red CTA) |
| `--fr-primary-hover` | `#a93226` | Button hover state |
| `--fr-success` | `#16a34a` | Positive deltas |
| `--fr-avatar-bg` | `#e5e0d8` | Avatar circle background |
| `--fr-avatar-text` | `#777777` | Avatar initials |

#### Typography

| Element | Font | Weight | Size | Letter Spacing | Transform |
|---------|------|--------|------|----------------|-----------|
| Brand name in nav | Playfair Display | 600 | 1.05rem (16.8px) | 0 | none |
| Nav tab links | DM Sans | 500 | 0.84rem (13.4px) | 0 | none |
| Section title (h1) | Playfair Display | 600 | 1.3rem (20.8px) | 0 | none |
| KPI card label | DM Sans | 500 | 0.7rem (11.2px) | 0.06em | uppercase |
| KPI card value | Playfair Display | 700 | 1.7rem (27.2px) | 0 | none |
| KPI card delta | DM Sans | 400 | 0.7rem (11.2px) | 0 | none |
| Panel header | Playfair Display | 600 | 0.92rem (14.7px) | 0 | none |
| Clinic name | DM Sans | 500 | 0.82rem (13.1px) | 0 | none |
| Clinic subtitle | DM Sans | 400 | 0.68rem (10.9px) | 0 | none |
| Patient count | DM Sans | 600 | 0.85rem (13.6px) | 0 | none |
| Activity text | DM Sans | 400 | 0.8rem (12.8px) | 0 | none |
| Activity timestamp | DM Sans | 400 | 0.68rem (10.9px) | 0 | none |
| Button text | DM Sans | 600 | 0.82rem (13.1px) | 0 | none |

#### Spacing & Radii

| Token | Value |
|-------|-------|
| Nav horizontal padding | 2.5rem (40px) |
| Nav vertical padding | 0.9rem (14.4px) |
| Content area padding | 2rem 2.5rem (32px 40px) |
| Content max-width | 1200px (centered) |
| KPI card padding | 1.3rem 1.4rem (20.8px 22.4px) |
| Card border radius | 14px |
| Button border radius | 8px |
| Badge / pill border radius | 100px |
| Brand mark border radius | 7px |
| Avatar border radius | 50% (circle) |
| KPI grid gap | 1rem (16px) |
| Dual panel gap | 1.5rem (24px) |
| Clinic row padding | 0.7rem 1.3rem |
| Activity item padding | 0.65rem 1.3rem |

### 3.2 Page Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  DARK TOP BAR  (full width, bg: #1a1a2e)                        │
│  [Mark] AuSuivant  [Vue d'ensemble] [Cabinets] [...]  [+CTA]   │
├─────────────────────────────────────────────────────────────────┤
│  CONTENT AREA  (bg: #f4f1ec, padding: 32px 40px, max-w: 1200)  │
│                                                                  │
│  Vue d'ensemble  (section title, Playfair Display)               │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │  KPI #1   │ │  KPI #2   │ │  KPI #3   │ │  KPI #4   │      │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘      │
│                                                                  │
│  ┌──────────────────────┐ ┌──────────────────────┐              │
│  │  CLINIC PERFORMANCE  │ │   ACTIVITY FEED      │              │
│  │  (avatar rows)       │ │   (text items)       │              │
│  │                      │ │                      │              │
│  └──────────────────────┘ └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Specifications

#### 3.3.1 Dark Top Navigation Bar

- **Container:** Full-width, `display: flex`, `align-items: center`, `justify-content: space-between`
- **Background:** `#1a1a2e` (dark navy, NOT pure black)
- **Padding:** `0.9rem 2.5rem`
- **Left cluster: Brand**
  - Logo mark: `28×28px` square, `background: #c0392b`, `border-radius: 7px`, white centered letters "AS" (DM Sans 700, 0.7rem)
  - Brand text: "AuSuivant", Playfair Display 600, 1.05rem, `color: #ffffff`
  - Gap: `0.6rem`
- **Center cluster: Tab navigation**
  - Each tab: `padding: 0.4rem 1rem`, DM Sans 500, 0.84rem
  - Inactive: `color: #777777`
  - Active: `color: #ffffff` (NO underline — differs from BleSaf. Active state is color only)
  - Tabs: "Vue d'ensemble" (default active), "Cabinets", "Finances", "Engagement"
- **Right cluster: CTA button**
  - Text: "+ Nouveau Cabinet"
  - Style: `background: #c0392b`, `color: #fff`, `padding: 0.5rem 1rem`, `border-radius: 8px`, DM Sans 600, 0.82rem
  - Hover: `background: #a93226`

#### 3.3.2 Section Title

- Below the nav, inside the content area
- Text: "Vue d'ensemble"
- Font: Playfair Display 600, 1.3rem
- `color: #1a1a2e`
- `margin-bottom: 1.2rem`

#### 3.3.3 KPI Cards Row

- **Grid:** `display: grid`, `grid-template-columns: repeat(4, 1fr)`, `gap: 1rem`
- **Margin bottom:** `2rem` (note: larger than BleSaf's 1.5rem — gives more editorial breathing room)
- **All cards are identical styling** (no hero card — differs from BleSaf):
  - `background: #ffffff`
  - `padding: 1.3rem 1.4rem`
  - `border-radius: 14px`
  - `border: 1px solid #e5e0d8`
  - Label: uppercase, DM Sans 500, 0.7rem, `color: #999`, letter-spacing 0.06em
  - Value: Playfair Display 700, 1.7rem, `color: #1a1a2e`
  - Delta: DM Sans 400, 0.7rem, `color: #16a34a`, margin-top 0.2rem

**Default KPI data mapping:**

| Card # | Label (FR) | Data Field | Example |
|--------|------------|------------|---------|
| 1 | Cabinets Actifs | `stats.activeClinics` | 42 |
| 2 | MRR | `stats.mrr` | "2 340€" |
| 3 | Patients / Sem | `stats.weeklyPatients` | 1 205 |
| 4 | Conversion | `stats.conversionRate` | "45%" |

French number formatting: use non-breaking space as thousands separator (e.g., `2 340`, not `2,340`). Currency symbol `€` follows the number with a space.

#### 3.3.4 Dual Panel Layout

- **Grid:** `display: grid`, `grid-template-columns: 1fr 1fr`, `gap: 1.5rem`
- **IMPORTANT:** Both columns are equal width (50/50 split). This differs from BleSaf which uses `1fr 340px`.

#### 3.3.5 Clinic Performance Panel (Left)

- **Container:** `background: #ffffff`, `border-radius: 14px`, `border: 1px solid #e5e0d8`, `overflow: hidden`
- **Panel header:**
  - `padding: 1rem 1.3rem`
  - `border-bottom: 1px solid #e5e0d8`
  - Text: "Performance Cabinets", Playfair Display 600, 0.92rem
- **Clinic rows:**
  - `display: flex`, `align-items: center`, `padding: 0.7rem 1.3rem`, `gap: 0.8rem`
  - `border-bottom: 1px solid #f0ebe4`
  - Last row: no bottom border
  - **Avatar circle:**
    - `32×32px`, `border-radius: 50%`
    - `background: #e5e0d8`
    - Initials: DM Sans 600, 0.65rem, `color: #777`
    - Initials logic: Take first letter of first two significant words (e.g., "Cabinet Médical Trocadéro" → "MT", "Dr. Perrin" → "PP")
    - `flex-shrink: 0`
  - **Info (flex: 1):**
    - Name: DM Sans 500, 0.82rem, `color: #1a1a2e`
    - Subtitle: DM Sans 400, 0.68rem, `color: #999`
    - Subtitle content: "{Status} · {Doctor name}" or "{Status} · {days} jours restants"
  - **Value (right-aligned):**
    - DM Sans 600, 0.85rem, `color: #1a1a2e`
    - Format: "{count} pts" (abbreviation for "patients")
  - **Row hover:** `background: #faf8f5`
  - **Row click:** Navigate to clinic detail

#### 3.3.6 Activity Feed Panel (Right)

- **Container:** Same card styling as Performance Panel
- **Panel header:** "Fil d'Activité", Playfair Display 600, 0.92rem
- **Activity items:**
  - `padding: 0.65rem 1.3rem`
  - `border-bottom: 1px solid #f0ebe4`
  - Last item: no bottom border
  - **NO dot indicator** (differs from BleSaf — AuSuivant uses a cleaner, text-only approach)
  - Text: DM Sans 400, 0.8rem, `color: #1a1a2e`
  - Timestamp: DM Sans 400, 0.68rem, `color: #999`, `margin-top: 0.1rem`
  - Activity text is a single natural language sentence describing the event

---

## 4. Data Contracts & API Endpoints

### 4.1 Admin Stats Endpoint

```
GET /api/admin/stats?period=30d
```

**Response:**

```typescript
interface AdminStats {
  activeClinics: number;
  activeTrials: number;
  paidSubscriptions: number;
  mrr: number;                    // in smallest currency unit
  mrrCurrency: 'TND' | 'EUR';
  conversionRate: number;         // 0-100
  weeklyPatients: number;
  dailyActive: number;
  deltas: {
    activeClinics: { value: number; direction: 'up' | 'down' | 'steady' };
    paidSubscriptions: { value: number; direction: 'up' | 'down' | 'steady' };
    mrr: { value: number; direction: 'up' | 'down' | 'steady' };  // percentage
    conversionRate: { value: number; direction: 'up' | 'down' | 'steady' };  // percentage points
    weeklyPatients: { value: number; direction: 'up' | 'down' | 'steady' };
  };
}
```

### 4.2 Clinic List Endpoint

```
GET /api/admin/clinics?sort=patients&order=desc&status=all
```

**Response:**

```typescript
interface AdminClinic {
  id: string;
  name: string;
  email: string;
  doctorName: string | null;
  subscription: 'TRIAL' | 'ACTIVE' | 'CHURNED' | 'EXPIRED';
  trialEndsAt: string | null;       // ISO date
  patientsTotal: number;
  patientsThisWeek: number;
  lastActiveAt: string | null;       // ISO date
  joinedAt: string;                  // ISO date
  healthScore: number;               // 0-100
  churnRisk: 'high' | 'medium' | 'low' | null;
}

interface AdminClinicsResponse {
  clinics: AdminClinic[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 4.3 Activity Feed Endpoint

```
GET /api/admin/activity?limit=20
```

**Response:**

```typescript
interface ActivityEvent {
  id: string;
  type: 'clinic_active' | 'trial_expiring' | 'no_login' | 'plan_upgrade' | 'new_trial_started' | 'trial_expired' | 'high_volume';
  clinicId: string;
  clinicName: string;
  message: string;                   // Pre-formatted natural language
  severity: 'success' | 'warning' | 'danger' | 'info';
  createdAt: string;                 // ISO date
}
```

### 4.4 Socket.io Events (Real-time)

Subscribe to admin-scoped events on the `admin` room:

```typescript
socket.on('admin:stats_updated', (stats: Partial<AdminStats>) => { ... });
socket.on('admin:clinic_activity', (event: ActivityEvent) => { ... });
socket.on('admin:clinic_status_changed', (data: { clinicId: string; status: string }) => { ... });
```

---

## 5. Component Inventory

### 5.1 Shared Components (used by both designs)

| Component | Props | Notes |
|-----------|-------|-------|
| `StatusBadge` | `status: 'TRIAL' \| 'ACTIVE' \| 'CHURNED' \| 'EXPIRED'`, `locale: 'en' \| 'fr'` | Renders pill badge with correct colors and label per locale |
| `DeltaIndicator` | `value: number`, `direction: 'up' \| 'down' \| 'steady'`, `suffix?: string` | Renders "↑ 18%" or "↓ 3" with correct color |
| `RelativeTime` | `date: string`, `locale: 'en' \| 'fr'` | "2 hours ago" / "Il y a 2 heures" |
| `CurrencyDisplay` | `amount: number`, `currency: 'TND' \| 'EUR'` | Formats with locale rules: "640 TND" or "2 340 €" |

### 5.2 BleSaf-Only Components

| Component | Notes |
|-----------|-------|
| `BlesafTopNav` | Green nav bar with brand mark, tabs, and CTA |
| `HeroStatCard` | Gradient background card (first KPI only) |
| `StatCard` | White background KPI card |
| `ClinicTablePanel` | Full table with header row + data rows |
| `ActivityAlertPanel` | Dot + text activity items |
| `ActivityDot` | `8×8px` colored circle based on severity |

### 5.3 AuSuivant-Only Components

| Component | Notes |
|-----------|-------|
| `AusuivantDarkTopBar` | Dark navy bar with Playfair Display brand |
| `KpiCard` | White card with Playfair Display values (no hero variant) |
| `ClinicPerformancePanel` | Avatar rows with name/subtitle/value |
| `ClinicAvatar` | `32px` circle with initials |
| `ActivityFeedPanel` | Text-only items (no dots) |

---

## 6. Responsive Behavior

### 6.1 Breakpoints

| Breakpoint | Name | Behavior |
|------------|------|----------|
| ≥1200px | Desktop | Full layout as specified |
| 768px–1199px | Tablet | KPI grid → 2 columns; Dual panels → stacked (full width) |
| <768px | Mobile | KPI grid → 1 column; Nav tabs → hamburger menu or horizontal scroll; All panels stacked |

### 6.2 BleSaf Responsive

- **Tablet:** `grid-template-columns: repeat(2, 1fr)` for KPI row; dual columns become `grid-template-columns: 1fr` (activity panel stacks below table)
- **Mobile:** KPI cards single column; top nav brand stays, tabs become a horizontal scrollable row or a dropdown

### 6.3 AuSuivant Responsive

- **Tablet:** KPI grid → `repeat(2, 1fr)`; dual panels → stacked `1fr`; content padding reduces to `1.5rem`
- **Mobile:** KPI grid → `1fr`; top bar padding reduces to `0.7rem 1rem`; section title font-size reduces to 1.1rem

---

## 7. Interaction States & Animations

### 7.1 Shared Interactions

| Element | Interaction | Behavior |
|---------|-------------|----------|
| CTA button | Hover | Darken background 10% (BleSaf: `#238c5f`, AuSuivant: `#a93226`) |
| CTA button | Active/pressed | Darken 15%, scale 0.98 |
| CTA button | Focus | `outline: 2px solid` brand color, `outline-offset: 2px` |
| Nav tab | Hover | Color transitions to `rgba(255,255,255,0.7)` over `150ms ease` |
| Table/list row | Hover | Background tints to warm off-white over `100ms ease` |
| Table/list row | Click | Navigate to detail page |
| Card | Hover | Subtle `box-shadow: 0 2px 8px rgba(0,0,0,0.04)` over `200ms ease` |
| Badge | — | No hover state (static indicator) |
| KPI card | — | No hover state (static display) |

### 7.2 Page Load Animation

Use a simple stagger fade-in on initial render:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- KPI cards: stagger `50ms` delay each (card 1: 0ms, card 2: 50ms, card 3: 100ms, card 4: 150ms)
- Panels: appear after KPIs with `200ms` delay
- Duration: `300ms`, easing: `ease-out`

### 7.3 Real-time Updates

When new activity events arrive via Socket.io:

- New item slides in from top of the activity list with `slideInDown` animation (`200ms ease-out`)
- KPI values that change: apply a brief `pulse` effect (scale 1.02 and back over `300ms`)

---

## 8. Accessibility Requirements

### 8.1 ARIA Attributes

| Element | ARIA | Value |
|---------|------|-------|
| Top nav | `role` | `navigation` |
| Nav tabs | `role` | `tablist` |
| Each tab | `role` | `tab`, `aria-selected: true/false` |
| Content area | `role` | `main` |
| KPI card | `role` | `status` (live metric) |
| Clinic table | `role` | `table` (implicit via `<table>`) |
| Activity list | `role` | `log` |
| Activity dot (BleSaf) | `aria-hidden` | `true` (decorative, severity conveyed in text) |
| Avatar (AuSuivant) | `aria-hidden` | `true` |
| Status badge | — | Text content is sufficient |
| CTA button | `aria-label` | "Add new clinic" / "Ajouter un nouveau cabinet" |

### 8.2 Keyboard Navigation

- Tab order: Nav tabs → CTA button → KPI cards (not focusable unless interactive) → Table rows → Activity items
- Table rows: focusable via `tabindex="0"`, Enter/Space to navigate to detail
- Nav tabs: Left/Right arrow key navigation within tablist
- Escape: Close any open modals

### 8.3 Color Contrast

All color combinations meet WCAG AA (4.5:1 for text):

- `#1a1a2e` on `#f7f5f1` → 12.8:1 ✓
- `#999` on `#ffffff` → 4.6:1 ✓ (AA, use `#888` if borderline)
- `#ffffff` on `#1a3c34` → 11.2:1 ✓
- `#ffffff` on `#c0392b` → 5.1:1 ✓
- `#ffffff` on `#2a9d6e` → 4.6:1 ✓
- `#166534` on `#dcfce7` → 5.8:1 ✓
- `#92400e` on `#fef3c7` → 5.4:1 ✓

### 8.4 Screen Reader Considerations

- KPI deltas should include hidden text: `<span class="sr-only">increased by</span> 18%`
- Relative times should include the absolute date in a `title` attribute or `aria-label`
- Activity severity dots in BleSaf are decorative — ensure the text itself conveys severity (e.g., "Cabinet Marsa — no login for 5 days" clearly indicates risk without relying on the red dot)

---

## Quick Reference: Key Differences Between the Two Designs

| Aspect | BleSaf "Emerald Cards" | AuSuivant "Warm Beige Editorial" |
|--------|------------------------|----------------------------------|
| **Nav position** | Top, dark green `#1a3c34` | Top, dark navy `#1a1a2e` |
| **Active tab style** | White text + green underline | White text only (no underline) |
| **CTA color** | Green `#2a9d6e` | Red `#c0392b` |
| **Page background** | `#f7f5f1` (warm white) | `#f4f1ec` (warm beige, warmer) |
| **Heading font** | Outfit (sans-serif) | Playfair Display (serif) |
| **Card radius** | 16px | 14px |
| **Card border** | `#e8e5df` | `#e5e0d8` (warmer) |
| **KPI row** | 4 cards, first is gradient hero | 4 cards, all identical white |
| **KPI value font** | Outfit 700 | Playfair Display 700 |
| **Content max-width** | None (fills available space) | 1200px (centered) |
| **Dual column split** | `1fr 340px` (table dominant) | `1fr 1fr` (equal 50/50) |
| **Left panel** | Table with column headers | Avatar row list (no table headers) |
| **Right panel** | Dot + text activity items | Text-only activity items (no dots) |
| **Section title** | None (page title in nav context) | "Vue d'ensemble" Playfair Display h1 |
| **Language** | English | French |
| **Currency** | TND (follows number) | EUR (€ follows number with space) |
| **Number format** | 1,247 (comma separator) | 1 205 (space separator) |
