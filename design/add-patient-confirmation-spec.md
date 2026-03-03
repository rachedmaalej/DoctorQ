# BleSaf — Add Patient Confirmation Step · Implementation Spec

> **Scope:** This document specifies the confirmation state that appears immediately after a receptionist successfully adds a new patient to the queue. It covers the component architecture, pixel-level layout, all interactive states, animations, data requirements, i18n strings, and integration points with the existing add-patient flow.
>
> **Reference mock:** `blesaf-confirmation-selected.html` — use it as the pixel-perfect source of truth. When any measurement below conflicts with the mock, the mock wins.

---

## 1. Context & Position in the Flow

```
Quick-Add Input  →  [person_add button]
        ↓
Add Patient Bottom Sheet  (name, RDV toggle, phone)
        ↓
[Ajouter à la file]
        ↓
► CONFIRMATION SHEET  ◄  ← this document
        ↓
[WhatsApp icon]  →  WhatsApp deep-link opens
[person_add icon]  →  sheet resets to empty Add Patient form
[undo icon]  →  sheet dismisses, queue refreshes
```

The confirmation sheet **replaces** the add-patient form — it does not appear on top of it. The same `<BottomSheet>` component transitions from form state to confirmation state in-place.

---

## 2. Component Architecture

### 2.1 File locations

```
apps/web/src/components/
  AddPatientSheet/
    index.tsx                  ← sheet orchestrator (existing, modify)
    AddPatientForm.tsx          ← form step (existing, no changes)
    AddPatientConfirmation.tsx  ← NEW — confirmation step
    types.ts                   ← shared types (add ConfirmationData)
```

### 2.2 Sheet state machine

The sheet orchestrator manages two states via a `step` prop:

```typescript
type SheetStep = 'form' | 'confirmation';
```

```tsx
// index.tsx (simplified)
const [step, setStep] = useState<SheetStep>('form');
const [confirmedPatient, setConfirmedPatient] = useState<ConfirmationData | null>(null);

function handlePatientAdded(data: ConfirmationData) {
  setConfirmedPatient(data);
  setStep('confirmation');
}

function handleAddAnother() {
  setConfirmedPatient(null);
  setStep('form'); // form resets to empty state
}

function handleDismiss() {
  close(); // dismiss sheet
  refreshQueue();
}
```

The transition between steps is animated (see §6).

### 2.3 ConfirmationData type

```typescript
// types.ts
export interface ConfirmationData {
  patientId: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;       // undefined = no phone entered
  appointmentType: 'WALK_IN' | 'APPOINTMENT';
  position: number;           // assigned queue position
  estimatedWaitMinutes: number;
  whatsAppUrl?: string;       // pre-built wa.me deep-link, undefined if no phone
}
```

---

## 3. Layout Specification

### 3.1 Sheet container

The confirmation sheet is a standard bottom sheet with a white surface, shared with the form step.

```
background:    var(--surface)           → #FFFFFF
border-radius: 20px 20px 0 0
padding:       13px 16px 24px
box-shadow:    0 -10px 40px rgba(0,0,0,0.12)
```

**Drag handle** — centered at the top:
```
width:         32px
height:        3px
background:    var(--border)            → #E8E6DF
border-radius: 2px
margin:        0 auto 14px
```

---

### 3.2 Header row

A single flex row (`align-items: center`, `justify-content: space-between`) containing the patient identity on the left and the position pill on the right.

```
margin-bottom: 14px
```

#### 3.2.1 Left — Check + name block

```
display: flex
align-items: center
gap: 9px
```

**Check circle:**
```
width:         32px
height:        32px
border-radius: 50%
background:    var(--green-light)       → #EDF7F0
icon:          Material Symbols Rounded · "check" · 16px
icon color:    var(--green)             → #2D8B4E
icon fill:     FILL 1
```

**Text block** (two stacked lines, no gap):
```
Patient name
  font-size:   15px
  font-weight: 700
  color:       var(--text-primary)      → #1A1A1A
  letter-spacing: -0.01em

Sub-label  →  "Ajoutée · Sans rendez-vous"  OR  "Ajoutée · Avec rendez-vous"
  font-size:   10.5px
  font-weight: 400
  color:       var(--text-secondary)    → #6B6960
  margin-top:  2px
```

#### 3.2.2 Right — Position pill

```
background:    var(--accent-light)      → #E8F5F1
border:        1.5px solid rgba(15,123,108,0.18)
border-radius: 9px
padding:       6px 10px
text-align:    center
flex-shrink:   0
```

