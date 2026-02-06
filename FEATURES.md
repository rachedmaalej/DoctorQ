# BleSaf - Complete Feature Reference

> Queue management SaaS for Tunisian medical clinics. Patients check in via QR code, track their position in real-time, and get SMS notifications when their turn approaches.

---

## Core Queue Management

### Patient Check-In (4 Methods)
- **QR Code**: Patients scan a clinic-specific QR code displayed in the waiting room to join the queue instantly from their phone
- **Manual Entry**: Receptionist adds patients from the dashboard (name + phone number + optional appointment time)
- **SMS**: Patients text to join the queue remotely
- **WhatsApp**: WhatsApp-based check-in integration

### Queue Operations
- **Call Next**: One-click to call the next waiting patient, auto-sends SMS notification
- **Reorder**: Drag patients up/down in the queue to adjust priority
- **Emergency Priority**: Move any patient to position #1 instantly
- **Complete Consultation**: Mark current patient as done, auto-advances queue
- **Remove Patient**: Cancel/remove with confirmation dialog
- **Clear Queue**: Remove all waiting patients at once (with confirmation)
- **Reset Stats**: Clear today's stats counter

### Queue Status Flow
```
WAITING → NOTIFIED → IN_CONSULTATION → COMPLETED
                                      → NO_SHOW
                                      → CANCELLED
```

### Appointment Support
- Optional scheduled appointment time per patient
- Walk-in vs appointment distinction
- Appointment time displayed on patient status page

---

## Patient Experience

### Real-Time Status Page
Every patient gets a unique status page (`/patient/:id`) with live updates via WebSocket:

- **Position Tracking**: See exact queue position, updated in real-time
- **Wait Estimate**: Predicted wait time based on average consultation duration and current position
- **Patient Journey Visual**: Animated progress bar showing position relative to the queue

### Dynamic States with Animations
| State | Trigger | Visual |
|-------|---------|--------|
| **Waiting** | Position 4+ | Calm blue theme, fun facts displayed |
| **Getting Closer** | Position 3 | Teal highlights, "getting closer" message |
| **Almost There** | Position 2 | Amber pulse animation, "almost your turn" |
| **You're Next** | Position 1 | Green urgent card with pulsing glow |
| **Your Turn** | Called in | Confetti celebration, double phone vibration, large green banner |

### Specialty-Based Fun Facts
Bilingual educational facts displayed while patients wait, tailored to the clinic's medical specialty:

- **7 Supported Specialties**: General Medicine, Ophthalmology, Dentistry, Cardiology, Dermatology, Pediatrics, Gynecology
- **350 Bilingual Facts**: 50 facts per specialty, each in French and Arabic
- **5 Categories per Specialty**: Each with a themed icon (e.g., teeth/gums/hygiene/treatments/trivia for dentistry)
- **Auto-Rotation**: New fact every 18 seconds with animated progress circle
- **Randomized Order**: Shuffled on page load so patients never see the same sequence
- **Smart Fallback**: If no specialty set, falls back to General Medicine facts
- **Doctor Control**: Doctors choose their specialty during onboarding; can toggle fun facts on/off in settings

### Patient Actions
- **Leave Queue**: Exit the queue at any time from the status page
- **Language Toggle**: Switch between French and Arabic on the fly
- **Phone Vibration**: Haptic feedback when position changes or turn arrives

### Announcements
- Doctors can broadcast messages to all waiting patients (e.g., "Running 15 minutes late")
- Displayed as a prominent banner on every patient's status page
- Real-time delivery via WebSocket
- 4 preset quick messages + custom text (500 char limit)

---

## Doctor Dashboard

### Overview
Responsive dashboard with separate mobile and desktop layouts:

- **Mobile**: Card-based queue view with compact stats bar and touch-friendly actions
- **Desktop**: Side-by-side layout with sticky QR code sidebar, stats panel, action bar, and queue list

### Doctor Presence Toggle
Green/gray switch that broadcasts to all patient pages:
- When **ON**: "Doctor present" — patients see active queue, call-next enabled
- When **OFF**: "Doctor absent" — patients see absence notice, call-next disabled

### Live Statistics
- Patients currently waiting
- Total patients seen today
- Average wait time (today)
- Last consultation duration
- No-shows count

### QR Code Card
- Auto-generated clinic-specific QR code
- Points to check-in URL (`/checkin/:clinicId`)
- Downloadable as PDF for printing
- Displayed on dashboard sidebar and available in a full-screen modal

### Daily Recap Overlay
A daily ritual notification that greets doctors on their first login each day:

- **3 KPIs**: Total patients seen yesterday, average consultation duration, average wait time
- **Trend Indicators**: Each KPI shows % change vs previous workday AND vs 30-day monthly average
- **Color-Coded Trends**: Green arrows for improvements, red for declines (inverted for wait time — lower is better)
- **Animated Count-Up**: Numbers animate from 0 to final value with ease-out cubic easing
- **Staggered KPI Entrance**: Each card slides in with 150ms delay between them
- **15-Second Auto-Dismiss**: Progress bar shows remaining time; manual dismiss via button or backdrop click
- **Once Per Day**: localStorage gate ensures it only appears on the first visit of each day
- **Zero Performance Impact**: Data fetched lazily from pre-computed DailyStat table (not live queries)

---

## Multi-Doctor Support

- Add multiple doctors to a clinic, each with name and optional specialty
- Assign patients to specific doctors when adding to queue
- Individual doctor management in Settings page
- Average consultation time configurable per doctor

---

## Onboarding (3-Step Wizard)

