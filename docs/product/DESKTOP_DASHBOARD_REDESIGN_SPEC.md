# BleSaf Desktop Dashboard — Implementation Specification
## Design Reference: Efficiency Engine 4A · Faithful Rework

**Target file:** `web/src/pages/DashboardPage.tsx` (desktop view)  
**Scope:** Desktop layout only (`≥ 1024px`). The existing mobile dashboard (`MobileDashboard.tsx`) is **not modified**.  
**Stack:** React · TypeScript · Tailwind CSS · existing Zustand stores · existing Socket.io hooks

---

## 1. Design Tokens

Add the following CSS custom properties to your global stylesheet (`index.css` or equivalent). These are the single source of truth for the desktop dashboard. Do **not** use arbitrary Tailwind values where a token exists.

```css
:root {
  /* Surfaces */
  --db-bg:           #F2F4F1;
  --db-surface:      #FFFFFF;
  --db-header-bg:    #1A2B22;

  /* Borders */
  --db-border:       #E2E8E4;
  --db-border-light: #EDF0EB;

  /* Text */
  --db-text-primary:   #1A2B22;
  --db-text-secondary: #6A8A72;
  --db-text-muted:     #A8BEB0;

  /* Accent */
  --db-accent:       #356B58;
  --db-accent-dark:  #2A5547;
  --db-accent-mid:   #5AAB7A;
  --db-accent-light: #EBF5EE;

  /* Status badge colours */
  --db-badge-notif-bg: #DCF2E3;
  --db-badge-notif-fg: #1D5E32;
  --db-badge-wait-bg:  #F0F4F2;
  --db-badge-wait-fg:  #4A7060;
  --db-badge-warn-bg:  #FEF3E2;
  --db-badge-warn-fg:  #9A5A1A;
}
```

---

## 2. Typography

Load via Google Fonts (already available in the project):

```html
IBM Plex Sans — weights 400, 500, 600, 700  (body / UI)
IBM Plex Mono — weights 400, 500, 600       (numbers, timestamps, monospace values)
```

Apply to the desktop wrapper:

```css
.desktop-dashboard {
  font-family: 'IBM Plex Sans', sans-serif;
  color: var(--db-text-primary);
}
```

**Typography rules:**
- All queue position numbers, timestamps, and wait-time values → `font-family: 'IBM Plex Mono'`
- The consultation timer (large number) → IBM Plex Mono, `font-size: 26px`, `font-weight: 600`, `color: #5AAB7A`
- Statistics panel large numbers → IBM Plex Mono, `font-size: 26px`, `font-weight: 600`
- Section labels → `font-size: 9px`, `text-transform: uppercase`, `letter-spacing: 0.14em`, `color: var(--db-text-muted)`, `font-weight: 600`
- Table header labels → `font-size: 9px`, `text-transform: uppercase`, `letter-spacing: 0.13em`, `color: var(--db-text-muted)`, `font-weight: 600`

---

## 3. Overall Page Structure

The desktop dashboard is composed of **four stacked layers**:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER BAR          height: 50px                       │
├─────────────────────────────────────────────────────────┤
│  STATS SUB-BAR       height: 38px                       │
├──────────────┬──────────────────────────┬───────────────┤
│              │                          │               │
│  LEFT PANEL  │    CENTER — QUEUE TABLE  │  RIGHT PANEL  │
│  268px fixed │    1fr (fluid)           │  252px fixed  │
│              │                          │               │
│  overflow-y: │  overflow-y: auto        │  overflow-y:  │
│  auto        │                          │  auto         │
│              │                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

**Grid definition:**
```css
.desktop-layout {
  display: grid;
  grid-template-columns: 268px 1fr 252px;
  height: calc(100vh - 88px); /* 50px header + 38px sub-bar */
}
```

---

## 4. Header Bar

