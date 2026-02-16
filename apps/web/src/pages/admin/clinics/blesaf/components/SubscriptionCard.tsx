import { useState, useEffect } from 'react';
import type { ClinicDetail } from '@/types';

interface SubscriptionCardProps {
  clinic: ClinicDetail['clinic'];
  onExtend: () => void;
  onUpgrade: () => void;
}

export default function SubscriptionCard({ clinic, onExtend, onUpgrade }: SubscriptionCardProps) {
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
  const statusLabel = isTrial ? 'TRIAL' : clinic.subscriptionStatus;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e8e5df',
        padding: '1.3rem',
        marginBottom: '1.2rem',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          marginBottom: '0.8rem',
        }}
      >
        Subscription
      </div>

      {/* Key-value rows */}
      <div style={{ borderBottom: '1px solid #f3f0ec', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#666' }}>Status</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: isTrial ? '#2a9d6e' : '#1a1a2e' }}>
          {statusLabel}
        </span>
      </div>

      {isTrial && (
        <>
          <div style={{ borderBottom: '1px solid #f3f0ec', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#666' }}>Trial</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#2a9d6e' }}>
              {daysLeft} days left
            </span>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 4,
              background: '#e8e5df',
              borderRadius: 2,
              margin: '0.3rem 0 0',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#2a9d6e',
                borderRadius: 2,
                width: `${fillWidth}%`,
                transition: 'width 600ms ease-out',
              }}
            />
          </div>

          <div style={{ padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#666' }}>Trial ends</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#1a1a2e' }}>
              {trialEndsAt ? trialEndsAt.toLocaleDateString('en-GB') : '—'}
            </span>
          </div>
        </>
      )}

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
        <button
          onClick={onExtend}
          style={{
            background: 'none',
            border: '1px solid #c5c0b8',
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
          Extend Trial
        </button>
        <button
          onClick={onUpgrade}
          style={{
            background: '#2a9d6e',
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
          Upgrade
        </button>
      </div>
    </div>
  );
}
