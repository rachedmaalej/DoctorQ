# DoctorQ Project Charter

**Version:** 1.0
**Date:** January 2026
**Status:** Active
**Project Code:** DOCQ-MVP-2026

---

## Executive Summary

### Problem Statement
Independent doctors in Tunisia operate same-day appointment systems where patients receive appointments for a **specific day** but not a **specific time**. This results in unpredictable wait times ranging from 30 minutes to 3+ hours, with patients having no visibility into their queue position. Consequently, patients waste valuable time waiting in crowded clinics, doctors meet frustrated patients, and receptionists field constant "how long until my turn?" inquiries.

### Proposed Solution
DoctorQ is a lightweight virtual queue management system that enables same-day queue visibility through real-time position tracking via SMS/WhatsApp. Patients can check in via QR code scan or receptionist registration, then wait elsewhere (café, car, home) while monitoring their queue position on a mobile-friendly web page. The system sends automated notifications when their turn approaches, allowing patients to arrive just in time for their consultation.

### Business Opportunity
- **Target Market:** Independent medical practices in Tunisia (private clinics, not hospitals)
- **Pricing Model:** 50 TND/month (~$16 USD) per clinic
- **Break-even:** 10 clinics generating ~$160/month revenue
- **Target Scale:** 50-100 clinics for viable business (~$800-$1,600/month revenue)
- **Market Size:** Estimated 3,000+ independent doctors in greater Tunis area alone

### Success Metrics
- **Technical:** 95%+ SMS delivery rate, <5 second page load, 99% uptime
- **Business:** 3 pilot clinics by Week 6, 10 paying clinics by Month 3
- **User Satisfaction:** <5 support requests per clinic per week, positive receptionist feedback

---

## Project Objectives

### Primary Objectives (SMART Goals)

1. **Launch MVP by Week 6 (February 2026)**
   - Specific: Functional queue management system with QR check-in, SMS notifications, real-time updates
   - Measurable: All P0 features complete, 80% test coverage
   - Achievable: 6-week timeline with focused scope
   - Relevant: Enables pilot clinic onboarding
   - Time-bound: 6 weeks from project start

2. **Onboard 3 Pilot Clinics by Week 6**
   - Specific: 3 independent doctors in Tunis using system daily
   - Measurable: 50+ patients checked in across 3 clinics in first week
   - Achievable: Targeted outreach to existing medical contacts
   - Relevant: Validates product-market fit
   - Time-bound: By MVP launch date

3. **Achieve 95%+ SMS Delivery Rate**
   - Specific: Successful SMS delivery to Tunisian mobile numbers
   - Measurable: Twilio delivery reports tracked daily
   - Achievable: Using reliable SMS provider (Twilio)
   - Relevant: Critical for user experience and trust
   - Time-bound: Maintained throughout pilot phase

4. **Reach 10 Paying Clinics by Month 3**
   - Specific: 10 clinics paying 50 TND/month subscription
   - Measurable: 500 TND/month recurring revenue (~$160 USD)
   - Achievable: Referrals from successful pilots
   - Relevant: Achieves break-even point
   - Time-bound: 3 months post-launch

### Secondary Objectives

- Maintain <5 second average page load time for patient status pages
- Keep SMS cost per clinic below 15 TND/month through WhatsApp adoption
- Achieve 80%+ patient satisfaction (informal surveys during pilot)
- Document learnings for v1.1 feature prioritization

---

## Stakeholders

### Primary Stakeholders

| Stakeholder | Role | Interest | Influence | Engagement Strategy |
|-------------|------|----------|-----------|---------------------|
| **Clinic Owners/Doctors** | End customer, decision maker | Efficient patient flow, happy patients, modern practice image | High | Weekly check-ins during pilot, feature roadmap input |
| **Receptionists** | Daily user, system champion | Easy-to-use interface, reduced interruptions, clear queue visibility | High | Training sessions, direct feedback channel (WhatsApp group) |
| **Patients** | End beneficiary | Know wait time, avoid wasted waiting, timely arrival | Medium | Indirect via SMS/status page, optional feedback form post-visit |
| **Project Sponsor/Founder** | Funding, strategic direction | ROI, market validation, scalable product | Very High | Weekly status updates, decision approval for scope changes |

### Secondary Stakeholders

| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| **Development Team** | Implementation | Clear requirements, technical feasibility, maintainable codebase | Medium |
| **Twilio/SMS Provider** | External service provider | API usage, payment reliability | Low |
| **Vercel/Railway Hosting** | Infrastructure provider | Deployment success, resource usage | Low |

---

## Project Governance

### Decision-Making Authority

**Level 1: Strategic Decisions (Founder/Sponsor)**
- Scope changes affecting timeline or budget
- Adding/removing P0 features
- Pricing model adjustments
- Pivot decisions based on pilot feedback

