# Claude Code Prompt — BleSaf Guided Onboarding Tour

---

## Files to provide to Claude Code

Before pasting the prompt below, attach these files to your Claude Code session:

| File | Why |
|------|-----|
| `blesaf-guided-tour-v2.html` | The complete reference implementation — all logic, animations, and component structure |
| `blesaf-style-guide.html` | Design system tokens, typography rules, component anatomy |
| `web/src/pages/DashboardPage.tsx` (or `MobileDashboard.tsx`) | So Claude Code sees the exact component tree to integrate with |
| `web/src/stores/` (your Zustand store files) | Tour state must live in Zustand alongside existing state |
| `web/src/i18n/` (your translation files) | All tour strings need French + Arabic RTL variants |
| `tailwind.config.js` | So Claude Code knows what utility classes exist |

---

## The Prompt

```
I need you to implement a guided onboarding tour for the BleSaf receptionist dashboard.
I am giving you two reference files:

1. `blesaf-guided-tour-v2.html` — a complete, working HTML prototype of the entire tour.
   Study it carefully before writing any code. It contains:
   - The full animation engine (SVG morphing spotlight, iris open/close, glow border)
   - The ghost cursor sequence (automated typing and clicking demo)
   - The complete tour state machine with all 9 states
   - Every overlay component (welcome card, fill message, done screen)
   - All timing, easing functions, and pointer-events fixes that were hard-won

2. `blesaf-style-guide.html` — the BleSaf design system.
   Every visual decision must follow it.

---

## WHAT THE TOUR DOES (read this in full before coding)

The tour is a linear, 9-state onboarding sequence that fires for first-time users
(or when manually replayed). It walks through 4 actions on the mobile dashboard:

STATE 1 — WELCOME
  A modal overlay appears over the empty dashboard.
  Card: Sora 700 headline, DM Sans body, --bs-accent CTA button.
  User clicks "Commencer la visite guidée →" to proceed.

STATE 2 — SPOTLIGHT: ADD BUTTON
  The SVG spotlight fades in (full-screen hole), then the iris morphs closed
  using easeOutBack spring to focus on the person_add button (#add-btn).
  A light-mode tooltip card floats in below the button.
  The tooltip shows a nudge ("Cliquez sur le bouton ☝️") — NO "Continuer" button.
  The user must click the real #add-btn to advance.
  CRITICAL: The SVG rect has pointer-events="none" so clicks pass through the overlay.

STATE 3 — GHOST CURSOR DEMO (modal open)
  The Add Patient bottom sheet opens.
  A ghost cursor appears and:
    1. Moves to the name input field, clicks (ripple animation)
    2. Types "Mohamed" character by character (90ms per char)
    3. Moves to the phone input, clicks
    4. Types "55 123 456" (95ms per char, counter "0/8" increments)
    5. Moves to "Ajouter à la file" button, clicks with press effect
  Modal closes. Mohamed appears in the queue with a slide-in animation.

STATE 4 — FILL MESSAGE
  A card overlay says "Remplissons la file !" with a progress bar.
  After 3 seconds it dismisses and Lilia, Fadi, Ali, Olfa appear in the queue
  one by one with staggered 450ms delays and translateX(-10px) → 0 animations.

STATE 5 — SPOTLIGHT: PRESENCE PILL
  Iris morphs from add-btn area to the presence pill (top-right of topbar).
  Tooltip: "Activez votre présence" — nudge only, NO Continuer.
  User must click the real presence pill.
  CRITICAL BUG TO AVOID: The tooltip's pointer-events must be 'none' in its
  default/hidden state. Only set pointer-events: all after the enter animation
  settles (520ms). _disableSpotlight() must explicitly set
  tooltip.style.pointerEvents = 'none' to clear the inline style override.

STATE 6 — AUTO: PRESENCE DROPDOWN
  Dropdown animates in, "Présent" gets selected automatically after 700ms,
  dropdown closes after 900ms, dot turns green.
  Mohamed is auto-called to consultation (consult card appears).

STATE 7 — SPOTLIGHT: KEBAB MENU (⋮)
  Iris morphs to the more_vert icon on Lilia's row (first queue item).
  Tooltip: "Partagez le lien de suivi" — nudge only.
  User must click the real ⋮ button.

STATE 8 — CTX MENU + SPOTLIGHT: WHATSAPP
  Context menu bottom sheet slides up.
  After 500ms, the iris morphs to the "Envoyer via WhatsApp" row.
  Tooltip appears ABOVE the row (arrow: 'down').
  CRITICAL: Use measured tooltip height (offsetHeight) to compute position,
  NOT a fixed pixel value. Formula: top = hole.y - tipHeight - 14px.
  Tooltip explains: "WhatsApp s'ouvre avec un message pré-rempli.
  Envoyez-le sur un 2e téléphone — le patient suivra sa position en temps réel."

STATE 9 — DONE
  Overlay closes, done screen appears inside the phone.
  Replay button appears below the phone.

---

## ARCHITECTURE TO BUILD

### 1. Zustand Store — `useTourStore`

```typescript
// web/src/stores/tourStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TourState =
  | 'IDLE'
  | 'WELCOME'
  | 'SPOTLIGHT_ADD'
  | 'MODAL_GHOST'
  | 'FILLING'
  | 'SPOTLIGHT_PRESENCE'
  | 'DEMO_PRESENCE'
  | 'SPOTLIGHT_SHARE'
  | 'CTX_MENU'
  | 'DONE'

