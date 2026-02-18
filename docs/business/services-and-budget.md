# BleSaf/DoctorQ — Services & Budget Tracker

**Last Updated:** February 18, 2026
**Currency:** TND (1 TND ≈ $0.32 USD) | Prices shown in USD where billed in USD

---

## Current Monthly Expenses

| Service | Current Plan | Monthly Cost | Status |
|---------|-------------|-------------|--------|
| Railway | Developer | **$5/mo** | Paying since Feb 2026 |
| Supabase | Free | $0 | Dev DB only |
| Vercel | Hobby (Free) | $0 | |
| Resend | Free | $0 | |
| Konnect | Free (transaction fees only) | $0 | |
| Sentry | Free | $0 | |
| GitHub | Free | $0 | |
| ~~Plausible~~ | Removed | $0 | Using Vercel Analytics instead (free) |
| **TOTAL** | | **$5/mo** | |

---

## Service-by-Service Details

### 1. Railway — API Hosting
- **Dashboard:** https://railway.app/dashboard
- **Current Plan:** Developer ($5/mo with $5 resource credit)
- **What's deployed:** Express API + Prisma + Socket.io
- **Production URL:** `doctorqapi-production-ac8b.up.railway.app`

| Resource | Developer Limit | Pro ($20/mo) |
|----------|----------------|--------------|
| RAM | 48 GB | 1 TB |
| vCPU | 48 vCPU | 1,000 vCPU |
| Replicas | 6 | 42 |
| Included credit | $5 | $20 |

**Usage-based costs beyond credit:**
- CPU: ~$20/vCPU/month
- RAM: ~$10/GB/month
- Egress: $0.05/GB

**When to upgrade to Pro ($20/mo):** When monthly resource usage consistently exceeds the $5 credit (monitor in Railway dashboard). Likely around 20-30 concurrent clinics with active Socket.io connections.

---

### 2. Supabase — PostgreSQL Database
- **Dashboard:** https://supabase.com/dashboard
- **Current Plan:** Free (dev database)
- **Production note:** Railway currently has its own Postgres. Supabase is used for dev.

| Resource | Free Limit | Pro ($25/mo) |
|----------|-----------|--------------|
| DB size | 500 MB | 8 GB |
| Bandwidth | 10 GB/mo | 250 GB/mo |
| Connections | 200 concurrent | Unlimited (pgbouncer) |
| Auth MAU | 50,000 | 100,000 |
| **Auto-pause** | **After 7 days inactivity** | Never |

**When to upgrade to Pro ($25/mo):**
- If using Supabase for production: immediately (auto-pause kills a production app)
- If staying on Railway Postgres: may not need Supabase Pro at all
- DB size approaching 500 MB (track via dashboard)

**Decision needed:** Consolidate on Railway Postgres vs Supabase for production. Currently Railway Postgres is the prod DB.

---

### 3. Vercel — Web Hosting
- **Dashboard:** https://vercel.com/dashboard
- **Current Plan:** Hobby (Free)
- **Production URL:** `web-zeta-five-39.vercel.app`

| Resource | Hobby Limit | Pro ($20/mo) |
|----------|------------|--------------|
| Bandwidth | 100 GB/mo | 1 TB/mo |
| Builds | Unlimited | Turbo (30 vCPU) |
| Domains | Unlimited | Unlimited |
| **Overage** | **Blocked for 30 days** | Pay-as-you-go |

**When to upgrade to Pro ($20/mo):**
- Bandwidth exceeds 100 GB/month (unlikely for an SPA — a Vite React app is ~1-3 MB, so this supports ~30,000-100,000 page loads/month)
- Need team collaboration features
- Want faster builds

**Estimated trigger:** 50+ active clinics with frequent patient status page visits. The SPA is lightweight but patient status pages may generate significant traffic.

---

### 4. Resend — Transactional Email
- **Dashboard:** https://resend.com
- **Current Plan:** Free

| Resource | Free Limit | Pro ($20/mo) |
|----------|-----------|--------------|
| Emails/month | 3,000 | 50,000 |
| Emails/day | 100 | Unlimited |
| Domains | 1 | 10 |
| Data retention | 1 day | 3 days |

**Email types sent:** Verification, password reset, welcome, trial expiration warnings (7-day + 3-day), onboarding playbook.

