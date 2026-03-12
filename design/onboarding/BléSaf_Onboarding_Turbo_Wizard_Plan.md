# BléSaf — Onboarding Flow "Turbo Wizard"
## Complete Development Plan · Verbivy Visual Style

---

## 1. Visual Language

### The Pattern (from Verbivy reference)
```
┌─────────────────────────────┐
│  ← ────────────── Skip      │  ← Progress bar + nav (48px)
│                             │
│                             │
│     ILLUSTRATION AREA       │  ← 58% of screen height
│     (colored background)    │     Full-bleed, no padding
│                             │
│                             │
╰─────────────────────────────╯
│                             │
│  Title (bold, 24px)         │  ← White card, large border-radius
│  Subtitle (regular, 14px)   │     top-left + top-right
│                             │
│  [  Primary CTA Button  ]   │  ← Dark pill, full-width
│                             │
└─────────────────────────────┘
```

### BléSaf Color Adaptation
| Token               | Value     | Usage                          |
|---------------------|-----------|-------------------------------|
| `--brand-bg`        | `#E8F5F0` | Illustration panel background  |
| `--brand-mid`       | `#A8D5C2` | Floating badge backgrounds     |
| `--brand-primary`   | `#1B6B45` | CTA button, active elements    |
| `--brand-accent`    | `#F4A261` | Warm accent (badges, dots)     |
| `--brand-text`      | `#1A1A2E` | Headlines                      |
| `--brand-subtle`    | `#6B7280` | Body copy                      |
| `--card-bg`         | `#FFFFFF` | Bottom content panel           |

> The mint-green background replaces Verbivy's pink/lavender — maintaining
> the warm illustrative feel while staying true to BléSaf's medical calm palette.

### Typography
```css
/* Heading — screen titles */
font-family: 'Sora', sans-serif;
font-weight: 700;
font-size: 22–26px;
line-height: 1.25;

/* Body — subtitles */
font-family: 'Sora', sans-serif;
font-weight: 400;
font-size: 13–15px;
line-height: 1.55;
color: #6B7280;

/* CTA Button */
font-family: 'Sora', sans-serif;
font-weight: 600;
font-size: 16px;
```
Load via: `@fontsource/sora` or Google Fonts CDN.

### Layout Constants
```js
export const LAYOUT = {
  ILLUSTRATION_HEIGHT: '58vh',    // Top illustration panel
  CARD_RADIUS: '28px',            // Top corners of white card
  BUTTON_RADIUS: '14px',          // CTA button
  PROGRESS_HEIGHT: '3px',
  SCREEN_PADDING: '24px',
  CARD_PADDING: '28px 24px 40px',
}
```

---

## 2. Screen Inventory (5 Screens + Splash)

### Screen 0 — Splash
**Purpose:** App cold-start, branding moment  
**Duration:** 1.2s auto-advance  
**Background:** White  
**Content:** BléSaf wordmark centered, fades out upward  
**No illustration required.**

---

