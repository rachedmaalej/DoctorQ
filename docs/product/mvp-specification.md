# DoctorQ MVP - Feature Specification

## Executive Summary

**Product:** DoctorQ - Virtual Queue Management for Tunisian Medical Practices

**Problem:** Patients booking appointments with independent doctors in Tunisia receive a date but no time slot. They arrive and wait unpredictable amounts of time (30 minutes to 3+ hours), unable to plan their day. Doctors meet frustrated patients after long waits.

**Solution:** A lightweight virtual queue system that lets patients track their position in real-time via SMS/WhatsApp, allowing them to wait elsewhere and arrive just before their turn.

**Target Market:** Independent doctors and small clinics in Tunisia (private practice, not hospitals)

**Price Point:** 50 TND/month (~$16 USD)

---

## User Personas

### Primary: The Receptionist (المساعد/ة)
- **Profile:** Works at the front desk, manages patient flow, often overwhelmed during peak hours
- **Pain Points:** Constantly asked "how long until my turn?", juggling phone calls and walk-ins
- **Goal:** Reduce interruptions, manage queue efficiently without adding workload
- **Tech Comfort:** Basic smartphone user, familiar with WhatsApp

### Secondary: The Doctor (الطبيب)
- **Profile:** Independent practitioner, sees 20-40 patients/day
- **Pain Points:** Patients arrive frustrated, consultations start tense, no visibility into waiting room
- **Goal:** Happy patients, efficient practice, professional image
- **Tech Comfort:** Uses smartphone, may have tablet in office

### End User: The Patient (المريض)
- **Profile:** Working adult or parent, time-constrained, visits doctor 2-4x/year
- **Pain Points:** Wastes hours in waiting rooms, can't plan day, anxious about missing turn
- **Goal:** Know when to arrive, use waiting time productively
- **Tech Comfort:** Has smartphone, uses WhatsApp daily, may not want to install apps

---

## MVP Feature Set

### P0: Must Have (Launch Blockers)

#### 1. Queue Management Dashboard (Doctor/Receptionist)

**Mobile Web App** - Responsive design, works on any smartphone browser

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Queue Display | Real-time list of waiting patients | Shows position, name, arrival time, estimated wait |
| Add Patient | Manual entry when patient arrives | Name (optional) + phone number required |
| Call Next | One-button action to call next patient | Triggers notification to patient, updates queue |
| Remove Patient | Handle no-shows or cancellations | Removes from queue, updates positions |
| Current Stats | Today's metrics at a glance | Patients waiting, seen today, avg wait time |

**User Flow:**
```
Patient Arrives → Receptionist adds to queue → Patient receives confirmation 
→ Queue updates in real-time → "Call Next" pressed → Patient notified → Consultation
```

#### 2. Patient Check-in System

| Method | Description | Priority |
|--------|-------------|----------|
| QR Code Scan | Patient scans poster in waiting room | P0 |
| Manual Add | Receptionist enters patient info | P0 |
| WhatsApp Command | Patient texts "ARRIVER" to clinic number | P1 |

**QR Code Flow:**
1. Patient scans QR code with phone camera
2. Opens web page (no app install)
3. Enters phone number
4. Receives SMS confirmation with position
5. Can check status anytime via link

#### 3. Patient Queue View

**Mobile Web Page** - Lightweight, loads fast on 3G