interface TourStore {
  state: TourState
  hasCompletedTour: boolean
  setState: (s: TourState) => void
  completeTour: () => void
  resetTour: () => void
  // Click intercept actions — called by dashboard components during the tour
  onAddClick: () => void
  onPresenceClick: () => void
  onKebabClick: (idx: number) => void
}

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      state: 'IDLE',
      hasCompletedTour: false,
      setState: (state) => set({ state }),
      completeTour: () => set({ hasCompletedTour: true, state: 'DONE' }),
      resetTour:    () => set({ hasCompletedTour: false, state: 'WELCOME' }),
      // Called by dashboard click handlers during tour steps
      onAddClick:      () => { if (get().state === 'SPOTLIGHT_ADD')      set({ state: 'MODAL_GHOST' }) },
      onPresenceClick: () => { if (get().state === 'SPOTLIGHT_PRESENCE') set({ state: 'DEMO_PRESENCE' }) },
      onKebabClick:    (idx: number) => { if (get().state === 'SPOTLIGHT_SHARE') set({ state: 'CTX_MENU' }) },
    }),
    {
      name: 'blesaf-tour',
      partialize: (s) => ({ hasCompletedTour: s.hasCompletedTour }),
      // ↑ ONLY this boolean survives a page refresh.
      // Transient states like 'SPOTLIGHT_ADD' must never be persisted —
      // a user who closes mid-tour would reload to a broken intermediate state.
    }
  )
)
```

### 2. File Structure

```
web/src/
  components/
    tour/
      GuidedTour.tsx          ← root orchestrator, renders all tour layers
      TourWelcomeCard.tsx     ← STATE: WELCOME
      TourSpotlight.tsx       ← SVG overlay + border + tooltip
      TourGhostCursor.tsx     ← animated ghost cursor
      TourFillMessage.tsx     ← STATE: FILLING
      TourDoneScreen.tsx      ← STATE: DONE
      useTourEngine.ts        ← all animation logic (hole morphing, RAF, easing)
      tourTypes.ts            ← TypeScript interfaces
  stores/
    tourStore.ts              ← Zustand store (above)
```

### 3. `useTourEngine.ts` — Animation Engine

Extract this logic from the HTML file's JS verbatim, typed:

```typescript
// Easing functions
export const Ease = {
  outBack:    (t: number) => { const s=1.35; return 1+(s+1)*Math.pow(t-1,3)+s*Math.pow(t-1,2); },
  inOutCubic: (t: number) => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,
  linear:     (t: number) => t,
}

