# Spec: Onboarding Flow — Step 4 (QR Reveal) · Desktop

**Target file:** `web/src/pages/OnboardingPage.tsx` (or wherever steps 1–3 are rendered)
**Scope:** Add a new `Step4QrReveal` component, wire it into the existing step router, connect it to real clinic/QR data, and add all required i18n keys.

---

## 0. Context & Prerequisites

- Steps 1–3 already exist and share a consistent two-panel card layout (left illustration + right form).
- The onboarding flow is triggered after the user clicks **"Essai gratuit – 30 jours"** on the landing page and completes account creation.
- By the time Step 4 renders, the following data is already available (set during step 3):
  - `clinic.id`
  - `clinic.name` (e.g. `"Cabinet Dr. Skander Kamo"`)
  - `clinic.slug` (e.g. `"dr-skander-kamo"`) — used to build the public check-in URL
  - `clinic.qrCodeUrl` — a PNG URL served by the API (e.g. `/api/clinic/:id/qrcode`)
- This screen is the **final step** of the onboarding wizard. The primary CTA navigates to `/dashboard`.

---

## 1. Visual Design Reference

The approved design follows the "Variante C — Zéro friction" concept:

```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │                      │  │  ● ● ● ●(active)            │  │
│  │   [Illustration]     │  │                             │  │
│  │                      │  │  🟢 Votre QR code est actif │  │
│  │                      │  │                             │  │
│  │                      │  │  Affichez ce code.          │  │
│  │                      │  │  C'est tout.                │  │
│  │  ┌──────────────────┐│  │                             │  │
│  │  │ glass badge:     ││  │  [body copy]                │  │
│  │  │ Zéro config…     ││  │                             │  │
│  │  └──────────────────┘│  │  ┌────────────────────────┐ │  │
│  └──────────────────────┘  │  │ [QR img] [meta + btns] │ │  │
│                             │  └────────────────────────┘ │  │
│                             │  [stat] [stat] [stat]        │  │
│                             │                             │  │
│                             │  [ Ouvrir mon tableau → ]   │  │
│                             └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Card: `max-w-[940px]`, `min-h-[570px]`, two columns, `rounded-[22px]`, `overflow-hidden`.
Left panel: `w-[44%]`. Right panel: `flex-1`.

---

## 2. Component to Create

### File path
```
web/src/components/onboarding/Step4QrReveal.tsx
```

### Props interface
```typescript
interface Step4QrRevealProps {
  clinicName: string;          // "Cabinet Dr. Skander Kamo"
  clinicSlug: string;          // "dr-skander-kamo"
  qrCodeUrl: string;           // URL of generated QR PNG from API
  onComplete: () => void;      // navigates to /dashboard
}
```

---

## 3. Component Structure (JSX skeleton)

```tsx
export default function Step4QrReveal({
  clinicName,
  clinicSlug,
  qrCodeUrl,
  onComplete,
}: Step4QrRevealProps) {
  const { t } = useTranslation();
  const publicUrl = `blesaf.tn/q/${clinicSlug}`;

  return (
    <div className="flex w-full max-w-[940px] min-h-[570px] rounded-[22px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.20),0_4px_18px_rgba(0,0,0,0.10)] animate-card-in">

      {/* ── LEFT PANEL ── */}
      <LeftPanel />

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-[#fafafa] flex flex-col px-10 py-[38px]">
        <StepDots total={4} current={4} />
        <StatusBadge />
        <Heading />
        <BodyCopy />
        <QrBlock qrCodeUrl={qrCodeUrl} clinicName={clinicName} publicUrl={publicUrl} />
        <StatsRow />
        <CtaButton onClick={onComplete} />
      </div>

    </div>
  );
}
```

Split into sub-components **within the same file** (no separate files needed for these small pieces).

---

## 4. Sub-component Specifications

### 4.1 `<LeftPanel />`

```tsx
function LeftPanel() {
  return (
    <div className="relative w-[44%] flex-shrink-0 overflow-hidden bg-[#b8dece]">
      {/* Illustration */}
      <img
        src="/assets/onboarding/qr-reveal.png"
        alt=""           // decorative — no meaningful alt needed
        aria-hidden="true"
        className="w-full h-full object-cover object-center block transition-transform duration-[600ms] ease-in-out hover:scale-[1.02]"
      />

      {/* Bottom gradient vignette (CSS-only, no extra element needed — use pseudo via Tailwind) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(27,45,37,0.72)] pointer-events-none" />

      {/* Glass badge */}
      <div className="absolute bottom-[26px] left-[22px] right-[22px] z-10
                      bg-white/[0.13] backdrop-blur-[14px]
                      border border-white/[0.22] rounded-[13px]
                      px-4 py-[13px] text-white">
        <strong className="block text-[14px] font-semibold mb-1 tracking-tight leading-snug">
          {t('onboarding.step4.badgeTitle')}
        </strong>
        <span className="text-[12.5px] opacity-[0.82] leading-[1.45]">
          {t('onboarding.step4.badgeSubtitle')}
        </span>
      </div>
    </div>
  );
}
```

**Image asset:** Copy `qr-reveal_B.png` to `web/public/assets/onboarding/qr-reveal.png`.

---

### 4.2 `<StepDots total current />`

Reuse the existing `StepDots` component if one exists in the onboarding flow. If not, implement:

```tsx
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-[6px] mb-[26px] items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-[5px] rounded-full transition-all duration-300',
            i + 1 === current
              ? 'bg-[#356B58] w-[38px]'
              : 'bg-[#dde0da] w-[26px]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
```

---

### 4.3 `<StatusBadge />`

```tsx
function StatusBadge() {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[0.09em] uppercase text-[#356B58] mb-[14px]">
      <span className="w-2 h-2 rounded-full bg-[#356B58] flex-shrink-0 animate-pulse-dot" />
      {t('onboarding.step4.statusBadge')}
    </div>
  );
}
```

Add to `tailwind.config.js` under `theme.extend.animation`:
```js
'pulse-dot': 'pulseDot 1.9s ease infinite',
```
And under `theme.extend.keyframes`:
```js
pulseDot: {
  '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(53,107,88,0.4)' },
  '50%':      { opacity: '0.6', transform: 'scale(1.25)', boxShadow: '0 0 0 5px rgba(53,107,88,0)' },
},
```

---

### 4.4 `<Heading />`

```tsx
function Heading() {
  const { t } = useTranslation();
  return (
    <h1 className="text-[30px] font-bold leading-[1.16] text-[#1B2D25] tracking-[-0.035em] mb-3">
      {t('onboarding.step4.headingLine1')}
      <br />
      <em className="not-italic text-[#356B58]">
        {t('onboarding.step4.headingLine2')}
      </em>
    </h1>
  );
}
```

---

### 4.5 `<BodyCopy />`

```tsx
function BodyCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-[13.5px] text-[#5c6960] leading-[1.65] mb-[22px] max-w-[370px]">
      {t('onboarding.step4.bodyCopy')}
    </p>
  );
}
```

---

### 4.6 `<QrBlock qrCodeUrl clinicName publicUrl />`

This is the most interactive element. It contains the live QR image, status pill, clinic name, public URL, and two action buttons.

```tsx
interface QrBlockProps {
  qrCodeUrl: string;
  clinicName: string;
  publicUrl: string;
}

