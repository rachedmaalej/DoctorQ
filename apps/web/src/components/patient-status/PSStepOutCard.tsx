import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PSStepOutCardProps {
  isSteppedOut: boolean;
  stepOutCount: number;
  steppedOutAt: string | null;
  onStepOut: () => void;
  onStepBack: () => void;
  isLoading: boolean;
  maxStepOuts?: number;
  maxDurationMins?: number;
}

export default function PSStepOutCard({
  isSteppedOut,
  stepOutCount,
  steppedOutAt,
  onStepOut,
  onStepBack,
  isLoading,
  maxStepOuts = 2,
  maxDurationMins = 60,
}: PSStepOutCardProps) {
  const { t } = useTranslation();
  const [remainingMins, setRemainingMins] = useState(maxDurationMins);

  // Countdown timer when stepped out
  useEffect(() => {
    if (!isSteppedOut || !steppedOutAt) return;

    const updateRemaining = () => {
      const elapsed = Date.now() - new Date(steppedOutAt).getTime();
      const remaining = Math.max(0, maxDurationMins - Math.floor(elapsed / 60000));
      setRemainingMins(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [isSteppedOut, steppedOutAt, maxDurationMins]);

  const limitReached = stepOutCount >= maxStepOuts;

  // ─── Stepped Out: Card with countdown + return CTA ───
  if (isSteppedOut) {
    return (
      <div className="ps-step-out-card ps-fade-up-d5" style={{
        background: 'linear-gradient(135deg, #FFF7ED, #FFFBF5)',
        borderRadius: 'var(--radius-md, 16px)',
        padding: '20px',
        border: '1px solid #FDBA74',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 28, color: '#EA580C', animation: 'pulse 2s ease-in-out infinite' }}
          >
            directions_walk
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#9A3412' }}>
            {t('status.stepOut.active', "Vous etes absent(e)")}
          </span>
        </div>

        <div style={{
          fontSize: 14,
          color: '#C2410C',
          fontWeight: 600,
          marginBottom: 8,
        }}>
          {t('status.stepOut.countdown', '{{minutes}} min restantes', { minutes: remainingMins })}
        </div>

        <div style={{
          fontSize: 12,
          color: '#9A3412',
          opacity: 0.7,
          marginBottom: 16,
        }}>
          {t('status.stepOut.usage', '{{count}}/{{max}} absences', { count: stepOutCount, max: maxStepOuts })}
        </div>

        <button
          onClick={onStepBack}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: '#EA580C',
            color: 'white',
            borderRadius: 'var(--radius-sm, 12px)',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '...' : t('status.stepOut.return', 'Revenir dans la file')}
        </button>
      </div>
    );
  }

  // ─── Not Stepped Out: Button to step out ───
  return (
    <button
      className="ps-absent-btn ps-fade-up-d5"
      onClick={onStepOut}
      disabled={isLoading || limitReached}
      style={{
        opacity: limitReached ? 0.5 : 1,
        cursor: limitReached ? 'not-allowed' : isLoading ? 'wait' : 'pointer',
      }}
    >
      <span className="material-symbols-rounded">directions_walk</span>
      {limitReached
        ? t('status.stepOut.limitReached', "Limite d'absences atteinte")
        : t('status.stepOut.button', "Je m'absente un moment")}
      {stepOutCount > 0 && !limitReached && (
        <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6 }}>
          ({stepOutCount}/{maxStepOuts})
        </span>
      )}
    </button>
  );
}
