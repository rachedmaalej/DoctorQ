# MVP Scope Definition

**Document Version:** 1.0
**Last Updated:** January 11, 2026
**Owner:** Product Team
**Status:** Approved for Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Feature List with User Stories](#feature-list-with-user-stories)
3. [Acceptance Criteria](#acceptance-criteria)
4. [P0 vs Out-of-Scope](#p0-vs-out-of-scope)
5. [Feature Dependencies](#feature-dependencies)
6. [MVP Success Metrics](#mvp-success-metrics)
7. [Post-MVP Roadmap](#post-mvp-roadmap)

---

## Executive Summary

### MVP Definition
The DoctorQ MVP is a **minimal viable product** that enables independent Tunisian doctors to manage same-day queues digitally. It focuses exclusively on **P0 (launch blocker) features** that deliver core value: real-time queue visibility, patient notifications, and receptionist workflow efficiency.

### MVP Scope Boundaries

**IN SCOPE (P0 - Must Have)**
- Queue management dashboard for doctor/receptionist
- Patient check-in via QR code or manual receptionist add
- Real-time queue position tracking for patients
- SMS notifications (queue joined, your turn)
- French and Arabic language support with RTL
- Basic clinic authentication (login/logout)

**OUT OF SCOPE (P1/P2 - Future Versions)**
- WhatsApp Business API integration (P1 for v1.1)
- "Almost your turn" notifications (P1)
- Multi-doctor/multi-room support (P2)
- Appointment booking system (P2)
- Patient medical records (explicitly out of scope)
- Native mobile apps (web-only for MVP)

### Target Users for MVP
1. **Primary:** Receptionists at 3 pilot clinics
2. **Secondary:** Independent doctors (light usage, mostly viewing)
3. **End Users:** ~150-300 patients across 3 clinics during 2-week pilot

---

## Feature List with User Stories

### Epic 1: Queue Management (Doctor/Receptionist)

#### Feature 1.1: View Today's Queue
**User Story:**
> As a receptionist, I want to see all patients in today's queue with their positions and wait times, so that I can manage patient flow and answer "how long until my turn?" questions.

**Acceptance Criteria:**
- **GIVEN** I am logged in as a receptionist
- **WHEN** I open the queue dashboard
- **THEN** I see a list of all patients in order of position
- **AND** each patient shows: position number, name (if provided), phone, arrival time, estimated wait
- **AND** the current patient (being consulted) is visually highlighted
- **AND** the queue auto-updates every 30 seconds without page refresh

**Priority:** P0 - Critical
**Estimate:** 3 days
**Dependencies:** Database schema, authentication

---

#### Feature 1.2: Add Patient to Queue
**User Story:**
> As a receptionist, I want to manually add a patient to the queue when they arrive, so that patients without smartphones or QR scanning ability can still join the queue.

**Acceptance Criteria:**
- **GIVEN** I am viewing the queue dashboard
- **WHEN** I click "+ Ajouter patient" button
- **THEN** a modal opens with a form
- **AND** I can enter patient phone number (required, validated as Tunisian format +216XXXXXXXX)
- **AND** I can optionally enter patient name
- **AND** after submitting, the patient is added to the end of the queue
- **AND** the patient receives an SMS confirmation with their position
- **AND** the patient's checkInMethod is recorded as "MANUAL"

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** SMS integration, phone validation

---

#### Feature 1.3: Call Next Patient
**User Story:**
> As a doctor/receptionist, I want to call the next patient with a single button click, so that I can efficiently move through the queue without manual tracking.

**Acceptance Criteria:**
- **GIVEN** I am viewing the queue with waiting patients
- **WHEN** I click "Appeler Suivant" button
- **THEN** the first patient in "WAITING" status changes to "IN_CONSULTATION"
- **AND** the patient receives an SMS "C'est votre tour!" notification
- **AND** all other patients' positions are recalculated and updated
- **AND** the Socket.io event triggers real-time updates on all connected patient status pages
- **AND** if no patients are waiting, the button is disabled with a message "Aucun patient en attente"

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** Queue logic, SMS integration, Socket.io

---

#### Feature 1.4: Remove Patient from Queue
**User Story:**
> As a receptionist, I want to remove a patient from the queue (no-show, cancellation), so that the queue remains accurate and other patients' positions update correctly.

**Acceptance Criteria:**
- **GIVEN** I am viewing a patient in the queue
- **WHEN** I click the remove/delete icon next to their name
- **THEN** a confirmation dialog appears "Êtes-vous sûr de retirer [patient name]?"
- **AND** upon confirmation, the patient's status changes to "CANCELLED"
- **AND** remaining patients' positions are recalculated
- **AND** the patient does NOT receive a notification (silent removal)

**Priority:** P0 - Critical
**Estimate:** 1 day
**Dependencies:** Queue logic

---

#### Feature 1.5: Mark Patient as Completed
**User Story:**
> As a doctor/receptionist, I want to mark the current patient as "completed" after their consultation, so that the queue reflects accurate historical data.

**Acceptance Criteria:**
- **GIVEN** a patient is in "IN_CONSULTATION" status
- **WHEN** I click "Terminer" button or call the next patient
- **THEN** the patient's status changes to "COMPLETED"
- **AND** the completedAt timestamp is recorded
- **AND** the patient is removed from the active queue view (moved to "completed" list)

**Priority:** P0 - Critical
**Estimate:** 1 day
**Dependencies:** Queue logic

---

### Epic 2: Patient Check-In

#### Feature 2.1: QR Code Check-In
**User Story:**
> As a patient, I want to scan a QR code to join the queue, so that I can check in quickly without waiting at reception.

**Acceptance Criteria:**
- **GIVEN** the clinic has a printed QR code poster
- **WHEN** I scan the QR code with my phone camera
- **THEN** I am taken to a check-in landing page (https://q.doctorq.tn/checkin/{clinicId})
- **AND** I see the clinic name and doctor name
- **AND** I see an input field for my phone number (pre-filled country code +216)
- **AND** I see an optional input field for my name
- **AND** after submitting, I receive immediate visual confirmation "Vous êtes enregistré! Position: #5"
- **AND** I am redirected to my personal queue status page
- **AND** I receive an SMS with my position and status link
- **AND** my checkInMethod is recorded as "QR_CODE"

**Priority:** P0 - Critical
**Estimate:** 3 days
**Dependencies:** QR code generation, SMS integration

---

#### Feature 2.2: Generate Clinic QR Code
**User Story:**
> As a clinic owner, I want to generate and print a QR code unique to my clinic, so that patients can scan it to join my queue.

**Acceptance Criteria:**
- **GIVEN** I am logged in as a clinic
- **WHEN** I navigate to Settings → QR Code
- **THEN** I see a unique QR code for my clinic
- **AND** the QR code encodes the URL https://q.doctorq.tn/checkin/{myClinicId}
- **AND** I can download the QR code as a PNG file
- **AND** I see a "Print" button that opens a print-friendly poster layout

**Priority:** P0 - Critical
**Estimate:** 1 day
**Dependencies:** QR code library (qrcode.react)

---

### Epic 3: Patient Queue View

#### Feature 3.1: Patient Status Page
**User Story:**
> As a patient, I want to see my current position in the queue and estimated wait time, so that I know when to return to the clinic.

**Acceptance Criteria:**
- **GIVEN** I have checked into the queue
- **WHEN** I open my personal status page link (from SMS or bookmark)
- **THEN** I see a large position number (e.g., "4ème")
- **AND** I see an estimated wait time (e.g., "≈ 45 minutes")
- **AND** I see a progress indicator showing how many patients are ahead of me
- **AND** I see the clinic name and doctor name
- **AND** the page auto-refreshes every 30 seconds to update my position
- **AND** if I'm called (status changes to "IN_CONSULTATION"), the page turns green and shows "C'est votre tour!"

**Priority:** P0 - Critical
**Estimate:** 3 days
**Dependencies:** Socket.io for real-time updates

---

#### Feature 3.2: Real-Time Position Updates
**User Story:**
> As a patient, I want my queue position to update automatically without refreshing the page, so that I always see accurate information.

**Acceptance Criteria:**
- **GIVEN** I am viewing my patient status page
- **WHEN** my position changes (someone ahead is called or removed)
- **THEN** my position number updates automatically via Socket.io
- **AND** my estimated wait time recalculates
- **AND** I see a subtle animation (fade-in) when the number changes
- **AND** if the connection is lost, I see a "Reconnecting..." indicator

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** Socket.io rooms, queue position calculation

---

### Epic 4: SMS Notifications

#### Feature 4.1: Queue Joined Notification
**User Story:**
> As a patient, I want to receive an SMS when I join the queue, so that I have a record of my position and a link to track my status.

**Acceptance Criteria:**
- **GIVEN** I have just checked into the queue (via QR or manual add)
- **WHEN** my queue entry is created
- **THEN** I receive an SMS within 10 seconds
- **AND** the SMS contains my position number, estimated wait time, and status link
- **AND** the SMS is in French if the clinic language is "fr"
- **AND** the SMS is in Arabic if the clinic language is "ar"
- **AND** the message format matches the template: "Dr. Ahmed - Vous êtes #5 dans la file. Attente: ~35min. Suivi: https://q.doctorq.tn/abc123"

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** Twilio integration, i18n templates

---

#### Feature 4.2: Your Turn Notification
**User Story:**
> As a patient, I want to receive an SMS when it's my turn, so that I know to return to the clinic immediately.

**Acceptance Criteria:**
- **GIVEN** I am next in the queue
- **WHEN** the doctor/receptionist clicks "Appeler Suivant"
- **THEN** I receive an SMS within 10 seconds
- **AND** the SMS says "🎉 Dr. Ahmed - C'EST VOTRE TOUR! Présentez-vous à l'accueil."
- **AND** my status page updates to show green "C'est votre tour!" banner
- **AND** the SMS is in the clinic's configured language (French or Arabic)

**Priority:** P0 - Critical
**Estimate:** 1 day
**Dependencies:** Twilio integration, notification routing

---

### Epic 5: Authentication & Settings

#### Feature 5.1: Clinic Login
**User Story:**
> As a clinic owner/receptionist, I want to log in securely to access my queue dashboard, so that only authorized users can manage my clinic's queue.

**Acceptance Criteria:**
- **GIVEN** I am on the login page (https://doctorq.tn/login)
- **WHEN** I enter my email and password
- **THEN** the system validates my credentials
- **AND** if valid, I receive a JWT token stored in browser localStorage
- **AND** I am redirected to the queue dashboard
- **AND** if invalid, I see an error message "Email ou mot de passe incorrect"
- **AND** the session expires after 7 days of inactivity

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** JWT implementation, bcrypt password hashing

---

#### Feature 5.2: Clinic Settings
**User Story:**
> As a clinic owner, I want to configure my clinic settings (name, language, average consultation time), so that the system accurately reflects my practice.

**Acceptance Criteria:**
- **GIVEN** I am logged in
- **WHEN** I navigate to Settings
- **THEN** I see a form with fields: clinic name, doctor name, phone, language (FR/AR), average consultation time (minutes)
- **AND** I can update any field and click "Sauvegarder"
- **AND** changes take effect immediately (e.g., SMS language changes for new patients)
- **AND** I see a success message "Paramètres mis à jour"

**Priority:** P0 - Critical
**Estimate:** 1 day
**Dependencies:** Clinic model, API endpoint

---

### Epic 6: Internationalization (i18n)

#### Feature 6.1: French Language Support
**User Story:**
> As a French-speaking user (receptionist or patient), I want all interface text in French, so that I can use the system comfortably.

**Acceptance Criteria:**
- **GIVEN** the clinic language setting is "fr" or my browser is set to French
- **WHEN** I view any page (dashboard, patient status, check-in)
- **THEN** all UI text appears in French
- **AND** all buttons, labels, and messages use French translations
- **AND** SMS notifications are sent in French
- **AND** date/time formats follow French conventions (e.g., "14 janvier 2026")

**Priority:** P0 - Critical
**Estimate:** 2 days
**Dependencies:** react-i18next setup, translation files

---

#### Feature 6.2: Arabic Language Support with RTL
**User Story:**
> As an Arabic-speaking user, I want the interface in Arabic with right-to-left layout, so that I can read and navigate naturally.

**Acceptance Criteria:**
- **GIVEN** the clinic language setting is "ar" or my browser is set to Arabic
- **WHEN** I view any page
- **THEN** all UI text appears in Arabic
- **AND** the entire layout flips to RTL (text aligns right, navigation on right side)
- **AND** SMS notifications are sent in Arabic
- **AND** numbers display in Arabic-Indic numerals (٥ instead of 5) or Western numerals based on preference
- **AND** the HTML direction attribute changes to `dir="rtl"`

**Priority:** P0 - Critical
**Estimate:** 3 days
**Dependencies:** Tailwind RTL plugin, Arabic translations

---

## Acceptance Criteria

### Global Acceptance Criteria (Apply to All Features)

1. **Performance**
   - Page load time <5 seconds on 3G connection
   - API response time <2 seconds (p95)
   - Real-time updates delivered within 3 seconds

2. **Accessibility**
   - WCAG 2.1 AA compliance
   - All interactive elements keyboard accessible (Tab, Enter, Escape)
   - ARIA labels on all icons and non-text elements
   - Color contrast ratio minimum 4.5:1

3. **Mobile Responsiveness**
   - All pages work on screen sizes 320px-1920px width
   - Touch targets minimum 44×44 pixels
   - No horizontal scrolling on mobile

4. **Error Handling**
   - All API errors show user-friendly messages (not stack traces)
   - Network failures trigger graceful degradation (show cached data if available)
   - SMS failures retry 3 times before marking as failed

5. **Security**
   - All API endpoints require JWT authentication (except public patient status pages)
   - Passwords hashed with bcrypt (10 rounds)
   - HTTPS enforced in production
   - CORS configured to allow only doctorq.tn origins

6. **Browser Support**
   - Chrome/Edge (last 2 versions)
   - Firefox (last 2 versions)
   - Safari iOS (last 2 versions)
   - No IE11 support required

---

## P0 vs Out-of-Scope

### Feature Comparison Table

| Feature | P0 (MVP) | P1 (v1.1) | P2 (Future) | Out of Scope |
|---------|----------|-----------|-------------|--------------|
| **Queue Dashboard** | ✅ View queue, add/call/remove patients | Analytics tab | Multi-doctor support | Medical records |
| **Check-In Methods** | ✅ QR code, ✅ Manual receptionist add | WhatsApp bot | SMS keyword ("QUEUE") | - |
| **Notifications** | ✅ Queue joined, ✅ Your turn | "Almost turn" (2 patients away) | Position updates every 15min | - |
| **Languages** | ✅ French, ✅ Arabic (RTL) | Auto-detect browser language | English, other languages | - |
| **Patient View** | ✅ Position, ✅ estimated wait, ✅ real-time updates | "On my way" button | Offline mode with cache | Native app |
| **Authentication** | ✅ Clinic login (email/password) | Password reset via email | 2FA, SSO | Patient login |
| **Analytics** | Today's stats only (waiting, seen, avg wait) | Historical charts, export CSV | Predictive wait times (ML) | Revenue tracking |
| **QR Code** | ✅ Generate + download PNG | Printable poster with instructions | TV display mode | - |
| **Settings** | ✅ Clinic name, language, avg consultation time | Operating hours, break times | Multiple locations | - |

### Explicitly Out of Scope

**Never in DoctorQ (Different Product)**
- ❌ Patient medical records or EMR integration
- ❌ Payment processing or invoicing
- ❌ Teleconsultation or video calls
- ❌ Prescription management
- ❌ Appointment booking system (different from same-day queue)

**Not in MVP, Maybe Future**
- ⏳ Native iOS/Android apps (web-first strategy)
- ⏳ Multi-doctor/multi-room support (start with single doctor)
- ⏳ TV waiting room display (pilot feedback needed)
- ⏳ Patient feedback/rating system (after scale)

---

## Feature Dependencies

### Dependency Graph

```
Database Schema
  ├── Authentication (Clinic login)
  │     ├── Queue Dashboard
  │     ├── Settings
  │     └── QR Code Generation
  │
  ├── Queue Management API
  │     ├── Add Patient
  │     ├── Call Next
  │     ├── Remove Patient
  │     └── Real-time Updates (Socket.io)
  │           └── Patient Status Page
  │
  ├── SMS Integration (Twilio)
  │     ├── Queue Joined Notification
  │     └── Your Turn Notification
  │
  └── i18n Setup (react-i18next)
        ├── French Translations
        └── Arabic Translations + RTL
```

### Critical Path (Blocks Launch)

1. **Week 1:** Database schema → Authentication → Queue API
2. **Week 2:** Queue Dashboard → Add/Call/Remove → Real-time updates
3. **Week 3:** QR Code Check-in → Patient Status Page → Socket.io integration
4. **Week 4:** SMS Integration → i18n French/Arabic → Notification routing
5. **Week 5:** Testing, bug fixes, mobile responsive polish
6. **Week 6:** Deployment, pilot onboarding

**Blocker:** If any Week 1-4 feature is incomplete, MVP launch is at risk.

---

## MVP Success Metrics

### Launch Readiness Criteria

**Technical Metrics**
- [ ] All P0 features implemented and tested (16 features above)
- [ ] 80%+ code coverage (unit + integration tests)
- [ ] <5 second page load on 3G network (tested with Chrome DevTools throttling)
- [ ] 95%+ SMS delivery rate to Tunisian numbers (validated with test sends)
- [ ] 99%+ uptime during pilot week (Vercel/Railway monitoring)
- [ ] Zero critical or high-severity bugs in production

**User Acceptance Metrics**
- [ ] 3 pilot clinics onboarded and trained (<15 min training time per receptionist)
- [ ] 50+ patients checked in across 3 clinics in first week
- [ ] <5 support requests per clinic per week
- [ ] Positive qualitative feedback from receptionists (informal survey)

**Business Metrics**
- [ ] Average wait time perception improved (patient survey: "Did you know when your turn was?" >80% yes)
- [ ] Receptionist interruptions reduced (survey: "Fewer 'how long?' questions?" >70% yes)
- [ ] All 3 pilot clinics willing to pay 50 TND/month after 2-week trial

---

## User Acceptance Testing Scenarios

### Scenario 1: Happy Path (End-to-End)
**Actors:** Receptionist, Patient, Doctor
**Steps:**
1. Receptionist logs in and sees empty queue
2. Patient arrives and scans QR code
3. Patient enters phone +216 98 123 456 and name "Ahmed Trabelsi"
4. Patient receives SMS "Vous êtes #1 dans la file"
5. Receptionist sees Ahmed in position #1 on dashboard
6. Doctor clicks "Appeler Suivant"
7. Ahmed receives SMS "C'EST VOTRE TOUR!"
8. Ahmed's status page turns green "Maintenant"
9. Doctor clicks "Terminer" after consultation
10. Ahmed moves to "Completed" list

**Expected Outcome:** Full flow works without errors, all notifications delivered, real-time updates work

---

### Scenario 2: Manual Add (No QR Code)
**Actors:** Receptionist, Elderly Patient
**Steps:**
1. Elderly patient arrives without smartphone
2. Receptionist clicks "+ Ajouter patient"
3. Receptionist enters phone +216 22 456 789 (no name)
4. Patient receives SMS with position
5. Receptionist tells patient their position verbally
6. Patient waits in waiting room
7. When called, patient hears name announced and sees "Your Turn" on shared screen (optional)

**Expected Outcome:** Manual add works seamlessly, patient receives SMS even without QR scan

---

### Scenario 3: No-Show Handling
**Actors:** Receptionist, 3 Patients (A, B, C)
**Steps:**
1. Patient A, B, C check in (positions #1, #2, #3)
2. Doctor calls Patient A (position #1)
3. Patient A doesn't arrive after 5 minutes
4. Receptionist removes Patient A from queue
5. Patient B automatically becomes #1
6. Patient C becomes #2
7. Doctor calls Patient B

**Expected Outcome:** Queue positions recalculate correctly, no "ghost" patients block queue

---

### Scenario 4: Arabic RTL Flow
**Actors:** Arabic-speaking receptionist and patients
**Steps:**
1. Clinic settings set to Arabic language
2. Receptionist logs in, sees dashboard in Arabic with RTL layout
3. Patient checks in via QR code, sees Arabic check-in form
4. Patient receives SMS in Arabic "أنت رقم 3 في الطابور"
5. Patient status page displays in Arabic with RTL
6. All numbers and text align right-to-left

**Expected Outcome:** Full Arabic experience with proper RTL layout, no broken UI

---

### Scenario 5: Offline Resilience
**Actors:** Patient with poor connection
**Steps:**
1. Patient checks in successfully via QR code
2. Patient's internet connection drops
3. Patient opens status page link from SMS (cached version loads)
4. Patient sees last known position (stale but visible)
5. Connection returns, page auto-reconnects
6. Position updates to current state

**Expected Outcome:** PWA offline cache shows stale data gracefully, reconnects automatically

---

## Post-MVP Roadmap (P1 Features for v1.1)

### P1 Features (Target: Weeks 7-8)

1. **WhatsApp Business API Integration**
   - Patient checks in via WhatsApp "ARRIVER" message
   - Notifications sent via WhatsApp instead of SMS
   - Reduces SMS costs by ~60% (WhatsApp cheaper)
   - **Success Metric:** 50%+ patients use WhatsApp check-in

2. **"Almost Your Turn" Notification**
   - Auto-send SMS/WhatsApp when 2 patients away
   - Reduces no-shows by reminding patients to return
   - **Success Metric:** No-show rate drops from 10% to <5%

3. **Basic Analytics Dashboard**
   - Charts: patients per day, avg wait time, peak hours
   - Export daily stats to CSV
   - **Success Metric:** Clinics use data to optimize scheduling

4. **Printable QR Poster**
   - PDF generation with clinic branding
   - Instructions in French + Arabic
   - **Success Metric:** Clinics print and display prominently

5. **"On My Way" Button**
   - Patient clicks button when leaving for clinic
   - Receptionist sees ETA indicator
   - **Success Metric:** Reduces time spent waiting inside clinic

6. **No-Show Tracking**
   - Automatic no-show marking after 10 min
   - Daily no-show report for clinic
   - **Success Metric:** Clinics identify patterns, reduce no-shows

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 11, 2026 | Product Team | Initial MVP scope definition |

**Review Cycle:** Every 2 weeks during development
**Next Review:** Jan 25, 2026 (post-Phase 2)

---

## Related Documents

- [01_Project_Charter.md](01_Project_Charter.md) - Project governance and objectives
- [03_Complete_Cost_Breakdown.md](03_Complete_Cost_Breakdown.md) - Feature cost analysis
- [06_Database_Schema_Design.md](06_Database_Schema_Design.md) - Data model for features
- [11_API_Specification.md](11_API_Specification.md) - API endpoints for each feature
- [15_Project_Phases.md](15_Project_Phases.md) - Implementation timeline

---

**Approval Status:** ✅ **APPROVED** - Ready for implementation