**Level 2: Tactical Decisions (Development Team)**
- Technology stack choices within approved options (React vs Vue: approved, Next.js vs Vite: approved)
- Database schema refinements for performance
- API endpoint design patterns
- UI component implementation details

**Level 3: Operational Decisions (Individual Contributors)**
- Code structure and organization
- Test coverage strategies
- Linting and formatting rules
- Minor UI polish and bug fixes

### Escalation Path

1. **Technical Blockers** → Senior Developer → Project Sponsor (if budget/timeline impact)
2. **Scope Creep Requests** → Document in "P1/P2 Backlog" → Review in weekly sync
3. **Critical Bugs in Production** → Immediate hotfix → Post-mortem within 24 hours
4. **Pilot Clinic Dissatisfaction** → Founder directly engages within 4 hours

### Change Control Process

**For Scope Changes:**
1. Document requested change with business justification
2. Assess impact on timeline, budget, and existing features
3. Classify as P0 (MVP blocker), P1 (v1.1), or P2 (future)
4. Sponsor approval required for any P0 additions
5. Communicate decision to all stakeholders within 24 hours

**For Technical Changes:**
1. Create technical proposal document
2. Review with development team
3. Validate against non-functional requirements (performance, security)
4. Implement with test coverage
5. Document in technical specs

---

## Assumptions

### Business Assumptions
1. Tunisian doctors are willing to adopt digital queue management at 50 TND/month
2. Patients have mobile phones capable of receiving SMS and opening web links
3. SMS delivery to Tunisian numbers is reliable via Twilio (95%+ delivery rate)
4. Receptionists can learn the system in <15 minutes of training
5. QR code scanning is familiar to target patient demographic (urban, middle class)

### Technical Assumptions
1. Vercel and Railway provide sufficient free tier for pilot phase
2. PostgreSQL can handle 10 clinics × 50 patients/day = 500 active queue entries
3. Socket.io real-time updates work on 3G Tunisian mobile networks
4. Twilio SMS costs remain stable at ~$0.03 per message to Tunisia
5. React + Tailwind can support Arabic RTL without major rework

### Market Assumptions
1. Independent doctors in Tunis represent a viable initial market
2. Referrals from successful pilots will drive organic growth
3. No direct competitors offering similar solution at comparable price in Tunisia
4. WhatsApp Business API availability in Tunisia (for P1 features)

---

## Constraints

### Budget Constraints
- **Development Budget:** Bootstrapped, no external funding
- **Operating Costs:** Must remain under 20 TND/clinic/month to maintain margin
- **Pilot Phase:** Free for 3 pilot clinics for first 2 months

### Timeline Constraints
- **MVP Launch:** Hard deadline at Week 6 (February 2026)
- **Pilot Duration:** Minimum 2 weeks before scaling to paying clinics
- **Market Window:** Pre-summer launch critical (March-April) before vacation season

### Resource Constraints
- **Development Team:** Solo developer (founder) + Claude Code assistance
- **Support Capacity:** Founder handles all support during pilot
- **Infrastructure:** Free tiers only during pilot (Vercel, Railway, PostgreSQL)

### Technical Constraints
- **Mobile-First:** Must work on 3G networks (common in Tunisia)
- **No App Store:** Web-only (no native iOS/Android apps due to time/cost)
- **SMS Dependency:** Core functionality requires reliable SMS delivery
- **Language Support:** Must support French and Arabic from day 1

---

## Dependencies

### External Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **Twilio SMS Delivery** | Critical | Medium | Have backup provider (Karix) researched; test delivery rates weekly |
| **Vercel Uptime** | Critical | Low | Vercel has 99.9% SLA; deploy to multiple regions if needed |
| **Railway PostgreSQL** | Critical | Medium | Daily automated backups; migration plan to dedicated hosting |
| **Internet Connectivity (Clinics)** | High | Medium | System works offline for doctor dashboard (PWA cache) |
| **Internet Connectivity (Patients)** | High | Low | SMS notifications work without internet; status page requires connection |

### Internal Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **Database Schema Completion** | Blocks backend development | High | Complete by end of Week 1 |
| **API Specification** | Blocks frontend integration | High | Define contracts in Week 1 |
| **SMS Template Translation** | Blocks notification testing | Medium | Engage French/Arabic translator early |
| **QR Code Generation** | Blocks check-in flow | Medium | Use established library (qrcode.react) |

---

## Risk Register

