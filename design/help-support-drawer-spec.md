# Implementation Spec — `HelpSupportDrawer`

**Feature:** Aide & support side drawer  
**Version:** BleSaf v2.00  
**Surface:** Mobile (375px viewport) + tablet/desktop  
**Stack:** React · TypeScript · Tailwind CSS · i18n  

---

## 1. Overview

`HelpSupportDrawer` is a full-height side panel that slides in from the right and overlays the current page entirely. It is triggered by tapping the **"Aide & support"** row inside the existing settings drawer (see reference screenshot — the row with the `?` icon and `>` chevron under the **COMPTE** section label).

The drawer does **not** navigate to a new route. It renders as a React portal on top of the current page with a dimmed overlay behind it and a smooth slide-in animation.

---

## 2. Trigger

### Entry point
The existing settings drawer already contains an "Aide & support" row. Connect it:

```tsx
// In the settings drawer component
<DrawerRow
  icon="help_outline"
  label={t('settings.helpSupport')}
  onPress={() => setHelpDrawerOpen(true)}
/>
```

### State management
```tsx
const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);

// Render in JSX (alongside the settings drawer)
<HelpSupportDrawer
  open={helpDrawerOpen}
  onClose={() => setHelpDrawerOpen(false)}
  clinicName={clinic.name}
/>
```

---

## 3. Drawer Shell — Layout & Animation

### Structure (DOM layers, outermost → innermost)

```
<Portal>
  <div.overlay>          ← full-screen dim backdrop
    <div.drawer>         ← white panel, slides from right
      <div.drawer-header>
      <div.drawer-body>  ← scrollable
    </div.drawer>
  </div.overlay>
</Portal>
```

### Overlay
- Covers `100vw × 100vh`, `position: fixed`, `inset: 0`, `z-index: 50`
- Background: `rgba(0, 0, 0, 0.45)`
- Backdrop blur: `backdrop-filter: blur(2px)`
- Tapping the overlay closes the drawer (calls `onClose`)
- Transition: `opacity 0.25s ease`

### Drawer panel
- `position: fixed`, `top: 0`, `right: 0`, `bottom: 0`
- Width: `100vw` on mobile · `420px` on tablet/desktop (max)
- Background: `#F6F5F0` (CSS var `--bg`)
- Left edge: `border-radius: 20px 0 0 20px` — rounded only on the left corners
- `box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12)`
- `z-index: 51`
- Slide animation:
  - Closed: `transform: translateX(100%)`
  - Open: `transform: translateX(0)`
  - Transition: `transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)` (iOS-style deceleration)

### Close button (✕)
- `position: absolute`, `top: 14px`, `right: 16px`
- Size: `32 × 32px`, `border-radius: 50%`
- Background: `#F0EFEA` (CSS var `--surface-alt`)
- Icon: Material Symbols Rounded `close`, `18px`, color `#6B6960`
- Hover: background `#E8E6DF`
- `z-index: 1` (above header content)

### Scroll lock
When the drawer is open, set `document.body.style.overflow = 'hidden'` to prevent the background page from scrolling. Restore on close.

### Focus trap
Trap keyboard focus inside the drawer when open. Restore focus to the trigger element on close.

### Escape key
`keydown` listener: `Escape` → calls `onClose`.

---

## 4. Drawer Header

Fixed at the top of the panel (does **not** scroll with body content).

```
┌─────────────────────────────────── ✕ ─┐
│  Aide & support                        │
│  Cabinet Dr Skander Kamoun             │
│──────────────────────────────────────  │
```

### Specs
| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border bottom | `1px solid #E8E6DF` |
| Padding | `16px 20px 14px` |
| Title font | `17px / 700 / letter-spacing -0.02em` |
| Title color | `#1A1A1A` |
| Subtitle font | `12px / 400` |
| Subtitle color | `#9E9B90` |
| Subtitle content | `clinicName` prop |

No back arrow — the close button (✕) in the top-right corner handles dismissal.

### Language toggle button
- Positioned at `top: 14px`, `right: 56px` (left of the ✕ button, with `8px` gap)
- Size: `padding: 5px 11px`, `border-radius: 8px`
- Border: `1.5px solid #E8E6DF`
- Background: `#F0EFEA`
- Font: `12px / 600`, `IBM Plex Sans Arabic` + `DM Sans`
- Displays `عربي` when current lang is `fr`, displays `FR` when current lang is `ar`
- Tapping switches the drawer's language between `fr` and `ar`
- Switching language resets the search field and collapses any open FAQ item

