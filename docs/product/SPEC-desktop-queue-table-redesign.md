# SPEC: Desktop Queue Table Redesign
**Target:** Doctor/Receptionist desktop view — `File d'attente` section  
**Scope:** Visual redesign of the queue table + new surrounding UI elements  
**Does NOT change:** Backend API, socket events, mobile dashboard, routing, auth

---

## 1. Context & Files to Modify

The desktop queue view currently lives in:

```
web/src/pages/DashboardPage.tsx          ← main entry, conditionally renders desktop/mobile
web/src/components/QueueList.tsx         ← current table/list implementation (REPLACE)
web/src/stores/queueStore.ts             ← existing Zustand store (READ ONLY — no changes)
web/src/i18n/fr.json                     ← add new keys here
web/src/i18n/ar.json                     ← add mirrored keys here (RTL)
```

**New files to create:**

```
web/src/components/desktop/QueueStatsBar.tsx
web/src/components/desktop/QueueTableHeader.tsx
web/src/components/desktop/QueueTableRow.tsx
web/src/components/desktop/PatientContextMenu.tsx
web/src/components/desktop/CallNextBar.tsx
web/src/hooks/useQueueFilter.ts
```

The existing `QueueList.tsx` should be kept but will no longer be rendered on desktop — the new `QueueTableRow` takes its place. `DashboardPage.tsx` should render the new components when `!isMobile`.

---

## 2. Design Tokens

Do **not** add new CSS variables. Map everything to the existing design system tokens already defined in `tailwind.config.js` or global CSS. Use these exact values:

```
Background:       #EAECE6   (bg-[#EAECE6])
Surface:          #FFFFFF   (bg-white)
Surface-2:        #F4F5F1   (bg-[#F4F5F1])
Primary teal:     #356B58   (text-[#356B58] / bg-[#356B58])
Forest (CTA/dark):#1B2D25   (text-[#1B2D25] / bg-[#1B2D25])
Text secondary:   #5C6B62
Text muted:       #94A49A
Border:           #DDE2DC
Orange:           #E07B39   (wait > 20 min)
Orange-bg:        #FDF1E8
Red:              #C0392B   (wait > 40 min / destructive)
Red-bg:           #FDEEEC
Green:            #2D7A5A   (wait < 20 min / call action)
Green-bg:         #E8F5EE
Purple:           #7C5CBF   (notified status)
Purple-bg:        #F0ECFB
Amber:            #B07A1C   (alert chip)
Amber-bg:         #FBF4E3
```

**Typography:** DM Sans (all UI text). DM Mono (position numbers, phone numbers).  
**Icons:** Material Symbols Outlined only — no emojis anywhere.  
**Border radius:** `rounded-md` = 10px, `rounded-lg` = 14px, `rounded-full` = 9999px.

---

## 3. TypeScript Interfaces

Derive from the existing `QueueEntry` type in the store. The table needs the following fields — all should already exist on the type; do not add new fields to the backend:

```typescript
// Extend or alias the existing QueueEntry for display purposes
interface QueueTableEntry {
  id: string;
  position: number;                         // display position in queue (1-indexed)
  patientName: string;
  appointmentType: 'walk-in' | 'appointment'; // map from existing field
  arrivedAt: Date;                           // for arrival time display
  waitMinutes: number;                       // computed: now - arrivedAt in minutes
  etaMinutes: number | null;                 // estimated minutes until consultation
  phoneNumber: string | null;
  status: 'WAITING' | 'NOTIFIED' | 'IN_CONSULTATION';
  notificationSent: boolean;                 // whether a WhatsApp/position link was sent
  isUrgent: boolean;                         // emergency flag already in schema
}

// Urgency tier derived from waitMinutes — computed in the component, not stored
type UrgencyTier = 'ok' | 'high' | 'critical';
// ok:       waitMinutes < 20
// high:     20 ≤ waitMinutes < 40
// critical: waitMinutes ≥ 40
```

---

## 4. Component: `QueueStatsBar`

**File:** `web/src/components/desktop/QueueStatsBar.tsx`

### Purpose
Four summary stat cards displayed above the table. Provides the receptionist a pulse-at-a-glance before reading rows.

### Props
```typescript
interface QueueStatsBarProps {
  totalWaiting: number;
  maxWaitMinutes: number;
  notifiedCount: number;
  noPhoneCount: number;
}
```

### Layout
4-column grid, `gap-3`, each card is a white rounded-lg card with a left-aligned colored icon square + value + label stacked vertically.

### Cards (in order)

