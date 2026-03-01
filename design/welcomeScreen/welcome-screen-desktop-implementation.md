# Implémentation : Welcome Screen Desktop — Split Dominance · La Carte Teal

**Fichier cible principal :** `apps/web/src/components/queue/WelcomeScreenDesktop.tsx`
**Portée :** Frontend uniquement (réutilise l'API de la spec mobile)
**Dépendance obligatoire :** La spec mobile `welcome-screen-implementation.md` doit être implémentée en premier — ce fichier suppose que `WelcomeScreen.tsx`, l'endpoint `/api/queue/yesterday-stats`, le type `YesterdayStats`, et `getYesterdayStats()` existent déjà.
**Branche recommandée :** `feature/welcome-screen` (même branche que la spec mobile)

---

## Référence visuelle

**Fichier HTML de référence :** `design/mockups/blesaf-split-dominance-cta.html` — Variante A "La Carte Teal"

### Ce que l'écran fait exactement

Un layout deux colonnes 50/50 à l'intérieur de la zone de contenu du `DashboardPage` desktop :

**Colonne gauche — carte blanche, chiffre géant**
- Fond blanc, `rounded-2xl`, shadow
- Deux orbes teal en arrière-plan (top-right et bottom-left) — purement décoratifs
- Label section : `PATIENTS VUS · HIER` en uppercase monospace
- Chiffre `24` en ~140px teal gras, tracking très serré
- Sous-titre : `personnes prises en charge` en gris
- Deux chips verts : `↑ +14% vs sem. passée` et `↑ +26% vs 30 derniers j.`

**Colonne droite — trois cartes empilées**

1. **Carte Salutation** (blanc) : "Bonjour," + prénom du médecin + date/heure
2. **Carte KPI Secondaire** (blanc, flex-1) : Attente moy. avec chiffre 48px + tendances en deux lignes
3. **Carte Teal — CTA** (teal `#3c6c5e`) :
   - En haut à gauche : `● File actuellement fermée` en blanc semi-transparent
   - Au centre : `Ouvrir la file d'attente` en blanc 22px bold
   - En bas à droite : `→` en blanc 28px
   - Au survol : fond passe à `#2d5547`, la flèche se translate de 4px vers la droite
   - Un orbe blanc semi-transparent `opacity-[0.07]` en top-right de la carte (décoratif)

---

## Tokens de design (identiques à la spec mobile)

```
Fond app :      bg-[#edeae3]
Teal :          #3c6c5e   → bg-[#3c6c5e]   text-[#3c6c5e]
Teal dark :     #2d5547   → hover:bg-[#2d5547]
Teal light :    #e6f0ed   → bg-[#e6f0ed]
Teal mid :      #c2d9d3
Cartes :        bg-white rounded-2xl
Shadow sm :     shadow-sm  (0 1px 3px rgba(0,0,0,0.07))
Shadow md :     shadow-md  (0 4px 16px rgba(0,0,0,0.09))
Shadow lg :     shadow-lg  (0 8px 32px rgba(0,0,0,0.14))
Texte 1 :       text-gray-900   (#1a1a1a)
Texte 3 :       text-gray-400   (#8a9a90 — labels, sous-titres)
Texte 4 :       text-gray-300   (#b8c4be — hints)
Police :        DM Sans (déjà chargée)
Mono :          IBM Plex Mono (déjà chargé)
Chips verts :   bg-green-50 text-green-800
```

---

## Partie 1 — Composant `WelcomeScreenDesktop.tsx`

### Fichier à créer : `apps/web/src/components/queue/WelcomeScreenDesktop.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getYesterdayStats } from '../../lib/api';
import type { YesterdayStats } from '../../types';

interface WelcomeScreenDesktopProps {
  doctorName: string;        // clinic.doctorName ?? clinic.name
  clinicName: string;        // clinic.name
  onOpenQueue: () => void;   // existing togglePresence handler
  isOpening: boolean;        // true while API call is in progress
}

export default function WelcomeScreenDesktop({
  doctorName,
  clinicName,
  onOpenQueue,
  isOpening,
}: WelcomeScreenDesktopProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<YesterdayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getYesterdayStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 bg-[#edeae3] p-7 flex gap-3.5">

      {/* ── LEFT COLUMN: Giant KPI card ── */}
      <GiantKpiCard stats={stats} loading={loading} />

      {/* ── RIGHT COLUMN: Greeting + Secondary KPI + CTA Teal ── */}
      <div className="flex flex-col gap-3 w-[46%] flex-shrink-0">

        <GreetingCard doctorName={doctorName} />

        <SecondaryKpiCard stats={stats} loading={loading} />

        <TealCtaCard
          onOpenQueue={onOpenQueue}
          isOpening={isOpening}
        />

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEFT: Giant KPI card
───────────────────────────────────────────── */
function GiantKpiCard({
  stats,
  loading,
}: {
  stats: YesterdayStats | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex-1 bg-white rounded-2xl shadow-md px-11 pt-10 pb-9
                 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Decorative orb — top right */}
      <div
        className="absolute -top-14 -right-14 w-56 h-56 rounded-full
                   bg-[#e6f0ed] pointer-events-none"
      />
      {/* Decorative orb — bottom left */}
      <div
        className="absolute -bottom-10 left-5 w-28 h-28 rounded-full
                   bg-[#c2d9d3]/30 pointer-events-none"
      />

      <div className="relative z-10">
        {/* Section label */}
        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-gray-400 mb-2">
          {t('welcome.patientsVus', 'Patients vus')} · {t('welcome.hier', 'Hier')}
        </p>

        {loading ? (
          <GiantSkeleton />
        ) : stats?.yesterday ? (
          <>
            {/* Giant number */}
            <p
              className="font-bold text-[#3c6c5e] leading-[0.9] mb-3"
              style={{ fontSize: 'clamp(96px, 10vw, 140px)', letterSpacing: '-5px' }}
            >
              {stats.yesterday.totalPatients}
            </p>

            {/* Subtitle */}
            <p className="text-sm text-gray-400 mb-5">
              {t('welcome.personnesPrisesEnCharge', 'personnes prises en charge')}
            </p>

            {/* Trend chips */}
            <div className="flex gap-2 flex-wrap">
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
                  label={t('welcome.vs30j', 'vs 30 derniers j.')}
                  isPositiveWhenUp
                />
              )}
            </div>
          </>
        ) : (
          <NoDataState />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT 1: Greeting card
───────────────────────────────────────────── */
function GreetingCard({ doctorName }: { doctorName: string }) {
  const greeting = getTimeGreeting();
  const dateStr = formatDate();

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex-shrink-0">
      <p className="text-[13px] text-gray-400 mb-0.5">{greeting},</p>
      <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
        {doctorName}
      </p>
      <p className="font-['IBM_Plex_Mono'] text-[10px] text-gray-300 mt-1.5 tracking-[0.5px] uppercase">
        {dateStr}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT 2: Secondary KPI card (wait time)
───────────────────────────────────────────── */
function SecondaryKpiCard({
  stats,
  loading,
}: {
  stats: YesterdayStats | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm px-6 py-5 flex flex-col justify-center gap-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-gray-400">
        {t('welcome.attenteMoy', 'Attente moy.')} · {t('welcome.hier', 'Hier')}
      </p>

      {loading ? (
        <SecondarySkeleton />
      ) : stats?.yesterday?.avgWaitMins !== null &&
         stats?.yesterday?.avgWaitMins !== undefined ? (
        <>
          <div className="flex items-baseline gap-1">
            <span
              className="font-bold text-gray-900 leading-none"
              style={{ fontSize: '48px', letterSpacing: '-2px' }}
            >
              {stats.yesterday.avgWaitMins}
            </span>
            <span className="text-[18px] text-gray-400 font-normal">mn</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {stats.trends?.waitMins.vs7d !== null &&
             stats.trends?.waitMins.vs7d !== undefined && (
              <WaitTrendRow
                delta={stats.trends.waitMins.vs7d}
                label={t('welcome.vsSemPassee', 'vs semaine passée')}
              />
            )}
            {stats.trends?.waitMins.vs30d !== null &&
             stats.trends?.waitMins.vs30d !== undefined && (
              <WaitTrendRow
                delta={stats.trends.waitMins.vs30d}
                label={t('welcome.vs30j', 'vs 30 derniers jours')}
              />
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">
          {t('welcome.noWaitData', 'Aucune donnée d\'attente')}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT 3: Teal CTA card — THE FOCAL POINT
───────────────────────────────────────────── */
function TealCtaCard({
  onOpenQueue,
  isOpening,
}: {
  onOpenQueue: () => void;
  isOpening: boolean;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onOpenQueue}
      disabled={isOpening}
      className="group bg-[#3c6c5e] hover:bg-[#2d5547] disabled:opacity-60
                 rounded-2xl shadow-md hover:shadow-lg
                 px-6 pt-5 pb-5 flex-shrink-0
                 flex flex-col justify-between gap-3.5
                 relative overflow-hidden
                 transition-all duration-200 cursor-pointer
                 text-left w-full"
    >
      {/* Decorative orb inside the teal card */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full
                   bg-white/[0.07] pointer-events-none"
      />

      {/* Status row */}
      <div className="flex items-center gap-2 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
        <span className="text-[11px] text-white/50 font-medium">
          {isOpening
            ? t('welcome.opening', 'Ouverture en cours…')
            : t('welcome.fileFermee', 'File actuellement fermée')}
        </span>
      </div>

      {/* CTA label */}
      <p className="text-[22px] font-bold text-white leading-snug tracking-tight relative z-10">
        {t('welcome.ouvrirLaFile', 'Ouvrir la file\nd\'attente')}
      </p>

      {/* Arrow — translates on hover via group */}
      <span
        className="text-[28px] text-white/70 leading-none self-end relative z-10
                   transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Shared sub-components
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
  const sign = delta > 0 ? '+' : '';
  const arrow = delta > 0 ? '↑' : '↓';

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold
                  px-2.5 py-1 rounded-md
                  ${isGood ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}
    >
      {arrow} {sign}{delta}% {label}
    </span>
  );
}

function WaitTrendRow({ delta, label }: { delta: number; label: string }) {
  // For wait time: negative delta = good (shorter wait)
  const isGood = delta < 0;
  const sign = delta > 0 ? '+' : '';
  const arrow = delta > 0 ? '↑' : '↓';

  return (
    <span className="flex items-center gap-2 text-[12px] text-gray-400">
      <span className={`font-semibold ${isGood ? 'text-green-700' : 'text-orange-700'}`}>
        {arrow} {sign}{delta}%
      </span>
      {label}
    </span>
  );
}

function GiantSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[100px] w-36 bg-gray-100 rounded-xl mb-3" />
      <div className="h-4 w-48 bg-gray-100 rounded mb-5" />
      <div className="flex gap-2">
        <div className="h-7 w-36 bg-gray-100 rounded-md" />
        <div className="h-7 w-36 bg-gray-100 rounded-md" />
      </div>
    </div>
  );
}

function SecondarySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-3.5 w-full bg-gray-100 rounded mb-1.5" />
      <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
    </div>
  );
}

function NoDataState() {
  return (
    <div className="pt-4">
      <p className="text-[40px] mb-3">📋</p>
      <p className="text-base font-medium text-gray-600 mb-1">Pas encore de données</p>
      <p className="text-sm text-gray-400">
        Les statistiques apparaîtront après votre première journée.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).toUpperCase();
}
```

---

## Partie 2 — Intégration dans `DashboardPage`

### Fichier à modifier : `apps/web/src/pages/DashboardPage.tsx`

Le `DashboardPage` contient déjà une logique de responsive — un layout desktop (avec `QueueList` en sidebar ou colonne principale) et un layout mobile qui délègue à `MobileDashboard`. C'est **dans le layout desktop** que s'intègre `WelcomeScreenDesktop`.

#### 2a. Import

```tsx
import WelcomeScreenDesktop from '../components/queue/WelcomeScreenDesktop';
```

#### 2b. Variables nécessaires

Ces valeurs doivent déjà être disponibles dans `DashboardPage` via le store Zustand et le hook `useDashboard`. Identifier leurs noms exacts dans le fichier avant d'écrire le code d'intégration :

```tsx
// Depuis authStore ou useDashboard — noms exacts à vérifier dans le fichier
const clinic = useAuthStore(state => state.clinic);
const { isDoctorPresent, queueEntries, togglePresence, isTogglingPresence } = useDashboard();
```

#### 2c. Condition d'affichage

```tsx
const showWelcomeScreen = !isDoctorPresent && queueEntries.length === 0;
```

#### 2d. Rendu dans le layout desktop

Trouver dans `DashboardPage.tsx` le bloc JSX du layout desktop (généralement conditionné par une classe `hidden md:flex` ou similaire). Envelopper le contenu principal de ce layout avec la logique suivante :

```tsx
{/* Layout desktop — zone de contenu principale */}
<div className="hidden md:flex flex-1 ...">
  {showWelcomeScreen ? (
    <WelcomeScreenDesktop
      doctorName={clinic?.doctorName ?? clinic?.name ?? ''}
      clinicName={clinic?.name ?? ''}
      onOpenQueue={togglePresence}
      isOpening={isTogglingPresence ?? false}
    />
  ) : (
    {/* ... contenu normal du dashboard desktop ... */}
  )}
</div>
```

**Important :** Ne pas remplacer le layout mobile — `WelcomeScreen` (spec mobile) reste intacte dans `MobileDashboard`. Les deux composants coexistent, l'un pour mobile, l'autre pour desktop.

---

## Partie 3 — Traductions i18n

Les clés `welcome.*` sont déjà définies dans la spec mobile. Ajouter uniquement les clés manquantes pour le desktop :

### `apps/web/src/i18n/fr.json` — clés à ajouter dans `"welcome"` si absentes

```json
"hier": "Hier",
"vsSemPassee": "vs sem. passée",
"vs30j": "vs 30 derniers j.",
"noWaitData": "Aucune donnée d'attente"
```

### `apps/web/src/i18n/ar.json` — clés à ajouter dans `"welcome"` si absentes

```json
"hier": "الأمس",
"vsSemPassee": "مقارنة بالأسبوع الماضي",
"vs30j": "مقارنة بآخر 30 يومًا",
"noWaitData": "لا توجد بيانات انتظار"
```

---

## Partie 4 — Ajustement CSS pour `clamp()` dans Tailwind

La taille de police du chiffre géant utilise `clamp(96px, 10vw, 140px)` via un style inline (`style={{ fontSize: 'clamp(96px, 10vw, 140px)', letterSpacing: '-5px' }}`). C'est intentionnel — cette valeur n'a pas d'équivalent Tailwind natif et doit rester en style inline. **Ne pas remplacer par une classe Tailwind fixe.**

---

## Partie 5 — Tests

### Fichier à créer : `apps/web/src/components/queue/WelcomeScreenDesktop.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import WelcomeScreenDesktop from './WelcomeScreenDesktop';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('../../lib/api', () => ({
  getYesterdayStats: vi.fn().mockResolvedValue({
    yesterday: { totalPatients: 24, avgWaitMins: 18, date: '2026-02-28' },
    trends: {
      patients: { vs7d: 14, vs30d: 26, avg7d: 21, avg30d: 19 },
      waitMins: { vs7d: -18, vs30d: -25, avg7d: 22, avg30d: 24 },
    },
  }),
}));

const defaultProps = {
  doctorName: 'Dr. Jebali',
  clinicName: 'Cabinet Dr. Jebali',
  onOpenQueue: vi.fn(),
  isOpening: false,
};

describe('WelcomeScreenDesktop', () => {
  it('renders doctor name', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText('Dr. Jebali')).toBeInTheDocument();
  });

  it('renders patient count after data loads', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText('24')).toBeInTheDocument();
  });

  it('renders wait time after data loads', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText('18')).toBeInTheDocument();
  });

  it('renders positive trend chips', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText(/\+14%/)).toBeInTheDocument();
    expect(await screen.findByText(/\+26%/)).toBeInTheDocument();
  });

  it('renders negative wait trend', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText(/−18%/)).toBeInTheDocument();
  });

  it('renders open queue CTA', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText(/Ouvrir la file/)).toBeInTheDocument();
  });

  it('calls onOpenQueue when CTA clicked', async () => {
    const onOpenQueue = vi.fn();
    render(<WelcomeScreenDesktop {...defaultProps} onOpenQueue={onOpenQueue} />);
    const btn = await screen.findByRole('button');
    await userEvent.click(btn);
    expect(onOpenQueue).toHaveBeenCalledOnce();
  });

  it('disables CTA when isOpening is true', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} isOpening={true} />);
    const btn = await screen.findByRole('button');
    expect(btn).toBeDisabled();
  });

  it('shows opening label when isOpening', async () => {
    render(<WelcomeScreenDesktop {...defaultProps} isOpening={true} />);
    expect(await screen.findByText(/Ouverture en cours/)).toBeInTheDocument();
  });

  it('shows no-data state when yesterday is null', async () => {
    const { getYesterdayStats } = await import('../../lib/api');
    (getYesterdayStats as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      yesterday: null,
      trends: null,
    });
    render(<WelcomeScreenDesktop {...defaultProps} />);
    expect(await screen.findByText(/Pas encore de données/)).toBeInTheDocument();
  });
});
```

---

## Checklist d'implémentation

```
Prérequis
  [ ] Vérifier que la spec mobile est implémentée :
        - apps/web/src/types/index.ts contient YesterdayStats
        - apps/web/src/lib/api.ts contient getYesterdayStats()
        - apps/api/src/routes/queue.ts contient GET /yesterday-stats

