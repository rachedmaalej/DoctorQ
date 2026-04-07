import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueueEntry, Doctor } from '@/types';
import { QueueStatus } from '@/types';
import { formatDisplayName, formatDoctorName } from '@/components/ausuivant/utils';
import ConsultationTimerRow from './ConsultationTimerRow';
import type { ActiveConsultation } from './ConsultationTimerRow';

interface ConsultationTimerSectionProps {
  patients: QueueEntry[];
  doctors: Doctor[];
  doctorCount: number;
  /** Clinic-level fallback avg consultation duration. Used when doctor-level value missing. */
  avgConsultMinutes: number;
  onFinishConsultation: (entryId: string) => void;
}

/** Normal < 0.75, warning 0.75-0.99, overlong >= 1.0 (relative to expected duration) */
function getProgressBadgeTint(worstRatio: number): { bg: string; color: string } {
  if (worstRatio >= 1.0) return { bg: '#FEE2E2', color: '#c0392b' };
  if (worstRatio >= 0.75) return { bg: '#FEF3C7', color: '#d4920a' };
  return { bg: '#EDF3FC', color: '#3B7DD9' };
}

export default function ConsultationTimerSection({
  patients,
  doctors,
  doctorCount,
  avgConsultMinutes,
  onFinishConsultation,
}: ConsultationTimerSectionProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCollapsible = doctorCount >= 3;

  // Tick every 30s so timers update
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Derive active consultations with per-doctor avg
  const consultations = useMemo(() => {
    return patients
      .filter((e) => e.status === QueueStatus.IN_CONSULTATION)
      .map((entry) => {
        const doctor = doctors.find((d) => d.id === entry.doctorId);
        const elapsed = entry.calledAt
          ? Math.floor((now - new Date(entry.calledAt).getTime()) / 60000)
          : 0;
        const avg = doctor?.avgConsultationMins || avgConsultMinutes || 15;
        const consultation: ActiveConsultation = {
          id: entry.id,
          patientName: formatDisplayName(entry.patientName),
          doctorId: entry.doctorId ?? '',
          doctorName: formatDoctorName(doctor?.name),
          doctorSpecialty: doctor?.specialty ?? null,
          calledAt: entry.calledAt,
          elapsedMinutes: Math.max(0, elapsed),
        };
        return { consultation, avg };
      })
      .sort((a, b) => b.consultation.elapsedMinutes - a.consultation.elapsedMinutes);
  }, [patients, doctors, now, avgConsultMinutes]);

  // Worst progress ratio for collapsed badge color
  const worstRatio = useMemo(() => {
    return consultations.reduce((worst, { consultation, avg }) => {
      const ratio = Math.min(consultation.elapsedMinutes / avg, 1.0);
      return Math.max(worst, ratio);
    }, 0);
  }, [consultations]);

  const badgeStyles = isCollapsed && consultations.length > 0
    ? getProgressBadgeTint(worstRatio)
    : { bg: '#EDF3FC', color: '#3B7DD9' };

  const handleToggle = () => {
    if (isCollapsible) setIsCollapsed((prev) => !prev);
  };

  return (
    <div
      className="as-fade-up"
      style={{
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border-subtle, #E8E6DF)',
        borderRadius: 'var(--radius, 12px)',
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      {/* Section header */}
      <div
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? !isCollapsed : undefined}
        aria-controls={isCollapsible ? 'consultation-timer-body' : undefined}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: isCollapsed ? '12px 14px' : '12px 14px 8px',
          cursor: isCollapsible ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        }}
      >
        {/* Blue dot */}
        {consultations.length > 0 ? (
          <span
            className="as-pulse-consultation"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#3B7DD9',
              display: 'inline-block',
            }}
          />
        ) : (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-border, #E8E6DF)',
              display: 'inline-block',
            }}
          />
        )}

        {/* Title */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: consultations.length > 0 ? '#3B7DD9' : 'var(--color-text-muted, #9E9B90)',
          }}
        >
          {t('queue.consultation.title', 'En Consultation')}
        </span>

        {/* Right side: count badge + chevron */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Count badge */}
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: badgeStyles.bg,
              color: badgeStyles.color,
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {consultations.length}
          </span>

          {/* Collapse chevron (only when 3+ doctors) */}
          {isCollapsible && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9E9B90"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.2s ease',
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      {/* Body: consultation rows */}
      <div
        id="consultation-timer-body"
        aria-hidden={isCollapsed}
        style={{
          maxHeight: isCollapsed ? 0 : 500,
          opacity: isCollapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
        }}
      >
        {consultations.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: '#9E9B90',
              textAlign: 'center',
              padding: '14px 0',
              fontStyle: 'italic',
            }}
          >
            {t('queue.consultation.empty', 'Aucune consultation en cours')}
          </div>
        ) : (
          consultations.map(({ consultation, avg }, idx) => (
            <ConsultationTimerRow
              key={consultation.id}
              consultation={consultation}
              avgConsultMinutes={avg}
              onFinish={() => onFinishConsultation(consultation.id)}
              isLast={idx === consultations.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