---

## 5. Drawer Body

Scrollable container below the fixed header.

```
padding-bottom: 40px
overflow-y: auto
-webkit-overflow-scrolling: touch
```

Hide scrollbar:
```css
::-webkit-scrollbar { display: none; }
```

### Section label style (reusable)
```
font-size: 11px
font-weight: 600
letter-spacing: 0.07em
text-transform: uppercase
color: #9E9B90
padding: 20px 20px 8px
```

---

## 6. Section 1 — Contacter le support

### Section label
```
FR: "CONTACTER LE SUPPORT"
AR: "التواصل مع الدعم"
```

### WhatsApp CTA card ("Carte Teal")

Full-width tappable card. The most visually prominent element in the drawer.

```
margin: 0 20px
border-radius: 16px
padding: 16px 18px
background: linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)
box-shadow: 0 6px 24px rgba(15, 123, 108, 0.28)
display: flex
align-items: center
gap: 14px
```

**WhatsApp icon container**
```
width: 48px · height: 48px
border-radius: 13px
background: rgba(255, 255, 255, 0.15)
```
Use the WhatsApp SVG path (white fill):
```svg
<!-- path 1 (message bubble) -->
M17.472 14.382c-.297-.149-1.758-.867-2.03-.967...
<!-- path 2 (outer circle) -->
M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66...
```

**Text block**
```
strong: "Parler avec un conseiller"  /  "التحدث مع مستشار"
  font: 15px / 700 / white

span: "Réponse en moins de 2h · Lun–Sam, 8h–18h"  /  "رد خلال ساعتين · الإثنين–السبت، 8ص–6م"
  font: 12px / 400 / rgba(255,255,255,0.75)
  margin-top: 4px · line-height: 1.45
```

**External link icon**
```
Material Symbols: open_in_new
font-size: 16px
color: rgba(255, 255, 255, 0.55)
```

**On press action**
```ts
const whatsappMsg = lang === 'fr'
  ? 'Bonjour, j\'ai besoin d\'aide avec BleSaf.'
  : 'مرحباً، أحتاج مساعدة في استخدام BleSaf.';

Linking.openURL(
  `https://wa.me/21600000000?text=${encodeURIComponent(whatsappMsg)}`
);
```
> Replace `21600000000` with the actual BleSaf support number stored in `env.WHATSAPP_SUPPORT_NUMBER`.

**Hover / press states**
```
hover:  filter brightness(1.06)
active: transform scale(0.985)
transition: filter 0.15s, transform 0.1s
```

---

## 7. Section 2 — Questions fréquentes

### Section label
```
FR: "QUESTIONS FRÉQUENTES"
AR: "الأسئلة الشائعة"
```

### 7a. Search box

```
margin: 0 20px 10px
position: relative
```

**Input field**
```
height: 42px
border-radius: 11px
border: 1.5px solid #E8E6DF
background: #FFFFFF
padding: 0 38px 0 40px  (LTR)
padding: 0 40px 0 38px  (RTL)
font-size: 14px
color: #1A1A1A
box-shadow: 0 1px 2px rgba(0,0,0,0.04)

:focus →
  border-color: #0F7B6C
  box-shadow: 0 0 0 3px rgba(15,123,108,0.10)
```

**Search icon** (left side / right side in RTL)
```
Material Symbols: search
position: absolute · top: 50% · left: 13px (LTR) / right: 13px (RTL)
font-size: 18px
color: #9E9B90
pointer-events: none
:focus-within → color: #0F7B6C
```

**Clear button (×)** — visible only when input has text
```
position: absolute · top: 50% · right: 10px (LTR) / left: 10px (RTL)
width: 22px · height: 22px · border-radius: 50%
background: #E8E6DF
icon: close · 13px · color #6B6960
display: none → flex when input value.length > 0
```

**Placeholder text**
```
FR: "Chercher une réponse…"
AR: "ابحث عن إجابة…"
```

**Search behaviour**
- Debounce: `110ms`
- Normalize query before matching: lowercase + strip NFD accents + strip French/Arabic quotes
- Match against both question title AND answer body text
- Show `popular-list` when query is empty
- Show `results-list` (accordion) when query has ≥1 match
- Show `empty-state` when query has 0 matches

### 7b. Popular articles (default state)

Shown when the search field is empty. Display the **first 3 FAQ items** as compact rows.

**Container**
```
margin: 0 20px
background: #FFFFFF
border-radius: 14px
border: 1px solid #E8E6DF
overflow: hidden
box-shadow: 0 1px 2px rgba(0,0,0,0.04)
```

**Each row**
```
display: flex · align-items: center · gap: 10px
padding: 12px 14px
border-bottom: 1px solid #E8E6DF  (last row: none)
cursor: pointer