Composant
  [ ] Créer apps/web/src/components/queue/WelcomeScreenDesktop.tsx
  [ ] Vérifier que les style inline (clamp, letterSpacing) ne sont pas
      overridés par des classes Tailwind conflictuelles
  [ ] Vérifier que le bouton TealCtaCard a bien cursor-pointer
      (Tailwind supprime le curseur pointer sur <button> disabled par défaut —
      ajouter disabled:cursor-not-allowed si souhaité)
  [ ] Vérifier que overflow-hidden sur la carte teal coupe bien
      l'orbe décoratif sans couper le texte

Intégration dans DashboardPage
  [ ] Lire DashboardPage.tsx et identifier :
        (a) le nom exact de la prop/variable isDoctorPresent
        (b) le nom exact de queueEntries
        (c) le nom exact du handler togglePresence
        (d) la structure du layout desktop (wrapper div, classes)
  [ ] Ajouter import WelcomeScreenDesktop
  [ ] Ajouter const showWelcomeScreen = !isDoctorPresent && queueEntries.length === 0
  [ ] Envelopper le contenu desktop avec la condition
  [ ] Tester le flow : dashboard desktop → file fermée + vide → écran visible
  [ ] Tester : ouvrir la file → écran disparaît → dashboard normal visible
  [ ] Tester : file fermée mais patients présents → écran PAS affiché
  [ ] Tester : isDoctorPresent=true au chargement → écran PAS affiché

