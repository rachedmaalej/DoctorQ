# Implémentation : Welcome Screen Mobile — La Grande Donnée · CTA Carte Teal

**Fichier cible :** `apps/web/src/components/queue/WelcomeScreenMobile.tsx`
**Portée :** Frontend uniquement + 1 endpoint API backend
**Branche recommandée :** `feature/welcome-screen`
**Maquette de référence :** `design/mockups/blesaf-welcome-v5-teal-cta.html`

---

## Contexte & Objectif

Quand le médecin ou la réceptionniste ouvre l'app le matin, la file est fermée et vide. Plutôt que d'afficher un dashboard vide, l'app affiche cet écran de bienvenue qui :

1. Salue le médecin par son nom
2. Affiche le **bilan de la veille** — patients vus (avec chiffre géant) + attente moyenne
3. Contextualise chaque KPI avec des tendances vs semaine passée et vs 30 jours
4. Propose l'ouverture de la file via **une carte teal pleine largeur** — la seule surface colorée de l'écran, impossible à ignorer

L'écran disparaît dès que `isDoctorPresent` passe à `true`.

---

## Anatomie visuelle (de haut en bas)

```
┌─────────────────────────────┐
│  [Top bar teal — existant]  │  ← inchangé, rendu par MobileDashboard
├─────────────────────────────┤
│  Bonjour,  Dr. Jebali       │  ← greeting row
│                             │
│  BILAN D'HIER               │  ← section label
│                             │
│ ┌─────────────────────────┐ │
│ │ PATIENTS VUS            │ │  ← hero KPI card (blanc)
│ │                      ◌  │ │    orbe teal clair top-right
│ │  72                     │ │
│ │  personnes prises…      │ │
│ │  [chip] [chip]          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ATTENTE  │  ↓ −18%  sem │ │  ← secondary KPI card (blanc)
│ │ MOY.     │  ↓ −25%  30j │ │
│ │  18mn    │              │ │
│ └─────────────────────────┘ │
│                             │
│           [flex spacer]     │
│                             │
│ ┌─────────────────────────┐ │
│ │ ● File actuellement     │ │  ← CTA carte teal
│ │   fermée                │ │    (seule carte colorée)
│ │                         │ │
│ │  Ouvrir la file         │ │
│ │  d'attente              │ │
│ │                       → │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Design tokens à utiliser

**Utiliser exclusivement ces valeurs. Ne rien inventer.**

| Token | Valeur | Tailwind |
|-------|--------|----------|
| Fond app | `#edeae3` | `bg-[#edeae3]` |
| Teal primaire | `#3c6c5e` | `bg-[#3c6c5e]` `text-[#3c6c5e]` |
| Teal dark (hover) | `#2d5547` | `hover:bg-[#2d5547]` |
| Teal xlight (orbe) | `#e6f0ed` | `bg-[#e6f0ed]` |
| Blanc (cartes) | `#ffffff` | `bg-white` |
| Texte principal | `#1a1a1a` | `text-[#1a1a1a]` |
| Texte secondaire | `#8a9a90` | `text-[#8a9a90]` |
| Texte hint | `#b0bbb5` | `text-[#b0bbb5]` |
| Chip bg positif | `#e8f5ee` | `bg-[#e8f5ee]` |
| Chip texte positif | `#1a6635` | `text-[#1a6635]` |
| Shadow sm | `0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)` | `shadow-sm` |
| Shadow md | `0 2px 8px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)` | `shadow-md` |
| Shadow lg | `0 6px 20px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)` | `shadow-lg` |
| Border radius carte | `14px` | `rounded-[14px]` |
| Border radius chip | `6px` | `rounded-[6px]` |
| Police | DM Sans | déjà chargée |

---

## Partie 1 — Backend : Endpoint `/api/queue/yesterday-stats`

### Fichier à modifier : `apps/api/src/routes/queue.ts`

Ajouter cet endpoint **avant** toute route avec paramètre `/:id` pour éviter les conflits de matching.

