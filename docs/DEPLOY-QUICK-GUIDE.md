# Deploy & Access Quick Guide

## Live URLs

### BleSaf (Tunisia)
| | URL |
|---|---|
| Web | https://doctorq.vercel.app |
| API | https://doctorqapi-production-ac8b.up.railway.app |
| Admin login | `admin@doctorq.tn` / `BlesafAdmin2024!` |
| Test clinic | `dr.skander@example.tn` / `password123` |

### AuSuivant (France)
| | URL |
|---|---|
| Web | https://ausuivant-production.vercel.app |
| API | https://ausuivant-api-production-production.up.railway.app |
| Admin login | `admin@ausuivant.fr` / `AuSuivantAdmin2024!` |
| Test clinic | `dr.perrin@example.fr` / `password123` |

---

## Deploy Commands

```bash
pnpm deploy:blesaf       # BleSaf API (Railway) + both webs (Vercel)
pnpm deploy:ausuivant    # AuSuivant API (Railway) + both webs (Vercel)
pnpm deploy:all           # Everything
```

### What happens under the hood
- `deploy:blesaf` pushes `main` -> `deploy/blesaf` (Railway BleSaf) + `main` -> `production` (Vercel)
- `deploy:ausuivant` pushes `main` -> `deploy/ausuivant` (Railway AuSuivant) + `main` -> `production` (Vercel)
- Railway services watch their own branch (independent API deploys)
- Vercel projects both watch `production` (web deploys together)

---

## Branch Model

| Branch | Purpose | Watched by |
|--------|---------|-----------|
| `main` | Active development | CI only (no auto-deploy) |
| `deploy/blesaf` | BleSaf API releases | Railway (BleSaf API service) |
| `deploy/ausuivant` | AuSuivant API releases | Railway (AuSuivant API service) |
| `production` | Web releases | Vercel (both web projects) |

---

## Dev Commands

```bash
pnpm dev              # BleSaf (default): API :3001 + Web :5174
pnpm dev:fr           # AuSuivant: API :3002 + Web :5175
pnpm dev:all          # All 4 services simultaneously
```

---

## CI

CI (`.github/workflows/ci.yml`) runs on:
- Pushes to `main`
- PRs to `production`, `deploy/blesaf`, `deploy/ausuivant`

Validates **both brands** via matrix strategy:
- Lint + API type-check/build/test (once, brand-agnostic)
- Web type-check/build/test (once per brand: blesaf + france)

---

## Brand Config

Brands are configured via env vars:
- **API**: `BRAND=blesaf` or `BRAND=france` (set in Railway env vars)
- **Web**: `VITE_BRAND=blesaf` or `VITE_BRAND=france` (set in Vercel env vars)

Frontend uses `webBrand.theme.*` for visual differences (no brand ID checks).

Config files:
- Backend: `apps/api/src/lib/brand.ts`
- Frontend: `apps/web/src/lib/brand.ts` (includes `BrandTheme`)

---

## Infrastructure

| Service | Provider | DB |
|---------|----------|----|
| BleSaf API | Railway | Railway internal PostgreSQL |
| AuSuivant API | Railway | Supabase eu-west-1 |
| BleSaf Web | Vercel | N/A |
| AuSuivant Web | Vercel | N/A |

---

## Admin Access

Admin emails (hardcoded in `apps/api/src/lib/brand.ts`):
- `admin@doctorq.tn`, `rached@doctorq.tn` (legacy, always accepted)
- `admin@blesaf.tn` (BleSaf brand admin)
- `admin@ausuivant.fr` (AuSuivant brand admin)
- In dev mode: all brand admin emails accepted regardless of BRAND env

To access admin dashboard: login with an admin email, you'll see the admin panel.
