# BleSaf — Onboarding Flow Implementation Spec

**For:** Claude Code  
**Market:** Tunisia (BleSaf brand — green palette)  
**Trigger:** CTA "Essai gratuit 30 jours" on landing page  
**Goal:** Get the doctor to their Aha Moment in under 90 seconds

---

## Overview

3-step onboarding flow. No data collection beyond what is strictly necessary to create the account and generate the QR code.

```
Landing Page CTA
      ↓
[Step 1] Create Account     (~30s)  — email + password + clinic name
      ↓
[Step 2] Setup Animation    (~2s)   — auto-advance, no user input required
      ↓
[Step 3] QR Code + Aha Moment       — QR generated + simulated patient check-in
      ↓
Dashboard (with activation checklist)
```

---

## Routes

| Route | Component | Auth required |
|---|---|---|
| `/signup` | `SignupPage` | No |
| `/signup/setup` | `SetupPage` | Temp session token |
| `/welcome` | `WelcomePage` | Yes (just created) |
| `/dashboard` | existing | Yes |

After account creation in Step 1, store a short-lived session token (or use the regular JWT) and redirect to `/signup/setup`. If the user navigates directly to `/signup/setup` or `/welcome` without a valid session, redirect to `/signup`.

If a logged-in user hits `/signup` or `/signup/setup`, redirect to `/dashboard`.

---

## Global UI — Progress Bar

A fixed progress bar sits at the very top of the viewport across all 3 steps. It does **not** scroll away.

```
┌─────────────────────────────────────────────────────┐
│  ●━━━━━━━━━━━━━○ · · · · · · · · ○                 │  ← Step 1 active
│  ●━━━━━━━━━━━━━●━━━━━━━━━━━━━○ · · ○               │  ← Step 2 active
│  ●━━━━━━━━━━━━━●━━━━━━━━━━━━━●━━━━━●               │  ← Step 3 complete
└─────────────────────────────────────────────────────┘
```

**Specs:**
- Height: `4px`
- Filled color: `#1B7A4A` (BleSaf green)
- Unfilled color: `#D0DDD6`
- Step dots: `12px` circles, filled green when complete, outlined when pending
- No step labels — keep it visually clean
- Animate the fill transition with `transition: width 600ms ease-in-out`

---

## Step 1 — Créez Votre Compte

**Route:** `/signup`  
**Time to complete:** ~30 seconds  
**Fields:** 3 (email, password, clinic name)

### Layout

Centered single-column card on a light grey background (`#F4F7F5`).

```
┌──────────────────────────────────────────┐
│                                          │
│         BleSaf  (logo / wordmark)        │
│                                          │
│   Votre cabinet numérique               │
│   est à 2 minutes.                      │  ← H1, bold, dark
│                                          │
│   Aucune carte bancaire requise.        │  ← subtitle, grey
│                                          │
│   ┌──────────────────────────────────┐  │
│   │  Email professionnel             │  │
│   │  [  dr.nom@gmail.com           ] │  │
│   └──────────────────────────────────┘  │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │  Mot de passe                    │  │
│   │  [  ••••••••     👁  ] [bar]    │  │  ← strength bar below
│   └──────────────────────────────────┘  │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │  Nom de votre cabinet            │  │
│   │  [  Clinique Dr. Ben Salem     ] │  │
│   └──────────────────────────────────┘  │
│   ℹ Ce nom apparaîtra sur votre QR code │  ← helper text, small, grey
│                                          │
│   ┌──────────────────────────────────┐  │
│   │     Créer mon compte →           │  │  ← primary CTA, green fill
│   └──────────────────────────────────┘  │
│                                          │
│      Déjà inscrit ? Se connecter        │  ← link, centered
│                                          │
└──────────────────────────────────────────┘
```

### Field Specifications

#### Email
- `type="email"`
- Placeholder: `dr.prenom.nom@gmail.com`
- Validate on blur (not on every keystroke)
- Error states:
  - Empty on submit: `"Veuillez entrer votre email."`
  - Invalid format: `"Format d'email invalide."`
  - Already used (API response): `"Cet email est déjà utilisé. Se connecter ?"`  — the last two words are a clickable link to `/login`

