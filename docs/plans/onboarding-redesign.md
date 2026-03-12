# Onboarding Flow Redesign — BleSaf

**Created:** 2026-03-11
**Status:** Planned (not yet implemented)

## Context

The current onboarding flow (SignupPage → SetupPage → WelcomePage) has several UX issues: a deceptive 5.2s fake loading animation, a confusing "test patient" step, 3 separate pages for what's essentially signup + QR download, and no personalization. Research shows SaaS onboarding should achieve Time-to-Value < 5 minutes, favor learn-by-doing over passive tours, and avoid fake loading screens.

## Critique of Current Flow

| Issue | Impact |
|-------|--------|
| 5.2s fake animated checklist ("Creating clinic... Configuring queue...") | Feels deceptive — nothing actually takes time |
| "Add test patient" step | Confusing — users don't understand why they're adding a fake patient |
| 3 separate pages with routing guards | Over-engineered for signup + QR download |
| No personalization (specialty, doctor name) | Missed data collection opportunity |
| Desktop wastes space (narrow cards on wide screens) | Poor use of screen real estate |
| "First morning playbook" competes with QR download on same page | Diluted focus |
| No skip option | Experienced users feel trapped |

## Three Alternative Approaches

### A: "Single-Page Accordion" (Minimal Friction)
Collapse everything into one page with 3 collapsible sections (signup form → QR code → optional personalization). Each section expands as the previous completes. ~60 seconds total. **Effort: S.** Pros: fastest, simplest. Cons: feels like a form, not an experience; no "learn by doing" moment.

### B: "Dashboard-First" (Learn by Doing)
Signup form → land directly on the real dashboard with contextual overlay prompts (download QR → toggle doctor presence → add first patient). No separate onboarding pages. **Effort: M.** Pros: research-backed highest activation rates; user sees real product immediately. Cons: dashboard can overwhelm new users; overlay prompts compete with existing UI.

### C: "Two-Step Slide" (Polished Middle Ground) — RECOMMENDED
Two-step flow on a single page with horizontal slide animation. Step 1: signup form + optional specialty/doctor name. Step 2: QR code + actions + compact quick-start tips. Then dashboard with enhanced ActivationChecklist for continued guidance. **Effort: S-M.** Pros: polished feel, honest (no fake loading), fast (~60s to QR), captures useful data optionally. Cons: slightly more complex than A.

## Recommendation: Approach C

Approach C is recommended because:
- It preserves a guided feel (important for non-tech-savvy Tunisian clinic staff) while eliminating deceptive elements
- The slide animation provides delight without deception
- Two steps is psychologically simpler than three
- The enhanced ActivationChecklist on the dashboard captures Approach B's "learn by doing" benefit as post-onboarding guidance
- No new libraries needed — Tailwind handles the slide animation

## Implementation Plan

### Step 1: Rewrite SignupPage.tsx (core work)
**File:** `apps/web/src/pages/SignupPage.tsx` (~350 lines, replaces existing 280)

- Internal `step` state: `1 | 2`
- **Step 1:** Email + password + clinic name (existing) + expandable optional section (specialty dropdown, doctor name)
- **Step 2:** QR code display (generated instantly on transition) + Download PDF / Share WhatsApp / Copy Link buttons + 3-line quick-start tips + "Open Dashboard" CTA
- Slide animation: wrapper with `transform: translateX()` + `transition: transform 300ms ease-in-out`, both steps rendered side-by-side in `overflow: hidden` container
- On Step 1 submit: call `api.signup()`, store JWT, generate QR, slide to step 2
- On "Open Dashboard": call `api.updateOnboarding(2, true)`, navigate to `/dashboard`
- Respect `prefers-reduced-motion` for the slide animation

**Reuse:** `PasswordStrengthBar`, `QRCodeDisplay`, `downloadQrCodePdf` utility, `onboardingStore`

### Step 2: Update routing in App.tsx
**File:** `apps/web/src/App.tsx`

- Remove `/signup/setup` and `/welcome` routes
- Add redirects from old URLs to `/signup` (for bookmarks)
- Simplify `needsOnboarding` logic: if authenticated + not complete → redirect to `/signup` (which shows step 2)
- If authenticated + onboarding complete → `/signup` redirects to `/dashboard`

### Step 3: Simplify onboardingStore.ts
**File:** `apps/web/src/stores/onboardingStore.ts`

- Remove: `setupPhase`, `setSetupPhase`, `testPatientId`, `setTestPatientId`
- Keep: `clinicId`, `clinicName`, `qrCodeDataUrl`, `qrCodeUrl`, `setClinicInfo`, `setQrCode`, `reset`

### Step 4: Simplify ProgressBar.tsx
**File:** `apps/web/src/components/onboarding/ProgressBar.tsx`

- Change from 3 steps to 2 steps (or replace with simple "Step 1 of 2" text)

### Step 5: Enhance ActivationChecklist.tsx
**File:** `apps/web/src/components/onboarding/ActivationChecklist.tsx`

- Add "Toggle doctor presence" prompt between QR download and "waiting for first patient"
- Check `authClinic?.isDoctorPresent` to determine completion
- This continues the onboarding journey contextually on the real dashboard

### Step 6: Add/update translations
**Files:** `apps/web/src/i18n/locales/fr.json`, `apps/web/src/i18n/locales/ar.json`

- New keys: step indicator, specialty label, doctor name label, QR tips, open dashboard CTA
- Remove obsolete keys: `onboarding.setup.*` (fake checklist steps), `onboarding.playbook*`

### Step 7: Delete obsolete pages
- Delete `apps/web/src/pages/SetupPage.tsx`
- Delete `apps/web/src/pages/WelcomePage.tsx`

### Step 8 (optional): Add specialty to backend signup schema
**Files:** `apps/api/src/routes/signup.ts`, `apps/api/src/services/signupService.ts`

- Add `specialty: z.string().optional()` to signup Zod schema
- Pass to `prisma.clinic.create()` — one field addition

### Libraries Needed
**None.** All existing deps cover it: `qrcode`, `qrcode.react`, Tailwind CSS (slide animation), `react-i18next`, `downloadQrCodePdf` utility.

## Verification

1. **Manual test:** Sign up with new account → verify slide to step 2 → download QR PDF → click "Open Dashboard" → verify dashboard loads with ActivationChecklist
2. **Mobile test:** Chrome DevTools mobile viewport — verify slide animation, tap targets, form usability
3. **RTL test:** Switch to Arabic — verify layout mirrors correctly
4. **Old URL test:** Navigate to `/signup/setup` and `/welcome` — verify redirects
5. **Refresh test:** Refresh on step 2 — verify user resumes correctly (authenticated → shows step 2)
6. **Accessibility:** Verify `prefers-reduced-motion` disables slide animation; verify tab order through both steps
7. **E2E:** Update `apps/web/e2e/signup.spec.ts` for new flow

## Research Sources

- SaaS onboarding best practices 2025-2026 (Userpilot, Cieden, ProductFruits)
- Figma, Notion, Linear onboarding case studies
- Healthcare provider onboarding patterns (Whatfix, ABig Health)
- Mobile-first onboarding (DesignStudioUIUX, VWO, Appcues)
- React tour libraries comparison (OnboardJS, Whatfix)
