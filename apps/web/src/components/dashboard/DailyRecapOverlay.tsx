import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { DailyRecapResponse } from '@/types';

interface DailyRecapOverlayProps {
  doctorName: string;
  onDismiss: () => void;
}

function TrendBadge({ value, invertColors = false }: { value: number; invertColors?: boolean }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center text-xs text-gray-400 font-medium">
        <span className="mr-0.5">=</span>0%
      </span>
    );
  }

  const isPositive = value > 0;
  // For wait time, lower is better, so invert the color logic
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <span className={`inline-flex items-center text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
      <span className="material-symbols-outlined text-sm mr-0.5" style={{ fontSize: '14px' }}>
        {isPositive ? 'trending_up' : 'trending_down'}
      </span>
      {isPositive ? '+' : ''}{value}%
    </span>
  );
}

/** Strip leading "Dr." / "Dr " prefix to avoid "Bonjour Dr. Dr. X" */
function stripDrPrefix(name: string): string {
  return name.replace(/^Dr\.?\s*/i, '').trim();
}

export default function DailyRecapOverlay({ doctorName, onDismiss }: DailyRecapOverlayProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<DailyRecapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({ patients: 0, consultation: 0, wait: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  // Fetch data on mount
  useEffect(() => {
    api.getDailyRecap()
      .then((result) => {
        if (!result.hasData) {
          onDismiss();
          return;
        }
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        onDismiss();
      });
  }, [onDismiss]);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!data || loading) return;
    timerRef.current = setTimeout(() => handleDismiss(), 15000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, loading, handleDismiss]);

  // Animate number count-up
  useEffect(() => {
    if (!data?.yesterday) return;

    const targets = {
      patients: data.yesterday.totalPatients,
      consultation: data.yesterday.avgConsultationMins ?? 0,
      wait: data.yesterday.avgWaitMins ?? 0,
    };

    const duration = 1000; // 1 second count-up
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        patients: Math.round(targets.patients * eased),
        consultation: Math.round(targets.consultation * eased),
        wait: Math.round(targets.wait * eased),
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    // Delay count-up to let card animate in first
    const delayTimer = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(animate);
    }, 600);

    return () => {
      clearTimeout(delayTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [data]);

  if (loading || !data?.yesterday || !data.trends) return null;

  const { trends } = data;
  const cleanName = stripDrPrefix(doctorName);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${exiting ? '' : 'recap-backdrop'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={handleDismiss}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ${exiting ? 'recap-card-exit' : 'recap-card'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {t('dailyRecap.greeting', { name: cleanName })}
              </h2>
              <p className="text-primary-100 text-sm mt-0.5">
                {t('dailyRecap.subtitle')}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* KPI Cards — Design 1: Icon + Title + Subtitle */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            {/* Patients */}
            <div className="recap-kpi text-center bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  groups
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {animatedValues.patients}
              </div>
              <div className="text-xs font-semibold text-gray-700 mt-1">
                {t('dailyRecap.patientsTitle')}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {t('dailyRecap.patientsSubtitle')}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.patients.vsPrevDay} />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsPrevDay')}</div>
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.patients.vsMonthly} />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsMonthly')}</div>
              </div>
            </div>

            {/* Avg Consultation Duration */}
            <div className="recap-kpi text-center bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  timer
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {animatedValues.consultation}
                <span className="text-sm font-normal text-gray-400 ml-0.5">{t('dailyRecap.minutes')}</span>
              </div>
              <div className="text-xs font-semibold text-gray-700 mt-1">
                {t('dailyRecap.consultationTitle')}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {t('dailyRecap.consultationSubtitle')}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.avgConsultation.vsPrevDay} />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsPrevDay')}</div>
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.avgConsultation.vsMonthly} />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsMonthly')}</div>
              </div>
            </div>

            {/* Avg Wait Time */}
            <div className="recap-kpi text-center bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hourglass_top
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {animatedValues.wait}
                <span className="text-sm font-normal text-gray-400 ml-0.5">{t('dailyRecap.minutes')}</span>
              </div>
              <div className="text-xs font-semibold text-gray-700 mt-1">
                {t('dailyRecap.waitTitle')}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {t('dailyRecap.waitSubtitle')}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.avgWait.vsPrevDay} invertColors />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsPrevDay')}</div>
                <div className="flex items-center justify-center gap-1">
                  <TrendBadge value={trends.avgWait.vsMonthly} invertColors />
                </div>
                <div className="text-[10px] text-gray-400">{t('dailyRecap.vsMonthly')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar + dismiss */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-400 rounded-full recap-progress-bar" />
            </div>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              {t('dailyRecap.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