#### Password
- `type="password"` with a toggle eye icon (`👁`) to show/hide
- Min 8 characters — **no other rules** (no special char requirements, no uppercase rules — these hurt conversion)
- Password strength indicator: a thin `4px` bar below the field
  - 1–7 chars or obvious patterns: red (`#D94040`) — label: `"Trop court"`
  - 8–10 chars, no variety: orange (`#E07B00`) — label: `"Moyen"`
  - 11+ chars or good entropy: green (`#1B7A4A`) — label: `"Fort"`
  - Animate bar width with `transition: width 300ms ease`
- Error on submit if empty: `"Veuillez choisir un mot de passe."`

#### Nom de la clinique
- `type="text"`, `maxlength="80"`
- Placeholder: `Clinique Dr. [Votre nom]`
- Helper text below (always visible, not just on error): `"Ce nom apparaîtra sur votre QR code."` — 12px, grey `#888`
- Error on submit if empty: `"Veuillez entrer le nom de votre cabinet."`
- This value is stored and used in Step 3 to personalize the QR code label

### CTA Button — "Créer mon compte →"

- Full-width, `height: 52px`, `border-radius: 8px`
- Background: `#1B7A4A`, text: white, `font-size: 16px`, `font-weight: 600`
- Hover: `#165f3a` (10% darker)
- Loading state: spinner replaces arrow, button disabled, text becomes `"Création en cours..."`
- **Do not disable the button while the form is incomplete** — only show errors on submit attempt. Disabling the CTA before the user tries is frustrating.

### On Submit Success

1. Create user account via API (`POST /api/auth/signup`)
2. Store JWT in memory / httpOnly cookie
3. Send verification email in background (non-blocking)
4. Redirect to `/signup/setup`

### API Call

```typescript
POST /api/auth/signup
Body: {
  email: string,
  password: string,
  clinicName: string
}
Response: {
  token: string,
  clinicId: string,
  clinicName: string
}
```

---

## Step 2 — Setup Animation (Auto-advance)

**Route:** `/signup/setup`  
**User input:** None  
**Duration:** ~2 seconds, then auto-redirect to `/welcome`

This screen exists to create a sense of "something meaningful is happening." It bridges the signup form and the Aha Moment. It should feel satisfying, not like a loading spinner.

### Layout

Full-screen, centered, same light green-tinted background as Step 1.

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│           BleSaf (logo)                  │
│                                          │
│       On prépare votre cabinet...        │  ← H2, dark
│                                          │
│     ┌────────────────────────────┐       │
│     │ ✅ Compte créé             │       │  ← appears at t=300ms
│     │ ✅ Tableau de bord créé    │       │  ← appears at t=800ms
│     │ ✅ QR code généré          │       │  ← appears at t=1300ms
│     └────────────────────────────┘       │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

### Animation Sequence

| Timing | Event |
|---|---|
| `t = 0ms` | Screen appears, title fades in |
| `t = 300ms` | "✅ Compte créé" slides in from left, fade in |
| `t = 800ms` | "✅ Tableau de bord créé" slides in |
| `t = 1300ms` | "✅ QR code généré" slides in |
| `t = 2000ms` | Auto-redirect to `/welcome` |

Each checklist item: slide in from `translateX(-16px)` + `opacity: 0` to `translateX(0)` + `opacity: 1`, duration `400ms ease-out`.

The ✅ checkmark itself scales from `0` to `1` with a `200ms` pop (scale `0 → 1.2 → 1.0`).

**Important:** In parallel with the animation, make the API call to generate/fetch the QR code so it's ready to display in Step 3 instantly. If the API call finishes before 2 seconds, wait out the 2 seconds anyway. If it takes longer than 2 seconds, wait for it to resolve before redirecting (do not redirect to a broken Step 3).

### What happens in the background during Step 2

```typescript
// Fire during Step 2 animation
const qrData = await generateQRCode(clinicId);
// Store result in React state / Zustand store
// Redirect to /welcome once animation AND qrData are both ready
```

---

## Step 3 — Votre QR Code + Aha Moment

**Route:** `/welcome`  
**User input:** None required to experience the Aha Moment  

This is the most important screen in the entire onboarding. The doctor should feel: *"This actually works. My patients can do this themselves."*

