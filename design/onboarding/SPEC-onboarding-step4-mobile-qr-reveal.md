# Spec: Onboarding Flow — Step 4 (QR Reveal) · Mobile

**Companion spec:** See `SPEC-onboarding-step4-qr-reveal.md` for the desktop implementation.
**Target file:** The mobile onboarding component — wherever steps 1–3 are rendered on mobile (e.g. `web/src/pages/OnboardingPage.tsx` behind a responsive branch, or a dedicated `web/src/components/onboarding/mobile/Step4QrReveal.tsx`).
**Scope:** Add `MobileStep4QrReveal`, wire it into the existing mobile step router, connect to real clinic/QR data, add WhatsApp share action, and add all required i18n keys (shared namespace with the desktop spec).

---

## 0. Context & Prerequisites

- The mobile onboarding flow (screens 1–3) uses a **full-viewport, scrollable layout** with:
  - A top illustration panel (~310px tall, `background: #b8dece`)
  - A white content card with `border-radius: 28px 28px 0 0` that overlaps the illustration by 28px (`margin-top: -28px`)
  - A speech-bubble-style floating toast badge positioned `top: 38px, right: 18px` over the illustration
  - A drag handle at the top of the white card
  - A full-width dark CTA button pinned at the bottom
- This layout must be **preserved exactly** in Step 4 for visual continuity.
- By the time Step 4 renders, the following data is available from step 3:
  - `clinic.id`
  - `clinic.name` (e.g. `"Cabinet Dr. Skander Kamo"`)
  - `clinic.slug` (e.g. `"dr-skander-kamo"`)
  - `clinic.qrCodeUrl` — PNG served by the API at `/api/clinic/:id/qrcode`
- This screen is the **final step** of the onboarding wizard. The primary CTA navigates to `/dashboard`.
- The mobile version shares the **same i18n keys** as the desktop version (namespace `onboarding.step4`) with two exceptions: `btnWhatsapp` replaces `btnPrint` (see section 6).

---

## 1. Visual Design Reference

```
┌─────────────────────────────┐
│  ░░░░░░ [notch] ░░░░░░░░░░ │  ← status bar space
│                             │
│   [Illustration — 310px]    │
│                   ┌───────┐ │
│                   │Inscrit│ │  ← floating toast, top-right
│                   │  ! ✓  │ │
│                   └───────┘ │
│                    ↑        │
│      ─── fade to white ─── │  ← 80px gradient overlay
│ ╭───────────────────────╮   │
│ │   ▬▬  (drag handle)   │   │  ← white card starts here
│ │                        │  │
│ │ 🟢 VOTRE QR CODE...    │  │  ← status badge
│ │                        │  │
│ │ Affichez ce code.      │  │  ← heading
│ │ C'est tout.            │  │
│ │                        │  │
│ │ [body copy — 3 lines]  │  │
│ │                        │  │
│ │ ┌──────────────────┐   │  │  ← QR block (sage bg)
│ │ │[QR] [meta + btns]│   │  │
│ │ └──────────────────┘   │  │
│ │                        │  │
│ │  [90s] [0app] [30j]    │  │  ← stats row
│ │                        │  │
│ │ [ Ouvrir tableau → ]   │  │  ← CTA button
│ ╰───────────────────────╯   │
└─────────────────────────────┘
```

---

## 2. Component to Create

### File path
```
web/src/components/onboarding/mobile/MobileStep4QrReveal.tsx
```

### Props interface
```typescript
interface MobileStep4QrRevealProps {
  clinicName: string;     // "Cabinet Dr. Skander Kamo"
  clinicSlug: string;     // "dr-skander-kamo"
  qrCodeUrl: string;      // URL of generated QR PNG from API
  onComplete: () => void; // navigates to /dashboard
}
```

---

## 3. Full Component Structure

