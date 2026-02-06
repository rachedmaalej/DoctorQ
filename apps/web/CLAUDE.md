# DoctorQ Web Frontend

React 18 + Vite + TypeScript + Tailwind CSS. Entry point: `src/main.tsx` -> `App.tsx`.
Dev: `pnpm dev` (Vite, port 5174). Build: `tsc && vite build`.

## Architecture

```
src/
  App.tsx               # Route definitions with React.lazy code splitting + auth guards
  pages/
    DashboardPage.tsx       # Main receptionist view (queue management)
    CheckInPage.tsx         # Patient self-check-in (public, by clinicId)
    PatientStatusPage.tsx   # Patient queue position (public, by entryId)
    LoginPage.tsx           # Clinic login
    SignupPage.tsx           # Self-service registration
    OnboardingPage.tsx      # Post-signup guided setup
    SubscriptionPage.tsx    # Plan management, SMS package purchase
    SettingsPage.tsx        # Clinic settings
    LandingPage.tsx         # Marketing page
    VerifyEmailPage.tsx / ForgotPasswordPage.tsx / ResetPasswordPage.tsx
    admin/AdminDashboard.tsx    # SaaS command center (5 tabs)
    admin/ClinicDetailPage.tsx  # Individual clinic deep-dive
  components/
    ui/         # ConfirmModal, Toast, LanguageSwitcher, Logo, TrialBanner, Confetti
    queue/      # QueueList, QueueStats, AddPatientModal, QRCodeCard/Modal, MobileDashboard
    patient/    # TicketCard, CompactTicketCard, WaitEstimateCard, PatientJourneyVisual
    layout/     # Header
    admin/      # 26 components: tabs/, charts/, clinic-detail/ subdirs
    md3/        # Material Design 3 primitives: button, card, fab (uses CVA)
  stores/
    authStore.ts    # Clinic data, JWT, isImpersonating. Token in localStorage 'auth_token'.
    queueStore.ts   # Queue entries, stats, loading state
  hooks/
    useDashboard.ts # Main queue logic: polling, modals, patient actions, toast, animations
    useSocket.ts    # Socket.io connection management + auto-reconnect
    useUILabels.ts  # Dynamic labels based on clinic.businessType (medical vs retail)
  lib/
    api.ts          # ApiClient class. Auto-detects prod URL from hostname. Unwraps { data: T }.
    phone.ts        # Tunisian phone formatting (+216), validation
    time.ts         # Wait time calculation, appointment formatting
    queue.ts        # Position calculations, reordering logic
    sounds.ts       # Audio notification cues
    logger.ts       # Console logging with levels
  types/index.ts    # All TypeScript interfaces (QueueEntry, Clinic, Admin types, etc.)
  i18n/
    index.ts        # i18next config
    locales/fr.json # French translations
    locales/ar.json # Arabic translations
```

## Styling

Tailwind CSS with custom palette in `tailwind.config.js`:
- **primary:** Teal (#0D9488) — main brand color, 50-900 scale
- **secondary:** Navy (#1E3A5F) — 50-900 scale
- **accent:** Amber (#F59E0B) — 50-900 scale
- **admin:** Clinical teal palette (admin.text, admin.bg, admin.subtle, admin.border, admin.accent)

Fonts: IBM Plex Sans (default) + IBM Plex Sans Arabic (for `ar` locale).

Conventions:
- Tailwind utility classes directly, not CSS modules
- `clsx` + `tailwind-merge` via `lib/utils.ts` for conditional classes
- class-variance-authority (CVA) for variant components (see `md3/` components)

## i18n & RTL

Languages: French (`fr`, default) + Arabic (`ar`, RTL).
Config: `src/i18n/index.ts`. Translation files: `src/i18n/locales/{fr,ar}.json`.
RTL: On language change, sets `document.documentElement.dir = 'rtl' | 'ltr'`.
**LanguageSwitcher uses DEFAULT export** — `import LanguageSwitcher from '@/components/ui/LanguageSwitcher'`

## State Management

**authStore** (Zustand): `clinic`, `isAuthenticated`, `isImpersonating`. Login/logout/impersonate actions. Checks auth on app mount via `/api/auth/me`.

**queueStore** (Zustand): Queue entries, stats, selected patient. Populated by `useDashboard` (polling) + `useSocket` (real-time).

**ApiClient** (`lib/api.ts`): Singleton. In dev: `localhost:3001`. In prod: auto-detects Railway URL from hostname (`vercel.app` or `doctor-q`). All responses unwrap `{ data: T }`.

## useUILabels Hook

Dynamic labels based on `clinic.businessType`:
- `"medical"` (default): patient/patients, "Docteur present"/"Docteur absent"
- `"retail"`: client/clients, "Cabinet ouvert"/"Cabinet ferme"

## Route Protection

- **Public:** `/patient/:entryId`, `/checkin/:clinicId`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/landing`
- **Protected:** `/dashboard` (redirects to `/onboarding` if `!onboardingCompleted`), `/settings`, `/subscription`, `/admin`
- **Reverse guards:** `/login` redirects to `/dashboard` if already authenticated

## Testing

### Unit (Vitest)
Config: `vitest.config.ts`. Environment: jsdom. Path alias: `@` -> `./src`.
Existing tests: `lib/phone.test.ts`, `lib/queue.test.ts`, `lib/time.test.ts`.
Run: `pnpm test` (watch) or `pnpm test:run` (single pass).

### E2E (Playwright)
Config: `playwright.config.ts`. Test dir: `e2e/`.
Specs: queue, signup, settings, patient-checkin, accessibility.
Browsers: Chromium, Firefox, WebKit + Mobile Chrome (Pixel 5) + Mobile Safari (iPhone 12).
Base URL: `http://localhost:5174`.
Run: `pnpm test:e2e` (chromium), `pnpm test:e2e:all`, `pnpm test:e2e:ui`.

### Accessibility
Uses `@axe-core/playwright`. Run: `pnpm test:a11y`.

## Gotchas

- Always use `@/` imports (mapped to `src/` in tsconfig and vitest)
- Recharts v3.7 for admin charts — import from `'recharts'`
- All pages are lazy-loaded via `React.lazy()` + `Suspense`
- API URL auto-detection: hostname-based in `lib/api.ts`, no env var needed in prod
