# BleSaf Patient Status Page Redesign — Compiled Recommendations
### Three-Phase Patient Experience for the Tunisian Market

**Prepared for:** Rached, BleSaf Founder  
**Date:** February 16, 2026

---

## Executive Summary

The current patient status page already nails the hardest design decision: estimated wait time as the hero element. That's the right foundation. But the experience is static — it shows different numbers on the same layout regardless of whether the patient has 2 hours or 2 minutes left. This redesign introduces a **three-phase emotional arc** (Relax → Get Ready → Go Now) where the screen's visual tone, information density, and contextual guidance evolve as the patient progresses through the queue. The result: a patient experience that feels like a good receptionist communicating naturally — "mazelt baaeed" → "9arreb yji dawrek" → "yalla adkhol."

---

## The Three-Phase Design System

### Why Three Phases Instead of a Static Timeline

The current vertical timeline (Enregistré → En attente → Bientôt votre tour → C'est votre tour → Terminé) treats all steps as visually equal. But the patient experience is wildly unequal — "En attente" might last 2 hours, "C'est votre tour" lasts 30 seconds. A five-step timeline with four grayed-out steps gives visual parity to phases with drastically different durations, and the 60% of screen space consumed by grayed-out future steps is wasted real estate during the longest part of the experience.

The three-phase approach replaces this with a system that adapts to what the patient actually needs at each moment:

| Phase | Trigger | Duration | Patient Mindset | Design Tone |
|-------|---------|----------|-----------------|-------------|
| **☕ Relax** | >3 people ahead, >30 min | ~60-120 min | "Can I leave? How long?" | Calm teal, spacious, café suggestion, "je m'absente" button |
| **⚡ Get Ready** | 2-3 people ahead, 10-50 min | ~20-50 min | "Should I pay attention?" | Warm amber, alert without urgency, "stay close" guidance |
| **🚪 Go Now** | 0-1 people ahead | ~1-5 min | "Is it me? Where do I go?" | Vivid green, pulsing, "J'arrive!" confirmation button |

---

## Recommendation 1: Replace the Timeline Stepper with a Progress Ring

**Problem:** The vertical timeline occupies 60% of every screen but only 2 of 5 steps are ever active during the long waiting phase. The remaining 3 grayed-out steps are dead space. Additionally, "Position #6 dans le saf" creates confusing redundancy with "6 personnes devant vous" — position number and people-ahead count may not always match.

**Solution:**

A circular progress ring replaces the timeline. The ring fills proportionally as the patient advances, giving a continuous sense of forward movement rather than discrete steps. Inside the ring: a large number showing people remaining ahead.

The ring's color shifts with the phase — teal during Relax, amber during Get Ready, green during Go Now — creating an ambient visual cue that something has changed even at a glance.

**Why this is better:**
- Continuous progress instead of discrete steps — waiting feels like movement, not stagnation
- Freed screen space for useful, phase-appropriate content
- Single source of truth — "people ahead" appears once, no conflicting numbers
- Color-as-communication — urgency is sensed subconsciously through ring color shift

**Example:** At position #6, the ring is 10% filled in teal. At position #3, it's half-filled and amber — the patient glances at their phone and immediately senses "things changed." At position #1, the ring is replaced by a pulsing green circle with a person icon.

---

## Recommendation 2: Phase-Appropriate Information Density and Contextual Guidance

**Problem:** Every screen shows the same information architecture: wait time, position, timeline, and the same "café" tip card. But a patient at #6 has fundamentally different needs than one at #2. Content that reassures at #6 ("take your time") is maddening at #2 ("I've been here over an hour"). The static info card showing "Durée moy. consultation: ~20 min" never connects itself to the hero estimate, leaving patients wondering how the time was calculated.

**Solution:**

**☕ Relax Phase (positions #6–4):**
- Hero: estimated time in large typography, muted teal
- Info card: average consultation duration + "basé sur les consultations du jour" (explains the estimate, builds trust)
- Contextual tip: "Vous avez le temps pour un café ☕" (matches real Tunisian behavior)
- "Je m'absente un moment" button
- Notification opt-in prompt

**⚡ Get Ready Phase (positions #3–2):**
- Hero eyebrow shifts to "Bientôt votre tour" / "Préparez-vous"
- Colors warm to amber — immediate visual shift
- Info card: people-ahead count becomes primary, time drops to secondary
- Contextual tip: "Restez dans la salle d'attente" → "Ne vous éloignez pas"
- "Je m'absente" button disappears
- Stronger notification prompt if not yet enabled

**🚪 Go Now Phase (positions #1–0):**
- Patient name in large green type + "Vous êtes le prochain" or "C'EST VOTRE TOUR"
- Estimated time replaced by narrative: "Le patient actuel est en consultation. Vous passez juste après."
- Pulsing green icon circle replaces progress ring
- "J'arrive!" confirmation button
- Timer: "La docteure attend depuis 1 min"
- All secondary info stripped — single-purpose: GO

**Why this is better:**
- Matches the patient's emotional state at each moment
- Prevents "vous êtes le prochain!" + "1 personne avant vous" contradiction by using clear narrative
- Connecting estimate to its calculation ("basé sur les consultations du jour") builds trust

---

## Recommendation 3: "Je m'absente un moment" — Closing the Patient/Receptionist Loop

**Problem:** The app tells patients "Vous avez le temps pour un café" but provides no mechanism to signal they've stepped out. In Tunisian clinics, patients constantly leave for the café, car, or quick errand. If their turn comes while they're away, there's no way for the system to handle it. On the receptionist dashboard redesign, we introduced "Patient sorti" — but no way for the patient to self-trigger it.

**Solution:**

A "Je m'absente un moment" button during the Relax phase. When tapped:

1. Patient status changes to "Sorti" on receptionist's dashboard
2. Patient screen shows "Absent" badge + "On vous préviendra quand il faudra revenir"
3. Approaching their turn, patient receives notification: "Revenez — c'est bientôt votre tour"
4. Receptionist can one-tap call them if needed

The button disappears during Get Ready phase — leaving is no longer encouraged.

**Why this matters for Tunisia:**
- Legitimizes a behavior that already happens universally
- Creates a closed loop: patient flags → receptionist sees → system auto-recalls → patient returns
- Removes the anxiety of "what if they call me while I'm at the café?"
- No paper-based system can do this — genuine differentiator

---

## Recommendation 4: "J'arrive!" Confirmation on the "Your Turn" Screen

**Problem:** The "C'EST VOTRE TOUR" screen is a one-way broadcast. The receptionist gets no feedback that the patient acknowledged the call. Critical for "Sorti" patients where the receptionist needs to know if they're coming back.

**Solution:**

A prominent "J'arrive!" button on the position #0 screen. When tapped:

1. Receptionist's dashboard shows "✓ Rached arrive"
2. Button changes to "En route..." state
3. Gentle timer appears: "La docteure attend depuis 1 min"
4. If untapped after 2 minutes, receptionist gets alert to call

Additionally, **remove "Quitter le Saf" from this screen entirely.** Move queue-exit to a "⋯ Options" menu on earlier screens. At the moment the doctor is waiting, an easy quit option makes no sense.

---

## Recommendation 5: Browser Notification Strategy — Prompt Early, Deliver When It Matters

**Problem:** The entire flow assumes the patient is watching their screen. Tunisian patients in a 2-hour wait pocket their phone. Without notifications, they miss critical phase transitions. No opt-in exists anywhere in the current flow.

**Solution:**

Present a styled notification prompt once during early Relax phase: "Activez les notifications pour ne pas rater votre tour." Designed as an in-app card, not a raw browser dialog.

**Notification triggers:**
- Each position advance: "Vous avez avancé d'une place ! 4 personnes devant vous"
- Phase transition to Get Ready: "Bientôt votre tour — restez à proximité"
- Phase transition to Go Now: "C'EST VOTRE TOUR — dirigez-vous vers le cabinet"
- If flagged "Sorti" and approaching turn: "Revenez dans la salle d'attente"

If declined: stronger amber prompt in Get Ready phase. Last chance before relying solely on-screen.

---

## Recommendation 6: Fix the Check-In Page — Show Queue State Before Joining

**Problem:** The check-in page asks for a phone number without showing any queue context. Every Tunisian patient's first question is "chhal bech nestanna?" Showing queue state before check-in delivers value before signup and motivates digital registration.

**Solution:**

Above the check-in form, add a live queue status strip:
- "7 personnes en attente · ~1h40 estimé"
- Doctor presence: green dot + "Dr. Trabelsi est présente"

Replace the decorative gradient header with this actionable information. Change "Rejoignez le Saf" to "Prenez votre place dans la file" — describe the action, not the brand.

**Additional check-in improvements:**
- Move "+216" to a static label outside the input; let patient type "55 123 456" with auto-formatting
- Change placeholder from "Comment vous appelez-vous?" to "Nom et prénom" — appropriate formality for medical context
- Add subtle encouragement: "Le nom aide le cabinet à vous identifier"

---

## Recommendation 7: Add a Post-Visit Screen

**Problem:** The flow ends at "C'EST VOTRE TOUR" with no closure after consultation. This misses a moment of maximum satisfaction and receptivity.

**Solution:**

After consultation marked complete, transition to "Merci" screen:
- "Merci pour votre visite, Rached"
- Wait time summary: "Vous avez attendu 1h47 — merci pour votre patience"
- One-tap satisfaction rating: 5 emoji faces (no text, pure emotion)
- Brand moment: "Votre médecin utilise BleSaf"
- Subtle referral: "Recommandez-le à votre médecin"

**Why this matters:**
- Captures satisfaction data for the doctor's end-of-day summary card
- Plants the BleSaf brand at maximum goodwill
- The referral nudge is appropriate here — patient just experienced the value
- Creates a clean journey end instead of an abrupt stop

---

## Current vs. Redesigned Comparison

| Aspect | Current | Redesigned |
|--------|---------|------------|
| **Layout** | Static across all positions | Three distinct visual phases |
| **Hero element** | Wait time only | Time (Relax) → People-count (Ready) → Name + action (Go) |
| **Progress** | 5-step timeline, 60% dead space | Continuous fill ring, phase-colored |
| **Guidance** | Same "café" tip everywhere | Phase-matched tips (café → stay close → go to door) |
| **Patient actions** | Only "Quitter le Saf" | "Je m'absente" + "J'arrive!" + "⋯ Options" |
| **Position display** | Dual (position # AND people ahead) | Single: people ahead only |
| **Notifications** | None | Prompted early, confirmed later |
| **Receptionist sync** | None | Sorti ↔ Je m'absente / J'arrive ↔ Confirmation |
| **Post-visit** | None | Thank you + rating + referral |
| **"Your turn" contradiction** | "You're next!" + "1 person ahead" | Clear narrative explaining current patient |
| **Doctor gender** | Potentially hardcoded | Dynamic from clinic settings |

---

## Implementation Priority

| Phase | What to Build | Effort | Impact |
|-------|--------------|--------|--------|
| **Week 1** | Progress ring, three-phase color system, phase-appropriate hero text | 3-4 days | Core visual redesign |
| **Week 2** | Phase-adaptive info cards, contextual tips | 2-3 days | Information density optimization |
| **Week 3** | "Je m'absente" button + "Sorti" status sync with receptionist dashboard | 3-4 days | Patient/receptionist loop closure |
| **Week 4** | "J'arrive!" confirmation, notification strategy, check-in page queue preview | 3-4 days | Communication loop + onboarding |
| **Week 5** | Post-visit screen, satisfaction rating, referral nudge | 2 days | Growth engine + data collection |

**Total: ~4-5 weeks of focused frontend + backend work** to transform the patient experience from a static number display into a phase-adaptive journey that mirrors how a thoughtful receptionist would communicate naturally.

---

## The Emotional Arc

The redesigned patient flow tells a story:

1. **Check in** → "7 personnes en attente · ~1h40" → You know what you're in for before committing
2. **Relax** → Calm teal, café suggestion, "je m'absente" → It's okay, the system has you
3. **Progress** → Ring fills, toast: "Vous avez avancé!" → Things are moving
4. **Attention** → Amber shift, "restez proche" → Time to pay attention
5. **Go** → Green pulse, "J'ARRIVE!" → You're in control of the last step
6. **Thank you** → Rating + referral → The experience was worth it

That emotional arc — reassurance → progress → attention → action → satisfaction — is what separates a queue number display from a product patients tell their friends about.