**Estimated usage per clinic:** ~5 emails/month (signup flow + occasional resets)
- 3,000 emails/month ÷ 5 = supports **~600 clinic signups/month**
- Daily limit of 100 is the real constraint for batch sends (e.g., trial warnings)

**When to upgrade to Pro ($20/mo):**
- Daily sends exceed 100 (trial warning cron at 9 AM could hit this with 100+ trial clinics)
- Need multiple sending domains (blesaf.tn + doctorq.tn)

**Estimated trigger:** 100+ clinics on trial simultaneously, or multi-domain branding.

---

### 5. Konnect — Tunisian Payment Gateway
- **Dashboard:** https://my.konnect.network
- **Current Plan:** Free (no monthly fees)

| Fee Type | Rate |
|----------|------|
| Local transaction (Tunisia) | 1.6% per transaction |
| International transaction | 3.3% per transaction |
| Bank transfer (payout) | 2 TND per transfer |
| Monthly fee | None |
| Setup fee | None |

**Revenue impact per subscription payment:**
- Monthly plan (50 TND): 50 × 1.6% = **0.80 TND fee** → you keep 49.20 TND
- Yearly plan (500 TND): 500 × 1.6% = **8 TND fee** → you keep 492 TND
- Bank transfer: 2 TND per payout (batch payouts to minimize)

**At scale (50 clinics, all monthly):**
- 50 × 50 TND = 2,500 TND revenue
- Konnect fees: 50 × 0.80 = 40 TND
- Payout fee: 2 TND (1 batch)
- **Total Konnect cost: ~42 TND/month (~$13.50)**

---

### 6. Stripe — International Payment Gateway (France brand only)
- **Dashboard:** https://dashboard.stripe.com
- **Current Plan:** Not yet active (conditional on BRAND=france)

| Fee Type | Rate |
|----------|------|
| EU card transaction | 1.5% + €0.25 |
| Non-EU card | 3.25% + €0.25 |
| Monthly fee | None |

**Status:** Not needed until France market launch. No current cost.

---

### 7. Sentry — Error Tracking
- **Dashboard:** https://sentry.io
- **Current Plan:** Free

| Resource | Free Limit | Team ($29/mo) |
|----------|-----------|---------------|
| Errors/month | 5,000 | 50,000 |
| Retention | Limited | 30 days |
| Performance monitoring | Basic | Full |

**When to upgrade to Team ($29/mo):**
- Error volume exceeds 5,000/month (would indicate serious bugs — fix bugs first!)
- Need longer retention for debugging patterns

**Estimated trigger:** Unlikely to need paid plan unless something is very wrong. 5,000 errors/month is generous for a small app.

---

### 8. ~~Plausible~~ → Vercel Analytics
- **Decision (Feb 18, 2026):** Removed Plausible (no free tier, $9/mo minimum). Using Vercel's built-in analytics instead (free on Hobby plan). Can revisit if custom event tracking is needed later.

---

### 9. GitHub — Source Code & CI/CD
- **Dashboard:** https://github.com/rachedmaalej
- **Current Plan:** Free

| Resource | Free Limit | Team ($4/user/mo) |
|----------|-----------|-------------------|
| Actions minutes | 2,000/mo | 3,000/mo |
| Package storage | 500 MB | 2 GB |
| Repos | Unlimited | Unlimited |

**Current CI pipeline:** Lint → Type-check → Build → Test on PRs to `production` + pushes to `main`.

**When to upgrade:** Solo developer with moderate CI usage won't hit 2,000 min/month. Upgrade only when adding team members or CI runs become frequent (5+ devs).

---

### 10. WhatsApp Business API (Planned)
- **Dashboard:** https://business.facebook.com
- **Current Plan:** Not active

| Fee Type | Rate |
|----------|------|
| Business-initiated (Tunisia) | ~$0.055/message (~0.017 TND) |
| User-initiated | First 1,000/mo free |
| Setup | Free (Meta Cloud API) |

**Status:** Env vars exist in `.env.example` but not yet implemented. Will be a patient check-in method.

---

## Scaling Budget Projections

Since SMS was removed, the cost model is dramatically different from the January estimate. Notifications are now **Socket.io-only** (zero marginal cost per notification). The main scaling costs are infrastructure.

### Cost by Growth Stage