### Step 1: Clinic Setup
- Clinic name, doctor name, phone number
- Average consultation time selector (5/10/15/20/30 min)
- **Specialty Picker**: Grid of 7 specialty cards with icons — selecting one shows a live fun fact preview
- Value proposition copy: "Your patients will see interesting facts like this while waiting"

### Step 2: QR Code Setup
- Display clinic QR code with print/download option
- 3-step patient instructions visual
- Check-in URL for manual sharing

### Step 3: Quick Tutorial
- How to add patients manually
- SMS notification system overview
- Announcement feature walkthrough
- Trial info: 30 days free + 50 free SMS

---

## Settings

### Clinic Information
- Clinic name, doctor name, phone, address
- Business type (medical vs retail — adjusts labels: "patient" vs "client")

### Queue Configuration
- Average consultation time (5-120 minutes)
- Notify patient at position (1-10)

### Patient Experience
- **Specialty Selector**: Choose from 7 medical specialties
- **Fun Facts Toggle**: Enable/disable fun facts on patient status page
- **Live Preview**: See a sample fun fact card with the selected specialty

### Account Security
- Change password (current + new with confirmation)

### Doctor Management
- Add/remove doctors with name and optional specialty

---

## Subscription & Billing

### Plans
| Plan | Price | Details |
|------|-------|---------|
| **Free Trial** | 0 TND | 30 days, full access, 50 free SMS |
| **Monthly** | 50 TND/month | Full access, auto-renew |
| **Yearly** | 500 TND/year | 2 months free (16% savings) |

### SMS Credit Packages
| Package | Credits | Price | Per SMS |
|---------|---------|-------|---------|
| Starter | 100 | 10 TND | 0.10 TND |
| Standard | 300 | 25 TND | 0.08 TND |
| Pro | 1000 | 70 TND | 0.07 TND |

### Payment
- **Konnect** (Tunisian payment gateway) for online payments
- Admin can record manual payments (bank transfer, cash, cheque)
- Payment history tracking with status (paid/pending/failed)

### Trial Enforcement
- Countdown banner on dashboard (color-coded: green → yellow → red)
- Warning emails at 7 days and 3 days remaining
- App access blocked when trial/subscription expires

---

## SMS Notifications

### Automated Triggers
| Event | Message |
|-------|---------|
| **Queue Joined** | Confirmation with position and estimated wait |
| **Almost Your Turn** | Alert when reaching the configurable notify position |
| **Your Turn** | "Please proceed to the doctor" with clinic details |

### Credit System
- 1 credit per SMS sent
- Balance checked before sending — graceful skip if insufficient
- Credits visible in dashboard and subscription page
- Low credit warning when < 20 remaining

---

## Admin Panel (5 Tabs)

### Overview
- Subscription KPIs: Active trials, paid subscriptions, MRR, conversion rate
- Top clinics ranking by patient volume
- At-risk churn detection (low usage clinics)
- Activity feed (admin action audit trail)
- Onboarding funnel visualization (signup → verified → setup → active)
- Period selector: Today / 7 Days / 30 Days / All Time

### Clinics Management
- Full clinic list with search, subscription status, and activity indicators
- Create new clinic with email + password
- **Clinic Detail View** (4 sub-tabs):
  - Overview: Info, subscription, SMS credits
  - Patients: All-time patient list
  - Billing: Payment history, record payments, SMS credit adjustment
  - Settings: Edit clinic, extend trial, reset password, delete clinic
- **Impersonation**: Admin can "login as" any clinic to see their exact dashboard

### Financial Analytics
- MRR/ARR tracking with trend charts
- Subscription breakdown (trial/monthly/yearly/expired)
- Churn rate calculation
- Payment success rates

### Engagement & Feature Adoption
- Check-in method breakdown (QR vs manual vs SMS vs WhatsApp)
- SMS usage statistics
- Multi-doctor adoption rate
- Average patients per clinic per day

### Platform Health
- API / Database / SMS / Email service status
- SMS credit pool (issued / used / remaining)
- Clinic statistics (total / active / trial / paid)

---

## Real-Time Infrastructure (Socket.io)

### WebSocket Rooms
- `clinic:{id}` — Authenticated dashboard room
- `clinic:{id}:patients` — Broadcast to all patients of a clinic
- `patient:{entryId}` — Individual patient status room

### Live Events
- Queue updates (position changes, new patients, removals)
- Doctor presence changes
- Announcement broadcasts
- Patient status transitions
- Automatic reconnection on disconnect

---

## Internationalization (i18n)

- **French** (default): LTR layout
- **Arabic**: Full RTL layout with Tailwind `ltr:/rtl:` directives
- All UI text, patient messages, preset announcements, and fun facts available in both languages
- Language persisted in localStorage, switchable from any page
- Arabic font: IBM Plex Sans Arabic

---

## Scheduled Tasks (Cron)

| Time | Task |
|------|------|
| **Midnight** (Africa/Tunis) | Archive daily stats to DailyStat, clear stale queue entries, reset doctor presence, clear announcements |
| **9:00 AM** (Africa/Tunis) | Send trial expiration warning emails (7-day and 3-day) |

---

## Technical Highlights

- **Monorepo**: pnpm workspaces (`apps/api` + `apps/web`)
- **Real-time**: Socket.io for sub-second queue updates
- **Mobile-first**: Responsive design with separate mobile/desktop layouts
- **Performance**: 10-second stats cache, lazy-loaded overlays, pre-computed daily stats
- **Security**: JWT auth, bcrypt passwords, email verification, no patient accounts
- **Tunisian Market**: +216 phone format, Konnect payments (millimes), Africa/Tunis timezone, bilingual FR/AR
