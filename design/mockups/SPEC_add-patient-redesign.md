# Implementation Spec — Add Patient Flow Redesign

**Target files:** `AddPatientModal.tsx`, `SuccessSheet.tsx` (or equivalent confirmation component), `queue.ts` (route), `prisma/schema.prisma`
**Design reference:** Updated mockup `blesaf-add-patient-mockup.html`
**Priority:** High — directly impacts receptionist daily workflow and WhatsApp adoption rate

---

## 0. Icon System Rule — No Emojis

**All emojis must be replaced with Material Symbols Outlined.** This applies globally to every component touched in this spec, and should be audited in adjacent components as well.

### Setup

Ensure the font is loaded in the app's `index.html` or global CSS entry point:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0"
  rel="stylesheet"
/>
```

### Usage pattern

Create a shared `Icon` component at `web/src/components/ui/Icon.tsx`:

```tsx
interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  className?: string;
}

export function Icon({ name, size = 20, fill = false, weight = 400, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {name}
    </span>
  );
}
```

### Icon reference map — replacements for this spec

| Removed emoji / symbol | MD3 icon name         | Context                        |
|------------------------|-----------------------|--------------------------------|
| `🚶` walking person    | `directions_walk`     | Visit type — sans rendez-vous  |
| `📅` calendar          | `calendar_today`      | Visit type — avec rendez-vous  |
| `🔍` magnifier         | `search`              | Name field suffix              |
| `📞` phone             | `phone`               | Autocomplete patient meta      |
| `♻` recycle            | `history`             | Returning patient badge        |
| `⚡` lightning         | `priority_high`       | Priority toggle                |
| `ℹ️` info             | `info`                | Phone format helper text       |
| `📱` phone device      | `smartphone`          | WhatsApp button icon           |
| `+` plus               | `add`                 | Add another patient button     |
| `›` chevron            | `chevron_right`       | WhatsApp button trailing arrow |
| `✓` checkmark text     | SVG circle-check      | Success screen icon (see §4.1) |

---

## 1. Database — New `Patient` Model

### 1.1 Schema addition

Add to `prisma/schema.prisma`:

```prisma
model Patient {
  id         String     @id @default(uuid())
  clinicId   String
  name       String
  phone      String?
  visitCount Int        @default(1)
  lastVisitAt DateTime  @updatedAt
  createdAt  DateTime   @default(now())
  deletedAt  DateTime?  // soft-delete for RGPD compliance

  clinic   Clinic       @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  entries  QueueEntry[]

  @@unique([clinicId, phone])  // one record per phone number per clinic
  @@index([clinicId, name])    // autocomplete search index
  @@index([clinicId, lastVisitAt])
}
```

Update `QueueEntry` to reference `Patient` optionally (non-breaking):

```prisma
model QueueEntry {
  // ... existing fields ...
  patientId  String?
  patient    Patient? @relation(fields: [patientId], references: [id])
}
```

### 1.2 Migration

```bash
npx prisma migrate dev --name add_patient_model
```

### 1.3 Backfill script (run once after migration)

Create `scripts/backfill-patients.ts`:

```typescript
// For every existing QueueEntry that has a phone number,
// upsert a Patient record keyed on (clinicId, phone).
// Entries without a phone number are left with patientId = null.

const entries = await prisma.queueEntry.findMany({
  where: { phone: { not: null } },
  orderBy: { arrivedAt: 'asc' },
});

for (const entry of entries) {
  const patient = await prisma.patient.upsert({
    where: { clinicId_phone: { clinicId: entry.clinicId, phone: entry.phone! } },
    create: {
      clinicId: entry.clinicId,
      name: entry.patientName,
      phone: entry.phone,
      visitCount: 1,
    },
    update: {
      visitCount: { increment: 1 },
      name: entry.patientName, // keep most recent name spelling
    },
  });
  await prisma.queueEntry.update({
    where: { id: entry.id },
    data: { patientId: patient.id },
  });
}
```

---

## 2. Backend — New API Endpoint for Autocomplete

### 2.1 Route

Add to `api/src/routes/queue.ts` (or a new `patients.ts` route file):

```
GET /api/clinics/:clinicId/patients/search?q=sel
```

**Auth:** Requires valid clinic JWT (same middleware as dashboard routes).

**Query params:**
- `q` — string, minimum 2 characters, required

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Selima Ben Ali",
    "phone": "55123456",
    "visitCount": 4,
    "lastVisitAt": "2026-02-12T10:23:00Z"
  }
]
```

