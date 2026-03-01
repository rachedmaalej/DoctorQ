# TASK: Implement Side Drawer Menu — BleSaf Mobile Doctor Dashboard

## Context for Claude Code

You are working on **BleSaf** (also branded **AuSuivant** for the French market), a digital queue-management SaaS for medical clinics. The frontend is a React + TypeScript + Tailwind CSS application. The mobile doctor dashboard currently exposes a small settings area in the header (a chevron/dropdown) that is limited and inconsistent. You will replace it with a full **Side Drawer** component that slides in from the right edge of the screen.

The approved design is **Option 04 — Side Drawer Contextuel**, whose reference implementation lives in `blesaf-side-drawer-v1.html`. Extract every design decision from that file; the sections below codify all behavioural and structural requirements.

---

## 1. Pre-flight: Files to Read First

Before writing a single line of code, read these files in order:

```
web/src/pages/DashboardPage.tsx          # Main page — contains MobileDashboard render
web/src/components/MobileDashboard.tsx   # The target component you will modify
web/src/stores/queueStore.ts             # Zustand store — state & actions you will call
web/src/lib/i18n.ts                      # i18n helper — add new keys here
web/src/locales/fr.json                  # French strings
web/src/locales/ar.json                  # Arabic strings
web/src/hooks/useClinic.ts               # If it exists — clinic data accessor
tailwind.config.js                       # Confirm custom colour tokens
```

Identify:
- How the current header dropdown/settings trigger is rendered in `MobileDashboard.tsx`
- What Zustand actions already exist for: `logout`, `closeQueue`, `setLanguage`, `isDoctorPresent`
- How the `t()` translation function is imported and called
- Whether `@mui/material` or any icon library is already installed (it likely is not — you will add Material Symbols via a CSS `<link>` or a Tailwind plugin approach; see §5)

---

## 2. Scope of Changes

### Files to CREATE
```
web/src/components/drawer/SideDrawer.tsx          # Main drawer component
web/src/components/drawer/DrawerItem.tsx          # Reusable menu row
web/src/components/drawer/DrawerSection.tsx       # Section wrapper with label
web/src/components/drawer/QrCodeSheet.tsx         # QR sub-panel (renders inside drawer)
web/src/hooks/useDrawer.ts                        # Open/close state hook
```

### Files to MODIFY
```
web/src/components/MobileDashboard.tsx            # Replace header trigger + add <SideDrawer>
web/src/lib/i18n.ts  OR  web/src/locales/fr.json  # Add i18n keys (§8)
web/src/locales/ar.json                           # Arabic translations for same keys
web/index.html  OR  web/public/index.html         # Add Material Symbols font link (§5)
```

### Files to NOT TOUCH
```
api/                                              # No backend changes required
web/src/pages/PatientStatusPage.tsx
web/src/pages/LoginPage.tsx
web/src/pages/CheckInPage.tsx
```

---

## 3. Design Tokens (Tailwind-first)

The existing design uses a teal green primary. Confirm these values in `tailwind.config.js`. If custom tokens do not exist, add them under `theme.extend.colors`:

```js
// tailwind.config.js — extend only, do not replace existing config
colors: {
  primary: {
    DEFAULT: '#356B58',
    mid:     '#3D7367',
    hover:   '#2D5C4A',
    pale:    '#EAF3EF',
    faint:   '#F3F9F6',
  },
  surface: '#FFFFFF',
  'bg-app': '#ECEEED',
  'bg-inner': '#F2F4F3',
  'border-base': '#DDE2E0',
  'border-light': '#EEF1F0',
  'text-main': '#1A1C1B',
  'text-sub': '#4A5250',
  'text-label': '#8E9693',
  'danger': '#B94040',
  'danger-bg': '#FDF0F0',
  'warn': '#B95F30',
  'warn-bg': '#FFF4EE',
  'info-icon': '#4A5EC7',
  'info-bg': '#EEF0FF',
  'whatsapp': '#2D7A4F',
  'whatsapp-bg': '#F0FBF4',
},
```

---

## 4. Typography

The reference uses **DM Sans** (body) and **Syne** (display/headings). Confirm these are already loaded. If not, add to `web/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
```

And in `tailwind.config.js`:
```js
fontFamily: {
  sans:    ['DM Sans', 'sans-serif'],
  display: ['Syne', 'sans-serif'],
},
```

---

## 5. Material Symbols Rounded (MD3 Icons)

