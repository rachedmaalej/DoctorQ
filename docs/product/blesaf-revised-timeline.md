# BleSaf Revised Launch Timeline — February 2026

**Prepared for:** Rached, Founder  
**Date:** February 12, 2026

---

## The Ramadan Reality Check

Your original timeline is dead on arrival — not because of bad planning, but because of one massive constraint: **Ramadan starts around February 17-18, 2026 and ends around March 19-20, with Eid al-Fitr celebrations on March 20-22.**

This changes everything:

- **You have ~4-5 working days before Ramadan** (Feb 12-17). That's it for full-speed development.
- **During Ramadan (~Feb 18 - Mar 19):** Government offices (INNORPI, RNE, Startup Tunisia) operate on reduced hours. Clinics run shortened schedules. Doctors are fasting, tired, and not evaluating new software. Your own productivity will be lower.
- **Eid al-Fitr (~Mar 20-22):** Complete shutdown. In Tunisia, celebrations extend 3-4 days practically.
- **Post-Eid recovery (~Mar 23-28):** People ease back into normal rhythms. Government backlogs from Ramadan start clearing.
- **Full operational speed resumes:** ~March 29 onwards.

**The strategic implication:** Ramadan is not dead time — it's *preparation time*. You build and harden during Ramadan. You launch *after* Eid, when doctors are back to their normal chaos and most receptive to solutions. Launching a mystery card campaign on March 9 (mid-Ramadan) when clinics are running half-days and doctors are fasting is poor timing.

---

## What Your Original Timeline Was Missing

Beyond the Ramadan misalignment, several critical workstreams were absent:

| Missing Workstream | Why It Matters | Typical Duration |
|---|---|---|
| **Company incorporation** | Required for Startup Act, payment processing, legal operations | 2-4 weeks (government processing) |
| **INNORPI trademark registration** | "BleSaf" brand protection; filing takes ~12-18 months for registration, but you need to *file* early | Filing itself: 1-2 days + documents prep |
| **Startup Act Label application** | Tax exemptions, foreign currency account, Technology Card (100K TND/year). Sessions open monthly — you need to be incorporated first. | Application: 1 day. Response: 3-30 days depending on path |
| **Payment processing setup (Konnect/Flouci)** | Can't charge the 65 TND/month subscription without it. Konnect onboarding is reportedly fast but requires a legal entity. | 1-3 weeks for account + approval |
| **UX/UI expert collaboration** | You mentioned in-progress design work. This needs dedicated integration time. | Ongoing, but key integration windows needed |
| **Scalability testing** | Your critique flags performance degrading past 30 patients. You need to know: 5 clinics? 10? 50? 100? | 3-5 days of focused load testing |
| **End-to-end journey testing** | No one has cold-tested the full doctor acquisition flow | 2-3 days minimum |
| **Landing page content creation** | Copy, visuals, interactive demo — this is a creation task, not a "polish" task | 5-7 days |

---

## Revised Timeline: Three Macro Phases

The new timeline is organized around the Ramadan calendar rather than fighting it.

### PHASE A: PRE-RAMADAN SPRINT (Feb 12-17) — 5 Days
### PHASE B: RAMADAN BUILD PERIOD (Feb 18 - Mar 19) — 30 Days  
### PHASE C: POST-EID LAUNCH (Mar 25 onwards)

---

## PHASE A: PRE-RAMADAN SPRINT

**Feb 12-17 (5 working days)**  
**Goal:** Lock in every time-sensitive administrative action and fix the most critical security issues.

### A1: Administrative Actions (Feb 12-14)

These are "fire and forget" tasks — you start the process now because government timelines don't care about your development schedule. Ramadan will slow government processing, so every day you wait costs you a week later.