### Layout — Desktop (two-panel)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────┐  ┌──────────────────────────┐   │
│  │                           │  │                          │   │
│  │  Votre QR Code est prêt.  │  │  Voici comment vos       │   │
│  │                           │  │  patients l'utiliseront. │   │
│  │   ┌──────────────────┐    │  │                          │   │
│  │   │                  │    │  │  [simulation zone]       │   │
│  │   │   QR CODE        │    │  │                          │   │
│  │   │   (220×220px)    │    │  │                          │   │
│  │   │                  │    │  │                          │   │
│  │   └──────────────────┘    │  │                          │   │
│  │                           │  │                          │   │
│  │  Clinique Dr. Ben Salem   │  │                          │   │
│  │  Scannez pour rejoindre   │  │                          │   │
│  │  la file d'attente        │  │                          │   │
│  │                           │  │                          │   │
│  │  [ Télécharger (PDF) ]    │  │                          │   │
│  │  [ Aller au tableau   ]   │  │                          │   │
│  │  [    de bord →       ]   │  │                          │   │
│  │                           │  │                          │   │
│  └───────────────────────────┘  └──────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile:** Stack vertically. QR code panel first, simulation panel second.

### Left Panel — QR Code

**QR Code specs:**
- Size: `220×220px` on desktop, `180×180px` on mobile
- Encoded URL: `https://blesaf.tn/checkin/{clinicId}` (or the correct check-in URL pattern)
- Center logo: BleSaf logomark overlaid at `~18%` of QR size (`40×40px`), white background padding `4px`
- Use `qrcode.js` or `qrcode.react` — generate client-side, no round-trip needed
- Subtle pulse animation: `scale(1.0) → scale(1.03) → scale(1.0)` every 4 seconds, `ease-in-out`, `800ms` — signals "active / live"

**Below QR code:**
```
[Clinic name — bold, dark]
Scannez pour rejoindre la file d'attente
```

**Buttons (stacked, full-width within panel):**

1. `[ Télécharger mon QR code (PDF) ]` — Primary, green fill
   - Generates a printable PDF (A4) with the QR code, clinic name, and the instruction "Scannez ce code pour rejoindre la file d'attente sans vous déplacer"
   - Completing this action marks "QR imprimé" in the activation checklist
2. `[ Aller au tableau de bord → ]` — Secondary, outlined green

### Right Panel — Simulation

**Header:**
```
Voici ce que vos patients vivront. →
```
Small, grey, above the simulation zone.

**Simulation zone:** A simplified phone mockup outline (CSS only, no image assets needed — just a rounded rectangle `300×520px` with border) showing the patient check-in screen inside it. This makes the simulation feel tangible.

Inside the phone mockup, a simplified version of the patient check-in flow plays out.

#### Simulation Sequence

The simulation starts automatically `1500ms` after the page loads. It is **not skippable**, but it is **rejouable** via a small `"Revoir la simulation"` link that appears after it completes.

| Timing | What happens |
|---|---|
| `t = 0ms` | Phone mockup is visible. Inside: blurred/dimmed waiting state. Small text: `"En attente d'un patient..."` with a subtle pulsing dot |
| `t = 1500ms` | A phone icon animates in from the right edge of the QR panel toward the QR code (CSS keyframe, `600ms ease-out`) |
| `t = 2100ms` | Quick white flash on the QR code (`200ms`) — "scan" effect |
| `t = 2300ms` | Inside the phone mockup, a patient card slides in from the top: **Name** (use a realistic Tunisian name — `Ahmed Ben Ali`), current time, position `#1`. Card has a green left border. |
| `t = 2800ms` | The patient card pulses once (scale `1.0 → 1.04 → 1.0`, `300ms`) |
| `t = 3200ms` | Below the phone mockup, the success message appears with a fade-in: |
| | `"✦ Votre premier patient vient de s'inscrire seul."` — bold, green `#1B7A4A`, `18px` |
| `t = 3800ms` | Sub-text fades in below: `"Votre essai de 30 jours est actif."` — grey, `14px` |
| `t = 4000ms` | Simulation complete. `"Revoir la simulation"` link appears below (grey, small) |

**Patient card inside the phone mockup:**

```
┌─────────────────────────────────┐
│ ║  Ahmed Ben Ali                │  ← green left border (4px)
│    🕐 14:32   •   Position #1  │
│    En attente de consultation   │
└─────────────────────────────────┘
```

