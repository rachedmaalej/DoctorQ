import { useTranslation } from 'react-i18next';
import type { Phase } from './utils';
import { RING_CIRCUMFERENCE, ringDashOffset } from './utils';

interface PSProgressRingProps {
  phase: Phase;
  peopleAhead: number;
  progress: number; // 0-1
  isDoctorPresent?: boolean;
}

const phaseColors = {
  relax: { track: 'var(--relax-ring-track)', ring: 'var(--relax-ring)', number: 'var(--relax-accent)' },
  ready: { track: 'var(--ready-ring-track)', ring: 'var(--ready-ring)', number: 'var(--ready-accent)' },
  go:    { track: 'var(--go-ring-track)',    ring: 'var(--go-ring)',    number: 'var(--go-accent)' },
  done:  { track: 'var(--border)',           ring: 'var(--relax-accent)', number: 'var(--text-tertiary)' },
};

export default function PSProgressRing({ phase, peopleAhead, progress, isDoctorPresent }: PSProgressRingProps) {
  const { t } = useTranslation();
  const colors = phaseColors[phase] || phaseColors.relax;
  const offset = ringDashOffset(progress);
  const doctorAbsent = isDoctorPresent === false;

  return (
    <div className={`ps-ring-container ps-fade-up-d2 ${doctorAbsent ? 'doctor-absent' : ''}`}>
      <svg className="ps-ring-svg" viewBox="0 0 112 112">
        <circle
          className="ps-ring-track"
          cx="56"
          cy="56"
          r="48"
          stroke={colors.track}
        />
        <circle
          className="ps-ring-progress"
          cx="56"
          cy="56"
          r="48"
          stroke={colors.ring}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ps-ring-center">
        <div className="ps-ring-number" style={{ color: colors.number }}>
          {peopleAhead}
        </div>
        <div className="ps-ring-label">{t('status.devantVous')}</div>
      </div>
    </div>
  );
}