| Action | Day | Details | Dependency |
|---|---|---|---|
| Begin company incorporation (if not already done) | Feb 12 | File at RNE. You need: statutes, capital deposit, ID documents. If using a lawyer or accountant, brief them today. | None |
| Prepare INNORPI trademark filing for "BleSaf" | Feb 12-13 | Prepare: power of attorney (simply signed), 5 prints of the mark, goods/services list in French. Official fees ~$200-400. | None |
| File INNORPI application | Feb 14 | Submit before Ramadan starts. Registration takes 12-18 months, but filing date establishes priority. You can operate under the name immediately after filing. | Documents ready |
| Research Startup Act session calendar for 2026 | Feb 12 | Sessions open monthly (sometimes delayed). You can apply for the Pre-Label even before incorporation is complete. Check startup.gov.tn for the next session opening. | None |
| Contact Konnect for merchant account | Feb 13 | Create organization account, begin onboarding process. Konnect reportedly onboards quickly, but you need a legal entity for full approval. Start with test mode immediately. | Company incorporation (for full approval) |

### A2: Critical Security Fixes (Feb 12-17)

These are the non-negotiable items from your critique — the ones that could embarrass you if a pilot clinic discovers them.

| Task | Est. | Priority |
|---|---|---|
| Implement Socket.io token verification | 2 hrs | CRITICAL — anyone can join any clinic room |
| Remove JWT fallback secret from code | 5 min | CRITICAL — token forgery risk |
| Remove demo credentials from LoginPage | 10 min | HIGH — unprofessional |
| Add rate limiting to public endpoints (check-in, queue) | 1 hr | HIGH — DoS prevention |
| Remove SAMPLE_PATIENTS hardcoded data from DashboardPage | 30 min | MEDIUM — cleanup |
| Remove console.log statements (56 of them) | 30 min | MEDIUM — production hygiene |

### A3: Sentry / Error Monitoring Setup (Feb 15-16)

You absolutely need error tracking before Ramadan build work begins. Install Sentry (or equivalent), configure source maps, and set up alerts. This way, when you're building during Ramadan and things break, you'll know immediately.

### A4: UX/UI Expert Sync (Feb 16-17)

Before Ramadan slows communication rhythms, have a focused working session with your UX/UI expert to:

- Align on the onboarding simulation design (screens, flow, interactions)
- Review and finalize the landing page wireframes
- Agree on the patient status page redesign priorities
- Set a clear deliverables schedule for work they'll complete during Ramadan

---

## PHASE B: RAMADAN BUILD PERIOD

**Feb 18 - Mar 19 (~30 days)**  
**Goal:** Heads-down building. No external launches, no marketing, no clinic outreach. Pure product and infrastructure work.

Ramadan is actually ideal for deep development work — fewer distractions, quieter environment, and no pressure to be "live." Your productivity will be lower (shorter effective work days, energy management), so plan for ~60-70% velocity compared to normal. That means roughly 18-20 effective working days across the 30-day period.

### B1: Subscription & Pricing Infrastructure (Feb 18-25, Week 1)

| Task | Est. | Notes |
|---|---|---|
| Implement subscription enforcement (block features after trial expires) | 2 days | Core monetization gate |
| Set up pricing at 65 TND/month | 1 day | In-app pricing display + backend enforcement |
| Integrate Konnect API (test mode) | 2 days | Payment link generation, webhook handling for payment confirmation |
| Build basic subscription management UI (active/expired/payment) | 1 day | Doctor needs to see their subscription status |
| Legal pages (terms of service, privacy policy, data handling) | 1 day | Essential for a healthcare-adjacent app. Can use templates and customize. |

### B2: Onboarding Experience (Feb 25 - Mar 4, Week 2)

This is the heart of your product-led growth strategy. Build the minimum viable version only.

| Task | Est. | Notes |
|---|---|---|
| Reduce signup form to 3 fields (email, password, clinic name) | 0.5 days | Collect everything else post-signup |
| Build welcome screen with personalized clinic branding | 1 day | "Welcome to [Clinic Name]'s Digital Queue" — immediate value signal |
| Build onboarding simulation (pre-populated demo queue) | 2 days | 3-4 fake patients already waiting. Doctor clicks "Call Next" and sees the flow. This IS the "Aha moment." |
| Simulated patient check-in notification | 1 day | During onboarding, simulate a patient checking in so the doctor sees the real-time notification |
| Build "First Morning Playbook" — a simple checklist | 1 day | "Step 1: Open your dashboard. Step 2: Share this link with reception. Step 3: Your first patient checks in." Keep it to 3 steps. |
| Email verification flow | 0.5 days | Required for account recovery and professional credibility |
| Password reset flow | 0.5 days | Cannot launch without this |

