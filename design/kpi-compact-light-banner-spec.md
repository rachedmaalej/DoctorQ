# KPI Section — Compact Light Banner Implementation Spec

**Component:** `DashboardKpiStrip`
**Replaces:** Existing stat chips row in the OPEN and CLOSING screens of the receptionist mobile dashboard
**Screen context:** Appears below the top header bar, above the Quick-Add input row

---

## 1. Overview

The Compact Light Banner is a single white surface card with a left/right split layout. The primary metric ("En attente") is displayed as a bold dark number on the left, separated by a hairline divider. Two secondary metrics ("Vus" and "Fin estimée") stack vertically on the right. A small teal dot beneath the primary number provides a brand accent signal without adding height.

This component is intentionally compact — it is designed to minimize vertical space consumption in the dashboard while preserving hierarchy and scannability.

```
┌─────────────────────────────────────────────┐
│  En attente          │  2          │         │
│  4                   │  Vus        │         │
│  •                   │────────────│         │
│                      │  ~11:17     │         │
│                      │  Fin estimée│         │
└─────────────────────────────────────────────┘
```

---

## 2. File Location

```
apps/web/src/components/dashboard/DashboardKpiStrip.tsx
```

---

## 3. Design Tokens

Use the existing design system tokens already defined in the codebase. Do not hardcode any values.

```
Background:   --surface      (#FFFFFF)
Border:       --border       (#E8E6DF), 1.5px solid
Border radius: --radius      (12px)
Shadow:       0 1px 3px rgba(0,0,0,0.05)

Left/right divider:  --border  (#E8E6DF), 1.5px solid

Primary number color:  --text-primary   (#1A1A1A)
Secondary number color: --text-primary  (#1A1A1A)
Label color:            --text-tertiary (#9E9B90)

Accent dot color:  --accent  (#0F7B6C)
```

---

## 4. Layout & Spacing

**Card container:**
- `display: flex`
- `align-items: center`
- `padding: 8px 16px`  ← 8px vertical, 16px horizontal
- `margin: 0 20px 12px` ← matches the standard 20px horizontal content padding of the dashboard
- `border-radius: 12px`
- `border: 1.5px solid var(--border)`
- `background: var(--surface)`
- `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`

**Left section (`flex: 1`):**
- `display: flex`
- `align-items: center`
- `gap: 10px`
- `border-right: 1.5px solid var(--border)`
- `padding-right: 16px`
- `margin-right: 16px`

**Number block (inside left section):**
- `display: flex`
- `flex-direction: column`
- `gap: 1px`

**Right section:**
- `display: flex`
- `flex-direction: column`
- `gap: 6px`
- `min-width: 72px`

---

## 5. Typography — Exact Values

### Left side

| Element       | Font size | Font weight | Letter spacing | Color              | Notes                        |
|---------------|-----------|-------------|----------------|--------------------|------------------------------|
| Label         | 8px       | 600         | 0.08em         | `--text-tertiary`  | `text-transform: uppercase`  |
| Primary number| 28px      | 700         | -0.04em        | `--text-primary`   | `font-feature-settings: 'tnum'`, `line-height: 1` |
| Accent dot    | —         | —           | —              | `--accent`         | `width: 6px`, `height: 6px`, `border-radius: 50%`, `margin-top: 4px` |

### Right side (per metric row)

| Element         | Font size | Font weight | Letter spacing | Color             | Notes                       |
|-----------------|-----------|-------------|----------------|-------------------|-----------------------------|
| Secondary number| 15px      | 700         | -0.02em        | `--text-primary`  | `font-feature-settings: 'tnum'`, `line-height: 1` |
| Label           | 7px       | 600         | 0.06em         | `--text-tertiary` | `text-transform: uppercase` |

**Divider between right-side metrics:**
- `height: 1px`
- `background: var(--border)`

**Special case — "Fin estimée" value** (`~11:17`):
- Font size: `12px` (smaller than the "2" number, to fit the time format comfortably)
- All other properties identical to the secondary number row above

---

## 6. TypeScript Interface

```typescript
interface DashboardKpiStripProps {
  /** Number of patients currently waiting in queue */
  waitingCount: number;
  /** Number of patients seen today */
  seenCount: number;
  /** Estimated end time string, e.g. "~11:17". Null if not calculable. */
  estimatedEndTime: string | null;
  /** Controls label of primary metric: 'waiting' shows "En attente", 'remaining' shows "Restants" */
  mode: 'waiting' | 'remaining';
  /** Current locale for i18n */
  locale: 'fr' | 'ar';
}
```

---

## 7. Content Per Dashboard State

The component appears on two screens. The **only difference** between states is the label on the primary metric.

| Dashboard state | `mode` prop  | Primary label    | Primary value    |
|-----------------|--------------|------------------|------------------|
| `OPEN`          | `'waiting'`  | "En attente"     | `waitingCount`   |
| `CLOSING`       | `'remaining'`| "Restants"       | `waitingCount`   |

