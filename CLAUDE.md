# DoctorQ (BleSaf) - Development Guide

SaaS virtual queue management for Tunisian medical clinics. Patients check in (QR/manual/SMS), track their position in real-time, and get SMS notifications when their turn approaches. Self-service model: 30-day free trial, then MONTHLY (50 TND) or YEARLY (500 TND). SMS credits sold separately (starter 100/10TND, standard 300/25TND, pro 1000/70TND). 50 free SMS on signup.

## Tech Stack

Monorepo (pnpm workspaces): `apps/api` + `apps/web`

- **API:** Express + TypeScript + Prisma + Socket.io + PostgreSQL
- **Web:** React 18 + Vite + Tailwind CSS + Zustand + Socket.io-client + react-i18next
- **Database:** PostgreSQL via Supabase (pgbouncer connection pooling in production)
- **Payments:** Konnect (Tunisian gateway, amounts in millimes: 50 TND = 50000)
- **SMS:** Twilio (graceful no-op if credentials unconfigured)
- **Email:** Resend
- **Deployment:** Railway (API) + Vercel (Web)

See [apps/api/CLAUDE.md](apps/api/CLAUDE.md) and [apps/web/CLAUDE.md](apps/web/CLAUDE.md) for detailed architecture.

---

## Commands

```bash
# Development
pnpm dev                 # Both API + Web concurrently
pnpm dev:api             # API only (tsx watch, port 3001)
pnpm dev:web             # Web only (Vite, port 5174)

# Database
pnpm db:push             # Push schema to DB (dev only, quick prototyping)
pnpm db:migrate          # Create new migration (dev only)
pnpm db:migrate:deploy   # Apply pending migrations (production-safe)
pnpm db:migrate:status   # Check migration status
pnpm db:seed             # Seed dev test data
pnpm db:studio           # Prisma Studio GUI

# Testing
pnpm test                # All tests (Vitest)
pnpm test:api            # API unit tests
pnpm test:web            # Web unit tests
# From apps/web/:
pnpm test:e2e            # Playwright (chromium)
pnpm test:e2e:all        # Playwright all browsers + mobile
pnpm test:e2e:ui         # Playwright interactive mode
pnpm test:a11y           # Accessibility (axe-core)

# Build & Lint
pnpm build               # Build all
pnpm lint                # ESLint
pnpm format              # Prettier
```

---

## Environment Variables

### Backend (`apps/api/.env`)
```
DATABASE_URL             # PostgreSQL pooler URL (REQUIRED)
DIRECT_URL               # PostgreSQL direct URL (REQUIRED for migrations)
JWT_SECRET               # REQUIRED - server crashes without it
JWT_EXPIRES_IN           # Default: 7d
RESEND_API_KEY           # Email service
FROM_EMAIL               # e.g. BleSaf <noreply@blesaf.tn>
TWILIO_ACCOUNT_SID       # SMS (optional - graceful no-op)
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
KONNECT_API_KEY          # Payment gateway
KONNECT_WALLET_ID
PORT                     # Default: 3001
NODE_ENV                 # development | production
FRONTEND_URL             # For CORS + SMS status links
```

### Frontend (`apps/web/.env`)
```
VITE_API_URL             # Optional - auto-detects in production
VITE_SOCKET_URL          # Optional - follows API URL
VITE_DEFAULT_LANGUAGE    # Default: fr
```

---

## Platform Quirks

- **PowerShell:** Use `;` not `&&` to chain commands
- **Prisma migrations:** Use `prisma migrate dev --name <name>` for schema changes (never `db push` in production)
- **Prisma directUrl:** Required for migrations when using Supabase pgbouncer — set `DIRECT_URL` env var
- **LanguageSwitcher:** Uses DEFAULT export, not named: `import LanguageSwitcher from '...'`
- **Phone numbers:** Always `+216` format. Tunisian numbers are 8 digits after country code.
- **Konnect amounts:** Always in millimes (50 TND = 50000 millimes)
- **CORS:** API accepts multiple origins. Dev defaults include ports 5173-5177 for Vite fallback.

---

## Auth Model

- **Clinic-level JWT** — no patient accounts. Patients identified by phone number only.
- **Admin access:** Hardcoded `ADMIN_EMAILS` array in `apps/api/src/routes/admin.ts` (admin@doctorq.tn, rached@doctorq.tn)
- **Impersonation:** Admin can "login as clinic" — stores original admin token, swaps to clinic JWT
- **Subscription enforcement:** TRIAL valid 30 days from signup, ACTIVE until `subscriptionEndsAt`
- **SMS credits:** Deducted per-send, checked in notificationService before sending

---

## Database Models

Schema: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

| Model | Purpose |
|-------|---------|
| Clinic | Tenant entity: auth, subscription, SMS credits, settings, presence |
| Doctor | Multi-doctor support (optional FK on QueueEntry) |
| QueueEntry | Core queue item with status tracking + 15 indexes |
| DailyStat | Archived daily metrics per clinic (midnight cron) |
| PaymentRecord | Admin-recorded or Konnect payments |
| SubscriptionEvent | Subscription lifecycle audit trail |
| SmsPackagePurchase | SMS credit purchase history |

**Key enums:** `QueueStatus` (WAITING → NOTIFIED → IN_CONSULTATION → COMPLETED / NO_SHOW / CANCELLED), `CheckInMethod`, `SubscriptionStatus` (TRIAL → ACTIVE → PAST_DUE → EXPIRED), `SubscriptionPlan` (MONTHLY / YEARLY)

---

## Branching & Deployment

### Branch Model
| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Active development | Nothing (local dev only) |
| `production` | Stable releases | Railway (API) + Vercel (Web) |

### Workflow
- **Daily dev:** Work on `main`, run locally with `pnpm dev` (connects to dev Supabase)
- **Schema changes:** `cd apps/api && npx prisma migrate dev --name <name>` — commit the migration file
- **Promote to prod:** `gh pr create --base production --head main` — CI must pass, then merge
- **Emergency hotfix:** Branch off `production`, fix, PR back to `production`, cherry-pick to `main`

### CI/CD
- GitHub Actions runs lint, type-check, build, and tests on PRs to `production` and pushes to `main`
- Branch protection on `production` requires CI to pass before merge

### Infrastructure
- **API:** Railway (binds 0.0.0.0). Production URL: `doctorqapi-production-ac8b.up.railway.app`
- **Web:** Vercel. Frontend auto-detects production API URL from hostname in `lib/api.ts`
- **Dev DB:** Separate Supabase project (free tier) — isolated from production
- **Prod DB:** Supabase with pgbouncer pooling. Migrations via `prisma migrate deploy` (non-destructive)
- **Cron:** In-process via node-cron. Timezone: Africa/Tunis
  - Midnight: archive stats, clear queues, reset doctor presence
  - 9 AM: trial expiration warning emails (7-day and 3-day)