> **Critical:** Do NOT use emoji. Do NOT use Heroicons or Lucide for this component. Use **Material Symbols Rounded** exclusively.

Add the font to `web/index.html` (or `web/public/index.html` — whichever is the HTML entry point):

```html
<!-- Material Symbols Rounded — MD3 -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,400,0,0&display=block">
```

Create a shared utility component at `web/src/components/ui/Icon.tsx`:

```tsx
// web/src/components/ui/Icon.tsx
interface IconProps {
  name: string;
  size?: number;        // px, default 20
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
```

Add to `web/src/index.css` (or wherever global styles live):

```css
.material-symbols-rounded {
  font-family: 'Material Symbols Rounded';
  font-weight: normal;
  font-style: normal;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}
```

### Icon Reference Map

Use **exactly** these icon names. Do not substitute:

| Action / Element         | Icon name               |
|--------------------------|-------------------------|
| QR Code (section label)  | `qr_code_2`             |
| View QR fullscreen       | `qr_code_2`             |
| Copy link                | `content_copy`          |
| Send via WhatsApp        | `send`                  |
| Actions section label    | `bolt`                  |
| Make announcement        | `campaign`              |
| Close queue              | `block`                 |
| Preferences section      | `tune`                  |
| Language                 | `language`              |
| Settings                 | `settings`              |
| Account section          | `manage_accounts`       |
| Help & Support           | `help_outline`          |
| Logout                   | `logout`                |
| Chevron right (nav)      | `chevron_right`         |
| Open in new              | `open_in_new`           |
| Close (X button)         | `close`                 |
| Hospital / clinic avatar | `local_hospital`        |
| Online status dot label  | `circle` (filled 8px)   |
| Phone (in header)        | `phone`                 |
| Search                   | `search`                |
| Add patient              | `person_add`            |
| End consultation         | `check_circle`          |
| Timer / elapsed          | `schedule`              |
| In consultation dot      | `radio_button_checked`  |
| Header status chevron    | `chevron_right`         |

---

## 6. Component Architecture

### 6.1 `useDrawer.ts` — State Hook

```tsx
// web/src/hooks/useDrawer.ts
import { useState, useEffect, useCallback } from 'react';

export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return { isOpen, open, close, toggle };
}
```

---

### 6.2 `DrawerItem.tsx` — Reusable Row

Each item in the drawer follows the exact same anatomy: icon container → text stack → optional right element.

```tsx
// web/src/components/drawer/DrawerItem.tsx
import { Icon } from '@/components/ui/Icon';
import { ReactNode } from 'react';

interface DrawerItemProps {
  iconName: string;
  iconBgClass?: string;   // e.g. 'bg-primary-faint'
  iconColorClass?: string; // e.g. 'text-primary'
  label: string;
  sublabel?: string;
  rightElement?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

export function DrawerItem({
  iconName,
  iconBgClass = 'bg-bg-inner',
  iconColorClass = 'text-text-sub',
  label,
  sublabel,
  rightElement,
  danger = false,
  onClick,
}: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-xl px-2 py-2',
        'text-left transition-colors duration-150',
        'active:scale-[0.98] active:duration-75',
        danger
          ? 'hover:bg-danger-bg active:bg-danger-bg'
          : 'hover:bg-bg-inner active:bg-primary-faint',
        '-webkit-tap-highlight-color: transparent',
      ].join(' ')}
      type="button"
    >
      {/* Icon container */}
      <span className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
        <Icon
          name={iconName}
          size={17}
          className={danger ? 'text-danger' : iconColorClass}
        />
      </span>

      {/* Text */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-[0.625rem] font-semibold leading-snug ${danger ? 'text-danger' : 'text-text-main'}`}>
          {label}
        </span>
        {sublabel && (
          <span className="truncate text-[0.5rem] leading-snug text-text-label">
            {sublabel}
          </span>
        )}
      </span>

      {/* Right element */}
      {rightElement && (
        <span className="ml-auto flex-shrink-0">
          {rightElement}
        </span>
      )}
    </button>
  );
}
```

---

### 6.3 `DrawerSection.tsx` — Section Wrapper

```tsx
// web/src/components/drawer/DrawerSection.tsx
import { Icon } from '@/components/ui/Icon';
import { ReactNode } from 'react';

interface DrawerSectionProps {
  iconName: string;
  label: string;
  children: ReactNode;
}