export interface HoleGeom {
  x: number; y: number; w: number; h: number; rx: number;
}

export const FULL_HOLE: HoleGeom = { x:4, y:4, w:264, h:552, rx:24 }

// measureElement: converts a DOM element's bounding rect
// into the 272×560 SVG coordinate space
export function measureElement(
  elementRef: React.RefObject<HTMLElement>,
  screenRef: React.RefObject<HTMLElement>,
  pad = 0
): HoleGeom { ... }

// morphHole: RAF loop with clamped easing (IMPORTANT: clamp eDim to [0, 1.5]
// to prevent negative dimensions when easeOutBack overshoots on small targets)
export function morphHole(
  from: HoleGeom,
  to: HoleGeom,
  duration: number,
  easeFn: (t: number) => number,
  onFrame: (h: HoleGeom) => void,
  onComplete: () => void
): () => void { // returns cancel function
  ...
}
```

### 4. `TourSpotlight.tsx` — The Core Component

```typescript
interface TourSpotlightProps {
  holeGeom: HoleGeom           // controlled by parent via useTourEngine
  overlayOpacity: number       // 0–1
  showBorder: boolean
  tooltip: TooltipConfig | null
  onTooltipNext: () => void
  onTooltipSkip: () => void
}
```

SVG mask pattern (copy from HTML file exactly):
```tsx
<svg
  style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
  viewBox="0 0 272 560"
  preserveAspectRatio="none"
>
  <defs>
    <mask id="sp-mask">
      <rect width="272" height="560" fill="white" />
      <rect
        x={hole.x} y={hole.y}
        width={Math.max(1, hole.w)} height={Math.max(1, hole.h)}
        rx={Math.max(0, hole.rx)}
        fill="black"
      />
    </mask>
  </defs>
  <rect
    width="272" height="560"
    fill="rgba(26,26,24,0.88)"
    mask="url(#sp-mask)"
    opacity={overlayOpacity}
    style={{ pointerEvents: 'none' }}
  />
</svg>
```

**TOOLTIP POINTER-EVENTS RULE** (critical — causes 3 bugs if missed):
```tsx
// In the tooltip JSX:
<div
  style={{
    pointerEvents: isVisible ? 'all' : 'none',  // ← NEVER leave as 'all' when hidden
    // ...
  }}
>
```
Set `isVisible` to `true` only after the enter animation settles (use a 520ms setTimeout
after triggering the animation class). Set it back to `false` immediately when hiding,
before the exit animation completes.

### 5. Tooltip Positioning Logic

```typescript
function computeTooltipTop(
  tooltipRef: React.RefObject<HTMLDivElement>,
  holeGeom: HoleGeom,
  arrow: 'up' | 'down'
): number {
  // Wait for layout before measuring
  const tipHeight = tooltipRef.current?.offsetHeight ?? 180
  const GAP = 14
  if (arrow === 'down') {
    // Tooltip sits ABOVE the target — bottom edge clears hole top
    return Math.max(6, holeGeom.y - tipHeight - GAP)
  } else {
    // Tooltip sits BELOW the target
    return holeGeom.y + holeGeom.h + GAP
  }
}
```
Use a `useLayoutEffect` or `requestAnimationFrame` to measure AFTER React renders
the tooltip content (title + desc change on each step, changing the height).

### 6. Integration into MobileDashboard

In `MobileDashboard.tsx`, add `ref` attributes to the 4 tour target elements:

```tsx
// These refs are passed down to GuidedTour for measurement
const addBtnRef = useRef<HTMLDivElement>(null)
const presencePillRef = useRef<HTMLDivElement>(null)
const kebabRefs = useRef<(HTMLDivElement | null)[]>([])
const whatsappItemRef = useRef<HTMLDivElement>(null)
const screenRef = useRef<HTMLDivElement>(null)   // ← 272×560 coordinate space

// Pass to GuidedTour:
<GuidedTour
  screenRef={screenRef}
  addBtnRef={addBtnRef}
  presencePillRef={presencePillRef}
  kebabRefs={kebabRefs}
  whatsappItemRef={whatsappItemRef}