| Element | Description |
|---------|-------------|
| Position Number | Large, prominent display (#4) |
| Estimated Wait | Calculated from average consultation time (~45 min) |
| Progress Indicator | Visual showing patients ahead |
| Refresh | Auto-updates every 30 seconds |

#### 4. Notification System

| Notification | Trigger | Channel |
|--------------|---------|---------|
| Queue Confirmation | Patient joins queue | SMS |
| Position Update | Every 15 min while waiting | SMS (optional) |
| "Almost Your Turn" | 2 patients away | SMS + WhatsApp |
| "Your Turn Now" | Called by doctor | SMS + WhatsApp |

**SMS Templates (French/Arabic):**

```
[JOIN] 
FR: "Dr. Ahmed - Vous êtes #5 dans la file. Attente estimée: ~40min. 
    Statut: [link]"
AR: "د. أحمد - أنت رقم 5 في الطابور. وقت الانتظار: ~40 دقيقة.
    الحالة: [link]"

[ALMOST]
FR: "⚠️ Dr. Ahmed - Plus que 2 patients avant vous! 
    Merci de vous rapprocher du cabinet."
AR: "⚠️ د. أحمد - باقي مريضين قبلك!
    يرجى الاقتراب من العيادة."

[YOUR_TURN]
FR: "🎉 Dr. Ahmed - C'EST VOTRE TOUR! 
    Présentez-vous à l'accueil."
AR: "🎉 د. أحمد - جاء دورك!
    تفضل للاستقبال."
```

#### 5. Language Support

| Language | Priority | Notes |
|----------|----------|-------|
| French | P0 | Default for Tunis area |
| Arabic | P0 | RTL support required |
| Auto-detect | P1 | Based on phone settings |

---

### P1: Should Have (V1.1 - Week 6-8)

| Feature | Description | Business Value |
|---------|-------------|----------------|
| WhatsApp Integration | Full WhatsApp Business API | Higher engagement (95%+ open rate) |
| Basic Analytics | Patients/day, avg wait, peak hours | Helps doctors optimize schedule |
| Printable QR Poster | Downloadable PDF with QR code | Easy setup in waiting room |
| "On My Way" Button | Patient signals they're coming | Reduces no-shows |
| No-Show Tracking | Mark patients who don't show | Data for future features |
| Desktop Dashboard | Full-screen view for reception desk | Better for busy practices |

---

### P2: Nice to Have (Future)

| Feature | Description | When |
|---------|-------------|------|
| Predictive Wait Time | ML model based on historical data | After 3+ months of data |
| TV Display Mode | Waiting room screen showing queue | When hardware partnerships form |
| Patient Feedback | Post-visit rating | When retention is priority |
| Multi-Doctor Support | Multiple queues in one clinic | Premium tier |
| Appointment Booking | Schedule future visits | Different product |

---

### Explicitly NOT in MVP

| Feature | Reason |
|---------|--------|
| Patient Medical Records | Regulatory complexity, different product |
| Payment Processing | Adds liability, distraction from core value |
| Teleconsultation | Requires video infrastructure, different use case |
| Native Mobile Apps | Web works fine, avoids app store friction |
| Complex Scheduling | This is queue management, not booking |
| Multi-location Dashboard | Premium feature, not MVP |

---

## Technical Specification

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Doctor PWA  │  │ Patient Web │  │ Check-in Page           │  │
│  │ (React)     │  │ (React)     │  │ (React)                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Server (Node.js)                     ││
│  │  • Queue Management    • Authentication    • Notifications  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ PostgreSQL    │  │ Redis         │  │ Socket.io         │   │
│  │ (Data Store)  │  │ (Real-time)   │  │ (Live Updates)    │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Twilio      │  │ WhatsApp    │  │ Vercel (Hosting)        │  │
│  │ (SMS)       │  │ Business    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + Tailwind CSS | Fast development, component reuse, good PWA support |
| Backend | Node.js + Express | JavaScript everywhere, good real-time support |
| Database | PostgreSQL | Reliable, good for structured queue data |
| Real-time | Socket.io | Battle-tested, fallback support for poor connections |
| SMS | Twilio or local provider | Reliable delivery to Tunisian numbers |
| WhatsApp | WhatsApp Business API | High engagement, familiar to users |
| Hosting | Vercel (frontend) + Railway (backend) | Easy deployment, reasonable free tier |

### Database Schema (Simplified)

```sql
-- Clinics/Doctors
CREATE TABLE clinics (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    language VARCHAR(5) DEFAULT 'fr',
    avg_consultation_mins INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Queue Entries
CREATE TABLE queue_entries (
    id UUID PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id),
    patient_name VARCHAR(255),
    patient_phone VARCHAR(20) NOT NULL,
    position INT NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, notified, in_consultation, completed, no_show
    check_in_method VARCHAR(20), -- qr, manual, whatsapp
    arrived_at TIMESTAMP DEFAULT NOW(),
    called_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Stats (for analytics)
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id),
    date DATE NOT NULL,
    total_patients INT DEFAULT 0,
    avg_wait_mins INT,
    no_shows INT DEFAULT 0,
    UNIQUE(clinic_id, date)
);
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/queue/:clinicId` | GET | Get current queue |
| `/api/queue/:clinicId/add` | POST | Add patient to queue |
| `/api/queue/:clinicId/next` | POST | Call next patient |
| `/api/queue/:entryId/status` | PATCH | Update patient status |
| `/api/queue/:entryId` | DELETE | Remove from queue |
| `/api/patient/:entryId` | GET | Patient view of their position |
| `/api/clinic/:clinicId/stats` | GET | Today's statistics |
| `/api/checkin/:clinicId` | POST | Patient self check-in |

### Real-time Events (Socket.io)

| Event | Direction | Payload |
|-------|-----------|---------|
| `queue:updated` | Server → Client | Full queue array |
| `patient:called` | Server → Client | Entry ID |
| `position:changed` | Server → Client | Entry ID, new position |

---

## User Interface Specifications

### Doctor/Receptionist Mobile App

**Screen 1: Queue Dashboard**
- Header: Clinic name, date, settings icon
- Stats bar: Waiting count, seen today, avg wait
- Queue list: Scrollable, current patient highlighted
- Bottom action: "Call Next" button (primary CTA)

**Key Interactions:**
- Tap patient → Options menu (notify, call, remove)
- Swipe left → Quick remove
- Pull down → Refresh
- Tap "+" → Add patient modal

**Screen 2: Add Patient Modal**
- Phone number input (required, +216 prefix)
- Name input (optional)
- Visit reason dropdown (optional)
- "Add to Queue" button

### Patient Check-in Page

**Layout:**
- Clinic logo/name at top
- QR code display (for poster generation)
- "OR" divider
- Phone number input
- Name input (optional)
- "Join Queue" button

**After Check-in:**
- Success animation
- Position number (large)
- Estimated wait time
- "You'll receive an SMS when it's almost your turn"
- Link to check status anytime

### Patient Status Page

**Waiting State:**
- Position: Large number with ordinal (4th / 4ème / الرابع)
- Estimated wait: "~45 minutes"
- Progress bar or step indicator
- Patients ahead count
- "Notify me at 2 patients" toggle

**Almost Turn State:**
- Orange/yellow warning theme
- "Get ready! 2 patients ahead"
- "Please head to the clinic"
- Estimated: "5-10 minutes"

**Your Turn State:**
- Green success theme
- "It's your turn!"
- "Please go to reception"
- Total wait time display

---

## Notification Specifications

### SMS Configuration

**Provider Options:**
1. **Twilio** - Reliable, ~$0.03/SMS to Tunisia
2. **Vonage** - Alternative, similar pricing
3. **Local providers** - Cheaper but may have reliability issues

**SMS Character Limits:**
- Standard SMS: 160 characters (7-bit)
- Arabic SMS: 70 characters (16-bit Unicode)
- Recommendation: Keep under 160 chars, use URL shortener

### WhatsApp Business API (P1)

**Setup Requirements:**
- WhatsApp Business Account
- Verified business
- Message templates pre-approved
- API integration (Meta Cloud API or BSP)

**Message Template Categories:**
- `UTILITY` - Queue confirmations, turn notifications
- `AUTHENTICATION` - Not needed for MVP

---

## Localization

### French Strings

```json
{
  "queue.position": "Position dans la file",
  "queue.wait_estimate": "Temps d'attente estimé",
  "queue.patients_ahead": "patients avant vous",
  "queue.your_turn": "C'est votre tour !",
  "queue.get_ready": "Préparez-vous !",
  "action.add_patient": "Ajouter patient",
  "action.call_next": "Appeler suivant",
  "action.notify": "Notifier",
  "status.waiting": "En attente",
  "status.notified": "Notifié",
  "status.in_consultation": "En consultation",
  "time.minutes": "minutes",
  "time.about": "environ"
}
```

### Arabic Strings

```json
{
  "queue.position": "موقعك في الطابور",
  "queue.wait_estimate": "وقت الانتظار المتوقع",
  "queue.patients_ahead": "مريض قبلك",
  "queue.your_turn": "جاء دورك!",
  "queue.get_ready": "استعد!",
  "action.add_patient": "إضافة مريض",
  "action.call_next": "استدعاء التالي",
  "action.notify": "إشعار",
  "status.waiting": "في الانتظار",
  "status.notified": "تم إشعاره",
  "status.in_consultation": "في العيادة",
  "time.minutes": "دقيقة",
  "time.about": "حوالي"
}
```

---

## Cost Analysis

### Monthly Operating Costs (Per Clinic)

| Item | Cost | Notes |
|------|------|-------|
| Hosting (shared) | ~$2 | Amortized across clinics |
| SMS (100 patients × 3 msgs) | ~$9 | At $0.03/SMS |
| WhatsApp (100 msgs) | ~$5 | After free tier |
| **Total per clinic** | **~$16** | |

### Revenue at 50 TND/month (~$16)

| Clinics | Revenue | Costs | Profit |
|---------|---------|-------|--------|
| 5 | $80 | $80 | $0 (break-even) |
| 10 | $160 | $90 | $70 |
| 25 | $400 | $150 | $250 |
| 50 | $800 | $250 | $550 |
| 100 | $1,600 | $450 | $1,150 |

**Conclusion:** Need 10+ clinics to be sustainable, 50+ to be viable business.

---

## Development Phases

### Phase 1: Core MVP (Weeks 1-4)

**Week 1-2: Foundation**
- [ ] Project setup (React, Node, PostgreSQL)
- [ ] Database schema
- [ ] Basic API endpoints
- [ ] Doctor queue dashboard (list view)
- [ ] Add/remove patient functionality

**Week 3: Patient Flow**
- [ ] Patient check-in page
- [ ] QR code generation
- [ ] Patient status page
- [ ] Real-time updates (Socket.io)

**Week 4: Notifications + Polish**
- [ ] SMS integration (Twilio)
- [ ] Arabic language support
- [ ] RTL layout fixes
- [ ] Mobile optimization
- [ ] Error handling

### Phase 2: Pilot (Weeks 5-6)

**Week 5: Soft Launch**
- [ ] Deploy to production
- [ ] Onboard 3 pilot doctors
- [ ] Daily check-ins with users
- [ ] Bug fixes

**Week 6: Iterate**
- [ ] Address feedback
- [ ] Performance optimization
- [ ] Improve UX pain points

### Phase 3: Enhancement (Weeks 7-8)

**Week 7-8: P1 Features**
- [ ] WhatsApp integration
- [ ] Basic analytics dashboard
- [ ] Printable QR poster
- [ ] "On my way" feature

---

## Success Metrics

### MVP Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Doctor Adoption | 3 pilots using daily | Active sessions |
| Patient Usage | 80%+ of patients use queue | Check-ins vs manual adds |
| Notification Delivery | 95%+ SMS delivered | Twilio logs |
| Wait Time Reduction | -30% perceived wait | User feedback |
| Doctor Satisfaction | 8+/10 rating | Survey |

### Key Performance Indicators (Post-Launch)

| KPI | Target (Month 1) | Target (Month 3) |
|-----|------------------|------------------|
| Paying Clinics | 10 | 30 |
| Monthly Active Patients | 500 | 2,000 |
| Avg Wait Time Reduction | 20% | 35% |
| Churn Rate | <10% | <5% |
| NPS Score | >30 | >50 |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Doctors don't adopt | High | Medium | Free pilot period, hands-on onboarding |
| SMS costs exceed revenue | High | Medium | Monitor usage, implement limits |
| Competitors copy quickly | Medium | High | Move fast, build relationships |
| Technical issues during consults | High | Low | Offline fallback, manual override |
| WhatsApp API approval delayed | Medium | Medium | SMS-first approach |
| Patients don't check-in | Medium | Medium | Receptionist backup, education |

---

## Appendix A: Competitor Quick Reference

| Competitor | Market | Queue Feature | Price | Weakness vs Us |
|------------|--------|---------------|-------|----------------|
| DabaDoc | Tunisia, Morocco | ❌ Booking only | Free | No same-day queue |
| Tobba.tn | Tunisia | ❌ Teleconsult | Varies | Different use case |
| Liberrex | Tunisia (enterprise) | ✅ Full | Enterprise | Too expensive/complex |
| Waitwhile | Global | ✅ Full | $60+/mo | Not localized |
| WaitWell | Global | ✅ Full | $50+/mo | Not localized |

---

## Appendix B: Sample QR Code Poster Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         Cabinet Dr. Ahmed               │
│         عيادة د. أحمد                   │
│                                         │
│     ┌─────────────────────────┐         │
│     │                         │         │
│     │       [QR CODE]         │         │
│     │                         │         │
│     │                         │         │
│     └─────────────────────────┘         │
│                                         │
│     Scannez pour rejoindre              │
│     la file d'attente                   │
│                                         │
│     امسح للانضمام إلى                   │
│     قائمة الانتظار                      │
│                                         │
│     ─────────────────────────           │
│     Ou envoyez "ARRIVER" au             │
│     +216 XX XXX XXX                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Appendix C: User Interview Questions

### For Doctors (Validation)

1. How many patients do you see on a typical day?
2. What's the longest wait time you've heard patients complain about?
3. How does your receptionist currently manage the queue?
4. Have you ever lost patients because of long waits?
5. If I could show patients their position in line on their phone, would that help?
6. What would make you NOT want to use a system like this?
7. At 50 TND/month, would this be worth it?

### For Patients (Validation)

1. How long did you wait last time you visited a doctor?
2. What did you do during that wait?
3. Would you have preferred to wait elsewhere if you knew when to return?
4. Do you use WhatsApp? Would you be okay receiving notifications there?
5. Would you scan a QR code to join a virtual queue?

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Author: Business Validation Analysis*