### Screen 1 — Welcome
**Headline:** "Votre cabinet numérique en 2 minutes."  
**Subtitle:** "Aucune carte bancaire. Aucun engagement. Juste votre file d'attente — prête en quelques clics."  
**CTA:** `Commencer →`  
**Progress:** Step 1/4  
**Skip:** Hidden on Screen 1 (it's the entry)

**Illustration:** `welcome.png` (see Nano Banana prompt §4)

---

### Screen 2 — Personalization
**Headline:** "Quel type de cabinet dirigez-vous ?"  
**Subtitle:** "Nous adaptons votre expérience à votre spécialité."  
**CTA:** `Continuer →` (disabled until selection made)  
**Skip:** Visible → selects "Autre" and advances  
**Progress:** Step 2/4

**Specialty Cards (4 options, 2×2 grid):**
```
┌──────────────┐  ┌──────────────┐
│  👁️  Ophtalmo │  │  🏥 Générale  │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  🦷 Dentiste  │  │  ✦  Autre    │
└──────────────┘  └──────────────┘
```
Selected card: `border: 2px solid var(--brand-primary)` + light green fill  
**Illustration:** `specialty.png` (see Nano Banana prompt §4)

---

### Screen 3 — Sign-Up
**Headline:** "Créez votre compte."  
**Subtitle:** "Votre cabinet sera prêt dans 60 secondes."  
**Progress:** Step 3/4

**Fields (2 only):**
- Email professionnel — with inline validation (green checkmark on valid)
- Nom de votre cabinet — pre-filled hint: "Ex. Clinique Dr. Hafsia"

**Below fields:**
- `[  Créer mon compte →  ]` — dark pill
- `Déjà inscrit ? Se connecter` — small link below

**Trust signals (inline, small):**
- 🔒 Aucune carte bancaire · 30 jours gratuits

**Note:** No password on this screen. Send magic link or set password in follow-up email.  
**Illustration:** `signup.png` (see Nano Banana prompt §4)

---

### Screen 4 — QR Code Reveal ("Aha Moment")
**Headline:** "Votre QR Code est prêt ! 🎉"  
**Subtitle:** "Affichez-le en salle d'attente. Vos patients s'inscrivent en 10 secondes."  
**Progress:** Step 4/4 (complete)  
**Skip:** Hidden

**Content Panel:**
```
┌─────────────────────────────┐
│   [  QR CODE — 200×200px  ] │  ← Animated entrance (scale + fade)
│                             │
│   Clinique Dr. Hafsia       │  ← Clinic name from step 2
│                             │
│  [  Envoyer par WhatsApp ]  │  ← Primary CTA, green
│  [  Télécharger le PDF   ]  │  ← Secondary, outlined
│                             │
│  Commencer →                │  ← Small text link → goes to dashboard
└─────────────────────────────┘
```

**Micro-animation:** On mount, confetti burst (canvas-confetti, 1.5s, subtle).  
QR code scales from 0.5 → 1.0 with spring easing.

**Illustration:** `qr-reveal.png` (see Nano Banana prompt §4)

---

### Screen 5 — Guided Dashboard (existing dashboard + overlay)
This is the **existing dashboard**, not a new screen.  
Onboarding ends and hands off to the dashboard with:

**Getting Started Widget** (floating bottom-left, 320px wide):
```
┌─────────────────────────────────┐
│ 🚀 Premiers pas          2/3   │
│ ████████████░░░               │ ← progress bar
├─────────────────────────────────┤
│ ✅ File d'attente ouverte       │
│ ☐  Partager votre QR Code  →   │ ← tappable, opens QR modal
│ ☐  Appeler votre premier patient│ ← highlights "Appeler Suivant" btn
└─────────────────────────────────┘
```

**Demo patient pre-seeded** (via Supabase DB trigger on account creation):
- Name: "Patient Test"
- Status: "En attente"
- Position: #1

---

## 3. Component Architecture

```
src/
├── features/
│   └── onboarding/
│       ├── OnboardingFlow.jsx          ← Root controller
│       ├── hooks/
│       │   ├── useOnboardingState.js   ← Step, specialty, direction
│       │   └── useOnboardingAnalytics.js ← PostHog events
│       ├── components/
│       │   ├── ProgressBar.jsx
│       │   ├── IllustrationPanel.jsx   ← Top 58% — accepts img prop
│       │   ├── ContentCard.jsx         ← White bottom card
│       │   ├── PillButton.jsx          ← Reusable CTA
│       │   ├── SpecialtyGrid.jsx       ← 2×2 card picker
│       │   ├── QRCodePanel.jsx         ← QR + share actions
│       │   └── GettingStartedWidget.jsx← Dashboard overlay
│       ├── screens/
│       │   ├── SplashScreen.jsx
│       │   ├── WelcomeScreen.jsx
│       │   ├── SpecialtyScreen.jsx
│       │   ├── SignUpScreen.jsx
│       │   └── QRRevealScreen.jsx
│       ├── constants/
│       │   └── onboardingConfig.js     ← All copy centralized
│       └── index.js                   ← Public export
```

### OnboardingFlow.jsx — Core Logic
```jsx
const STEPS = ['splash', 'welcome', 'specialty', 'signup', 'qr-reveal']

export default function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1=forward, -1=back
  const [specialty, setSpecialty] = useState(null)

  const advance = () => {
    setDirection(1)
    setStep(s => s + 1)
  }

  const back = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const skip = () => {
    if (step === 2) setSpecialty('other') // Specialty step
    advance()
  }

  // After QR reveal, redirect to /dashboard
  const complete = () => {
    localStorage.setItem('blesaf_onboarded', 'true')
    navigate('/dashboard')
  }

  // Transition: slide left on advance, slide right on back
  // Use framer-motion AnimatePresence + variants
}
```

### Screen Transition Variants (framer-motion)
```js
const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

const transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}
```

### ProgressBar.jsx
```jsx
// Thin 3px line at top of illustration panel
// Animated fill with spring transition
// Shows step / total - 1 (splash doesn't count)
const progress = (step - 1) / (STEPS.length - 2) * 100
```

### IllustrationPanel.jsx
```jsx
// Full-bleed, no padding, overflow hidden
// Background: var(--brand-bg) mint green
// Image: centered, bottom-anchored (characters stand at bottom of panel)
// Floating badges: absolute positioned, animated with keyframes (float up/down)
```

---

## 4. Nano Banana Illustration Prompts

> **Style brief for all prompts (prepend to each):**
> "Flat vector illustration style. Bold outlines. Warm skin tones. 
> Characters are diverse, friendly, Mediterranean/North African appearance.
> Color palette: mint green (#E8F5F0) background, sage accents (#A8D5C2),
> warm orange details (#F4A261), dark navy outlines (#1A1A2E).
> Figma/Dribbble quality. 2D, no shadows, no gradients.
> Square format 800×800px. Characters centered, standing, 
> cropped at waist at bottom edge."

---

### Prompt 1 — Welcome Screen (`welcome.png`)
```
[STYLE BRIEF ABOVE] +

A friendly Tunisian female doctor in a white lab coat, 
waving enthusiastically with both hands raised. 
She wears a stethoscope. She has short dark curly hair.
Behind her, a minimal clinic/waiting room scene with 
green plants and large windows. 
Floating around her: speech bubbles with "Salam !", 
"Bonjour !", and "مرحبا" in stylized black text bubbles.
Sparkle/star decorative elements in warm orange scattered around.
Mint green background (#E8F5F0).
```

---

### Prompt 2 — Specialty Screen (`specialty.png`)
```
[STYLE BRIEF ABOVE] +

A confident doctor (male, 35–45, North African appearance, 
wearing scrubs and glasses) standing center with arms slightly 
outstretched, surrounded by floating circular icon badges:
- An eye (ophthalmology)
- A tooth (dentistry)  
- A heart with a stethoscope (general medicine)
- A plus/cross sign (other)
Each badge is a white circle with a colored icon inside.
Soft city skyline silhouette in the background (mint green tones).
Character is smiling and pointing upward toward the badges.
```

---

### Prompt 3 — Sign-Up Screen (`signup.png`)
```
[STYLE BRIEF ABOVE] +

A cheerful female clinic receptionist/admin (20s, hijab in sage green, 
North African appearance) sitting at a minimal desk,
looking at a laptop/tablet with an excited expression.
Behind her: a BléSaf-branded green check mark (large, decorative).
Floating elements: a small envelope icon and a key icon 
(representing email and account creation).
Decorative dotted lines and small sparkles scattered around.
Background: mint green (#E8F5F0).
```

---

### Prompt 4 — QR Reveal Screen (`qr-reveal.png`)
```
[STYLE BRIEF ABOVE] +

A joyful scene: A patient (female, 30s, casual clothes) 
scanning a large QR code on a wall-mounted frame/poster 
with her smartphone. The QR code is represented as a 
large black-and-white square pattern on the poster.
Next to her, the female doctor from Screen 1 (white coat, 
curly hair) raises a fist in celebration / thumbs up.
Both characters look extremely happy.
Large celebration confetti elements floating: orange, green, 
yellow small geometric shapes.
Speech bubble from the patient: "Inscrit !" 
Background: mint green (#E8F5F0).
```

---

> **Delivery format:** PNG, 800×800px, transparent background optional.
> The `IllustrationPanel` will render them on `--brand-bg` mint green.
> Ask for "no background" variant if you want to control bg via CSS.

---

## 5. Animation Specifications

### Screen Transitions
| Trigger        | Animation              | Duration | Easing         |
|----------------|------------------------|----------|----------------|
| Advance step   | Slide left + fade out  | 280ms    | spring(300,30) |
| Go back        | Slide right + fade out | 280ms    | spring(300,30) |
| Illustration   | Slightly delayed enter | +80ms    | easeOut        |
| Content card   | Slide up 20px + fade   | 320ms    | easeOut        |

### QR Code Reveal (Screen 4)
```js
// QR code entrance
initial: { scale: 0.5, opacity: 0 }
animate: { scale: 1, opacity: 1 }
transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }

// Confetti — fire on mount
import confetti from 'canvas-confetti'

useEffect(() => {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.5 },
    colors: ['#1B6B45', '#F4A261', '#A8D5C2', '#FFFFFF'],
    scalar: 0.9,
  })
}, [])
```

### Floating Badges (Specialty Screen)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

.badge-1 { animation: float 2.8s ease-in-out infinite; }
.badge-2 { animation: float 3.2s ease-in-out infinite 0.4s; }
.badge-3 { animation: float 2.6s ease-in-out infinite 0.8s; }
```

### Getting Started Widget (Dashboard)
```js
// Slides up from bottom-left on dashboard mount (after 800ms delay)
initial: { y: 120, opacity: 0 }
animate: { y: 0, opacity: 1 }
transition: { type: 'spring', delay: 0.8 }

// Checklist item check — bounce scale
initial: { scale: 0 }
animate: { scale: 1 }
transition: { type: 'spring', stiffness: 400 }
```

---

## 6. Supabase Integration

### Demo Patient Seed (DB Function)
```sql
-- Trigger: fires after INSERT on auth.users
CREATE OR REPLACE FUNCTION seed_demo_patient()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO patients (user_id, name, position, status, is_demo)
  VALUES (
    NEW.id,
    'Patient Test',
    1,
    'waiting',
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE seed_demo_patient();
```

### User Profile (specialty storage)
```sql
ALTER TABLE profiles ADD COLUMN specialty TEXT 
  CHECK (specialty IN ('ophthalmology','general','dentistry','other'));
```

### Auth Flow (Magic Link — recommended)
```js
// SignUpScreen.jsx
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    data: { clinic_name: clinicName },
    emailRedirectTo: `${window.location.origin}/onboarding/qr`,
  }
})
// User clicks email link → lands on QR reveal with session active
```
> This removes the password field entirely from onboarding,
> cutting the form to 2 fields and removing all auth friction.

---

## 7. Analytics Events (PostHog)

```js
// useOnboardingAnalytics.js
export const EVENTS = {
  ONBOARDING_STARTED:    'onboarding_started',
  SPECIALTY_SELECTED:    'specialty_selected',     // + { specialty }
  SIGNUP_SUBMITTED:      'signup_submitted',
  SIGNUP_FAILED:         'signup_failed',           // + { error }
  QR_VIEWED:             'qr_viewed',               // ← PRIMARY activation metric
  QR_SHARED_WHATSAPP:    'qr_shared_whatsapp',
  QR_DOWNLOADED_PDF:     'qr_downloaded_pdf',
  ONBOARDING_COMPLETED:  'onboarding_completed',    // landed on dashboard
  CHECKLIST_ITEM_DONE:   'checklist_item_done',     // + { item }
  CHECKLIST_COMPLETED:   'checklist_completed',
}
```

**Target funnel:**
```
onboarding_started    → 100% (baseline)
specialty_selected    →  88% target
signup_submitted      →  75% target
qr_viewed             →  70% target  ← activation gate
qr_shared_whatsapp    →  45% target
onboarding_completed  →  65% target
```

---

## 8. Implementation Phases

### Phase 1 — Design System Setup (Day 1)
- [ ] Install `@fontsource/sora`
- [ ] Install `framer-motion`
- [ ] Install `canvas-confetti` + `@types/canvas-confetti`
- [ ] Install `qrcode.react`
- [ ] Define CSS variables in `globals.css`
- [ ] Build `PillButton`, `ProgressBar`, `IllustrationPanel`, `ContentCard` 
- [ ] **No screens yet — just the atoms**

### Phase 2 — Screen Shells (Day 2)
- [ ] Build `OnboardingFlow` controller (step state, direction, AnimatePresence)
- [ ] Build `SplashScreen` (logo + auto-advance)
- [ ] Build `WelcomeScreen` (placeholder illustration box)
- [ ] Build `SpecialtyScreen` (specialty grid, selection state)
- [ ] Test transitions between all 3 screens
- [ ] Progress bar working

### Phase 3 — Sign-Up + Auth (Days 3–4)
- [ ] Build `SignUpScreen` with 2-field form
- [ ] Supabase magic link auth integration
- [ ] Inline validation (email format, clinic name non-empty)
- [ ] Loading state on button (spinner + "Envoi en cours…")
- [ ] Error state handling (email already exists → "Se connecter ?" nudge)
- [ ] Supabase profile update with clinic name + specialty

### Phase 4 — QR Reveal Screen (Days 5–6)
- [ ] Build `QRRevealScreen`
- [ ] `qrcode.react` integration with dynamic URL
- [ ] QR entrance animation (spring scale)
- [ ] `canvas-confetti` burst on mount
- [ ] WhatsApp share deeplink:  
      `https://wa.me/?text=Scannez+ce+QR+code+...&url={qr_url}`
- [ ] PDF download (use `html2canvas` + `jspdf` to capture QR div)
- [ ] PostHog `qr_viewed` event

### Phase 5 — Dashboard Integration (Day 7)
- [ ] Supabase DB trigger for demo patient seed
- [ ] Build `GettingStartedWidget` component
- [ ] Widget checklist state (3 items, persisted in user profile)
- [ ] Checklist item 2: opens QR modal (reuse QRCodePanel)
- [ ] Checklist item 3: spotlight on "Appeler Suivant" button  
      (use a semi-transparent overlay + cutout highlight)
- [ ] Confetti on 3/3 completion + widget dismisses

### Phase 6 — Illustrations Drop-In (Day 8)
- [ ] Receive 4 PNGs from Nano Banana
- [ ] Swap placeholder boxes with real illustrations
- [ ] Adjust illustration panel heights/positioning as needed
- [ ] Fine-tune floating badge positions on specialty screen

### Phase 7 — Email Sequence (Days 9–10)
- [ ] Set up Resend account + verify domain
- [ ] Email 1: Magic link / welcome (Supabase handles natively)
- [ ] Email 2 (Day 2): "Avez-vous affiché votre QR ?"  
      — Triggered if `qr_shared_whatsapp` not fired within 24h
- [ ] Email 3 (Day 7): "Votre premier bilan"  
      — Dynamic: "X patients servis cette semaine"

### Phase 8 — QA & Polish (Days 11–12)
- [ ] Test on real iPhone (Safari) + Android Chrome
- [ ] Test at 375px (iPhone SE) — minimum supported width
- [ ] Test magic link email flow end-to-end
- [ ] Check PostHog funnel events firing correctly
- [ ] Accessibility: focus rings, ARIA labels, color contrast ≥ 4.5:1
- [ ] Performance: illustrations ≤ 120KB each (WebP conversion)
- [ ] Add `loading="lazy"` + `decoding="async"` to illustration imgs

---

## 9. File Deliverables Summary

| File                              | Owner    | When Needed |
|-----------------------------------|----------|-------------|
| `welcome.png` (800×800)           | You (NB) | Phase 6     |
| `specialty.png` (800×800)         | You (NB) | Phase 6     |
| `signup.png` (800×800)            | You (NB) | Phase 6     |
| `qr-reveal.png` (800×800)         | You (NB) | Phase 6     |
| `OnboardingFlow.jsx` + all screens| Dev      | Phase 1–5   |
| Supabase migrations (SQL)         | Dev      | Phase 3     |
| Resend email templates            | Dev      | Phase 7     |

---

## 10. Key Design Decisions to Lock Before Dev

1. **Magic link vs password?**  
   Recommendation: magic link — removes 1 field, reduces friction significantly.
   
2. **Is the password screen even inside the onboarding, or deferred to first login?**  
   Recommendation: defer — user clicks email link, sets password on first dashboard visit.

3. **QR code URL format?**  
   E.g. `https://app.blesaf.com/q/{clinic-slug}` — define slug generation logic.

4. **Demo patient behavior**  
   Auto-removed after 24h? Or kept until first real patient added?  
   Recommendation: keep until real patient added (shows value longer).

5. **"Skip" on specialty screen**  
   Does it default to "Autre" or leave specialty null?  
   Recommendation: default to "Autre" — avoid null states in DB.