| # | Icon | Value | Label | Icon bg/color |
|---|------|-------|-------|---------------|
| 1 | `groups` | `totalWaiting` | `t('queue.stats.waiting')` | teal-light / teal |
| 2 | `schedule` | `maxWaitMinutes` + ` min` | `t('queue.stats.maxWait')` | orange-bg / orange |
| 3 | `mark_chat_read` | `notifiedCount` | `t('queue.stats.notified')` | purple-bg / purple |
| 4 | `phone_missed` | `noPhoneCount` | `t('queue.stats.noPhone')` | red-bg / red |

### Card structure (Tailwind)
```tsx
<div className="bg-white border border-[#DDE2DC] rounded-[10px] p-4 flex items-center gap-3 shadow-sm">
  <div className="w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0 {iconBg}">
    <span className="material-symbols-outlined text-xl {iconColor}">{icon}</span>
  </div>
  <div>
    <div className="text-[22px] font-bold text-[#1B2D25] leading-none">{value}</div>
    <div className="text-xs text-[#94A49A] mt-0.5">{label}</div>
  </div>
</div>
```

---

## 5. Component: `QueueTableHeader`

**File:** `web/src/components/desktop/QueueTableHeader.tsx`

### Purpose
The page header row containing: title + count pill + alert chip (conditional) and the filter pill-buttons + search input.

### Props
```typescript
interface QueueTableHeaderProps {
  totalCount: number;
  criticalCount: number;              // patients with waitMinutes ≥ 40
  activeFilter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

type FilterTab = 'all' | 'waiting' | 'notified' | 'no-phone';
```

### Title row
```tsx
<div className="flex items-baseline gap-3 mb-6">
  <h1 className="text-xl font-semibold text-[#1B2D25] tracking-tight">
    {t('queue.title')}
  </h1>
  <span className="text-[13px] font-medium text-[#5C6B62] bg-[#F4F5F1] border border-[#DDE2DC] px-2.5 py-0.5 rounded-full">
    {t('queue.patientsRemaining', { count: totalCount })}
  </span>
  {criticalCount > 0 && <AlertChip count={criticalCount} />}
</div>
```

### Alert chip (inline sub-component)
```tsx
// Only rendered when criticalCount > 0
<span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#B07A1C] bg-[#FBF4E3] border border-[#E8C46A] rounded-full px-3 py-1 animate-pulse-ring">
  <span className="material-symbols-outlined text-[15px]">warning</span>
  {t('queue.alert.longWait', { count: criticalCount })}
</span>
```

Add a custom Tailwind animation `animate-pulse-ring` in `tailwind.config.js`:
```js
// tailwind.config.js — add to theme.extend.keyframes and animation
keyframes: {
  'pulse-ring': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgba(176,122,28,0.3)' },
    '50%':       { boxShadow: '0 0 0 4px rgba(176,122,28,0)' },
  },
},
animation: {
  'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
},
```

### Filter bar
```tsx
<div className="flex items-center gap-2 mb-4">
  {FILTER_TABS.map(tab => (
    <button
      key={tab.key}
      onClick={() => onFilterChange(tab.key)}
      className={clsx(
        'text-[13px] font-medium px-3.5 py-1.5 rounded-full border-[1.5px] transition-all duration-150',
        activeFilter === tab.key
          ? 'bg-[#1B2D25] text-white border-[#1B2D25]'
          : 'bg-white text-[#5C6B62] border-[#DDE2DC] hover:border-[#356B58] hover:text-[#356B58]'
      )}
    >
      {t(tab.labelKey)} <span className="opacity-60">{tab.count}</span>
    </button>
  ))}
  <div className="flex-1" />
  {/* Search */}
  <div className="relative flex items-center">
    <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-[#94A49A] pointer-events-none">search</span>
    <input
      type="text"
      value={searchQuery}
      onChange={e => onSearchChange(e.target.value)}
      placeholder={t('queue.search.placeholder')}
      className="pl-9 pr-3 py-1.5 text-[13px] w-52 border-[1.5px] border-[#DDE2DC] rounded-[10px] bg-white text-[#1B2D25] outline-none focus:border-[#356B58] transition-colors"
    />
  </div>
</div>
```

### Urgency legend
Small legend below the filter bar, always visible:
```tsx
<div className="flex items-center gap-4 mb-3 text-xs text-[#94A49A]">
  <span className="font-semibold text-[#5C6B62]">{t('queue.legend.label')}</span>
  <LegendItem color="#2D7A5A" label={t('queue.legend.ok')} />    {/* < 20 min */}
  <LegendItem color="#E07B39" label={t('queue.legend.high')} />  {/* 20–40 min */}
  <LegendItem color="#C0392B" label={t('queue.legend.critical')} /> {/* > 40 min */}
</div>
```