| Stage | Clinics | Monthly Revenue | Monthly Infra Cost | Konnect Fees | **Total Cost** | **Profit** |
|-------|---------|----------------|--------------------|-------------|---------------|-----------|
| **Now (Feb 2026)** | 0 | 0 TND | $5 (~16 TND) | 0 | **16 TND** | -16 TND |
| **Pilot** | 3 (trial) | 0 TND | $5 (~16 TND) | 0 | **16 TND** | -16 TND |
| **Early** | 10 paying | 500 TND | $5 (~16 TND) | 10 TND | **26 TND** | **474 TND** |
| **Growing** | 30 paying | 1,500 TND | $5 (~16 TND) | 26 TND | **42 TND** | **1,458 TND** |
| **Scaling** | 50 paying | 2,500 TND | $45* (~144 TND) | 42 TND | **186 TND** | **2,314 TND** |
| **Scale** | 100 paying | 5,000 TND | $65** (~208 TND) | 82 TND | **290 TND** | **4,710 TND** |

*\* Railway Pro ($20) + Vercel Pro ($20) + Resend stays free*
*\*\* + Resend Pro ($20) added, Sentry stays free*

### Upgrade Trigger Checklist

Use this to decide when to upgrade each service:

| # | Trigger | Action | New Cost |
|---|---------|--------|----------|
| 1 | Railway usage > $5 credit | Upgrade to Pro | +$15/mo |
| 3 | Vercel bandwidth > 100 GB | Upgrade to Pro | +$20/mo |
| 4 | Resend daily sends > 100 | Upgrade to Pro | +$20/mo |
| 5 | Sentry errors > 5,000/mo | Fix bugs first, then Team | +$29/mo |
| 6 | Supabase DB > 500 MB | Pro (if using Supabase) | +$25/mo |
| 7 | GitHub Actions > 2,000 min | Team plan | +$4/user/mo |
| 8 | France market launch | Stripe (no monthly fee) | Transaction fees only |

---

## Break-Even Analysis (Post-SMS Removal)

**Fixed costs (current):** $5/mo = 16 TND
**Variable cost per clinic:** ~0 TND (Socket.io notifications are free, Konnect fees are ~0.80 TND)
**Revenue per clinic:** 50 TND/month (monthly) or 42 TND/month (yearly plan amortized)

**Break-even:** 1 paying clinic covers all current infrastructure costs.

**At scale (all services upgraded, ~$74/mo = 237 TND):**
- Break-even: 237 ÷ 49.20 (after Konnect fees) = **5 clinics**

**Gross margin at scale: 93-94%** — This is a pure SaaS margin because there are no per-notification costs anymore.

---

## Yearly Plan Impact

Clinics on yearly plans (500 TND/year = 42 TND/month effective) reduce MRR by 16% per clinic vs monthly, but:
- Better cash flow (500 TND upfront)
- Lower churn
- Konnect fee: 8 TND once vs 0.80 × 12 = 9.60 TND over the year (saves 1.60 TND)

---

## Dashboard & Login Quick Reference

| Service | Dashboard URL | Login Method |
|---------|--------------|-------------|
| Railway | https://railway.app/dashboard | GitHub OAuth |
| Vercel | https://vercel.com/dashboard | GitHub OAuth |
| Supabase | https://supabase.com/dashboard | Email/GitHub |
| Resend | https://resend.com/emails | Email |
| Konnect | https://my.konnect.network | Email |
| Sentry | https://sentry.io | Email/GitHub |
| Vercel Analytics | https://vercel.com/dashboard (Analytics tab) | GitHub OAuth |
| GitHub | https://github.com/rachedmaalej | Email/SSH |
| Stripe | https://dashboard.stripe.com | Email (not active) |

---

## Monthly Review Checklist

At the start of each month, check:

- [ ] Railway dashboard: resource usage vs $5 credit
- [ ] Vercel dashboard: bandwidth usage
- [ ] Resend dashboard: email count (daily + monthly)
- [ ] Sentry dashboard: error count
- [ ] Konnect dashboard: transaction fees deducted
- [ ] GitHub Actions: minutes consumed
- [ ] Overall: compare actual costs vs projections above

---

## Document History

| Date | Change |
|------|--------|
| Feb 18, 2026 | Created. Replaces outdated SMS-based cost model from Jan 2026. Removed Plausible, using Vercel Analytics instead. |