function QrBlock({ qrCodeUrl, clinicName, publicUrl }: QrBlockProps) {
  const { t } = useTranslation();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `blesaf-qr-${clinicName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.open(`/print-qr?clinicName=${encodeURIComponent(clinicName)}&qr=${encodeURIComponent(qrCodeUrl)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-[18px]
                    bg-[#EAECE6] border border-[#356B58]/[0.13]
                    rounded-[14px] px-5 py-4 mb-[14px]">

      {/* QR image frame */}
      <div className="w-[78px] h-[78px] flex-shrink-0
                      bg-white rounded-[10px] border border-black/[0.07]
                      flex items-center justify-center overflow-hidden">
        <img
          src={qrCodeUrl}
          alt={t('onboarding.step4.qrAlt')}
          className="w-[66px] h-[66px] object-contain"
        />
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        {/* Active pill */}
        <div className="inline-flex items-center gap-[5px]
                        bg-[#356B58]/[0.11] text-[#356B58]
                        text-[11px] font-bold tracking-[0.04em]
                        rounded-full px-[10px] py-[3px] mb-[5px]">
          <span className="w-[9px] h-[9px] rounded-full bg-[#356B58]" />
          {t('onboarding.step4.qrStatus')}
        </div>

        {/* Clinic name */}
        <p className="text-[13px] font-semibold text-[#1B2D25] mb-[2px] truncate">
          {clinicName}
        </p>

        {/* Public URL */}
        <p className="text-[11.5px] text-[#9aa49f] mb-[9px]">
          {publicUrl}
        </p>

        {/* Action buttons */}
        <div className="flex gap-[6px]">
          <QrActionButton icon="download" label={t('onboarding.step4.btnDownload')} onClick={handleDownload} />
          <QrActionButton icon="print"    label={t('onboarding.step4.btnPrint')}    onClick={handlePrint} />
        </div>
      </div>
    </div>
  );
}
```

#### `<QrActionButton />` (inline helper)

```tsx
function QrActionButton({
  icon,
  label,
  onClick,
}: {
  icon: 'download' | 'print';
  label: string;
  onClick: () => void;
}) {
  const icons = {
    download: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    print: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-[5px]
                 text-[11.5px] font-medium whitespace-nowrap
                 px-3 py-[5px] rounded-[8px]
                 border border-[#356B58]/[0.20] bg-white text-[#356B58]
                 transition-all duration-[160ms] ease-in-out
                 hover:bg-[#356B58] hover:text-white hover:border-[#356B58]
                 hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(53,107,88,0.25)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356B58] focus-visible:ring-offset-2"
    >
      {icons[icon]}
      {label}
    </button>
  );
}
```

---

### 4.7 `<StatsRow />`

```tsx
const STATS = [
  { value: '90 s', labelKey: 'onboarding.step4.stat1Label' },
  { value: '0 app', labelKey: 'onboarding.step4.stat2Label' },
  { value: '30 j', labelKey: 'onboarding.step4.stat3Label' },
] as const;

function StatsRow() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 mb-[22px]">
      {STATS.map((s) => (
        <div
          key={s.labelKey}
          className="flex-1 bg-white border border-[#e6ebe4] rounded-[11px] px-[14px] py-[10px] text-center"
        >
          <div className="text-[16px] font-bold text-[#1B2D25] tracking-[-0.03em] leading-none mb-1">
            {s.value}
          </div>
          <div className="text-[10px] text-[#9aa49f] font-medium uppercase tracking-[0.05em]">
            {t(s.labelKey)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 4.8 `<CtaButton onClick />`

```tsx
function CtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="mt-auto w-full flex items-center justify-center gap-[9px]
                 px-6 py-[15px] rounded-[13px]
                 bg-[#1B2D25] text-white text-[15px] font-semibold tracking-[-0.02em]
                 border-none cursor-pointer
                 transition-all duration-200 ease-in-out
                 hover:bg-[#356B58] hover:-translate-y-0.5
                 hover:shadow-[0_8px_24px_rgba(53,107,88,0.32)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356B58] focus-visible:ring-offset-2
                 group"
    >
      {t('onboarding.step4.cta')}
      <svg
        width="16" height="16"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        className="transition-transform duration-200 group-hover:translate-x-[3px]"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}
```

---

### 4.9 Card entry animation

Add to `tailwind.config.js`:

```js
// theme.extend.animation
'card-in': 'cardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',

// theme.extend.keyframes
cardIn: {
  from: { opacity: '0', transform: 'translateY(18px) scale(0.98)' },
  to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
},
```

---

## 5. Wiring into the Onboarding Step Router

In `OnboardingPage.tsx` (or equivalent), add Step 4 to the existing step array:

```tsx
// Before:
const STEPS = [Step1Specialty, Step2Account, Step3ClinicDetails];

// After:
const STEPS = [Step1Specialty, Step2Account, Step3ClinicDetails, Step4QrReveal];
```

Pass the required props when rendering Step 4:

```tsx
{currentStep === 4 && (
  <Step4QrReveal
    clinicName={onboardingData.clinicName}
    clinicSlug={onboardingData.clinicSlug}
    qrCodeUrl={`/api/clinic/${onboardingData.clinicId}/qrcode`}
    onComplete={() => navigate('/dashboard')}
  />
)}
```

> **Note:** If the clinic QR URL is returned directly from the step 3 API response, use that value. Do **not** make an extra API call inside `Step4QrReveal` — accept `qrCodeUrl` as a prop and let the parent own the data.

---

## 6. i18n Keys

### French (`fr.json`) — add under existing `onboarding` namespace:

```json
"onboarding": {
  "step4": {
    "badgeTitle":    "Zéro configuration. Zéro installation.",
    "badgeSubtitle": "Votre secrétaire gère la file en quelques clics. Vos patients n'attendent plus dans le couloir.",
    "statusBadge":   "Votre QR code est actif",
    "headingLine1":  "Affichez ce code.",
    "headingLine2":  "C'est tout.",
    "bodyCopy":      "Un simple QR code suffit pour transformer votre salle d'attente. Chaque patient qui scanne rejoint votre file virtuelle et suit sa position sur son téléphone — pendant que vous et votre secrétaire gardez le contrôle depuis le tableau de bord.",
    "qrStatus":      "Actif · 0 patient en attente",
    "qrAlt":         "QR code de votre cabinet",
    "btnDownload":   "Télécharger",
    "btnPrint":      "Imprimer support",
    "stat1Label":    "Pour démarrer",
    "stat2Label":    "Pour le patient",
    "stat3Label":    "Gratuit",
    "cta":           "Ouvrir mon tableau de bord"
  }
}
```

### Arabic (`ar.json`) — add under existing `onboarding` namespace:

```json
"onboarding": {
  "step4": {
    "badgeTitle":    "صفر إعداد. صفر تثبيت.",
    "badgeSubtitle": "تُدير سكرتيرتك قائمة الانتظار بنقرات. مرضاك لن ينتظروا في الممر بعد الآن.",
    "statusBadge":   "رمز QR الخاص بك نشط",
    "headingLine1":  "اعرض هذا الرمز.",
    "headingLine2":  "هذا كل شيء.",
    "bodyCopy":      "رمز QR بسيط يكفي لتحويل غرفة انتظارك. كل مريض يمسح الرمز ينضم إلى الطابور الافتراضي ويتابع موقعه على هاتفه — بينما تحتفظ أنت وسكرتيرتك بالسيطرة الكاملة من لوحة التحكم.",
    "qrStatus":      "نشط · 0 مريض في الانتظار",
    "qrAlt":         "رمز QR الخاص بعيادتك",
    "btnDownload":   "تحميل",
    "btnPrint":      "طباعة الدعم",
    "stat1Label":    "للبدء",
    "stat2Label":    "للمريض",
    "stat3Label":    "مجاني",
    "cta":           "فتح لوحة التحكم"
  }
}
```

---

## 7. RTL Support

All Tailwind classes in this component use native v3.4 RTL variants where directional. Key ones:

| Element | LTR class | RTL variant to add |
|---|---|---|
| `QrBlock` gap direction | `flex-row` (default) | No change — flex-row is neutral |
| `QrActionButton` icons | left of label | `rtl:flex-row-reverse` on the button |
| `CtaButton` arrow | right of text | `rtl:flex-row-reverse` on the button |
| Left panel positioning | `left-[22px] right-[22px]` | Already symmetric — no change needed |
| `StepDots` order | left → right | `rtl:flex-row-reverse` on the dots container |

Add `dir="rtl"` handling via the existing app-level `i18n` language detection — no per-component `dir` attribute needed.

---

## 8. Asset Checklist

| File | Source | Destination |
|---|---|---|
| `qr-reveal_B.png` | Design handoff | `web/public/assets/onboarding/qr-reveal.png` |

The image must be placed at the exact path used in the `<img src>` attribute. It is decorative (`aria-hidden="true"`).

---

## 9. Acceptance Criteria

- [ ] Step 4 renders correctly when `currentStep === 4` in the onboarding flow
- [ ] The left panel illustration fills the full panel height with `object-cover`, no distortion
- [ ] The glass badge overlays the image correctly with backdrop-blur
- [ ] The bottom gradient vignette ensures badge text is legible on the illustration
- [ ] The pulse animation on the status badge dot runs continuously and is not distracting
- [ ] The QR image renders from the real API URL prop (not a placeholder/mock)
- [ ] **Download button** triggers a file download of the QR PNG with a sensible filename
- [ ] **Print button** opens a print-friendly view in a new tab (route `/print-qr` can be a stub for now — just `window.open` with the correct params)
- [ ] Both action buttons show hover state (teal fill, white text, subtle shadow, 1px lift)
- [ ] The CTA arrow animates 3px rightward on button hover
- [ ] Card entry animation (`cardIn`) plays on mount — once, not on re-renders
- [ ] All text is sourced from i18n keys — zero hardcoded French strings in the component
- [ ] Arabic (RTL) layout renders without overlap or clipping
- [ ] `Step4QrReveal` accepts all required props and has no internal API calls
- [ ] No `as any` type casts introduced
- [ ] No new console.log statements

---

## 10. Do Not Touch

- Steps 1, 2, and 3 components — do not modify their props or internal logic
- The existing `StepDots` component if one already exists — reuse it, don't create a duplicate
- `tailwind.config.js` `theme.extend` entries that are already present — append only, do not replace
- `fr.json` and `ar.json` root structure — add only the `step4` block inside the existing `onboarding` key
- The `/dashboard` route — this spec only adds a `navigate('/dashboard')` call, not a new route