/>
```

For the add button, presence pill, and kebab menu: wrap `onClick` to check
if tour state requires it:

```tsx
// Read tour state once at component level
const tourState = useTourStore((s) => s.state)
const { onAddClick, onPresenceClick, onKebabClick } = useTourStore.getState()

// Add button
const handleAddClick = () => {
  if (tourState === 'SPOTLIGHT_ADD') {
    onAddClick()  // sets state → 'MODAL_GHOST', GuidedTour reacts
    return        // do not open the real modal — tour orchestrates it
  }
  openAddPatientModal()  // normal behavior
}

// Presence pill
const handlePresenceClick = () => {
  if (tourState === 'SPOTLIGHT_PRESENCE') {
    onPresenceClick()  // sets state → 'DEMO_PRESENCE'
    return
  }
  togglePresenceDropdown()  // normal behavior
}

// Kebab / more_vert
const handleKebabClick = (idx: number) => {
  if (tourState === 'SPOTLIGHT_SHARE') {
    onKebabClick(idx)  // sets state → 'CTX_MENU', idx stored in GuidedTour local state
    return
  }
  openContextMenu(idx)  // normal behavior
}
```

### 7. Ghost Cursor Component

```typescript
interface GhostCursorState {
  visible: boolean
  left: number   // maps directly to CSS `left` — matches the CSS transition approach
  top: number    // maps directly to CSS `top`
  isClicking: boolean
}
```

The ghost cursor runs a Promise-based sequence of steps.
Each step: `moveTo(left, top, duration)` → `click()` → `typeInto(...)`.

Use `transition: 'left 500ms cubic-bezier(.4,0,.2,1), top 500ms ...'` on the
cursor div, and apply `left`/`top` from state directly as CSS properties.
The typing effect uses `setInterval` to append characters.

The ghost cursor runs inside the GuidedTour component and is invisible to the
real app — it only simulates the UI visually, it does NOT call real API endpoints.
After the ghost sequence finishes, add the real patient to the queue via the
existing Zustand/API pattern.

### 8. i18n Keys to Add

Add these to your French and Arabic translation files:

```json
// fr.json
{
  "tour": {
    "welcome_title": "Bienvenue dans BleSaf !",
    "welcome_body": "Voici votre tableau de bord. La file est vide pour l'instant. Laissez-nous vous montrer comment tout fonctionne — en moins de 2 minutes.",
    "welcome_cta": "Commencer la visite guidée",
    "fill_title": "Remplissons la file !",
    "fill_body": "Je vais maintenant ajouter des patients imaginaires pour vous montrer l'interface en action.",
    "done_title": "Visite terminée !",
    "done_body": "Vous maîtrisez maintenant les 4 actions fondamentales de BleSaf.",
    "done_replay": "Rejouer la visite",
    "step_add_title": "Ajoutez votre premier patient",
    "step_add_desc": "Appuyez sur ce bouton pour ouvrir le formulaire d'ajout.",
    "step_add_nudge": "Cliquez sur le bouton",
    "step_presence_title": "Activez votre présence",
    "step_presence_desc": "Vous êtes actuellement \"Absent\". Tapez sur ce bouton pour indiquer que vous êtes disponible.",
    "step_presence_nudge": "Cliquez sur le badge",
    "step_share_title": "Partagez le lien de suivi",
    "step_share_desc": "Tapez sur ⋮ à côté d'un patient pour accéder au menu WhatsApp.",
    "step_share_nudge": "Tapez sur le menu",
    "step_whatsapp_title": "Envoyez le lien via WhatsApp",
    "step_whatsapp_desc": "WhatsApp s'ouvre avec un message pré-rempli. Envoyez-le sur un 2e téléphone — le patient suivra sa position en temps réel.",
    "skip": "Passer",
    "continue": "Continuer"
  }
}
```

Mirror in `ar.json` with RTL-appropriate phrasing.

### 9. Tour Trigger Logic

In `DashboardPage.tsx` or `App.tsx`, auto-start tour for new users:

```typescript
useEffect(() => {
  const { hasCompletedTour, setState } = useTourStore.getState()
  if (!hasCompletedTour) {
    // Small delay so dashboard renders first
    const t = setTimeout(() => setState('WELCOME'), 800)
    return () => clearTimeout(t)
  }
}, [])
```

Also add a "Rejouer la visite" button in the settings menu for returning users.

---

## IMPLEMENTATION ORDER

Do these in sequence. Do not skip ahead.

1. **`tourTypes.ts`** — all interfaces and the TourState union type
2. **`tourStore.ts`** — Zustand store with persistence
3. **`useTourEngine.ts`** — easing functions, measureElement, morphHole, fadeOverlay
4. **`TourSpotlight.tsx`** — SVG overlay + glow border + tooltip (no logic, pure display)
5. **`TourGhostCursor.tsx`** — cursor display + ripple animation
6. **`TourWelcomeCard.tsx`** — welcome overlay
7. **`TourFillMessage.tsx`** — fill overlay with progress bar
8. **`TourDoneScreen.tsx`** — done screen
9. **`GuidedTour.tsx`** — orchestrator: imports all above, owns all state transitions
10. **Integration** — add refs and click intercepts to MobileDashboard
11. **i18n** — add all keys
12. **Testing** — verify each state transition manually

---

## CRITICAL BUGS TO AVOID

These bugs were discovered and fixed during prototyping. Avoid them:

### Bug 1 — SVG pointer-events
The SVG `<rect>` element does not inherit CSS `pointer-events: none` from its
parent div. You MUST set it directly:
```tsx
// On the <rect> element:
style={{ pointerEvents: 'none' }}
// AND on the <svg> element:
style={{ pointerEvents: 'none' }}
```

### Bug 2 — Tooltip blocks clicks when hidden
The tooltip must have `pointer-events: none` in its default state.
Only set `pointer-events: all` AFTER the 520ms enter animation settles.
If you leave it as `pointer-events: all` while `opacity: 0`, it will
silently eat every click on the underlying UI — including the presence pill.

### Bug 3 — Disabling the spotlight must reset pointer-events via state, not direct DOM mutation
When hiding the spotlight (to respond to a user click), reset pointer-events
by calling the state setter — not by mutating the DOM ref directly.

```typescript
// ❌ Wrong — direct DOM mutation bypasses React reconciliation
tooltipRef.current.style.pointerEvents = 'none'

