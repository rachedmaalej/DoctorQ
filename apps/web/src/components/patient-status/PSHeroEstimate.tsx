import { useRef, useEffect, useState } from 'react';
import type { Phase } from './utils';
import { deriveEyebrow, parseHeroTime, deriveSubtext, waitTimeAriaLabel, calculateRingProgress } from './utils';
import PSProgressRing from './PSProgressRing';

interface PSHeroEstimateProps {
  phase: Phase;
  estimatedMins: number;
  peopleAhead: number;
  initialPeopleAhead: number;
  status: string;
  isDoctorPresent?: boolean;
}

function PauseCircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="15" x2="10" y2="9" />
      <line x1="14" y1="15" x2="14" y2="9" />
    </svg>
  );
}

export default function PSHeroEstimate({ phase, estimatedMins, peopleAhead, initialPeopleAhead, status, isDoctorPresent }: PSHeroEstimateProps) {
  const [pulse, setPulse] = useState(false);
  const prevMinsRef = useRef(estimatedMins);
  const doctorAbsent = isDoctorPresent === false;

  // Trigger countPulse animation on time change
  useEffect(() => {
    if (prevMinsRef.current !== estimatedMins) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevMinsRef.current = estimatedMins;
      return () => clearTimeout(timer);
    }
  }, [estimatedMins]);

  const eyebrow = deriveEyebrow(phase, peopleAhead, status);
  const timeParts = parseHeroTime(estimatedMins);
  const subtext = deriveSubtext(peopleAhead);
  const ariaLabel = waitTimeAriaLabel(estimatedMins);
  const progress = calculateRingProgress(peopleAhead, initialPeopleAhead);

  return (
    <div className="ps-hero-section ps-fade-up-d1">
      {/* Eyebrow */}
      <div className={`ps-hero-eyebrow phase-${phase}`}>
        {eyebrow}
      </div>

      {/* Hero Time */}
      <div
        className={`ps-hero-time ${phase === 'ready' ? 'phase-ready' : ''} ${pulse ? 'ps-count-pulse' : ''} ${doctorAbsent ? 'doctor-absent' : ''}`}
        aria-label={ariaLabel}
      >
        {timeParts.hasHours ? (
          <>
            {timeParts.prefix}{timeParts.hours}
            <span className="unit">h</span>
            {timeParts.minutes > 0 && String(timeParts.minutes).padStart(2, '0')}
          </>
        ) : (
          <>
            {timeParts.prefix}{timeParts.minutes}
            <span className="unit"> min</span>
          </>
        )}
      </div>

      {/* EN PAUSE badge (only when doctor absent) */}
      {doctorAbsent && (
        <div className="ps-hero-paused-badge">
          <PauseCircleIcon />
          EN PAUSE
        </div>
      )}

      {/* Subtext */}
      <div className="ps-hero-sub">
        {subtext.count} {subtext.text}
      </div>

      {/* Progress Ring */}
      <PSProgressRing
        phase={phase}
        peopleAhead={peopleAhead}
        progress={progress}
        isDoctorPresent={isDoctorPresent}
      />
    </div>
  );
}