**Do not** use confetti. Do not use large celebratory animations. The context is medical — the emotion to evoke is **relief and confidence**, not excitement.

#### Animation implementation notes

- The phone icon traveling toward the QR code: use `@keyframes` with `transform: translate()`. Phone icon is a simple `📱` emoji or an SVG phone icon (`24px`).
- The flash on the QR code: `::after` pseudo-element with `background: white`, `opacity: 0 → 0.8 → 0`, `200ms`.
- All animations are CSS-driven where possible. Use `setTimeout` only to sequence the triggers.
- The phone mockup is pure CSS: `border: 2px solid #D0DDD6`, `border-radius: 32px`, overflow hidden, no image assets.

---

## Post Step 3 — Dashboard Activation Checklist

When the doctor clicks "Aller au tableau de bord →", they land on the existing dashboard. An **activation checklist panel** appears as a card — either as a persistent sidebar widget (desktop) or a collapsible bottom card (mobile).

### Checklist state

```
┌─────────────────────────────────────────────┐
│  Démarrer avec BleSaf                        │
│  ████████████░░░░  3 / 4 étapes             │  ← progress bar
│                                              │
│  ✅  Compte créé                             │
│  ✅  Tableau de bord configuré               │
│  ☐   Imprimer votre QR code  [Télécharger]  │  ← CTA inline
│  ☐   Ajouter votre premier patient          │
│                                              │
│                            [ Masquer ▲ ]    │
└─────────────────────────────────────────────┘
```

**Behaviors:**
- Steps 1 & 2 are pre-checked on first load
- Checking off "QR imprimé" triggers on the PDF download event
- Checking off "Premier patient" triggers on the first `POST /api/queue` with a real patient
- When all 4 complete: replace the checklist with a single card `"Votre cabinet est opérationnel. ✦"` that auto-dismisses after 5 seconds
- The `[ Masquer ]` button collapses the checklist to a small tab/pill that can be re-expanded. It does **not** disappear permanently until all steps are done.
- Store checklist state in the backend (`POST /api/clinic/onboarding-progress`) so it persists across sessions

---

## Email Sequence (Post-Signup)

These emails are **behavior-triggered**, not time-triggered. Do not send an email if the user has already completed the action in-app.

| # | Trigger | Subject | Notes |
|---|---|---|---|
| 1 | Immediately after signup | `"Confirmez votre email BleSaf — 1 clic."` | Verification link valid 48h. Plain, minimal email. |
| 2 | QR not downloaded after 24h | `"Dr. [Nom], votre QR code vous attend."` | Single CTA. Show a small preview of what the QR looks like. |
| 3 | No real patient added after 3 days | `"Comment se passe votre essai ?"` | **Signed by Rached** (founder), personal tone. Short — 3 sentences max. |
| 4 | 5 days before trial ends (day 25) | `"Votre essai se termine dans 5 jours."` | Include usage stats: "Vous avez géré X patients." Link to subscription page. |

**Email sender for email #3:** `rached@blesaf.tn`, display name `"Rached, fondateur de BleSaf"` — not `"L'équipe BleSaf"`.

---

## Visual Design Tokens

Use these consistently across all 3 steps. Do not introduce new colors.

```css
--color-primary:        #1B7A4A;  /* BleSaf green — buttons, active states */
--color-primary-hover:  #165f3a;  /* Darker green — hover */
--color-primary-light:  #E8F5EE;  /* Light green — backgrounds, cards */
--color-primary-mid:    #C3E6D0;  /* Mid green — borders, progress */

--color-text-dark:      #1A1A2E;  /* Headings */
--color-text-body:      #555566;  /* Body text */
--color-text-muted:     #888899;  /* Helper text, placeholders */

--color-border:         #D0DDD6;  /* Input borders, card borders */
--color-bg-page:        #F4F7F5;  /* Page background */
--color-bg-card:        #FFFFFF;  /* Card backgrounds */

--color-error:          #D94040;  /* Error states */
--color-warning:        #E07B00;  /* Warnings */

--radius-input:         6px;
--radius-button:        8px;
--radius-card:          12px;

--font:                 'Inter', sans-serif;  /* fallback: system-ui */
--font-size-base:       15px;
--font-size-small:      13px;
--font-size-h1:         28px;   /* mobile: 24px */
--font-size-h2:         22px;
```

---

## Responsive Behavior

