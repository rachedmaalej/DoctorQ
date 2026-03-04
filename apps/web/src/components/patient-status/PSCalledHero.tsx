import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { deriveDoctorWaiting } from './utils';

interface PSCalledHeroProps {
  patientName?: string;
  doctorGender?: string | null;
  isCalled: boolean; // true = position #0 (IN_CONSULTATION), false = position #1 (next)
  calledAt?: string | null;
}

export default function PSCalledHero({
  patientName,
  doctorGender,
  isCalled,
  calledAt,
}: PSCalledHeroProps) {
  const { t } = useTranslation();
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Waiting timer — ticks every second for MM:SS display
  useEffect(() => {
    if (!isCalled || !calledAt) return;

    const update = () => {
      const diff = (Date.now() - new Date(calledAt).getTime()) / 1000;
      setElapsedSecs(Math.max(0, Math.floor(diff)));
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCalled, calledAt]);

  const displayName = patientName || 'Patient';
  const waitingLabel = deriveDoctorWaiting(doctorGender);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ─── Position #0: State 6 — "C'est votre tour" ───
  // 2-zone layout: centered hero + stacked status timer at bottom
  if (isCalled) {
    return (
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="ps-go-bg-overlay" style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.12) 0%, transparent 70%)',
        }} />

        {/* Centered status content */}
        <div className="ps-fade-up-d1" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          padding: '0 24px',
        }}>
          <div className="ps-go-name" style={{ fontSize: 22 }}>{displayName}</div>
          <div className="ps-go-headline">{t('status.onVousAttend')}</div>
          <div className="ps-go-sub" style={{ whiteSpace: 'pre-line' }}>
            {t('status.dirigezVous')}
          </div>

          {/* Pulsing icon */}
          <div className="ps-go-pulse-ring ps-go-pulse-ring--compact" style={{ margin: '20px auto 0' }}>
            <div className="ps-go-icon-circle">
              <span className="material-symbols-rounded" style={{ fontSize: 40 }}>door_open</span>
            </div>
          </div>
        </div>

        {/* Stacked Status Timer */}
        <div className="ps-stacked-status" style={{ position: 'relative', zIndex: 2 }}>
          <div className="ps-stacked-icon">
            <span className="material-symbols-rounded">schedule</span>
          </div>
          <div className="ps-stacked-label">{waitingLabel}</div>
          <div className="ps-stacked-time">{formatTimer(elapsedSecs)}</div>
          <div className="ps-stacked-unit">min : sec</div>
        </div>
      </div>
    );
  }

  // ─── Position #1: State 5 — "Vous passez après" (gender-neutral) ───
  return (
    <div style={{ position: 'relative' }}>
      <div className="ps-go-bg-overlay" />
      <div className="ps-go-hero ps-fade-up-d1">
        <div className="ps-go-eyebrow">{t('status.vousPassezApres')}</div>
        <div className="ps-go-name">{displayName}</div>
        <div className="ps-go-headline" style={{ fontSize: 32, marginTop: 4 }}>
          {t('status.cEstPresqueVotreTour')}
        </div>
        <div className="ps-go-sub">
          {t('status.consultationEnCours')}
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