### B3: Performance Fixes & Code Quality (Mar 4-10, Week 3)

| Task | Est. | Notes |
|---|---|---|
| Batch position updates (single SQL query replacing N individual updates) | 4 hrs | 10x faster queue operations — critical before multi-clinic testing |
| Remove double API calls after mutations (trust Socket.io) | 1 hr | 50% fewer API calls |
| Add React.lazy() code splitting for routes | 2 hrs | ~50KB off initial bundle |
| Extract phone formatting to shared utility | 30 min | DRY fix — 3 duplicate implementations |
| Extract time formatting to shared utility | 30 min | DRY fix |
| Add database transactions to queue mutations | 3 hrs | Data integrity — crucial for multi-tenancy |
| Fix type safety gaps (remove `as any` casts) | 1 hr | Prevents subtle bugs at scale |

### B4: Patient Experience Improvements (Mar 10-14, Week 3-4)

| Task | Est. | Notes |
|---|---|---|
| Replace "fun facts" with wait time estimates | 3 hrs | "~12 minutes remaining" addresses actual patient anxiety |
| Show "X people ahead of you" instead of confusing position numbers | 2 hrs | Intuitive language over abstract numbering |
| Add position change notifications ("You moved up!") | 2 hrs | Creates positive momentum |
| Fix phone input: show format guide (+216 XX XXX XXX), better error messages | 30 min | Major frustration reducer |
| Replace confetti with calm "Your Turn" screen | 1 hr | Professional medical context |
| Add confirmation step to "Leave Queue" button | 30 min | Prevent accidental exits |
| Add aria-labels to all icon buttons | 1 hr | Accessibility compliance |

### B5: Landing Page & Marketing Assets (Mar 14-19, Week 4)

| Task | Est. | Notes |
|---|---|---|
| Write landing page copy: hero, pain/relief narrative, how-it-works | 2 days | "Your waiting room, organized in seconds" — 5-second clarity test |
| Integrate UX/UI expert's designs into landing page | 1 day | Visual polish and mobile-first layout |
| Build or embed interactive product demo (Storylane/Navattic or custom) | 2 days | Show, don't tell. Let doctors click through a live demo without signing up. |
| Create before/after visual (manual chaos → digital order) | 0.5 days | Core emotional hook for the landing page |
| Set up blesaf.tn DNS + SSL | 0.5 days | Domain must be live before any marketing |

### B6: Scalability Testing (Mar 16-19, overlapping with B5)

This can run in parallel with landing page work since it's primarily backend-focused.

| Test Scenario | What You're Measuring | Pass Criteria |
|---|---|---|
| 5 simultaneous clinics, 20 patients each | Socket.io room isolation, query performance | <500ms response times, no cross-clinic data leakage |
| 10 simultaneous clinics, 30 patients each | Database connection pool, memory usage | No connection pool exhaustion, <1s response times |
| 50 simultaneous clinics, 30 patients each | Horizontal scaling needs, Socket.io limits | Identify breaking point. Do you need Redis adapter for Socket.io? |
| 100 simultaneous clinics (stress test) | Where does it actually fail? | Document failure modes and required infrastructure upgrades |

**How to test:** Use Artillery.io or k6 for load testing. Create scripts that simulate patient check-ins, queue advances, and Socket.io connections at scale. You don't need 100 real clinics — you need 100 simulated concurrent clinic sessions.

**Key things to watch:**
- The N+1 query problem (should be fixed in B3, but verify under load)
- Socket.io connection limits per server instance
- PostgreSQL connection pool under concurrent multi-tenant queries
- Memory usage growth over time (memory leaks)

---

## EID AL-FITR BREAK

**Mar 20-24 (~5 days)**

Do nothing work-related. Celebrate. Rest. You've been building for 5+ weeks straight. Eid in Tunisia is 2 official days but 3-4 days practically. Use this time to recharge before the launch sprint.

**Optional light tasks only:** Review notes, think about campaign messaging, sketch ideas. No coding, no deploys.

---

## PHASE C: POST-EID LAUNCH

**Mar 25 onwards**  
**Goal:** Everything faces outward. Testing with real humans, campaign execution, first paying customers.

