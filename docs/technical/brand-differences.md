# BléSaf vs FiloSoin — Brand Differences Tracker

> **Last updated:** 2026-02-21
> Keep this file in sync as features diverge or converge between the two instances.

## Architecture

Single-codebase, multi-brand SaaS. Brand selected at build/runtime:

| Layer | Tunisia | France |
|-------|---------|--------|
| **API env** | `BRAND=blesaf` | `BRAND=france` |
| **Web mode** | `--mode blesaf` | `--mode france` |
| **Dev ports** | API 3001, Web 5174 | API 3002, Web 5175 |
| **Dev command** | `pnpm dev:tn` | `pnpm dev:fr` |

Config files: `apps/api/src/lib/brand.ts`, `apps/web/src/lib/brand.ts`

---

## Branding & Legal

| | BléSaf (Tunisia) | FiloSoin (France) |
|---|---|---|
| Domain | blesaf.tn | filosoin.fr |
| Legal entity | Blesaf SARL | FiloSoin SAS |
| Jurisdiction | Tunis | Paris |
| Support email | support@blesaf.tn | support@filosoin.fr |

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
| Components folder | `components/blesaf/` (29 components) | `components/ausuivant/` (13 components) |
| Design language | Material 3, emerald/teal (#0D9488) | Editorial, warm beige (#F7F6F3), teal green (#1B6B4A) |
| Typography | System fonts | DM Sans + Fraunces serif |
| Screen support | All sizes | Mobile only (`lg:hidden`); desktop falls back to BléSaf layout |
| Session control | Binary "doctor present" toggle | Dual-button Active / Pause |

### Admin Dashboard

| | BléSaf | AuSuivant |
|---|---|---|
| Theme | Emerald cards | Warm beige editorial |
| Typography | System | Playfair Display + DM Sans |
| Impersonation banner | Red (#E70013) | French Blue (#002395) |

### Landing Pages

Separate routes in `App.tsx`: `LandingPage` for Tunisia, `LandingPageFr` for France.

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

Implementation: `components/ausuivant/utils.ts` → `formatDisplayName()`

---

## Maturity Status (as of 2026-02-21)

| Area | Tunisia | France | Notes |
|------|---------|--------|-------|
| Receptionist dashboard | Mature (29 components) | Partial (13 components, mobile only) | Desktop inherits BléSaf layout |
| Arabic RTL | Complete | N/A | |
| Payment integration | Konnect live | Stripe exists, needs prod testing | |
| Marketing materials | Developed (`docs/marketing/tunisia/`) | Sparse (`docs/marketing/france/`) | |
| Landing page | Full 10-section page | Exists, less tested | |
| Settings panels | Wired up (BléSaf sub-panels) | Exists (`ASSettingsPanel`) | |
| Admin pages | Full suite | Exists (dashboard, clinics, detail) | |

---

## Changelog

| Date | Change | Brand |
|------|--------|-------|
| 2026-02-21 | Initial tracking document created | Both |