Each `LegendItem` is an 8px colored circle + text, `flex items-center gap-1.5`.

---

## 6. Component: `QueueTableRow`

**File:** `web/src/components/desktop/QueueTableRow.tsx`

This is the core row component rendered inside a `<tbody>`. It is **not** a standalone table — it renders `<tr><td>...</td></tr>` and must be used inside the table defined in the parent page.

### Props
```typescript
interface QueueTableRowProps {
  entry: QueueTableEntry;
  onCall: (entry: QueueTableEntry) => void;
  onWhatsApp: (entry: QueueTableEntry) => void;
  onCopyLink: (entry: QueueTableEntry) => void;
  onEmergency: (entry: QueueTableEntry) => void;
  onRemove: (entry: QueueTableEntry) => void;
}
```

### Urgency tier → row styling

Compute `urgencyTier` from `entry.waitMinutes`:

```typescript
const urgencyTier: UrgencyTier =
  entry.waitMinutes >= 40 ? 'critical' :
  entry.waitMinutes >= 20 ? 'high' : 'ok';
```

Apply to `<tr>`:

| Tier | `<tr>` bg | First `<td>` left border |
|------|-----------|--------------------------|
| `critical` | `bg-[#fff9f9]` | `border-l-[3px] border-l-[#C0392B]` |
| `high` | `bg-[#fffaf6]` | `border-l-[3px] border-l-[#E07B39]` |
| `ok` | `bg-white` | `border-l-[3px] border-l-transparent` |

On hover: `hover:bg-[#F4F5F1]` (applies to all rows regardless of urgency — use `group` on `<tr>` and conditional bg reset on hover is not needed; Tailwind hover overrides for background are fine here).

### Column layout (8 columns)

```
# | Patient | Arrivée | Attente | Sera vu dans | Contact | Statut | Notif. | ⋮
```

#### Col 1 — Position `#`
```tsx
<td className="pl-4 pr-3 py-3.5 w-[52px]">
  <span className="font-['DM_Mono'] text-[13px] font-medium text-[#94A49A]">
    {String(entry.position).padStart(2, '0')}
  </span>
</td>
```

#### Col 2 — Patient
```tsx
<td className="px-4 py-3.5">
  <div className="flex items-center gap-2.5">
    <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 ${avatarStyle}`}>
      {entry.patientName.charAt(0).toUpperCase()}
    </div>
    <div>
      <div className="text-[14px] font-medium text-[#1B2D25]">{entry.patientName}</div>
      <div className="text-[12px] text-[#94A49A] mt-px flex items-center gap-1">
        {entry.isUrgent && (
          <span className="text-[#C0392B] font-semibold">{t('queue.row.urgent')} ·</span>
        )}
        {entry.appointmentType === 'appointment'
          ? t('queue.row.withAppointment')
          : t('queue.row.walkIn')}
        {entry.waitMinutes === 0 && (
          <span className="text-[#356B58] font-medium"> · {t('queue.row.justArrived')}</span>
        )}
      </div>
    </div>
  </div>
</td>
```

**Avatar color** — derive from patient name initial (consistent hashing). Use this deterministic palette:

```typescript
const AVATAR_COLORS = [
  { bg: '#EBF2EE', text: '#356B58' },
  { bg: '#EEE8FB', text: '#7C5CBF' },
  { bg: '#FEF0E6', text: '#C06020' },
  { bg: '#E8F5EE', text: '#2D7A5A' },
  { bg: '#F3EBF9', text: '#7C5CBF' },
  { bg: '#FBF4E3', text: '#B07A1C' },
];
const avatarIndex = entry.patientName.charCodeAt(0) % AVATAR_COLORS.length;
const { bg, text } = AVATAR_COLORS[avatarIndex];
```

#### Col 3 — Arrivée
```tsx
<td className="px-4 py-3.5">
  <span className="text-[13.5px] text-[#5C6B62] tabular-nums whitespace-nowrap">
    {format(entry.arrivedAt, 'HH:mm')}
  </span>
</td>
```

#### Col 4 — Attente (wait time + progress bar)
```tsx
<td className="px-4 py-3.5 min-w-[120px]">
  <div className={`text-[14px] font-semibold tabular-nums mb-1 ${waitColor}`}>
    {entry.waitMinutes} min
  </div>
  <div className="w-20 h-1 bg-[#DDE2DC] rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${waitBarColor}`}
      style={{ width: `${Math.min(waitPercent, 100)}%` }}
    />
  </div>