```typescript
// GET /api/queue/yesterday-stats
router.get('/yesterday-stats', authMiddleware, async (req, res) => {
  try {
    const clinicId = req.clinic!.id;

    const tz = 'Africa/Tunis';
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const d8ago = new Date(now);
    d8ago.setDate(d8ago.getDate() - 8);

    const d31ago = new Date(now);
    d31ago.setDate(d31ago.getDate() - 31);

    const allStats = await prisma.dailyStat.findMany({
      where: { clinicId, date: { gte: d31ago } },
      orderBy: { date: 'desc' },
    });

    const yesterdayStats = allStats.find(
      (s) => s.date.toISOString().split('T')[0] === yesterdayStr
    );

    if (!yesterdayStats) {
      return res.json({ yesterday: null, trends: null });
    }

    const week7   = allStats.filter((s) => s.date >= d8ago    && s.date < yesterday);
    const month30 = allStats.filter((s) => s.date >= d31ago   && s.date < yesterday);

    const avg = (arr: typeof allStats, field: 'totalPatients' | 'avgWaitMins') => {
      if (arr.length === 0) return null;
      return Math.round(arr.reduce((sum, s) => sum + (s[field] ?? 0), 0) / arr.length);
    };

    const pctDelta = (current: number, ref: number | null) => {
      if (ref === null || ref === 0) return null;
      return Math.round(((current - ref) / ref) * 100);
    };

    const avg7p  = avg(week7,   'totalPatients');
    const avg30p = avg(month30, 'totalPatients');
    const avg7w  = avg(week7,   'avgWaitMins');
    const avg30w = avg(month30, 'avgWaitMins');

    return res.json({
      yesterday: {
        totalPatients: yesterdayStats.totalPatients,
        avgWaitMins:   yesterdayStats.avgWaitMins,
        date:          yesterdayStr,
      },
      trends: {
        patients: {
          vs7d:  pctDelta(yesterdayStats.totalPatients, avg7p),
          vs30d: pctDelta(yesterdayStats.totalPatients, avg30p),
        },
        waitMins: {
          vs7d:  pctDelta(yesterdayStats.avgWaitMins ?? 0, avg7w),
          vs30d: pctDelta(yesterdayStats.avgWaitMins ?? 0, avg30w),
        },
      },
    });
  } catch (error) {
    console.error('yesterday-stats error:', error);
    res.status(500).json({ error: 'Failed to fetch yesterday stats' });
  }
});
```

### Type à ajouter dans `apps/web/src/types/index.ts`

```typescript
export interface YesterdayStats {
  yesterday: {
    totalPatients: number;
    avgWaitMins: number | null;
    date: string;
  } | null;
  trends: {
    patients: { vs7d: number | null; vs30d: number | null; };
    waitMins: { vs7d: number | null; vs30d: number | null; };
  } | null;
}
```

### Fonction API à ajouter dans `apps/web/src/lib/api.ts`

```typescript
export const getYesterdayStats = async (): Promise<YesterdayStats> => {
  const response = await apiClient.get('/queue/yesterday-stats');
  return response.data;
};
```

---

## Partie 2 — Composant `WelcomeScreenMobile.tsx`

### Fichier à créer : `apps/web/src/components/queue/WelcomeScreenMobile.tsx`

Reproduire exactement l'écran de la maquette `blesaf-welcome-v5-teal-cta.html`.

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getYesterdayStats } from '../../lib/api';
import type { YesterdayStats } from '../../types';

interface WelcomeScreenMobileProps {
  doctorName: string;      // clinic.doctorName ?? clinic.name
  onOpenQueue: () => void; // existing togglePresence handler
  isOpening: boolean;      // true while the API call is in progress
}

