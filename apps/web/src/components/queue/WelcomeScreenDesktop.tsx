import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import type { YesterdayStats } from '../../types';

interface WelcomeScreenDesktopProps {
  doctorName: string;
  clinicName: string;
  onOpenQueue: () => void;
  isOpening: boolean;
}

export default function WelcomeScreenDesktop({
  doctorName,
  onOpenQueue,
  isOpening,
}: WelcomeScreenDesktopProps) {
  const [stats, setStats] = useState<YesterdayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getYesterdayStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#edeae3] p-7 flex gap-3.5" style={{ minHeight: 'calc(100vh - 105px)' }}>

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
          {t('welcome.noWaitData', "Aucune donnée d'attente")}
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
  const { t, i18n } = useTranslation();
  const arrow = i18n.language === 'ar' ? '←' : '→';

  return (
    <button
      onClick={onOpenQueue}
      disabled={isOpening}
      className="group bg-[#3c6c5e] hover:bg-[#2d5547] disabled:opacity-60
                 rounded-2xl shadow-md hover:shadow-lg
                 px-6 pt-5 pb-5 flex-shrink-0
                 flex flex-col justify-between gap-3.5
                 relative overflow-hidden
                 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed
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
      <p className="text-[22px] font-bold text-white leading-snug tracking-tight relative z-10 whitespace-pre-line">
        {t('welcome.ouvrirLaFile', "Ouvrir la file\nd'attente")}
      </p>

      {/* Arrow — translates on hover via group */}
      <span
        className="text-[28px] text-white/70 leading-none self-end relative z-10
                   transition-transform duration-200 group-hover:translate-x-1"
      >
        {arrow}
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
