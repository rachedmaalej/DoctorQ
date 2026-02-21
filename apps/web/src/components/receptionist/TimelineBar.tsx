import { useTranslation } from 'react-i18next';
import type { SummaryData } from './types';

interface TimelineBarProps {
  summary: SummaryData;
}

export default function TimelineBar({ summary }: TimelineBarProps) {
  const { t } = useTranslation();

  if (summary.sessions.length === 0) return null;

  return (
    <div
      className="mx-5 mb-5 bg-bs-surface rounded-bs border border-bs-border"
      style={{ padding: '18px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Title */}
      <div
        className="text-bs-text-tertiary font-semibold uppercase mb-3.5"
        style={{ fontSize: 13, letterSpacing: '0.06em' }}
      >
        {t('receptionist.timeline')}
      </div>

      {/* Bar */}
      <div className="h-8 bg-bs-surface-alt rounded-bs-xs flex overflow-hidden">
        {summary.sessions.map((session, i) => (
          <div key={session.label}>
            {/* Insert lunch break between sessions */}
            {i > 0 && (
              <div
                className="bg-bs-surface-alt flex items-center justify-center text-bs-text-tertiary"
                style={{ flex: 1, fontSize: 10, fontWeight: 700, height: '100%' }}
              >
                —
              </div>
            )}
          </div>
        ))}
        {/* Render explicitly: morning, lunch, afternoon */}
        {summary.sessions[0] && (
          <div
            className="flex items-center justify-center opacity-60"
            style={{ flex: summary.sessions[0].flexWeight, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', backgroundColor: '#0F7B6C' }}
          >
            {summary.sessions[0].patientCount} pts
          </div>
        )}
        <div
          className="bg-bs-surface-alt flex items-center justify-center text-bs-text-tertiary"
          style={{ flex: 1, fontSize: 10, fontWeight: 700 }}
        >
          —
        </div>
        {summary.sessions[1] && (
          <div
            className="flex items-center justify-center"
            style={{ flex: summary.sessions[1].flexWeight, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', backgroundColor: '#0F7B6C' }}
          >
            {summary.sessions[1].patientCount} pts
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5 text-bs-text-tertiary" style={{ fontSize: 11 }}>
        <span>{summary.firstPatientTime}</span>
        <span>{summary.breakLabel}</span>
        <span>{summary.lastPatientTime}</span>
      </div>
    </div>
  );
}