export default function WelcomeScreenMobile({
  doctorName,
  onOpenQueue,
  isOpening,
}: WelcomeScreenMobileProps) {
  const { t, i18n } = useTranslation();
  const [stats, setStats]   = useState<YesterdayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getYesterdayStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Outer container: full height, column flex, same bg as rest of app
    <div className="flex flex-col h-full bg-[#edeae3]">

      {/* ── 1. Greeting row ── */}
      <div className="flex items-baseline gap-[7px] px-[14px] pt-[10px] pb-[2px]">
        <span className="text-[13px] text-[#8a9a90]">
          {getTimeGreeting()},
        </span>
        <span className="text-[17px] font-bold text-[#1a1a1a] tracking-[-0.3px]">
          {doctorName}
        </span>
      </div>

      {/* ── 2. Section label ── */}
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.8px] text-[#8a9a90]
                    px-[14px] pt-[12px] pb-[6px]">
        {t('welcome.bilanHier', "Bilan d'hier")}
      </p>

      {/* ── 3. Hero KPI card (patients vus) ── */}
      <div className="bg-white rounded-[14px] shadow-sm mx-[10px] mt-[8px]
                      px-[16px] pt-[18px] pb-[16px] relative overflow-hidden">

        {/* Decorative orb — top-right */}
        <div className="absolute -top-[30px] -right-[30px] w-[100px] h-[100px]
                        rounded-full bg-[#e6f0ed] pointer-events-none z-0" />

        {/* Label */}
        <p className="relative z-10 text-[9.5px] font-semibold uppercase tracking-[0.7px]
                      text-[#8a9a90] mb-[4px]">
          {t('welcome.patientsVus', 'Patients vus')}
        </p>

        {loading ? (
          <HeroSkeleton />
        ) : stats?.yesterday ? (
          <>
            {/* Giant number */}
            <p className="relative z-10 text-[72px] font-bold text-[#3c6c5e]
                          leading-none tracking-[-3px] mb-[4px]">
              {stats.yesterday.totalPatients}
            </p>

            {/* Subtitle */}
            <p className="relative z-10 text-[12px] text-[#8a9a90] mb-[10px]">
              {t('welcome.personnesPrisesEnCharge', 'personnes prises en charge')}
            </p>

            {/* Trend chips */}
            <div className="relative z-10 flex gap-[6px] flex-wrap">
              {stats.trends?.patients.vs7d !== null &&
               stats.trends?.patients.vs7d !== undefined && (
                <TrendChip
                  delta={stats.trends.patients.vs7d}
                  label={t('welcome.vsSemPassee', 'vs sem. passée')}
                  isPositiveWhenUp
                />
              )}
              {stats.trends?.patients.vs30d !== null &&
               stats.trends?.patients.vs30d !== undefined && (
                <TrendChip
                  delta={stats.trends.patients.vs30d}
                  label={t('welcome.vs30j', 'vs 30 j.')}
                  isPositiveWhenUp
                />
              )}
            </div>
          </>
        ) : (
          <NoDataHero />
        )}
      </div>

      {/* ── 4. Secondary KPI card (attente moyenne) ── */}
      {!loading && stats?.yesterday?.avgWaitMins !== null &&
       stats?.yesterday?.avgWaitMins !== undefined && (
        <div className="bg-white rounded-[14px] shadow-sm mx-[10px] mt-[7px]
                        px-[14px] py-[13px] flex items-center gap-[14px]">

          {/* Left: number block */}
          <div className="flex-shrink-0">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.7px]
                          text-[#8a9a90] mb-[2px]">
              {t('welcome.attenteMoy', 'Attente moy.')}
            </p>
            <p className="text-[30px] font-bold text-[#1a1a1a] leading-none tracking-[-1px]">
              {stats!.yesterday!.avgWaitMins}
              <sup className="text-[13px] text-[#8a9a90] font-normal tracking-normal">mn</sup>
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-[40px] bg-black/[0.07] flex-shrink-0" />

          {/* Right: trends */}
          <div className="flex flex-col gap-[4px]">
            {stats!.trends?.waitMins.vs7d !== null &&
             stats!.trends?.waitMins.vs7d !== undefined && (
              <WaitTrendRow
                delta={stats!.trends!.waitMins.vs7d}
                label={t('welcome.vsSemPassee', 'vs sem. passée')}
              />
            )}
            {stats!.trends?.waitMins.vs30d !== null &&
             stats!.trends?.waitMins.vs30d !== undefined && (
              <WaitTrendRow
                delta={stats!.trends!.waitMins.vs30d}
                label={t('welcome.vs30j', 'vs 30 derniers j.')}
              />
            )}
          </div>
        </div>
      )}

      {/* ── 5. Flex spacer ── */}
      <div className="flex-1 min-h-[6px]" />

      {/* ── 6. CTA — Carte Teal ── */}
      <div className="px-[10px] pt-[8px] pb-[16px]">
        <button
          onClick={onOpenQueue}
          disabled={isOpening}
          className="group w-full flex flex-col justify-between gap-[10px]
                     p-[14px] rounded-[14px] bg-[#3c6c5e] shadow-md
                     hover:bg-[#2d5547] hover:shadow-lg
                     disabled:opacity-60 disabled:cursor-not-allowed
                     relative overflow-hidden
                     transition-all duration-200 cursor-pointer text-left"
        >
          {/* Decorative orb — top-right */}
          <div className="absolute -top-[24px] -right-[24px] w-[80px] h-[80px]
                          rounded-full bg-white/[0.07] pointer-events-none" />

          {/* Status row */}
          <div className="relative z-10 flex items-center gap-[6px]">
            <span className="w-[5px] h-[5px] rounded-full bg-white/35 flex-shrink-0" />
            <span className="text-[10px] font-medium text-white/50">
              {isOpening
                ? t('welcome.opening', 'Ouverture en cours…')
                : t('welcome.fileFermee', 'File actuellement fermée')}
            </span>
          </div>

          {/* CTA label */}
          <p className="relative z-10 text-[16px] font-bold text-white
                        tracking-[-0.2px] leading-[1.2]">
            {t('welcome.ouvrirLaFile', "Ouvrir la file\nd'attente")}
          </p>

          {/* Arrow — translates on hover */}
          <span className="relative z-10 text-[22px] text-white/70 leading-none
                           self-end transition-transform duration-200
                           group-hover:translate-x-[3px]">
            {i18n.language === 'ar' ? '←' : '→'}
          </span>
        </button>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function TrendChip({
  delta,
  label,
  isPositiveWhenUp,
}: {
  delta: number;
  label: string;
  isPositiveWhenUp: boolean;
}) {
  const isGood = isPositiveWhenUp ? delta > 0 : delta < 0;
  const sign   = delta > 0 ? '+' : '';
  const arrow  = delta > 0 ? '↑' : '↓';

  return (
    <span
      className={`inline-flex items-center gap-[3px] text-[10px] font-medium
                  px-[7px] py-[2px] rounded-[6px]
                  ${isGood
                    ? 'bg-[#e8f5ee] text-[#1a6635]'
                    : 'bg-[#fef2e8] text-[#9a4010]'
                  }`}
    >
      {arrow} {sign}{delta}% {label}
    </span>
  );
}

function WaitTrendRow({ delta, label }: { delta: number; label: string }) {
  // For wait time: going down is good
  const isGood = delta < 0;
  const sign   = delta > 0 ? '+' : '';
  const arrow  = delta > 0 ? '↑' : '↓';

  return (
    <span className="flex items-center gap-[5px] text-[11px] font-medium text-[#8a9a90]">
      <span className={`font-semibold ${isGood ? 'text-[#1a6635]' : 'text-[#9a4010]'}`}>
        {arrow} {sign}{delta}%
      </span>
      {label}
    </span>
  );
}

function HeroSkeleton() {
  return (
    <div className="animate-pulse relative z-10">
      <div className="h-[72px] w-28 bg-gray-100 rounded-xl mb-1" />
      <div className="h-3 w-44 bg-gray-100 rounded mb-2.5" />
      <div className="flex gap-1.5">
        <div className="h-5 w-28 bg-gray-100 rounded-[6px]" />
        <div className="h-5 w-28 bg-gray-100 rounded-[6px]" />
      </div>
    </div>
  );
}

function NoDataHero() {
  const { t } = useTranslation();
  return (
    <div className="relative z-10 pt-2">
      <p className="text-2xl mb-2">📋</p>
      <p className="text-sm font-medium text-[#4a5a52] mb-0.5">
        {t('welcome.noDataYet', 'Pas encore de données')}
      </p>
      <p className="text-xs text-[#8a9a90] leading-relaxed">
        {t('welcome.noDataSub',
          'Les statistiques apparaîtront après votre première journée.')}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Helper
───────────────────────────────────────────── */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
```

---

## Partie 3 — Intégration dans `MobileDashboard`

### Fichier à modifier : `apps/web/src/components/queue/MobileDashboard.tsx`

#### 3a. Import

```tsx
import WelcomeScreenMobile from './WelcomeScreenMobile';
```

#### 3b. Variables requises

Identifier dans `MobileDashboard` les noms exacts de ces valeurs (elles existent déjà) :

```tsx
const isDoctorPresent     = /* prop ou state existant */
const queueEntries        = /* prop ou state existant */
const onTogglePresence    = /* handler existant pour ouvrir/fermer la file */
const isTogglingPresence  = /* boolean existant ou créer: const [isTogglingPresence, setIsTogglingPresence] = useState(false) */
const clinic              = /* depuis authStore */
```

#### 3c. Condition

```tsx
const showWelcomeScreen = !isDoctorPresent && queueEntries.length === 0;
```

#### 3d. Rendu

Trouver le bloc de contenu principal dans `MobileDashboard` (après le header/topbar teal, qui reste inchangé) et envelopper :

```tsx
{/* Le topbar teal est rendu ici normalement, inchangé */}

{showWelcomeScreen ? (
  <WelcomeScreenMobile
    doctorName={clinic?.doctorName ?? clinic?.name ?? ''}
    onOpenQueue={onTogglePresence}
    isOpening={isTogglingPresence ?? false}
  />
) : (
  {/* ... contenu normal du dashboard mobile ... */}
)}
```

**Règles :**
- Le topbar teal reste **toujours visible** — il n'est pas remplacé par l'écran de bienvenue
- Si `isDoctorPresent === false` mais `queueEntries.length > 0` (file fermée en milieu de journée avec des patients) → ne **pas** afficher l'écran de bienvenue, afficher le dashboard normal
- L'écran de bienvenue ne remplace pas `MobileDashboard` — il s'insère à l'intérieur

---

## Partie 4 — Traductions i18n

### `apps/web/src/i18n/fr.json` — ajouter la section `"welcome"`

```json
"welcome": {
  "bilanHier": "Bilan d'hier",
  "patientsVus": "Patients vus",
  "personnesPrisesEnCharge": "personnes prises en charge",
  "attenteMoy": "Attente moy.",
  "vsSemPassee": "vs sem. passée",
  "vs30j": "vs 30 j.",
  "fileFermee": "File actuellement fermée",
  "ouvrirLaFile": "Ouvrir la file\nd'attente",
  "opening": "Ouverture en cours…",
  "noDataYet": "Pas encore de données",
  "noDataSub": "Les statistiques apparaîtront après votre première journée."
}
```

### `apps/web/src/i18n/ar.json` — ajouter la section `"welcome"`

```json
"welcome": {
  "bilanHier": "ملخص الأمس",
  "patientsVus": "المرضى المُعالَجون",
  "personnesPrisesEnCharge": "شخص تم استقباله",
  "attenteMoy": "متوسط الانتظار",
  "vsSemPassee": "مقارنة بالأسبوع الماضي",
  "vs30j": "مقارنة بآخر 30 يومًا",
  "fileFermee": "الطابور مغلق حالياً",
  "ouvrirLaFile": "فتح قائمة\nالانتظار",
  "opening": "جارٍ الفتح…",
  "noDataYet": "لا توجد بيانات بعد",
  "noDataSub": "ستظهر الإحصائيات بعد يومك الأول."
}
```

**Note RTL :** La flèche dans le bouton teal est gérée dans le composant via `i18n.language === 'ar' ? '←' : '→'`. Ne pas gérer ça en i18n — c'est du code, pas du texte.

---

## Partie 5 — Tests

### Fichier à créer : `apps/web/src/components/queue/WelcomeScreenMobile.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WelcomeScreenMobile from './WelcomeScreenMobile';

// ── Mocks ──
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
    i18n: { language: 'fr' },
  }),
}));

const mockStats = {
  yesterday: { totalPatients: 24, avgWaitMins: 18, date: '2026-02-28' },
  trends: {
    patients: { vs7d: 14,  vs30d: 26  },
    waitMins: { vs7d: -18, vs30d: -25 },
  },
};

vi.mock('../../lib/api', () => ({
  getYesterdayStats: vi.fn(),
}));

import { getYesterdayStats } from '../../lib/api';
const mockGetYesterdayStats = getYesterdayStats as ReturnType<typeof vi.fn>;

const defaultProps = {
  doctorName: 'Dr. Jebali',
  onOpenQueue: vi.fn(),
  isOpening: false,
};

beforeEach(() => {
  mockGetYesterdayStats.mockResolvedValue(mockStats);
  vi.clearAllMocks();
});

describe('WelcomeScreenMobile', () => {

  it('shows skeleton while loading', () => {
    mockGetYesterdayStats.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WelcomeScreenMobile {...defaultProps} />);
    // skeleton divs have animate-pulse
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders doctor name', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText('Dr. Jebali')).toBeInTheDocument();
  });

  it('renders patient count (24) after load', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText('24')).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/personnes prises en charge/i)).toBeInTheDocument();
  });

  it('renders positive patient trend chips', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/\+14%/)).toBeInTheDocument();
    expect(await screen.findByText(/\+26%/)).toBeInTheDocument();
  });

  it('renders wait time (18mn)', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText('18')).toBeInTheDocument();
  });

  it('renders negative wait trend rows', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/−18%/)).toBeInTheDocument();
    expect(await screen.findByText(/−25%/)).toBeInTheDocument();
  });

  it('renders teal CTA with correct label', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/Ouvrir la file/i)).toBeInTheDocument();
  });

  it('renders "File actuellement fermée" status in CTA', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/File actuellement fermée/i)).toBeInTheDocument();
  });

  it('renders → arrow in CTA', async () => {
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText('→')).toBeInTheDocument();
  });

  it('calls onOpenQueue when CTA tapped', async () => {
    const onOpenQueue = vi.fn();
    render(<WelcomeScreenMobile {...defaultProps} onOpenQueue={onOpenQueue} />);
    const btn = await screen.findByRole('button');
    await userEvent.click(btn);
    expect(onOpenQueue).toHaveBeenCalledOnce();
  });

  it('disables button while isOpening', async () => {
    render(<WelcomeScreenMobile {...defaultProps} isOpening />);
    const btn = await screen.findByRole('button');
    expect(btn).toBeDisabled();
  });

  it('shows "Ouverture en cours…" while isOpening', async () => {
    render(<WelcomeScreenMobile {...defaultProps} isOpening />);
    expect(await screen.findByText(/Ouverture en cours/i)).toBeInTheDocument();
  });

  it('shows no-data state when yesterday is null', async () => {
    mockGetYesterdayStats.mockResolvedValueOnce({ yesterday: null, trends: null });
    render(<WelcomeScreenMobile {...defaultProps} />);
    expect(await screen.findByText(/Pas encore de données/i)).toBeInTheDocument();
  });

  it('hides secondary card when avgWaitMins is null', async () => {
    mockGetYesterdayStats.mockResolvedValueOnce({
      yesterday: { totalPatients: 10, avgWaitMins: null, date: '2026-02-28' },
      trends: { patients: { vs7d: 5, vs30d: 10 }, waitMins: { vs7d: null, vs30d: null } },
    });
    render(<WelcomeScreenMobile {...defaultProps} />);
    await screen.findByText('10'); // wait for load
    expect(screen.queryByText(/Attente moy\./i)).not.toBeInTheDocument();
  });

  it('hides trend chip when delta is null', async () => {
    mockGetYesterdayStats.mockResolvedValueOnce({
      yesterday: { totalPatients: 24, avgWaitMins: 18, date: '2026-02-28' },
      trends: { patients: { vs7d: null, vs30d: 26 }, waitMins: { vs7d: -18, vs30d: null } },
    });
    render(<WelcomeScreenMobile {...defaultProps} />);
    await screen.findByText(/\+26%/);
    // vs7d chip should not exist
    expect(screen.queryByText(/vs sem. passée.*14%/i)).not.toBeInTheDocument();
  });
});
```

---

## Checklist d'implémentation

```
Backend
  [ ] Ajouter GET /api/queue/yesterday-stats dans apps/api/src/routes/queue.ts
  [ ] Placer la route AVANT toute route /:id pour éviter les conflits
  [ ] Tester manuellement : curl -H "Authorization: Bearer <token>"
      https://localhost:3001/api/queue/yesterday-stats
  [ ] Vérifier la réponse pour un cabinet avec données et un cabinet sans données

