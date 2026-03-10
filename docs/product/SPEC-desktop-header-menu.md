# SPEC: Desktop Header Command Bar with Dropdown Menu
**Target:** BleSaf / DoctorQ — Desktop Dashboard View  
**Pattern:** Concept A — Persistent top bar + on-demand dropdown panel  
**Replaces:** Mobile hamburger drawer (`MobileMenuDrawer` or equivalent)  
**Breakpoint:** Applies at `lg:` (1024px) and above only. Mobile drawer remains unchanged below `lg:`.

---

## 1. Overview & Design Rationale

The desktop menu replaces the mobile hamburger drawer with a **persistent top bar** anchored to the top of the dashboard layout. A single "Paramètres" button in the top-right of the bar opens a compact **dropdown panel** that contains all the same sections as the mobile drawer — QR code actions, live controls (language, doctor presence, queue status), and account links — without requiring any scrolling.

### Key Constraints
- **The dropdown panel must be fully visible without scrolling.** All sections must fit within the visible viewport height at all times. Do not use `overflow-y: auto` or `overflow-y: scroll` on the panel itself.
- **QR code action buttons** are rendered in a compact horizontal row. They are short vertically — icon + label displayed side-by-side (inline), not stacked. Target height: ~36px per button.
- The top bar is **`position: sticky; top: 0; z-index: 50`** so it remains visible when the queue list scrolls.
- The dropdown closes on: outside click, `Escape` key, or navigating to a new route.
- The dropdown is **desktop-only** (`hidden lg:block` wrapper or conditional render based on `useBreakpoint`).

---

## 2. Component Architecture

```
DesktopTopBar/
├── index.tsx                  ← Main component (exported)
├── DesktopTopBar.tsx          ← Top bar shell + trigger button
├── SettingsDropdown.tsx       ← The dropdown panel
├── sections/
│   ├── DropdownHeader.tsx     ← Clinic name + status row
│   ├── QrCodeSection.tsx      ← QR code action row
│   ├── ControlsSection.tsx    ← Language / Doctor / Queue toggles
│   └── AccountSection.tsx     ← Settings links + logout
└── hooks/
    └── useDropdown.ts         ← Open/close state + outside-click logic
```

Place under: `web/src/components/DesktopTopBar/`

---

## 3. TypeScript Interfaces

```typescript
// web/src/components/DesktopTopBar/types.ts

export interface DesktopTopBarProps {
  /** Clinic display name, e.g. "Cabinet Dr Skander Kamoun" */
  clinicName: string;
  /** Whether the doctor is currently marked as present */
  isDoctorPresent: boolean;
  /** Whether the queue is currently open for new check-ins */
  isQueueOpen: boolean;
  /** Current UI language */
  currentLang: 'fr' | 'ar';
  /** Number of patients currently waiting */
  waitingCount: number;
  /** Trial status for badge display */
  subscriptionStatus: 'trial' | 'active' | 'expired';
  /** Days remaining if on trial */
  trialDaysRemaining?: number;
  // Callbacks
  onToggleDoctorPresence: () => void;
  onToggleQueue: () => void;
  onToggleLanguage: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSubscription: () => void;
  onNavigateToSupport: () => void;
  onLogout: () => void;
  onQrDisplay: () => void;
  onQrCopy: () => void;
  onQrWhatsApp: () => void;
}

export interface DropdownState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  panelRef: React.RefObject<HTMLDivElement>;
}
```

---

## 4. `useDropdown` Hook

```typescript
// web/src/components/DesktopTopBar/hooks/useDropdown.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import type { DropdownState } from '../types';

export function useDropdown(): DropdownState {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const open  = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return { isOpen, open, close, toggle, triggerRef, panelRef };
}
```

---

## 5. Top Bar Layout

### 5.1 Shell & Positioning