**Implementation:**

```typescript
router.get('/clinics/:clinicId/patients/search', requireAuth, async (req, res) => {
  const { clinicId } = req.params;
  const { q } = req.query;

  if (!q || String(q).length < 2) {
    return res.json([]);
  }

  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      deletedAt: null,
      name: {
        contains: String(q),
        mode: 'insensitive',
      },
    },
    orderBy: { lastVisitAt: 'desc' },
    take: 5,
    select: { id: true, name: true, phone: true, visitCount: true, lastVisitAt: true },
  });

  res.json(patients);
});
```

### 2.2 Update the add-patient route

When `POST /api/queue/add` is called, upsert the `Patient` record automatically:

```typescript
// Inside the add patient handler, after creating the QueueEntry:
if (phone) {
  const patient = await prisma.patient.upsert({
    where: { clinicId_phone: { clinicId, phone } },
    create: { clinicId, name: patientName, phone, visitCount: 1 },
    update: { visitCount: { increment: 1 }, name: patientName },
  });
  await prisma.queueEntry.update({
    where: { id: newEntry.id },
    data: { patientId: patient.id },
  });
}
```

### 2.3 Priority insertion

When `priority: true` is passed in the add-patient request body, insert the patient at position 2 (immediately after the current IN_CONSULTATION patient) rather than at the end of the queue.

Add to request body schema:
```typescript
priority?: boolean  // defaults to false
```

In the queue insertion logic, if `priority === true`:
1. Find the current max position among `WAITING` entries.
2. Shift all `WAITING` entries at position >= 2 up by one (`position + 1`).
3. Insert the new entry at position 2 with status `NOTIFIED`.
4. Emit a socket event `queue:reordered` to the clinic room.

---

## 3. Component — `AddPatientModal.tsx` Redesign

### 3.1 Overview of structural changes

The modal is refactored as a **bottom sheet** that slides up over a dimmed, blurred version of the dashboard. It replaces the previous centered modal pattern.

Remove from the current modal:
- The "Sera en position #X · Attente estimée Y min" subtitle
- The QR code secondary CTA button

Add to the current modal:
- Patient name autocomplete dropdown
- MD3 filter chip visit-type selector (replacing the previous card-style toggle)
- Live phone digit counter
- Priority medical toggle

### 3.2 Bottom sheet wrapper

```tsx
// BottomSheet.tsx — reusable wrapper
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'bg-black/45 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
          transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-0" />
        {children}
      </div>
    </>
  );
}
```

### 3.3 Component state

```typescript
interface AddPatientModalState {
  name: string;
  phone: string;                       // digits only, no prefix
  visitType: 'walk-in' | 'appointment';
  priority: boolean;
  // Autocomplete
  suggestions: PatientSuggestion[];
  selectedPatient: PatientSuggestion | null;
  showSuggestions: boolean;
  // UI
  isSubmitting: boolean;
  phoneDigitCount: number;             // derived: phone.replace(/\D/g,'').length
}
```

### 3.4 Field 1 — Patient name with autocomplete

**Behaviour:**
- The name field receives `autoFocus` when the sheet opens. Use `useEffect` with a `setTimeout(fn, 100)` to trigger focus after the sheet animation completes.
- After the user types 2 or more characters, fire a debounced search (300ms) to `GET /api/clinics/:clinicId/patients/search?q=<name>`.
- Display the results as a dropdown attached directly below the input (not a floating popover).
- Selecting a suggestion: fills `name` and `phone` fields, sets `selectedPatient`, hides the dropdown.
- If the user clears the name field, clear `selectedPatient` and reset `phone` only if it was auto-filled.

