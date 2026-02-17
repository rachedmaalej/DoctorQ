# DoctorQ Testing Plan: Preparing for Early Adopter Release

**Prepared by:** UX/Product Strategy Consultant  
**Date:** February 9, 2026  
**Scope:** Pre-release testing strategy for a controlled launch with 3–5 pilot clinics

---

## 1. Introduction & Testing Philosophy

DoctorQ is a real-time queue management SaaS for Tunisian clinics. The current codebase is a functional MVP with known security gaps, performance bottlenecks, and UX rough edges (documented in the project critiques). Before putting it in the hands of real doctors and real patients — even a small group — the product must cross a trust threshold.

This testing plan is designed around a simple principle: **test what could hurt trust first, then test what could frustrate users, then test what could break at scale.** We are not aiming for enterprise-grade QA coverage. We are aiming for enough confidence that early adopters won't encounter anything that makes them lose faith in the product during their critical first 30 days.

### What Makes DoctorQ's Testing Context Unique

- **Healthcare-adjacent:** While DoctorQ doesn't store clinical records, it handles patient phone numbers and visit data. Trust is paramount.
- **Two distinct user populations:** Doctors/receptionists (paid users) and patients (anonymous, low-tech, potentially anxious). Both must be tested.
- **Real-time dependency:** The core value proposition relies on Socket.io. If real-time breaks, the product has zero value.
- **Tunisian market specifics:** Phone numbers (+216 format), French/Arabic i18n with RTL, variable mobile network quality.

---

## 2. Pre-Testing: Fix Before You Test

Before executing any test plan, the following **blockers** from the existing critique must be resolved. Testing on top of known critical vulnerabilities wastes time.

| # | Blocker | Effort | Rationale |
|---|---------|--------|-----------|
| 1 | **Implement Socket.io token verification** | 2 hrs | Any client can currently join any clinic room. A single early adopter discovering this destroys all credibility. |
| 2 | **Remove hardcoded JWT fallback secret** | 5 min | Token forgery risk if env var is missing. |
| 3 | **Remove demo credentials from LoginPage** | 10 min | Unprofessional; creates security perception issue with doctors. |
| 4 | **Add basic rate limiting** on public check-in endpoint | 1 hr | Prevents spam check-ins from bots or curious patients. |
| 5 | **Remove all 56 console.log statements** | 30 min | Leaks internal data in browser console; unprofessional if a tech-savvy doctor opens DevTools. |

**Total effort: ~4 hours.** Do not proceed to formal testing until these are done.

---

## 3. Testing Strategy Overview

The plan is organized into **6 testing layers**, ordered by priority. Each layer includes what to test, how to test it, specific test cases tailored to DoctorQ, and recommended tools.

```
Layer 1: Security Testing ............... [CRITICAL — Gate for release]
Layer 2: Core Functional Testing ........ [CRITICAL — Does the product work?]
Layer 3: Real-Time & Socket Testing ..... [HIGH — Core value proposition]
Layer 4: Performance & Load Testing ..... [HIGH — Will it survive day 1?]
Layer 5: UX & Usability Testing ......... [HIGH — Will doctors stay?]
Layer 6: Cross-Platform Compatibility ... [MEDIUM — Does it work on their devices?]
```

---

## 4. Layer 1: Security Testing

**Goal:** Ensure no early adopter can accidentally or intentionally access another clinic's data, forge tokens, or abuse public endpoints.

### 4.1 Authentication & Authorization Tests

| Test Case | Method | Pass Criteria |
|-----------|--------|---------------|
| Login with valid doctor credentials | Manual | Returns valid JWT, redirects to dashboard |
| Login with wrong password | Manual | Returns 401, no token issued |
| Access `/api/queue` without token | cURL/Postman | Returns 401 |
| Access `/api/queue` with expired token | cURL/Postman | Returns 401, not a server error |
| Access Clinic A's queue with Clinic B's valid token | cURL/Postman | Returns 403 — **this is the most critical test** |
| Attempt to join Socket.io room for another clinic | Custom script | Connection rejected or disconnected |
| JWT with tampered payload (modified clinicId) | cURL/Postman | Returns 401 (signature invalid) |