export function DrawerSection({ iconName, label, children }: DrawerSectionProps) {
  return (
    <div className="px-2.5 pb-1 pt-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 pb-1">
        <Icon name={iconName} size={12} className="text-text-label" />
        <span className="text-[0.46rem] font-bold uppercase tracking-[0.1em] text-text-label">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}
```

---

### 6.4 `QrCodeSheet.tsx` — QR Sub-panel

This renders **inside the drawer** below the main content when the "Voir le QR Code" item is tapped. It slides up within the drawer via `translateY`.

```tsx
// web/src/components/drawer/QrCodeSheet.tsx
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from '@/lib/i18n'; // adjust to your actual i18n import

interface QrCodeSheetProps {
  clinicSlug: string;  // e.g. "cabinet-skander-kamoun"
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeSheet({ clinicSlug, isOpen, onClose }: QrCodeSheetProps) {
  const { t } = useTranslation();
  const qrUrl = `${window.location.origin}/q/${clinicSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      // TODO: replace with your existing toast/notification system
      // showToast(t('drawer.qr.copied'));
    } catch {
      // fallback: silently fail or log
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${t('drawer.qr.whatsappMessage')} ${qrUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <div
      className={[
        'absolute inset-x-0 bottom-0 z-10',
        'rounded-t-2xl bg-surface px-3.5 pb-5 pt-2.5',
        'shadow-[0_-4px_32px_rgba(0,0,0,0.12)]',
        'transition-transform duration-300 ease-[cubic-bezier(0.32,1.4,0.56,1)]',
        isOpen ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="qr_code_2" size={16} className="text-primary" />
          <span className="font-display text-[0.72rem] font-bold text-text-main">
            {t('drawer.qr.title')}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-inner text-text-label hover:bg-border-base"
          aria-label={t('drawer.qr.close')}
          type="button"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* QR code display */}
      <div className="mb-3 text-center">
        <div className="mx-auto inline-block rounded-xl border border-border-base bg-surface p-2.5">
          {/*
            Replace this placeholder with your actual QR generation.
            Recommended library: `qrcode.react`
            npm install qrcode.react

            import { QRCodeSVG } from 'qrcode.react';
            <QRCodeSVG value={qrUrl} size={88} fgColor="#356B58" />
          */}
          <div
            className="flex h-[88px] w-[88px] items-center justify-center rounded-lg bg-bg-inner"
            role="img"
            aria-label={t('drawer.qr.imageAlt')}
          >
            <Icon name="qr_code_2" size={40} className="text-primary" />
          </div>
        </div>
        <p className="mt-1.5 text-[0.5rem] text-text-label">
          {qrUrl}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={() => window.open(qrUrl, '_blank', 'noopener')}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border-base bg-bg-inner py-2 text-[0.57rem] font-semibold text-text-sub transition-colors hover:border-primary hover:bg-primary-faint hover:text-primary"
          type="button"
        >
          <Icon name="open_in_new" size={16} />
          {t('drawer.qr.view')}
        </button>
        <button
          onClick={handleCopy}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border-base bg-bg-inner py-2 text-[0.57rem] font-semibold text-text-sub transition-colors hover:border-primary hover:bg-primary-faint hover:text-primary"
          type="button"
        >
          <Icon name="content_copy" size={16} />
          {t('drawer.qr.copy')}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border-base bg-whatsapp-bg py-2 text-[0.57rem] font-semibold text-whatsapp transition-colors hover:border-whatsapp hover:bg-whatsapp-bg"
          type="button"
        >
          <Icon name="send" size={16} />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
```

---

### 6.5 `SideDrawer.tsx` — Main Component

This is the core component. Study the complete structure carefully before implementing.

```tsx
// web/src/components/drawer/SideDrawer.tsx
'use client'; // remove if not Next.js

import { useState } from 'react';
import { Icon }         from '@/components/ui/Icon';
import { DrawerItem }   from './DrawerItem';
import { DrawerSection } from './DrawerSection';
import { QrCodeSheet }  from './QrCodeSheet';
import { useTranslation } from '@/lib/i18n'; // adjust import path

// ── Replace these with your actual Zustand/store imports ──
import { useQueueStore }  from '@/stores/queueStore';
import { useAuthStore }   from '@/stores/authStore';   // or wherever logout lives
// ─────────────────────────────────────────────────────────

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { t, language, setLanguage } = useTranslation();
  const { clinic, closeQueue }       = useQueueStore();
  const { logout }                   = useAuthStore();

  const [qrSheetOpen, setQrSheetOpen] = useState(false);

  // Derive the clinic URL slug from clinic data
  const clinicSlug = clinic?.slug ?? clinic?.id ?? 'clinic';

  // ── Action handlers ──────────────────────────────────
  const handleViewQr    = () => setQrSheetOpen(true);
  const handleCloseQr   = () => setQrSheetOpen(false);

  const handleAnnouncement = () => {
    onClose();
    // TODO: open your existing announcement modal
    // openAnnouncementModal();
  };

  const handleCloseQueue = () => {
    onClose();
    // TODO: show confirm dialog before calling closeQueue()
    // showConfirm({ message: t('drawer.actions.closeQueueConfirm'), onConfirm: closeQueue });
    closeQueue();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleSettings = () => {
    onClose();
    // TODO: navigate to settings page when it exists
    // navigate('/settings');
  };

  const handleSupport = () => {
    window.open('mailto:support@blesaf.tn', '_blank');
  };
  // ─────────────────────────────────────────────────────

  return (
    <>
      {/*
        ══════════════════════════════════════════
        BACKDROP — tap to close
        ══════════════════════════════════════════
      */}
      <div
        className={[
          'absolute inset-0 z-40',
          'transition-all duration-300',
          isOpen
            ? 'pointer-events-auto bg-black/30'
            : 'pointer-events-none bg-transparent',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
        ══════════════════════════════════════════
        DRAWER PANEL
        ══════════════════════════════════════════
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.ariaLabel')}
        className={[
          // Positioning
          'absolute inset-y-0 right-0 z-50',
          // Size — 76% width, never wider than 220px
          'w-[76%] max-w-[220px]',
          // Appearance
          'flex flex-col overflow-y-auto overflow-x-hidden bg-surface',
          'shadow-[-8px_0_32px_rgba(0,0,0,0.14)]',
          // Animation — spring slide-in from right
          'transition-transform duration-[360ms] ease-[cubic-bezier(0.32,1.4,0.56,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >

        {/* ═══════════════════════════════════════
            DRAWER HEADER — clinic identity
        ═══════════════════════════════════════ */}
        <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#3D7367] to-[#2C5748] px-3.5 pb-4 pt-[18px]">
          {/* Decorative circles — match reference */}
          <div className="pointer-events-none absolute -right-4 -top-4 h-[72px] w-[72px] rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute -bottom-2.5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-white/[0.05]" />

          <div className="relative">
            {/* Top row: avatar + close button */}
            <div className="mb-2.5 flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.18]">
                <Icon name="local_hospital" size={20} className="text-white/90" />
              </div>
              <button
                onClick={onClose}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/[0.12] text-white/70 transition-colors hover:bg-white/[0.22]"
                aria-label={t('drawer.close')}
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Clinic name & doctor */}
            <div className="font-display text-[0.72rem] font-bold leading-snug text-white">
              {clinic?.name ?? t('drawer.header.clinicFallback')}
            </div>
            <div className="mt-0.5 text-[0.55rem] text-white/60">
              {clinic?.doctorName ?? ''}
            </div>

            {/* Status badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.12] px-2.5 py-1">
              <span
                className="relative inline-block h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#5EB990]"
                aria-hidden="true"
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 animate-ping rounded-full bg-[#5EB990] opacity-40" />
              </span>
              <span className="text-[0.52rem] font-semibold text-white/85">
                {t('drawer.header.present')} · {clinic?.queueCount ?? 0} {t('drawer.header.patients')}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SCROLLABLE CONTENT
        ═══════════════════════════════════════ */}
        <div className="relative flex flex-1 flex-col overflow-y-auto">

          {/* — SECTION: QR Code — */}
          <DrawerSection iconName="qr_code_2" label={t('drawer.sections.qr')}>
            <DrawerItem
              iconName="qr_code_2"
              iconBgClass="bg-primary-faint"
              iconColorClass="text-primary"
              label={t('drawer.qr.view')}
              sublabel={t('drawer.qr.viewSub')}
              rightElement={<Icon name="open_in_new" size={15} className="text-text-label" />}
              onClick={handleViewQr}
            />
            <DrawerItem
              iconName="content_copy"
              iconBgClass="bg-primary-faint"
              iconColorClass="text-primary"
              label={t('drawer.qr.copy')}
              sublabel={`blesaf.tn/q/${clinicSlug}`.slice(0, 26) + '…'}
              rightElement={<Icon name="chevron_right" size={15} className="text-text-label" />}
              onClick={async () => {
                const url = `${window.location.origin}/q/${clinicSlug}`;
                await navigator.clipboard.writeText(url).catch(() => {});
                // showToast(t('drawer.qr.copied'));
              }}
            />
            <DrawerItem
              iconName="send"
              iconBgClass="bg-whatsapp-bg"
              iconColorClass="text-whatsapp"
              label={t('drawer.qr.whatsapp')}
              sublabel={t('drawer.qr.whatsappSub')}
              rightElement={
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.43rem] font-bold uppercase tracking-wide text-white">
                  WA
                </span>
              }
              onClick={() => {
                const url   = `${window.location.origin}/q/${clinicSlug}`;
                const msg   = encodeURIComponent(`${t('drawer.qr.whatsappMessage')} ${url}`);
                window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
              }}
            />
          </DrawerSection>

          <div className="mx-2.5 my-1.5 h-px bg-border-light" />

          {/* — SECTION: Actions — */}
          <DrawerSection iconName="bolt" label={t('drawer.sections.actions')}>
            <DrawerItem
              iconName="campaign"
              iconBgClass="bg-info-bg"
              iconColorClass="text-info-icon"
              label={t('drawer.actions.announcement')}
              sublabel={t('drawer.actions.announcementSub')}
              rightElement={<Icon name="chevron_right" size={15} className="text-text-label" />}
              onClick={handleAnnouncement}
            />
            <DrawerItem
              iconName="block"
              iconBgClass="bg-warn-bg"
              iconColorClass="text-warn"
              label={t('drawer.actions.closeQueue')}
              sublabel={t('drawer.actions.closeQueueSub')}
              rightElement={<Icon name="chevron_right" size={15} className="text-text-label" />}
              onClick={handleCloseQueue}
            />
          </DrawerSection>

          <div className="mx-2.5 my-1.5 h-px bg-border-light" />

          {/* — SECTION: Preferences — */}
          <DrawerSection iconName="tune" label={t('drawer.sections.preferences')}>

            {/* Language toggle — inline within the row */}
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
              <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-bg-inner">
                <Icon name="language" size={17} className="text-text-sub" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[0.625rem] font-semibold text-text-main">
                  {t('drawer.preferences.language')}
                </span>
              </span>
              <div className="flex gap-0.5 rounded-full border border-border-base bg-bg-inner p-0.5">
                {(['fr', 'ar'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    type="button"
                    className={[
                      'rounded-full px-2 py-0.5 text-[0.52rem] font-bold transition-all duration-150',
                      language === lang
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-transparent text-text-label hover:bg-border-light',
                    ].join(' ')}
                    aria-label={lang === 'fr' ? 'Français' : 'العربية'}
                    aria-pressed={language === lang}
                  >
                    {lang === 'fr' ? 'FR' : 'AR'}
                  </button>
                ))}
              </div>
            </div>

            <DrawerItem
              iconName="settings"
              iconBgClass="bg-bg-inner"
              iconColorClass="text-text-sub"
              label={t('drawer.preferences.settings')}
              sublabel={t('drawer.preferences.settingsSub')}
              rightElement={<Icon name="chevron_right" size={15} className="text-text-label" />}
              onClick={handleSettings}
            />
          </DrawerSection>

          <div className="mx-2.5 my-1.5 h-px bg-border-light" />

          {/* — SECTION: Account — */}
          <DrawerSection iconName="manage_accounts" label={t('drawer.sections.account')}>
            <DrawerItem
              iconName="help_outline"
              iconBgClass="bg-bg-inner"
              iconColorClass="text-text-sub"
              label={t('drawer.account.help')}
              rightElement={<Icon name="chevron_right" size={15} className="text-text-label" />}
              onClick={handleSupport}
            />
            <DrawerItem
              iconName="logout"
              iconBgClass="bg-danger-bg"
              label={t('drawer.account.logout')}
              sublabel={t('drawer.account.logoutSub')}
              rightElement={<Icon name="chevron_right" size={15} className="text-danger" />}
              danger
              onClick={handleLogout}
            />
          </DrawerSection>

          {/* Spacer before footer */}
          <div className="flex-1" />

          {/* Footer version */}
          <div className="border-t border-border-light px-3.5 py-3">
            <p className="text-center text-[0.48rem] text-text-label">
              BleSaf v{import.meta.env.VITE_APP_VERSION ?? '2.0.0'} · © {new Date().getFullYear()} BleSaf SARL
            </p>
          </div>
        </div>

        {/* QR sub-panel — absolutely positioned inside drawer */}
        <QrCodeSheet
          clinicSlug={clinicSlug}
          isOpen={qrSheetOpen}
          onClose={handleCloseQr}
        />

      </div>{/* /drawer panel */}
    </>
  );
}
```

---

## 7. Integration into `MobileDashboard.tsx`

### 7.1 What to replace

Locate the current header trigger in `MobileDashboard.tsx`. It will look roughly like one of these patterns:

```tsx
// Pattern A — chevron button
<button onClick={() => setShowMenu(!showMenu)}>›</button>

// Pattern B — dropdown menu
<DropdownMenu>...</DropdownMenu>

// Pattern C — existing sheet/modal
<Sheet isOpen={menuOpen} ...>...</Sheet>
```

**Remove whichever pattern exists.** Replace it with the new status pill trigger shown in §7.2.

### 7.2 New header trigger

The drawer is triggered by the existing "status pill" in the top-right of the header. This pill shows the presence indicator + chevron. Replace the existing pill/trigger element with:

```tsx
// In MobileDashboard.tsx — inside the header row
<button
  onClick={drawerControls.open}
  className={[
    'flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 py-1',
    'transition-colors duration-150 hover:bg-primary-hover active:bg-primary-hover',
    '-webkit-tap-highlight-color-transparent',
  ].join(' ')}
  type="button"
  aria-label={t('drawer.triggerLabel')}
  aria-expanded={drawerControls.isOpen}
  aria-haspopup="dialog"
>
  {/* Presence dot with pulse animation */}
  <span className="relative flex-shrink-0">
    <span className="block h-1.5 w-1.5 rounded-full bg-[#5EB990]" />
    <span className="absolute inset-0 animate-ping rounded-full bg-[#5EB990] opacity-40" />
  </span>

  <span className="text-[0.6rem] font-semibold text-white/90">
    {t('dashboard.statusPresent')}
  </span>

  <Icon
    name="chevron_right"
    size={14}
    className={[
      'text-white/65 transition-transform duration-250',
      drawerControls.isOpen ? 'rotate-90' : 'rotate-0',
    ].join(' ')}
  />
</button>
```

### 7.3 Full component wiring

At the top of `MobileDashboard.tsx`, add:

```tsx
import { useDrawer }     from '@/hooks/useDrawer';
import { SideDrawer }    from '@/components/drawer/SideDrawer';
import { Icon }          from '@/components/ui/Icon';
```

Inside the component function:

```tsx
const drawerControls = useDrawer();
```

And at the end of the component's return, **inside the outermost container div** (which must have `position: relative` / `className="relative"`):

```tsx
<SideDrawer
  isOpen={drawerControls.isOpen}
  onClose={drawerControls.close}
/>
```

> **Important:** The outermost wrapper div in `MobileDashboard.tsx` must have `className="relative overflow-hidden ..."` so the absolutely-positioned drawer and its backdrop are clipped to the phone viewport. If it already uses `overflow-hidden`, no change needed. If not, add it.

---

## 8. Internationalisation (i18n)

Add all the following keys. Adapt to your actual i18n system — if you use `react-i18next`, add to your namespace JSON files. If you use a custom `t()` function with flat key objects, add the keys as a flat namespace.

### `fr.json` additions

```json
{
  "drawer": {
    "ariaLabel": "Menu du cabinet",
    "triggerLabel": "Ouvrir le menu",
    "close": "Fermer le menu",
    "header": {
      "clinicFallback": "Cabinet médical",
      "present": "Présent",
      "patients": "patients en file"
    },
    "sections": {
      "qr":          "QR Code",
      "actions":     "Actions",
      "preferences": "Préférences",
      "account":     "Compte"
    },
    "qr": {
      "title":            "QR Code Clinique",
      "imageAlt":         "QR Code de la clinique",
      "view":             "Voir le QR Code",
      "viewSub":          "Afficher en plein écran",
      "copy":             "Copier le lien",
      "copied":           "Lien copié !",
      "whatsapp":         "Envoyer via WhatsApp",
      "whatsappSub":      "Partager avec vos patients",
      "whatsappMessage":  "Consultez votre position dans la file d'attente :",
      "close":            "Fermer"
    },
    "actions": {
      "announcement":        "Faire une annonce",
      "announcementSub":     "Notifier tous les patients",
      "closeQueue":          "Fermer la file",
      "closeQueueSub":       "Stopper les nouvelles inscriptions",
      "closeQueueConfirm":   "Voulez-vous vraiment fermer la file d'attente ?"
    },
    "preferences": {
      "language":     "Langue",
      "settings":     "Paramètres",
      "settingsSub":  "Durée, notifications…"
    },
    "account": {
      "help":      "Aide & Support",
      "logout":    "Déconnexion",
      "logoutSub": "Fermer cette session"
    }
  }
}
```

### `ar.json` additions

```json
{
  "drawer": {
    "ariaLabel": "قائمة العيادة",
    "triggerLabel": "فتح القائمة",
    "close": "إغلاق القائمة",
    "header": {
      "clinicFallback": "العيادة الطبية",
      "present": "حاضر",
      "patients": "مريض في الانتظار"
    },
    "sections": {
      "qr":          "رمز QR",
      "actions":     "الإجراءات",
      "preferences": "التفضيلات",
      "account":     "الحساب"
    },
    "qr": {
      "title":            "رمز QR للعيادة",
      "imageAlt":         "رمز QR للعيادة",
      "view":             "عرض رمز QR",
      "viewSub":          "عرض بملء الشاشة",
      "copy":             "نسخ الرابط",
      "copied":           "تم نسخ الرابط!",
      "whatsapp":         "إرسال عبر واتساب",
      "whatsappSub":      "مشاركة مع مرضاك",
      "whatsappMessage":  "تحقق من موقعك في قائمة الانتظار:",
      "close":            "إغلاق"
    },
    "actions": {
      "announcement":        "إعلان للمرضى",
      "announcementSub":     "إشعار جميع المرضى",
      "closeQueue":          "إغلاق قائمة الانتظار",
      "closeQueueSub":       "إيقاف التسجيلات الجديدة",
      "closeQueueConfirm":   "هل تريد فعلاً إغلاق قائمة الانتظار؟"
    },
    "preferences": {
      "language":     "اللغة",
      "settings":     "الإعدادات",
      "settingsSub":  "المدة، الإشعارات…"
    },
    "account": {
      "help":      "المساعدة والدعم",
      "logout":    "تسجيل الخروج",
      "logoutSub": "إنهاء هذه الجلسة"
    }
  }
}
```

---

## 9. RTL Support

The existing app supports Arabic with RTL. The drawer slides in from the **right** edge in LTR. In RTL mode it should slide in from the **left** edge.

In `SideDrawer.tsx`, replace the static positioning with direction-aware classes:

```tsx
// Instead of 'right-0' / 'translate-x-full'
// Use logical properties:
className={[
  'absolute inset-y-0 z-50',
  'w-[76%] max-w-[220px]',
  // RTL-aware positioning
  'ltr:right-0 rtl:left-0',
  'flex flex-col overflow-y-auto overflow-x-hidden bg-surface',
  'shadow-[var(--drawer-shadow)]',
  'transition-transform duration-[360ms] ease-[cubic-bezier(0.32,1.4,0.56,1)]',
  isOpen
    ? 'translate-x-0'
    : 'ltr:translate-x-full rtl:-translate-x-full',
].join(' ')}
```

Ensure the `<html>` element has `dir="rtl"` when Arabic is active (this should already be handled by the existing i18n logic).

---

## 10. Tailwind Arbitrary Value Additions

If Tailwind's JIT doesn't pick up some of the animation values, add to `tailwind.config.js`:

```js
// tailwind.config.js
theme: {
  extend: {
    transitionTimingFunction: {
      spring: 'cubic-bezier(0.32, 1.4, 0.56, 1)',
      'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    transitionDuration: {
      '360': '360ms',
      '250': '250ms',
    },
    boxShadow: {
      'drawer': '-8px 0 32px rgba(0,0,0,0.14)',
      'drawer-rtl': '8px 0 32px rgba(0,0,0,0.14)',
    },
  },
},
```

---

## 11. Accessibility Checklist

Implement all of the following before marking the task complete:

- [ ] `role="dialog"` on the drawer panel element
- [ ] `aria-modal="true"` on the drawer panel
- [ ] `aria-label={t('drawer.ariaLabel')}` on the drawer panel
- [ ] `aria-expanded` on the trigger button, bound to `drawerControls.isOpen`
- [ ] `aria-haspopup="dialog"` on the trigger button
- [ ] `aria-label` on the close button (`t('drawer.close')`)
- [ ] `aria-label` on each icon-only `DrawerItem` where `sublabel` is absent
- [ ] `aria-pressed` on the FR / AR language toggle buttons
- [ ] `aria-hidden="true"` on the backdrop overlay div
- [ ] Focus moves into drawer when opened — focus the close button (see `useDrawer.ts` §6.1)
- [ ] Escape key closes drawer (implemented in `useDrawer.ts`)
- [ ] Focus returns to trigger button on close (use `pill-trigger` ref, call `.focus()` in `close()`)
- [ ] No focus escapes the drawer while it is open (focus trap — use `focus-trap-react` or implement manually)
- [ ] `aria-hidden="true"` on all `<Icon>` components (already in the `Icon` component spec §5)

---

## 12. No-op Placeholders (things to wire up later)

The following items in the drawer call functions that do not yet have implementations. Leave them as **no-op console.warn** calls with a `// TODO` comment — do **not** attempt to build these features now:

| Drawer item            | Pending feature                          |
|------------------------|------------------------------------------|
| Faire une annonce      | `openAnnouncementModal()` — not built    |
| Fermer la file         | Confirm dialog before `closeQueue()`     |
| Paramètres             | Settings page — `navigate('/settings')`  |
| Aide & Support         | Opens `mailto:support@blesaf.tn`         |

---

## 13. What NOT to change

- Do not modify any queue logic, Socket.io event handlers, or API calls
- Do not change the patient-facing pages (`CheckInPage`, `PatientStatusPage`)
- Do not alter the desktop `DashboardPage` layout — this change is **mobile-only** (`MobileDashboard.tsx`)
- Do not install a new CSS-in-JS or icon library — use only Material Symbols via the `<link>` tag
- Do not add any emoji characters anywhere in the new components
- Do not change the existing Zustand store interface — call existing actions only

---

## 14. Acceptance Criteria

The implementation is complete when all of the following are true:

1. **Opens correctly** — Tapping the status pill in the mobile header slides the drawer in from the right within ~360ms with a spring feel.
2. **Closes correctly** — Tapping the backdrop, the close button, or pressing Escape closes the drawer with a smooth reverse animation.
3. **All 10 items render** — View QR, Copy link, WhatsApp, Announcement, Close queue, Language toggle, Settings, Help, Logout are all visible and labelled.
4. **Language toggle works** — Pressing FR/AR in the drawer switches the app language in real time without closing the drawer.
5. **QR sub-panel works** — Tapping "Voir le QR Code" slides the QR panel up within the drawer; tapping its X closes only the sub-panel.
6. **Copy link works** — Tapping "Copier le lien" writes the correct URL to the clipboard.
7. **WhatsApp share works** — Opens `wa.me` with the pre-filled message in a new tab.
8. **Logout works** — Tapping Déconnexion calls the existing `logout()` action and closes the drawer.
9. **RTL correct** — When language is `ar`, the drawer slides in from the left and text is right-aligned.
10. **No emoji** — Zero emoji characters anywhere in the component tree.
11. **Zero TypeScript errors** — `tsc --noEmit` passes with no new errors.
12. **Existing tests pass** — Run `npm test` — no regressions in the existing test suite.
13. **Responsive** — The dashboard content is not obscured when the drawer is closed. No layout shift.
14. **Accessibility** — All items in the checklist in §11 are implemented.

---

## 15. Quick Reference: File Summary

```
CREATE:
  web/src/components/ui/Icon.tsx
  web/src/components/drawer/SideDrawer.tsx
  web/src/components/drawer/DrawerItem.tsx
  web/src/components/drawer/DrawerSection.tsx
  web/src/components/drawer/QrCodeSheet.tsx
  web/src/hooks/useDrawer.ts

MODIFY:
  web/src/components/MobileDashboard.tsx      (add trigger + mount <SideDrawer>)
  web/src/locales/fr.json                     (add drawer.* keys)
  web/src/locales/ar.json                     (add drawer.* keys)
  web/index.html                              (add Material Symbols + fonts if missing)
  tailwind.config.js                          (add tokens if missing)
  web/src/index.css                           (add .material-symbols-rounded rule)

DO NOT TOUCH:
  api/
  web/src/pages/PatientStatusPage.tsx
  web/src/pages/LoginPage.tsx
  web/src/pages/CheckInPage.tsx
  web/src/pages/DashboardPage.tsx             (unless MobileDashboard is inlined here)
```