**Height:** 50px  
**Background:** `var(--db-header-bg)` (#1A2B22)  
**Layout:** flex, `align-items: center`, `justify-content: space-between`, `padding: 0 28px`

### 4.1 Left group

```
[BleSaf logo] | [Clinic name]
```

- **Brand:** `font-size: 14px`, `font-weight: 700`, `color: #fff`, `letter-spacing: -0.01em`. The word "Saf" is rendered in `color: #5AAB7A` (use a `<span>` or `<em style="font-style:normal">`).
- **Separator:** `border-left: 1px solid #2A3B2D`, `height: 16px`
- **Clinic name:** `font-size: 12px`, `color: #4A6B52`, `padding-left: 12px`

### 4.2 Right group

Rendered left-to-right: `gap: 10px`

**Clock:** Live time display using `new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })`. Update every 30 seconds via `setInterval`. `font-family: 'IBM Plex Mono'`, `font-size: 12px`, `color: #4A6B52`.

**"File fermée" chip** (shown when queue is closed):
```
background: rgba(230,170,50,0.10)
border: 1px solid rgba(230,170,50,0.18)
color: #C4922A
border-radius: 4px
padding: 5px 12px
font-size: 11px
font-weight: 600
```
Driven by `clinic.isQueueOpen === false`. Hide this chip when queue is open.

**"Présent / Absent" chip** (doctor presence toggle):
```
/* Present state */
background: rgba(90,171,122,0.15)
border: 1px solid rgba(90,171,122,0.20)
color: #5AAB7A
border-radius: 4px
padding: 5px 12px
font-size: 11px
font-weight: 600
```
Leading dot: `width: 6px; height: 6px; border-radius: 50%; background: currentColor`.  
Clicking this chip should call the existing `toggleDoctorPresence()` action. When absent, invert to an amber/grey treatment matching the existing design system.

**Settings icon button:**
```
width: 30px; height: 30px
border: 1px solid #2A3B2D
border-radius: 4px
background: transparent
color: #4A6B52
```
Use `<settings>` MD3 icon (24px). Links to settings page/modal.

---

## 5. Stats Sub-Bar

**Height:** 38px  
**Background:** `var(--db-surface)` (#FFFFFF)  
**Border bottom:** `1px solid var(--db-border)`  
**Padding:** `0 28px`  
**Layout:** flex, `align-items: center`, `gap: 24px`

Display three stats inline, separated by vertical dividers (`width: 1px; height: 18px; background: var(--db-border)`):

| Stat | Value source | Label |
|------|-------------|-------|
| En attente | `queue.filter(e => ['WAITING','NOTIFIED'].includes(e.status)).length` | "En attente" |
| Vus aujourd'hui | `clinic.todayStats.seen` | "Vus aujourd'hui" |
| Min attente max | `Math.max(...queue.map(e => e.waitMinutes), 0)` | "Min attente max" |

Each stat: large value in IBM Plex Mono `font-size: 15px; font-weight: 700; color: var(--db-text-primary)`, followed by label text in `font-size: 11px; color: var(--db-text-secondary)`.

---

## 6. Left Panel (268px)

**Background:** `var(--db-surface)`  
**Border right:** `1px solid var(--db-border)`  
**Overflow:** `overflow-y: auto`

The left panel contains **four** distinct sections, stacked top to bottom in this exact order:

1. Ajouter un patient
2. En consultation
3. Appeler suivant (Call Next button)
4. Partager QR code

Each section (except the Call Next button) uses the shared `.section` wrapper:
```css
.db-section {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--db-border-light);
}
.db-section:last-child {
  border-bottom: none;
}
```

---

### 6.1 Section: Ajouter un patient

**Section label:** "AJOUTER UN PATIENT"

**Input field:**
```
border: 1.5px solid var(--db-border)
border-radius: 7px
padding: 9px 12px
background: var(--db-bg)
display: flex; gap: 8px; align-items: center
transition: border-color 0.2s
```
On `:focus-within`: `border-color: var(--db-accent); background: #fff`

- `<input>` inside: `flex: 1`, `font-size: 13px`, `placeholder: "Nom du patient..."`, `placeholder color: var(--db-text-muted)`, no border, transparent background, `font-family: 'IBM Plex Sans'`
- `+` button: `width: 28px; height: 28px; background: var(--db-accent); border-radius: 5px; color: #fff; font-size: 17px`. Hover: `background: var(--db-accent-dark)`.

**Behaviour:** On submit (Enter key or `+` click), call the existing `addPatient({ name, type: 'WALK_IN' })` action. Clear the input on success. Show a brief toast or inline confirmation. Do **not** add the RDV toggle or Priorité médicale toggle to this section — those were explicitly removed from the design.

---

### 6.2 Section: En consultation

**Section label:** "EN CONSULTATION"

Show this section's content only when `currentPatient !== null`. When no patient is in consultation, show a muted placeholder: `"Aucune consultation en cours"` in `font-size: 12px; color: var(--db-text-muted); text-align: center; padding: 8px 0`.

**Consultation card:**
```
background: var(--db-header-bg)   /* #1A2B22 */
border-radius: 9px
padding: 11px 13px
```

**Internal layout:**

**Top row — tag:**
```
font-size: 9px
text-transform: uppercase
letter-spacing: 0.14em
color: rgba(255,255,255,0.35)
margin-bottom: 6px
display: flex; align-items: center; gap: 7px
```
Leading pulse dot: `width: 5px; height: 5px; border-radius: 50%; background: #5AAB7A; box-shadow: 0 0 5px #5AAB7A`. Apply a CSS keyframe pulse animation:
```css
@keyframes db-pulse {
  0%, 100% { box-shadow: 0 0 5px #5AAB7A; }
  50%       { box-shadow: 0 0 10px #5AAB7A, 0 0 0 3px rgba(90,171,122,0.2); }
}
/* animation: db-pulse 2s ease-in-out infinite */
```

**Middle row — name + timer (flex, space-between):**

Left side:
- Patient name: `font-size: 15px; font-weight: 600; color: #fff`
- Arrival meta: `font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 1px`

Right side (timer):
- Number: IBM Plex Mono, `font-size: 26px; font-weight: 600; color: #5AAB7A; line-height: 1`
- Unit: IBM Plex Mono, `font-size: 11px; color: rgba(255,255,255,0.3)`
- The timer counts up live. Use a `useEffect` with `setInterval(1000)` that reads `currentPatient.consultationStartedAt` and computes elapsed minutes. Update a local `elapsedMinutes` state variable.

**Bottom row — action buttons** (`margin-top: 10px; display: flex; gap: 7px`):

*Terminer button* (flex: 1):
```
background: rgba(255,255,255,0.07)
border: 1px solid rgba(255,255,255,0.10)
color: rgba(255,255,255,0.85)
border-radius: 6px
padding: 7px
font-size: 11px; font-weight: 500
```
Hover: `background: rgba(255,255,255,0.12)`. On click: call `endConsultation(currentPatient.id)` → shows confirmation dialog before executing (existing pattern).

*Phone button* (fixed width: 32px):
```
background: rgba(90,171,122,0.12)
border: 1px solid rgba(90,171,122,0.18)
color: #5AAB7A
border-radius: 6px
width: 32px; height: 32px (implicit from flex)
```
Use MD3 `<call>` icon (18px). On click: `window.open('tel:' + currentPatient.phone)`. Disable + reduce opacity to 0.35 when `currentPatient.phone` is null.

---

### 6.3 Call Next Button

This sits **between** the En consultation section and the QR code section as a standalone block (not inside a `.db-section` wrapper):

```
padding: 0 20px 14px
```

**Primary "Appeler suivant" button:**
```
width: 100%
background: var(--db-accent)
border: none; border-radius: 7px
padding: 11px 16px
color: #fff
font-size: 13px; font-weight: 600
letter-spacing: 0.01em
display: flex; align-items: center; justify-content: center; gap: 8px
transition: background 0.2s
```
Hover: `background: var(--db-accent-dark)`.

Disabled state (no patients waiting): `background: var(--db-border); color: var(--db-text-muted); cursor: not-allowed`.

Leading arrow icon: MD3 `<arrow_forward>` (16px).

**Confirmation flash on click:**
When clicked successfully, the button text changes to `"✓ [PatientFirstName] appelé(e)"` and background changes to `var(--db-accent-dark)` for 2.2 seconds, then reverts. Implement this with a local `calledState` boolean state.

**Sub-label** below the button:
```
text-align: center
font-size: 10px
color: var(--db-text-muted)
margin-top: 7px
```
Text: `"Prochain : "` + `<strong style="color: var(--db-text-secondary); font-weight: 600">{nextPatient.name}</strong>` + ` · pos. {nextPatient.position} · {nextPatient.waitMinutes} min`.  
Show nothing (empty string) when queue is empty.

On click: call `callNextPatient()` from the queue store. This triggers the existing Socket.io emission to notify the patient.

---

### 6.4 Section: Partager QR code

**Section label:** "PARTAGER QR CODE"

**Three equal-width icon buttons in a flex row** (`gap: 8px`):

```
/* Each button */
flex: 1
display: flex; flex-direction: column; align-items: center; gap: 7px
padding: 11px 6px 10px
background: var(--db-bg)
border: 1.5px solid var(--db-border)
border-radius: 10px
cursor: pointer
transition: border-color 0.15s, background 0.15s
font-family: 'IBM Plex Sans'
```
Hover: `border-color: var(--db-accent); background: var(--db-accent-light)`.

**Each button has:**
1. An icon container (`width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center`)
2. A text label (`font-size: 10px; font-weight: 600; color: var(--db-text-secondary); white-space: nowrap`)

#### Button 1 — Copier

Icon container background: `var(--db-accent-light)`, icon color: `var(--db-accent)`.  
Icon: MD3 `<content_copy>` (18px).  
Label: "Copier"

**On click:**
```typescript
navigator.clipboard.writeText(`https://${clinicQrUrl}`)
  .then(() => {
    setLabelOverride('Copié !');
    setBtnState('copied'); // adds border-color: #2a5547, background: rgba(42,85,71,0.07)
    setTimeout(() => { setLabelOverride(null); setBtnState('idle'); }, 2000);
  });
```

Hover icon background: `rgba(53,107,88,0.18)`.

#### Button 2 — WhatsApp

Icon container background: `#E4F7EB`, icon color: `#1A7A3C`.  
Icon: WhatsApp SVG logo (18px). Use the standard WhatsApp path:
```
M17.472 14.382c-.297-.149-1.758-.867-2.03-.967...
(full SVG path — see implementation notes below)
```
Label: "WhatsApp"

**On click / href:** `https://wa.me/?text=${encodeURIComponent('https://' + clinicQrUrl)}` — open in new tab.

Render as `<a href={waLink} target="_blank" rel="noopener noreferrer">` styled as a button. Include `role="button"` for accessibility.

Hover icon background: `rgba(37,211,102,0.18)`.

#### Button 3 — Afficher QR

Icon container background: `#EEEEFF`, icon color: `#4A5ABA`.  
Icon: MD3 `<qr_code_2>` (18px). If MD3 qr_code_2 is not available, use a custom SVG with the QR corner-bracket pattern.  
Label: "Afficher QR"

**On click:** Open the QR Modal (section 9).

Hover icon background: `rgba(74,90,186,0.14)`.

---

## 7. Center Panel (fluid)

**Background:** `var(--db-bg)` (#F2F4F1)  
**Overflow:** `overflow-y: auto`

### 7.1 Queue Header Bar

Sticky at `top: 0`, `z-index: 10`.
```
background: var(--db-surface)
border-bottom: 1px solid var(--db-border)
padding: 12px 20px
display: flex; align-items: center; justify-content: space-between
```

**Left:** `"File d'attente · {n} patients restants"` — `font-size: 12px; font-weight: 600; color: var(--db-text-primary)`. `n` = count of non-completed entries.

**Right:** Filter chips row (`gap: 5px`):

```
/* Each chip */
padding: 4px 10px
border-radius: 4px
border: 1px solid var(--db-border)
background: transparent
color: var(--db-text-secondary)
font-size: 10px; font-weight: 500
cursor: pointer
transition: all 0.15s
font-family: 'IBM Plex Sans'
```

Active chip: `background: var(--db-accent-light); border-color: rgba(53,107,88,0.3); color: var(--db-accent); font-weight: 600`.

Filter options: **Tous** · **En attente** · **Notifiés** · **Sans tél.**

Filter logic:
- "Tous" → show all `WAITING | NOTIFIED` entries
- "En attente" → `status === 'WAITING'`
- "Notifiés" → `status === 'NOTIFIED'`
- "Sans tél." → `phone === null`

Store the active filter in local component state.

### 7.2 Queue Table

```css
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  background: var(--db-surface);
  border-bottom: 2px solid var(--db-border);
  position: sticky;
  top: 49px; /* height of the topbar */
  z-index: 9;
}
thead th {
  padding: 10px 14px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: var(--db-text-muted);
  text-align: left;
  font-weight: 600;
}
tbody tr {
  background: var(--db-surface);
  border-bottom: 1px solid var(--db-border-light);
  cursor: pointer;
  transition: background 0.12s;
}
tbody tr:hover { background: #F8FAF9; }
tbody td { padding: 13px 14px; font-size: 12px; vertical-align: middle; }
```

**Columns (in order):**

| Column | Header | Width | Content |
|--------|--------|-------|---------|
| # | # | ~40px | Position number. IBM Plex Mono, `font-size: 11px; font-weight: 700; color: var(--db-text-muted)`. Zero-padded: "02", "03"... |
| Avatar | *(empty)* | ~50px | Coloured initial chip. See avatar spec below. |
| Patient | PATIENT | fluid | Patient name. `font-weight: 500; color: var(--db-text-primary)`. |
| Arrivée | ARRIVÉE | ~80px | Arrival time (HH:MM). IBM Plex Mono, `font-size: 11px; color: var(--db-text-muted)`. |
| Attente | ATTENTE | ~130px | Wait bar. See wait bar spec below. |
| Statut | STATUT | ~100px | Status badge. See badge spec below. |
| Actions | ACTIONS | ~80px | Action buttons. |

**Avatar chip:**
```
width: 32px; height: 32px; border-radius: 7px
display: flex; align-items: center; justify-content: center
font-size: 12px; font-weight: 700
```
Derive background and foreground from patient name initial using a deterministic colour palette (5 colours, `nameInitial.charCodeAt(0) % 5`):
```typescript
const avatarColors = [
  { bg: '#DCF2E3', fg: '#1D5E32' },  // green
  { bg: '#FEF3E2', fg: '#9A5A1A' },  // amber
  { bg: '#F0EDF8', fg: '#6B4FA0' },  // purple
  { bg: '#E8F0FC', fg: '#4060A0' },  // blue
  { bg: '#FDE8E8', fg: '#9A3030' },  // red
];
```

**Wait bar:**
```
display: flex; align-items: center; gap: 8px
```
- Value label: IBM Plex Mono, `font-size: 11px; font-weight: 600; color: var(--db-text-primary); width: 38px`
- Bar track: `flex: 1; height: 4px; background: var(--db-border); border-radius: 2px; max-width: 70px; overflow: hidden`
- Bar fill: `height: 100%; border-radius: 2px`. Width = `(waitMinutes / maxWaitMinutes) * 100%`. Colour graduated:
  - 0–20 min: `#AACBB0`
  - 21–30 min: `#7ABB8A`
  - 31–40 min: `#5AAB7A`
  - 41+ min: `#356B58`

**Status badges:**
```
display: inline-block
padding: 3px 8px; border-radius: 3px
font-size: 9px; font-weight: 700
text-transform: uppercase; letter-spacing: 0.06em
```
| Status | Background | Foreground | Label |
|--------|-----------|-----------|-------|
| `NOTIFIED` | `#DCF2E3` | `#1D5E32` | Notifié(e) |
| `WAITING` | `#F0F4F2` | `#4A7060` | En attente |
| no phone | `#FEF3E2` | `#9A5A1A` | Sans tél. |

**Row action buttons** (`display: flex; gap: 4px`):
Each: `width: 26px; height: 26px; border: 1px solid var(--db-border); border-radius: 4px; background: transparent; cursor: pointer; color: var(--db-text-muted); font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.15s`.  
Hover: `border-color: var(--db-accent); color: var(--db-accent)`.

Three buttons per row:
1. **Phone** — MD3 `<phone>` icon. `onClick: () => window.open('tel:' + entry.phone)`. Disabled + `opacity: 0.3; cursor: not-allowed` when `entry.phone === null`.
2. **Urgency star** — MD3 `<star>` icon. `onClick: () => markUrgent(entry.id)`. When `entry.priority === 'URGENT'`, icon filled in amber.
3. **Context menu** — MD3 `<more_vert>` icon. `onClick: () => openEntryMenu(entry.id)`. Opens a dropdown with: "Urgence", "Copier URL position", "Retirer de la file".

**Empty state:** When queue is empty (or filter yields no results), show centered: `"Aucun patient en attente"` in `font-size: 13px; color: var(--db-text-muted)` with a ghost queue icon above.

---

## 8. Right Panel (252px)

**Background:** `var(--db-surface)`  
**Border left:** `1px solid var(--db-border)`  
**Overflow:** `overflow-y: auto`

Each section uses:
```css
.db-r-section {
  padding: 16px 18px;
  border-bottom: 1px solid var(--db-border-light);
}
.db-r-section:last-child { border-bottom: none; }
```

Section label: same style as left panel (`9px, uppercase, letter-spacing 0.14em, var(--db-text-muted), bold`).

### 8.1 Section: Statistiques

**2×2 grid** (`gap: 8px`):

```css
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
```

Each stat card:
```
background: var(--db-bg)
border-radius: 7px
padding: 12px 14px
```
The **En attente** card uses `background: var(--db-accent-light)` and value color `var(--db-accent)`.

Inside each card:
- Value: IBM Plex Mono, `font-size: 26px; font-weight: 600; color: var(--db-text-primary); line-height: 1`
- Label: `font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--db-text-muted); margin-top: 5px`

Four stats:
| Position | Value | Label |
|----------|-------|-------|
| Top-left (accent) | `waitingCount` | EN ATTENTE |
| Top-right | `todayStats.seen` | VUS |
| Bottom-left | `maxWaitMinutes` | MIN MAX |
| Bottom-right | `currentConsultationMinutes` | MIN CONSULT. |

### 8.2 Section: Temps d'attente

One row per patient currently in queue, showing their name and elapsed wait time as a horizontal bar.

```
margin-bottom: 11px   (last child: margin-bottom: 0)
```

Row header:
```
display: flex; justify-content: space-between; margin-bottom: 5px
```
- Name: `font-size: 11px; font-weight: 500; color: var(--db-text-primary)`
- Value: IBM Plex Mono, `font-size: 11px; color: var(--db-text-secondary)`

Bar track: `height: 5px; background: var(--db-border); border-radius: 3px; overflow: hidden`  
Bar fill: `height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--db-accent), var(--db-accent-mid))`  
Fill width: `(entry.waitMinutes / maxWaitMinutes) * 100%`, clamped to `[2%, 100%]`.

Sort by wait time descending (longest waiter at top).

---

## 9. QR Code Modal

The modal is a **fixed overlay**, triggered by clicking "Afficher QR" in the left panel.

**Overlay:**
```
position: fixed; inset: 0
background: rgba(0,0,0,0.60)
z-index: 9000
display: flex; align-items: center; justify-content: center
```
Click outside card to dismiss.

**Card:**
```
background: #fff
border-radius: 16px
padding: 32px
text-align: center
max-width: 300px; width: 90%
box-shadow: 0 24px 64px rgba(0,0,0,0.25)
```

**Card contents (top to bottom):**
1. Section label: "QR D'ENREGISTREMENT" — `font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--db-text-muted); font-weight: 600; margin-bottom: 16px`
2. QR code image container: `width: 180px; height: 180px; margin: 0 auto 16px; background: var(--db-bg); border-radius: 12px; border: 1px solid var(--db-border); display: flex; align-items: center; justify-content: center`. Render the actual QR code using the `qrcode.react` library (`<QRCodeSVG value={clinicQrUrl} size={148} fgColor="#356B58" />`).
3. URL pill: `font-family: 'IBM Plex Mono'; font-size: 11px; color: var(--db-accent); background: var(--db-accent-light); padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 20px`. Show the clinic's short URL.
4. Two buttons in a flex row (`gap: 8px`):
   - **Fermer:** `flex: 1; padding: 10px; border: 1.5px solid var(--db-border); border-radius: 7px; background: transparent; font-size: 12px; font-weight: 500; color: var(--db-text-secondary)`. On click: close modal.
   - **Télécharger:** `flex: 1; padding: 10px; border: none; border-radius: 7px; background: var(--db-accent); font-size: 12px; font-weight: 600; color: #fff`. On click: trigger SVG download (convert QR SVG to PNG using canvas, download as `qr-blesaf-{clinicSlug}.png`).

---

## 10. Component Architecture

Break the desktop dashboard into the following component tree. Each component should receive only the props it needs — avoid drilling full store objects.

```
DashboardPage.tsx
└── DesktopDashboard.tsx                    (gated by: window.innerWidth >= 1024)
    ├── DashboardHeader.tsx
    │   └── PresenceChip.tsx
    ├── DashboardStatsBar.tsx
    ├── DashboardLayout.tsx                  (grid wrapper)
    │   ├── LeftPanel.tsx
    │   │   ├── AddPatientSection.tsx
    │   │   ├── ConsultationCard.tsx
    │   │   │   └── ConsultationTimer.tsx    (isolated timer state)
    │   │   ├── CallNextButton.tsx
    │   │   └── QrShareSection.tsx
    │   │       └── QrModal.tsx
    │   ├── QueueTable.tsx
    │   │   ├── QueueFilterBar.tsx
    │   │   ├── QueueTableRow.tsx
    │   │   └── QueueEmptyState.tsx
    │   └── RightPanel.tsx
    │       ├── StatsGrid.tsx
    │       └── WaitTimeBars.tsx
    └── (MobileDashboard.tsx — unchanged, shown on mobile)
```

**Breakpoint guard in `DashboardPage.tsx`:**
```tsx
const isMobile = useMediaQuery('(max-width: 1023px)');
return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
```
Use the existing `useMediaQuery` hook or add one.

---

## 11. TypeScript Interfaces

Ensure these types are aligned with the Prisma schema. Add to `web/src/types/dashboard.ts` if not already present:

```typescript
export type QueueEntryStatus = 'WAITING' | 'NOTIFIED' | 'IN_CONSULTATION' | 'COMPLETED';

export interface QueueEntry {
  id: string;
  clinicId: string;
  patientName: string;
  phone: string | null;
  position: number;
  status: QueueEntryStatus;
  arrivedAt: string;           // ISO timestamp
  calledAt: string | null;
  consultationStartedAt: string | null;
  completedAt: string | null;
  waitMinutes: number;         // derived: (now - arrivedAt) in minutes
  priority: 'NORMAL' | 'URGENT';
  appointmentType: 'WALK_IN' | 'APPOINTMENT';
}

export interface ConsultationState {
  patient: QueueEntry | null;
  elapsedMinutes: number;      // live-updated via timer
}

export interface DashboardStats {
  waitingCount: number;
  seenToday: number;
  maxWaitMinutes: number;
  consultationMinutes: number;
}
```

---

## 12. State Management

Use the existing Zustand queue store. Add selectors if they don't exist:

```typescript
// In queueStore.ts — add these selectors if missing

export const selectWaitingEntries = (state: QueueStore) =>
  state.queue.filter(e => e.status === 'WAITING' || e.status === 'NOTIFIED')
    .sort((a, b) => a.position - b.position);

export const selectCurrentPatient = (state: QueueStore) =>
  state.queue.find(e => e.status === 'IN_CONSULTATION') ?? null;

export const selectNextPatient = (state: QueueStore) =>
  state.queue
    .filter(e => e.status === 'WAITING' || e.status === 'NOTIFIED')
    .sort((a, b) => a.position - b.position)[0] ?? null;

export const selectMaxWait = (state: QueueStore) =>
  Math.max(0, ...state.queue
    .filter(e => e.status === 'WAITING' || e.status === 'NOTIFIED')
    .map(e => e.waitMinutes));
```

---

## 13. Live Timer for Consultation Card

`ConsultationTimer.tsx` is isolated so its `setInterval` does not re-render the whole dashboard:

```typescript
const ConsultationTimer: React.FC<{ startedAt: string }> = ({ startedAt }) => {
  const [minutes, setMinutes] = useState(() =>
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
    }, 10000); // update every 10s is sufficient for minute-level display
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="db-timer-row">
      <span className="db-tv">{minutes}</span>
      <span className="db-tu">min</span>
    </div>
  );
};
```

---

## 14. QR URL Resolution

The QR URL displayed and copied is the patient-facing check-in URL for this clinic. Derive it from the clinic slug:

```typescript
const clinicQrUrl = `blesaf.tn/q/${clinic.slug}`;
const clinicQrFullUrl = `https://${clinicQrUrl}`;
```

The `clinic.slug` should already be available via the clinic store. If not, add it to the `GET /api/clinic/:id` response and Prisma schema.

WhatsApp share link:
```typescript
const waLink = `https://wa.me/?text=${encodeURIComponent(
  `Voici le lien pour rejoindre la file d'attente du cabinet : ${clinicQrFullUrl}`
)}`;
```

---

## 15. Accessibility Requirements

- All icon-only buttons must have `aria-label` in French. Examples: `aria-label="Appeler le patient"`, `aria-label="Copier le lien"`, `aria-label="Afficher le QR code"`.
- The QR modal must trap focus when open. Use a `<FocusTrap>` wrapper or `dialog` element.
- The queue table must be a proper `<table>` with `<thead>/<tbody>/<th scope="col">` for screen reader column association.
- The consultation timer live region: wrap in `<span aria-live="polite" aria-atomic="true">` so screen readers announce updates.
- Chips and status badges must use `role="status"` where they convey live information.
- Filter buttons should use `aria-pressed={isActive}`.

---

## 16. i18n Keys

All visible strings must use the existing i18n system (`useTranslation`). Add the following keys to `web/src/i18n/fr.json` (and their Arabic equivalents in `ar.json`):

```json
{
  "dashboard": {
    "header": {
      "queueOpen": "File ouverte",
      "queueClosed": "File fermée",
      "present": "Présent",
      "absent": "Absent",
      "settings": "Paramètres"
    },
    "stats": {
      "waiting": "En attente",
      "seenToday": "Vus aujourd'hui",
      "maxWait": "Min attente max"
    },
    "addPatient": {
      "label": "Ajouter un patient",
      "placeholder": "Nom du patient...",
      "addButton": "Ajouter"
    },
    "consultation": {
      "label": "En consultation",
      "currentPatient": "Patient actuel",
      "noConsultation": "Aucune consultation en cours",
      "minInRoom": "min",
      "endButton": "Terminer",
      "callButton": "Appeler"
    },
    "callNext": {
      "button": "Appeler suivant",
      "confirmed": "appelé(e)",
      "next": "Prochain",
      "noQueue": "File vide"
    },
    "qr": {
      "label": "Partager QR code",
      "copy": "Copier",
      "copied": "Copié !",
      "whatsapp": "WhatsApp",
      "display": "Afficher QR",
      "modalTitle": "QR d'enregistrement",
      "close": "Fermer",
      "download": "Télécharger"
    },
    "queue": {
      "title": "File d'attente",
      "remaining": "patients restants",
      "filters": {
        "all": "Tous",
        "waiting": "En attente",
        "notified": "Notifiés",
        "noPhone": "Sans tél."
      },
      "columns": {
        "position": "#",
        "patient": "Patient",
        "arrival": "Arrivée",
        "wait": "Attente",
        "status": "Statut",
        "actions": "Actions"
      },
      "empty": "Aucun patient en attente",
      "statuses": {
        "notified": "Notifié(e)",
        "waiting": "En attente",
        "noPhone": "Sans tél."
      },
      "rowActions": {
        "call": "Appeler",
        "urgent": "Marquer urgent",
        "menu": "Options"
      }
    },
    "stats": {
      "label": "Statistiques",
      "waiting": "EN ATTENTE",
      "seen": "VUS",
      "maxWait": "MIN MAX",
      "consultMin": "MIN CONSULT."
    },
    "waitTimes": {
      "label": "Temps d'attente"
    }
  }
}
```

For Arabic RTL: the 3-column grid **reverses column order** (`direction: rtl` on `.desktop-layout`). Verify that `border-left`/`border-right` on the panels swap correctly — use `border-inline-start`/`border-inline-end` instead of directional properties.

---

## 17. Integration with Existing Socket.io Events

The desktop dashboard must react to the same real-time events as the mobile dashboard. Ensure these Socket.io event handlers update the Zustand queue store, which then re-renders the desktop view reactively:

| Event | Action |
|-------|--------|
| `queue:updated` | Re-fetch or patch queue entries in store |
| `patient:called` | Update entry `status → NOTIFIED`, show toast |
| `consultation:started` | Update entry `status → IN_CONSULTATION`, start timer |
| `consultation:ended` | Update entry `status → COMPLETED`, clear current patient |
| `patient:joined` | Add new entry to store |
| `patient:removed` | Remove entry from store, recalculate positions |

If the desktop dashboard subscribes to the clinic Socket.io room independently, ensure the `join:clinic` call uses the **authenticated token** (fixing the existing security vulnerability).

---

## 18. Implementation Order

Work through components in this order to allow incremental testing:

1. **Design tokens** — Add CSS custom properties to `index.css`
2. **DashboardStatsBar** — Static, no interactivity
3. **DashboardHeader** — PresenceChip toggle logic
4. **DesktopDashboard layout shell** — 3-column grid, empty panels
5. **QueueTable + QueueFilterBar** — Largest component, test with mock data
6. **StatsGrid + WaitTimeBars** — Right panel, pure derived data
7. **AddPatientSection** — Form + store action
8. **ConsultationCard + ConsultationTimer** — Dark card with live timer
9. **CallNextButton** — Confirmation flash, disabled state
10. **QrShareSection** — Three icon buttons, copy feedback
11. **QrModal** — Focus trap, QR generation, download
12. **Breakpoint gate** — Wire `DashboardPage.tsx` to show `DesktopDashboard` vs `MobileDashboard`
13. **i18n pass** — Replace all hardcoded strings with `t()` calls
14. **Accessibility pass** — `aria-label`, `role`, focus trap, live regions
15. **RTL pass** — Verify Arabic layout

---

## 19. Do Not Touch

- `MobileDashboard.tsx` — zero modifications
- `PatientStatusPage.tsx` — zero modifications
- `CheckInPage.tsx` — zero modifications
- Prisma schema — no new migrations required for this feature
- Existing Socket.io event names — do not rename
- Existing Zustand store shape — only **add** selectors, do not remove fields
