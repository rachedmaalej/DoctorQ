import { useRef, useEffect, useState } from 'react';
import type { Phase } from './utils';
import { deriveEyebrow, deriveTimeSize, parseHeroTime, deriveSubtext, waitTimeAriaLabel } from './utils';

interface PSHeroEstimateProps {
  phase: Phase;
  estimatedMins: number;
  peopleAhead: number;
}

export default function PSHeroEstimate({ phase, estimatedMins, peopleAhead }: PSHeroEstimateProps) {
  const [pulse, setPulse] = useState(false);
  const prevMinsRef = useRef(estimatedMins);

  // Trigger countPulse animation on time change
  useEffect(() => {
    if (prevMinsRef.current !== estimatedMins) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevMinsRef.current = estimatedMins;
      return () => clearTimeout(timer);
    }
  }, [estimatedMins]);

  const eyebrow = deriveEyebrow(phase);
  const sizeClass = deriveTimeSize(estimatedMins);
  const timeParts = parseHeroTime(estimatedMins);
  const subtext = deriveSubtext(peopleAhead);
  const ariaLabel = waitTimeAriaLabel(estimatedMins);

  return (
    <div
      className="ps-fade-up-d2"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 20px 24px',
        minHeight: 260,
      }}
    >
      {/* Eyebrow */}
      <div className={`ps-eyebrow phase-${phase}`}>
        {eyebrow}
      </div>

      {/* Hero Time */}
      <div
        className={`ps-hero-time ${sizeClass} ${pulse ? 'ps-count-pulse' : ''}`}
        aria-label={ariaLabel}
      >
        {timeParts.hasHours ? (
          <>
            {timeParts.prefix}{timeParts.hours}
            <span className="ps-hero-time-suffix">h</span>
            {' '}{String(timeParts.minutes).padStart(2, '0')}
            <span className="ps-hero-time-suffix">min</span>
          </>
        ) : (
          <>
            {timeParts.prefix}{timeParts.minutes}
            <span className="ps-hero-time-suffix"> min</span>
          </>
        )}
      </div>

      {/* Subtext */}
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10 }}>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{subtext.count}</strong>{' '}
        {subtext.text}
      </div>
    </div>
  );
}
