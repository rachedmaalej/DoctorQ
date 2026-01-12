# 13_Launch_Checklist.md

## Overview

This document provides a comprehensive pre-launch verification checklist, deployment procedures, post-launch monitoring plan, and rollback procedures for DoctorQ. Following this checklist ensures a smooth, safe production launch.

## Table of Contents

1. [Pre-Launch Verification](#pre-launch-verification)
2. [Deployment Steps](#deployment-steps)
3. [Post-Launch Monitoring](#post-launch-monitoring)
4. [Rollback Procedure](#rollback-procedure)
5. [Pilot Clinic Onboarding](#pilot-clinic-onboarding)
6. [Success Criteria](#success-criteria)

---

## Pre-Launch Verification

### Code Quality Checks

**Tests:**
- [ ] All unit tests passing (80%+ coverage achieved)
- [ ] All integration tests passing
- [ ] E2E tests passing for critical flows
- [ ] Performance tests meet targets (p95 < 2s API response)
- [ ] Load test successful (100 concurrent users)
- [ ] No failing tests in CI/CD pipeline

**Code Quality:**
- [ ] `pnpm lint` - No linting errors
- [ ] `pnpm typecheck` - No TypeScript errors
- [ ] `pnpm format:check` - Code formatted consistently
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments in critical paths
- [ ] Git hooks working (pre-commit, pre-push)

**Security:**
- [ ] OWASP Top 10 vulnerabilities checked
- [ ] No API keys or secrets in code
- [ ] All environment variables documented
- [ ] SQL injection prevention verified (Prisma parameterized queries)
- [ ] XSS prevention verified (React escaping)
- [ ] CSRF protection not needed (stateless JWT)
- [ ] Rate limiting configured on all endpoints
- [ ] Authentication middleware tested
- [ ] CORS properly configured (only allowed origins)
- [ ] HTTPS enforced in production
- [ ] Security headers set (helmet.js)

**Performance:**
- [ ] Page load time < 5 seconds (tested on 3G)
- [ ] API response time p95 < 2 seconds
- [ ] Database queries optimized (indexes verified)
- [ ] Code splitting implemented (React.lazy)
- [ ] Images optimized
- [ ] Unused dependencies removed
- [ ] Bundle size acceptable (< 500KB gzipped)

**Accessibility:**
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Color contrast ratios ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] ARIA labels on interactive elements
- [ ] Form validation errors announced
- [ ] Language attributes set (lang="fr" or "ar")
- [ ] RTL layout works for Arabic

### Feature Completeness

**P0 Features (MVP Blockers):**
- [ ] Clinic login/logout
- [ ] Add patient to queue (manual)
- [ ] Patient self-check-in via QR code
- [ ] Display queue dashboard (doctor view)
- [ ] Real-time queue updates (Socket.io)
- [ ] Call next patient functionality
- [ ] Mark patient as completed/no-show
- [ ] Patient status page with position
- [ ] SMS notifications (queue joined, almost turn, your turn)
- [ ] French translations complete
- [ ] Arabic translations complete
- [ ] Mobile responsive design
- [ ] QR code generation

**Out of Scope (Confirmed):**
- [ ] WhatsApp integration (P1 - post-launch)
- [ ] Multi-doctor support (P1)
- [ ] Patient accounts (P2)
- [ ] Advanced analytics (P1)
- [ ] Appointment booking (P2)

### Integration Testing

**Twilio SMS:**
- [ ] Twilio account created and funded
- [ ] Tunisia phone number purchased or configured
- [ ] SMS delivery tested to Tunisian numbers (+216)
- [ ] French SMS templates working
- [ ] Arabic SMS templates working
- [ ] SMS retry logic tested (3 retries with backoff)
- [ ] Daily SMS limit configured (500/clinic/day)
- [ ] Failed SMS notifications logged
- [ ] Delivery receipts working

**Database:**
- [ ] Production PostgreSQL database provisioned
- [ ] Database backups configured (daily automated)
- [ ] Migrations tested in staging
- [ ] Seed data script works
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Backup restoration tested

**Real-time (Socket.io):**
- [ ] WebSocket connections working
- [ ] Room joining/leaving tested
- [ ] Events emitted correctly
- [ ] Fallback to polling works
- [ ] Reconnection logic tested
- [ ] No memory leaks in long-running connections

### Environment Configuration

**Production Environment Variables:**

**Frontend (.env.production):**
- [ ] `VITE_API_URL` set to production API URL
- [ ] `VITE_SOCKET_URL` set to production WebSocket URL
- [ ] `VITE_DEFAULT_LANGUAGE` set to "fr"
- [ ] No development URLs in production

**Backend (.env.production):**
- [ ] `DATABASE_URL` set to production database
- [ ] `JWT_SECRET` generated (strong 32+ char secret)
- [ ] `JWT_EXPIRES_IN` set to "7d"
- [ ] `TWILIO_ACCOUNT_SID` set
- [ ] `TWILIO_AUTH_TOKEN` set
- [ ] `TWILIO_PHONE_NUMBER` set (Tunisia number)
- [ ] `PORT` set (default: 3001)
- [ ] `NODE_ENV` set to "production"
- [ ] `CORS_ORIGIN` set to production frontend URL
- [ ] `FRONTEND_URL` set for SMS links
- [ ] `LOG_LEVEL` set to "info" (not "debug")

**SSL/TLS:**
- [ ] SSL certificates installed
- [ ] HTTPS working for frontend
- [ ] HTTPS working for backend API
- [ ] WebSocket Secure (WSS) working
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured

**DNS:**
- [ ] `doctorq.tn` points to frontend (Vercel)
- [ ] `api.doctorq.tn` points to backend (Railway/Render)
- [ ] `q.doctorq.tn` short URL configured (for SMS)
- [ ] DNS propagation verified (nslookup/dig)

### Monitoring & Alerts

**Error Tracking (Sentry):**
- [ ] Sentry project created
- [ ] Frontend Sentry SDK configured
- [ ] Backend Sentry SDK configured
- [ ] Source maps uploaded
- [ ] Error alerts configured (email/Slack)
- [ ] Test error sent and received

**Analytics (Vercel Analytics):**
- [ ] Vercel Analytics enabled
- [ ] Page view tracking working
- [ ] Core Web Vitals monitored

**Logging:**
- [ ] Structured logging implemented (Winston/Pino)
- [ ] Log levels configured (info, warn, error)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Log aggregation configured (optional: Datadog, LogDNA)

**Health Checks:**
- [ ] `/health` endpoint returns 200 OK
- [ ] Database connectivity checked in health endpoint
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)

---

## Deployment Steps

### Pre-Deployment

**1. Code Freeze:**
```bash
# Create release branch
git checkout -b release/v1.0.0

# Tag release
git tag -a v1.0.0 -m "MVP Launch - v1.0.0"

# Push tag
git push origin v1.0.0
```

**2. Final Testing in Staging:**
```bash
# Deploy to staging
pnpm deploy:staging

# Run smoke tests
pnpm test:e2e --env=staging

# Manual testing checklist
# - Login/logout
# - Add patient
# - QR check-in
# - Call next patient
# - SMS delivery
# - Real-time updates
```

**3. Database Migration (Staging First):**
```bash
# Run migrations on staging database
pnpm db:migrate:deploy --env=staging

# Verify migrations successful
pnpm db:studio --env=staging

# Backup staging database
pg_dump staging_db > staging_backup_$(date +%Y%m%d).sql
```

### Production Deployment

**Step 1: Backup Production Database (if exists)**
```bash
# Create backup before deployment
pg_dump production_db > production_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list production_backup_*.sql
```

**Step 2: Deploy Backend to Railway/Render**

**Railway:**
```bash
# Connect to Railway
railway login

# Set environment to production
railway environment production

# Deploy backend
git push railway main

# Monitor deployment logs
railway logs

# Verify deployment
curl https://api.doctorq.tn/health
```

**Render (Alternative):**
```bash
# Push to main branch triggers auto-deploy
git push origin main

# Monitor in Render dashboard
# https://dashboard.render.com
```

**Step 3: Run Database Migrations**
```bash
# SSH into backend container or run via Railway CLI
railway run pnpm db:migrate:deploy

# Verify migration success
railway run pnpm prisma db pull
```

**Step 4: Deploy Frontend to Vercel**
```bash
# Vercel auto-deploys from main branch
git push origin main

# Or manual deployment
vercel --prod

# Monitor deployment
vercel logs https://doctorq.tn
```

**Step 5: Verify Deployment**

**Health Checks:**
```bash
# Backend health
curl https://api.doctorq.tn/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend
curl -I https://doctorq.tn
# Expected: HTTP/2 200

# WebSocket
wscat -c wss://api.doctorq.tn
# Expected: Connected
```

**Smoke Tests:**
1. **Login:**
   - Go to https://doctorq.tn/login
   - Enter test clinic credentials
   - Verify redirect to dashboard

2. **Add Patient:**
   - Click "Ajouter un Patient"
   - Enter phone: +216 98 123 456
   - Verify patient appears in queue
   - **IMPORTANT:** Verify SMS actually sent (check phone)

3. **QR Check-in:**
   - Generate QR code
   - Scan with phone
   - Enter phone number
   - Verify redirect to status page
   - Verify SMS received

4. **Call Next Patient:**
   - Click "Appeler Suivant"
   - Verify patient status updates
   - Verify SMS "Your Turn" sent
   - Verify real-time update on patient page

5. **Real-time Updates:**
   - Open patient status page on phone
   - Call next patient from dashboard
   - Verify page updates without refresh (< 2 seconds)

**Step 6: Monitor for Issues (First 30 minutes)**
- [ ] Check Sentry for errors (should be 0 critical errors)
- [ ] Monitor API response times (p95 < 2s)
- [ ] Check SMS delivery rate (should be > 95%)
- [ ] Verify WebSocket connections stable
- [ ] Monitor server resources (CPU < 70%, Memory < 80%)
- [ ] Check database connection pool (no exhaustion)

---

## Post-Launch Monitoring

### First 24 Hours - Critical Monitoring

**Every 2 Hours:**
- [ ] Check Sentry error rate (target: < 1% error rate)
- [ ] Monitor API response times (p95 < 2s, p99 < 5s)
- [ ] Verify SMS delivery rate (> 95% successful)
- [ ] Check database performance (query time < 50ms)
- [ ] Monitor server resources:
  - CPU usage < 70%
  - Memory usage < 80%
  - Disk usage < 75%
- [ ] Verify WebSocket connection stability
- [ ] Check log files for warnings

**Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error rate | < 1% | > 2% |
| API p95 response time | < 2s | > 3s |
| SMS delivery rate | > 95% | < 90% |
| Page load time | < 5s | > 7s |
| Database query time | < 50ms | > 100ms |
| Uptime | 99.9% | < 99% |

**Sentry Alerts:**
- [ ] Configure alert for > 10 errors/minute
- [ ] Configure alert for any 500 errors
- [ ] Configure alert for failed database connections

**User Metrics:**
- [ ] Track number of check-ins
- [ ] Track number of SMS sent
- [ ] Track average queue length
- [ ] Track average wait time
- [ ] Track no-show rate

### First Week - Daily Check-in

**Daily Tasks:**
- [ ] Review Sentry errors (triage and fix critical issues)
- [ ] Analyze SMS costs vs budget (should be ~14 TND/clinic/day)
- [ ] Check with pilot clinics:
  - Any issues encountered?
  - Feature requests?
  - Overall satisfaction (1-10 score)
- [ ] Monitor database growth (estimate scaling needs)
- [ ] Review API usage patterns (identify optimizations)
- [ ] Check backup success (daily backups running)

**Weekly Metrics Report:**
```markdown
## Week 1 Report

**System Health:**
- Uptime: 99.9%
- Error rate: 0.5%
- Avg API response: 850ms (p95: 1.8s)

**Usage:**
- Total check-ins: 150
- SMS sent: 450 (3 per patient avg)
- Active clinics: 3
- Avg patients/clinic/day: 10

**Costs:**
- SMS: 42 TND (~14 TND/clinic)
- Hosting: 40 TND
- Total: 82 TND

**Issues:**
- 2 minor bugs fixed
- 0 critical incidents
- 1 feature request received

**Next Steps:**
- Fix remaining minor bugs
- Optimize SMS template length (reduce cost)
- Onboard 2 more pilot clinics
```

---

## Rollback Procedure

### When to Rollback

**Critical Issues (Immediate Rollback):**
- Database corruption or data loss
- Authentication completely broken
- SMS notifications not sending (0% delivery)
- Critical security vulnerability discovered
- Widespread crashes (> 50% error rate)
- Payment processing issues (if applicable)

**Non-Critical Issues (Fix Forward):**
- Minor UI bugs
- Slow performance (but functional)
- Single feature broken (not core flow)
- Low SMS delivery rate (< 95% but > 50%)

### Rollback Steps

**Step 1: Announce Rollback**
```bash
# Post in team Slack/communication channel
"🚨 ROLLBACK IN PROGRESS - v1.0.0 → v0.9.0 due to [ISSUE]"

# Notify pilot clinics via WhatsApp
"Maintenance en cours - 10 minutes. Service sera rétabli bientôt."
```

**Step 2: Revert Backend**

**Railway:**
```bash
# Rollback to previous deployment
railway rollback

# Or redeploy previous tag
git checkout v0.9.0
git push railway v0.9.0:main
```

**Render:**
```bash
# Use Render dashboard to rollback to previous deploy
# Settings → Deploys → [Previous Deploy] → "Rollback to this version"
```

**Step 3: Revert Database Migrations (if needed)**
```bash
# Restore from backup
pg_restore -d production_db production_backup_YYYYMMDD_HHMMSS.sql

# Or rollback migrations (if no data loss)
railway run pnpm prisma migrate resolve --rolled-back migration_name
```

**Step 4: Revert Frontend**

**Vercel:**
```bash
# Rollback via Vercel dashboard
# Deployments → [Previous Deployment] → "Promote to Production"

# Or redeploy previous tag
git checkout v0.9.0
vercel --prod
```

**Step 5: Verify Rollback Successful**
```bash
# Check health
curl https://api.doctorq.tn/health

# Test critical flows
# 1. Login
# 2. Add patient
# 3. SMS delivery

# Monitor errors in Sentry (should drop to normal levels)
```

**Step 6: Post-Mortem**
```markdown
## Incident Post-Mortem

**Date:** 2025-01-11
**Duration:** 15 minutes
**Severity:** Critical

**Issue:**
[Describe what went wrong]

**Root Cause:**
[Why it happened]

**Impact:**
- X users affected
- Y failed operations
- Z TND revenue impact

**Timeline:**
- 10:00 - Deployment started
- 10:05 - Issue detected
- 10:08 - Rollback initiated
- 10:15 - Service restored

**Resolution:**
- Rolled back to v0.9.0
- Fixed issue in v1.0.1
- Redeployed with additional testing

**Prevention:**
- Add test for this scenario
- Improve staging testing process
- Add monitoring for early detection
```

---

## Pilot Clinic Onboarding

### Pre-Onboarding Preparation

**For Each Pilot Clinic:**
- [ ] Create clinic account in production database
- [ ] Generate strong password (share securely)
- [ ] Generate QR code for check-in
- [ ] Print QR code poster (A4 size, high quality)
- [ ] Prepare training materials (15-min guide)
- [ ] Create WhatsApp support group
- [ ] Schedule onboarding session (30 min)

### Onboarding Checklist

**Day 1: Initial Setup (30 minutes)**

1. **Account Setup:**
   - [ ] Receptionist logs in successfully
   - [ ] Update clinic settings (name, doctor name, avg consultation time)
   - [ ] Test adding patient manually
   - [ ] Test calling next patient
   - [ ] Verify SMS received (use receptionist's phone)

2. **QR Code Installation:**
   - [ ] Print QR code poster
   - [ ] Place in visible location (waiting room)
   - [ ] Test QR code scan with phone
   - [ ] Verify check-in flow works

3. **Training:**
   - [ ] Show how to add patient manually
   - [ ] Show how to call next patient
   - [ ] Show how to mark completed/no-show
   - [ ] Explain patient experience (SMS + status page)
   - [ ] Provide support contact (WhatsApp)

**Day 1-7: Daily Check-in**

**Daily Call with Clinic:**
- [ ] Any issues encountered?
- [ ] How many patients today?
- [ ] SMS delivery working?
- [ ] Any feature requests?
- [ ] Overall experience (1-10)?

**Support Provided:**
- [ ] Immediate response to issues (< 30 min)
- [ ] On-site visit if needed
- [ ] Training reinforcement

**Day 7: Review Meeting**

**Metrics to Review:**
- Total patients handled
- Average wait time
- No-show rate
- SMS delivery rate
- Receptionist satisfaction
- Patient feedback

**Questions:**
- [ ] Would you recommend to colleagues?
- [ ] What would you change?
- [ ] Worth 50 TND/month?
- [ ] Ready to continue after pilot?

---

## Success Criteria

### First Week Goals

**System Metrics:**
- [ ] 99.5%+ uptime
- [ ] < 1% error rate
- [ ] > 95% SMS delivery rate
- [ ] p95 API response < 2s
- [ ] 0 critical bugs

**Usage Metrics:**
- [ ] 3 pilot clinics actively using
- [ ] 50+ patients checked in total
- [ ] 150+ SMS sent successfully
- [ ] 10+ patients per clinic per day average
- [ ] Real-time updates working reliably

**Business Metrics:**
- [ ] 0 clinic churn (all 3 continue)
- [ ] > 8/10 satisfaction score from receptionists
- [ ] Positive qualitative feedback
- [ ] At least 2 clinics willing to pay
- [ ] SMS costs within budget (< 20 TND/clinic/week)

**Technical Debt:**
- [ ] < 5 support requests per clinic
- [ ] All reported bugs triaged
- [ ] Critical bugs fixed within 24h
- [ ] Minor bugs backlogged

### First Month Goals

**Scaling:**
- [ ] Onboard 7 more clinics (total 10)
- [ ] Handle 500+ patients/week
- [ ] 2000+ SMS sent/week
- [ ] Maintain 99.5%+ uptime

**Financial:**
- [ ] Break-even revenue (10 clinics × 50 TND = 500 TND/month)
- [ ] SMS costs optimized (< 15 TND/clinic/month)
- [ ] Total costs < 400 TND/month
- [ ] Positive unit economics

**Product:**
- [ ] Prioritize P1 features based on feedback
- [ ] Plan WhatsApp integration (high ROI)
- [ ] Design analytics dashboard
- [ ] Roadmap for v1.1

---

## Next Steps After Launch

### Immediate (Week 1-2):
1. Fix critical bugs from pilot feedback
2. Optimize SMS costs (reduce message length, encourage WhatsApp)
3. Onboard 2 more pilot clinics
4. Set up automated daily reports

### Short-term (Month 1):
1. Scale to 10 clinics
2. Implement WhatsApp Business API (P1)
3. Add basic analytics dashboard
4. Optimize performance based on real usage

### Medium-term (Month 2-3):
1. Reach 25 clinics
2. Implement P1 features
3. Hire support person
4. Set up customer success process

---

## Related Documents

- **Pre-Deployment**: See [04_Development_Environment_Setup.md](./04_Development_Environment_Setup.md)
- **Testing**: See [12_Testing_Plan.md](./12_Testing_Plan.md)
- **Monitoring**: See [05_Technical_Architecture.md](./05_Technical_Architecture.md#deployment-architecture)
- **Phase Planning**: See [15_Project_Phases.md](./15_Project_Phases.md)
