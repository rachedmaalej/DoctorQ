# BleSaf Doctor Onboarding: UX/UI Critique & Recommendations

**Prepared by:** Senior UX/UI Strategist — SaaS Onboarding Specialist  
**Date:** February 9, 2026

---

## Introduction

BleSaf's 3-step doctor onboarding is the single most important funnel in the product. Every clinic that churns here is a clinic that never experiences the value of digital queue management. Having analyzed the three screens in detail — clinic configuration, QR code delivery, and the "You're ready" summary — this report delivers a candid critique of what works, what doesn't, and three concrete recommendations to transform this flow into a conversion engine with genuine WOW moments.

The strategic goal is simple: **a busy Tunisian doctor, between patients, should be able to set up BleSaf in under 90 seconds and feel confident they've made a smart decision.**

---

## Part 1: Screen-by-Screen Critique

### Step 1 — "Configurez votre cabinet" (Clinic Setup)

#### Strengths

- **Progress bar with percentage** is clear and motivating. Showing "Étape 1 sur 3 — 33%" sets expectations well and reduces anxiety about how long this will take.
- **Title/subtitle hierarchy** is clean. "Configurez votre cabinet" with the supporting line about helping patients identify the clinic is well-written.
- **Gender toggle (M. / Mme)** is a nice touch — it's culturally appropriate for the Tunisian market and adds a personal feel.
- **Specialty selector with icons** is visually appealing and scannable. The chip-style selection with recognizable icons per specialty is a strong pattern.
- **"Fun fact" preview** at the bottom is a clever idea in theory — showing doctors what their patients will see during the wait.

#### Weaknesses

- **Too many fields for Step 1.** This screen asks for five inputs (clinic name, doctor name + gender, phone, consultation duration, specialty). Research consistently shows that each additional field in a signup flow reduces completion rates by 5–10%. For a doctor doing this between patients, this is too much cognitive load in one screen.
- **Phone input (+216 XX XXX XXX)** provides no guidance on format expectations. The placeholder is helpful, but there's no character counter, no auto-formatting, and based on the critique documents, this input is known to be frustrating — users can't delete the +216 prefix, and error messages are generic.
- **"Durée moyenne d'une consultation" dropdown** is a smart data point to collect, but it feels like a setup question, not a critical onboarding field. A doctor might not want to commit to "10 minutes" without understanding how it's used. There's no tooltip explaining why this matters.
- **The fun fact preview is misplaced.** At the bottom of a configuration form, it's jarring. The doctor is in "setup mode" — task-oriented, focused. Showing a patient-facing feature preview here doesn't serve the doctor's current mental model. It also previews a feature that, per the critique documents, is one of the weakest UX elements (irrelevant fun facts instead of wait estimates).
- **"Passer" (Skip) in the top-right is ambiguous.** Skip this step? Skip the entire onboarding? What happens to required fields? This needs clarity.
- **No validation feedback visible.** Are all fields required? Which ones can be changed later? A doctor filling this out quickly needs to know they're not locked into these choices.

---

### Step 2 — "Votre QR Code"

#### Strengths

- **This is the strongest screen in the flow.** It delivers something tangible and immediately useful — a QR code the doctor can print and display today.
- **The 3-step usage instructions** ("Print the poster → Patients scan → They track in real-time") are brilliantly concise. This is the clearest explanation of how BleSaf works in the entire product.
- **"Imprimer l'affiche" button** is a smart CTA that makes the value concrete. It bridges digital setup to physical action in the clinic.
- **Clean layout** with a single focal point (the QR code) and supporting instructions below. The visual hierarchy is correct.

#### Weaknesses

- **No preview of what the printed poster looks like.** The doctor is being asked to print something they haven't seen. Will it have clinic branding? Is it professional enough for a medical waiting room? Showing a small preview of the poster would build confidence.
- **The QR code is just... there.** No branding, no clinic name on it, no visual indication that this is *their* unique code. It looks generic and test-like. Adding the clinic name or a subtle branded frame around the QR code would make it feel personalized and real.
- **No "share" option.** Many doctors might want to send the QR code to their receptionist via WhatsApp rather than print it themselves right now. A share/download button is missing.
- **"Continuer" competes with "Imprimer l'affiche."** The doctor has two CTAs and isn't sure which matters more. The visual weight is equal. The print action should be more prominent or presented differently — perhaps as a celebratory moment rather than a utilitarian button.