| Breakpoint | Layout changes |
|---|---|
| `> 768px` (desktop) | Step 3: two-panel side by side. Cards max-width `480px` centered. |
| `≤ 768px` (mobile) | Step 3: stacked, QR panel first. Buttons full-width. Font sizes slightly reduced. |
| All steps | The progress bar is always visible. The form card has `padding: 32px` on desktop, `24px` on mobile. |

**Mobile-specific:**
- On Step 1, when the keyboard opens, the "Créer mon compte" button must remain visible above the keyboard. Use `position: sticky; bottom: 0` on the button wrapper.
- The phone mockup in Step 3 scales down to `240×420px` on mobile.

---

## State Management

Use the existing Zustand store. Add an `onboarding` slice:

```typescript
interface OnboardingState {
  clinicName: string;            // set in Step 1
  qrCodeDataUrl: string | null;  // set during Step 2
  qrCodeUrl: string | null;      // the actual check-in URL
  simulationComplete: boolean;   // set after Step 3 animation
  checklistProgress: {
    accountCreated: boolean;
    dashboardConfigured: boolean;
    qrDownloaded: boolean;
    firstPatientAdded: boolean;
  };
}
```

`clinicName` is used in Step 3 to display below the QR code without an additional API call.

---

## Files to Create / Modify

### New files

```
web/src/pages/SignupPage.tsx          ← Step 1
web/src/pages/SetupPage.tsx           ← Step 2 (animation only)
web/src/pages/WelcomePage.tsx         ← Step 3 (Aha Moment)

web/src/components/onboarding/
  ProgressBar.tsx                     ← shared across steps 1-3
  PasswordStrengthBar.tsx             ← used in Step 1
  QRCodeDisplay.tsx                   ← QR code with logo + pulse
  PatientSimulation.tsx               ← animated phone mockup + sequence
  ActivationChecklist.tsx             ← post-onboarding dashboard widget

web/src/stores/onboardingStore.ts     ← Zustand slice

web/src/utils/qrCodePdf.ts           ← PDF generation for the QR download
```

### Modified files

```
web/src/App.tsx (or router file)      ← add new routes + auth guards
web/src/pages/DashboardPage.tsx       ← inject ActivationChecklist widget
api/src/routes/auth.ts                ← ensure signup returns clinicId + clinicName
api/src/routes/clinic.ts              ← add POST /api/clinic/onboarding-progress
```

---

## QR Code PDF Generation

When the doctor clicks "Télécharger mon QR code (PDF)", generate and download a PDF client-side using `jspdf` or similar.

**PDF layout (A4):**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  [BleSaf logo]                  │
│                                                 │
│         ┌─────────────────────────┐            │
│         │                         │            │
│         │      QR CODE            │            │
│         │      (large — 200mm)    │            │
│         │                         │            │
│         └─────────────────────────┘            │
│                                                 │
│              Clinique Dr. Ben Salem             │
│                                                 │
│    Scannez ce code pour rejoindre               │
│    la file d'attente sans vous déplacer.        │
│                                                 │
│         Votre numéro vous sera envoyé           │
│         par message.                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

Font: large clinic name (`32px bold`), instruction text (`18px`). Print-ready (300dpi equivalent).

Filename: `QR-BleSaf-[ClinicName].pdf`

---

## Key Constraints & Principles

1. **No verification wall before product access.** Send the email verification in the background. The user reaches Step 3 without ever seeing an "Awaiting verification" gate.

2. **No field should ask for data that won't be used visibly before the session ends.** Every input must have an immediately visible payoff (the clinic name appears on the QR code in 60 seconds).

3. **The Aha Moment animation cannot fail silently.** If the QR code API call fails during Step 2, show a graceful error with a retry button before redirecting. Never land on Step 3 with a broken/missing QR code.

4. **No dark patterns.** No pre-checked marketing consent boxes. No hidden auto-renewal language. No greyed-out "skip" buttons.

5. **Copy tone:** Professional, direct, Tunisian French. Address the doctor as `"vous"`. Avoid "votre espace", "votre aventure", "bienvenue dans la famille". Use concrete, functional language.

6. **Step 2 auto-redirect timing is fixed at 2 seconds** regardless of network speed, as long as the QR code fetch has completed. If it hasn't, wait for it — but never show the user a broken Step 3.
