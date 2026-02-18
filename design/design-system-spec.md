# 08_Design_System_Specification.md

## Overview

This document defines the complete design system for DoctorQ, including design tokens, component specifications, accessibility standards, and RTL support for Arabic. The design prioritizes clarity, accessibility, and mobile-first responsiveness.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Design Tokens](#design-tokens)
3. [Component Library](#component-library)
4. [Layout Patterns](#layout-patterns)
5. [Accessibility Standards](#accessibility-standards)
6. [RTL Support](#rtl-support)
7. [Responsive Breakpoints](#responsive-breakpoints)

---

## Design Principles

### Core Principles

1. **Clarity First**: Medical staff need quick, unambiguous information
2. **Mobile-First**: Patients primarily use phones to check status
3. **Accessible**: WCAG 2.1 AA compliance for all users
4. **Bilingual**: Seamless French/Arabic experience with RTL
5. **Real-time Feedback**: Visual indicators for live updates

### Design Goals

- **Reduce Cognitive Load**: Clear hierarchy, consistent patterns
- **Minimize Taps**: Critical actions accessible within 2 taps
- **Trust & Professionalism**: Medical-grade reliability
- **Calm Interface**: Reduce anxiety during waiting

---

## Design Tokens

### Color Palette

**Primary Colors:**

```css
:root {
  /* Primary - Teal (medical, trustworthy) */
  --color-primary-50: #F0FDFA;
  --color-primary-100: #CCFBF1;
  --color-primary-200: #99F6E4;
  --color-primary-300: #5EEAD4;
  --color-primary-400: #2DD4BF;
  --color-primary-500: #14B8A6;  /* Main primary */
  --color-primary-600: #0D9488;
  --color-primary-700: #0F766E;
  --color-primary-800: #115E59;
  --color-primary-900: #134E4A;

  /* Secondary - Navy Blue (professional) */
  --color-secondary-50: #F0F9FF;
  --color-secondary-100: #E0F2FE;
  --color-secondary-200: #BAE6FD;
  --color-secondary-300: #7DD3FC;
  --color-secondary-400: #38BDF8;
  --color-secondary-500: #0EA5E9;
  --color-secondary-600: #0284C7;
  --color-secondary-700: #0369A1;  /* Main secondary */
  --color-secondary-800: #075985;
  --color-secondary-900: #0C4A6E;

  /* Accent - Amber (attention, warnings) */
  --color-accent-50: #FFFBEB;
  --color-accent-100: #FEF3C7;
  --color-accent-200: #FDE68A;
  --color-accent-300: #FCD34D;
  --color-accent-400: #FBBF24;  /* Main accent */
  --color-accent-500: #F59E0B;
  --color-accent-600: #D97706;
  --color-accent-700: #B45309;
  --color-accent-800: #92400E;
  --color-accent-900: #78350F;
}
```

**Semantic Colors:**

```css
:root {
  /* Status Colors */
  --color-success: #10B981;  /* Green - completed, confirmed */
  --color-warning: #F59E0B;  /* Amber - almost turn, caution */
  --color-error: #EF4444;    /* Red - error, failed */
  --color-info: #3B82F6;     /* Blue - informational */

  /* Queue Status Colors */
  --color-waiting: #94A3B8;       /* Gray - waiting */
  --color-notified: #F59E0B;      /* Amber - almost turn */
  --color-in-consultation: #14B8A6; /* Teal - your turn */
  --color-completed: #10B981;     /* Green - done */
  --color-no-show: #EF4444;       /* Red - absent */

  /* Neutral Grays */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Background */
  --color-background: #FFFFFF;
  --color-background-secondary: #F9FAFB;
  --color-background-tertiary: #F3F4F6;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-text-inverse: #FFFFFF;
}
```

**Usage Examples:**

```typescript
// Tailwind CSS classes
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Appeler Suivant
</button>

<div className="bg-warning-50 border border-warning-400 text-warning-900">
  ⚠️ Presque votre tour!
</div>

<div className="bg-success-50 border border-success-400 text-success-900">
  ✅ Consultation terminée
</div>
```

### Typography

**Font Families:**

```css
:root {
  /* Latin Characters */
  --font-sans: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;

  /* Arabic Characters */
  --font-arabic: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;

  /* Monospace (for codes, IDs) */
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}

/* Font loading */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
```

**Type Scale:**

```css
:root {
  /* Font Sizes (using Tailwind scale) */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

**Typography Usage:**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | 3xl (30px) | Bold (700) | Tight (1.25) | Page titles |
| **H2** | 2xl (24px) | Semibold (600) | Snug (1.375) | Section headers |
| **H3** | xl (20px) | Semibold (600) | Normal (1.5) | Subsections |
| **Body** | base (16px) | Normal (400) | Relaxed (1.625) | Main text |
| **Body Small** | sm (14px) | Normal (400) | Normal (1.5) | Secondary text |
| **Caption** | xs (12px) | Normal (400) | Normal (1.5) | Labels, metadata |
| **Button** | sm (14px) | Medium (500) | Normal (1.5) | Buttons |
| **Label** | sm (14px) | Medium (500) | Normal (1.5) | Form labels |

### Spacing

**Spacing Scale (Tailwind):**

```css
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1_5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2_5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
}
```

**Common Spacing Patterns:**

- **Component Padding**: 4 (16px) or 6 (24px)
- **Section Gaps**: 8 (32px) or 12 (48px)
- **Card Padding**: 6 (24px)
- **Button Padding**: X: 6 (24px), Y: 3 (12px)
- **Stack Gap**: 4 (16px) between items

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px - inputs */
  --radius-DEFAULT: 0.5rem; /* 8px - cards, buttons */
  --radius-md: 0.75rem;   /* 12px - modals */
  --radius-lg: 1rem;      /* 16px - large cards */
  --radius-xl: 1.25rem;   /* 20px - special elements */
  --radius-full: 9999px;  /* Fully rounded (badges) */
}
```

### Shadows

```css
:root {
  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-DEFAULT: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Focus Ring */
  --shadow-focus: 0 0 0 3px rgba(20, 184, 166, 0.2); /* Primary color */
}
```

---

## Component Library

### Button

**Variants:**

1. **Primary** - Main actions
2. **Secondary** - Alternative actions
3. **Outline** - Tertiary actions
4. **Ghost** - Minimal prominence
5. **Danger** - Destructive actions

**Sizes:**
- Small: `px-4 py-2 text-sm`
- Medium: `px-6 py-3 text-base` (default)
- Large: `px-8 py-4 text-lg`

**Component Code:**

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        danger: 'bg-error text-white hover:bg-red-700 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

**Usage:**

```typescript
<Button variant="primary" size="md">
  Appeler Suivant
</Button>

<Button variant="outline" size="sm">
  Annuler
</Button>

<Button variant="danger">
  Supprimer
</Button>
```

### Card

**Variants:**

1. **Default** - Standard card
2. **Highlighted** - Current patient (bold border)
3. **Warning** - Almost turn (amber border)

**Component Code:**

```typescript
// components/ui/card.tsx
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'warning';
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const variantClasses = {
    default: 'border border-gray-200',
    highlighted: 'border-2 border-primary-500 shadow-md',
    warning: 'border-2 border-warning-400 bg-warning-50',
  };

  return (
    <div
      className={cn(
        'rounded-lg bg-white p-6',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
```

**Usage:**

```typescript
<Card variant="default">
  <h3>Patient Name</h3>
  <p>Position #3</p>
</Card>

<Card variant="highlighted">
  <h3>Current Patient</h3>
  <p>In Consultation</p>
</Card>

<Card variant="warning">
  <p>⚠️ Almost your turn!</p>
</Card>
```

### Badge

**Variants:** Status badges for queue statuses

```typescript
// components/ui/badge.tsx
export function Badge({ status }: { status: QueueStatus }) {
  const statusConfig = {
    WAITING: {
      label: 'En attente',
      className: 'bg-gray-100 text-gray-800',
    },
    NOTIFIED: {
      label: 'Notifié',
      className: 'bg-warning-100 text-warning-800',
    },
    IN_CONSULTATION: {
      label: 'En consultation',
      className: 'bg-primary-100 text-primary-800',
    },
    COMPLETED: {
      label: 'Terminé',
      className: 'bg-success-100 text-success-800',
    },
    NO_SHOW: {
      label: 'Absent',
      className: 'bg-error-100 text-error-800',
    },
    CANCELLED: {
      label: 'Annulé',
      className: 'bg-gray-100 text-gray-600',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  );
}
```

### Input

**Component Code:**

```typescript
// components/ui/input.tsx
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          className={cn(
            'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);
```

### Modal

**Component Code:**

```typescript
// components/ui/modal.tsx
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
```

---

## Layout Patterns

### Mobile-First Responsive

**Breakpoints:**

```css
/* Tailwind breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Layout Examples:**

```typescript
// Single column on mobile, 2 columns on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// Stack on mobile, sidebar on desktop
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="lg:w-64">{/* Sidebar */}</aside>
  <main className="flex-1">{/* Main content */}</main>
</div>
```

### Stack (Vertical Spacing)

```typescript
// components/ui/stack.tsx
export function Stack({ gap = 4, children }: { gap?: number; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-${gap}`}>
      {children}
    </div>
  );
}
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text (< 18pt): 4.5:1 minimum
- Large text (≥ 18pt): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Enter/Space activates buttons/links
- Escape closes modals/dropdowns
- Focus indicators visible (2px outline)

**Screen Reader Support:**

```typescript
// ARIA labels for icon-only buttons
<button aria-label="Appeler suivant patient">
  <PhoneIcon />
</button>

// ARIA live regions for updates
<div aria-live="polite" aria-atomic="true">
  Votre position: #3
</div>

// ARIA roles
<nav role="navigation">...</nav>
<main role="main">...</main>
```

**Focus Management:**

```typescript
// Trap focus in modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function Modal({ isOpen }: ModalProps) {
  const modalRef = useFocusTrap(isOpen);

  return <div ref={modalRef}>...</div>;
}
```

---

## RTL Support

### Arabic Layout

**Tailwind RTL Plugin:**

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
};
```

**RTL-Aware Spacing:**

```typescript
// Use logical properties (auto-flips for RTL)
<div className="ms-4">  {/* margin-inline-start: 1rem */}
<div className="me-4">  {/* margin-inline-end: 1rem */}
<div className="ps-4">  {/* padding-inline-start: 1rem */}
<div className="pe-4">  {/* padding-inline-end: 1rem */}

// DON'T use directional classes
<div className="ml-4"> {/* This won't flip for RTL */}
```

**Language Detection:**

```typescript
// Set document direction based on language
useEffect(() => {
  const isRTL = i18n.language === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

**RTL-Aware Components:**

```typescript
// Position icons based on direction
<Button>
  {isRTL ? <ArrowLeftIcon /> : <ArrowRightIcon />}
  {t('next')}
</Button>
```

---

## Responsive Breakpoints

### Mobile-First Strategy

**Default (< 640px): Mobile**
- Single column layouts
- Full-width components
- Collapsed navigation
- Large tap targets (min 44px × 44px)

**sm (≥ 640px): Small Tablets**
- 2-column grids where appropriate
- Slightly larger text

**md (≥ 768px): Tablets**
- Sidebar layouts appear
- Multi-column content
- Expanded navigation

**lg (≥ 1024px): Laptops**
- Full desktop layout
- 3+ column grids
- Side-by-side views

**Usage Example:**

```typescript
<div className="
  p-4           /* Mobile: 16px padding */
  md:p-6        /* Tablet: 24px padding */
  lg:p-8        /* Desktop: 32px padding */
  text-base     /* Mobile: 16px text */
  md:text-lg    /* Tablet: 18px text */
">
  Content
</div>
```

---

## Next Steps

- **Implementation**: See [15_Project_Phases.md](./15_Project_Phases.md) for component development timeline
- **Accessibility Testing**: See [12_Testing_Plan.md](./12_Testing_Plan.md#accessibility-testing)
- **Component Examples**: See wireframes.html for visual reference