### C1: End-to-End Journey Test (Mar 25-28, 4 days)

Before any marketing spend, test the complete journey with 2-3 people who are NOT you:

| Test | Tester Profile | What You're Validating |
|---|---|---|
| Cold landing page test | A friend who knows nothing about BleSaf | Can they explain what the product does in 5 seconds? Do they click the CTA? |
| Full signup + onboarding | Someone who could be a target user (a doctor friend, a medical professional) | Is the 3-field signup smooth? Does the onboarding simulation create an "aha"? Where do they get confused? |
| Patient check-in flow | Anyone with a Tunisian phone | Can they check in on their phone in under 60 seconds? Is the status page clear? |
| Doctor daily workflow | Ideally a real doctor or receptionist | Open dashboard in morning → patients check in → call next → end of day. Does it feel natural? |

Fix critical issues found during testing. This is your last quality gate.

### C2: Konnect Payment Go-Live (Mar 25-28, parallel)

| Task | Notes |
|---|---|
| Switch Konnect from test mode to production | Requires approved merchant account (started in Phase A) |
| Test real payment of 65 TND | Make a real transaction yourself |
| Verify webhook handling for payment confirmation | Subscription must activate automatically after payment |
| Set up basic payment failure handling | What happens if the card is declined? |

### C3: Campaign Preparation (Mar 29 - Apr 4, 1 week)

Now that clinics are back to normal post-Eid operations and feeling the full weight of their queue chaos again, prepare the campaign.

| Task | Timeline | Notes |
|---|---|---|
| Design mystery cards | Mar 29-30 | Physical cards with QR code → blesaf.tn waitlist or WhatsApp |
| Define card → capture flow | Mar 31 | What happens when a doctor scans the QR? Waitlist form? WhatsApp chat? Direct to landing page? Decision needed before printing. |
| Build clinic target list (30-50 clinics in Tunis) | Mar 31 - Apr 1 | Ophthalmologists, dentists, GPs — clinics with visible queue problems |
| Write WhatsApp scripts (introduction, follow-up, demo offer) | Apr 1-2 | Personal, conversational, not salesy |
| Print mystery cards | Apr 2-3 | 2-day print turnaround typical |
| Set up WhatsApp Business account | Apr 1 | Dedicated number for BleSaf communications |

### C4: Campaign Execution — 3 Beats (Apr 7 - Apr 25)

**Beat 1: Mystery (Apr 7-9)**  
Hand-deliver mystery cards to 30-50 clinics. The card creates curiosity: "Your waiting room is about to change. blesaf.tn" No explanation, just intrigue. Cards go to reception desks, not directly to doctors — receptionists are the ones who feel queue pain most acutely.

**Beat 2: Reveal (Apr 10-14)**  
WhatsApp follow-up to clinics that scanned the QR / visited the site. "Hi Dr. [Name], we dropped off a card at your clinic earlier this week. BleSaf is a digital queue for your patients — here's a 2-minute demo: [link]." Personal, warm, founder-to-doctor.

**Beat 3: Founding Clinic Signups (Apr 15-19)**  
Open signups for "Founding Clinics" — special positioning (not a discount, but recognition). "Be one of the first 10 clinics in Tunis to go digital." Landing page is live, onboarding is polished, payment processing works.

### C5: Founder Support & Iteration (Apr 20 - May 30+)

| Week | Focus |
|---|---|
| Apr 20-26 | Daily check-ins with first signups. Fix any bugs immediately. Help with "First Morning" setup. |
| Apr 27 - May 3 | Collect first feedback. What's working? What's confusing? Any feature gaps? |
| May 4-10 | First iteration sprint based on real feedback. |
| May 11-17 | Collect testimonials from happy clinics. Screenshot their queue in action (with permission). |
| May 18-30 | Second wave: use testimonials for social proof on landing page. Expand to 20-30 clinics. |

**KPIs to track weekly:**

| Metric | Target | What It Tells You |
|---|---|---|
| Signups | 3-5 founding clinics by Apr 25 | Campaign effectiveness |
| Activation rate (completed onboarding) | >70% | Onboarding quality |
| First patient check-in rate | >60% of activated clinics | Value delivery |
| 7-day retention (logged in again after 1 week) | >50% | Real stickiness |
| Daily active clinics by May 30 | 10+ | Ready for public launch? |