// ✓ Correct — update the state that controls the style prop
setTooltipPointerEvents('none')
```

Call `setTooltipPointerEvents('none')` immediately at the start of any function
that hides the spotlight (before animations begin), so the tooltip stops
intercepting clicks right away, not after the fade-out completes.

### Bug 4 — Negative SVG dimensions crash the RAF loop
`easeOutBack` overshoots past 1.0. When morphing from a large hole to a small
target (like the 28px-tall presence pill), the interpolation can produce:
`lerp(552, 28, 1.07) = -8px`
SVG rejects negative height, logs errors, and the RAF loop crashes — leaving
the overlay stuck and blocking all input.

Fix: clamp dimensions in the render function AND clamp the easing value for
dimension interpolation only:
```typescript
// In morphHole tick:
const eDim = Math.min(Math.max(easeFn(t), 0), 1.5)  // for w, h, rx only
const ePos = easeFn(t)                                // for x, y (allow free spring)

// In renderHole:
const safeW  = Math.max(1, hole.w)
const safeH  = Math.max(1, hole.h)
const safeRx = Math.max(0, hole.rx)
```

### Bug 5 — Tooltip covers the highlighted element
Never use a fixed pixel offset to position the tooltip above its target.
Always measure the tooltip's rendered height first:
```typescript
useLayoutEffect(() => {
  const tipH = tooltipRef.current?.offsetHeight ?? 0
  // Then compute: top = holeGeom.y - tipH - 14
}, [currentStep, title, desc])  // re-measure when content changes
```

---

## DESIGN TOKENS TO USE IN TAILWIND

If your Tailwind config does not already include these, add them:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'bs-accent':     '#0F7B6C',
      'bs-accent-dk':  '#0A5C50',
      'bs-accent-lt':  '#E8F5F1',
      'bs-bg':         '#F6F5F0',
      'bs-surface':    '#FFFFFF',
      'bs-surface-alt':'#F0EFEA',
      'bs-border':     '#E8E6DF',
      'bs-text':       '#1A1A1A',
      'bs-text-2':     '#6B6960',
      'bs-text-3':     '#9E9B90',
      'bs-green':      '#2D8B4E',
      'bs-green-lt':   '#EDF7F0',
      'bs-red':        '#D94F3B',
      'bs-red-lt':     '#FDF0ED',
      'bs-amber':      '#D4920B',
      'bs-amber-lt':   '#FEF7E6',
    },
    fontFamily: {
      'dm-sans':    ['DM Sans', 'sans-serif'],
      'dm-mono':    ['DM Mono', 'monospace'],
      'sora':       ['Sora', 'sans-serif'],
    },
    borderRadius: {
      'bs-xs':  '6px',
      'bs-sm':  '8px',
      'bs-md':  '12px',
      'bs-lg':  '14px',
      'bs-xl':  '20px',
      'bs-2xl': '28px',
    },
    boxShadow: {
      'bs-sm':    '0 1px 2px rgba(0,0,0,.04)',
      'bs-md':    '0 4px 12px rgba(0,0,0,.06)',
      'bs-lg':    '0 8px 32px rgba(0,0,0,.10)',
      'bs-float': '0 6px 24px rgba(15,123,108,.25)',
      'bs-sheet': '0 -4px 32px rgba(0,0,0,.12)',
    }
  }
}
```