### High-Priority Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| **R1** | SMS delivery rate <90% in Tunisia | Medium | Critical | Test with multiple providers (Twilio, Karix); negotiate backup with Orange Tunisia Business | Founder |
| **R2** | Pilot clinics not satisfied with UX | Medium | High | Daily check-ins first week; rapid iteration on feedback; offer full refund option | Founder |
| **R3** | Scope creep delays MVP launch | High | High | Strict P0-only policy; document all P1 requests for v1.1; weekly scope review | Founder |
| **R4** | Solo developer capacity overload | Medium | High | Use Claude Code for acceleration; ruthlessly cut P0 scope if needed; delay v1.1 instead | Founder |
| **R5** | Twilio/WhatsApp costs exceed budget | Low | Medium | Monitor daily costs; encourage WhatsApp adoption (cheaper); set hard SMS limits per clinic | Founder |

### Medium-Priority Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| **R6** | Tunisian doctors prefer in-person sales | Medium | Medium | Offer free 1-month trial; focus on modern, tech-savvy clinics first | Founder |
| **R7** | Patients uncomfortable with QR codes | Low | Medium | Fallback to receptionist manual add; provide laminated instructions in clinic | Founder |
| **R8** | Arabic RTL implementation delays | Low | Medium | Start i18n work in Week 2; test early with Arabic-speaking testers | Dev Team |
| **R9** | Competition launches similar product | Low | High | Move fast to capture market first; build clinic loyalty through excellent support | Founder |
| **R10** | PostgreSQL performance issues at scale | Low | Medium | Proper indexing from start; load testing at 50 clinics; upgrade plan ready | Dev Team |

---

## Timeline & Milestones

### Phase-Based Timeline

| Phase | Duration | Dates | Key Deliverable | Success Criteria |
|-------|----------|-------|-----------------|------------------|
| **Phase 1: Foundation** | Weeks 1-2 | Jan 13-26 | Working queue dashboard + API | Receptionist can add/remove patients, see real-time updates |
| **Phase 2: Patient Flow** | Week 3 | Jan 27-Feb 2 | Patient check-in + status page | Patient scans QR → sees position → page auto-updates |
| **Phase 3: Notifications** | Week 4 | Feb 3-9 | SMS integration + i18n | Patient receives 3 SMS (joined, almost turn, your turn) in French/Arabic |
| **Phase 4: Polish & Test** | Week 5 | Feb 10-16 | 80% test coverage, mobile responsive | All P0 features tested, no critical bugs, WCAG AA compliant |
| **Phase 5: Deploy & Pilot** | Week 6 | Feb 17-23 | Live system with 3 pilot clinics | 3 clinics using daily, 50+ patients checked in, 95%+ SMS delivery |
| **Phase 6: Iteration** | Weeks 7-8 | Feb 24-Mar 9 | v1.1 with WhatsApp + analytics | 10 paying clinics, break-even achieved |

### Critical Milestones

| Milestone | Target Date | Deliverable | Approval Required |
|-----------|-------------|-------------|-------------------|
| **M1:** Database Schema Complete | Jan 17 (Week 1) | Prisma schema with migrations | Dev Team |
| **M2:** API Specification Frozen | Jan 19 (Week 1) | OpenAPI spec, all endpoints defined | Dev Team |
| **M3:** MVP Feature-Complete | Feb 16 (Week 5) | All P0 features implemented and tested | Founder |
| **M4:** Production Deployment | Feb 17 (Week 6) | Deployed to Vercel + Railway, health checks pass | Founder |
| **M5:** First Pilot Clinic Live | Feb 17 (Week 6) | Clinic using system for real patients | Founder |
| **M6:** All Pilots Onboarded | Feb 20 (Week 6) | 3 clinics actively using, trained, satisfied | Founder |
| **M7:** Break-Even (10 Clinics)** | Mar 31 (Month 3) | 500 TND/month revenue, costs covered | Founder |

---

## Budget Allocation

### Development Phase Budget (Weeks 1-6)

| Category | Cost (TND) | Cost (USD) | Notes |
|----------|------------|------------|-------|
| **Development Time** | 0 | 0 | Founder equity (sweat equity) |
| **Infrastructure (Pilot)** | 0 | 0 | Vercel + Railway free tiers |
| **Twilio SMS Credits** | 150 | $48 | 500 test messages + 3 clinics × 2 weeks × 100 SMS |
| **Domain + SSL** | 40 | $13 | doctorq.tn domain for 1 year |
| **Design Assets** | 0 | 0 | Use free Google Fonts, icons |
| **Total Phase 1-6** | 190 | $61 | Bootstrap-friendly budget |

### Operating Budget (Per Month, Post-Launch)

| Category | Per Clinic (TND) | For 10 Clinics (TND) | For 50 Clinics (TND) | Notes |
|----------|------------------|---------------------|---------------------|-------|
| **SMS (200/clinic)** | 9 | 90 | 450 | Twilio to Tunisia ~0.045 TND/SMS |
| **WhatsApp (50/clinic)** | 3 | 30 | 150 | Meta Cloud API ~0.06 TND/msg |
| **Hosting (shared)** | 2 | 20 | 100 | Vercel Pro + Railway Pro + PostgreSQL |
| **Subtotal Costs** | 14 | 140 | 700 | Average 14 TND/clinic/month |
| **Revenue (50 TND/clinic)** | 50 | 500 | 2,500 | Subscription pricing |
| **Gross Margin** | 36 | 360 | 1,800 | 72% gross margin |