Inside (two stacked lines):
```
"POS." label
  font-size:   7.5px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.06em
  color:       var(--accent)            → #0F7B6C
  line-height: 1

Position number  (e.g. "6")
  font-size:   20px
  font-weight: 700
  color:       var(--accent)
  letter-spacing: -0.03em
  line-height: 1.15
```

---

### 3.3 Action buttons row

Three equal-width square icon buttons in a single flex row.

```
display:        flex
gap:            8px
justify-content: space-between
margin-top:     0           (immediately below header row)
```

Each button shares these base styles:
```
flex:           1
height:         45px
border-radius:  var(--radius)           → 12px
display:        flex
align-items:    center
justify-content: center
cursor:         pointer
transition:     transform 120ms ease, opacity 120ms ease
active state:   transform: scale(0.93)
```

#### Button 1 — WhatsApp (send ticket)

```
background:     var(--accent)           → #0F7B6C
box-shadow:     var(--shadow-float)     → 0 6px 24px rgba(15,123,108,0.25)
icon:           WhatsApp SVG logo       (white fill, 22×22px)
```

**Disabled state** (when `whatsAppUrl` is undefined — no phone number):
```
opacity:        0.38
pointer-events: none
```

When a phone number is present, tapping opens the WhatsApp deep-link:
```
window.open(confirmationData.whatsAppUrl, '_blank')
```

WhatsApp URL construction (server-side preferred, fallback client-side):
```typescript
function buildWhatsAppUrl(phone: string, patientName: string, position: number): string {
  const normalized = phone.startsWith('+') ? phone : `+216${phone}`;
  const message = encodeURIComponent(
    `Bonjour ${patientName}, vous êtes en position #${position} dans la file d'attente. Nous vous appellerons bientôt.`
  );
  return `https://wa.me/${normalized.replace(/\D/g, '')}?text=${message}`;
}
```

#### Button 2 — Add another patient

```
background:     var(--surface-alt)      → #F0EFEA
border:         1.5px solid var(--border) → #E8E6DF
icon:           Material Symbols Rounded · "person_add" · 22px
icon color:     var(--accent)           → #0F7B6C
```

Tapping resets the sheet to an empty `AddPatientForm` (clears all fields, returns to `step = 'form'`).

#### Button 3 — Dismiss / return to queue

```
background:     var(--surface)          → #FFFFFF
border:         1.5px solid var(--border) → #E8E6DF
icon:           Material Symbols Rounded · "undo" · 22px
icon color:     var(--text-tertiary)    → #9E9B90
```

This button is visually the lightest of the three — white background vs. `--surface-alt` for button 2 — establishing a clear left-to-right weight hierarchy: **Primary (teal) → Secondary (warm grey) → Tertiary (white)**.

Tapping dismisses the sheet and triggers a queue refresh.

---

## 4. WhatsApp Button Accessibility (no phone number)

When the patient was added without a phone number, the WhatsApp button must communicate its disabled state clearly without removing it from the layout.

```
opacity:        0.38
cursor:         not-allowed
```

Optionally, display a tooltip on long-press:
```
"Aucun numéro enregistré"
```

Do not hide the button. Its greyed-out presence is intentional: it reminds the receptionist that a phone number can still be added via the queue item's context menu (`more_vert → Ajouter numéro`).

---

## 5. Full Component Code

```tsx
// AddPatientConfirmation.tsx

import { ConfirmationData } from './types';

interface Props {
  data: ConfirmationData;
  onAddAnother: () => void;
  onDismiss: () => void;
}

