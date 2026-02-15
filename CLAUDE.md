# DoctorQ (BleSaf)

SaaS queue management for Tunisian medical clinics. Monorepo: `apps/api` (Express+Prisma+Socket.io) + `apps/web` (React+Vite+Tailwind). PostgreSQL via Supabase, Konnect payments, Twilio SMS, Resend email.

## Commands

```bash
pnpm dev              # Both API + Web
pnpm dev:api          # API only (port 3001)
pnpm dev:web          # Web only (port 5174)
pnpm build            # Build all
pnpm lint             # ESLint
pnpm test             # All tests (Vitest)
pnpm db:migrate       # Create migration (dev)
pnpm db:migrate:deploy # Apply migrations (prod)
pnpm db:seed          # Seed dev data
```

## Platform Quirks

- PowerShell: use `;` not `&&` to chain commands
- LanguageSwitcher: DEFAULT export, not named
- Phone numbers: always `+216` format (8 digits)
- Konnect amounts: millimes (50 TND = 50000)
- Prisma directUrl: required for migrations with Supabase pgbouncer

## Auth

- Clinic-level JWT (no patient accounts)
- Admin: hardcoded `ADMIN_EMAILS` in `apps/api/src/routes/admin.ts`
- Subscription: TRIAL (30d) -> ACTIVE -> EXPIRED

## Roadmap

See `ROADMAP.md` for the official launch timeline (3 phases: Pre-Ramadan Sprint → Ramadan Build → Post-Eid Launch). Current phase tasks guide development priorities.

## Branching

- `main`: active dev (local only)
- `production`: deploys to Railway (API) + Vercel (Web)
- Promote: `gh pr create --base production --head main`
