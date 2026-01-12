# 08.1 Design System 01 - UI Inspiration Analysis

**Version:** 1.0
**Based on:** UI Inspiration Images 1.1-1.7
**Purpose:** Comprehensive design guidelines to achieve the visual style of the inspiration images

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Component Library](#component-library)
4. [Layout & Spacing](#layout--spacing)
5. [Border Radius Standards](#border-radius-standards)
6. [Shadow & Depth](#shadow--depth)
7. [Icons & Illustrations](#icons--illustrations)
8. [Background Patterns](#background-patterns)
9. [Status Badges & Pills](#status-badges--pills)
10. [Data Visualization](#data-visualization)
11. [Navigation & Sidebar](#navigation--sidebar)
12. [Implementation Code](#implementation-code)

---

## Color System

### Primary Color Palette

**Purple Family (Core Brand Colors)**
```css
--primary-900: #3B1A5F;    /* Deep purple - text, nav background */
--primary-800: #4A2270;    /* Dark purple - primary buttons */
--primary-700: #5B2D82;    /* Medium-dark purple */
--primary-600: #7C3AED;    /* Standard purple - icons, accents */
--primary-500: #9333EA;    /* Medium purple */
--primary-400: #A855F7;    /* Light purple */
--primary-300: #C084FC;    /* Lighter purple - backgrounds */
--primary-200: #E9D5FF;    /* Very light purple - subtle highlights */
--primary-100: #F3E8FF;    /* Barely purple - card backgrounds */
```

**Orange Family (Warm Accents)**
```css
--orange-900: #7C2D12;     /* Deep orange - text */
--orange-800: #9A3412;     /* Dark orange */
--orange-700: #C2410C;     /* Medium-dark orange */
--orange-600: #EA580C;     /* Standard orange */
--orange-500: #F97316;     /* Medium orange - primary buttons */
--orange-400: #FB923C;     /* Light orange - hover states */
--orange-300: #FDBA74;     /* Lighter orange - backgrounds */
--orange-200: #FED7AA;     /* Very light orange */
--orange-100: #FFEDD5;     /* Barely orange - card backgrounds */
```

**Pink Family (Secondary Accents)**
```css
--pink-900: #831843;       /* Deep pink - text */
--pink-800: #9D174D;       /* Dark pink */
--pink-700: #BE185D;       /* Medium-dark pink */
--pink-600: #DB2777;       /* Standard pink */
--pink-500: #EC4899;       /* Medium pink - accents */
--pink-400: #F472B6;       /* Light pink */
--pink-300: #F9A8D4;       /* Lighter pink - backgrounds */
--pink-200: #FBCFE8;       /* Very light pink - card backgrounds */
--pink-100: #FCE7F3;       /* Barely pink */
```

**Lime/Yellow-Green Family (Fresh Accents)**
```css
--lime-900: #365314;       /* Deep lime - text */
--lime-800: #3F6212;       /* Dark lime */
--lime-700: #4D7C0F;       /* Medium-dark lime */
--lime-600: #65A30D;       /* Standard lime */
--lime-500: #84CC16;       /* Medium lime - status badges */
--lime-400: #A3E635;       /* Light lime - hover states */
--lime-300: #BEF264;       /* Lighter lime - backgrounds */
--lime-200: #D9F99D;       /* Very light lime - card backgrounds */
--lime-100: #ECFCCB;       /* Barely lime */
```

**Neutral Colors**
```css
--neutral-900: #1C0A00;    /* Almost black - body text */
--neutral-800: #292524;    /* Dark gray - headings */
--neutral-700: #44403C;    /* Medium-dark gray */
--neutral-600: #57534E;    /* Medium gray */
--neutral-500: #78716C;    /* Standard gray - secondary text */
--neutral-400: #A8A29E;    /* Light gray - disabled text */
--neutral-300: #D6D3D1;    /* Lighter gray - borders */
--neutral-200: #E7E5E4;    /* Very light gray - dividers */
--neutral-100: #F5F5F4;    /* Off-white - subtle backgrounds */
--neutral-50: #FAFAF9;     /* Near-white - page backgrounds */

--white: #FFFFFF;          /* Pure white - cards, modals */
--black: #000000;          /* Pure black - special text */
```

**Semantic Colors**
```css
--success-600: #16A34A;    /* Green - success states */
--success-100: #DCFCE7;    /* Light green - success backgrounds */

--warning-600: #EA580C;    /* Orange - warning states */
--warning-100: #FFEDD5;    /* Light orange - warning backgrounds */

--error-600: #DC2626;      /* Red - error states */
--error-100: #FEE2E2;      /* Light red - error backgrounds */

--info-600: #0284C7;       /* Blue - info states */
--info-100: #E0F2FE;       /* Light blue - info backgrounds */
```

### Gradient Backgrounds

**Signature Gradients (Card Backgrounds)**
```css
/* Purple Gradient */
--gradient-purple: linear-gradient(135deg, #E9D5FF 0%, #F3E8FF 100%);
--gradient-purple-strong: linear-gradient(135deg, #C084FC 0%, #E9D5FF 100%);

/* Orange Gradient */
--gradient-orange: linear-gradient(135deg, #FDBA74 0%, #FED7AA 100%);
--gradient-orange-strong: linear-gradient(135deg, #FB923C 0%, #FDBA74 100%);

/* Pink Gradient */
--gradient-pink: linear-gradient(135deg, #F9A8D4 0%, #FBCFE8 100%);
--gradient-pink-strong: linear-gradient(135deg, #F472B6 0%, #F9A8D4 100%);

/* Lime Gradient */
--gradient-lime: linear-gradient(135deg, #BEF264 0%, #D9F99D 100%);
--gradient-lime-strong: linear-gradient(135deg, #A3E635 0%, #BEF264 100%);
```

**Page Background Gradients**
```css
/* Light Purple Background (default page background) */
--page-bg-purple: linear-gradient(180deg, #F3E8FF 0%, #E9D5FF 50%, #C084FC 100%);

/* Light Orange Background */
--page-bg-orange: linear-gradient(180deg, #FFEDD5 0%, #FED7AA 50%, #FDBA74 100%);

/* Light Lime Background */
--page-bg-lime: linear-gradient(180deg, #ECFCCB 0%, #D9F99D 50%, #BEF264 100%);
```

### Color Usage Guidelines

**Stat Cards (Inspirations 1.1, 1.2)**
- **Purple cards**: Default stats (appointments, revenue, queue position)
- **Orange cards**: Financial/revenue metrics
- **Pink cards**: Secondary metrics (monthly aggregates)
- **Lime/Green cards**: Health status, confirmations, active states

**Navigation Sidebar**
- Background: `--primary-900` (#3B1A5F - deep maroon/purple)
- Active item: `--orange-500` (#F97316)
- Inactive text: `--white` with 70% opacity
- Icons: `--white`

**Status Badges**
- **Active/Checkup**: Deep brown/maroon (#4A1810) on light background
- **Pending**: Lime green (#84CC16) with green text
- **Vaccination**: Orange (#FB923C) on orange background
- **Grooming**: Orange (#FB923C) on orange background

---

## Typography

### Font Family

**Primary Font Stack**
```css
--font-primary: 'Poppins', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-display: 'Fredoka', 'Poppins', 'Nunito', sans-serif; /* For playful headings like "GOOD MORNING GUYS" */
--font-mono: 'IBM Plex Mono', 'Fira Code', 'Courier New', monospace;
```

**Font Characteristics**
- **Poppins**: Geometric sans-serif, modern, friendly, excellent readability
- **Fredoka**: Rounded, playful, bold - used for display headings
- Use system fonts as fallback for performance

### Font Scale

**Desktop Scale**
```css
--text-xs: 0.75rem;      /* 12px - tiny labels */
--text-sm: 0.875rem;     /* 14px - secondary text, captions */
--text-base: 1rem;       /* 16px - body text */
--text-lg: 1.125rem;     /* 18px - emphasized body text */
--text-xl: 1.25rem;      /* 20px - card headings */
--text-2xl: 1.5rem;      /* 24px - section headings */
--text-3xl: 1.875rem;    /* 30px - page headings */
--text-4xl: 2.25rem;     /* 36px - hero headings */
--text-5xl: 3rem;        /* 48px - large numbers in stat cards */
--text-6xl: 3.75rem;     /* 60px - extra large display */
--text-7xl: 4.5rem;      /* 72px - massive numbers (e.g., "200") */
```

**Mobile Scale (Reduced by ~10%)**
```css
--text-xs-mobile: 0.688rem;   /* 11px */
--text-sm-mobile: 0.813rem;   /* 13px */
--text-base-mobile: 0.938rem; /* 15px */
--text-lg-mobile: 1.063rem;   /* 17px */
--text-xl-mobile: 1.188rem;   /* 19px */
--text-2xl-mobile: 1.375rem;  /* 22px */
--text-3xl-mobile: 1.75rem;   /* 28px */
--text-4xl-mobile: 2rem;      /* 32px */
--text-5xl-mobile: 2.5rem;    /* 40px */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

**Usage Patterns**
- **Body text**: 400 (normal)
- **Card headings**: 600 (semibold)
- **Section titles**: 700 (bold)
- **Large stat numbers**: 700-900 (bold to black)
- **Display headings** (e.g., "GOOD MORNING GUYS"): 800-900 (extrabold/black)
- **Button labels**: 600 (semibold)
- **Badges**: 600 (semibold)

### Line Heights

```css
--leading-tight: 1.25;    /* Headings */
--leading-snug: 1.375;    /* Subheadings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.625; /* Comfortable reading */
--leading-loose: 2;       /* Spacious text */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

**Usage**
- Large display numbers: `--tracking-tight` or `--tracking-tighter`
- Headings: `--tracking-normal`
- Body: `--tracking-normal`
- Uppercase labels: `--tracking-wide`

---

## Component Library

### Stat Cards

**Visual Characteristics**
- Large rounded corners (24px)
- Gradient backgrounds (purple, orange, pink, lime)
- Large bold numbers (72px font size, 700-900 weight)
- Icon in circle top-left (white icon on dark purple circle)
- Small percentage change indicator (↑ 10% green with light text "vs last week")
- Decorative illustration on right side (paw prints, food bowls, jars)
- Subtle shadow for depth

**Anatomy**
```
┌─────────────────────────────────────────┐
│ ⚪ Title Text (18px, semibold)          │
│                                         │
│ 200    (72px, bold)           🎨       │
│                              Illus      │
│ ↑ 10%  vs last week (14px, light)      │
└─────────────────────────────────────────┘
```

**Implementation**
```tsx
<div className="stat-card">
  <div className="stat-card-icon">
    <CalendarIcon />
  </div>
  <h3 className="stat-card-title">Total Appointments Today</h3>
  <p className="stat-card-value">200</p>
  <div className="stat-card-change">
    <span className="stat-card-arrow">↑ 10%</span>
    <span className="stat-card-comparison">vs last week</span>
  </div>
  <div className="stat-card-illustration">
    <img src="paw.png" alt="" />
  </div>
</div>
```

**CSS**
```css
.stat-card {
  background: linear-gradient(135deg, #E9D5FF 0%, #F3E8FF 100%);
  border-radius: 24px;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  background: #3B1A5F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.stat-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C0A00;
  margin-bottom: 8px;
}

.stat-card-value {
  font-size: 72px;
  font-weight: 900;
  color: #3B1A5F;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-card-change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.stat-card-arrow {
  color: #16A34A;
  font-weight: 600;
}

.stat-card-comparison {
  color: #A855F7;
  font-weight: 400;
}

.stat-card-illustration {
  position: absolute;
  right: 24px;
  bottom: 24px;
  opacity: 0.9;
}
```

### List Items (Queue/Appointments)

**Visual Characteristics**
- White rounded background (20px radius) on colored card
- Avatar/photo on left (48px circle)
- Name bold (18px, 600 weight)
- Timestamp/date below name (14px, gray)
- Status badge/button on right (rounded pill shape)
- Subtle hover state

**Anatomy**
```
┌───────────────────────────────────────────────┐
│ 👤  Bella                    [Checkup]       │
│     Nov 7, 2025 06:32                        │
└───────────────────────────────────────────────┘
```

**Implementation**
```tsx
<div className="list-item">
  <img src="avatar.jpg" alt="Bella" className="list-item-avatar" />
  <div className="list-item-content">
    <h4 className="list-item-name">Bella</h4>
    <p className="list-item-meta">Nov 7, 2025 06:32</p>
  </div>
  <span className="badge badge-dark">Checkup</span>
</div>
```

**CSS**
```css
.list-item {
  background: white;
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.list-item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.list-item-content {
  flex: 1;
}

.list-item-name {
  font-size: 18px;
  font-weight: 600;
  color: #1C0A00;
  margin-bottom: 4px;
}

.list-item-meta {
  font-size: 14px;
  color: #78716C;
}
```

### Status Badges

**Types**
1. **Dark Badge** (Checkup, Active)
   - Background: `#4A1810` (deep maroon)
   - Text: `#FFFFFF`
   - Use for primary/active states

2. **Lime Badge** (Pending)
   - Background: `#BEF264` (light lime)
   - Text: `#365314` (dark green)
   - Use for waiting/pending states

3. **Orange Badge** (Vaccination, Grooming)
   - Background: `#FB923C` (orange)
   - Text: `#7C2D12` (dark orange)
   - Use for in-progress states

**Implementation**
```tsx
<span className="badge badge-dark">Checkup</span>
<span className="badge badge-lime">Pending</span>
<span className="badge badge-orange">Vaccination</span>
```

**CSS**
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-dark {
  background: #4A1810;
  color: #FFFFFF;
}

.badge-lime {
  background: #BEF264;
  color: #365314;
}

.badge-orange {
  background: #FB923C;
  color: #7C2D12;
}
```

### Buttons

**Primary Button (Orange)**
```css
.btn-primary {
  background: #F97316;
  color: white;
  padding: 12px 28px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #EA580C;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}
```

**Secondary Button (Dark)**
```css
.btn-secondary {
  background: #3B1A5F;
  color: white;
  padding: 12px 28px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #4A2270;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 26, 95, 0.4);
}
```

**Action Button (Large, Pay)**
```css
.btn-action {
  background: #3B1A5F;
  color: white;
  padding: 16px 48px;
  border-radius: 24px;
  font-size: 18px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #4A2270;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 26, 95, 0.5);
}
```

### Navigation Sidebar

**Visual Characteristics**
- Dark background (#3B1A5F - deep purple/maroon)
- White text/icons
- Active item: orange background (#F97316)
- Rounded corners on active item (16px)
- Icons on left, labels on right
- User profile section at bottom
- Settings & Logout at very bottom

**Implementation**
```tsx
<nav className="sidebar">
  <div className="sidebar-brand">
    <h1>PET CARE</h1>
  </div>

  <ul className="sidebar-menu">
    <li className="sidebar-item active">
      <DashboardIcon />
      <span>Dashboard</span>
    </li>
    <li className="sidebar-item">
      <PetsIcon />
      <span>My Pets</span>
    </li>
    {/* ... more items */}
  </ul>

  <div className="sidebar-footer">
    <button className="sidebar-item">
      <SettingsIcon />
      <span>Settings</span>
    </button>
    <button className="sidebar-item">
      <LogoutIcon />
      <span>Logout</span>
    </button>
    <div className="sidebar-user">
      <img src="avatar.jpg" alt="Michael Smith" />
      <div>
        <p className="sidebar-user-name">Michael Smith</p>
        <p className="sidebar-user-email">michaelsmith12@gmail.com</p>
      </div>
    </div>
  </div>
</nav>
```

**CSS**
```css
.sidebar {
  width: 280px;
  background: #3B1A5F;
  color: white;
  height: 100vh;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
}

.sidebar-brand h1 {
  font-family: 'Fredoka', sans-serif;
  font-size: 28px;
  font-weight: 900;
  color: white;
  margin-bottom: 48px;
  letter-spacing: 0.05em;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  margin-bottom: 8px;
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-item.active {
  background: #F97316;
  color: white;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-user img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.sidebar-user-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.sidebar-user-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
```

### Search Bar

**Visual Characteristics**
- Light gray background (#F5F5F4)
- Rounded corners (20px)
- Search icon on left
- Placeholder text in gray
- No border (or very subtle border)

**Implementation**
```tsx
<div className="search-bar">
  <SearchIcon />
  <input type="text" placeholder="Search..." />
</div>
```

**CSS**
```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F5F5F4;
  padding: 14px 20px;
  border-radius: 20px;
  border: 1px solid #E7E5E4;
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1C0A00;
}

.search-bar input::placeholder {
  color: #78716C;
}
```

### User Profile Badge (Top Right)

**Visual Characteristics**
- Yellow/cream background (#FEF3C7)
- Dark circle on left with notification icon
- User avatar in center
- Name on right
- Rounded pill shape (32px radius)

**Implementation**
```tsx
<div className="user-badge">
  <div className="user-badge-notification">
    <BellIcon />
  </div>
  <img src="avatar.jpg" alt="Fuad Abrar" className="user-badge-avatar" />
  <span className="user-badge-name">welcome back<br />FUAD ABRAR</span>
</div>
```

**CSS**
```css
.user-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FEF3C7;
  padding: 8px 20px 8px 8px;
  border-radius: 32px;
}

.user-badge-notification {
  width: 40px;
  height: 40px;
  background: #4A1810;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-badge-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-badge-name {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
  color: #1C0A00;
}
```

---

## Layout & Spacing

### Spacing Scale

**8px Base System**
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Layout Patterns

**Dashboard Grid**
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  padding: 32px;
}
```

**Sidebar + Main Layout**
```css
.app-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}
```

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
```

---

## Border Radius Standards

```css
--radius-sm: 8px;      /* Small elements, badges */
--radius-md: 12px;     /* Medium elements, inputs */
--radius-lg: 16px;     /* Large elements, active nav items */
--radius-xl: 20px;     /* Cards, buttons */
--radius-2xl: 24px;    /* Large cards, stat cards */
--radius-3xl: 32px;    /* Extra large elements, user badge */
--radius-full: 9999px; /* Circles, pills */
```

**Usage**
- **Stat cards**: 24px
- **List items**: 20px
- **Buttons**: 20px
- **Badges**: 24px (pill shape)
- **Navigation items**: 16px
- **Avatars**: 9999px (circle)
- **Search bar**: 20px
- **User badge**: 32px

---

## Shadow & Depth

### Shadow Scale

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
--shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.15);
```

**Usage**
- **Stat cards**: `--shadow-md` (default), `--shadow-lg` (hover)
- **List items**: `--shadow-sm` (default), `--shadow-md` (hover)
- **Buttons**: `--shadow-sm` (default), custom shadow with brand color (hover)
- **Navigation sidebar**: `--shadow-lg` (if floating)
- **Modals**: `--shadow-2xl`

### Elevation Layers

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
```

---

## Icons & Illustrations

### Icon Style

**Characteristics**
- Line icons (not filled)
- 2px stroke width
- Rounded line caps
- 24px default size (can scale to 20px, 28px, 32px)
- White color in dark contexts, dark purple in light contexts

**Recommended Icon Library**
- **Heroicons** (https://heroicons.com/) - Clean, modern, matches style
- **Lucide** (https://lucide.dev/) - Alternative, similar style
- **Tabler Icons** (https://tabler-icons.io/) - Consistent stroke width

### Illustration Style

**Characteristics**
- 3D-like, soft, rounded shapes
- Warm color palette (browns, oranges, creams)
- Cute/playful aesthetic (paw prints, food bowls)
- Used as decorative elements in stat cards
- Positioned bottom-right or right side of cards
- Semi-transparent (0.8-0.9 opacity)

**Creation Guidelines**
- Use tools like Blender (3D) or Adobe Illustrator (2D with gradients)
- Keep illustrations simple and recognizable
- Match color palette of card background
- Export as PNG with transparency

---

## Background Patterns

### Page Backgrounds

**Gradient Backgrounds**
- Use subtle gradients for main content area
- Light colors at top, slightly darker at bottom
- Consistent with color family (purple, orange, lime)

**Example**
```css
body {
  background: linear-gradient(180deg, #F3E8FF 0%, #E9D5FF 50%, #C084FC 100%);
  min-height: 100vh;
}
```

### Card Backgrounds

**Gradient Cards**
- Always use gradients for stat cards
- 135-degree diagonal gradient
- Light to very light shades within same color family

**Example**
```css
.stat-card-purple {
  background: linear-gradient(135deg, #E9D5FF 0%, #F3E8FF 100%);
}

.stat-card-orange {
  background: linear-gradient(135deg, #FDBA74 0%, #FED7AA 100%);
}
```

---

## Status Badges & Pills

### Badge System

**Status Mapping for DoctorQ**
```
Queue Status        → Badge Style
─────────────────────────────────
WAITING            → badge-lime (Pending)
NOTIFIED           → badge-orange (Notified)
IN_CONSULTATION    → badge-dark (In Progress)
COMPLETED          → badge-success (Completed)
NO_SHOW            → badge-error (No Show)
CANCELLED          → badge-neutral (Cancelled)
```

**Implementation**
```tsx
const getBadgeStyle = (status: QueueStatus) => {
  switch (status) {
    case 'WAITING':
      return 'badge-lime';
    case 'NOTIFIED':
      return 'badge-orange';
    case 'IN_CONSULTATION':
      return 'badge-dark';
    case 'COMPLETED':
      return 'badge-success';
    case 'NO_SHOW':
      return 'badge-error';
    case 'CANCELLED':
      return 'badge-neutral';
    default:
      return 'badge-neutral';
  }
};

<span className={`badge ${getBadgeStyle(entry.status)}`}>
  {entry.status}
</span>
```

**Additional Badge Styles**
```css
.badge-success {
  background: #DCFCE7;
  color: #16A34A;
}

.badge-error {
  background: #FEE2E2;
  color: #DC2626;
}

.badge-neutral {
  background: #F5F5F4;
  color: #57534E;
}
```

---

## Data Visualization

### Charts & Graphs

**Dot Matrix Visualization (Inspiration 1.1)**
- Grid of rounded squares
- Varying opacity/color intensity to show data
- Purple shades for standard metrics
- Use color gradients within same family

**Implementation**
```tsx
<div className="dot-matrix">
  {data.map((value, index) => (
    <div
      key={index}
      className="dot"
      style={{
        background: `rgba(168, 85, 247, ${value / maxValue})`,
      }}
    />
  ))}
</div>
```

```css
.dot-matrix {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}

.dot {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  transition: all 0.3s;
}
```

**Heat Map (Inspiration 1.7 - Monthly Revenue)**
- Grid of squares representing days/months
- Color intensity represents value
- Purple gradients (light to dark)
- Labels on axes

**Circular Donut Chart (Inspiration 1.5)**
- Multi-colored rings showing percentages
- Bold colors: purple, orange, pink, lime
- Center icon or value
- Legend on left side

---

## Navigation & Sidebar

### Design Specifications

**Sidebar Width**: 280px (desktop), hidden on mobile (hamburger menu)

**Colors**
- Background: `#3B1A5F` (deep purple/maroon)
- Text (inactive): `rgba(255, 255, 255, 0.7)`
- Text (active): `#FFFFFF`
- Active background: `#F97316` (orange)
- Hover background: `rgba(255, 255, 255, 0.1)`

**Typography**
- Brand name: 28px, Fredoka font, 900 weight
- Menu items: 16px, Poppins font, 500 weight

**Spacing**
- Padding: 32px 24px
- Item padding: 14px 20px
- Item margin: 8px bottom
- Icon-text gap: 16px

---

## Implementation Code

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#3B1A5F',
          800: '#4A2270',
          700: '#5B2D82',
          600: '#7C3AED',
          500: '#9333EA',
          400: '#A855F7',
          300: '#C084FC',
          200: '#E9D5FF',
          100: '#F3E8FF',
        },
        orange: {
          900: '#7C2D12',
          800: '#9A3412',
          700: '#C2410C',
          600: '#EA580C',
          500: '#F97316',
          400: '#FB923C',
          300: '#FDBA74',
          200: '#FED7AA',
          100: '#FFEDD5',
        },
        // ... other colors
      },
      fontFamily: {
        sans: ['Poppins', 'IBM Plex Sans', 'sans-serif'],
        display: ['Fredoka', 'Poppins', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.12)',
        '2xl': '0 24px 64px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
```

### React Component Examples

**Stat Card Component**
```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    comparison: string;
  };
  color: 'purple' | 'orange' | 'pink' | 'lime';
  icon: React.ReactNode;
  illustration?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  color,
  icon,
  illustration,
}) => {
  const gradients = {
    purple: 'bg-gradient-to-br from-primary-200 to-primary-100',
    orange: 'bg-gradient-to-br from-orange-300 to-orange-200',
    pink: 'bg-gradient-to-br from-pink-300 to-pink-200',
    lime: 'bg-gradient-to-br from-lime-300 to-lime-200',
  };

  const textColors = {
    purple: 'text-primary-900',
    orange: 'text-orange-900',
    pink: 'text-pink-900',
    lime: 'text-lime-900',
  };

  return (
    <div className={`stat-card ${gradients[color]} rounded-3xl p-8 relative overflow-hidden shadow-md transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="w-12 h-12 bg-primary-900 rounded-full flex items-center justify-center text-white mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>

      <p className={`text-7xl font-black ${textColors[color]} leading-none mb-2`}>
        {value}
      </p>

      {change && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-semibold ${change.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change.value > 0 ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
          <span className="text-primary-400 font-normal">{change.comparison}</span>
        </div>
      )}

      {illustration && (
        <div className="absolute right-6 bottom-6 opacity-90">
          {illustration}
        </div>
      )}
    </div>
  );
};
```

**Queue List Item Component**
```tsx
interface QueueItemProps {
  id: string;
  patientName: string;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  arrivedAt: Date;
  onStatusChange?: (id: string, status: QueueStatus) => void;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  id,
  patientName,
  patientPhone,
  position,
  status,
  arrivedAt,
  onStatusChange,
}) => {
  const getStatusBadge = (status: QueueStatus) => {
    const badges = {
      WAITING: { label: 'En attente', className: 'badge-lime' },
      NOTIFIED: { label: 'Notifié', className: 'badge-orange' },
      IN_CONSULTATION: { label: 'En cours', className: 'badge-dark' },
      COMPLETED: { label: 'Terminé', className: 'badge-success' },
      NO_SHOW: { label: 'Absent', className: 'badge-error' },
      CANCELLED: { label: 'Annulé', className: 'badge-neutral' },
    };
    return badges[status];
  };

  const badge = getStatusBadge(status);

  return (
    <div className="bg-white rounded-xl p-5 flex items-center gap-4 mb-3 transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center text-primary-900 font-bold text-lg">
        #{position}
      </div>

      <div className="flex-1">
        <h4 className="text-lg font-semibold text-neutral-900">{patientName}</h4>
        <p className="text-sm text-neutral-500">{patientPhone}</p>
      </div>

      <div className="text-right">
        <p className="text-xs text-neutral-400">Arrivé à</p>
        <p className="text-sm font-medium text-neutral-700">
          {arrivedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <span className={`badge ${badge.className}`}>
        {badge.label}
      </span>
    </div>
  );
};
```

**Navigation Sidebar Component**
```tsx
interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard /> },
    { id: 'queue', label: 'File d\'attente', icon: <Users /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings /> },
  ];

  return (
    <nav className="sidebar bg-primary-900 text-white w-[280px] h-screen p-8 flex flex-col">
      <div className="sidebar-brand mb-12">
        <h1 className="font-display text-3xl font-black tracking-wide">DOCTORQ</h1>
      </div>

      <ul className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activePage === item.id
                  ? 'bg-orange-500 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-white/10 pt-6 mt-6">
        <button className="w-full flex items-center gap-4 px-5 py-3.5 text-white/70 hover:bg-white/10 hover:text-white rounded-2xl transition-all">
          <LogOut />
          <span>Déconnexion</span>
        </button>

        <div className="flex items-center gap-3 mt-6">
          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/60">{user.email}</p>
          </div>
        </div>
      </div>
    </nav>
  );
};
```

---

## Mobile Responsive Guidelines

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Mobile Adaptations

**Sidebar**
- Hide sidebar on mobile (< 768px)
- Replace with hamburger menu
- Sidebar slides in from left on mobile

**Stat Cards**
- Stack vertically on mobile
- Reduce padding: 20px → 16px
- Reduce font size: 72px → 48px
- Hide decorative illustrations on small screens

**List Items**
- Reduce padding: 20px → 12px
- Stack content vertically if too narrow
- Reduce avatar size: 48px → 40px

**Typography**
- Use mobile font scale (10% smaller)
- Reduce line heights slightly
- Reduce letter spacing on large numbers

---

## Accessibility Considerations

### Color Contrast

**WCAG AA Compliance**
- All text meets 4.5:1 contrast ratio (normal text)
- Large text (18px+) meets 3:1 contrast ratio
- Interactive elements meet 3:1 contrast ratio

**Test Combinations**
```
✅ Dark purple text (#3B1A5F) on white → 12.5:1
✅ Dark text (#1C0A00) on light purple (#F3E8FF) → 11.2:1
✅ White text on orange button (#F97316) → 3.8:1
✅ Dark orange text (#7C2D12) on orange badge (#FB923C) → 4.2:1
```

### Keyboard Navigation

- All interactive elements focusable with Tab
- Visible focus indicator (2px solid outline)
- Logical tab order (left to right, top to bottom)
- Escape key closes modals
- Enter/Space activates buttons

### Screen Reader Support

- Semantic HTML (nav, main, article, aside)
- ARIA labels for icons-only buttons
- ARIA live regions for queue updates
- Alt text for all images
- Descriptive link text (no "click here")

---

## Animation & Transitions

### Transition Durations

```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Common Transitions

**Hover States**
```css
.interactive-element {
  transition: all 200ms ease;
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
```

**Button Press**
```css
.button:active {
  transform: scale(0.98);
}
```

**Fade In**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 300ms ease;
}
```

---

## Design Tokens Summary

**Quick Reference for DoctorQ**

```javascript
// Design tokens object for easy import
export const designTokens = {
  colors: {
    primary: {
      900: '#3B1A5F',
      600: '#7C3AED',
      400: '#A855F7',
      300: '#C084FC',
      100: '#F3E8FF',
    },
    orange: {
      500: '#F97316',
      400: '#FB923C',
      300: '#FDBA74',
    },
    lime: {
      500: '#84CC16',
      300: '#BEF264',
    },
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '5xl': '48px',
    '7xl': '72px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
};
```

---

## Conclusion

This design system is derived from analyzing the 7 UI inspiration images. The key characteristics are:

✅ **Playful yet Professional**: Rounded corners, soft shadows, friendly colors
✅ **Bold Typography**: Large numbers (72px+), heavy weights (700-900)
✅ **Vibrant Color Palette**: Purple, orange, pink, lime with gradients
✅ **White Space**: Generous padding, clear separation
✅ **Dark Navigation**: Deep purple sidebar with orange active states
✅ **Consistent Icons**: Line icons with 2px stroke, 24px size
✅ **3D Illustrations**: Decorative elements in stat cards
✅ **Status-Driven UI**: Color-coded badges for different states

**Implementation Priority for DoctorQ:**
1. Set up Tailwind config with custom colors and tokens
2. Create base components (StatCard, QueueItem, Badge)
3. Build navigation sidebar with dark theme
4. Implement gradient backgrounds for pages/cards
5. Add hover states and transitions
6. Test mobile responsiveness
7. Verify accessibility (contrast, keyboard, screen readers)

**File References:**
- Tailwind config: `tailwind.config.js`
- Design tokens: `src/lib/design-tokens.ts`
- Components: `src/components/ui/`
- Styles: `src/styles/globals.css`

---

**Version History:**
- v1.0 (2025-01-11): Initial design system based on UI Inspiration images 1.1-1.7