</td>
```

Wait color mapping:
```typescript
const waitColor = urgencyTier === 'critical' ? 'text-[#C0392B]'
                : urgencyTier === 'high'     ? 'text-[#E07B39]'
                : 'text-[#2D7A5A]';

const waitBarColor = urgencyTier === 'critical' ? 'bg-[#C0392B]'
                   : urgencyTier === 'high'     ? 'bg-[#E07B39]'
                   : 'bg-[#2D7A5A]';

// Bar fill: scale 0–40 min = 0–100% (cap at 100)
const waitPercent = (entry.waitMinutes / 40) * 100;
```

#### Col 5 — Sera vu dans (ETA)
```tsx
<td className="px-4 py-3.5">
  {entry.position === 1 || entry.etaMinutes === 0 ? (
    <span className="text-[13px] font-semibold text-[#356B58]">{t('queue.row.next')}</span>
  ) : entry.etaMinutes !== null ? (
    <span className="text-[13px] text-[#5C6B62] whitespace-nowrap">~{entry.etaMinutes} min</span>
  ) : (
    <span className="text-[13px] text-[#94A49A]">—</span>
  )}
</td>
```

#### Col 6 — Contact
```tsx
<td className="px-4 py-3.5">
  {entry.phoneNumber ? (
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-[16px] text-[#94A49A]">smartphone</span>
      <span className="font-['DM_Mono'] text-[12.5px] text-[#5C6B62]">{entry.phoneNumber}</span>
    </div>
  ) : (
    <span className="text-[12px] font-medium text-[#94A49A] bg-[#F4F5F1] border border-dashed border-[#DDE2DC] rounded-[6px] px-2 py-0.5">
      {t('queue.row.noPhone')}
    </span>
  )}
</td>
```

#### Col 7 — Statut badge
```tsx
<td className="px-4 py-3.5">
  <StatusBadge status={entry.status} />
</td>
```

`StatusBadge` sub-component:

| Status | bg | text | dot color | i18n key |
|--------|----|------|-----------|----------|
| `WAITING` | `#EBF2EE` | `#356B58` | `#2D7A5A` | `queue.status.waiting` |
| `NOTIFIED` | `#F0ECFB` | `#7C5CBF` | `#7C5CBF` | `queue.status.notified` |
| `IN_CONSULTATION` | `#1B2D25` | `#FFFFFF` | `#FFFFFF` | `queue.status.inConsultation` |

```tsx
<span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.3px] px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyles}`}>
  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
  {t(labelKey)}
</span>
```

#### Col 8 — Notif.
```tsx
<td className="px-4 py-3.5 text-center">
  <span className={`material-symbols-outlined text-[18px] ${entry.notificationSent ? 'text-[#7C5CBF]' : 'text-[#94A49A]'}`}>
    {entry.notificationSent ? 'mark_chat_read' : 'notifications'}
  </span>
</td>
```

#### Col 9 — Actions (kebab)
```tsx
<td className="px-3 py-3.5 w-[48px] text-center">
  <button
    onClick={e => { e.stopPropagation(); onKebabClick(e, entry); }}
    aria-label={t('queue.row.actionsLabel')}
    className={clsx(
      'w-8 h-8 rounded-[6px] border-[1.5px] border-transparent inline-flex items-center justify-center',
      'text-[#94A49A] transition-all duration-150',
      'opacity-0 group-hover:opacity-100',         // visible on row hover
      isMenuOpen && 'opacity-100 bg-[#F4F5F1] border-[#DDE2DC] text-[#1B2D25]' // stays visible when menu open
    )}
  >
    <span className="material-symbols-outlined text-[20px] pointer-events-none">more_vert</span>
  </button>
</td>
```

Add `group` class to the `<tr>` to enable `group-hover:opacity-100`.

---

## 7. Component: `PatientContextMenu`

**File:** `web/src/components/desktop/PatientContextMenu.tsx`

This is a **single shared instance** rendered once, positioned via `fixed` positioning and reused for all rows. It is rendered in the parent page component (or a portal), not inside each row.

### Props
```typescript
interface PatientContextMenuProps {
  open: boolean;
  anchorRect: DOMRect | null;       // bounding rect of the kebab button that opened it
  entry: QueueTableEntry | null;    // patient context
  onClose: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onCopyLink: () => void;
  onEmergency: () => void;
  onRemove: () => void;
}
```

### Positioning logic
```typescript
// Compute top/left from anchorRect, flip up if viewport-bottom overflow
const menuWidth = 220;
const menuHeight = 280; // approximate

