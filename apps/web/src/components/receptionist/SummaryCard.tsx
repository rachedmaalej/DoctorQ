import { useTranslation } from 'react-i18next';
import type { SummaryData } from './types';

interface SummaryCardProps {
  summary: SummaryData;
  onShare?: () => void;
}

export default function SummaryCard({ summary, onShare }: SummaryCardProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-5 mt-5 bg-bs-surface overflow-hidden" style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
      {/* Hero section */}
      <div
        className="bs-summary-hero text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)',
          padding: '28px 24px 32px',
        }}
      >
        <div className="opacity-70 mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
          {summary.date}
        </div>
        <div className="font-bold" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
          {summary.doctorFullName}
        </div>
        <div className="opacity-70 mt-0.5" style={{ fontSize: 14 }}>
          {summary.specialty} · {summary.location}
        </div>
        <div className="mt-7 flex items-baseline gap-2">
          <span
            className="font-bold leading-none"
            style={{ fontSize: 56, letterSpacing: '-0.04em' }}
          >
            {summary.totalPatientsSeen}
          </span>
          <span className="opacity-70" style={{ fontSize: 18, fontWeight: 500 }}>
            {t('receptionist.summary.patientsSeen')}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="bs-stats-grid">
        <GridCell value={`${summary.avgWaitMinutes} min`} label={t('receptionist.summary.avgWait')} />
        <GridCell value={`${summary.avgConsultMinutes} min`} label={t('receptionist.summary.avgConsult')} />
        <GridCell value={summary.firstPatientTime} label={t('receptionist.summary.firstPatient')} />
        <GridCell value={summary.lastPatientTime} label={t('receptionist.summary.lastPatient')} />
      </div>

      {/* Temps gagné — only when remote check-ins occurred */}
      {summary.timeSavedMinutes != null && summary.timeSavedMinutes > 0 && (
        <div className="text-center" style={{ padding: '16px 24px 4px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="text-bs-text-primary font-bold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
            {summary.timeSavedMinutes >= 60
              ? `${Math.floor(summary.timeSavedMinutes / 60)}h${(summary.timeSavedMinutes % 60).toString().padStart(2, '0')}`
              : `${summary.timeSavedMinutes} min`}
          </div>
          <div className="text-bs-text-tertiary mt-0.5" style={{ fontSize: 12 }}>
            {t('dashboard.timeSavedToday')}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-1.5 text-bs-text-tertiary font-semibold" style={{ fontSize: 13 }}>
          <div
            className="text-white flex items-center justify-center"
            style={{ width: 20, height: 20, borderRadius: 5, fontSize: 11, fontWeight: 800, backgroundColor: '#0F7B6C' }}
          >
            B
          </div>
          BleSaf
        </div>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-white rounded-full font-semibold transition-all duration-150 active:scale-[0.96]"
          style={{ padding: '10px 20px', fontSize: 14, border: 'none', backgroundColor: '#0F7B6C' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>share</span>
          {t('receptionist.summary.share')}
        </button>
      </div>
    </div>
  );
}

function GridCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-bs-surface text-center" style={{ padding: 20 }}>
      <div
        className="text-bs-text-primary font-bold"
        style={{ fontSize: 24, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-bs-text-tertiary mt-1" style={{ fontSize: 12 }}>
        {label}
      </div>
    </div>
  );
}
