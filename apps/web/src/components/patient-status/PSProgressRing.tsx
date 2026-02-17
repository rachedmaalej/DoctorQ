import type { Phase } from './utils';
import { RING_CIRCUMFERENCE, ringDashOffset } from './utils';

interface PSProgressRingProps {
  phase: Phase;
  peopleAhead: number;
  progress: number; // 0-1
}

const phaseColors = {
  relax: { track: 'var(--relax-ring-track)', ring: 'var(--relax-ring)', number: 'var(--relax-accent)' },
  ready: { track: 'var(--ready-ring-track)', ring: 'var(--ready-ring)', number: 'var(--ready-accent)' },
  go:    { track: 'var(--go-ring-track)',    ring: 'var(--go-ring)',    number: 'var(--go-accent)' },
  done:  { track: 'var(--border)',           ring: 'var(--relax-accent)', number: 'var(--text-tertiary)' },
};

export default function PSProgressRing({ phase, peopleAhead, progress }: PSProgressRingProps) {
  const colors = phaseColors[phase] || phaseColors.relax;
  const offset = ringDashOffset(progress);

  return (
    <div className="ps-ring-container ps-fade-up-d2">
      <svg className="ps-ring-svg" viewBox="0 0 200 200">
        <circle
          className="ps-ring-track"
          cx="100"
          cy="100"
          r="85"
          stroke={colors.track}
        />
        <circle
          className="ps-ring-progress"
          cx="100"
          cy="100"
          r="85"
          stroke={colors.ring}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ps-ring-center">
        <div className="ps-ring-number" style={{ color: colors.number }}>
          {peopleAhead}
        </div>
        <div className="ps-ring-label">devant vous</div>
      </div>
    </div>
  );
}