The right-side metrics (`seenCount`, `estimatedEndTime`) are identical across both states.

---

## 8. i18n Strings

Add the following keys to the translation files:

### French (`fr`)
```json
{
  "kpi.waiting_label": "En attente",
  "kpi.remaining_label": "Restants",
  "kpi.seen_label": "Vus",
  "kpi.estimated_end_label": "Fin estimée",
  "kpi.estimated_end_unavailable": "—"
}
```

### Arabic (`ar`)
```json
{
  "kpi.waiting_label": "في الانتظار",
  "kpi.remaining_label": "المتبقون",
  "kpi.seen_label": "تمّت رؤيتهم",
  "kpi.estimated_end_label": "وقت الانتهاء",
  "kpi.estimated_end_unavailable": "—"
}
```

---

## 9. RTL Behavior

When `locale === 'ar'`, the component must:

- Flip the layout direction: the **right section becomes the left section** (handled automatically by `dir="rtl"` on the document or parent)
- The border divider (currently `border-right` on the left section) should become `border-left` in RTL — either use `border-inline-end` as a logical CSS property, or conditionally swap the class
- Text is left-aligned in LTR, right-aligned in RTL — use logical properties (`text-align: start`) rather than `text-align: left`
- The accent dot position does not change (it is below the number, not directional)
- Font: IBM Plex Sans Arabic loads automatically via the font stack `'DM Sans', 'IBM Plex Sans Arabic', sans-serif` — no extra handling needed

**Recommended approach:** Use CSS logical properties throughout (`padding-inline-end`, `border-inline-end`, `margin-inline-end`) so RTL is handled with zero conditional logic.

---

## 10. Reference JSX Structure

```tsx
<div className="kpi-strip">

  {/* Left — primary metric */}
  <div className="kpi-left">
    <div className="kpi-num-block">
      <span className="kpi-label">
        {mode === 'waiting' ? t('kpi.waiting_label') : t('kpi.remaining_label')}
      </span>
      <span className="kpi-primary-value">
        {waitingCount}
      </span>
      <span className="kpi-accent-dot" aria-hidden="true" />
    </div>
  </div>

  {/* Right — secondary metrics */}
  <div className="kpi-right">

    <div className="kpi-secondary-row">
      <span className="kpi-secondary-value">{seenCount}</span>
      <span className="kpi-secondary-label">{t('kpi.seen_label')}</span>
    </div>

    <div className="kpi-divider" aria-hidden="true" />

    <div className="kpi-secondary-row">
      <span className="kpi-secondary-value kpi-time">
        {estimatedEndTime ?? t('kpi.estimated_end_unavailable')}
      </span>
      <span className="kpi-secondary-label">{t('kpi.estimated_end_label')}</span>
    </div>

  </div>

</div>
```

---

## 11. Accessibility

- The card is a purely presentational summary — wrap with `role="region"` and `aria-label` for screen reader context:
  ```tsx
  <div role="region" aria-label={t('kpi.region_label')}>
  ```
  Add to i18n: `"kpi.region_label": "Résumé de la file d'attente"` / `"ملخص قائمة الانتظار"`

- The accent dot is decorative — ensure it has `aria-hidden="true"`

- Number values should be readable by screen readers as plain numbers (no special handling needed — avoid wrapping in elements that would interrupt screen reader flow)

---

## 12. Integration Point

In the existing dashboard component tree, find the current stat chips row (the component rendering three equal chips with `waitingCount`, `seenCount`, `estimatedEndTime`) and **replace it entirely** with `<DashboardKpiStrip />`.

The stat chips currently appear on screens `OPEN` and `CLOSING` — the visibility logic for these two screens does not change. Only the visual treatment changes.

```tsx
// Before (in OPEN and CLOSING screen render):
<StatChipsRow
  waitingCount={stats.waitingCount}
  seenCount={stats.seenCount}
  estimatedEndTime={stats.estimatedEndTime}
/>

// After:
<DashboardKpiStrip
  waitingCount={stats.waitingCount}
  seenCount={stats.seenCount}
  estimatedEndTime={stats.estimatedEndTime}
  mode={queueStatus === 'CLOSING' ? 'remaining' : 'waiting'}
  locale={currentLocale}
/>
```

---

## 13. Do Not Change

The following are **out of scope** for this implementation. Do not modify them:

- The header bar (clinic name, language toggle, menu icon)
- The Quick-Add input row below the KPI strip
- The "En Consultation" patient card
- The queue list rows
- The floating "Appeler Suivant" CTA
- Any other screen (PRE_OPEN, ALL_DONE, CLOSED)
- The existing design token values in the CSS variables

---

## 14. Visual Reference

The approved design is documented in `kpi-final.html` (in the project root). Look at **"Variation 03 — Light Banner, Compact"** (right phone in the right column). The left phone in the same column shows the standard (taller) version — do not implement that one.
