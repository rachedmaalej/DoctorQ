# DoctorQ Implementation Roadmap

**Last Updated:** January 19, 2026
**Current Status:** Pilot launch with Dr. Kamoun (Jan 21-22, 2026)

---

## Quick Links to Detailed Plans

| Document | Description |
|----------|-------------|
| [Monitoring Dashboard Plan](docs/roadmap/MONITORING-DASHBOARD-PLAN.md) | Prometheus, Grafana, Admin Dashboard |
| [Scalability Roadmap](docs/roadmap/SCALABILITY-ROADMAP.md) | Database optimization, Redis caching, scaling to 100+ clinics |
| [Trademark Registration](docs/roadmap/TRADEMARK-REGISTRATION-TUNISIA.md) | INNORPI filing process and Nice classification |
| [Critique & Recommendations](docs/roadmap/CRITIQUE-AND-RECOMMENDATIONS.md) | Security, performance, UX issues to address |

---

## Phase 0: Pilot Launch (Jan 21-22, 2026)

**Goal:** Live deployment with Dr. Kamoun's clinic

### Pre-Launch Checklist
- [x] Demo presentation prepared ([DEMO-PLAYBOOK.md](docs/demo/DEMO-PLAYBOOK.md))
- [x] Test account created for Dr. Kamoun
- [x] QR code ready for reception
- [ ] Final demo with Dr. Kamoun (Jan 20)
- [ ] Production deployment (Jan 21-22)
- [ ] Secretary briefing (5 min training)

### Launch Day Tasks
- [ ] Create production clinic account
- [ ] Print QR code poster for reception
- [ ] Monitor first day usage
- [ ] Gather initial feedback

---

## Phase 1: Post-Launch Stabilization (Week 1-2)

**Goal:** Ensure stable operation for pilot clinic

### Critical Fixes (Security)
- [ ] Implement Socket.io token verification
- [ ] Add rate limiting to public endpoints
- [ ] Remove demo credentials from LoginPage
- [ ] Remove JWT fallback secret

### Monitoring Setup
- [ ] Set up basic Prometheus metrics endpoint
- [ ] Deploy Grafana with API health dashboard
- [ ] Configure error alerting (email)

### Bug Fixes Based on Pilot Feedback
- [ ] (To be added based on Dr. Kamoun's usage)

---

## Phase 2: Performance & Analytics (Week 3-4)

**Goal:** Optimize performance and add business visibility

### Performance Improvements
- [ ] Batch position updates (N queries → 1 query)
- [ ] Add Redis caching for queue stats
- [ ] Stop refetching after mutations (use Socket.io)
- [ ] Add React.lazy() for route code-splitting

### Admin Dashboard (Basic)
- [ ] Create `/admin` route (protected)
- [ ] Display MRR calculation (active clinics × 50 TND)
- [ ] Show active clinics list
- [ ] Basic SMS usage tracking

### Clinic Dashboard Enhancements
- [ ] Fix avg wait time bug (filter to today only)
- [ ] Add no-show count display
- [ ] Add check-in method breakdown (QR vs Manual)

---

## Phase 3: Business Foundation (Month 2)

**Goal:** Prepare for scaling beyond pilot

### Trademark Registration
- [ ] Conduct prior art search at INNORPI
- [ ] Prepare trademark application (Class 42 + 38)
- [ ] File in-person at INNORPI Tunis
- [ ] Budget: ~1,200 TND

### SMS Integration (Production)
- [ ] Activate Twilio SMS sending
- [ ] Implement "Queue Joined" notification
- [ ] Implement "Almost Your Turn" notification
- [ ] Implement "Your Turn" notification
- [ ] Add SMS cost tracking

### Second Clinic Onboarding
- [ ] Identify second pilot clinic
- [ ] Refine onboarding process
- [ ] Create clinic self-signup flow (or manual)

---

## Phase 4: Scale to 10 Clinics (Month 3-4)

**Goal:** Support 10 concurrent clinics

### Infrastructure Upgrades
- [ ] Configure database connection pooling
- [ ] Upgrade Supabase to Pro tier if needed
- [ ] Add database indexes for performance

### Admin Features
- [ ] Clinic health table (last active, patients today)
- [ ] Churn risk identification (no login 7+ days)
- [ ] Weekly stats email digest

### Code Quality
- [ ] Extract phone formatting to shared utility
- [ ] Split queue.ts into services (~1,075 lines → modules)
- [ ] Add database transactions for data integrity
- [ ] Remove console.log statements from production

---

## Phase 5: Scale to 100 Clinics (Month 5-6)

**Goal:** Production-ready SaaS platform

### Major Technical Work
- [ ] Implement batch Socket.io emissions
- [ ] Add Redis caching layer
- [ ] Horizontal scaling preparation
- [ ] Database query optimization audit

### Business Features
- [ ] Stripe subscription integration
- [ ] Self-service clinic signup
- [ ] Usage-based billing dashboard
- [ ] Automated invoice generation

### Operational
- [ ] 99.5% uptime SLA
- [ ] Email + chat support
- [ ] Guided onboarding flow

---

## Future Considerations (6+ months)

### WhatsApp Integration
- [ ] Meta Cloud API integration
- [ ] WhatsApp notification templates
- [ ] Two-way messaging support

### Multi-Doctor Support
- [ ] Multiple doctors per clinic
- [ ] Separate queues per doctor
- [ ] Shared waiting room view

### Advanced Analytics
- [ ] Predictive wait times (ML model)
- [ ] Peak hours analysis
- [ ] Patient satisfaction tracking

---

## Cost Projections

| Phase | Infrastructure | Development | Total |
|-------|---------------|-------------|-------|
| Pilot (1 clinic) | $20/mo | - | $20/mo |
| 10 clinics | $50-100/mo | 2 weeks | $100/mo |
| 100 clinics | $300-500/mo | 6 weeks | $500/mo |

### Break-Even Analysis
- **10 clinics:** 2 clinics × 50 TND covers infrastructure
- **100 clinics:** 10 clinics × 50 TND covers infrastructure
- **Target:** 50+ clinics for profitable business

---

## Weekly Review Checklist

Use this checklist during your weekly planning:

### This Week's Focus
- [ ] Review pilot clinic feedback
- [ ] Check error logs and alerts
- [ ] Review SMS costs
- [ ] Update this roadmap

### Upcoming Decisions
- [ ] When to activate SMS notifications?
- [ ] Timeline for second clinic?
- [ ] Trademark filing date?

---

## Notes

- **Demo files:** [docs/demo/](docs/demo/)
- **Technical docs:** [docs/technical/](docs/technical/)
- **Business docs:** [docs/business/](docs/business/)
- **Design docs:** [docs/design/](docs/design/)

---

*This roadmap is a living document. Update it weekly based on actual progress and learnings from the pilot.*