let top = (anchorRect?.bottom ?? 0) + 6;
let left = (anchorRect?.right ?? 0) - menuWidth;

if (top + menuHeight > window.innerHeight) {
  top = (anchorRect?.top ?? 0) - menuHeight - 6;
}
if (left < 8) left = 8;
```

### Structure
```tsx
{open && (
  <>
    {/* Invisible backdrop to catch outside clicks */}
    <div className="fixed inset-0 z-[199]" onClick={onClose} />

    <div
      role="menu"
      style={{ top, left, position: 'fixed', zIndex: 200, minWidth: menuWidth }}
      className="bg-white border border-[#DDE2DC] rounded-[10px] shadow-[0_8px_28px_rgba(27,45,37,0.14),0_2px_8px_rgba(27,45,37,0.07)] p-1.5 animate-menu-pop"
    >
      {/* Section: Contact */}
      <MenuSectionLabel label={t('queue.menu.contact')} />
      <MenuItem
        icon="call"
        label={t('queue.menu.call')}
        description={t('queue.menu.callDesc')}
        iconColor="text-[#2D7A5A]"
        disabled={!entry?.phoneNumber}
        onClick={onCall}
      />
      <MenuItem
        icon="chat"
        label={t('queue.menu.whatsapp')}
        description={t('queue.menu.whatsappDesc')}
        iconColor="text-[#128C7E]"
        disabled={!entry?.phoneNumber}
        onClick={onWhatsApp}
      />

      <MenuDivider />
      
      {/* Section: Queue */}
      <MenuSectionLabel label={t('queue.menu.queueSection')} />
      <MenuItem
        icon="link"
        label={t('queue.menu.copyLink')}
        description={t('queue.menu.copyLinkDesc')}
        iconColor="text-[#356B58]"
        onClick={onCopyLink}
      />
      <MenuItem
        icon="priority_high"
        label={t('queue.menu.emergency')}
        description={t('queue.menu.emergencyDesc')}
        iconColor="text-[#E07B39]"
        onClick={onEmergency}
      />

      <MenuDivider />

      {/* Destructive */}
      <MenuItem
        icon="person_remove"
        label={t('queue.menu.remove')}
        description={t('queue.menu.removeDesc')}
        iconColor="text-[#C0392B]"
        labelColor="text-[#C0392B]"
        hoverBg="hover:bg-[#FDEEEC]"
        onClick={onRemove}
      />
    </div>
  </>
)}
```

### `MenuItem` sub-component
```typescript
interface MenuItemProps {
  icon: string;           // MD3 icon name
  label: string;
  description: string;
  iconColor: string;      // Tailwind text color
  labelColor?: string;    // defaults to text-[#1B2D25]
  hoverBg?: string;       // defaults to hover:bg-[#F4F5F1]
  disabled?: boolean;
  onClick: () => void;
}
```

```tsx
<button
  role="menuitem"
  disabled={disabled}
  onClick={onClick}
  className={clsx(
    'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[6px] border-none bg-transparent text-left transition-colors duration-100',
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : `cursor-pointer ${hoverBg ?? 'hover:bg-[#F4F5F1]'}`,
  )}
>
  <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${iconColor}`}>{icon}</span>
  <div>
    <div className={`text-[13.5px] font-medium ${labelColor ?? 'text-[#1B2D25]'}`}>{label}</div>
    <div className="text-[11.5px] text-[#94A49A] mt-px">{description}</div>
  </div>
</button>
```

### Tailwind animation for pop-in
Add to `tailwind.config.js`:
```js
keyframes: {
  'menu-pop': {
    '0%':   { opacity: '0', transform: 'scale(0.95) translateY(-4px)' },
    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
  },
},
animation: {
  'menu-pop': 'menu-pop 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
},
```

### Close behaviour
- Click on backdrop → `onClose()`
- `Escape` key → `onClose()`
- Clicking a menu item → action handler + `onClose()`
- Add `useEffect` for Escape:
  ```typescript
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  ```

---

## 8. Component: `CallNextBar`

**File:** `web/src/components/desktop/CallNextBar.tsx`

The floating "Appeler Suivant" bar fixed to the bottom-center of the screen. Always visible on the desktop queue view when at least one patient is waiting.

