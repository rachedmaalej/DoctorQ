# AuSuivant — France Brand Development Guide

**AuSuivant** is the France-market variant of the DoctorQ queue management platform. It runs from the same monorepo codebase as **BleSaf** (Tunisia) but with a distinct brand identity, design system, payment integration, and regulatory compliance posture.

> **Commercial name:** FiloSoin
> **Dashboard name:** AuSuivant
> **Domain:** filosoin.fr
> **Legal entity:** FiloSoin SAS
> **Jurisdiction:** Tribunaux compétents de Paris

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Brand Configuration](#2-brand-configuration)
3. [BleSaf vs AuSuivant Comparison](#3-blesaf-vs-ausuivant-comparison)
4. [Design System](#4-design-system)
5. [Screens & Components](#5-screens--components)
   - [5.1 Doctor Dashboard (Mobile)](#51-doctor-dashboard-mobile)
   - [5.2 Patient Status Page](#52-patient-status-page)
   - [5.3 Admin Dashboard](#53-admin-dashboard)
   - [5.4 Shared Pages](#54-shared-pages)
6. [Payment Integration](#6-payment-integration)
7. [RGPD Compliance](#7-rgpd-compliance)
8. [Real-Time (Socket.io)](#8-real-time-socketio)
9. [Build & Vite Configuration](#9-build--vite-configuration)
10. [File Reference](#10-file-reference)

---

## 1. Quick Start

```bash
# Start both API + Web for France
pnpm dev:fr

# Or start individually
pnpm dev:api:fr     # API on port 3002 (BRAND=france)
pnpm dev:web:fr     # Web on port 5175 (mode=france)

# Run both brands simultaneously
pnpm dev:all        # BleSaf (3001/5174) + AuSuivant (3002/5175)
```

| Instance | API Port | Web Port | URL |
|----------|----------|----------|-----|
| BleSaf (Tunisia) | 3001 | 5174 | http://localhost:5174 |
| AuSuivant (France) | 3002 | 5175 | http://localhost:5175 |

### Environment Files

**`apps/web/.env.france`**
```
VITE_BRAND=france
VITE_API_URL=http://localhost:3002
VITE_SOCKET_URL=http://localhost:3002
```

**API** reads `BRAND=france` from the environment variable set by the `dev:fr` script (via `cross-env`). No separate `.env.france` file on the API side.

---

## 2. Brand Configuration

Brand-specific values are centralized in two mirrored config files:

### Frontend — `apps/web/src/lib/brand.ts`

```typescript
france: {
  id: 'france',
  name: 'FiloSoin',
  domain: 'filosoin.fr',
  supportEmail: 'support@filosoin.fr',
  country: 'FR',
  defaultLanguage: 'fr',
  supportedLanguages: ['fr'],          // No Arabic
  phone: {
    countryCode: '+33',
    countryCodeDigits: '33',
    localDigits: 9,                     // 9 digits (vs 8 for Tunisia)
    placeholder: '+33 X XX XX XX XX',
  },
  currency: {
    code: 'EUR',
    symbol: 'EUR',
    multiplier: 100,                    // cents (vs 1000 millimes for TND)
  },
  pricing: {
    monthlyAmount: 4900,               // 49 EUR
    yearlyAmount: 49000,               // 490 EUR
    monthlyDisplay: '49 EUR',
    yearlyDisplay: '490 EUR',
  },
  legal: {
    entityName: 'FiloSoin SAS',
    jurisdiction: 'tribunaux compétents de Paris',
  },
}
```

### Backend — `apps/api/src/lib/brand.ts`

```typescript
france: {
  id: 'france',
  name: 'FiloSoin',
  legalEntity: 'FiloSoin SAS',
  domain: 'filosoin.fr',
  fromEmail: 'FiloSoin <noreply@filosoin.fr>',
  country: 'FR',
  timezone: 'Europe/Paris',            // Cron jobs use this
  defaultLanguage: 'fr',
  supportedLanguages: ['fr'],
  currency: {
    code: 'EUR',
    subunit: 'cents',
    multiplier: 100,
    symbol: 'EUR',
  },
  pricing: {
    monthly: 4900,
    yearly: 49000,
    freeTrialDays: 30,
  },
  payment: { provider: 'stripe' },     // Stripe (not Konnect)
}
```

Brand is resolved at startup:
- **Frontend:** `import.meta.env.VITE_BRAND` (set via Vite mode / `.env.france`)
- **Backend:** `process.env.BRAND` (set via `cross-env BRAND=france`)

---

## 3. BleSaf vs AuSuivant Comparison

| Aspect | BleSaf (Tunisia) | AuSuivant (France) |
|--------|-----------------|-------------------|
| **Brand name** | BleSaf | FiloSoin |
| **Dashboard name** | ReceptionistDashboard | AuSuivant |
| **Phone format** | +216 XX XXX XXX (8 digits) | +33 X XX XX XX XX (9 digits) |
| **Currency** | TND, millimes (x1000) | EUR, cents (x100) |
| **Monthly price** | 65 TND | 49 EUR |
| **Yearly price** | 650 TND | 490 EUR |
| **Payment gateway** | Konnect | Stripe |
| **Languages** | French + Arabic (RTL) | French only |
| **Timezone** | Africa/Tunis | Europe/Paris |
| **Doctor dashboard** | ReceptionistDashboard (all devices) | AuSuivantDashboard (mobile only, `lg:hidden`) |
| **Admin theme** | Emerald cards | Warm beige editorial |
| **Impersonation banner** | Red (#E70013) | French blue (#002395) |
| **Design system** | Material 3 inspired | Custom (DM Sans + Fraunces) |
| **RGPD name display** | Optional | Enabled by default |
| **Session toggle** | Binary doctor-present switch | "Consultations actives" / "Mettre en pause" |
| **Dev ports** | API: 3001, Web: 5174 | API: 3002, Web: 5175 |

---

## 4. Design System

The AuSuivant design system is scoped to the `.as-dashboard` CSS class and defined in `apps/web/src/components/ausuivant/ausuivant.css`.

### Typography

| Role | Font | Weight |
|------|------|--------|
| Body text, labels, UI | DM Sans | 400–700 |
| Hero numbers, headings, branding | Fraunces (serif) | 500–600 |

Usage in Tailwind: `font-dm` (DM Sans), `font-fraunces` (Fraunces).

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #F7F6F3 | Page background (warm off-white) |
| `--surface` | #FFFFFF | Cards, panels |
| `--surface-alt` | #F0EFEC | Secondary surfaces, muted backgrounds |
| `--border` | #E4E2DD | Card borders |
| `--border-light` | #ECEAE5 | Subtle dividers |
| `--text-primary` | #1A1A1A | Main text |
| `--text-secondary` | #6B6560 | Secondary text |
| `--text-tertiary` | #9C9690 | Muted text, labels |
| `--accent` | #1B6B4A | Primary action (teal green) |
| `--accent-light` | #E8F5EE | Accent backgrounds |
| `--accent-hover` | #15553B | Accent hover state |
| `--warning` | #C4841D | Amber — priority, notified status |
| `--warning-light` | #FFF8EC | Warning backgrounds |
| `--danger` | #C0392B | Red — remove, errors |
| `--danger-light` | #FDEEEC | Danger backgrounds |
| `--blue` | #2C5F8A | In-consultation status |
| `--blue-light` | #EDF3F8 | Consultation bar background |

### Layout

- **Max width:** 430px, centered (`margin: 0 auto`)
- **Min height:** 100dvh
- **Border radius:** 12px (default), 8px (small), 16px (large)

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` |
| `--shadow-lg` | `0 4px 20px rgba(0,0,0,0.08)` |

### Animations

| Name | Duration | Easing | Purpose |
|------|----------|--------|---------|
| `as-fadeUp` | 0.4s | `cubic-bezier(0.22, 1, 0.36, 1)` | Component entry stagger |
| `as-pulse-dot` | 2s / 1.5s | ease-in-out, infinite | Session/consultation status dots |
| `as-hint-fade` | 4s | ease-in-out, 2s delay | Swipe hint on first queue card |
| `as-hint-slide` | 1.5s | ease-in-out, infinite | Swipe hint arrow movement |
| `as-successPop` | 0.4s | spring | Success checkmark scale-in |

Stagger classes: `.as-fade-up-1` through `.as-fade-up-8` (50ms increments).

---

## 5. Screens & Components

### 5.1 Doctor Dashboard (Mobile)

**Visible:** Mobile screens only (`lg:hidden`). Desktop falls back to the standard BleSaf `ReceptionistDashboard`.

**Entry point:** `apps/web/src/pages/DashboardPage.tsx` conditionally renders based on `webBrand.id === 'france'`.

**Container:** `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx`

The dashboard is composed of the following sections, rendered top to bottom:

#### ASTopbar (`ASTopbar.tsx`)
Sticky header at the top of the dashboard.
- **Left:** "AuSuivant" in Fraunces font (teal accent color) + session status indicator
- **Session active:** Pulsing green dot + "En consultation" label
- **Right:** Settings gear icon button (opens ASSettingsPanel)

#### ASHeroMetrics (`ASHeroMetrics.tsx`)
Large at-a-glance metrics section.
- **Primary:** Giant waiting count (Fraunces 44px) + "patient(s) en attente" label
- **Stats row:**
  - Clock icon + "Attente moy." + value in minutes
  - "Fin estimee" + estimated end time in `~HHhMM` format (e.g., "~17h30")

#### ASSessionControls (`ASSessionControls.tsx`)
Two-button toggle replacing the binary doctor-present switch.
- **"Consultations actives"** — Green highlight with CheckCircle icon (active when doctor present)
- **"Mettre en pause"** — Green highlight with Pause icon (active when paused)
- Mutual exclusion: clicking one deactivates the other
- When paused, the "Call Next" button below is disabled

#### ASCallNextButton (`ASCallNextButton.tsx`)
Primary CTA — full-width card-style button.
- **Label:** "APPELER LE SUIVANT" (uppercase, small)
- **Patient info:** Next patient's name (RGPD format) + arrival time + "Avec rendez-vous" tag if applicable
- **Right:** Arrow-in-circle icon
- **Active state:** Teal green background with glass sheen gradient + subtle shadow
- **Disabled state:** Muted gray, no shadow, `cursor: not-allowed`
- Disabled when: no waiting patients, doctor paused, or call in progress

#### ASConsultationBar (`ASConsultationBar.tsx`)
Shown only when a patient is in consultation.
- Blue-tinted card (`--blue-light` background)
- Pulsing blue dot (1.5s cycle) + "En consultation : **PatientName**"
- Right side: duration in minutes (e.g., "12 min")
- Updates in real-time from `calledAt` timestamp

#### ASQueueSection (`ASQueueSection.tsx`)
The waiting queue list.
- **Section header:** "FILE D'ATTENTE" (uppercase, spaced) + RGPD toggle button (Eye/EyeOff icon)
- **RGPD toggle:** On by default — shows "Prenom N." format. Toggle to hide names entirely
- **Empty state:** "Aucun patient en attente" centered message
- **Queue cards:** List of `ASQueueCard` components with staggered entry animation (50ms between cards)
- Only one card can be swiped open at a time

#### ASQueueCard (`ASQueueCard.tsx`)
Individual patient card with swipe-to-reveal actions.

**Layout:**
- **Position badge** (36x36, rounded square) — number, amber background if NOTIFIED status
- **Details column:** Patient name (RGPD format, 15px bold) + status tags + "Arrivee HHhMM"
- **Tags:** "RDV" (green) or "SANS RDV" (gray) + "NOTIFIE" (amber) if applicable
- **Estimate column:** "~XX min" estimated wait or "Prochaine" for position 1

**Swipe interaction:**
- Touch-drag left to reveal hidden action buttons
- Threshold: 70px to snap open, reveals 140px action area
- Two actions behind: **Priorite** (amber, star icon) and **Retirer** (red, X icon)
- Spring easing on release: `cubic-bezier(0.22, 1, 0.36, 1)`
- First card shows animated "glisser" (swipe) hint with sliding arrow (auto-fades after 4s)

#### ASSummaryCard (`ASSummaryCard.tsx`)
"Bilan" (Daily Summary) — dark gradient card showing yesterday's statistics.
- **Section header:** "BILAN" (uppercase)
- **Card:** Dark gradient (#1A1A1A to #2D2B28) with decorative circle
- **Date label:** "Hier — [jour] [date] [mois]" (e.g., "Hier — lundi 16 fevrier")
- **Stats:** patients vus (Fraunces 28px) + attente moyenne + fin de journee
- **Improvement footer:** Percentage change vs. previous week (green pill)
- **Dismissible:** X button stores dismiss state in localStorage per clinic per day
- **Data source:** `api.getDailyRecap()` endpoint

#### ASFAB (`ASFAB.tsx`)
Floating Action Button — bottom-right corner.
- Fixed position: `bottom: 24px, right: 24px`
- Dark circle (56x56px) with white "+" icon
- Rotates to "x" (45deg) when add-patient sheet is open
- Shadow: `0 4px 16px rgba(0,0,0,0.2)`

#### ASAddPatientSheet (`ASAddPatientSheet.tsx`)
Bottom sheet modal for adding patients to the queue.

**Structure:**
- Slides up from bottom with spring easing
- Backdrop overlay (rgba 0.4 opacity)
- Drag handle bar at top
- Max height: 92dvh, scrollable

**Form fields:**
1. **Type toggle:** "Avec rendez-vous" (Calendar icon) / "Sans rendez-vous" (DoorOpen icon)
2. **Prenom** (first name) — required, placeholder "Marie"
3. **Nom** (last name) — optional, placeholder "Dupont"
4. **Telephone** — country code prefix (+33, non-editable) + 9-digit input with auto-formatting as "X XX XX XX XX"
5. **Heure du rendez-vous** — time input, shown only when type is "rdv" (animated expand/collapse)
6. **Notes** — optional textarea, placeholder "Ex : patient prioritaire, personne agee..."

**Success state:**
- Green checkmark with pop animation
- "Patient ajoute" heading
- "[Name] a ete ajoute(e) a la file" message
- Position badge: "Position #N dans la file"
- "Fermer" button

**Error handling:**
- "Le prenom est requis" (first name required)
- "Ce patient est deja dans la file d'attente" (duplicate detection)
- Generic fallback error

#### ASSettingsPanel (`ASSettingsPanel.tsx`)
Full-screen slide-over panel from the right.

**Header:** Back chevron + "Parametres" title

**Clinic profile card:** Avatar initials circle (accent bg) + doctor name + "Medecin generaliste" + plan badge ("Essai gratuit")

**Settings sections:**

| Section | Items |
|---------|-------|
| **MON CABINET** | Profil du cabinet (name, address, hours) · Equipe & acces (team members) · Affichage salle d'attente (TV screen) |
| **FILE D'ATTENTE** | Duree moy. consultation (editable minutes) · Notifications patients (toggle) · Affichage des noms / RGPD (display mode) · QR code d'enregistrement (toggle) |
| **BILAN & RAPPORTS** | Bilan de fin de journee (toggle) · Rapport hebdomadaire email (toggle) |
| **COMPTE** | Abonnement (subscription management) · Aide & support (FAQ, contact) · Confidentialite & RGPD (data policy) |

Each item has: colored icon box (36x36) + title + description + right action (toggle switch, value+chevron, or status chip).

**Footer:** Red-outlined "Se deconnecter" button + "AuSuivant v1.0.0 · (c) 2026"

---

### 5.2 Patient Status Page

**File:** `apps/web/src/pages/PatientStatusPage.tsx`

The patient-facing queue tracking page is a unified component used by both brands. It uses an AuSuivant-influenced design language (Fraunces fonts, warm color transitions, mood-shifting backgrounds). French only.

**Route:** `/patient/:entryId`

**Components** (in `apps/web/src/components/patient-status/`):

| Component | Purpose |
|-----------|---------|
| `PSHeader` | Clinic name + doctor + green pulsing connection dot |
| `PSAlertBanner` | Doctor absence alert with specific return time |
| `PSRdvContext` | Appointment context (for RDV patients): "Votre RDV etait a 16h30" |
| `PSHeroEstimate` | Giant hero estimated wait time (Fraunces 56-72px) |
| `PSCalledHero` | Breathing green circle + "Vous pouvez entrer" |
| `PSDoneHero` | Checkmark + "Merci pour votre visite" + clinic name |
| `PSContextCard` | Shape-shifting advice card (3 visual variants) |
| `PSVisitSummary` | Post-visit stats: wait time + consultation time + "Reprendre RDV" CTA |
| `PSManageFooter` | "Gerer ma place" button (opens quit modal) |
| `PSBrandFooter` | Branding footer |
| `PSProgressToast` | Floating toast: "Vous avancez — encore N personnes" |
| `PSQuitModal` | Bottom sheet: "Annuler votre place?" with two-tap protection |
| `PSProgressRing` | Visual progress indicator |
| `PSNotifPrompt` | Browser notification permission prompt |
| `PSAbsentButton` | Mark self absent button |

#### Patient Queue Phases (8 States)

The page mood and content shift as the patient progresses through the queue:

| Phase | Position | People Ahead | Background | Eyebrow Text | Context Card |
|-------|----------|--------------|------------|-------------|--------------|
| **Far** | 7+ | 6+ | Neutral (#F8F7F4) | "Attente estimee" | "leave" — you have time to step out |
| **Mid-1** | 6 | 5 | Neutral | "Attente estimee" | "leave" |
| **Mid-2** | 5 | 4 | Neutral | "Attente estimee" | "leave" |
| **Mid-3** | 4 | 3 | Subtle warm (#F7F5F0) | "Attente estimee" | transitions to "stay" |
| **Soon** | 3 | 2 | Warm amber (#FBF8F1) | **"Bientot votre tour"** | "stay" — stay nearby, prepare documents |
| **Next** | 2 | 1 | Warm sand (#F5F0E8) | **"Vous etes le prochain"** | "ready" — you'll be called shortly |
| **Called** | 0 | 0 | Cool green (#EFF8F3) | — | Hidden |
| **Done** | — | — | Neutral | — | Hidden |

**Context card variants:**
- **leave** (white, exit icon): "Vous avez le temps de sortir. Notification 15 min avant votre tour."
- **stay** (amber, map-pin icon): "Restez a proximite. Preparez votre carte vitale et documents."
- **ready** (green, check icon): "Preparez-vous. Vous serez appele dans quelques minutes."

**Called state:** Breathing green circle animation + "Vous pouvez entrer" (calm instruction)

**Done state:** Checkmark circle + "Merci pour votre visite" + visit summary card (wait time, consultation time, "Reprendre RDV" CTA)

**Real-time behavior:**
- WebSocket-driven position, wait estimate, and doctor absence updates
- Estimates never jump up more than 5 minutes in one update (smoothing algorithm)
- Toast notification on every position advance
- Background color transitions use `0.8s cubic-bezier(0.22, 1, 0.36, 1)` easing
- Audio chimes and vibration at key transitions (called, position change)

---

### 5.3 Admin Dashboard

**Entry point:** `apps/web/src/pages/admin/AdminDashboard.tsx` — switches layout based on `webBrand.id === 'france'`.

**AuSuivant admin components** in `apps/web/src/pages/admin/ausuivant/`:

#### AusuivantAdminDashboard (`AusuivantAdminDashboard.tsx`)
Warm beige editorial theme (background: #f4f1ec).
- **Title:** "Vue d'ensemble" (Playfair font, dark navy #1a1a2e)
- **Max width:** 1200px centered
- **KPI cards row** (2-col mobile, 4-col desktop):
  1. Cabinets Actifs (active clinics)
  2. MRR (monthly recurring revenue, formatted in EUR)
  3. Patients / Sem (weekly patients)
  4. Conversion (trial-to-paid %)
- **Dual panel layout** (50/50 on desktop):
  - `ClinicPerformancePanel` — ranked clinic list with performance metrics
  - `ActivityFeedPanel` — timeline of recent platform events

#### KpiCard (`components/KpiCard.tsx`)
Small metric display card with staggered fade-in animation.
- Label (uppercase, gray) + Value (Playfair 1.7rem) + Delta indicator (trending arrow, green/red)

#### AusuivantDarkTopBar (`components/AusuivantDarkTopBar.tsx`)
Reusable dark-themed navigation bar for all admin pages.

#### Brand-Specific Admin Pages

| Page | BleSaf Component | AuSuivant Component |
|------|-----------------|-------------------|
| Admin Overview | `BlesafAdminDashboard` | `AusuivantAdminDashboard` |
| Clinics Directory | `BlesafClinicsDirectory` | `AusuivantClinicsDirectory` |
| Clinic Detail | `BlesafClinicDetail` | `AusuivantClinicDetail` |

All are lazy-loaded and conditionally rendered via `const isFrance = webBrand.id === 'france'`.

---

### 5.4 Shared Pages

These pages are brand-aware but share the same component across both brands:

| Route | Page | Brand Differences |
|-------|------|-------------------|
| `/` | LandingPage | Brand name, pricing, phone format in examples |
| `/signup` | SignupPage | Phone validation uses brand.phone config |
| `/login` | LoginPage | Brand logo/name |
| `/verify-email` | VerifyEmailPage | Brand name in messaging |
| `/forgot-password` | ForgotPasswordPage | None significant |
| `/reset-password` | ResetPasswordPage | None significant |
| `/checkin/:clinicId` | CheckInPage | Phone input format |
| `/terms` | TermsPage | Legal entity, jurisdiction |
| `/privacy` | PrivacyPage | Legal entity, jurisdiction |
| `/dashboard` | DashboardPage | Conditional mobile dashboard |
| `/onboarding` | OnboardingPage | Pricing in local currency |
| `/subscription` | SubscriptionPage | Payment gateway, currency |
| `/settings` | SettingsPage | Brand-specific defaults |
| `/admin` | AdminDashboard | Full brand-specific theme |
| `/admin/clinics` | ClinicsDirectoryPage | Brand-specific layout |
| `/admin/clinics/:id` | ClinicDetailPage | Brand-specific layout |

---

## 6. Payment Integration

AuSuivant uses **Stripe** instead of Konnect (which is Tunisian-only).

| Aspect | BleSaf | AuSuivant |
|--------|--------|-----------|
| Provider | Konnect | Stripe |
| Config | `apps/api/src/lib/payment/konnect.ts` | `apps/api/src/lib/payment/stripe.ts` |
| Amount format | Millimes (65000 = 65 TND) | Cents (4900 = 49 EUR) |
| Checkout | Konnect redirect | Stripe Checkout session |
| Webhook | `POST /api/subscription/webhooks/konnect` | `POST /api/subscription/webhooks/stripe` |

Payment provider is resolved from `brand.payment.provider` at runtime. Stripe is dynamically imported to avoid loading in Tunisia builds.

### Pricing

| Plan | Price |
|------|-------|
| Monthly | 49 EUR/mois |
| Yearly | 490 EUR/an (2 months free) |
| Free Trial | 30 days |

---

## 7. RGPD Compliance

AuSuivant has RGPD (GDPR) compliance built into its design:

- **Name display format:** "Prenom N." (first name + last initial) — e.g., "Marie D."
  - Implemented in `formatDisplayName()` in `apps/web/src/components/ausuivant/utils.ts`
- **RGPD toggle:** Eye/EyeOff button in queue section header. Enabled by default for France
- **Settings panel:** Dedicated "Confidentialite & RGPD" section under COMPTE
- **Name display modes** (in settings): Full name / First name + initial / Initials only / Hidden
- **Patient status page:** No full names exposed in the public-facing patient tracking URL

---

## 8. Real-Time (Socket.io)

Same Socket.io infrastructure as BleSaf. WebSocket rooms:

| Room | Purpose |
|------|---------|
| `clinic:{clinicId}` | Dashboard real-time queue updates |
| `patient:{entryId}` | Patient status page updates |

**Dashboard updates:**
- Queue entries added/removed/reordered
- Patient status changes (WAITING -> NOTIFIED -> IN_CONSULTATION -> COMPLETED/NO_SHOW/CANCELLED)
- Doctor presence changes
- Stats recalculation

**Patient status updates:**
- Position changes trigger phase derivation (Far -> Mid -> Soon -> Next -> Called -> Done)
- Wait estimate with smoothing (never jumps up more than 5 min per update)
- Doctor absence notification
- Progress toast on each position advance
- Audio chimes + vibration at key transitions

---

## 9. Build & Vite Configuration

**`apps/web/vite.config.ts`** includes a `brandHtmlPlugin()` that transforms the HTML at build time:

```typescript
const brandConfig = {
  blesaf: {
    title: 'BleSaf - Gestion de File d\'Attente',
    analyticsDomain: 'blesaf.tn',
  },
  france: {
    title: 'FiloSoin - Gestion de File d\'Attente',
    analyticsDomain: 'filosoin.fr',
  },
};
```

- Replaces `<title>` tag based on brand
- Swaps Plausible analytics domain

**Mode detection:** `vite --mode france` loads `.env.france` which sets `VITE_BRAND=france`.

**API timezone:** Backend cron jobs (midnight queue reset, 9 AM trial expiration checks) use `Europe/Paris` for the France brand vs `Africa/Tunis` for BleSaf.

---

## 10. File Reference

### Core Brand Configuration
| File | Purpose |
|------|---------|
| `apps/web/src/lib/brand.ts` | Frontend brand config (resolved from VITE_BRAND) |
| `apps/api/src/lib/brand.ts` | Backend brand config (resolved from BRAND env) |
| `apps/web/.env.france` | France env vars for Vite |
| `apps/web/.env.blesaf` | Tunisia env vars for Vite |

### AuSuivant Doctor Dashboard
| File | Component |
|------|-----------|
| `apps/web/src/components/ausuivant/AuSuivantDashboard.tsx` | Main container |
| `apps/web/src/components/ausuivant/ausuivant.css` | Design tokens & animations |
| `apps/web/src/components/ausuivant/ASTopbar.tsx` | Sticky header with branding |
| `apps/web/src/components/ausuivant/ASHeroMetrics.tsx` | Waiting count + stats |
| `apps/web/src/components/ausuivant/ASSessionControls.tsx` | Active/Pause toggle |
| `apps/web/src/components/ausuivant/ASCallNextButton.tsx` | Call next patient CTA |
| `apps/web/src/components/ausuivant/ASConsultationBar.tsx` | Current consultation indicator |
| `apps/web/src/components/ausuivant/ASQueueSection.tsx` | Queue list with RGPD toggle |
| `apps/web/src/components/ausuivant/ASQueueCard.tsx` | Swipeable patient card |
| `apps/web/src/components/ausuivant/ASSummaryCard.tsx` | Yesterday's stats (Bilan) |
| `apps/web/src/components/ausuivant/ASFAB.tsx` | Floating action button |
| `apps/web/src/components/ausuivant/ASAddPatientSheet.tsx` | Add patient bottom sheet |
| `apps/web/src/components/ausuivant/ASSettingsPanel.tsx` | Full settings panel |
| `apps/web/src/components/ausuivant/utils.ts` | formatDisplayName, formatArrivalTime, etc. |

### Patient Status Page
| File | Component |
|------|-----------|
| `apps/web/src/pages/PatientStatusPage.tsx` | Main page (unified, both brands) |
| `apps/web/src/components/patient-status/patient-status.css` | Patient status design tokens |
| `apps/web/src/components/patient-status/utils.ts` | derivePhase, smoothEstimate, etc. |
| `apps/web/src/components/patient-status/PSHeader.tsx` | Clinic header with live dot |
| `apps/web/src/components/patient-status/PSAlertBanner.tsx` | Doctor absence alert |
| `apps/web/src/components/patient-status/PSRdvContext.tsx` | Appointment context card |
| `apps/web/src/components/patient-status/PSHeroEstimate.tsx` | Giant wait time display |
| `apps/web/src/components/patient-status/PSCalledHero.tsx` | "You can enter" state |
| `apps/web/src/components/patient-status/PSDoneHero.tsx` | "Thank you" completion state |
| `apps/web/src/components/patient-status/PSContextCard.tsx` | leave/stay/ready advice card |
| `apps/web/src/components/patient-status/PSVisitSummary.tsx` | Post-visit statistics |
| `apps/web/src/components/patient-status/PSManageFooter.tsx` | Queue management footer |
| `apps/web/src/components/patient-status/PSBrandFooter.tsx` | Brand footer |
| `apps/web/src/components/patient-status/PSProgressToast.tsx` | Position advance toast |
| `apps/web/src/components/patient-status/PSQuitModal.tsx` | Cancel place confirmation |
| `apps/web/src/components/patient-status/PSProgressRing.tsx` | Visual progress ring |
| `apps/web/src/components/patient-status/PSNotifPrompt.tsx` | Notification permission |
| `apps/web/src/components/patient-status/PSAbsentButton.tsx` | Self-absent button |

### Admin Dashboard
| File | Component |
|------|-----------|
| `apps/web/src/pages/admin/AdminDashboard.tsx` | Admin entry (brand switch) |
| `apps/web/src/pages/admin/ausuivant/AusuivantAdminDashboard.tsx` | France overview |
| `apps/web/src/pages/admin/ausuivant/components/KpiCard.tsx` | KPI metric card |
| `apps/web/src/pages/admin/ausuivant/components/AusuivantDarkTopBar.tsx` | Dark nav bar |
| `apps/web/src/pages/admin/ausuivant/components/ClinicPerformancePanel.tsx` | Clinic rankings |
| `apps/web/src/pages/admin/ausuivant/components/ActivityFeedPanel.tsx` | Event timeline |

### Design Specifications
| File | Content |
|------|---------|
| `docs/ausuivant-dashboard-spec.md` | Full dashboard spec (701 lines) |
| `docs/ausuivant-patient-status-spec.md` | Full patient status spec (911 lines) |

### Payment
| File | Purpose |
|------|---------|
| `apps/api/src/lib/payment/stripe.ts` | Stripe integration (France) |
| `apps/api/src/lib/payment/konnect.ts` | Konnect integration (Tunisia) |