---

## WHAT NOT TO DO

- Do NOT call any real API endpoints during the tour. The ghost cursor demo
  is purely visual. Add a fake patient to a local `tourDemoPatients` array,
  not to the real queue.
- Do NOT use `Syne` or `Bebas Neue` inside the dashboard UI components —
  those fonts are only for the page chrome (the outer shell around the phone
  in the prototype). Inside the screen, use DM Sans only.
- Do NOT use emojis as icons anywhere. Use Material Symbols Rounded exclusively.
  The WhatsApp item uses an inline SVG (no Material equivalent).
- Do NOT block the real UI during the tour. The spotlight overlay uses
  `pointer-events: none` on the SVG so target elements remain clickable.
- Do NOT show the tour to returning users automatically. Check
  `hasCompletedTour` from the persisted Zustand store first.
- Do NOT hard-code French strings. Use the i18n keys from step 8.

---

## ACCEPTANCE CRITERIA

The implementation is complete when:

1. First-time users see the welcome card on first dashboard load
2. All 9 states transition correctly without any console errors
3. The SVG spotlight morphs smoothly with spring overshoot between all 3 targets
4. The ghost cursor types "Mohamed" and "55 123 456" with realistic timing
5. Queue fills with 5 patients with staggered animations
6. Presence pill click is detected and advances the tour (the most error-prone step)
7. Kebab click opens context menu AND focuses spotlight on WhatsApp row
8. Tooltip never covers the element it is describing
9. Tooltip never blocks clicks when invisible (no pointer-events leaks)
10. `hasCompletedTour` is persisted to localStorage after STATE 9
11. "Rejouer la visite" in settings correctly resets all state
12. All strings come from i18n keys (French + Arabic)
13. No console errors, especially no "negative value is not valid" SVG errors
```

---

## One Last Note for Claude Code

The HTML prototype file is the source of truth for all animation behavior.
If there is any ambiguity in the instructions above, look at the HTML file first.
The JS in that file is production-ready logic — translate it to TypeScript, do not rewrite it.
The easing functions, the RAF loops, the 520ms settle delay, the eDim clamping —
all of these values were arrived at through iteration and must be preserved exactly.