### Props
```typescript
interface CallNextBarProps {
  nextPatientName: string | null;   // name of position #2 (next to be called after current)
  onCallNext: () => void;
  disabled?: boolean;               // true when IN_CONSULTATION has no active patient
}
```

### Structure
```tsx
<div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1B2D25] rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(27,45,37,0.30)]">
  <span className="text-[14px] font-medium text-white/70">
    {t('queue.callNext.label')}
  </span>
  <span className="text-[15px] font-semibold text-white ml-1">
    {nextPatientName ?? '—'}
  </span>
  <button
    onClick={onCallNext}
    disabled={disabled}
    className="flex items-center gap-2 bg-[#356B58] text-white rounded-full px-5 py-2 text-[14px] font-semibold transition-all duration-150 hover:bg-[#2a5a49] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
    {t('queue.callNext.button')}
  </button>
</div>
```

**Note on `nextPatientName`:** This should be the patient at `position === 2` (the one who will be called *after* the current IN_CONSULTATION patient ends). Derive from queue store: `entries.find(e => e.position === 2)?.patientName ?? null`.

---

## 9. Hook: `useQueueFilter`

**File:** `web/src/hooks/useQueueFilter.ts`

Encapsulates the filter + search logic so the page component stays clean.

```typescript
export function useQueueFilter(entries: QueueTableEntry[]) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = entries;

    // Tab filter
    if (activeFilter === 'waiting')  result = result.filter(e => e.status === 'WAITING' && !e.notificationSent);
    if (activeFilter === 'notified') result = result.filter(e => e.notificationSent);
    if (activeFilter === 'no-phone') result = result.filter(e => !e.phoneNumber);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.patientName.toLowerCase().includes(q));
    }

    return result;
  }, [entries, activeFilter, searchQuery]);

  const counts = useMemo(() => ({
    all:      entries.length,
    waiting:  entries.filter(e => e.status === 'WAITING' && !e.notificationSent).length,
    notified: entries.filter(e => e.notificationSent).length,
    noPhone:  entries.filter(e => !e.phoneNumber).length,
  }), [entries]);

  return { filtered, counts, activeFilter, setActiveFilter, searchQuery, setSearchQuery };
}
```

---

## 10. Parent Assembly in `DashboardPage.tsx`

Inside `DashboardPage`, the desktop queue section should be structured as:

```tsx
{/* Only rendered on desktop (not isMobile) */}
{!isMobile && (
  <div className="min-h-screen bg-[#EAECE6] p-8">

    {/* 1 — Stats bar */}
    <div className="grid grid-cols-4 gap-3 mb-5">
      <QueueStatsBar
        totalWaiting={waitingEntries.length}
        maxWaitMinutes={maxWait}
        notifiedCount={notifiedCount}
        noPhoneCount={noPhoneCount}
      />
    </div>

    {/* 2 — Header + filters */}
    <QueueTableHeader
      totalCount={filtered.length}
      criticalCount={criticalCount}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />

    {/* 3 — Table */}
    <div className="bg-white border border-[#DDE2DC] rounded-[14px] shadow-sm overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F4F5F1] border-b-[1.5px] border-[#DDE2DC]">
            <th className="text-[11px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-4 py-2.5 text-left w-[52px]">#</th>
            <th ...>{t('queue.col.patient')}</th>
            <th ...>{t('queue.col.arrival')}</th>
            <th ...>{t('queue.col.wait')}</th>
            <th ...>{t('queue.col.eta')}</th>
            <th ...>{t('queue.col.contact')}</th>
            <th ...>{t('queue.col.status')}</th>
            <th className="text-center ...">{t('queue.col.notif')}</th>
            <th className="w-[60px]">{t('queue.col.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(entry => (
            <QueueTableRow
              key={entry.id}
              entry={entry}
              isMenuOpen={menuState.entryId === entry.id}
              onKebabClick={(e, entry) => handleKebabClick(e, entry)}
              onCall={handleCall}
              onWhatsApp={handleWhatsApp}
              onCopyLink={handleCopyLink}
              onEmergency={handleEmergency}
              onRemove={handleRemove}
            />
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-12 text-[#94A49A] text-[14px]">
                {t('queue.empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* 4 — Floating call-next bar */}
    <CallNextBar
      nextPatientName={nextPatient?.patientName ?? null}
      onCallNext={handleCallNext}
    />

    {/* 5 — Context menu (single shared instance, portal to body) */}
    <PatientContextMenu
      open={menuState.open}
      anchorRect={menuState.anchorRect}
      entry={menuState.entry}
      onClose={closeMenu}
      onCall={() => { handleCall(menuState.entry!); closeMenu(); }}
      onWhatsApp={() => { handleWhatsApp(menuState.entry!); closeMenu(); }}
      onCopyLink={() => { handleCopyLink(menuState.entry!); closeMenu(); }}
      onEmergency={() => { handleEmergency(menuState.entry!); closeMenu(); }}
      onRemove={() => { handleRemove(menuState.entry!); closeMenu(); }}
    />
  </div>
)}
```

