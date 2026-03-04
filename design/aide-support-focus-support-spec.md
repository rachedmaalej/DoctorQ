# Aide & Support Drawer — "Focus Support" Implementation Spec

**Screen:** `HelpSupportDrawer`
**Variation:** Focus Support (Variation 2)
**Scope:** Side drawer, mobile-first, rendered on top of the existing receptionist dashboard
**References:** Matches the established design language of the `Parametres` drawer (see existing implementation)

---

## Table of Contents

1. [Overview and Behaviour](#1-overview-and-behaviour)
2. [Design Tokens](#2-design-tokens)
3. [File Structure](#3-file-structure)
4. [Component Architecture](#4-component-architecture)
5. [Drawer Shell](#5-drawer-shell)
6. [Section 1 — Contacter le support](#6-section-1--contacter-le-support)
7. [Section 2 — Questions frequentes](#7-section-2--questions-frequentes)
8. [Section 3 — Tutoriels video](#8-section-3--tutoriels-video)
9. [Drawer Footer](#9-drawer-footer)
10. [Animation and Motion](#10-animation-and-motion)
11. [i18n Strings](#11-i18n-strings)
12. [TypeScript Interfaces](#12-typescript-interfaces)
13. [Data and Static Content](#13-data-and-static-content)
14. [Integration — Opening the Drawer](#14-integration--opening-the-drawer)
15. [Accessibility](#15-accessibility)

---

## 1. Overview and Behaviour

The Aide and support screen is implemented as a **right-side slide-in drawer**, consistent with the existing `Parametres` drawer pattern. It does **not** open as a new route or full-screen page.

### Drawer geometry

| Property | Value |
|---|---|
| Width | 258px |
| Height | 100vh (full viewport height) |
| Position | Fixed, anchored to the right edge |
| Overlay | Full-screen dimmed backdrop, left strip of the app remains visible |
| Z-index | Same layer as Parametres drawer (z-50) |
| Background | #FFFFFF |
| Shadow | -8px 0 32px rgba(0,0,0,0.22) |

The **258px width** deliberately leaves approximately 38px of the app background visible on the left edge, matching the visual cropping pattern established by the Parametres drawer. This communicates that the user is in a sub-panel, not a new screen.

### Overlay

- Full-viewport div with background: rgba(0,0,0,0.45)
- Clicking the overlay closes the drawer
- The overlay is rendered behind the drawer, in front of the app

### Scroll behaviour

- The header and footer are fixed within the drawer (do not scroll)
- The body section between header and footer is independently scrollable (overflow-y: auto)
- No visible scrollbar on mobile

---

## 2. Design Tokens

Use the existing BleSaf design system tokens. Do not introduce new variables.

```
BACKGROUNDS
  --bg:             #F6F5F0   (warm off-white — search input bg, section label zone)
  --surface:        #FFFFFF   (drawer background, row backgrounds)
  --border:         #E8E6DF   (row separators, search border)
  --border-light:   #F0EFEB   (lighter row separators, header/footer borders)

TEXT
  --text-primary:   #1A1A1A
  --text-secondary: #6B6960
  --text-tertiary:  #9E9B90   (section labels, footer, placeholders)

BRAND
  --accent:         #0F7B6C   (teal — banner bg, focus ring base, link colour)
  --accent-dark:    #0A5C50   (banner gradient endpoint)
  --accent-light:   #E8F5F1   (teal icon container background)

SEMANTIC
  --green:          #2D8B4E   |  --green-light:  #EDF7F0
  --blue:           #3B7DD9   |  --blue-light:   #EDF3FC
  --amber:          #D4920B   |  --amber-light:  #FEF7E6
```

### Typography scale

| Role | Size | Weight | Color |
|---|---|---|---|
| Drawer title | 17px | 700 | --text-primary |
| Clinic subtitle | 11px | 400 | --text-tertiary |
| Section label | 10px | 600 | --text-tertiary (uppercase, 0.8px tracking) |
| Support banner title | 13px | 700 | #FFFFFF |
| Support banner subtitle | 11px | 400 | rgba(255,255,255,0.75) |
| FAQ row text | 12px | 500 | --text-primary |
| Tutorial title | 12px | 600 | --text-primary |
| Tutorial duration | 10px | 400 | --text-tertiary |
| Badge label | 9px | 700 | varies per badge |
| "Voir toutes" link | 11px | 600 | --accent |
| Footer version | 10px | 400 | --text-tertiary |
| Lang toggle button | 11px | 600 | --text-secondary |

### Font stacks

- Latin: 'DM Sans', sans-serif
- Arabic / lang button: 'IBM Plex Sans Arabic', sans-serif
- Icons: Material Symbols Rounded (already loaded in app)

---

## 3. File Structure

```
web/src/components/layout/drawers/
  HelpSupportDrawer.tsx           <-- main component (this spec)
  HelpSupportDrawer.types.ts      <-- TypeScript interfaces
  components/
    SupportBanner.tsx             <-- teal CTA card
    FaqSection.tsx                <-- search + FAQ rows
    TutorialSection.tsx           <-- tutorial rows with badges
    DrawerSectionLabel.tsx        <-- reuse if already exists in codebase
    TutorialBadge.tsx             <-- coloured badge chip

web/src/data/
  helpSupport.ts                  <-- static FAQ and tutorial data

web/src/i18n/locales/
  fr.json                         <-- add keys under "helpSupport"
  ar.json                         <-- add keys under "helpSupport"
```

NOTE: If DrawerSectionLabel already exists (shared with Parametres), reuse it instead of creating a new file.

---

## 4. Component Architecture

```
HelpSupportDrawer
  Overlay (click -> onClose)
  DrawerPanel (258px wide, fixed right, 100vh tall)
    DrawerHeader
      BackButton (arrow_back -> onClose)
      Title "Aide & support"
      LangToggleButton
    DrawerBody (flex-1, overflow-y: auto)
      ClinicNameSubtitle
      DrawerSectionLabel  icon=support_agent  label="CONTACTER LE SUPPORT"
      SupportBanner       (teal gradient card, opens WhatsApp)
      DrawerSectionLabel  icon=help_outline   label="QUESTIONS FREQUENTES"
      FaqSection
        SearchInput
        FaqRow x n         (filtered by search query)
        ViewAllLink        (hidden when search is active)
      DrawerSectionLabel  icon=play_circle_outline  label="TUTORIELS VIDEO"
      TutorialSection
        TutorialRow x n
    DrawerFooter
```

---

## 5. Drawer Shell

### HelpSupportDrawer props

```typescript
interface HelpSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaqSelect?: (faqId: string) => void;
  onTutorialSelect?: (tutorialId: string) => void;
}
```

### JSX skeleton

```tsx
<div
  className="fixed inset-0 z-50"
  style={{ background: 'rgba(0,0,0,0.45)' }}
  onClick={onClose}
  aria-hidden="true"
>
  <div
    className="absolute right-0 top-0 h-full flex flex-col bg-white overflow-hidden"
    style={{ width: '258px', boxShadow: '-8px 0 32px rgba(0,0,0,0.22)' }}
    onClick={(e) => e.stopPropagation()}
    dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
  >
    <DrawerHeader onClose={onClose} />
    <div className="flex-1 overflow-y-auto">
      <ClinicNameSubtitle />
      {/* sections */}
    </div>
    <DrawerFooter />
  </div>
</div>
```

### DrawerHeader

```
Container:
  height:         52px
  display:        flex, align-items: center
  padding:        0 16px
  gap:            10px
  border-bottom:  1px solid #F0EFEB
  background:     #FFFFFF
  flex-shrink:    0

BackButton:
  size:           32x32px
  border-radius:  50%
  background:     #F6F5F0
  border:         none
  icon:           arrow_back, 18px, #1A1A1A
  onClick:        onClose()
  aria-label:     t('common.back')

Title:
  text:   t('helpSupport.title')  ->  "Aide & support"
  font:   17px / 700 / DM Sans
  color:  #1A1A1A
  flex:   1

LangToggleButton:
  label:          "ar" when FR active; "FR" when AR active
  font-family:    IBM Plex Sans Arabic
  font:           11px / 600
  color:          #6B6960
  background:     #F6F5F0
  border:         none
  border-radius:  6px
  padding:        4px 8px
  onClick:        i18n.changeLanguage(lang === 'fr' ? 'ar' : 'fr')
```

### Clinic name subtitle

Immediately below the header border, inside the scrollable body:

```
Padding:  6px 16px 0
Text:     clinic.name from auth/clinic context  (e.g. "Cabinet Hammamet")
Font:     11px / 400 / DM Sans
Color:    #9E9B90
```

---

## 6. Section 1 — Contacter le support

### DrawerSectionLabel

Reusable component prefix for every section:

```
Layout:         flex row, align-items: center, gap: 6px
Padding:        14px 16px 6px
Font:           10px / 600 / DM Sans
Letter-spacing: 0.8px
Text-transform: uppercase
Color:          #9E9B90
Icon:           Material Symbol, 13px, same color as text
```

For this section: icon="support_agent", label=t('helpSupport.sections.support')

### SupportBanner

This is the primary CTA. It uses the "Carte Teal" pattern established across the BleSaf app.

```
Container:
  margin:         10px 12px 4px
  border-radius:  12px
  cursor:         pointer
  overflow:       hidden

  On hover/press:
    opacity: 0.92
    transition: opacity 150ms ease

Background:
  linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)

Padding:  14px

Inner layout:  flex row, align-items: flex-start, gap: 10px

  [Icon container — left]
    size:           32x32px
    border-radius:  8px
    background:     rgba(255,255,255,0.15)
    icon:           chat, 17px, #FFFFFF

  [Text block — center, flex: 1]
    Title:
      text:       t('helpSupport.support.title')  ->  "Parler avec un conseiller"
      font:       13px / 700 / DM Sans
      color:      #FFFFFF

    Subtitle:
      text:       t('helpSupport.support.subtitle')  ->  "Reponse en moins de 2h . Lun-Sam, 8h-18h"
      font:       11px / 400 / DM Sans
      color:      rgba(255,255,255,0.75)
      margin-top: 3px
      line-height: 1.4

  [External link icon — right]
    icon:       open_in_new, 14px
    color:      rgba(255,255,255,0.5)
    align-self: flex-start
    margin-top: 2px
```

**onClick handler:**

```typescript
const number = clinic.whatsappNumber ?? '+21600000000';
const msg = encodeURIComponent(t('helpSupport.support.whatsappMessage'));
window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
```

---

## 7. Section 2 — Questions frequentes

Section label: icon="help_outline", label=t('helpSupport.sections.faq')

### Search input

```
Container:
  margin:   8px 12px 4px
  position: relative

Input:
  width:          100%
  height:         36px
  background:     #F6F5F0
  border:         1.5px solid #E8E6DF
  border-radius:  9px
  padding:        0 12px 0 34px
  font:           12px / 400 / DM Sans
  color:          #1A1A1A
  placeholder:    t('helpSupport.faq.searchPlaceholder')  ->  "Chercher une reponse..."
  placeholder-color: #9E9B90
  outline:        none

  On focus:
    border-color:  #0F7B6C
    box-shadow:    0 0 0 3px rgba(15,123,108,0.10)
    transition:    border-color 150ms, box-shadow 150ms

Search icon (decorative, no interaction):
  icon:       search, 16px, #9E9B90
  position:   absolute, left 9px, top 50% translateY(-50%)
  pointer-events: none
```

### FAQ filtering logic

```typescript
const [query, setQuery] = useState('');
const lang = i18n.language as 'fr' | 'ar';

const filteredFaqs = useMemo(() =>
  query.trim() === ''
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter(item =>
        item.title[lang].toLowerCase().includes(query.toLowerCase())
      ),
  [query, lang]
);
```

### FaqRow

```
Layout:         flex row, align-items: center, gap: 10px
Padding:        10px 16px
Border-bottom:  1px solid #F0EFEB  (last-child: none)
Background:     #FFFFFF
cursor:         pointer
role:           "button"
tabIndex:       0

On hover:
  background: #F6F5F0
  transition: background-color 150ms

[Icon container — left]
  size:           28x28px
  border-radius:  7px
  background:     #F6F5F0
  icon:           from FaqItem.icon, 14px, #6B6960

[Text — center, flex: 1]
  font:       12px / 500 / DM Sans
  color:      #1A1A1A
  line-height: 1.35
  (multi-line OK — icon stays top-aligned)

[Chevron — right]
  icon:   chevron_right, 14px, #9E9B90
```

### "Voir toutes les questions" link

Rendered below the FAQ list. Hidden when query is not empty.

```
Container:    padding 5px 16px 10px
Text:         t('helpSupport.faq.viewAll')  ->  "Voir toutes les questions ->"
Font:         11px / 600 / DM Sans
Color:        #0F7B6C
Cursor:       pointer

On hover:     text-decoration: underline
```

---

## 8. Section 3 — Tutoriels video

Section label: icon="play_circle_outline", label=t('helpSupport.sections.tutorials')

### TutorialRow

```
Layout:         flex row, align-items: center, gap: 10px
Padding:        9px 16px
Border-bottom:  1px solid #F0EFEB  (last-child: none)
Background:     #FFFFFF
cursor:         pointer
role:           "button"
tabIndex:       0

On hover:
  background: #F6F5F0
  transition: background-color 150ms

[Icon container — left]
  size:           32x32px
  border-radius:  8px
  background:     from TutorialItem.iconBg
  icon:           from TutorialItem.icon, 16px, from TutorialItem.iconColor

[Text block — center, flex: 1, min-width: 0]
  Title:
    font:        12px / 600 / DM Sans
    color:       #1A1A1A
    white-space: nowrap, overflow: hidden, text-overflow: ellipsis

  Meta row (flex, align-items: center, gap: 5px, margin-top: 2px):
    Duration text: 10px / 400 / DM Sans / #9E9B90
    TutorialBadge

[Chevron — right]
  icon:   chevron_right, 16px, #9E9B90
```

### TutorialBadge spec

```
font:           9px / 700 / DM Sans
letter-spacing: 0.4px
text-transform: uppercase
padding:        2px 5px
border-radius:  4px
```

Badge values:

| Key | Label FR | Label AR | Background | Text color |
|---|---|---|---|---|
| DEMARRAGE | Demarrage | بداية | #EDF7F0 | #2D8B4E |
| QUOTIDIEN | Quotidien | يومي | #EDF3FC | #3B7DD9 |
| AVANCE | Avance | متقدم | #FEF7E6 | #D4920B |

### Tutorial icon colours

| Tutorial ID | Icon | Container bg | Icon colour |
|---|---|---|---|
| configure-cabinet | settings_suggest | #E8F5F1 | #0F7B6C |
| add-patient | play_arrow | #FFF4ED | #EA580C |
| share-qr-code | qr_code_2 | #E8F5F1 | #0F7B6C |
| manage-emergencies | emergency | #F5F3FF | #7C3AED |

---

## 9. Drawer Footer

```
Container:
  padding:        10px 16px 14px
  border-top:     1px solid #F0EFEB
  text-align:     center
  flex-shrink:    0   (never scrolled, always visible)

Text:
  font:    10px / 400 / DM Sans
  color:   #9E9B90
  content: t('helpSupport.footer.version', {
             version: import.meta.env.VITE_APP_VERSION,
             year: new Date().getFullYear()
           })
  result:  "BleSaf v2.0.0  .  c 2026 BleSaf SARL"
```

---

## 10. Animation and Motion

### Drawer slide-in / slide-out

```css
/* Drawer panel */
.help-drawer-panel {
  transform: translateX(100%);
  transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
}
.help-drawer-panel.is-open {
  transform: translateX(0);
}

/* Backdrop overlay */
.help-drawer-overlay {
  opacity: 0;
  transition: opacity 260ms ease;
}
.help-drawer-overlay.is-open {
  opacity: 1;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .help-drawer-panel,
  .help-drawer-overlay {
    transition: none;
  }
}
```

Implement with useState(isMounted) + useEffect pattern. Unmount the overlay from the DOM after exit transition completes (use onTransitionEnd or a setTimeout matching 260ms).

### Other transitions

```
Row hover:              transition: background-color 150ms ease
Search input focus:     transition: border-color 150ms ease, box-shadow 150ms ease
SupportBanner press:    transition: opacity 150ms ease
```

---

## 11. i18n Strings

### fr.json — add under "helpSupport":

```json
"helpSupport": {
  "title": "Aide & support",
  "sections": {
    "support": "Contacter le support",
    "faq": "Questions frequentes",
    "tutorials": "Tutoriels video"
  },
  "support": {
    "title": "Parler avec un conseiller",
    "subtitle": "Reponse en moins de 2h . Lun-Sam, 8h-18h",
    "whatsappMessage": "Bonjour, j'ai besoin d'aide avec BleSaf."
  },
  "faq": {
    "searchPlaceholder": "Chercher une reponse...",
    "viewAll": "Voir toutes les questions ->"
  },
  "footer": {
    "version": "BleSaf v{{version}} . c {{year}} BleSaf SARL"
  }
}
```

### ar.json — add under "helpSupport":

```json
"helpSupport": {
  "title": "المساعدة والدعم",
  "sections": {
    "support": "التواصل مع الدعم",
    "faq": "الاسئلة الشائعة",
    "tutorials": "فيديوهات تعليمية"
  },
  "support": {
    "title": "التحدث مع مستشار",
    "subtitle": "رد في اقل من ساعتين . الاثنين-السبت، 8ص-6م",
    "whatsappMessage": "مرحبا، احتاج مساعدة في بليساف."
  },
  "faq": {
    "searchPlaceholder": "ابحث عن اجابة...",
    "viewAll": "<- عرض جميع الاسئلة"
  },
  "footer": {
    "version": "بليساف v{{version}} . c {{year}} BleSaf SARL"
  }
}
```

**RTL note:** Apply dir="rtl" to the drawer panel root element when i18n.language === 'ar'. All flex rows will mirror automatically. The viewAll arrow uses the translated string (left-pointing in AR), not a hardcoded character.

---

## 12. TypeScript Interfaces

File: web/src/components/layout/drawers/HelpSupportDrawer.types.ts

```typescript
export type TutorialBadgeType = 'DEMARRAGE' | 'QUOTIDIEN' | 'AVANCE';
export type Lang = 'fr' | 'ar';

export interface FaqItem {
  id: string;
  icon: string;                    // Material Symbol name
  title: Record<Lang, string>;
}

export interface TutorialItem {
  id: string;
  icon: string;                    // Material Symbol name
  iconBg: string;                  // CSS colour string
  iconColor: string;               // CSS colour string
  title: Record<Lang, string>;
  duration: Record<Lang, string>;
  badge: TutorialBadgeType;
  videoUrl?: string;               // external URL or undefined
}

export interface BadgeConfig {
  bg: string;
  color: string;
  label: Record<Lang, string>;
}

export interface HelpSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaqSelect?: (faqId: string) => void;
  onTutorialSelect?: (tutorialId: string) => void;
}
```

---

## 13. Data and Static Content

File: web/src/data/helpSupport.ts

```typescript
import type { FaqItem, TutorialItem, BadgeConfig } from
  '../components/layout/drawers/HelpSupportDrawer.types';

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'qr-code',
    icon: 'qr_code_scanner',
    title: {
      fr: 'Le QR code ne fonctionne pas — que faire ?',
      ar: 'رمز QR لا يعمل — ماذا افعل؟',
    },
  },
  {
    id: 'sms-not-received',
    icon: 'sms',
    title: {
      fr: "Le SMS n'a pas ete recu par le patient",
      ar: 'لم يستلم المريض الرسالة النصية',
    },
  },
  {
    id: 'patient-order',
    icon: 'swap_vert',
    title: {
      fr: "Comment changer l'ordre des patients dans la file ?",
      ar: 'كيف اغير ترتيب المرضى في الطابور؟',
    },
  },
];

export const TUTORIAL_ITEMS: TutorialItem[] = [
  {
    id: 'configure-cabinet',
    icon: 'settings_suggest',
    iconBg: '#E8F5F1',
    iconColor: '#0F7B6C',
    title: { fr: 'Configurer votre cabinet', ar: 'اعداد عيادتك' },
    duration: { fr: '1:20 min', ar: '1:20 دقيقة' },
    badge: 'DEMARRAGE',
  },
  {
    id: 'add-patient',
    icon: 'play_arrow',
    iconBg: '#FFF4ED',
    iconColor: '#EA580C',
    title: { fr: 'Ajouter votre premier patient', ar: 'اضافة اول مريض' },
    duration: { fr: '0:58 min', ar: '0:58 دقيقة' },
    badge: 'DEMARRAGE',
  },
  {
    id: 'share-qr-code',
    icon: 'qr_code_2',
    iconBg: '#E8F5F1',
    iconColor: '#0F7B6C',
    title: { fr: 'Partager le QR code', ar: 'مشاركة رمز QR' },
    duration: { fr: '1:05 min', ar: '1:05 دقيقة' },
    badge: 'QUOTIDIEN',
  },
  {
    id: 'manage-emergencies',
    icon: 'emergency',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    title: { fr: 'Gerer les urgences & priorites', ar: 'ادارة الحالات الطارئة والاولويات' },
    duration: { fr: '1:40 min', ar: '1:40 دقيقة' },
    badge: 'AVANCE',
  },
];

export const BADGE_CONFIG: Record<string, BadgeConfig> = {
  DEMARRAGE: { bg: '#EDF7F0', color: '#2D8B4E', label: { fr: 'Demarrage', ar: 'بداية' } },
  QUOTIDIEN: { bg: '#EDF3FC', color: '#3B7DD9', label: { fr: 'Quotidien', ar: 'يومي'  } },
  AVANCE:    { bg: '#FEF7E6', color: '#D4920B', label: { fr: 'Avance',    ar: 'متقدم' } },
};
```

---

## 14. Integration — Opening the Drawer

The drawer is triggered from the **main side menu**, where "Aide & support" appears as a row in the COMPTE section.

### State wiring in parent dashboard

```typescript
const [helpSupportOpen, setHelpSupportOpen] = useState(false);

// Render alongside the main drawer:
<HelpSupportDrawer
  isOpen={helpSupportOpen}
  onClose={() => setHelpSupportOpen(false)}
/>

// In main drawer — "Aide & support" row onClick:
onClick={() => {
  setMainDrawerOpen(false);    // close main menu
  setHelpSupportOpen(true);    // open help drawer
}}
```

The two drawers must never appear simultaneously. Close the main drawer first, then open the help drawer. No animated overlap is needed — the help drawer entrance transition is sufficient.

---

## 15. Accessibility

| Requirement | Implementation |
|---|---|
| Focus trap | Use focus-trap-react or manual Tab key cycle within drawer panel |
| Close on Escape | useEffect listening to keydown -> key === 'Escape' -> onClose() |
| Back button label | aria-label={t('common.back')} |
| Search input label | aria-label={t('helpSupport.faq.searchPlaceholder')} |
| FAQ rows | role="button", tabIndex={0}, onKeyDown Enter/Space -> onFaqSelect |
| Tutorial rows | Same pattern as FAQ rows |
| Support banner | role="button", descriptive aria-label |
| Overlay | aria-hidden="true" (it is decorative; drawer panel is the focus target) |
| RTL | dir="rtl" on drawer root when i18n.language === 'ar' |
| Reduced motion | Wrap all transitions in @media (prefers-reduced-motion: no-preference) |

---

## Quick implementation checklist

- [ ] Create HelpSupportDrawer.tsx with overlay + 258px panel shell
- [ ] Implement DrawerHeader (back button, title, lang toggle)
- [ ] Add clinic name subtitle below header
- [ ] Implement or reuse DrawerSectionLabel
- [ ] Implement SupportBanner with teal gradient and WhatsApp link
- [ ] Implement search input with focus ring
- [ ] Implement FaqRow list with real-time filtering
- [ ] Add ViewAll link (hidden when search query is active)
- [ ] Implement TutorialRow with icon container, title, duration, badge
- [ ] Implement TutorialBadge chip
- [ ] Add DrawerFooter with version string interpolation
- [ ] Wire enter/exit CSS transition (translateX + overlay opacity)
- [ ] Apply dir="rtl" when i18n.language === 'ar'
- [ ] Create helpSupport.ts static data file
- [ ] Add fr.json and ar.json i18n keys
- [ ] Connect to main drawer "Aide & support" row (close main then open help)
- [ ] Wrap all transitions in prefers-reduced-motion media query
- [ ] Verify focus trap and Escape key handler
- [ ] Smoke test: open, scroll, search filter, close via overlay, close via back button
