import type { QueueEntry } from '@/types';
import { abbreviateName } from './utils';

interface BSFloatingCTAProps {
  nextPatient: QueueEntry | null;
  onCallNext: () => void;
  isCallingNext: boolean;
  disabled: boolean;
}

export default function BSFloatingCTA({
  nextPatient,
  onCallNext,
  isCallingNext,
  disabled,
}: BSFloatingCTAProps) {
  if (!nextPatient && !disabled) return null;

  const shortName = nextPatient ? abbreviateName(nextPatient.patientName) : '';

  return (
    <div className="bs-float-cta">
      <button
        className="bs-float-cta-btn"
        onClick={onCallNext}
        disabled={disabled || isCallingNext}
      >
        <span className="material-symbols-rounded">arrow_forward</span>
        {isCallingNext ? 'Appel en cours...' : 'Appeler Suivant'}
        {shortName && !isCallingNext && (
          <span className="bs-next-name">· {shortName}</span>
        )}
      </button>
    </div>
  );
}