### Menu state management in `DashboardPage`:
```typescript
const [menuState, setMenuState] = useState<{
  open: boolean;
  entry: QueueTableEntry | null;
  anchorRect: DOMRect | null;
}>({ open: false, entry: null, anchorRect: null });

const handleKebabClick = useCallback((e: React.MouseEvent, entry: QueueTableEntry) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  setMenuState(prev =>
    prev.open && prev.entry?.id === entry.id
      ? { open: false, entry: null, anchorRect: null }
      : { open: true, entry, anchorRect: rect }
  );
}, []);

const closeMenu = useCallback(() => {
  setMenuState({ open: false, entry: null, anchorRect: null });
}, []);
```

---

## 11. Action Handlers

These handlers should call the **existing** store actions — no new API routes are needed. Wire up as follows:

```typescript
// Call — open tel: link
const handleCall = (entry: QueueTableEntry) => {
  if (!entry.phoneNumber) return;
  window.open(`tel:${entry.phoneNumber}`, '_blank');
};

// WhatsApp — open wa.me link
const handleWhatsApp = (entry: QueueTableEntry) => {
  if (!entry.phoneNumber) return;
  const phone = entry.phoneNumber.replace(/\D/g, '');
  window.open(`https://wa.me/${phone}`, '_blank');
};

// Copy link — use existing patient status page URL pattern
const handleCopyLink = (entry: QueueTableEntry) => {
  const url = `${window.location.origin}/queue/${entry.id}`;
  navigator.clipboard.writeText(url);
  showToast(t('queue.toast.linkCopied'), 'teal');
};

// Emergency — call existing store action
const handleEmergency = (entry: QueueTableEntry) => {
  queueStore.setUrgent(entry.id);       // use existing action name — check store
  showToast(t('queue.toast.emergency'), 'orange');
};

// Remove — call existing store action with confirmation
const handleRemove = (entry: QueueTableEntry) => {
  if (!window.confirm(t('queue.confirm.remove', { name: entry.patientName }))) return;
  queueStore.removeEntry(entry.id);     // use existing action name — check store
};
```

---

## 12. Toast Utility

Create a lightweight shared toast hook/utility (do not add a third-party library):

**File:** `web/src/hooks/useToast.ts`

```typescript
type ToastVariant = 'teal' | 'green' | 'orange' | 'red';

const TOAST_STYLES: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  teal:   { bg: '#EBF2EE', text: '#356B58', border: '#356B5833' },
  green:  { bg: '#E8F5EE', text: '#2D7A5A', border: '#2D7A5A33' },
  orange: { bg: '#FDF1E8', text: '#E07B39', border: '#E07B3933' },
  red:    { bg: '#FDEEEC', text: '#C0392B', border: '#C0392B33' },
};