i18n
  [ ] Vérifier que toutes les clés welcome.* existent dans fr.json
  [ ] Vérifier que toutes les clés welcome.* existent dans ar.json
  [ ] Tester le rendu en arabe : vérifier que "Bonjour" → salutation arabe
  [ ] Tester la flèche → en RTL (doit pointer ← en arabe)

Tests
  [ ] Créer WelcomeScreenDesktop.test.tsx
  [ ] pnpm test:web → tous les tests passent

Build
  [ ] pnpm build → aucune erreur TypeScript
  [ ] pnpm lint → aucun warning ESLint
  [ ] Vérifier sur une résolution 1280px, 1440px et 1920px que
      le chiffre clamp() ne déborde pas de la carte
```

---

## Notes importantes

**Sur le comportement de la carte teal au hover :**
La flèche `→` utilise `group-hover:translate-x-1` — pour que cela fonctionne, la `className` du bouton parent doit inclure `group`. C'est déjà le cas dans le composant ci-dessus. Vérifier que Tailwind reconnaît `group-hover` (c'est une classe de base, aucune config supplémentaire nécessaire).

**Sur la responsivité :**
Ce composant n'est rendu que dans le layout desktop (`hidden md:flex`). Il n'a pas besoin d'être responsive lui-même. Ne pas ajouter de breakpoints à l'intérieur de `WelcomeScreenDesktop`.

**Sur le `flex-1` de la colonne gauche :**
La colonne gauche utilise `flex-1` pour occuper tout l'espace restant après la colonne droite (`w-[46%]`). Si le conteneur parent n'est pas `display: flex`, ajuster en conséquence. Vérifier que le `DashboardPage` wrap bien les deux colonnes dans un `div` flex.

**Sur la RTL (arabe) :**
En mode RTL, les colonnes s'invertiront automatiquement grâce à la direction CSS globale. La flèche `→` dans le bouton teal doit être remplacée par `←` en arabe. Implémenter via `i18n.language`:

```tsx
import { useTranslation } from 'react-i18next';
// Dans TealCtaCard :
const { i18n } = useTranslation();
const arrow = i18n.language === 'ar' ? '←' : '→';
```