```tsx
// DesktopTopBar.tsx

<header
  className="
    hidden lg:flex
    sticky top-0 z-50
    h-[60px] items-center
    px-6 gap-4
    bg-[#1B2D25]
  "
>
  {/* LEFT — Logo */}
  <Logo />

  {/* CENTER-LEFT — Clinic name chip */}
  <ClinicNameChip clinicName={clinicName} />

  {/* CENTER — Doctor presence status pill */}
  <DoctorStatusPill isDoctorPresent={isDoctorPresent} waitingCount={waitingCount} />

  {/* RIGHT GROUP */}
  <div className="ml-auto flex items-center gap-2">
    <LanguageToggle currentLang={currentLang} onToggle={onToggleLanguage} />
    <HelpIconButton onNavigateToSupport={onNavigateToSupport} />
    {/* Trigger Button */}
    <SettingsTriggerButton
      ref={triggerRef}
      isOpen={isOpen}
      onClick={toggle}
    />
  </div>

  {/* DROPDOWN PANEL — rendered in portal or absolutely positioned */}
  {isOpen && (
    <SettingsDropdown
      ref={panelRef}
      /* ...all props */
    />
  )}
</header>
```

### 5.2 Top Bar Sub-Components

#### Logo
```tsx
<span className="text-white font-bold text-[17px] tracking-tight shrink-0">
  Ble<span className="text-[#7BC4A8]">Saf</span>
</span>
```

#### Clinic Name Chip
```tsx
<div className="
  text-white/85 text-[13.5px] font-medium
  px-3 py-1.5 rounded-lg
  bg-white/[0.08] border border-white/[0.12]
  truncate max-w-[220px]
">
  {clinicName}
</div>
```

#### Doctor Status Pill
```tsx
<div className="
  flex items-center gap-1.5
  text-[#7BC4A8] text-[12.5px] font-medium
  px-2.5 py-1 rounded-full
  bg-[#7BC4A8]/10 border border-[#7BC4A8]/20
">
  {/* Animated dot */}
  <span className="
    w-[7px] h-[7px] rounded-full bg-[#7BC4A8]
    animate-pulse
  " />
  {isDoctorPresent ? 'Présent' : 'Absent'} · {waitingCount} patients
</div>
```

#### Language Toggle
```tsx
<div className="
  flex overflow-hidden rounded-lg
  bg-white/[0.08] border border-white/[0.12]
  text-[12px] font-semibold
">
  {(['fr', 'ar'] as const).map(lang => (
    <button
      key={lang}
      onClick={onToggleLanguage}
      className={cn(
        'px-2.5 py-1.5 transition-colors',
        currentLang === lang
          ? 'bg-white/[0.15] text-white'
          : 'text-white/50 hover:text-white/80'
      )}
    >
      {lang.toUpperCase()}
    </button>
  ))}
</div>
```

#### Help Icon Button
```tsx
<button
  onClick={onNavigateToSupport}
  aria-label="Aide et support"
  className="
    w-9 h-9 flex items-center justify-center rounded-lg
    bg-white/[0.08] border border-white/[0.12]
    text-white/75 hover:text-white hover:bg-white/[0.15]
    transition-colors
  "
>
  <span className="material-symbols-outlined text-[18px]">help_outline</span>
</button>
```

#### Settings Trigger Button
```tsx
<button
  ref={ref}
  onClick={onClick}
  aria-haspopup="true"
  aria-expanded={isOpen}
  aria-controls="settings-dropdown-panel"
  className="
    flex items-center gap-2 px-3.5 py-1.5 rounded-lg
    bg-white/[0.10] border border-white/[0.15]
    text-white text-[13px] font-medium
    hover:bg-white/[0.18] transition-colors
  "
>
  <span className="material-symbols-outlined text-[18px]">tune</span>
  Paramètres
  <span className="material-symbols-outlined text-[15px] opacity-60 transition-transform duration-200"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    expand_more
  </span>
</button>
```

---

## 6. Settings Dropdown Panel

### 6.1 Panel Shell