export function useToast() {
  const show = useCallback((message: string, variant: ToastVariant = 'teal') => {
    // Imperatively create a DOM node, animate in, auto-remove after 2.2s
    // See HTML prototype for exact style values and transition
    const styles = TOAST_STYLES[variant];
    const el = document.createElement('div');
    el.textContent = message;
    // position: fixed, bottom: 90px, centered, pill shape, fade + slide transition
    // ... (implement matching the HTML prototype's showToast function exactly)
    document.body.appendChild(el);
    requestAnimationFrame(() => { /* fade in */ });
    setTimeout(() => { /* fade out then remove */ }, 2200);
  }, []);

  return { show };
}
```

---

## 13. i18n Keys

Add to **both** `fr.json` and `ar.json`. RTL layout in Arabic is handled by the existing `dir="rtl"` body attribute — no additional changes needed.

```json
{
  "queue": {
    "title": "File d'attente",
    "patientsRemaining": "{{count}} patients restants",
    "stats": {
      "waiting": "En attente",
      "maxWait": "Attente max",
      "notified": "Notifiés",
      "noPhone": "Sans téléphone"
    },
    "alert": {
      "longWait": "{{count}} patient attend depuis +40 min"
    },
    "legend": {
      "label": "Urgence attente :",
      "ok": "< 20 min",
      "high": "20–40 min",
      "critical": "> 40 min — action requise"
    },
    "filter": {
      "all": "Tous",
      "waiting": "En attente",
      "notified": "Notifiés",
      "noPhone": "Sans tél."
    },
    "search": {
      "placeholder": "Rechercher un patient…"
    },
    "col": {
      "patient": "Patient",
      "arrival": "Arrivée",
      "wait": "Attente",
      "eta": "Sera vu dans",
      "contact": "Contact",
      "status": "Statut",
      "notif": "Notif.",
      "actions": "Actions"
    },
    "row": {
      "withAppointment": "Avec rendez-vous",
      "walkIn": "Sans rendez-vous",
      "justArrived": "Vient d'arriver",
      "urgent": "Urgence",
      "noPhone": "Sans tél.",
      "next": "Prochain",
      "actionsLabel": "Actions pour ce patient"
    },
    "status": {
      "waiting": "En attente",
      "notified": "Notifié(e)",
      "inConsultation": "En consultation"
    },
    "menu": {
      "contact": "Contact",
      "call": "Appeler",
      "callDesc": "Composer le numéro directement",
      "whatsapp": "Envoyer sur WhatsApp",
      "whatsappDesc": "Ouvrir la conversation WhatsApp",
      "queueSection": "File d'attente",
      "copyLink": "Copier lien de position",
      "copyLinkDesc": "Lien de suivi à partager",
      "emergency": "Passer en urgence",
      "emergencyDesc": "Place le patient en position #2",
      "remove": "Retirer de la file",
      "removeDesc": "Supprime définitivement"
    },
    "callNext": {
      "label": "Au suivant ·",
      "button": "Appeler suivant"
    },
    "toast": {
      "linkCopied": "Lien copié dans le presse-papier",
      "emergency": "Patient passé en urgence"
    },
    "confirm": {
      "remove": "Retirer {{name}} de la file d'attente ?"
    },
    "empty": "Aucun patient dans la file d'attente"
  }
}
```

---

## 14. Acceptance Criteria

All of the following must be true before this spec is considered complete:

- [ ] Stats bar shows live counts from queue store — updates in real-time via socket
- [ ] Alert chip appears only when `criticalCount > 0` and has the pulse-ring animation
- [ ] Filter tabs correctly filter rows; active tab has forest bg + white text
- [ ] Search filters by patient name (case-insensitive, instant)
- [ ] Each row has correct urgency bg tint and left border color based on `waitMinutes`
- [ ] Position column uses DM Mono, zero-padded to 2 digits
- [ ] Avatar color is deterministic (same patient always gets same color)
- [ ] Wait bar fills proportionally (0 min = empty, 40+ min = full)
- [ ] ETA column shows "Prochain" for position 1, "~N min" for others, "—" if null
- [ ] Phone number displayed in DM Mono; "Sans tél." badge shown when null
- [ ] Status badge renders correct color for each of the 3 statuses
- [ ] Notif. column shows purple `mark_chat_read` when sent, grey `notifications` when not
- [ ] Kebab button is invisible by default, visible on row hover (`group`/`group-hover`)
- [ ] Kebab button stays visible while its menu is open
- [ ] Context menu opens anchored to the kebab button, flips up if near viewport bottom
- [ ] Clicking backdrop closes menu; Escape key closes menu
- [ ] "Appeler" and "WhatsApp" items are disabled (greyed, not clickable) when `phoneNumber` is null
- [ ] "Copier lien" writes correct URL to clipboard and shows teal toast
- [ ] "Passer en urgence" calls store action and shows orange toast
- [ ] "Retirer de la file" requires `window.confirm` before calling store action
- [ ] Only one menu open at a time (opening a second closes the first)
- [ ] `CallNextBar` shows the name of the patient at position 2
- [ ] `CallNextBar` calls the existing "call next" store/API action
- [ ] `CallNextBar` is `disabled` when no patients are waiting
- [ ] All strings use i18n keys (no hardcoded French strings in JSX)
- [ ] All icons are Material Symbols Outlined (no emojis)
- [ ] No changes to mobile dashboard, API routes, or socket handlers
- [ ] TypeScript: zero `as any` casts in new files; all props fully typed
- [ ] RTL layout (Arabic) renders correctly — test by switching locale

---

## 15. What NOT to Change

- `MobileDashboard.tsx` — untouched
- `api/` — no backend changes
- Socket event names — unchanged
- `queueStore.ts` state shape — read-only; only call existing actions
- Authentication / routing
- `LoginPage.tsx` (separate issue tracked elsewhere)
