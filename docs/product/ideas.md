# IDEAS.md - Future Features & Improvements

Central dump for ideas. Not a roadmap — just a backlog to pick from.

---

## Features

### Patient Experience
- [ ] **Doctor arrival time display** — When doctor is absent, let them set an expected arrival time shown on patient status page
- [ ] **Position change notifications** — Notify patients when they move up ("You moved up! 2 people ahead")
- [ ] **WhatsApp notifications** — Meta Cloud API integration as alternative to SMS
- [ ] **Patient satisfaction survey** — Quick 1-question survey after visit ("How was your wait?")
- [ ] **Appointment booking** — Allow patients to book specific time slots, not just same-day queue
- [ ] **Patient accounts** — Optional login for returning patients (track visit history)

### Clinic Dashboard
- [ ] **Undo last action** — Reverse accidental "call next" or "mark no-show"
- [ ] **Clinic analytics page** — Historical charts: patients/day, avg wait trends, peak hours, no-show rates
- [ ] **Payment history page** — Clinics view their invoices and payment records
- [ ] **Custom branding** — Allow clinics to customize logo/colors on patient-facing pages
- [ ] **Multi-queue support** — Separate queues per doctor with shared waiting room view
- [ ] **Daily summary email** — End-of-day stats sent to clinic email

### Admin / Platform
- [ ] **Automated recurring billing** — Recurring Konnect payments instead of manual renewals
- [ ] **SMS delivery analytics** — Track delivery rates, costs per clinic, failed sends
- [ ] **Weekly stats email digest** — Automated platform summary to admin
- [ ] **Audit trail** — Log all admin actions (impersonation, payment recording, clinic deletion)
- [ ] **Configurable admin emails** — Move ADMIN_EMAILS from hardcoded array to DB/env

---

## Technical Improvements

### Performance
- [ ] **Redis caching layer** — Cache queue stats, clinic settings (invalidate on change)
- [ ] **Batch Socket.io emissions** — Single broadcast instead of per-patient loop
- [ ] **Stop refetching after mutations** — Trust Socket.io updates instead of re-calling API
- [ ] **Bundle optimization** — Analyze bundle size, tree-shake unused deps

### Security
- [ ] **Token revocation** — Redis blacklist for invalidated JWTs
- [ ] **Security headers** — Helmet.js + Content Security Policy
- [ ] **Patient data minimization** — Review what's exposed on public endpoints (phone enumeration risk)

### Code Quality
- [ ] **Fix type safety gaps** — Remove remaining `as any` casts
- [ ] **Consolidate socket room constants** — Single constants file instead of hardcoded strings
- [ ] **Service-layer unit tests** — queueService, subscriptionService, adminService
- [ ] **Error boundaries** — React error boundaries for graceful crash handling

### Scalability (50+ clinics)
- [ ] **Socket.io Redis adapter** — Enable multi-server Socket.io via `@socket.io/redis-adapter`
- [ ] **Database connection pooling** — Tune Prisma pool size + pgbouncer config
- [ ] **Horizontal scaling** — Load balancer + multiple API instances
- [ ] **Database read replicas** — Offload analytics queries

---

## UX Polish
- [ ] **Better phone input UX** — Show format guide (+216 XX XXX XXX), digit counter
- [ ] **Accessibility audit** — Add aria-labels to icon buttons, keyboard navigation in modals
- [ ] **Offline support** — Service worker for basic offline queue viewing
- [ ] **Calm "your turn" screen** — Option to tone down confetti for medical settings
- [ ] **Mobile haptic feedback** — Vibrate on position changes and turn notification

---

## Business
- [ ] **Trademark registration** — INNORPI filing (Class 42 + 38), ~1,200 TND
- [ ] **Referral program** — Clinic-to-clinic referral with trial extension incentive
- [ ] **Pharmacy/lab expansion** — Adapt for non-medical queues (already partially supported via businessType)
