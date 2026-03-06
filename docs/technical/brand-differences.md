# BléSaf vs AuSuivant — Brand Differences Tracker

> **Last updated:** 2026-03-06
> Keep this file in sync as features diverge or converge between the two instances.

## Architecture

Single-codebase, multi-brand SaaS. Brand selected at build/runtime:

| Layer | Tunisia | France |
|-------|---------|--------|
| **API env** | `BRAND=blesaf` | `BRAND=france` |
| **Web mode** | `--mode blesaf` | `--mode france` |
| **Dev ports** | API 3001, Web 5174 | API 3002, Web 5175 |
| **Dev command** | `pnpm dev:tn` | `pnpm dev:fr` |
| **Deploy branch** | `deploy/blesaf` | `deploy/ausuivant` |
| **Deploy script** | `pnpm deploy:blesaf` | `pnpm deploy:ausuivant` |

Config files: `apps/api/src/lib/brand.ts`, `apps/web/src/lib/brand.ts`

### Brand Theme System

Frontend brand config includes a `theme` object with visual tokens. Components read from `webBrand.theme.*` instead of checking `webBrand.id`:

- `theme.colors.primary` — teal #0D9488 (Tunisia) vs green #1B6B4A (France)
- `theme.colors.surface` — warm #F5F0E8 vs beige #F7F6F3
- `theme.colors.impersonation` — red #E70013 vs blue #002395
- `theme.logo.parts` — brand-specific logo text + font pairs
- `theme.dashboard.variant` — `'receptionist'` (Tunisia) vs `'compact'` (France)
- `theme.teaserTagline` — country-specific tagline

### CI/CD

CI validates **both brands** via matrix strategy in `.github/workflows/ci.yml`. Web type-check, build, and tests run once per brand. API checks run once (brand-agnostic).

---

## Component Organization

| Directory | Purpose | Used by |
|-----------|---------|---------|
| `components/shared/` | Settings panels, CSS, utilities, add-patient sheet | Both brands |
| `components/receptionist/` | BleSaf mobile dashboard (25 files) | BleSaf only |
| `components/ausuivant/` | AuSuivant mobile dashboard (13 files) | AuSuivant only |
| `components/dashboard/` | Desktop dashboard | Both brands |
| `components/landing/` | BleSaf landing page sections | BleSaf only |
| `components/landing-fr/` | AuSuivant landing page sections | AuSuivant only |

---

## Branding & Legal

| | BléSaf (Tunisia) | AuSuivant (France) |
|---|---|---|
| Domain | blesaf.tn | ausuivant.fr |
| Legal entity | Blesaf SARL | AuSuivant SAS |
| Jurisdiction | Tunis | Paris |
| Support email | support@blesaf.tn | support@ausuivant.fr |

---

## Currency & Pricing

| | Tunisia | France |
|---|---|---|
| Currency | TND (millimes, 1:1000) | EUR (cents, 1:100) |
| Monthly | 65 TND | 49 EUR |
| Yearly | 650 TND | 490 EUR |
| Free trial | 30 days | 30 days |

---

## Payment Gateway

| | Tunisia | France |
|---|---|---|
| Provider | Konnect | Stripe |
| Implementation | `apps/api/src/lib/payment/konnect.ts` | `apps/api/src/lib/payment/stripe.ts` |
| Webhook path | `/api/subscription/webhooks/konnect` | `/api/subscription/webhooks/stripe` |
| Stripe dynamically imported to avoid bloating Tunisia build. |

---

## Localization

| | Tunisia | France |
|---|---|---|
| Default language | French | French |
| Supported languages | French + Arabic (RTL) | French only |
| Language switcher | Yes (fr ↔ ar) | No |
| Timezone | Africa/Tunis | Europe/Paris |
| Phone format | +216 (8 digits) | +33 (9 digits) |

---

## UI / Design System

### Receptionist Dashboard

| | BléSaf | AuSuivant |
|---|---|---|
| Components folder | `components/receptionist/` (25 files) | `components/ausuivant/` (13 files) |
| Shared components | `components/shared/` (settings panels, CSS, sheets, utils) | Same |
| Design language | Material 3, emerald/teal (#0D9488) | Editorial, warm beige (#F7F6F3), teal green (#1B6B4A) |
| Typography | System fonts | DM Sans + Fraunces serif |
| Screen support | All sizes | Mobile only (`lg:hidden`); desktop falls back to shared layout |
| Session control | Binary "doctor present" toggle | Dual-button Active / Pause |
| Theme variant | `receptionist` | `compact` |

### Admin Dashboard

| | BléSaf | AuSuivant |
|---|---|---|
| Theme | Emerald cards | Warm beige editorial |
| Typography | System | Playfair Display + DM Sans |
| Impersonation banner | `theme.colors.impersonation` (Red #E70013) | `theme.colors.impersonation` (French Blue #002395) |

### Landing Pages

Separate routes in `App.tsx`: `LandingPage` for Tunisia, `LandingPageFr` for France.
Routing uses `webBrand.theme.dashboard.variant` (not brand ID check).

### Patient Status Page

Shared component (`PatientStatusPage.tsx`) used by both brands. Uses AuSuivant-influenced design (Fraunces fonts, mood-shifting backgrounds, 8 queue phases).

---

## RGPD / Privacy

| | Tunisia | France |
|---|---|---|
| Name display | Full name | "Prénom N." (first + last initial) |
| RGPD toggle | Not present | Enabled by default |
| Display modes | N/A | Full / First+Initial / Initials / Hidden |
| Settings section | N/A | Dedicated "Confidentialité & RGPD" |

Implementation: `components/ausuivant/utils.ts` -> `formatDisplayName()`

---

## Maturity Status (as of 2026-03-06)

| Area | Tunisia | France | Notes |
|------|---------|--------|-------|
| Receptionist dashboard | Mature (25 components) | Partial (13 components, mobile only) | Desktop inherits shared layout |
| Arabic RTL | Complete | N/A | |
| Payment integration | Konnect live | Stripe exists, needs prod testing | |
| Marketing materials | Developed (`docs/marketing/tunisia/`) | Sparse (`docs/marketing/france/`) | |
| Landing page | Full 10-section page | Exists, less tested | |
| Settings panels | Wired up (shared panels in `components/shared/`) | Exists (`ASSettingsPanel` reuses shared panels) | |
| Admin pages | Full suite | Exists (dashboard, clinics, detail) | |
| CI validation | Both brands validated | Both brands validated | Matrix strategy |
| Deploy independence | `deploy/blesaf` branch | `deploy/ausuivant` branch | Independent rollouts |

---

## Changelog

| Date | Change | Brand |
|------|--------|-------|
| 2026-03-06 | Brand theme system, CI matrix, independent deploy branches, rename blesaf/ to shared/ | Both |
| 2026-02-21 | Initial tracking document created | Both |