---

## Administrative Milestones (Running in Parallel)

These operate on their own timelines and should be tracked separately from product work.

| Milestone | Start | Expected Resolution | Notes |
|---|---|---|---|
| Company incorporation filed | Feb 12 | Feb 28 - Mar 15 | Government processing. May be delayed by Ramadan reduced hours. |
| INNORPI trademark "BleSaf" filed | Feb 14 | Filing complete immediately; registration in 12-18 months | Priority date established at filing. You can use the name commercially. |
| Startup Act Pre-Label application | After incorporation | Response in 3-30 days after session opens | Watch startup.gov.tn for next session (likely monthly). Pre-Label doesn't require full incorporation. |
| Konnect merchant account approved | Feb 13 (start) | Mar-Apr (depends on incorporation) | Test mode available immediately. Production requires legal entity. |
| Startup Act full Label | After Pre-Label + incorporation | 3 days if you have VC funding; 30 days via committee review | Benefits: tax exemption, Technology Card (100K TND/year), foreign currency account |

---

## Consolidated Visual Timeline

```
FEBRUARY 2026                                         
12   13   14   15   16   17 │ 18   19   20   21   22   23   24   25   26   27   28
├────┼────┼────┼────┼────┼──┤─┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
                             │
PHASE A: PRE-RAMADAN SPRINT  │  PHASE B: RAMADAN BUILD PERIOD
█████████████████████████████│                                                    
Admin filings ████░░░░░░░░░░│  B1: Subscriptions & Payments ████████████████░░░░
Security fixes ██████████░░░│                                                    
Sentry setup ░░░░░░████░░░░│  B2: Onboarding Experience ░░░░░░░░░░░░░░░░████████
UX/UI sync ░░░░░░░░░░██████│                                                    
                             │ RAMADAN STARTS (~Feb 17-18)                        


MARCH 2026
1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19 │ 20   21   22   23   24
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤─┼────┼────┼────┼────┤
                                                                                           │
PHASE B CONTINUES                                                                          │ EID BREAK
████████████████████████████████████████████████████████████████████████████████████████████│ ░░░░░░░░░░░░░░░░░░░░
B2: Onboarding ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
B3: Performance & Code Quality ░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
B4: Patient UX ░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
B5: Landing Page & Marketing ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████░░░│
B6: Scalability Testing ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░│ REST. EID MUBARAK.
                                                                                           │


MARCH 25 ────────────────── APRIL ────────────────────────── MAY ──────────────
25   26   27   28 │ 1    4    7    8    9   10   14   15   19   20   25   30 │
├────┼────┼────┼──┤─┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤─→
                   │                                                         │
PHASE C: POST-EID LAUNCH                                                     │
C1: E2E Testing ██████████████                                               │
C2: Payment Go-Live ██████████                                               │
C3: Campaign Prep ░░░░░░░░░░░░████████████████                               │
C4: Beat 1 (Mystery) ░░░░░░░░░░░░░░░░░░░░░░██████████                       │
C4: Beat 2 (Reveal) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████             │
C4: Beat 3 (Founding Clinics) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████  │
C5: Founder Support & Iteration ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█████│→→→


ADMIN TRACK (parallel):
Company incorporation ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░
INNORPI filing ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (12-18 months to register)
Konnect setup ░░░████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░
Startup Act application ░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████░░░░░░░░░░░
```

---

## Key Milestones

