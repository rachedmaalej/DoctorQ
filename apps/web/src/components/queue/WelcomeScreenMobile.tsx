import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import type { YesterdayStats } from '../../types';

interface WelcomeScreenMobileProps {
  doctorName: string;
  onOpenQueue: () => void;
  isOpening: boolean;
}

export default function WelcomeScreenMobile({
  doctorName,
  onOpenQueue,
  isOpening,
}: WelcomeScreenMobileProps) {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<YesterdayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getYesterdayStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  // Show full bilan only once there are ≥7 days of historical data
  // (server returns trends.patients.vs7d only when enough DailyStat rows exist)
  const has7DaysData =
    !loading &&
    stats?.trends?.patients?.vs7d !== null &&
    stats?.trends?.patients?.vs7d !== undefined;

  // ── Shared CTA button ──────────────────────────────────
  const ctaButton = (
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
        <div className="absolute -top-[24px] -right-[24px] w-[80px] h-[80px]
                        rounded-full bg-white/[0.07] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-white/35 flex-shrink-0" />
          <span className="text-[10px] font-medium text-white/50">
            {isOpening
              ? t('welcome.opening', 'Ouverture en cours…')
              : t('welcome.fileFermee', 'File actuellement fermée')}
          </span>
        </div>
        <p className="relative z-10 text-[16px] font-bold text-white
                      tracking-[-0.2px] leading-[1.2] whitespace-pre-line">
          {t('welcome.ouvrirLaFile', "Ouvrir la file\nd'attente")}
        </p>
        <span className="relative z-10 text-[22px] text-white/70 leading-none
                         self-end transition-transform duration-200
                         group-hover:translate-x-[3px]">
          {i18n.language === 'ar' ? '←' : '→'}
        </span>
      </button>
    </div>
  );

  // ── Empty state (< 7 days of data): doctor illustration + CTA ──
  if (!has7DaysData) {
    return (
      <div className="flex flex-col h-full bg-[#edeae3]">
        {/* Greeting */}
        <div className="flex items-baseline gap-[7px] px-[14px] pt-[10px] pb-[2px]">
          <span className="text-[13px] text-[#8a9a90]">{getTimeGreeting()},</span>
          <span className="text-[17px] font-bold text-[#1a1a1a] tracking-[-0.3px]">
            {doctorName}
          </span>
        </div>

        {/* Doctor illustration */}
        <div className="flex-1 flex items-center justify-center px-[24px] py-[16px] min-h-0">
          <img
            src="/images/onboarding/welcome2.png"
            alt="Doctor"
            className="w-full max-w-[260px] h-auto object-contain"
            style={{ maxHeight: '100%' }}
          />
        </div>

        {ctaButton}
      </div>
    );
  }

  // ── Full bilan (≥ 7 days of data) ──────────────────────
  return (
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

        {stats?.yesterday ? (
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
      {stats?.yesterday?.avgWaitMins !== null &&
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

      {ctaButton}

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