---

### Step 3 — "Vous êtes prêt!"

#### Strengths

- **The celebratory emoji/icon** at the top sets a positive tone. "You're ready!" is the right message.
- **Three action cards** (Add first patient, Call next, Automatic notifications) provide a quick mental model of the core workflow. The progression from add → call → notify is logical.
- **Trial info at the bottom** ("30 jours d'essai gratuit + 50 SMS offerts") is well-placed and reassuring. It answers the "what does this cost me?" question at exactly the right moment — after commitment, before the dashboard.

#### Weaknesses

- **This screen is passive when it should be active.** It describes what the doctor *can* do but doesn't invite them to *do* it. "Ajoutez votre premier patient — Cliquez sur 'Ajouter un patient' pour tester le système" is instruction, not action. The doctor reads it, clicks "Terminer," and lands on an empty dashboard. The "Aha moment" is deferred.
- **No demo data, no sandbox feel.** The doctor finishes onboarding and sees... nothing. An empty queue. No sense of what the product looks like in action. This is the single biggest missed opportunity in the entire flow.
- **The action cards are not interactive.** They look like buttons but they're just informational cards. This violates the principle of affordance — if it looks clickable, it should be clickable.
- **"Terminer" is anticlimactic.** After three steps, the final button says "Finish." It should say something that propels forward action: "Voir mon tableau de bord" (See my dashboard) or "Commencer" (Start).
- **No mention of what happens next.** Will they receive an email? Is there a help resource? Can they invite their receptionist? The doctor is about to be dropped into the product with no safety net.

---

## Part 2: Cross-Cutting Issues

### Information Architecture Problem
The flow collects too much in Step 1 and delivers too little in Step 3. The effort-to-reward ratio is inverted. The doctor does the most work at the beginning (when motivation is uncertain) and gets the least payoff at the end (when momentum should be highest).

### Missing Emotional Arc
Great onboarding follows an emotional curve: curiosity → confidence → delight → momentum. This flow is: effort → information → passive summary. There's no moment where the doctor *feels* the product working. No simulation, no preview, no "this is going to change my mornings."

### No Personalization Payoff
Step 1 collects the clinic name, doctor name, and specialty — but none of this data is reflected back in Steps 2 or 3. The QR code isn't branded. The "You're ready" screen doesn't say "Dr. [Name], your ophthalmology practice is set up." The personalization data goes in but nothing personalized comes out.

---

## Part 3: Three Recommendations

---

### Recommendation 1: "Lighten Step 1, Personalize Step 2"

**Problem:** Step 1 asks for too much too soon. Five input fields plus a specialty selector creates cognitive overload for a busy doctor. Meanwhile, the data collected is never visibly used in subsequent steps, making the effort feel pointless. The fun fact preview at the bottom is a distraction from the task at hand.

**Solution:** Split the current Step 1 into a lean essentials screen and push secondary details into the product settings (accessible later). The absolute minimum for Step 1 should be:

1. **Doctor name + gender** (for personalization throughout the flow)
2. **Clinic name** (for QR code branding)
3. **Specialty** (for contextualizing the experience)

Move phone number and average consultation duration to a settings page accessible from the dashboard. These are operational details, not identity details. A doctor can configure them before going live, but they shouldn't gate the onboarding.

Then, in Step 2, **use the collected data visibly:**

- Show the QR code inside a branded poster preview with the clinic name and doctor's name prominently displayed.
- The specialty icon should appear on the poster mock-up.
- The greeting could read: "Dr. [Name], voici le QR code de [Clinic Name]."

Remove the fun fact preview entirely from Step 1. If the team wants to showcase patient-facing features, do it in the dashboard as a tooltip or in a post-onboarding product tour — not during setup.

