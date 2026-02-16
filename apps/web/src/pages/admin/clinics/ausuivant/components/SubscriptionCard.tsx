import { useState, useEffect } from 'react';
import type { ClinicDetail } from '@/types';

interface SubscriptionCardProps {
  clinic: ClinicDetail['clinic'];
  onExtend: () => void;
  onUpgrade: () => void;
  isMobile: boolean;
}

export default function SubscriptionCard({ clinic, onExtend, onUpgrade, isMobile }: SubscriptionCardProps) {
  const [fillWidth, setFillWidth] = useState(0);

  const trialEndsAt = clinic.trialEndsAt ? new Date(clinic.trialEndsAt) : null;
  const createdAt = new Date(clinic.createdAt);
  const now = new Date();

  const totalTrialDays = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - createdAt.getTime()) / 86400000) : 30;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000)) : 0;
  const daysElapsed = totalTrialDays - daysLeft;
  const progressPct = totalTrialDays > 0 ? Math.min(100, (daysElapsed / totalTrialDays) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setFillWidth(progressPct), 50);
    return () => clearTimeout(timer);
  }, [progressPct]);

  const isTrial = clinic.subscriptionStatus === 'TRIAL';
  const statusLabel = isTrial ? 'ESSAI' : clinic.subscriptionStatus;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e0d8',
        padding: '1.3rem',
        marginBottom: '1.2rem',
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          marginBottom: '0.8rem',
        }}
      >
        Abonnement
      </div>

      <div style={{ borderBottom: '1px solid #f0ebe4', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#777' }}>Statut</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: isTrial ? '#c0392b' : '#1a1a2e' }}>
          {statusLabel}
        </span>
      </div>

      {isTrial && (
        <>
          <div style={{ borderBottom: '1px solid #f0ebe4', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#777' }}>Essai</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#c0392b' }}>
              {daysLeft} jours restants
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ height: 4, background: '#e5e0d8', borderRadius: 2, margin: '0.3rem 0 0', width: '100%', overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                background: '#c0392b',
                borderRadius: 2,
                width: `${fillWidth}%`,
                transition: 'width 600ms ease-out',
              }}
            />
          </div>

          <div style={{ padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#777' }}>Fin d'essai</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#1a1a2e' }}>
              {trialEndsAt ? trialEndsAt.toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
        <button
          onClick={onExtend}
          style={{
            background: 'none',
            border: '1px solid #c5bfb5',
            color: '#1a1a2e',
            padding: '0.55rem',
            borderRadius: 9,
            fontWeight: 600,
            fontSize: '0.82rem',
            textAlign: 'center',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isMobile ? 'Prolonger' : "Prolonger l'essai"}
        </button>
        <button
          onClick={onUpgrade}
          style={{
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            padding: '0.55rem',
            borderRadius: 9,
            fontWeight: 600,
            fontSize: '0.82rem',
            textAlign: 'center',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Upgrader
        </button>
      </div>
    </div>
  );
}