hover → background: #F6F5F0
```

Row contents:
- **Icon pill**: `28×28px`, `border-radius: 7px`, `background: #E8F5F1`, icon `14px` color `#0F7B6C`
- **Question text**: `13px / 500 / #1A1A1A`, `flex: 1`, `line-height: 1.35`
- **Chevron**: `chevron_right` (LTR) / `chevron_left` (RTL), `16px`, color `#9E9B90`

Tapping a popular row: hide popular list → build results list with that single FAQ → auto-expand it.

### 7c. Search results — accordion list

Shown when search query is non-empty and has matches.

**Container** (same visual style as popular list, but with accordion items)
```
margin: 0 20px
background: #FFFFFF
border-radius: 14px
border: 1px solid #E8E6DF
overflow: hidden
box-shadow: 0 1px 2px rgba(0,0,0,0.04)
```

**Each accordion item**
```
border-bottom: 1px solid #E8E6DF  (last: none)
```

Trigger button (always visible):
```
display: flex · align-items: flex-start · gap: 10px
padding: 12px 14px
width: 100%

Icon wrap:  28×28px · border-radius 7px · background #F0EFEA (closed) / #E8F5F1 (open)
Icon:       14px · color #9E9B90 (closed) / #0F7B6C (open)
            transition: background 0.2s, color 0.2s

Question:   13px / 600 / #1A1A1A · flex:1 · line-height 1.4
            text-align: left (LTR) / right (RTL)

mark tag:   color #0F7B6C · font-weight 700
            text-decoration: underline · text-decoration-color rgba(15,123,108,0.3)
            text-underline-offset: 2px

Chevron:    expand_more · 18px · #9E9B90
            rotate(0deg) closed → rotate(180deg) open
            transition: transform 0.22s ease
```

Answer body (hidden when closed):
```
max-height: 0 → 260px when open
overflow: hidden
transition: max-height 0.28s ease

p:  font-size 13px · line-height 1.7 · color #6B6960
    padding: 0 14px 14px 52px  (LTR)
    padding: 0 52px 14px 14px  (RTL)
```

**Accordion behaviour**: only one item open at a time. Opening a new item closes the previous one.

### 7d. Empty state

Shown when search returns 0 results.

```
margin: 0 20px
display: flex · flex-direction: column · align-items: center
padding: 28px 16px · text-align: center
background: #FFFFFF
border-radius: 14px
border: 1px solid #E8E6DF
```

Contents:
```
Icon container: 44×44px · border-radius 12px · background #F0EFEA
Icon:           search_off · 22px · #9E9B90

Title:  FR "Aucun résultat"  /  AR "لا توجد نتائج"
        font: 14px / 600 / #1A1A1A · margin-bottom: 4px

Subtitle:  FR "Essayez un autre mot-clé ou contactez notre équipe via WhatsApp."
           AR "جرّب كلمة مختلفة أو تواصل مع فريقنا عبر WhatsApp."
           font: 12.5px / 400 / #6B6960 · line-height: 1.55
```

### 7e. FAQ content data

Store in `/apps/web/src/i18n/help-support.json` (or equivalent i18n file), not hardcoded in the component.

**French FAQ items** (7 total):