**How it Achieves Key Objectives:**
- **Explaining Value:** By reducing friction, the doctor spends less time on forms and more time seeing what the product does. The branded poster preview in Step 2 immediately communicates: "This is a professional tool that represents your practice."
- **Explaining How it Works:** Unchanged — the Step 2 three-step instructions remain the clearest explanation of the workflow.
- **Creating WOW Moments:** The WOW is seeing your clinic name and your name on a beautifully designed poster preview, seconds after typing them in. It makes the product feel *real* and *yours* instantly. This is the "I can already picture this in my waiting room" moment.

**Example Scenario:** Dr. Amira Bouazizi, an ophthalmologist in Tunis, opens BleSaf between patients. Step 1 asks for her name, her clinic name ("Centre Ophtalmo Bouazizi"), and her specialty. Three taps, 15 seconds. She hits "Continuer" and Step 2 shows a polished A4 poster preview: her clinic name at the top, a clean QR code in the center, "Scannez pour rejoindre la file d'attente" below, and the BleSaf logo subtly at the bottom. She thinks, "This looks professional. I want this in my waiting room." She taps "Télécharger" and sends it to her receptionist on WhatsApp.

---

### Recommendation 2: "Replace the Passive Summary with a Live Simulation"

**Problem:** Step 3 tells the doctor what they can do but never shows them. They click "Terminer" and face an empty dashboard — the dreaded "blank slate" problem. The cards describing features look clickable but aren't. The critical "Aha moment" (seeing a patient check in digitally and appear on the queue) is deferred indefinitely. For a doctor who set this up between patients, they may not return to test it until tomorrow — or never.

**Solution:** Transform Step 3 from a passive summary into a **live interactive simulation**. Instead of describing the three core actions, *walk the doctor through them in a guided sandbox:*

**Simulated Flow (30 seconds):**

1. **"Ajoutons un patient test"** — A pre-filled form appears with a fictional patient ("Sami B., +216 55 123 456"). The doctor taps "Ajouter" and watches the patient appear on a mini queue preview, animated into position #1. A subtle success toast appears: "✓ Sami est en file d'attente."
2. **"Maintenant, appelez-le"** — A pulsing "Appeler suivant" button appears. The doctor taps it. The patient card transitions to "En consultation" with a smooth animation. A notification preview appears: "Sami a reçu un SMS lui indiquant que c'est son tour."
3. **"Votre cabinet est prêt. Voici votre tableau de bord."** — The view zooms out to reveal the full dashboard, with the test patient visible. A clean banner at the top says: "Mode essai — Ce patient test sera supprimé automatiquement. Ajoutez vos vrais patients dès demain matin!"

This simulation serves as both a product tour and a functional test. The doctor has now *used* the product, not just read about it.

**How it Achieves Key Objectives:**
- **Explaining Value:** The doctor doesn't just understand the value intellectually — they *experience* it. Seeing a patient name appear on a queue in real-time, with a notification preview, makes the time-saving benefit visceral.
- **Explaining How it Works:** The simulation IS the explanation. No instructions needed — the doctor learns by doing. Add a patient → call them → they get notified. Three taps, complete mental model.
- **Creating WOW Moments:** This is the primary WOW moment. The transition from "I'm setting up software" to "I just ran my first digital queue" happens in 30 seconds. The smooth animations, the notification preview, and the final dashboard reveal create a feeling of competence and delight. The doctor thinks: "This is so simple. This is going to save me time every single day."

**Example Scenario:** Dr. Bouazizi finishes Step 2 and taps "Continuer." Instead of a summary card, she sees: "Testons ensemble — ajoutez un patient fictif." A pre-filled card shows "Sami B." She taps "Ajouter" and a mini queue appears with Sami at position #1. A gentle animation slides the card in. She taps "Appeler suivant" and the card turns green: "En consultation." A simulated SMS notification pops up at the top: "📱 Sami a été notifié." She grins. The screen expands to show her full dashboard, Sami still visible, with a banner: "Vous avez géré votre première file ! Ajoutez vos patients demain." She closes the app feeling like she already knows how to use it.

---

### Recommendation 3: "Post-Onboarding Momentum — The First Morning Playbook"

**Problem:** Even with a perfect onboarding flow, there's a dangerous gap between setup (usually done in a quiet moment) and first real use (the next morning, with real patients). The current flow ends with "Terminer" and provides no bridge to that first real day. There are no follow-up emails, no reminders, no "here's how to prepare for tomorrow" guidance. The doctor is left alone, and many will forget or lose confidence by morning.