Types & API client
  [ ] Ajouter type YesterdayStats dans apps/web/src/types/index.ts
  [ ] Ajouter getYesterdayStats() dans apps/web/src/lib/api.ts

Composant
  [ ] Créer apps/web/src/components/queue/WelcomeScreenMobile.tsx
  [ ] Vérifier que overflow-hidden sur la hero card coupe l'orbe sans couper le texte
  [ ] Vérifier que overflow-hidden sur la CTA teal coupe l'orbe sans couper la flèche
  [ ] Vérifier que le `group` sur le bouton teal active bien group-hover:translate-x-[3px]
      sur la flèche (Tailwind doit avoir ce pattern dans son scope)
  [ ] Vérifier le rendu avec données manquantes (yesterday: null)
  [ ] Vérifier le rendu avec avgWaitMins: null (secondary card doit être absente)
  [ ] Vérifier le rendu avec vs7d: null (chip correspondant doit être absent)

Intégration MobileDashboard
  [ ] Lire MobileDashboard.tsx et identifier les noms exacts de :
        isDoctorPresent, queueEntries, onTogglePresence, isTogglingPresence, clinic
  [ ] Ajouter import WelcomeScreenMobile
  [ ] Ajouter const showWelcomeScreen = !isDoctorPresent && queueEntries.length === 0
  [ ] Envelopper le contenu post-topbar avec la condition
  [ ] Confirmer que le topbar teal n'est PAS à l'intérieur de la zone conditionnelle