```tsx
export default function MobileStep4QrReveal({
  clinicName,
  clinicSlug,
  qrCodeUrl,
  onComplete,
}: MobileStep4QrRevealProps) {
  const { t } = useTranslation();
  const publicUrl = `blesaf.tn/q/${clinicSlug}`;

  return (
    <div className="relative flex flex-col w-full min-h-screen bg-white animate-screen-in">

      {/* ── Illustration panel ── */}
      <IllusPanel qrCodeUrl={qrCodeUrl} />

      {/* ── White content card ── */}
      <div className="relative z-[5] flex-1 flex flex-col
                      bg-white rounded-t-[28px] -mt-7
                      px-[22px] pt-[22px] pb-[28px]">
        <DragHandle />
        <StatusBadge />
        <Heading />
        <BodyCopy />
        <QrBlock
          qrCodeUrl={qrCodeUrl}
          clinicName={clinicName}
          publicUrl={publicUrl}
        />
        <StatsRow />
        <CtaButton onClick={onComplete} />
      </div>

    </div>
  );
}
```

All sub-components live **in the same file**.

---

## 4. Sub-component Specifications

### 4.1 `<IllusPanel qrCodeUrl />`

The illustration panel is purely decorative and houses two overlaid elements: the image, a bottom fade gradient, and the floating "Inscrit !" toast.

```tsx
function IllusPanel({ qrCodeUrl }: { qrCodeUrl: string }) {
  return (
    <div className="relative w-full h-[310px] flex-shrink-0 overflow-hidden bg-[#b8dece]">

      {/* Illustration image */}
      <img
        src="/assets/onboarding/qr-reveal.png"
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover object-[center_15%] block"
      />

      {/* Bottom gradient fade into the white card */}
      <div className="absolute bottom-0 left-0 right-0 h-[80px]
                      bg-gradient-to-b from-transparent to-white
                      pointer-events-none" />

      {/* "Inscrit !" floating toast */}
      <InscritToast />
    </div>
  );
}
```

**Note on `object-position: center 15%`:** This crops the image so the illustrated characters' faces are visible, not their feet. Do not change this value.

---

### 4.2 `<InscritToast />`

Mirrors the speech-bubble pattern used in screens 1–3 ("Salam !", "Bonjour !", "C'est parti !").

```tsx
function InscritToast() {
  const { t } = useTranslation();
  return (
    <div className="absolute top-[38px] right-[18px] z-10
                    flex items-center gap-[6px]
                    bg-[#111] text-white
                    text-[13px] font-bold tracking-[-0.01em]
                    px-[13px] py-[7px] rounded-[10px]
                    shadow-[0_4px_14px_rgba(0,0,0,0.22)]
                    animate-toast-pop">
      {/* Teal check circle */}
      <span className="w-[17px] h-[17px] flex-shrink-0
                       bg-[#356B58] rounded-full
                       flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {t('onboarding.step4.inscritToast')}
    </div>
  );
}
```

Add to `tailwind.config.js`:

```js
// theme.extend.animation
'toast-pop':  'toastPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
'screen-in':  'screenIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',

// theme.extend.keyframes
toastPop: {
  from: { opacity: '0', transform: 'scale(0.7) translateY(-6px)' },
  to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
},
screenIn: {
  from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
  to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
},
```

> If `toast-pop` and `screen-in` already exist from screens 1–3, do not redefine them — reuse.

---

### 4.3 `<DragHandle />`

```tsx
function DragHandle() {
  return (
    <div className="w-9 h-1 rounded-full bg-[#dde0da] mx-auto mb-[18px]" />
  );
}
```

---

### 4.4 `<StatusBadge />`

```tsx
function StatusBadge() {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-[6px]
                    text-[10.5px] font-bold tracking-[0.09em] uppercase
                    text-[#356B58] mb-[10px]">
      <span className="w-[7px] h-[7px] rounded-full bg-[#356B58]
                       flex-shrink-0 animate-pulse-dot" />
      {t('onboarding.step4.statusBadge')}
    </div>
  );
}
```

Add to `tailwind.config.js` if not already present from the desktop spec:

```js
// theme.extend.animation
'pulse-dot': 'pulseDot 1.9s ease infinite',

// theme.extend.keyframes
pulseDot: {
  '0%, 100%': {
    opacity: '1',
    transform: 'scale(1)',
    boxShadow: '0 0 0 0 rgba(53,107,88,0.4)',
  },
  '50%': {
    opacity: '0.6',
    transform: 'scale(1.3)',
    boxShadow: '0 0 0 5px rgba(53,107,88,0)',
  },
},
```

