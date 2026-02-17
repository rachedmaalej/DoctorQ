# BleSaf Patient Status Page: Strategic Redesign

**Prepared by:** UX/UI Strategy Consultant  
**Date:** February 14, 2026

---

## The Core Insight

Every patient in a waiting room has one overwhelming question: **"How much longer?"** Everything else — their position number, the clinic name, the queue ID — is secondary noise. The current BleSaf patient status page buries this answer under decorative elements (the ticket card, chair metaphors, fun facts) that prioritize visual flair over emotional relief.

With the new smart wait time estimation engine (EMA-based, real-time adjusted), BleSaf now has something genuinely powerful to show patients. The redesign makes that the hero.

---

## Design Principles

### 1. Information Hierarchy = Anxiety Hierarchy

Patients' concerns, in order of intensity:

| Priority | Patient Question | Current Page | Redesigned Page |
|----------|-----------------|--------------|-----------------|
| **#1** | "How much longer?" | ❌ Not shown (or naive estimate buried) | ✅ **~33 min** — largest element, 72px, impossible to miss |
| **#2** | "Am I getting closer?" | ❌ No progress indication | ✅ Progress dots + "You moved up!" toast notifications |
| **#3** | "How many people ahead?" | ⚠️ Shows "#1" position (confusing) | ✅ "4 personnes devant vous" — natural language |
| **#4** | "What's happening now?" | ❌ Fun facts (irrelevant) | ✅ Consultation progress bar + contextual tips |
| **#5** | "Can I leave safely?" | ⚠️ Easy-to-accidentally-tap button | ✅ Understated link with confirmation step |

### 2. Respect the Medical Context

Waiting at a doctor's office is an anxious experience. The design should feel **calm, professional, and reassuring** — not playful. Specifically:

- **No confetti.** Replace with a calm green "Your Turn" screen with clear instructions
- **No fun facts.** Replace with actionable context ("You have time for coffee" vs. "Stay in the waiting room")
- **No ticket metaphor.** A clinic is not a movie theater. Use clean, minimal information display

### 3. Show Movement, Not Snapshots

The current page is static — patients see a number and nothing changes until they refresh. The redesign introduces three layers of visible progress:

- **Consultation progress bar:** Shows the current patient's consultation advancing in real-time (powered by the new `computeSmartWaitEstimate` data)
- **Progress dots:** Visual representation of people ahead, with dots "filling in" as patients are seen
- **"You moved up!" toast:** A brief, satisfying notification each time the queue advances

---

## The Five States

The patient status page has five distinct states. Each requires different design treatment:

### State 1: Waiting (Position 3+)
- **Hero:** Large wait time estimate (~33 min)
- **Progress:** "4 personnes devant vous" with dot visualization
- **Context:** Current consultation progress bar
- **Tip:** Contextual — if wait > 20 min, suggest taking a coffee; if < 10 min, suggest staying close
- **Leave:** Available but understated

### State 2: Almost There (Position 3)
- **Hero:** Reduced wait time (~13 min)
- **Progress:** "2 personnes devant vous" — dots are filling up
- **Context:** Consultation progress bar showing higher completion
- **Tip:** "Restez à proximité du cabinet"
- **Leave:** Still available

### State 3: You're Next (Position 2 / NOTIFIED)
- **Hero:** Small wait time (~3 min)
- **Progress:** "1 personne devant vous" — almost full
- **Highlight:** Green-bordered card: "Préparez-vous — restez à proximité"
- **Leave:** Still available but consider hiding

### State 4: Your Turn (IN_CONSULTATION)
- **Background shifts** to soft green gradient
- **Hero:** "C'est votre tour" — clear, bold, calm
- **Card:** Green gradient card with instructions: "Dirigez-vous vers la salle de consultation"
- **No leave button** — they've been called
- **No confetti** — just professional clarity

### State 5: Doctor Absent
- **Hero:** Shows position only (no time estimate — would be misleading)
- **Context:** "Le médecin n'est pas encore arrivé" or "Pause entre consultations"
- **Tip:** "Nous vous préviendrons dès que les consultations reprendront"