Tests manuels de flow
  [ ] Login → file fermée + vide → écran de bienvenue visible
  [ ] Tap "Ouvrir la file" → spinner (isOpening=true) → file s'ouvre → écran disparaît
  [ ] Login → file déjà ouverte → écran de bienvenue PAS visible, dashboard normal
  [ ] File fermée mais patients présents → écran de bienvenue PAS visible
  [ ] Tester en arabe : flèche ← dans le bouton, RTL layout, traductions correctes

i18n
  [ ] Ajouter section "welcome" dans fr.json
  [ ] Ajouter section "welcome" dans ar.json
  [ ] Vérifier que \n dans ouvrirLaFile produit bien un saut de ligne
      (en JSX, utiliser {label.split('\n').map((l, i) => <span key={i}>{l}<br/></span>)}
       si le <br> ne s'applique pas automatiquement)

Tests automatisés
  [ ] Créer WelcomeScreenMobile.test.tsx
  [ ] pnpm test:web → 16 tests passent, 0 fail

Build
  [ ] pnpm build → aucune erreur TypeScript
  [ ] pnpm lint → aucun warning ESLint
```

---

## Note sur le saut de ligne dans le label du CTA

La traduction `ouvrirLaFile` contient `\n`. En React, un `\n` dans une chaîne ne produit pas de saut de ligne visible dans un `<p>`. Deux options :

**Option A — whitespace: pre-line (recommandé)**

```tsx
<p className="... whitespace-pre-line">
  {t('welcome.ouvrirLaFile', "Ouvrir la file\nd'attente")}
</p>
```

Ajouter la classe Tailwind `whitespace-pre-line` sur le `<p>` du label dans `TealCtaCard`.

**Option B — Hardcoder le `<br>`**

```tsx
<p className="...">
  {t('welcome.ouvrirLaFile', 'Ouvrir la file')}<br />
  {t('welcome.ouvrirLaFileSecond', "d'attente")}
</p>
```

→ Utiliser **Option A** — plus simple, cohérent avec les traductions.