export function AddPatientConfirmation({ data, onAddAnother, onDismiss }: Props) {
  const displayName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const subLabel = data.appointmentType === 'WALK_IN'
    ? 'Ajoutée · Sans rendez-vous'
    : 'Ajoutée · Avec rendez-vous';
  const hasPhone = !!data.phoneNumber && !!data.whatsAppUrl;

  function handleWhatsApp() {
    if (!hasPhone || !data.whatsAppUrl) return;
    window.open(data.whatsAppUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="confirmation-sheet">
      {/* Drag handle */}
      <div className="drag-handle" />

      {/* Header row */}
      <div className="confirmation-header">
        <div className="confirmation-identity">
          <div className="check-circle">
            <span className="material-symbols-rounded filled">check</span>
          </div>
          <div>
            <p className="patient-name">{displayName}</p>
            <p className="patient-sub">{subLabel}</p>
          </div>
        </div>
        <div className="position-pill">
          <span className="position-label">POS.</span>
          <span className="position-number">{data.position}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        {/* WhatsApp */}
        <button
          className="action-btn action-btn--wa"
          onClick={handleWhatsApp}
          disabled={!hasPhone}
          aria-label="Envoyer le bon de suivi par WhatsApp"
          title={!hasPhone ? 'Aucun numéro enregistré' : 'Envoyer le bon WhatsApp'}
        >
          <WhatsAppIcon />
        </button>

        {/* Add another */}
        <button
          className="action-btn action-btn--add"
          onClick={onAddAnother}
          aria-label="Ajouter un autre patient"
          title="Ajouter un autre patient"
        >
          <span className="material-symbols-rounded">person_add</span>
        </button>

        {/* Dismiss */}
        <button
          className="action-btn action-btn--back"
          onClick={onDismiss}
          aria-label="Retour à la file d'attente"
          title="Terminer — Retour à la file"
        >
          <span className="material-symbols-rounded">undo</span>
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Animations & Transitions

### 6.1 Form → Confirmation transition

When the add mutation resolves successfully, the sheet content crossfades:

```typescript
// Duration: 280ms
// Easing: ease-out
// Technique: opacity fade + slight vertical shift

// Step 1 (0–120ms): form fades out + slides up 8px
// Step 2 (160–280ms): confirmation fades in + slides up from +10px to 0
```

Implementation with CSS:
```css
.sheet-content {
  animation: sheet-step-in 280ms ease-out both;
}

@keyframes sheet-step-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Apply the `key` prop on the step wrapper so React re-mounts it and triggers the animation:
```tsx
<div key={step} className="sheet-content">
  {step === 'form' ? <AddPatientForm … /> : <AddPatientConfirmation … />}
</div>
```

### 6.2 Button press feedback

All three action buttons use the same press treatment:

```css
.action-btn:active {
  transform: scale(0.93);
  transition: transform 80ms ease;
}
```

### 6.3 Sheet dismiss animation

When the user taps the undo button or swipes down, the sheet slides down with:
```
duration:   320ms
easing:     cubic-bezier(0.32, 0, 0.67, 0)   (ease-in)
property:   transform: translateY(100%)
```

After the animation completes, `refreshQueue()` is called.

---

## 7. CSS / Tailwind

The project uses **Tailwind CSS** via `apps/web`. Where Tailwind utility classes do not map exactly to the design tokens, use inline styles or a local `.module.css`. The design tokens are defined in `tailwind.config.ts` — do not hardcode hex values in component files.

**Tailwind config additions needed** (if not already present):
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      accent: '#0F7B6C',
      'accent-light': '#E8F5F1',
      'accent-dark': '#0A5C50',
      'surface-alt': '#F0EFEA',
      border: '#E8E6DF',
      'text-primary': '#1A1A1A',
      'text-secondary': '#6B6960',
      'text-tertiary': '#9E9B90',
      green: { DEFAULT: '#2D8B4E', light: '#EDF7F0' },
    },
    borderRadius: {
      DEFAULT: '12px',
      sm: '8px',
      xs: '6px',
    },
    boxShadow: {
      float: '0 6px 24px rgba(15,123,108,0.25)',
    },
  },
}
```

**Key class mappings for this component:**

| Element | Tailwind classes |
|---|---|
| Sheet container | `bg-white rounded-t-[20px] px-4 pt-[13px] pb-6` |
| Drag handle | `w-8 h-[3px] bg-border rounded-full mx-auto mb-[14px]` |
| Header row | `flex items-center justify-between mb-[14px]` |
| Check circle | `w-8 h-8 rounded-full bg-green-light flex items-center justify-center shrink-0` |
| Patient name | `text-[15px] font-bold text-text-primary tracking-[-0.01em]` |
| Sub-label | `text-[10.5px] text-text-secondary mt-0.5` |
| Position pill | `bg-accent-light border border-accent/[0.18] rounded-[9px] px-2.5 py-1.5 text-center shrink-0` |
| POS. label | `text-[7.5px] font-bold uppercase tracking-[0.06em] text-accent leading-none` |
| Position number | `text-[20px] font-bold text-accent tracking-[-0.03em] leading-[1.15]` |
| Action row | `flex gap-2 justify-between` |
| Button shared | `flex-1 h-[45px] rounded-[12px] flex items-center justify-center active:scale-[0.93] transition-transform` |
| WA button | `bg-accent shadow-float disabled:opacity-[0.38] disabled:cursor-not-allowed` |
| Add button | `bg-surface-alt border-[1.5px] border-border` |
| Back button | `bg-white border-[1.5px] border-border` |

---

## 8. API Integration

### 8.1 Mutation

The `AddPatientForm` calls the existing `POST /api/queues/:clinicId/patients` endpoint. On a `201` response, the confirmation data is derived from the response body and passed to the confirmation step:

```typescript
// Expected API response shape (201 Created)
interface AddPatientResponse {
  patient: {
    id: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    appointmentType: 'WALK_IN' | 'APPOINTMENT';
    position: number;
    estimatedWaitMinutes: number;
  };
}

// Map to ConfirmationData in the mutation onSuccess handler
function mapToConfirmation(res: AddPatientResponse): ConfirmationData {
  const { patient } = res;
  const whatsAppUrl = patient.phoneNumber
    ? buildWhatsAppUrl(patient.phoneNumber, patient.firstName, patient.position)
    : undefined;

  return {
    patientId: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phoneNumber: patient.phoneNumber,
    appointmentType: patient.appointmentType,
    position: patient.position,
    estimatedWaitMinutes: patient.estimatedWaitMinutes,
    whatsAppUrl,
  };
}
```

### 8.2 Queue refresh on dismiss

When the undo button or sheet backdrop is tapped, invalidate the queue query so the new patient appears immediately:

```typescript
// Using React Query
const queryClient = useQueryClient();

function handleDismiss() {
  queryClient.invalidateQueries({ queryKey: ['queue', clinicId] });
  onClose();
}
```

---

## 9. i18n Strings

All user-facing strings must be defined in the i18n catalogue. Do not hardcode in JSX.

```typescript
// fr.json additions
{
  "confirmation": {
    "sub_walk_in": "Ajoutée · Sans rendez-vous",
    "sub_appointment": "Ajoutée · Avec rendez-vous",
    "position_label": "POS.",
    "btn_whatsapp_label": "Envoyer le bon de suivi par WhatsApp",
    "btn_whatsapp_tooltip_no_phone": "Aucun numéro enregistré",
    "btn_add_another_label": "Ajouter un autre patient",
    "btn_dismiss_label": "Terminer — Retour à la file"
  }
}

// ar.json additions
{
  "confirmation": {
    "sub_walk_in": "تمت الإضافة · بدون موعد",
    "sub_appointment": "تمت الإضافة · بموعد",
    "position_label": "الرقم",
    "btn_whatsapp_label": "إرسال تذكرة المتابعة عبر واتساب",
    "btn_whatsapp_tooltip_no_phone": "لا يوجد رقم مسجل",
    "btn_add_another_label": "إضافة مريض آخر",
    "btn_dismiss_label": "انتهى — العودة إلى قائمة الانتظار"
  }
}
```

**RTL note:** In Arabic mode, the flex row direction reverses automatically. The button order (WA → Add → Back) remains visually consistent because the semantic meaning is preserved — left-to-right in LTR, right-to-left in RTL. No manual order overrides needed.

---

## 10. Accessibility

| Requirement | Implementation |
|---|---|
| All buttons have `aria-label` | Use i18n strings from §9 |
| Disabled WA button is announced | `aria-disabled="true"` + `title` attribute with reason |
| Focus trap inside sheet | Existing sheet component handles this |
| Sheet has `role="dialog"` | Existing sheet component handles this |
| Minimum touch target | All buttons are 45px tall × `flex:1` wide — well above 44px minimum |
| Check icon is decorative | `aria-hidden="true"` on the icon span |
| Position number is readable | Wrap in `<span aria-label={t('confirmation.position_label') + ' ' + position}>` |

---

## 11. Edge Cases

| Scenario | Behaviour |
|---|---|
| Patient added without phone number | WA button renders at `opacity: 0.38`, `pointer-events: none`. No error state, no toast. |
| WhatsApp not installed on device | `window.open` with `wa.me` URL — OS handles the fallback gracefully (prompts install or opens web.whatsapp.com). No special handling needed. |
| User taps "Add another" immediately | Form resets to completely empty state. Previous patient is already in the queue; no duplicate risk. |
| Backdrop tap | Treated identically to the undo button — dismiss sheet + refresh queue. |
| Sheet already animating when user taps | Debounce all three button handlers by 200ms to prevent double-fires. |
| Network error on add mutation | Confirmation step is never reached — error is handled by the form step (existing behaviour). |
| Position `> 99` | Position pill renders correctly at any number. No truncation needed at realistic queue sizes. |

---

## 12. What NOT to change

- The `AddPatientForm` component is untouched — this spec only adds the confirmation step.
- The bottom sheet container component (`BottomSheet`) is untouched — only the content inside it changes.
- The `POST /api/queues/:clinicId/patients` endpoint is untouched — no API changes required.
- The floating "Appeler Suivant" CTA is unaffected — it sits on the dashboard behind the sheet.