| # | Icon | Question | Answer |
|---|---|---|---|
| 0 | `qr_code_2` | Le QR code ne fonctionne pas — que faire ? | Vérifiez que la file est bien ouverte (bouton « Ouverte » en vert). Régénérez le QR depuis Paramètres → Code QR → Afficher si nécessaire. Assurez-vous que le patient pointe sa caméra directement sur le code, à 20–30 cm de distance. |
| 1 | `sms` | Le SMS n'a pas été reçu par le patient | Vérifiez d'abord que le numéro est au format tunisien (+216 XX XXX XXX). Consultez votre solde de crédits SMS dans Paramètres → Abonnement. Si le solde est épuisé, les notifications sont interrompues. Un SMS peut prendre 2 à 5 min selon l'opérateur. |
| 2 | `swap_vert` | Comment changer l'ordre des patients dans la file ? | Appuyez longuement sur le nom d'un patient — une poignée de glissement apparaîtra. Faites glisser vers le haut ou bas pour repositionner. Pour une urgence, utilisez le bouton « ⚡ Priorité » qui place le patient en position n°1 immédiatement. |
| 3 | `door_back` | Comment fermer la file en fin de journée ? | Appuyez sur le statut « Ouverte » en haut de l'écran, puis sélectionnez « Fermer la file ». La file passe en mode Fermeture — les patients restants sont servis, mais aucun nouveau ne peut rejoindre. Un résumé de journée s'affiche quand la file est vide. |
| 4 | `share` | Comment partager le QR code avec mes patients ? | Depuis l'écran d'accueil, appuyez Code QR → Afficher pour le plein écran. Appuyez WhatsApp pour l'envoyer directement. Pour l'imprimer, appuyez Copier puis collez-le dans n'importe quel éditeur ou messagerie. |
| 5 | `visibility_off` | Ma file est-elle visible quand je marque « Absent » ? | Non. Marquer le médecin « Absent » ferme temporairement l'accès. Les patients déjà inscrits restent dans la file et reçoivent leurs notifications normalement quand vous repassez à « Présent ». |
| 6 | `person_add` | Comment ajouter un patient sans smartphone ? | Appuyez « + Ajouter patient » et renseignez nom et numéro manuellement. Si le patient n'a pas de téléphone, ajoutez-le sans numéro — il n'aura pas de SMS mais apparaîtra bien dans la file. |

**Arabic FAQ items** (same 7, same icon keys):

| # | Question | Answer |
|---|---|---|
| 0 | رمز QR لا يعمل — ماذا أفعل؟ | تأكد أن قائمة الانتظار مفتوحة (زر «مفتوح» باللون الأخضر). أعد إنشاء رمز QR من الإعدادات ← رمز QR ← عرض إذا لزم الأمر. تأكد من أن المريض يوجّه كاميرا هاتفه مباشرة على بُعد 20–30 سم. |
| 1 | لم يتلقَّ المريض رسالة SMS | تحقق من أن الرقم بالتنسيق التونسي (+216 XX XXX XXX). راجع رصيد رسائلك في الإعدادات ← الاشتراك. إذا نفد الرصيد، تتوقف الإشعارات. قد يستغرق وصول الرسالة 2 إلى 5 دقائق حسب المشغل. |
| 2 | كيف أغير ترتيب المرضى في القائمة؟ | اضغط مطوّلاً على اسم المريض — ستظهر مقبض السحب. اسحب للأعلى أو الأسفل لإعادة الترتيب. في حالات الطوارئ، استخدم زر «⚡ أولوية» الذي يضع المريض في المركز الأول فوراً. |
| 3 | كيف أغلق القائمة في نهاية اليوم؟ | اضغط على حالة «مفتوح» في أعلى الشاشة، ثم اختر «إغلاق القائمة». تنتقل إلى وضع الإغلاق — يُخدَم المرضى المتبقون لكن لا يمكن لمرضى جدد الانضمام. يظهر ملخص اليوم تلقائياً. |
| 4 | كيف أشارك رمز QR مع مرضاي؟ | من الشاشة الرئيسية، اضغط رمز QR ← عرض لعرضه بملء الشاشة. اضغط WhatsApp لإرساله مباشرة. للطباعة، اضغط نسخ ثم الصقه في أي محرر أو تطبيق مراسلة. |
| 5 | هل تظهر قائمتي عند وضع «غائب»؟ | لا. وضع «غائب» يغلق الوصول مؤقتاً — لا يمكن للمرضى الانضمام عبر QR. المرضى المسجلون مسبقاً يبقون في القائمة ويتلقون إشعاراتهم عادةً حين تعود إلى «حاضر». |
| 6 | كيف أضيف مريضاً بدون هاتف ذكي؟ | اضغط «+ إضافة مريض» وأدخل الاسم ورقم الهاتف يدوياً. إذا لم يكن للمريض هاتف، يمكنك إضافته بدون رقم — لن يتلقى SMS لكنه سيظهر في القائمة. |

**Default popular indexes**: `[0, 1, 2]` (shown before any search query is typed).

---

## 8. Section 3 — Tutoriels vidéo

### Section label
```
FR: "TUTORIELS VIDÉO"
AR: "دروس مصورة"
```