**Break-Even Analysis:**
- **Fixed Costs:** ~40 TND/month (domain, SSL, base hosting)
- **Variable Costs:** 14 TND/clinic/month
- **Revenue:** 50 TND/clinic/month
- **Contribution Margin:** 36 TND/clinic
- **Break-Even:** 40 / 36 = ~2 clinics (accounting for fixed costs; 10 clinics for comfortable margin)

---

## Sign-Off Criteria

### Phase 1-2 Sign-Off (Week 2)
- [ ] Database schema complete with migrations
- [ ] API endpoints functional and tested
- [ ] Doctor dashboard renders queue with real-time updates
- [ ] Add/remove patient works end-to-end
- [ ] Socket.io events properly emit and received

### Phase 3 Sign-Off (Week 4)
- [ ] Patient can scan QR code and check in
- [ ] Patient status page shows position and estimated wait
- [ ] SMS notifications sent successfully to Tunisian numbers
- [ ] French and Arabic translations complete with RTL support
- [ ] Notification routing based on checkInMethod works

### MVP Launch Sign-Off (Week 6)
- [ ] All P0 features implemented and tested
- [ ] 80%+ test coverage achieved
- [ ] No critical or high-severity bugs
- [ ] Performance benchmarks met (<5s page load, <2s API response)
- [ ] Security audit passed (OWASP top 10 checked)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Production deployment successful
- [ ] 3 pilot clinics onboarded and trained
- [ ] Monitoring and alerting configured
- [ ] Backup and rollback procedures tested

### Business Viability Sign-Off (Month 3)
- [ ] 10+ paying clinics acquired
- [ ] 95%+ SMS delivery rate maintained
- [ ] <5 support requests per clinic per week
- [ ] Positive qualitative feedback from clinics
- [ ] Break-even achieved (revenue > costs)
- [ ] Referral pipeline established
- [ ] P1 feature roadmap defined based on pilot learnings

---

## Communication Plan

### Weekly Status Updates (Every Monday)
- **Audience:** Founder/Sponsor
- **Format:** Written summary (email or Notion doc)
- **Contents:** Progress vs plan, blockers, decisions needed, upcoming week priorities

### Pilot Clinic Check-Ins (Daily Week 1, then Weekly)
- **Audience:** 3 pilot clinic receptionists + doctors
- **Format:** WhatsApp group messages + optional calls
- **Contents:** Issues reported, feature requests, usage stats, satisfaction pulse check

### Monthly Business Review (Month 2, 3, 4)
- **Audience:** Founder + stakeholders
- **Format:** Presentation deck + data dashboard
- **Contents:** Clinic count, revenue, costs, user satisfaction, churn rate, roadmap

---

## Success Measures

### Technical KPIs
- **Uptime:** 99%+ availability (measured via Vercel/Railway dashboards)
- **Performance:** <5s page load (p95), <2s API response time (p95)
- **SMS Delivery:** 95%+ successful delivery rate (Twilio reports)
- **Error Rate:** <1% of API requests result in 5xx errors

### User Satisfaction KPIs
- **Support Volume:** <5 support requests per clinic per week
- **Receptionist NPS:** Net Promoter Score >50 (would you recommend to colleague?)
- **Patient Feedback:** <10% negative feedback on wait time communication
- **Churn Rate:** <10% monthly churn (clinics canceling subscription)

### Business KPIs
- **Clinic Acquisition:** 3 pilots by Week 6, 10 paying by Month 3, 50 by Month 12
- **Revenue:** 500 TND/month by Month 3, 2,500 TND/month by Month 12
- **Gross Margin:** 70%+ maintained as scale increases
- **CAC Payback:** <3 months (acquire clinic, break even on acquisition cost in 3 months)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 11, 2026 | Project Founder | Initial charter creation |

**Next Review Date:** February 1, 2026 (post-Phase 3)

**Document Owner:** Project Founder
**Approvers:** Project Sponsor (Founder)

---

## References

- [MVP-SPECIFICATION.md](MVP-SPECIFICATION.md) - Detailed feature specifications
- [CLAUDE.md](CLAUDE.md) - Technical development guide
- [02_MVP_Scope_Definition.md](02_MVP_Scope_Definition.md) - Detailed scope breakdown
- [03_Complete_Cost_Breakdown.md](03_Complete_Cost_Breakdown.md) - Financial analysis

---

**Charter Status:** ✅ **APPROVED** - Ready for Phase 1 execution