**Input element:**
```tsx
<div className="relative">
  <input
    type="text"
    value={name}
    onChange={handleNameChange}
    onFocus={() => name.length >= 2 && setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
    placeholder={t('addPatient.namePlaceholder')}  // "Prénom et nom…"
    autoComplete="off"
    className="w-full bg-surface-variant border-2 border-outline-variant rounded-lg
               px-3 py-[11px] pr-10 text-[15px] font-medium text-on-surface
               focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none
               transition-all duration-150"
  />
  <Icon name="search" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
</div>
```

**Suggestion row:**
```tsx
{showSuggestions && suggestions.length > 0 && (
  <div className="border-2 border-t-0 border-primary/40 rounded-b-lg overflow-hidden -mt-[2px]">
    {suggestions.map(s => (
      <button
        key={s.id}
        type="button"
        onMouseDown={() => selectSuggestion(s)}  // mousedown fires before input blur
        className="w-full flex items-center gap-3 px-3 py-2 bg-white
                   hover:bg-primary/5 transition-colors"
      >
        {/* Avatar — initials */}
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-content-center
                        text-white text-[11px] font-bold flex-shrink-0">
          {s.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[13px] font-semibold text-on-surface truncate">{s.name}</div>
          <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
            <Icon name="phone" size={11} />
            {formatPhone(s.phone)} · {t('addPatient.lastVisit')} {formatRelativeDate(s.lastVisitAt)}
          </div>
        </div>
        {/* Returning badge */}
        <span className="flex-shrink-0 bg-primary-container text-primary text-[9px] font-bold
                         uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-1">
          <Icon name="history" size={10} />
          {t('addPatient.returning')}
        </span>
      </button>
    ))}
  </div>
)}
```

### 3.5 Field 2 — Visit type filter chips

Render after the name field. The selector uses a segmented pill container — a single rounded background track with the active chip rendered as a white elevated chip inside it.

```tsx
<div className="flex items-center bg-surface-variant rounded-full p-[3px]
                border border-outline-variant">
  {(['walk-in', 'appointment'] as const).map((type) => (
    <button
      key={type}
      type="button"
      onClick={() => setVisitType(type)}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5
                  rounded-full text-[12px] font-medium transition-all duration-150
                  ${visitType === type
                    ? 'bg-white text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant bg-transparent'
                  }`}
    >
      <Icon
        name={type === 'walk-in' ? 'directions_walk' : 'calendar_today'}
        size={15}
        fill={visitType === type}
        className={visitType === type ? 'text-primary' : 'text-on-surface-variant'}
      />
      {type === 'walk-in' ? t('addPatient.walkIn') : t('addPatient.appointment')}
    </button>
  ))}
</div>
```

i18n keys:
- `addPatient.walkIn` → "Sans rendez-vous" (fr) / "بدون موعد" (ar)
- `addPatient.appointment` → "Avec rendez-vous" (fr) / "مع موعد" (ar)

### 3.6 Field 3 — Phone number input

The phone input is split into two elements: a non-editable country prefix badge and the digit input. They appear as a single unified field.

**Digit counter logic:**
```typescript
const digits = phone.replace(/\D/g, '');
const digitCount = digits.length;   // 0–8
const isComplete = digitCount === 8;
```

**Rendering:**
```tsx
<div className="flex gap-1.5 items-start">
  {/* Prefix badge — non-editable */}
  <div className="h-[42px] px-2.5 flex items-center gap-1.5 flex-shrink-0
                  bg-primary-container border-2 border-primary/40 rounded-lg
                  text-[13px] font-bold text-primary font-mono">
    +216
  </div>

  {/* Digit input */}
  <div className="relative flex-1">
    <input
      type="tel"
      inputMode="numeric"
      value={phone}
      onChange={handlePhoneChange}
      maxLength={11}               // "XX XXX XXX" with spaces = 10 chars
      placeholder="XX XXX XXX"
      className="w-full bg-surface-variant border-2 border-outline-variant rounded-lg
                 px-3 py-[9px] pr-12 text-[13px] font-medium font-mono tracking-wide
                 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10
                 outline-none transition-all duration-150"
    />
    {/* Counter */}
    <span className={`absolute right-3 top-1/2 -translate-y-1/2
                      text-[10px] font-bold font-mono transition-colors
                      ${isComplete ? 'text-primary' : 'text-on-surface-variant'}`}>
      {digitCount} / 8
    </span>
  </div>