### Video list container
```
margin: 0 20px
background: #FFFFFF
border-radius: 14px
border: 1px solid #E8E6DF
overflow: hidden
box-shadow: 0 1px 2px rgba(0,0,0,0.04)
```

### Plain video row (no embed)

```
display: flex · align-items: center · gap: 12px
padding: 12px 16px
border-bottom: 1px solid #E8E6DF  (last row: none)
cursor: pointer
hover → background: #F6F5F0
```

**Thumbnail** (`52×40px`, `border-radius: 8px`, `flex-shrink: 0`)
```
background: linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)
position: relative

Icon (category): 16px · color rgba(255,255,255,0.40)

Play button overlay:
  position: absolute
  width: 19px · height: 19px · border-radius: 50%
  background: rgba(255,255,255,0.92)
  icon: play_arrow · 13px · FILL 1 · color #0F7B6C · margin-left: 1px
```

**Metadata**
```
Title:    14px / 600 / #1A1A1A · line-height 1.3
Duration: 12px / #9E9B90  e.g. "1:20 min"
Tag pill: (see pill specs below)
```

**Tag pill specs**
```
font-size: 10px · font-weight: 700 · letter-spacing: 0.05em · text-transform: uppercase
padding: 2px 7px · border-radius: 6px

Teal  (Démarrage / البداية): background #E8F5F1 · color #0F7B6C
Amber (Quotidien / يومي):    background #FEF7E6 · color #D4920B
Red   (Avancé / متقدم):      background #FDF0ED · color #D94F3B
```

**Chevron**: `chevron_right` (LTR) / `chevron_left` (RTL), `18px`, `#9E9B90`

### Arcade embed row (expandable accordion)

For video rows that have an `arcadeUrl`, the row becomes an accordion. The thumbnail play button shows `open_in_full` (`11px`) instead of `play_arrow`, and the right chevron shows `expand_more` that rotates `90deg` when open.

**Embed container** (hidden until row is open)
```
max-height: 0 → auto when open
overflow: hidden
transition: max-height 0.35s ease
background: #000000

Inner wrapper (Arcade aspect ratio):
  position: relative
  padding-bottom: calc(62.5% + 41px)
  height: 0
  width: 100%

iframe:
  position: absolute · top: 0 · left: 0
  width: 100% · height: 100%
  border: none · color-scheme: light
  loading: lazy
  allow: clipboard-write
  allowfullscreen
```

Only one video accordion row can be open at a time.

### Video content data

**French videos** (4 items):

| Title | Duration | Icon | Tag | Pill | Arcade URL |
|---|---|---|---|---|---|
| Configurer votre cabinet | 1:20 | `settings` | Démarrage | teal | — |
| Ajouter votre premier patient | 0:58 | `person_add` | Démarrage | teal | `https://demo.arcade.software/GdaoUXqGsDUcypQANivD?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true` |
| Partager le QR code | 1:05 | `qr_code_2` | Quotidien | amber | — |
| Gérer les urgences & priorités | 1:40 | `emergency` | Avancé | red | — |

**Arabic videos** (same 4 items, same Arcade URL):

| Title | Duration | Icon | Tag | Pill |
|---|---|---|---|---|
| إعداد عيادتك | 1:20 | `settings` | البداية | teal |
| إضافة أول مريض | 0:58 | `person_add` | البداية | teal |
| مشاركة رمز QR | 1:05 | `qr_code_2` | يومي | amber |
| إدارة الحالات الطارئة | 1:40 | `emergency` | متقدم | red |

---

## 9. Footer

Inside the scrollable body, at the very bottom:

```
padding: 24px 20px 0
text-align: center
font-size: 11px
color: #9E9B90

Content: "BleSaf v2.00 · © 2026 BleSaf SARL"
```

---

## 10. TypeScript Interfaces

```ts
// types/help-support.ts

export interface FaqItem {
  icon: string;        // Material Symbols Rounded icon name
  q: string;           // Question text
  a: string;           // Answer text
}

export interface VideoItem {
  title: string;
  duration: string;    // e.g. "1:20"
  icon: string;        // Material Symbols Rounded icon name
  tag: string;         // Display label for pill
  pillVariant: 'teal' | 'amber' | 'red';
  arcadeUrl?: string;  // If present, row becomes an accordion with Arcade embed
}

export interface HelpSupportContent {
  dir: 'ltr' | 'rtl';
  contactLabel: string;
  contactSub: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptySub: string;
  popularIndexes: number[];   // indices into faqs[]
  faqs: FaqItem[];
  videos: VideoItem[];
}

export interface HelpSupportDrawerProps {
  open: boolean;
  onClose: () => void;
  clinicName: string;
}
```