---

### 4.5 `<Heading />`

```tsx
function Heading() {
  const { t } = useTranslation();
  return (
    <h1 className="text-[24px] font-bold leading-[1.18]
                   text-[#1B2D25] tracking-[-0.035em] mb-2">
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

### 4.6 `<BodyCopy />`

Mobile body copy is slightly shorter than desktop to respect narrow screens.

```tsx
function BodyCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-[13px] text-[#5c6960] leading-[1.6] mb-4">
      {t('onboarding.step4.bodyCopyMobile')}
    </p>
  );
}
```

> This uses `bodyCopyMobile` — a separate, shorter key from the desktop `bodyCopy`. See section 6.

---

### 4.7 `<QrBlock />`

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

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `${t('onboarding.step4.whatsappMessage')} ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="flex items-center gap-[14px]
                    bg-[#EAECE6] border border-[#356B58]/[0.13]
                    rounded-[14px] px-4 py-[14px] mb-3">

      {/* QR image frame */}
      <div className="w-[70px] h-[70px] flex-shrink-0
                      bg-white rounded-[9px] border border-black/[0.07]
                      flex items-center justify-center overflow-hidden">
        <img
          src={qrCodeUrl}
          alt={t('onboarding.step4.qrAlt')}
          className="w-[58px] h-[58px] object-contain"
        />
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">

        {/* Active pill */}
        <div className="inline-flex items-center gap-1
                        bg-[#356B58]/[0.11] text-[#356B58]
                        text-[10px] font-bold tracking-[0.04em]
                        rounded-full px-2 py-[2px] mb-1">
          <span className="w-[7px] h-[7px] rounded-full bg-[#356B58]" />
          {t('onboarding.step4.qrStatusMobile')}
        </div>

        {/* Clinic name */}
        <p className="text-[12.5px] font-semibold text-[#1B2D25] mb-[1px] truncate">
          {clinicName}
        </p>

        {/* Public URL */}
        <p className="text-[11px] text-[#9aa49f] mb-2">
          {publicUrl}
        </p>

        {/* Action buttons */}
        <div className="flex gap-[5px] flex-wrap">
          <QrActionButton
            icon="download"
            label={t('onboarding.step4.btnDownload')}
            onClick={handleDownload}
          />
          <QrActionButton
            icon="whatsapp"
            label={t('onboarding.step4.btnWhatsapp')}
            onClick={handleWhatsApp}
          />
        </div>
      </div>
    </div>
  );
}
```

#### `<QrActionButton />` (inline helper)

Mobile uses `:active` feedback instead of `:hover`.

```tsx
function QrActionButton({
  icon,
  label,
  onClick,
}: {
  icon: 'download' | 'whatsapp';
  label: string;
  onClick: () => void;
}) {
  const icons = {
    download: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    whatsapp: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1
                 text-[11px] font-medium whitespace-nowrap
                 px-[10px] py-1 rounded-[7px]
                 border border-[#356B58]/[0.20] bg-white text-[#356B58]
                 transition-all duration-150 ease-in-out
                 active:bg-[#356B58] active:text-white active:border-[#356B58]
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[#356B58] focus-visible:ring-offset-1
                 select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {icons[icon]}
      {label}
    </button>
  );
}
```

---

### 4.8 `<StatsRow />`

```tsx
const STATS = [
  { value: '90 s',  labelKey: 'onboarding.step4.stat1Label' },
  { value: '0 app', labelKey: 'onboarding.step4.stat2Label' },
  { value: '30 j',  labelKey: 'onboarding.step4.stat3Label' },
] as const;

function StatsRow() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-[7px] mb-[18px]">
      {STATS.map((s) => (
        <div
          key={s.labelKey}
          className="flex-1 bg-white border border-[#e6ebe4]
                     rounded-[10px] px-[10px] py-[9px] text-center"
        >
          <div className="text-[15px] font-bold text-[#1B2D25]
                          tracking-[-0.03em] leading-none mb-[3px]">
            {s.value}
          </div>
          <div className="text-[9px] text-[#9aa49f] font-medium
                          uppercase tracking-[0.05em]">
            {t(s.labelKey)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 4.9 `<CtaButton />`

```tsx
function CtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="mt-auto w-full flex items-center justify-center gap-2
                 px-5 py-[15px] rounded-[13px]
                 bg-[#1B2D25] text-white
                 text-[15px] font-semibold tracking-[-0.02em]
                 border-none cursor-pointer
                 transition-all duration-[180ms] ease-in-out
                 active:bg-[#356B58] active:scale-[0.98]
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[#356B58] focus-visible:ring-offset-2
                 select-none group"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {t('onboarding.step4.cta')}
      <svg
        width="15" height="15"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        className="transition-transform duration-[180ms] group-active:translate-x-[3px]"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}
```

---

## 5. Wiring into the Mobile Step Router

In the mobile onboarding page, add Step 4:

```tsx
// Before:
const MOBILE_STEPS = [MobileStep1, MobileStep2, MobileStep3];

// After:
const MOBILE_STEPS = [MobileStep1, MobileStep2, MobileStep3, MobileStep4QrReveal];
```

Render with props:

```tsx
{currentStep === 4 && (
  <MobileStep4QrReveal
    clinicName={onboardingData.clinicName}
    clinicSlug={onboardingData.clinicSlug}
    qrCodeUrl={`/api/clinic/${onboardingData.clinicId}/qrcode`}
    onComplete={() => navigate('/dashboard')}
  />
)}
```

**If the onboarding page uses a single responsive component** (not separate desktop/mobile files), render the correct variant based on a breakpoint check:

```tsx
const isMobile = useMediaQuery('(max-width: 767px)');

{currentStep === 4 && (
  isMobile
    ? <MobileStep4QrReveal {...props} />
    : <Step4QrReveal {...props} />
)}
```

---

## 6. i18n Keys

The mobile screen shares most keys with the desktop. Only **add** the keys that are mobile-specific or new. Do **not** duplicate existing keys.

### Keys to add to `fr.json` (inside existing `onboarding.step4` block):

```json
"onboarding": {
  "step4": {
    "inscritToast":    "Inscrit !",
    "bodyCopyMobile":  "Un QR code suffit pour transformer votre salle d'attente. Chaque patient qui scanne rejoint la file et suit sa position sur son téléphone — vous gardez le contrôle depuis le tableau de bord.",
    "qrStatusMobile":  "Actif · 0 patient",
    "btnWhatsapp":     "WhatsApp",
    "whatsappMessage": "Rejoignez la file d'attente de mon cabinet ici :"
  }
}
```

### Keys to add to `ar.json` (inside existing `onboarding.step4` block):

```json
"onboarding": {
  "step4": {
    "inscritToast":    "!مسجّل",
    "bodyCopyMobile":  "رمز QR واحد يكفي لتحويل غرفة انتظارك. كل مريض يمسح الرمز ينضم إلى الطابور ويتابع موقعه على هاتفه — وأنت تحتفظ بالسيطرة من لوحة التحكم.",
    "qrStatusMobile":  "نشط · 0 مريض",
    "btnWhatsapp":     "واتساب",
    "whatsappMessage": "انضم إلى طابور الانتظار في عيادتي هنا:"
  }
}
```

### Shared keys (already defined in desktop spec — do NOT redefine):
`statusBadge`, `headingLine1`, `headingLine2`, `qrAlt`, `btnDownload`, `stat1Label`, `stat2Label`, `stat3Label`, `cta`

---

## 7. RTL Support

Mobile RTL considerations are the same as desktop but with touch-specific additions:

| Element | LTR | RTL addition |
|---|---|---|
| `InscritToast` position | `right-[18px]` | `rtl:right-auto rtl:left-[18px]` |
| `QrActionButton` row | `flex-row` | `rtl:flex-row-reverse` on each button |
| `CtaButton` arrow | right of text | `rtl:flex-row-reverse` on the button |
| `DragHandle` | centered | no change — `mx-auto` is neutral |
| `StatsRow` order | left → right | `rtl:flex-row-reverse` |
| `QrBlock` image | left side | no change — flex handles it |

`dir="rtl"` is applied at the app level via the existing i18n language detection.

---

## 8. Touch UX Requirements

These are mobile-specific and have no desktop equivalent:

| Requirement | Implementation |
|---|---|
| No blue highlight on tap | `style={{ WebkitTapHighlightColor: 'transparent' }}` on all interactive elements |
| Minimum tap target size | All buttons must be at least **44×44px** — verify `QrActionButton` padding achieves this on small screens |
| `:active` feedback only | Use `active:` Tailwind variants — no `hover:` states on touch elements |
| Prevent text selection on CTA | `select-none` on `CtaButton` and `QrActionButton` |
| WhatsApp deep link | `https://wa.me/?text=...` — opens the WhatsApp app natively on mobile |
| No scroll jank on illustration | `overflow: hidden` on `IllusPanel` prevents rubber-band scroll artifacts on iOS |

---

## 9. Asset Checklist

| File | Source | Destination |
|---|---|---|
| `qr-reveal_B.png` | Design handoff | `web/public/assets/onboarding/qr-reveal.png` |

This is the **same asset** as the desktop spec. If it was already placed during desktop implementation, no action needed.

---

## 10. Differences from Desktop Spec — Quick Reference

| Property | Desktop (`Step4QrReveal`) | Mobile (`MobileStep4QrReveal`) |
|---|---|---|
| Layout | Two-column card | Single-column, full-viewport |
| Illustration | Left panel, 44% width, `object-center` | Top panel, full width, 310px, `object-[center_15%]` |
| Left panel badge | Glass overlay with subtitle | **Not present** — replaced by `InscritToast` float |
| Step dots | Shown in right panel | **Not present** — mobile uses no step dots |
| Body copy | Long (5 lines) | Short (3 lines) — key `bodyCopyMobile` |
| QR action 2 | "Imprimer support" (`btnPrint`) | "WhatsApp" (`btnWhatsapp`) |
| Button feedback | `hover:` states | `active:` states only |
| Tap highlight | N/A | `WebkitTapHighlightColor: transparent` |
| Card entry animation | `animate-card-in` (translateY + scale) | `animate-screen-in` (same values, different name) |
| Toast animation | Not present | `animate-toast-pop` (spring, 0.3s delay) |
| Heading size | `text-[30px]` | `text-[24px]` |
| QR frame size | `78×78px` | `70×70px` |
| QR image size | `66×66px` | `58×58px` |
| Stats gap | `gap-2` | `gap-[7px]` |

---

## 11. Acceptance Criteria

- [ ] Step 4 renders on mobile when `currentStep === 4` and screen width is ≤ 767px
- [ ] The illustration fills the full 310px panel height with `object-cover` and `object-[center_15%]` — characters' faces are visible
- [ ] The white card overlaps the illustration by 28px (`-mt-7`) with `rounded-t-[28px]`
- [ ] The 80px white gradient fade at the bottom of the illustration smoothly blends into the card
- [ ] The `InscritToast` animates in with a spring pop (`animate-toast-pop`) at `0.3s delay` after mount
- [ ] The pulse dot animation on the status badge runs continuously and is not distracting
- [ ] The QR image renders from the real API URL prop — no placeholder
- [ ] **Download button** triggers a native file download
- [ ] **WhatsApp button** opens `https://wa.me/?text=...` with the encoded clinic URL in a new tab/app
- [ ] Both action buttons have a visible `:active` state (teal fill, white text)
- [ ] All interactive elements have `WebkitTapHighlightColor: transparent`
- [ ] All tap targets are at least 44px tall (verify on 375px viewport)
- [ ] The CTA arrow translates 3px on `:active`
- [ ] Screen entry animation (`animate-screen-in`) plays once on mount
- [ ] All text is sourced from i18n keys — zero hardcoded French strings
- [ ] Arabic (RTL) layout renders without overlap or clipping at 375px width
- [ ] `MobileStep4QrReveal` accepts all required props with no internal API calls
- [ ] No `as any` type casts introduced
- [ ] No new `console.log` statements

---

## 12. Do Not Touch

- Screens 1, 2, and 3 of the mobile onboarding flow — do not modify
- Any existing `animate-toast-pop` or `animate-screen-in` keyframe definitions — reuse, do not overwrite
- The desktop `Step4QrReveal` component — the two components are siblings, not replacements
- `fr.json` / `ar.json` keys already written for the desktop spec — append only
- The `/dashboard` route definition