### 4.2 Data Exposure Tests

| Test Case | Method | Pass Criteria |
|-----------|--------|---------------|
| Enumerate `/api/queue/patient/:entryId` with random UUIDs | Script (loop 1000 UUIDs) | No patient data returned for non-existent or other-clinic entries |
| Check API responses for over-exposed fields | Manual review | Patient phone numbers are masked or absent in list endpoints |
| Inspect browser Network tab during normal use | Manual | No sensitive data (full phone numbers, internal IDs) leaked in responses that aren't strictly needed |

### 4.3 Input Validation Tests

| Test Case | Method | Pass Criteria |
|-----------|--------|---------------|
| Check in with SQL injection in name field | Manual | Input sanitized, no DB error |
| Check in with XSS payload (`<script>alert(1)</script>`) in name | Manual | Payload escaped in UI, not executed |
| Check in with phone number outside +216 format | Manual | Rejected with clear error |
| Submit check-in 100 times in 60 seconds | Script | Rate limited after reasonable threshold (e.g., 10/min) |

### Recommended Tools
- **Postman** or **Insomnia**: Manual API testing
- **OWASP ZAP** (free): Automated vulnerability scanning against the API
- **Custom Node.js scripts**: For Socket.io auth bypass testing

---

## 5. Layer 2: Core Functional Testing

**Goal:** Verify every critical user journey works end-to-end without errors.

### 5.1 Patient Journey

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| P1 | Patient checks in successfully | Navigate to check-in → enter name + phone → submit | Redirected to status page, position shown |
| P2 | Patient sees correct queue position | Check in as 3rd patient | Position shows "3" (or "2 people ahead") |
| P3 | Patient position updates when someone is called | Doctor calls next patient | Patient's position decrements by 1 |
| P4 | Patient sees "Your Turn" state | Doctor calls this patient | Status changes to consultation state |
| P5 | Patient leaves queue voluntarily | Tap "Leave Queue" → confirm | Removed from queue, redirected to check-in |
| P6 | Duplicate check-in (same phone, same day) | Check in twice with same phone | Either blocked with message, or re-shown existing position |
| P7 | Check-in with appointment time | Enter name + phone + appointment time | Patient placed in queue with appointment indicator |

### 5.2 Doctor/Receptionist Journey

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| D1 | Doctor logs in | Enter credentials → submit | Dashboard loads with current queue |
| D2 | Add patient manually | Click add → fill form → submit | Patient appears in queue list |
| D3 | Call next patient | Click "Next Patient" | First waiting patient moves to IN_CONSULTATION |
| D4 | Complete current patient | Click "Complete" or call next | Current patient marked completed, next one called |
| D5 | Toggle doctor presence | Toggle the presence indicator | Patient-facing pages reflect doctor availability |
| D6 | View empty queue | No patients in queue | Appropriate empty state shown (not a blank page or error) |
| D7 | Handle 30+ patients in queue | Add 30 patients | All render correctly, no UI freeze, scrolling works |

### 5.3 Edge Cases

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| E1 | Doctor calls next when queue is empty | Appropriate message, no crash |
| E2 | Two browser tabs open on dashboard, call next from both simultaneously | Only one patient called, no race condition |
| E3 | Patient refreshes status page | State is preserved, position still accurate |
| E4 | Browser goes offline and comes back | Socket reconnects, state refreshes |
| E5 | Doctor refreshes dashboard mid-queue | Queue state fully restored |

### Recommended Approach
- **Manual testing** for all cases above (this is an early adopter release, not a CI/CD pipeline yet)
- Create a **test checklist spreadsheet** for the pilot team to execute and log results
- **Playwright** for automating the critical paths (P1→P4 and D1→D4) as regression tests for future iterations

---

## 6. Layer 3: Real-Time & Socket.io Testing