The panel must be **absolutely positioned** below the trigger button, anchored to the right edge of the top bar. It must be fully visible without scrolling.

```tsx
// SettingsDropdown.tsx

<div
  ref={ref}
  id="settings-dropdown-panel"
  role="dialog"
  aria-label="Paramètres du cabinet"
  className="
    absolute top-[calc(100%+8px)] right-6
    w-[320px]
    bg-white rounded-2xl
    border border-[#D4DDD8]
    shadow-[0_20px_60px_rgba(27,45,37,0.22)]
    overflow-hidden
    z-[200]
    animate-dropdown-in
  "
>
  <DropdownHeader ... />
  <QrCodeSection ... />        {/* border-b border-[#E8EDE9] */}
  <ControlsSection ... />      {/* border-b border-[#E8EDE9] */}
  <AccountSection ... />
</div>
```

#### Entry Animation (add to Tailwind config or global CSS)
```css
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-dropdown-in {
  animation: dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

Or in `tailwind.config.ts`:
```ts
extend: {
  keyframes: {
    'dropdown-in': {
      from: { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
      to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
    },
  },
  animation: {
    'dropdown-in': 'dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
}
```

---

### 6.2 Dropdown Header Section

Dark forest background. Clinic identity + current status at a glance.

```tsx
// sections/DropdownHeader.tsx

<div className="px-[18px] py-4 bg-[#1B2D25] flex items-center gap-3">

  {/* Avatar / Icon */}
  <div className="
    w-[38px] h-[38px] rounded-[10px] shrink-0
    bg-[#7BC4A8]/20 flex items-center justify-center
    text-[#7BC4A8]
  ">
    <span className="material-symbols-outlined text-[20px]">medical_services</span>
  </div>

  {/* Clinic info */}
  <div className="flex-1 min-w-0">
    <div className="text-white font-semibold text-[13.5px] truncate">
      {clinicName}
    </div>
    <div className="text-white/50 text-[12px] mt-0.5">
      {subscriptionStatus === 'trial'
        ? `Essai gratuit · ${trialDaysRemaining} jours restants`
        : 'Abonnement actif'}
    </div>
  </div>

  {/* Live doctor status */}
  <div className="flex items-center gap-1.5 text-[#7BC4A8] text-[11.5px] font-medium shrink-0">
    <span className="w-[6px] h-[6px] rounded-full bg-[#7BC4A8]" />
    {isDoctorPresent ? 'Présent' : 'Absent'}
  </div>

</div>
```

---

### 6.3 QR Code Section

**Critical constraint: buttons are compact horizontally laid-out rows, NOT vertical stacks. Target height for the entire section: ≤ 68px including the section label.**

```tsx
// sections/QrCodeSection.tsx

<div className="px-[14px] py-2.5 border-b border-[#E8EDE9]">

  {/* Section label */}
  <p className="
    text-[10px] font-bold uppercase tracking-[0.08em]
    text-[#8A9A92] mb-2 px-1
  ">
    Code QR
  </p>

  {/* Compact action row — 3 equal-width buttons, inline icon+label */}
  <div className="flex gap-1.5">

    {/* Button template — repeat for Copier and WhatsApp */}
    <button
      onClick={onQrDisplay}
      className="
        flex-1 flex items-center justify-center gap-1.5
        h-9                          /* fixed height: 36px */
        px-2 rounded-lg
        bg-[#EAECE6] border border-[#E8EDE9]
        hover:bg-[#E8F2EE] hover:border-[#C5DDD5]
        transition-colors text-[#4A5A52]
      "
    >
      <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">
        qr_code_2
      </span>
      <span className="text-[12px] font-medium">Afficher</span>
    </button>

    <button
      onClick={onQrCopy}
      className="
        flex-1 flex items-center justify-center gap-1.5
        h-9 px-2 rounded-lg
        bg-[#EAECE6] border border-[#E8EDE9]
        hover:bg-[#E8F2EE] hover:border-[#C5DDD5]
        transition-colors text-[#4A5A52]
      "
    >
      <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">
        content_copy
      </span>
      <span className="text-[12px] font-medium">Copier</span>
    </button>

    <button
      onClick={onQrWhatsApp}
      className="
        flex-1 flex items-center justify-center gap-1.5
        h-9 px-2 rounded-lg
        bg-[#EAECE6] border border-[#E8EDE9]
        hover:bg-[#E8F2EE] hover:border-[#C5DDD5]
        transition-colors text-[#4A5A52]
      "
    >
      <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">
        chat
      </span>
      <span className="text-[12px] font-medium">WhatsApp</span>
    </button>

  </div>
</div>
```

> **Do not use `flex-col` or `flex-direction: column` on the QR buttons.** The icon and label must sit side-by-side on the same line. The button's `h-9` (36px) is a fixed constraint — do not increase it.

---

### 6.4 Controls Section (Live Toggles)

Three toggle rows: Language, Doctor presence, Queue open/closed. Each row is a single horizontal flex line.

```tsx
// sections/ControlsSection.tsx

<div className="py-2 border-b border-[#E8EDE9]">

  <p className="
    text-[10px] font-bold uppercase tracking-[0.08em]
    text-[#8A9A92] px-[18px] pt-1 pb-2
  ">
    Contrôles
  </p>

  {/* LANGUAGE TOGGLE ROW */}
  <ToggleRow
    icon="translate"
    label="Langue"
    valueLabel={currentLang.toUpperCase()}
    onRowClick={onToggleLanguage}
  >
    {/* Custom language toggle — not a standard switch */}
    <div className="
      flex overflow-hidden rounded-md
      border border-[#E8EDE9] text-[10.5px] font-bold
    ">
      <span className={cn(
        'px-2 py-1 transition-colors',
        currentLang === 'fr' ? 'bg-[#356B58] text-white' : 'text-[#8A9A92]'
      )}>FR</span>
      <span className={cn(
        'px-2 py-1 transition-colors',
        currentLang === 'ar' ? 'bg-[#356B58] text-white' : 'text-[#8A9A92]'
      )}>AR</span>
    </div>
  </ToggleRow>

  {/* DOCTOR PRESENCE ROW */}
  <ToggleRow
    icon="stethoscope"
    label="Médecin"
    valueLabel={isDoctorPresent ? 'Présent' : 'Absent'}
    onRowClick={onToggleDoctorPresence}
  >
    <ToggleSwitch checked={isDoctorPresent} onChange={onToggleDoctorPresence} />
  </ToggleRow>

  {/* QUEUE OPEN/CLOSED ROW */}
  <ToggleRow
    icon="queue"
    label="File d'attente"
    valueLabel={isQueueOpen ? 'Ouverte' : 'Fermée'}
    onRowClick={onToggleQueue}
  >
    <ToggleSwitch checked={isQueueOpen} onChange={onToggleQueue} />
  </ToggleRow>

</div>
```

#### `ToggleRow` Sub-component
```tsx
function ToggleRow({
  icon, label, valueLabel, onRowClick, children
}: {
  icon: string;
  label: string;
  valueLabel: string;
  onRowClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onRowClick}
      className="
        flex items-center gap-3
        px-[14px] py-[9px] mx-1 rounded
        hover:bg-[#EAECE6] cursor-pointer
        transition-colors
      "
    >
      {/* Icon container */}
      <div className="
        w-8 h-8 rounded-lg shrink-0
        bg-[#E8F2EE] flex items-center justify-center
        text-[#356B58]
      ">
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
      </div>

      {/* Label */}
      <span className="flex-1 text-[13.5px] font-medium text-[#1B2D25]">
        {label}
      </span>

      {/* Current value label */}
      <span className="text-[12px] font-semibold text-[#356B58] mr-2">
        {valueLabel}
      </span>

      {/* Toggle control (Switch or custom) */}
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

#### `ToggleSwitch` Sub-component
```tsx
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0',
        checked ? 'bg-[#356B58]' : 'bg-[#D4DDD8]'
      )}
    >
      <span className={cn(
        'absolute top-[3px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
      )} />
    </button>
  );
}
```

---

### 6.5 Account Section

Navigation links to Settings sub-pages and Logout. No section divider below this (it's the last section).

```tsx
// sections/AccountSection.tsx

<div className="py-2">

  <p className="
    text-[10px] font-bold uppercase tracking-[0.08em]
    text-[#8A9A92] px-[18px] pt-1 pb-2
  ">
    Compte
  </p>

  <AccountNavItem
    icon="settings"
    label="Paramètres"
    onClick={() => { onNavigateToSettings(); onClose(); }}
  />
  <AccountNavItem
    icon="help_outline"
    label="Aide & support"
    onClick={() => { onNavigateToSupport(); onClose(); }}
  />
  <AccountNavItem
    icon="logout"
    label="Déconnexion"
    onClick={onLogout}
    variant="danger"
  />

</div>
```

#### `AccountNavItem` Sub-component
```tsx
function AccountNavItem({
  icon, label, onClick, variant = 'default'
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-[14px] py-[10px] mx-1 rounded',
        'transition-colors text-left',
        variant === 'danger'
          ? 'hover:bg-red-50 text-red-600'
          : 'hover:bg-[#EAECE6] text-[#1B2D25]'
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <span className={cn(
        'material-symbols-outlined text-[20px]',
        variant === 'danger' ? 'text-red-500' : 'text-[#8A9A92]'
      )}>
        {icon}
      </span>
      <span className="flex-1 text-[13.5px] font-medium">{label}</span>
      {variant !== 'danger' && (
        <span className="material-symbols-outlined text-[16px] text-[#D4DDD8]">
          chevron_right
        </span>
      )}
    </button>
  );
}
```

---

## 7. Full Dropdown Panel Height Budget

The panel must fit within the visible viewport with no internal scrolling. The calculated total height is **≤ 380px** at default font sizes:

| Section | Height |
|---|---|
| `DropdownHeader` | ~70px |
| Section divider | 1px |
| `QrCodeSection` (label + row) | ~68px |
| Section divider | 1px |
| `ControlsSection` (label + 3 rows) | ~134px |
| Section divider | 1px |
| `AccountSection` (label + 3 items) | ~107px |
| **Total** | **~382px** |

If the viewport is shorter than 480px tall (rare on desktop), fall back to `max-h-[80vh] overflow-y-auto` — but this should be treated as an edge case, not the default.

---

## 8. Integration with Existing Layout

### 8.1 Where to Render

The `DesktopTopBar` replaces the existing top area of the desktop layout. It should be rendered **above** (outside) the main scrollable content area.

In your root layout or dashboard layout:

```tsx
// layouts/DashboardLayout.tsx (or equivalent)

<div className="flex flex-col h-screen">
  {/* Desktop top bar — sticky, desktop only */}
  <DesktopTopBar
    clinicName={clinic.name}
    isDoctorPresent={clinic.isDoctorPresent}
    isQueueOpen={clinic.isQueueOpen}
    currentLang={i18n.language as 'fr' | 'ar'}
    waitingCount={queue.waitingCount}
    subscriptionStatus={subscription.status}
    trialDaysRemaining={subscription.daysRemaining}
    onToggleDoctorPresence={handleToggleDoctorPresence}
    onToggleQueue={handleToggleQueue}
    onToggleLanguage={handleToggleLanguage}
    onNavigateToSettings={() => navigate('/settings')}
    onNavigateToSubscription={() => navigate('/settings/subscription')}
    onNavigateToSupport={() => navigate('/support')}
    onLogout={handleLogout}
    onQrDisplay={handleQrDisplay}
    onQrCopy={handleQrCopy}
    onQrWhatsApp={handleQrWhatsApp}
  />

  {/* Scrollable content area */}
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
</div>
```

### 8.2 Mobile Coexistence

The existing mobile drawer must remain intact. Use Tailwind responsive prefixes to control visibility:

```tsx
{/* Desktop top bar */}
<div className="hidden lg:block">
  <DesktopTopBar ... />
</div>

{/* Mobile top bar + hamburger (existing) */}
<div className="lg:hidden">
  <MobileTopBar ... />
</div>
```

Do **not** modify any mobile components or their logic.

---

## 9. i18n Keys Required

Add the following keys to both `fr.json` and `ar.json` (and any other locale files):

```json
{
  "desktop_menu": {
    "settings_button": "Paramètres",
    "section_qr": "Code QR",
    "qr_display": "Afficher",
    "qr_copy": "Copier",
    "qr_whatsapp": "WhatsApp",
    "section_controls": "Contrôles",
    "control_language": "Langue",
    "control_doctor": "Médecin",
    "control_doctor_present": "Présent",
    "control_doctor_absent": "Absent",
    "control_queue": "File d'attente",
    "control_queue_open": "Ouverte",
    "control_queue_closed": "Fermée",
    "section_account": "Compte",
    "account_settings": "Paramètres",
    "account_support": "Aide & support",
    "account_logout": "Déconnexion",
    "logout_subtitle": "Quitter la session",
    "trial_label": "Essai gratuit · {{days}} jours restants",
    "active_label": "Abonnement actif",
    "aria_dropdown_label": "Paramètres du cabinet",
    "aria_close_dropdown": "Fermer le menu paramètres"
  }
}
```

---

## 10. Accessibility Requirements

| Element | Requirement |
|---|---|
| Trigger button | `aria-haspopup="true"`, `aria-expanded={isOpen}`, `aria-controls="settings-dropdown-panel"` |
| Dropdown panel | `role="dialog"`, `aria-label={t('desktop_menu.aria_dropdown_label')}` |
| Toggle switches | `role="switch"`, `aria-checked={checked}`, `aria-label` on each |
| QR buttons | Descriptive `aria-label` (e.g., `"Afficher le code QR"`) |
| Logout button | `aria-label="Déconnexion - Quitter la session"` |
| Escape key | Closes panel and returns focus to trigger button |
| Focus trap | Not required (panel is supplementary, not a blocking modal) |

---

## 11. Acceptance Criteria

- [ ] Desktop top bar renders at `lg:` and above only; mobile drawer unaffected below `lg:`
- [ ] Top bar is sticky and remains visible when the queue list scrolls
- [ ] Clicking "Paramètres" button opens the dropdown panel with entry animation
- [ ] The full dropdown panel is visible without any internal scrolling on any standard desktop viewport (≥ 1024px wide, ≥ 700px tall)
- [ ] QR code buttons are rendered inline (icon + label side-by-side), height fixed at 36px (`h-9`)
- [ ] Language toggle reflects current language from i18n state
- [ ] Doctor presence toggle calls `onToggleDoctorPresence` and reflects the new state optimistically
- [ ] Queue open/close toggle calls `onToggleQueue` and reflects new state optimistically
- [ ] Clicking outside the panel closes it
- [ ] Pressing `Escape` closes the panel and restores focus to the trigger button
- [ ] Navigating to Settings or Support closes the panel before navigating
- [ ] Trial badge shows days remaining in `DropdownHeader` subtitle
- [ ] All i18n keys present in `fr.json` and `ar.json`
- [ ] All interactive elements meet WCAG 2.1 AA requirements (aria attributes, focus indicators)
- [ ] No TypeScript errors (`as any` casts forbidden in new code)
- [ ] No `console.log` statements in production code

---

## 12. Do Not Touch

- `MobileDashboard.tsx` and any mobile-specific components
- Existing mobile hamburger drawer logic and styles
- `PatientStatusPage.tsx`
- Socket.io room logic
- Any existing route definitions