---

## What's Removed (and Why)

| Removed Element | Why |
|----------------|-----|
| **Giant ticket card (#1)** | Takes 40% of screen real estate to show one number. The wait time estimate is more useful |
| **Fun facts** | Patients don't want distraction — they want information. Replaced with contextual tips |
| **Confetti animation** | Excessive and tone-deaf in a medical setting. Replaced with calm green screen |
| **Chair/journey metaphor** | Visual metaphor that requires interpretation. "4 personnes devant vous" needs zero interpretation |
| **Prominent "Quitter le Saf" button** | Too easy to accidentally tap. Replaced with understated text link + confirmation |
| **"Présentez-vous à l'accueil"** | Instruction for reception check-in is confusing on the digital check-in status page |

---

## What's Added (and Why)

| New Element | Rationale |
|-------------|-----------|
| **Large wait time estimate (~33 min)** | Answers the #1 patient question immediately. Powered by smart estimation engine |
| **"X personnes devant vous"** | Natural language > abstract position numbers. Instantly comprehensible |
| **Progress dots** | Visual journey — each dot "filling in" creates a sense of forward movement |
| **Consultation progress bar** | BleSaf's differentiator: patients see the current consultation advancing. Reduces "is anything happening?" anxiety |
| **"You moved up!" toast** | Celebrates progress, not just arrival. Creates positive micro-moments throughout the wait |
| **Contextual tips** | Practical guidance (can I get coffee? should I stay close?) instead of random facts |
| **Confirmation for leave** | Prevents accidental queue exits — a frustration the critique specifically identified |
| **Arrival time** | Small timestamp anchors the patient's experience ("I arrived at 10:23") |
| **Personal greeting** | "Bonjour Sami 👋" — small touch that makes the experience feel human, not transactional |

---

## Integration with Smart Wait Time Estimation

The redesign is specifically designed to leverage the new estimation engine:

| Estimation Feature | How It's Used in the UI |
|---|---|
| `estimatedWaitMins` (smart estimate) | **The hero number** — displayed at 72px, updates in real-time |
| `effectiveAvgMins` (EMA-based) | Powers the consultation progress bar (elapsed / effective avg = progress %) |
| Remaining current consultation time | Shown through the progress bar — patients can see the current consultation nearing completion |
| Position-aware calculation | Drives the contextual tips (> 20 min → coffee suggestion, < 10 min → stay close) |
| Real-time updates via Socket.io | Triggers the "You moved up!" toast when position changes |

The `WaitEstimateCard` component becomes a pure display component (as specified in the estimation plan), receiving `estimatedWaitMins` directly from the server.

---

## Implementation Notes

### Frontend Changes
- `PatientStatusPage.tsx`: Restructure around the new information hierarchy
- `WaitEstimateCard.tsx`: Already simplified per the estimation plan — accepts `estimatedWaitMins` prop
- New: `ProgressDots.tsx` — visual queue progress component
- New: `ConsultationProgress.tsx` — real-time consultation progress bar
- New: `MovedUpToast.tsx` — toast notification triggered by Socket.io position updates
- Modified: `LeaveQueueButton.tsx` — add confirmation step

### Socket.io Events Needed
- `queue:position-changed` → triggers "You moved up!" toast
- `consultation:progress` → updates consultation progress bar (or compute client-side from `calledAt`)

### Accessibility
- All elements need proper `aria-labels`
- Progress dots need `role="progressbar"` with `aria-valuenow` / `aria-valuemax`
- Toast notification needs `role="status"` and `aria-live="polite"`
- Color is never the sole indicator — progress is also shown through text

---

## Summary

The redesign transforms the patient status page from a decorative display into an **anxiety-relief engine**. Every pixel serves the patient's core need: knowing how long they'll wait and seeing that things are moving forward. Combined with the smart estimation backend, this creates BleSaf's most powerful differentiator — **the only clinic queue in Tunisia where patients actually know what's happening.**