**Goal:** Verify that real-time updates are reliable, timely, and consistent across connected clients.

This is the **heart of DoctorQ's value proposition.** If a patient checks in and the doctor doesn't see it instantly, the product fails.

### Test Cases

| # | Test Case | Setup | Expected Result |
|---|-----------|-------|-----------------|
| RT1 | Patient check-in appears on doctor dashboard in real-time | Open dashboard + check-in page side by side | New patient appears on dashboard within 2 seconds, no refresh needed |
| RT2 | "Call Next" updates patient status page in real-time | Doctor clicks next, patient page open | Patient page transitions to "Your Turn" within 2 seconds |
| RT3 | Position update propagates to all waiting patients | 5 patients checked in, doctor calls #1 | Patients #2–5 all see updated positions within 2 seconds |
| RT4 | Doctor presence toggle updates patient pages | Toggle off | Patient pages show "doctor not present" indicator |
| RT5 | Socket reconnection after network drop | Disable network for 10 seconds, re-enable | Client reconnects, state is accurate (not stale) |
| RT6 | Multiple doctors (future) don't receive other clinic's events | Two clinics active simultaneously | Clinic A events never appear on Clinic B's dashboard |
| RT7 | Late joiner sees current state | Doctor opens dashboard after 10 patients already waiting | All 10 patients visible immediately |

### How to Test

1. **Two-device test:** Open doctor dashboard on laptop, patient check-in on phone. Perform actions, verify updates appear instantly.
2. **Network simulation:** Use Chrome DevTools → Network → Throttle to simulate 3G/slow connections common in Tunisian clinics.
3. **Disconnection test:** Toggle airplane mode on phone, wait 30 seconds, re-enable. Verify state reconciliation.

---

## 7. Layer 4: Performance & Load Testing

**Goal:** Ensure DoctorQ can handle a realistic day-one load without degradation.

### Realistic Load Profile for Early Adopter Release

Based on 3–5 pilot clinics:

| Metric | Estimate |
|--------|----------|
| Concurrent clinics | 3–5 |
| Peak patients per clinic | 30–40 |
| Total concurrent Socket connections | ~50–80 |
| Check-ins per hour (peak) | ~20 per clinic |
| "Call Next" actions per hour | ~10–15 per clinic |

### Test Cases

| # | Test Case | Tool | Pass Criteria |
|---|-----------|------|---------------|
| LT1 | Add 50 patients to a single clinic queue | Script (API calls) | All added successfully, final queue renders < 2 seconds |
| LT2 | Call "Next Patient" with 50 in queue | Script + timing | Response time < 500ms (currently ~35 queries — this will reveal the N+1 problem) |
| LT3 | 50 concurrent Socket.io connections to one clinic room | Artillery or k6 | No dropped connections, events broadcast within 2 seconds |
| LT4 | Simulate full day: 200 check-ins, 200 call-next over 8 hours | Load testing script | No memory leaks, no DB connection pool exhaustion |
| LT5 | Database query time for queue operations with 50 entries | Prisma query logging | Individual queries < 100ms |

### Recommended Tools
- **k6** (Grafana): Scriptable load testing, supports WebSocket testing
- **Artillery**: Good for Socket.io load simulation
- **Prisma query logging**: Enable `log: ['query']` in Prisma client to identify slow queries

### Performance Baseline to Establish

Before handing to early adopters, record and document:

| Metric | Target |
|--------|--------|
| Check-in API response time (p95) | < 300ms |
| "Call Next" API response time (p95) | < 500ms |
| Socket.io event delivery (p95) | < 2 seconds |
| Dashboard initial load time | < 3 seconds on 4G |
| Patient status page load | < 2 seconds on 3G |

---

## 8. Layer 5: UX & Usability Testing

**Goal:** Ensure real doctors and real patients can use the product without confusion, frustration, or loss of trust.

### 8.1 Structured Usability Test (Doctor/Receptionist)

**Participants:** 2–3 doctors or clinic receptionists (ideally from the pilot group)  
**Format:** 30-minute moderated session, in-person or screen-shared  
**Script:**

