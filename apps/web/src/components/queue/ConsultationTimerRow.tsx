import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getSpecialtyStyle } from '@/lib/specialty-colors';

export interface ActiveConsultation {
  id: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  calledAt: string | null;
  elapsedMinutes: number;
}

interface ConsultationTimerRowProps {
  consultation: ActiveConsultation;
  /** Expected consultation duration for this doctor (minutes). Drives progress bar. */
  avgConsultMinutes: number;
  onFinish: () => void;
  isLast: boolean;
}

const ROW_BG = '#EDF3FC';       // --as-blue-light
const ROW_BORDER = '#DBEAFE';   // --as-blue-100
const FINISH_BTN_BG = '#3B7DD9'; // --as-blue

const PROGRESS_TRACK = '#F0EBE4';
const PROGRESS_GREEN = '#2a9d6e';
const PROGRESS_AMBER = '#d4920a';
const PROGRESS_RED = '#c0392b';

function getProgressColor(ratio: number): string {
  if (ratio >= 1.0) return PROGRESS_RED;
  if (ratio >= 0.75) return PROGRESS_AMBER;
  return PROGRESS_GREEN;
}

function ConsultationTimerRowInner({
  consultation,
  avgConsultMinutes,
  onFinish,
  isLast,
}: ConsultationTimerRowProps) {
  const { t } = useTranslation();
  const spec = getSpecialtyStyle(consultation.doctorSpecialty);
  const isPulsing = consultation.elapsedMinutes >= 45;

  const avg = avgConsultMinutes || 15;
  const progressRatio = Math.min(consultation.elapsedMinutes / avg, 1.0);
  const progressColor = getProgressColor(progressRatio);

  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: 8,
        margin: `0 10px ${isLast ? '10px' : '4px'}`,
        background: ROW_BG,
        border: `1px solid ${ROW_BORDER}`,
      }}
      role="progressbar"
      aria-valuenow={consultation.elapsedMinutes}
      aria-valuemin={0}
      aria-valuemax={Math.max(avg, consultation.elapsedMinutes)}
      aria-label={t('queue.consultation.rowAria', {
        doctor: consultation.doctorName,
        patient: consultation.patientName,
        minutes: consultation.elapsedMinutes,
        defaultValue: `Consultation: ${consultation.doctorName} avec ${consultation.patientName}, ${consultation.elapsedMinutes} minutes`,
      })}
    >
      {/* Flex row: timer + divider + info + finish button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 1. Timer block */}
        <div
          style={{
            flexShrink: 0,
            minWidth: 46,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1,
              color: '#1a1a2e',
              fontVariantNumeric: 'tabular-nums',
              animation: isPulsing ? 'timer-pulse 2s ease-in-out infinite' : undefined,
            }}
          >
            {consultation.elapsedMinutes}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#aaa',
            }}
          >
            {t('queue.consultation.minute_unit', 'min')}
          </span>
        </div>

        {/* 2. Vertical divider */}
        <div
          style={{
            width: 1,
            height: 24,
            borderRadius: 1,
            background: ROW_BORDER,
            flexShrink: 0,
          }}
        />

        {/* 3. Info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: spec.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: '#1a1a2e',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {consultation.doctorName}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 400,
              color: '#555',
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {consultation.patientName}
          </div>
        </div>

        {/* 4. Finish button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFinish();
          }}
          aria-label={t('queue.consultation.finish_aria', {
            patient: consultation.patientName,
            doctor: consultation.doctorName,
            defaultValue: `Terminer la consultation de ${consultation.patientName} avec ${consultation.doctorName}`,
          })}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: FINISH_BTN_BG,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.1s, filter 0.1s',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)';
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      {/* 5. Progress bar — sole urgency indicator */}
      <div
        style={{
          height: 3,
          background: PROGRESS_TRACK,
          marginTop: 4,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressRatio * 100}%`,
            background: progressColor,
            borderRadius: 2,
            transition: 'width 1s ease, background 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

const ConsultationTimerRow = memo(ConsultationTimerRowInner);
export default ConsultationTimerRow;