**Solution:** After the doctor completes onboarding, immediately trigger a **"First Morning Playbook"** — a combination of in-app and email/SMS touchpoints designed to carry momentum from setup to first use:

**Immediately after "Terminer":**
- A brief, warm modal: "Vous avez tout configuré ! Nous vous envoyons un petit guide pour demain matin." with a preview of what the email will contain.
- The dashboard shows a subtle, persistent checklist banner (not a modal, not intrusive):
  - ☐ Affichez le QR code dans votre salle d'attente
  - ☐ Votre premier patient s'enregistre
  - ☐ Vous appelez votre premier patient
  - Each item auto-completes with a satisfying checkmark animation when the action happens.

**That evening (timed email/SMS):**
- Subject: "Dr. [Name], tout est prêt pour demain ☀️"
- Content: A 3-item checklist — (1) Print and display the QR poster, (2) When your first patient arrives, ask them to scan, (3) Watch them appear on your screen. Include a direct link to the dashboard and the poster PDF as an attachment.

**After first real patient checks in (triggered event):**
- In-app toast: "🎉 Votre premier vrai patient est dans la file ! Bienvenue dans BleSaf."
- If no patient checks in within 3 days, a gentle nudge SMS: "Dr. [Name], avez-vous affiché votre QR code ? Nous pouvons vous aider."

**After first week:**
- Automated summary email: "Cette semaine, vous avez géré X patients numériquement. Temps estimé gagné: Y minutes." This is the data-driven WOW moment — showing concrete time savings personalized to their usage.

**How it Achieves Key Objectives:**
- **Explaining Value:** The first-week summary email transforms abstract value ("save time") into concrete, personal data ("you saved 47 minutes this week"). This is the most powerful retention tool in SaaS — showing users the value they're already getting.
- **Explaining How it Works:** The evening email is a gentle refresher. The persistent checklist in the dashboard turns "how does this work?" into "just complete these three things." It's guidance without feeling like a tutorial.
- **Creating WOW Moments:** Two distinct WOW moments: (1) The celebratory toast when the first real patient checks in — this is emotionally resonant because it's a real patient in a real clinic, and the doctor sees the technology working with actual people. (2) The weekly summary email with time saved — doctors trade in minutes, and seeing "47 minutes saved" hits differently than any marketing claim ever could.

**Example Scenario:** Dr. Bouazizi finishes onboarding at 6 PM. At 8 PM, she receives an email: "Dr. Bouazizi, tout est prêt pour demain matin au Centre Ophtalmo Bouazizi ☀️" with her poster PDF attached and a 3-step checklist. She forwards the PDF to her receptionist: "Print this and put it at reception." The next morning, a patient scans the QR code and checks in. Dr. Bouazizi's dashboard updates in real-time — she sees "Ahmed M., Position #1" appear. A toast pops up: "🎉 Votre premier patient est enregistré ! BleSaf est en marche." She smiles. On Friday, she receives an email: "Cette semaine: 23 patients gérés numériquement. Temps estimé gagné: 34 minutes." She screenshots it and sends it to a colleague: "Tu devrais essayer ça."

---

## Conclusion

The current BleSaf onboarding is *functional* — it collects the right data and delivers a QR code. But functional isn't enough for self-service SaaS growth. The flow needs to shift from **information collection** to **value demonstration**.

The three recommendations work as a system:

1. **Recommendation 1** (Lighten + Personalize) reduces friction and makes the doctor feel recognized.
2. **Recommendation 2** (Live Simulation) delivers the "Aha moment" during onboarding itself, not after.
3. **Recommendation 3** (First Morning Playbook) bridges the dangerous gap between setup and real-world use, then reinforces value with data.

Together, they transform the onboarding from a 3-step form into a **narrative arc**: "You told us about your clinic → we showed you how it works → you experienced it → we'll be with you tomorrow morning." The doctor finishes feeling not just set up, but genuinely excited to use BleSaf with real patients.

The expected impact: higher onboarding completion rates, faster time-to-first-real-use, stronger first-week retention, and — critically — doctors who *recommend BleSaf to colleagues* because the experience itself was memorable.