1. **First Impression (2 min):** Show the landing page. Ask: *"What does this product do? Would you trust it for your clinic?"*
2. **Signup Task (5 min):** Ask them to create an account. Observe friction points. Note where they hesitate.
3. **First Queue Setup (5 min):** Ask them to add 3 patients manually. Observe if the flow is intuitive.
4. **Call Patients Through (5 min):** Ask them to process the queue (call next, complete, call next). Note confusion.
5. **Patient Perspective (5 min):** Hand them a phone with the patient check-in page. Ask them to check in. Then show them the waiting screen. Ask: *"If you were a patient, what would you think?"*
6. **Debrief (8 min):** Open-ended: *What confused you? What would stop you from using this daily? What impressed you?*

### Key Metrics to Capture

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Task completion rate (signup) | Did they finish without help? | 100% |
| Task completion rate (add patient) | Could they add a patient in < 60 seconds? | > 90% |
| Time to first "Call Next" | From login to first patient called | < 3 minutes |
| Satisfaction score (1–5) | Post-session survey | ≥ 4/5 |
| Critical confusion points | Observer notes | 0 blockers |

### 8.2 Unmoderated Patient UX Test

**Participants:** 5–10 non-technical people (friends, family, clinic staff)  
**Setup:** Give them a phone with the check-in URL and say: *"You're at a doctor's office. Check yourself in."*  

**Observe:**
- Can they enter their phone number without confusion? (Known issue: +216 prefix)
- Do they understand their queue position?
- Do they know what to do when it's their turn?
- Do they accidentally leave the queue?

### 8.3 Accessibility Quick Audit

Given the documented accessibility gaps (only 10 aria attributes in the entire codebase), perform a minimum viable accessibility check:

| Check | Tool | Pass Criteria |
|-------|------|---------------|
| Screen reader navigation | VoiceOver (iOS) or TalkBack (Android) | User can check in and understand queue position |
| Keyboard navigation (doctor dashboard) | Keyboard only | All actions reachable via Tab/Enter |
| Color contrast | Chrome Lighthouse | All text passes WCAG AA (4.5:1 ratio) |
| Icon buttons have labels | Manual inspection | Every icon-only button has an `aria-label` |

---

## 9. Layer 6: Cross-Platform & Compatibility Testing

**Goal:** Ensure the product works on the devices Tunisian doctors and patients actually use.

### Device & Browser Matrix

| User Type | Priority Devices | Priority Browsers |
|-----------|-----------------|-------------------|
| Doctor (desktop) | Windows laptop, MacBook | Chrome, Firefox |
| Doctor (mobile) | iPhone 12+, Samsung Galaxy S21+ | Safari, Chrome |
| Receptionist | Budget Android tablet | Chrome |
| Patient | Budget Android phone (Samsung A-series, Redmi) | Chrome, Samsung Internet |
| Patient | Older iPhone (8, SE) | Safari |

### Test Matrix (Minimum)

| Combination | Test |
|-------------|------|
| Chrome on Windows (doctor) | Full dashboard flow |
| Safari on iPhone (doctor) | Mobile dashboard flow |
| Chrome on Android (budget, patient) | Check-in + status page |
| Samsung Internet on Android (patient) | Check-in + status page |
| Safari on older iPhone (patient) | Check-in + status page |

### i18n & RTL Testing

| Test Case | Pass Criteria |
|-----------|---------------|
| Switch to Arabic | All UI elements flip to RTL, no text overflow |
| Switch to French | All strings translated, no missing keys |
| Arabic phone input | +216 input works correctly in RTL layout |
| Long Arabic patient names in queue | No truncation or overflow in queue list |

---

## 10. Early Adopter Feedback Infrastructure

Testing doesn't end at launch — your first 3–5 clinics **are** your testers. Set up infrastructure to capture their experience.

### 10.1 In-App Feedback

- Add a simple "Report a Problem" button (floating, bottom-right on doctor dashboard)
- Capture: screenshot, browser info, current page, free-text description
- Route to a shared Slack channel or email inbox

