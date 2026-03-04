# Drawer Controls Redesign — Switch Étiqueté

> **What this spec covers:** Replacing the three toggle controls in the mobile dashboard side drawer (Langue, Médecin, File d'attente) with a new `ControlSwitch` component using the "Switch Étiqueté" pattern. No new API endpoints. No database schema changes.

---

## 1. What Is Changing and Where

### The three controls

The **Contrôles** section of the side drawer currently renders three controls. All three are being replaced with instances of a new shared `ControlSwitch` component:

| Control | Current state | New pattern |
|---------|--------------|-------------|
| Langue | Unknown existing UI | FR [toggle] AR — static flanking labels, teal track |
| Médecin | Unknown existing UI | [Présent / Absent] [toggle] — green ON, red OFF |
| File d'attente | Unknown existing UI | [Ouverte / Fermée] [toggle] — green ON, red OFF |

### Files to find and modify

Start by searching for where the drawer is rendered. The most likely locations are:

```
apps/web/src/components/queue/MobileDashboard.tsx   ← 639 lines, most likely
apps/web/src/components/layout/Header.tsx           ← check if drawer is here instead
```

Also modify:
```
apps/web/src/components/ui/LanguageSwitcher.tsx     ← refactor to use ControlSwitch
apps/web/src/i18n/fr.json                           ← add missing keys if needed
apps/web/src/i18n/ar.json                           ← add missing keys if needed
```

### New file to create

```
apps/web/src/components/ui/ControlSwitch.tsx
```

> **`CLAUDE.md` reminder:** `LanguageSwitcher` must keep its `export default` — do not convert to a named export.

---

## 2. Design Tokens

All tokens already exist in the app. Do not redefine them. Use CSS variables or the equivalent Tailwind config values.

```
Background / Surface
  #F6F5F0   --bg              warm off-white page background
  #FFFFFF   --surface         cards, inputs
  #F0EFEA   --surface-alt     toggle track OFF background, inactive chips
  #E8E6DF   --border          all dividers and borders

Text
  #1A1A1A   --text-primary    main body text
  #6B6960   --text-secondary  supporting labels
  #9E9B90   --text-tertiary   hints, meta, inactive labels, icon color

Accent (teal)
  #0F7B6C   --accent          Langue toggle track + active label
  #0A5C50   --accent-dark     pressed state

Semantic green — Médecin Présent + File Ouverte
  #2D8B4E   --green           track ON + state label
  #EDF7F0   --green-light     (not used in toggles directly)

Semantic red — Médecin Absent + File Fermée
  #D94F3B   --red             state label + thumb when OFF
  #FDF0ED   --red-light       track background when OFF
```

**Fonts (all loaded globally):**
- DM Sans — all Latin text
- IBM Plex Sans Arabic — Arabic text
- Material Symbols Rounded — icons (already imported)

---

## 3. `ControlSwitch` Component Spec

### File
`apps/web/src/components/ui/ControlSwitch.tsx`

### Props

```typescript
interface ControlSwitchProps {
  /** Material Symbols Rounded icon name (e.g. "language", "stethoscope") */
  icon: string;
  /** Row label shown on the left (e.g. "Langue", "Médecin") */
  label: string;
  /** Toggle is ON when true */
  checked: boolean;
  /** Fires with the new boolean value when user taps */
  onChange: (newValue: boolean) => void;
  /** State label text when checked=true */
  labelOn: string;
  /** State label text when checked=false */
  labelOff: string;
  /** Track + label color when ON */
  colorOn: 'teal' | 'green';
  /** Track + label color when OFF */
  colorOff: 'red' | 'muted';
  /** Reduces opacity to 0.5 and blocks interaction during async ops */
  disabled?: boolean;
  /**
   * Langue only. When true, renders FR and AR as static flanking labels on
   * either side of the toggle instead of a single changing state label.
   */
  bilingualLabels?: boolean;
}
```

### Row structure

```
[icon] [Row Label]                       [StateLabel] [Track+Thumb]
  ↑         ↑                                  ↑              ↑
16px     12px/500                         10px/700        36×20px
#9E9B90  #1A1A1A                        colored text    spring anim
```

For Langue (`bilingualLabels={true}`):

```
[icon] [Langue]                    [FR] [Track+Thumb] [AR]
                                    ↑                   ↑
                             teal when active     teal when active
                             muted when inactive  muted when inactive
```

### JSX structure

```tsx
<div className="flex items-center justify-between py-2">

  {/* Left cluster — not interactive */}
  <div className="flex items-center gap-[7px]">
    <span className="material-symbols-rounded text-[16px] text-[#9E9B90]">
      {icon}
    </span>
    <span className="text-[12px] font-medium text-[#1A1A1A]">
      {label}
    </span>
  </div>

  {/* Right cluster — entire area is the tap target */}
  <button
    role="switch"
    aria-checked={checked}
    aria-label={`${label}: ${checked ? labelOn : labelOff}`}
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className="flex items-center gap-[6px] min-h-[44px] min-w-[80px] justify-end"
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    {bilingualLabels ? (
      <>
        <span style={labelStyle(checked, 'left')}>FR</span>
        <Track checked={checked} colorOn={colorOn} colorOff={colorOff} />
        <span style={labelStyle(!checked, 'right')}>AR</span>
      </>
    ) : (
      <>
        <span style={stateLabelStyle(checked, colorOn, colorOff)}>
          {checked ? labelOn : labelOff}
        </span>
        <Track checked={checked} colorOn={colorOn} colorOff={colorOff} />
      </>
    )}
  </button>

</div>
```

### Toggle track — dimensions and motion

| Property | Value |
|----------|-------|
| Width | 36px |
| Height | 20px |
| Border radius | 10px |
| Border | 1.5px solid |
| Thumb diameter | 12px |
| Thumb shadow | `0 1px 3px rgba(0,0,0,0.2)` |
| **Thumb OFF position** | `translateX(2px)` |
| **Thumb ON position** | `translateX(20px)` |
| **Thumb transition** | `transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Track bg transition | `background-color 200ms ease, border-color 200ms ease` |

The easing `cubic-bezier(0.34, 1.56, 0.64, 1)` produces a spring overshoot before settling. This is the same curve used by BleSaf bottom sheets and press states — use it exactly.

### Toggle track — colors

| `colorOn` | `colorOff` | Track bg (ON) | Track bg (OFF) | Border (OFF) | Thumb (ON) | Thumb (OFF) |
|-----------|-----------|---------------|----------------|--------------|------------|-------------|
| `teal` | `muted` | `#0F7B6C` | `#F0EFEA` | `#E8E6DF` | white | `#9E9B90` |
| `green` | `red` | `#2D8B4E` | `#FDF0ED` | `rgba(217,79,59,0.3)` | white | `#D94F3B` |
| `green` | `muted` | `#2D8B4E` | `#F0EFEA` | `#E8E6DF` | white | `#9E9B90` |

When track is ON: border is `transparent`.

### State label typography

```css
font-size:   10px;
font-weight: 700;
min-width:   42px;     /* fixed — prevents layout shift as text changes length */
text-align:  right;
white-space: nowrap;
transition:  color 200ms ease;
```

| State | Color |
|-------|-------|
| ON + `colorOn=teal` | `#0F7B6C` |
| ON + `colorOn=green` | `#2D8B4E` |
| OFF + `colorOff=red` | `#D94F3B` |
| OFF + `colorOff=muted` | `#9E9B90` |

### Bilingual label typography (Langue only)

Same `font-size: 10px; font-weight: 700; white-space: nowrap; transition: color 200ms ease`.

| Label | min-width | text-align | When active | When inactive |
|-------|-----------|-----------|-------------|---------------|
| FR (left of track) | 42px | right | `#0F7B6C` | `#9E9B90` |
| AR (right of track) | 18px | left | `#0F7B6C` | `#9E9B90` |

The track is always teal for Langue. Only thumb direction indicates which language is active — the labels confirm it through color.

### Disabled state

```css
opacity: 0.5;
pointer-events: none;
```

Applied when `disabled={true}`. No spinner. Opacity alone is the intended feedback during API calls.

---

## 4. Section Separator

Between each `ControlSwitch` inside the Contrôles section:

```tsx
<div className="border-t border-[#E8E6DF]" />
```

---

## 5. Control 1 — Langue

### Visual result

```
FR active:   [🌐] Langue           [FR·teal] [●───] [AR·muted]
AR active:   [🌐] Langue           [FR·muted] [───●] [AR·teal]
```

### Usage

```tsx
<ControlSwitch
  icon="language"
  label={t('drawer.controls.langue')}
  checked={i18n.language === 'fr'}
  onChange={(isFr) => {
    const lang = isFr ? 'fr' : 'ar';
    i18n.changeLanguage(lang);
    // Port RTL logic from existing LanguageSwitcher.tsx exactly as-is
  }}
  labelOn="FR"
  labelOff="AR"
  colorOn="teal"
  colorOff="muted"
  bilingualLabels={true}
/>
```

### Implementation notes

- **No API call.** Language is client-side only, persisted by react-i18next (localStorage).
- Open `apps/web/src/components/ui/LanguageSwitcher.tsx` and copy the RTL toggle logic (`document.dir`, root `dir` attribute, or however RTL is currently applied) into this `onChange`. Do not rewrite it — port it verbatim.
- `LanguageSwitcher.tsx` must keep its `export default`. Either refactor it internally to call `ControlSwitch`, or leave it as a thin wrapper.

---

## 6. Control 2 — Médecin

### Visual result

```
Doctor present:   [⚕] Médecin         [Présent·green] [●───green]
Doctor absent:    [⚕] Médecin          [Absent·red]   [───●red-bg]
```

### Usage

```tsx
<ControlSwitch
  icon="stethoscope"
  label={t('drawer.controls.medecin')}
  checked={isDoctorPresent}
  onChange={handleDoctorPresenceToggle}
  labelOn={t('drawer.controls.present')}
  labelOff={t('drawer.controls.absent')}
  colorOn="green"
  colorOff="red"
  disabled={isUpdatingDoctor}
/>
```

### State source

`isDoctorPresent` is a `Clinic` model field (confirmed in `schema.prisma`). Its current value is already loaded on dashboard init. Find the state variable and its setter in:
- `apps/web/src/hooks/useDashboard.ts`
- `apps/web/src/stores/authStore.ts`

### API call on toggle

```
PATCH /api/clinic/
Authorization: Bearer {jwt}
Content-Type: application/json

{ "isDoctorPresent": true | false }
```

### Handler pattern

```typescript
const [isUpdatingDoctor, setIsUpdatingDoctor] = useState(false);

const handleDoctorPresenceToggle = async (newValue: boolean) => {
  setIsUpdatingDoctor(true);
  try {
    await api.updateClinicSettings({ isDoctorPresent: newValue });
    setIsDoctorPresent(newValue); // use the existing setter from useDashboard / authStore
    // The server emits a doctor:presence Socket.io event after this PATCH automatically.
    // No manual socket.emit() needed on the client.
  } catch {
    toast.error(t('errors.updateFailed'));
  } finally {
    setIsUpdatingDoctor(false);
  }
};
```

---

## 7. Control 3 — File d'attente

### Visual result

```
Queue open:    [📅] File d'attente    [Ouverte·green] [●───green]
Queue closed:  [📅] File d'attente    [Fermée·red]    [───●red-bg]
```

### Usage

```tsx
<ControlSwitch
  icon="calendar_today"
  label={t('drawer.controls.fileAttente')}
  checked={isQueueOpen}
  onChange={handleQueueToggle}
  labelOn={t('drawer.controls.ouverte')}
  labelOff={t('drawer.controls.fermee')}
  colorOn="green"
  colorOff="red"
  disabled={isUpdatingQueue}
/>
```

### State source

Locate `isQueueOpen` (or equivalent field name) in:
1. `apps/web/src/hooks/useDashboard.ts`
2. `apps/web/src/stores/authStore.ts`
3. `apps/api/prisma/schema.prisma` — check if field exists on `Clinic` model

### API call on toggle

```
PATCH /api/clinic/
Authorization: Bearer {jwt}
Content-Type: application/json

{ "isQueueOpen": true | false }
```

### If the field does not exist in the backend

Check `apps/api/src/routes/clinic.ts` for what the PATCH handler accepts. If `isQueueOpen` is not a persisted `Clinic` field:
- **Do not add it** without confirming intent
- Add a `// TODO: isQueueOpen not yet persisted — needs Clinic schema field` comment
- Raise in PR before merging

### Handler pattern

```typescript
const [isUpdatingQueue, setIsUpdatingQueue] = useState(false);

const handleQueueToggle = async (newValue: boolean) => {
  setIsUpdatingQueue(true);
  try {
    await api.updateClinicSettings({ isQueueOpen: newValue });
    setIsQueueOpen(newValue);
  } catch {
    toast.error(t('errors.updateFailed'));
  } finally {
    setIsUpdatingQueue(false);
  }
};
```

---

## 8. Full Contrôles Section Assembly

```tsx
<section className="px-[18px] py-[12px] border-b border-[#E8E6DF]">

  {/* ── Section header ── */}
  <div className="flex items-center gap-[4px] mb-[9px]"
       style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: '#9E9B90' }}>
    <span className="material-symbols-rounded" style={{ fontSize: 11 }}>tune</span>
    {t('drawer.sections.controls')}
  </div>

  {/* ── Langue ── */}
  <ControlSwitch
    icon="language"
    label={t('drawer.controls.langue')}
    checked={i18n.language === 'fr'}
    onChange={handleLanguageToggle}
    labelOn="FR"
    labelOff="AR"
    colorOn="teal"
    colorOff="muted"
    bilingualLabels={true}
  />

  <div className="border-t border-[#E8E6DF]" />

  {/* ── Médecin ── */}
  <ControlSwitch
    icon="stethoscope"
    label={t('drawer.controls.medecin')}
    checked={isDoctorPresent}
    onChange={handleDoctorPresenceToggle}
    labelOn={t('drawer.controls.present')}
    labelOff={t('drawer.controls.absent')}
    colorOn="green"
    colorOff="red"
    disabled={isUpdatingDoctor}
  />

  <div className="border-t border-[#E8E6DF]" />

  {/* ── File d'attente ── */}
  <ControlSwitch
    icon="calendar_today"
    label={t('drawer.controls.fileAttente')}
    checked={isQueueOpen}
    onChange={handleQueueToggle}
    labelOn={t('drawer.controls.ouverte')}
    labelOff={t('drawer.controls.fermee')}
    colorOn="green"
    colorOff="red"
    disabled={isUpdatingQueue}
  />

</section>
```

---

## 9. i18n Keys

Check existing translation files before adding. Merge into the appropriate nesting level.

### `apps/web/src/i18n/fr.json`

```json
"drawer": {
  "sections": {
    "controls": "Contrôles",
    "account": "Compte"
  },
  "controls": {
    "langue": "Langue",
    "medecin": "Médecin",
    "fileAttente": "File d'attente",
    "present": "Présent",
    "absent": "Absent",
    "ouverte": "Ouverte",
    "fermee": "Fermée"
  }
}
```

### `apps/web/src/i18n/ar.json`

```json
"drawer": {
  "sections": {
    "controls": "الإعدادات",
    "account": "الحساب"
  },
  "controls": {
    "langue": "اللغة",
    "medecin": "الطبيب",
    "fileAttente": "قائمة الانتظار",
    "present": "حاضر",
    "absent": "غائب",
    "ouverte": "مفتوحة",
    "fermee": "مغلقة"
  }
}
```

---

## 10. Animation Reference

### Thumb spring
```css
/* The thumb moves via CSS transform, not left/margin */
transform: translateX(2px);    /* OFF */
transform: translateX(20px);   /* ON  */

transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

`cubic-bezier(0.34, 1.56, 0.64, 1)` — gentle spring overshoot. Same curve as BleSaf bottom sheets and CTA presses. Use this exactly.

### Track + label
```css
/* Track background and border */
transition: background-color 200ms ease, border-color 200ms ease;

/* State label or bilingual label color */
transition: color 200ms ease;
```

### Why fixed min-width on labels matters
"Présent" (7 chars) and "Absent" (6 chars) have different widths. "Ouverte" (7) and "Fermée" (6) differ too. Without `min-width: 42px` on the label, the toggle track would shift horizontally on every toggle — a subtle but jarring layout jump. The fixed width absorbs the difference.

---

## 11. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Role | `<button role="switch" aria-checked={checked}>` |
| Keyboard | `Space` / `Enter` fire toggle |
| Focus ring | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7B6C]` |
| Screen reader label | `aria-label={\`${label}: ${checked ? labelOn : labelOff}\`}` |
| Disabled | `disabled` attribute + `aria-disabled="true"` |
| Touch target | Button element min `44 × 44px` (add vertical padding if needed) |

---

## 12. Do Not Touch

- The drawer header, QR code section, Paramètres row, Aide & support row, Déconnexion row
- The drawer slide-in animation, overlay, and backdrop
- Any part of the desktop dashboard layout
- Any existing API endpoints — use only `PATCH /api/clinic/`
- `LanguageSwitcher.tsx` export type — must stay `export default` per `CLAUDE.md`
- Existing Zustand stores — wire into `useDashboard.ts` / `authStore.ts`

---

## 13. Verification Checklist

- [ ] FR/AR toggle works and persists across page reload
- [ ] RTL layout activates / deactivates correctly on language change
- [ ] Médecin PATCH fires with `{ isDoctorPresent }` and updates local state
- [ ] File d'attente PATCH fires with `{ isQueueOpen }` and updates local state
- [ ] `doctor:presence` Socket.io event reaches patient pages after Médecin toggle
- [ ] Spring animation plays on thumb (overshoot visible, not instant)
- [ ] Track background and label color transition at 200ms ease
- [ ] No layout shift when toggle state changes (labels have fixed min-width)
- [ ] Disabled state: 50% opacity, no interaction during API call
- [ ] Langue: FR and AR flanking labels swap color on each toggle
- [ ] Médecin: green track + white thumb ON; red-light track + red thumb OFF
- [ ] File d'attente: same color behavior as Médecin
- [ ] `LanguageSwitcher.tsx` still has `export default`
- [ ] `pnpm build` — zero TypeScript errors
- [ ] `pnpm lint` — zero new ESLint errors
- [ ] `pnpm test` — no regressions
- [ ] Tested at 375px viewport width
- [ ] Arabic RTL mode: row layout and label positions are correct