</div>

{/* Helper text */}
<div className="flex items-center gap-1 mt-1">
  <Icon name="info" size={12} className="text-on-surface-variant flex-shrink-0" />
  <span className="text-[11px] text-on-surface-variant">
    {t('addPatient.phoneHelp')}  {/* "8 chiffres après +216, ex : 55 123 456" */}
  </span>
</div>
```

**Phone formatting function:**
```typescript
function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
  const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
  // Format as "XX XXX XXX"
  let formatted = raw;
  if (raw.length > 2) formatted = raw.slice(0, 2) + ' ' + raw.slice(2);
  if (raw.length > 5) formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6);
  setPhone(formatted);
}
```

### 3.7 Field 4 — Priority toggle

```tsx
<div className="flex items-center justify-between bg-amber-50 border border-amber-200
                rounded-lg px-3 py-2.5">
  <div className="flex items-center gap-2">
    <Icon name="priority_high" size={18} className="text-amber-600 flex-shrink-0" />
    <div>
      <div className="text-[12px] font-semibold text-amber-900">
        {t('addPatient.priorityLabel')}  {/* "Priorité médicale" */}
      </div>
      <div className="text-[10px] text-amber-700">
        {t('addPatient.prioritySub')}    {/* "Passe en position #2" */}
      </div>
    </div>
  </div>

  {/* Toggle */}
  <button
    type="button"
    role="switch"
    aria-checked={priority}
    onClick={() => setPriority(p => !p)}
    className={`relative w-9 h-5 rounded-full transition-colors duration-200
                ${priority ? 'bg-amber-500' : 'bg-gray-200'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm
                      transition-all duration-200
                      ${priority ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
</div>
```

### 3.8 Submit button

```tsx
<button
  type="button"
  disabled={!name.trim() || isSubmitting}
  onClick={handleSubmit}
  className="w-full flex items-center justify-center gap-2
             bg-primary text-white font-bold text-[15px]
             py-3.5 rounded-xl shadow-md shadow-primary/30
             disabled:opacity-50 disabled:cursor-not-allowed
             active:scale-[0.98] transition-all duration-150"
>
  {isSubmitting ? (
    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
  ) : (
    <Icon name="arrow_forward" size={18} />
  )}
  {t('addPatient.submit')}  {/* "Ajouter à la file" */}
</button>
```

---

## 4. Component — Success Confirmation Sheet

### 4.1 Success icon

Replace the `✓` text character with a proper SVG icon:

```tsx
<div className="w-[52px] h-[52px] bg-primary rounded-full flex items-center justify-center
                shadow-[0_0_0_8px] shadow-primary/15 animate-pop-in">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</div>
```

Add the `pop-in` keyframe to the global stylesheet:
```css
@keyframes pop-in {
  from { transform: scale(0.3); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.animate-pop-in {
  animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 4.2 Patient info display

```tsx
<div className="text-center py-5 bg-gradient-to-b from-primary/5 to-white
                border-b border-outline-variant rounded-t-3xl">
  {/* Success icon — see §4.1 */}

  <h2 className="text-xl font-bold text-on-surface mt-3">{patientName}</h2>

  {/* Returning patient badge — only shown if patient was auto-completed */}
  {isReturningPatient && (
    <div className="inline-flex items-center gap-1 mt-2
                    bg-green-50 text-green-800 text-[11px] font-semibold
                    px-2.5 py-1 rounded-full">
      <Icon name="history" size={12} />
      {t('addPatient.returningBadge')}  {/* "Habitué · Position #X" */}
    </div>
  )}
</div>
```

### 4.3 WhatsApp primary CTA

Shown only if a phone number was provided. If no phone number was entered, skip this button entirely.

```tsx
{phone && (
  <button
    type="button"
    onClick={handleSendWhatsApp}
    className="w-full flex items-center gap-3 bg-[#25D366] text-white
               rounded-xl py-3.5 px-4 shadow-md shadow-[#25D366]/35
               active:scale-[0.98] transition-all duration-150"
  >
    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon name="smartphone" size={16} />
    </div>
    <div className="flex flex-col items-start gap-0.5 flex-1">
      <span className="text-[13px] font-bold leading-tight">
        {t('addPatient.whatsappTitle', { name: firstName })}
        {/* "Envoyer le lien à {name}" */}
      </span>
      <span className="text-[10px] opacity-80 font-medium">
        {t('addPatient.whatsappSub')}
        {/* "Suivi de position par WhatsApp" */}
      </span>
    </div>
    <Icon name="chevron_right" size={18} className="opacity-70" />
  </button>
)}
```

**WhatsApp link format:**
```typescript
const patientStatusUrl = `${process.env.VITE_BASE_URL}/status/${queueEntryId}`;
const waMessage = encodeURIComponent(
  t('whatsapp.message', { clinicName, url: patientStatusUrl })
);
const waUrl = `https://wa.me/216${phoneDigitsOnly}?text=${waMessage}`;
window.open(waUrl, '_blank');
```

### 4.4 Add another patient button

```tsx
<button
  type="button"
  onClick={handleAddAnother}   // resets form state, keeps sheet open
  className="w-full flex items-center justify-center gap-1.5
             bg-primary/8 border border-primary/30 text-primary
             font-bold text-[13px] py-3 rounded-xl
             hover:bg-primary/12 transition-colors"
>
  <Icon name="add" size={16} />
  {t('addPatient.addAnother')}  {/* "Ajouter un autre patient" */}
</button>
```

`handleAddAnother` resets `name`, `phone`, `visitType`, `priority`, `selectedPatient`, `suggestions` to initial state, then calls `inputRef.current?.focus()` to place the cursor back in the name field immediately.

### 4.5 Auto-dismiss with countdown

The sheet auto-closes after 3 seconds if the user does not interact with the WhatsApp or "add another" buttons.

```typescript
useEffect(() => {
  if (!successVisible) return;
  const timer = setTimeout(() => {
    onClose();
  }, 3000);
  return () => clearTimeout(timer);
}, [successVisible]);
```

Render the dismiss button with a visual countdown ring:

```tsx
<button
  type="button"
  onClick={onClose}
  className="w-full flex items-center justify-center gap-1.5 py-2
             text-[12px] font-medium text-on-surface-variant
             hover:text-on-surface transition-colors"
>
  {/* SVG countdown ring */}
  <svg width="16" height="16" viewBox="0 0 14 14" className="flex-shrink-0">
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="#d1fae5" strokeWidth="2"/>
    <circle
      cx="7" cy="7" r="5.5" fill="none"
      stroke="var(--color-primary)"
      strokeWidth="2"
      strokeDasharray="34.6"
      strokeDashoffset="0"
      strokeLinecap="round"
      style={{ transformOrigin: 'center', transform: 'rotate(-90deg)',
               animation: 'drain 3s linear forwards' }}
    />
  </svg>
  {t('addPatient.done')}  {/* "Terminé — Retour à la file" */}
</button>
```

---

## 5. Design Token Mapping

Use these Tailwind class equivalents that map to the app's existing CSS variables:

| CSS variable            | Tailwind class (approximate)   | Usage in this spec        |
|-------------------------|--------------------------------|---------------------------|
| `--green-500` / primary | `bg-primary` / `text-primary`  | CTA button, focus rings   |
| `--green-100`           | `bg-primary-container`         | Returning badge bg        |
| `--green-50`            | `bg-primary/5`                 | Success top gradient      |
| `--bg`                  | `bg-surface-variant`           | Input background          |
| `--border`              | `border-outline-variant`       | Input borders             |
| `--text-primary`        | `text-on-surface`              | Primary text              |
| `--text-secondary`      | `text-on-surface-variant`      | Labels, metadata          |
| `--text-tertiary`       | `text-on-surface-variant/60`   | Placeholder, help text    |
| amber scale             | `bg-amber-50`, `text-amber-600`| Priority toggle           |
| `#25D366`               | Custom — use inline style      | WhatsApp button only      |

If the project uses a Tailwind config with custom tokens, map these to those tokens rather than using arbitrary values.

---

## 6. Accessibility Requirements

- All interactive elements must have `aria-label` or visible text label.
- The visit type toggle must use `role="group"` with `aria-label={t('addPatient.visitTypeLabel')}`.
- The priority toggle must use `role="switch"` and `aria-checked={priority}`.
- The phone input must have `aria-describedby` pointing to the helper text element id.
- The autocomplete list must use `role="listbox"` and each suggestion `role="option"`.
- The bottom sheet must trap focus while open (use `focus-trap-react` or a native dialog).
- The sheet must close on `Escape` key press.

---

## 7. i18n Keys to Add

Add to both `fr.json` and `ar.json` translation files:

```json
{
  "addPatient": {
    "title": "Nouveau patient",
    "namePlaceholder": "Prénom et nom…",
    "nameLabel": "Nom du patient",
    "visitTypeLabel": "Type de visite",
    "walkIn": "Sans rendez-vous",
    "appointment": "Avec rendez-vous",
    "phoneLabel": "Numéro de téléphone",
    "phoneOptional": "(optionnel)",
    "phoneHelp": "8 chiffres après +216, ex : 55 123 456",
    "phoneWhatsappHint": "Pour suivi WhatsApp",
    "priorityLabel": "Priorité médicale",
    "prioritySub": "Passe en position #2",
    "submit": "Ajouter à la file",
    "returning": "Habitué",
    "returningBadge": "Habitué · Position #{{position}}",
    "lastVisit": "Dernière visite",
    "addAnother": "Ajouter un autre patient",
    "done": "Terminé — Retour à la file",
    "whatsappTitle": "Envoyer le lien à {{name}}",
    "whatsappSub": "Suivi de position par WhatsApp"
  },
  "whatsapp": {
    "message": "Bonjour, vous êtes inscrit(e) à la file de {{clinicName}}. Suivez votre position en temps réel ici : {{url}}"
  }
}
```

---

## 8. Files to Create or Modify

| File | Action | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | Modify | Add `Patient` model, add `patientId` to `QueueEntry` |
| `scripts/backfill-patients.ts` | Create | One-time migration script |
| `api/src/routes/queue.ts` | Modify | Add search endpoint, update add handler for upsert + priority |
| `web/src/components/ui/Icon.tsx` | Create | Shared MD3 icon wrapper |
| `web/src/components/ui/BottomSheet.tsx` | Create | Reusable sheet wrapper with focus trap |
| `web/src/components/AddPatientModal.tsx` | Modify | Full redesign per this spec |
| `web/src/components/AddPatientSuccess.tsx` | Create (or rename) | Success sheet extracted into its own component |
| `web/src/locales/fr.json` | Modify | Add i18n keys from §7 |
| `web/src/locales/ar.json` | Modify | Add i18n keys from §7 (Arabic) |
| `web/src/index.css` or `globals.css` | Modify | Add `@keyframes pop-in`, `@keyframes drain`, load Material Symbols font |

---

## 9. Acceptance Criteria

- [ ] Name field is focused automatically when the sheet opens, without any user tap.
- [ ] Typing 2+ characters triggers autocomplete within 300ms.
- [ ] Selecting a suggestion pre-fills phone and marks the patient as returning.
- [ ] Visit type chips show MD3 icons; no emojis visible anywhere in the component.
- [ ] Active chip is visually distinct (white background, shadow, filled icon).
- [ ] Phone digit counter updates live and turns green at 8/8.
- [ ] Priority toggle is keyboard accessible (`Space` to toggle).
- [ ] Submitting with priority inserts the patient at position 2 in the queue.
- [ ] Submit button shows a spinner during the API call and is disabled to prevent double submission.
- [ ] Success sheet shows WhatsApp CTA only when a phone number is present.
- [ ] "Ajouter un autre patient" resets the form and refocuses the name input without closing the sheet.
- [ ] Sheet auto-closes after 3 seconds with a visible countdown ring.
- [ ] `Escape` key closes the sheet.
- [ ] All text is translated via i18n keys; no hardcoded French strings.
- [ ] No emojis in any rendered output — all replaced with Material Symbols icons.