### 10.2 Analytics (Minimum Viable)

Install basic event tracking from Day 1:

| Event | Why |
|-------|-----|
| `signup_started` / `signup_completed` | Measure onboarding drop-off |
| `first_patient_added` | Track time-to-value |
| `call_next_clicked` | Understand daily usage |
| `patient_checked_in` | Measure patient adoption |
| `patient_left_queue` | Track voluntary queue abandonment |
| `socket_reconnected` | Monitor real-time reliability |
| `error_displayed` | Catch UI errors in the wild |

**Recommended tool:** Mixpanel (free tier supports 20M events/month) or PostHog (self-hosted, privacy-friendly).

### 10.3 Weekly Check-In with Pilot Clinics

For the first 4 weeks, schedule a 15-minute weekly call with each pilot clinic:

- *What worked well this week?*
- *What frustrated you or your patients?*
- *Did anything break?*
- *What's the one thing you wish the app did differently?*

Document findings in a shared tracker. Prioritize fixes by frequency × severity.

---

## 11. Testing Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| **Week 1** | Fix 5 pre-testing blockers | Clean, deployable build |
| **Week 1–2** | Layer 1: Security testing | Security test report, all critical tests passing |
| **Week 2** | Layer 2: Core functional testing | Test checklist completed, bugs logged |
| **Week 2** | Layer 3: Socket.io testing | Real-time reliability confirmed |
| **Week 3** | Layer 4: Performance baseline | Load test results, bottleneck report |
| **Week 3** | Layer 5: Usability testing (2–3 sessions) | Usability findings document |
| **Week 3** | Layer 6: Cross-platform spot checks | Compatibility matrix completed |
| **Week 4** | Bug fixing sprint | All critical/high bugs resolved |
| **Week 4** | Deploy to staging, internal dogfooding | Team uses the product for 3–5 days |
| **Week 5** | **Early Adopter Launch** (3–5 clinics) | Feedback infrastructure live |

---

## 12. Go / No-Go Criteria for Early Adopter Release

Before inviting the first clinic, all of the following must be true:

### Must-Pass (Release Blockers)

- [ ] All Layer 1 security tests pass (no auth bypass, no data leakage)
- [ ] All Layer 2 critical path tests pass (P1–P5, D1–D6)
- [ ] Socket.io events deliver within 2 seconds (RT1–RT4 pass)
- [ ] No crash or data loss under 30-patient queue load
- [ ] Check-in flow completable on budget Android phone with Chrome
- [ ] Demo credentials removed, console.logs removed

### Should-Pass (Acceptable Debt for Early Release)

- [ ] Performance under 50+ patients may degrade (N+1 not yet batch-optimized)
- [ ] Accessibility audit items logged but not all resolved
- [ ] E2E automated tests cover critical paths (nice-to-have, manual is acceptable)
- [ ] i18n fully reviewed for Arabic (minor string issues acceptable)

### Explicitly Deferred

- Multi-doctor support
- Automated E2E test suite in CI/CD
- Redis caching layer
- Database-per-tenant architecture
- Comprehensive WCAG compliance

---

## 13. Conclusion

This testing plan is intentionally pragmatic. DoctorQ is not launching to thousands of users — it's launching to a handful of trusted clinics who will forgive minor UI quirks but will not forgive broken security, unreliable real-time updates, or data they can't trust.

The plan prioritizes in this order:

1. **Security** — because healthcare-adjacent products have zero margin for data trust violations
2. **Core functionality** — because if check-in and call-next don't work, nothing else matters
3. **Real-time reliability** — because this is the entire value proposition
4. **Performance** — because a 30-patient queue must not feel slow
5. **Usability** — because doctors are busy and patients are anxious
6. **Compatibility** — because Tunisian users are on diverse, often budget, devices

Budget approximately **4–5 weeks** from start to early adopter handoff. The investment is modest relative to the cost of losing a pilot clinic's trust in the first week.