| Date | Milestone |
|---|---|
| **Feb 12** | Start building. File incorporation. Begin INNORPI prep. |
| **Feb 14** | INNORPI trademark filed. Security fixes complete. |
| **Feb 17** | Pre-Ramadan sprint complete. Sentry live. UX/UI expert aligned. |
| **~Feb 18** | Ramadan begins. Switch to deep build mode. |
| **Feb 25** | Subscription infrastructure complete. Konnect test mode working. |
| **Mar 4** | Onboarding experience built (simulation + first morning playbook). |
| **Mar 10** | Performance fixes shipped. Code quality improved. |
| **Mar 14** | Patient experience rewrite complete. |
| **Mar 19** | Landing page live. Scalability tested. blesaf.tn DNS configured. |
| **~Mar 20-24** | Eid al-Fitr. Rest. |
| **Mar 25** | Phase C begins. E2E journey testing with real humans. |
| **Mar 28** | Konnect payment processing live in production. |
| **Apr 4** | Campaign materials ready. Mystery cards printed. |
| **Apr 7** | Beat 1: Mystery cards delivered to 30-50 clinics. |
| **Apr 15** | Beat 3: Founding clinic signups open. |
| **Apr 25** | First decision point: do we have 3-5 paying clinics? |
| **May 30** | Second decision point: 10+ daily active clinics → public launch? |

---

## What Changed vs. Your Original Timeline

| Original Plan | Revised Plan | Why |
|---|---|---|
| Campaign starts Mar 9 (mid-Ramadan) | Campaign starts Apr 7 (post-Eid) | Doctors aren't evaluating software during Ramadan. Clinics run half-days. Your campaign would fall flat. |
| No admin/legal workstream | Incorporation, INNORPI, Startup Act, Konnect all tracked | You can't charge money or get startup benefits without these. Starting them Day 1 is critical because government timelines are the slowest. |
| Onboarding in 5 days during normal operations | Onboarding over 8 days during Ramadan (lower velocity) | More realistic given reduced energy. Scoped to MVP. |
| No scalability testing | Explicit load testing at 5/10/50/100 clinics | Your critique says performance degrades past 30 patients. You need to know where the ceiling is before launching. |
| No end-to-end journey testing | 4-day testing phase with non-you humans | Someone who isn't the builder needs to try the complete flow cold. |
| No landing page creation time | 5 days dedicated to copy, design, and demo embed | The landing page is your conversion engine. "Landing polish" is not the same as "landing page creation." |
| 4.5 weeks total (Feb 12 → Mar 28) | ~11 weeks total (Feb 12 → May 1 first clinics) | Honest timeline. But the product that launches is hardened, tested, and legally operational — not a prototype. |
| blesaf.tn live Mar 1 | blesaf.tn live Mar 19 (end of Ramadan build) | You don't need the domain live until the landing page is ready. No point having DNS configured with nothing to show. |

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Incorporation delayed by Ramadan government slowdowns | File on Feb 12, Day 1. Use a lawyer/accountant who knows the process. Consider if Pre-Label Startup Act can proceed in parallel. |
| Konnect approval takes longer than expected | Start in test mode immediately. Have Flouci as backup. Worst case: launch founding clinics on free trial, enable payments when approved. |
| Onboarding simulation is more complex than estimated | Scope ruthlessly: pre-populated queue + one "Call Next" click = MVP. No animations, no elaborate flows. The wow comes from simplicity, not complexity. |
| Scalability testing reveals major issues at 10 clinics | Better to know in March than in April with real clinics. If Socket.io needs Redis adapter, that's a known fix (2-3 days). |
| Ramadan productivity lower than expected | Phase B has ~5 days of buffer built in (30 calendar days, ~20 effective days, ~17 days of planned work). Use the buffer. |
| Doctors unresponsive to mystery cards post-Eid | Beat 2 (WhatsApp follow-up) is your safety net. Personal, direct founder outreach converts when cards don't. Also consider: Facebook/Instagram ads as a parallel channel starting Apr 10. |

---

## Final Assessment

Your instincts on the campaign (mystery cards, 3 beats, founder-led support) are excellent and culturally well-calibrated for Tunisia. The original sin was trying to compress everything before Ramadan, which would have meant launching an untested product during a month when your target customers aren't buying.

The revised timeline adds ~4 weeks, but what you get is:

- A legally operational company (not a side project)
- A product that's been security-hardened, performance-tested, and journey-tested
- A landing page that converts (not just exists)
- A campaign that lands when doctors are back at full capacity and feeling their queue pain most acutely
- Payment processing that actually works
- A path to Startup Act benefits (tax exemption, 100K TND Technology Card)

The product that launches on April 7 is fundamentally different from what would have launched on March 9. It's the difference between "functional prototype" and "real SaaS business."

**Ramadan Mubarak. Build well.**