---

## 11. Component File Structure

```
src/
  components/
    help/
      HelpSupportDrawer.tsx      ← main drawer component
      HelpSupportDrawer.test.tsx ← unit tests
  i18n/
    help-support.json            ← all FR + AR content (FAQs, videos, labels)
  hooks/
    useHelpSearch.ts             ← search logic (normalize, filter, debounce)
```

### `useHelpSearch.ts`

```ts
export function useHelpSearch(faqs: FaqItem[], debounceMs = 110) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function normalize(s: string) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[«»''"""]/g, '');
  }

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const q = query.trim();
      if (!q) { setResults([]); return; }
      const norm = normalize(q);
      setResults(faqs.filter(f =>
        normalize(f.q).includes(norm) || normalize(f.a).includes(norm)
      ));
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, faqs]);

  return { query, setQuery, results, isSearching: query.trim().length > 0 };
}
```

---

## 12. Bilingual / RTL Behaviour

- The drawer has its **own** language toggle, independent of the app's global language setting. This lets users switch the help content to Arabic without changing the whole app.
- When language switches: `dir` attribute on the drawer root changes between `ltr` / `rtl`, font family switches between `DM Sans` (FR) and `IBM Plex Sans Arabic` (AR), all text content reloads from i18n, search is reset, open FAQ item is collapsed.
- All directional icons (chevrons, back arrow) must reflect the active direction.
- Answer body padding indent flips: `padding-left: 52px` (LTR) → `padding-right: 52px` (RTL).
- Search icon and clear button positions flip on RTL.

---

## 13. Accessibility

| Requirement | Implementation |
|---|---|
| Drawer role | `role="dialog"` `aria-modal="true"` `aria-label="Aide & support"` |
| Close button | `aria-label="Fermer"` |
| FAQ accordion trigger | `aria-expanded="true/false"` `aria-controls="faq-body-{i}"` |
| FAQ accordion body | `id="faq-body-{i}"` `role="region"` |
| Search input | `aria-label="Chercher une réponse"` |
| Focus trap | Enabled when open, restored on close |
| Escape to close | `keydown` listener on the drawer |
| Overlay click | Closes drawer (calls `onClose`) |

---

## 14. Analytics Events

Emit the following events when the drawer is in use:

```ts
// Drawer opened
analytics.track('help_drawer_opened');

// WhatsApp CTA tapped
analytics.track('help_whatsapp_tapped', { lang });

// FAQ item opened (via search or popular tap)
analytics.track('help_faq_opened', { questionIndex: i, query, lang });

// Video accordion opened
analytics.track('help_video_opened', { title: v.title, hasEmbed: !!v.arcadeUrl, lang });

// Search performed (debounced, on result)
analytics.track('help_search', { query, resultCount: hits.length, lang });

// Language toggled
analytics.track('help_lang_toggled', { newLang: lang });
```

---

## 15. Environment Variables

```env
VITE_WHATSAPP_SUPPORT_NUMBER=21600000000   # BleSaf support WhatsApp number (no +)
```

---

## 16. Definition of Done

- [ ] Drawer slides in from right with correct easing, overlays the full page
- [ ] Overlay tap and Escape key both close the drawer
- [ ] Body scroll is locked while drawer is open
- [ ] Header is fixed; body scrolls independently
- [ ] ✕ close button and language toggle render correctly in header
- [ ] WhatsApp CTA opens pre-filled WhatsApp link
- [ ] Popular articles (3 rows) shown when search field is empty
- [ ] Search debounces at 110ms, normalizes accents and quotes
- [ ] Matched text highlighted in teal with underline in results
- [ ] FAQ accordion: only one item open at a time, smooth max-height transition
- [ ] Empty state shown when search returns 0 results
- [ ] Video accordion expands Arcade embed inline with `embed_mobile=inline`
- [ ] RTL layout correct: all chevrons, padding, text alignment flip for Arabic
- [ ] Font switches between DM Sans (FR) and IBM Plex Sans Arabic (AR)
- [ ] Language toggle resets search and collapses open FAQ
- [ ] Focus trap active while drawer is open
- [ ] All aria attributes present on interactive elements
- [ ] Analytics events firing for key interactions
- [ ] Unit tests passing for `useHelpSearch` normalize + filter logic
