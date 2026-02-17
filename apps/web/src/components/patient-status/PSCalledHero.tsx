import { useState, useEffect, useRef } from 'react';
import { deriveDoctorNarrative, deriveDoctorWaiting } from './utils';

interface PSCalledHeroProps {
  patientName?: string;
  doctorGender?: string | null;
  isCalled: boolean; // true = position #0 (IN_CONSULTATION), false = position #1 (next)
  calledAt?: string | null;
  onArrive?: () => void;
}

export default function PSCalledHero({
  patientName,
  doctorGender,
  isCalled,
  calledAt,
  onArrive,
}: PSCalledHeroProps) {
  const [hasArrived, setHasArrived] = useState(false);
  const [waitingMins, setWaitingMins] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Waiting timer for called state
  useEffect(() => {
    if (!isCalled || !calledAt) return;

    const update = () => {
      const diff = (Date.now() - new Date(calledAt).getTime()) / 60000;
      setWaitingMins(Math.max(0, Math.floor(diff)));
    };

    update();
    intervalRef.current = setInterval(update, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCalled, calledAt]);

  const handleArrive = () => {
    setHasArrived(true);
    onArrive?.();
  };

  const displayName = patientName || 'Patient';
  const waitingText = deriveDoctorWaiting(doctorGender);

  // ─── Position #0: "C'EST VOTRE TOUR" ───
  if (isCalled) {
    const narrative = deriveDoctorNarrative(doctorGender);

    return (
      <div style={{ position: 'relative' }}>
        <div className="ps-go-bg-overlay" style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.12) 0%, transparent 70%)',
        }} />
        <div className="ps-go-hero ps-fade-up-d1" style={{ paddingTop: 60 }}>
          <div className="ps-go-name" style={{ fontSize: 22 }}>{displayName}</div>
          <div className="ps-go-headline">C'EST VOTRE TOUR</div>
          <div className="ps-go-sub" style={{ whiteSpace: 'pre-line' }}>
            {narrative}
          </div>

          {/* Pulsing icon */}
          <div className="ps-go-pulse-ring" style={{ margin: '24px auto' }}>
            <div className="ps-go-icon-circle large">
              <span className="material-symbols-rounded" style={{ fontSize: 48 }}>door_open</span>
            </div>
          </div>

          {/* J'arrive button */}
          <button
            className="ps-arrive-btn"
            onClick={handleArrive}
            disabled={hasArrived}
          >
            <span className="material-symbols-rounded">check_circle</span>
            {hasArrived ? 'En route...' : "J'arrive !"}
          </button>

          {/* Waiting timer */}
          {waitingMins > 0 && (
            <div className="ps-waiting-timer">
              <span className="material-symbols-rounded">schedule</span>
              {waitingText} {waitingMins} min
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Position #1: "Vous êtes le prochain" ───
  return (
    <div style={{ position: 'relative' }}>
      <div className="ps-go-bg-overlay" />
      <div className="ps-go-hero ps-fade-up-d1">
        <div className="ps-go-eyebrow">Vous êtes le prochain</div>
        <div className="ps-go-name">{displayName}</div>
        <div className="ps-go-sub">
          Le patient actuel est en consultation.
          <br />
          Vous passez juste après.
        </div>

        {/* Pulsing icon */}
        <div className="ps-go-pulse-ring">
          <div className="ps-go-icon-circle">
            <span className="material-symbols-rounded">person</span>
          </div>
        </div>
      </div>
    </div>
  );
}
