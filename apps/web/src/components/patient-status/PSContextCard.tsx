import { useTranslation } from 'react-i18next';
import type { Phase } from './utils';

import PSStepOutCard from './PSStepOutCard';

interface PSContextCardProps {
  phase: Phase;
  peopleAhead: number;
  avgConsultMins?: number;
  isCalled: boolean;
  confidence?: 'high' | 'medium' | 'low';
  // Step-out props
  enableStepOut?: boolean;
  isSteppedOut?: boolean;
  stepOutCount?: number;
  steppedOutAt?: string | null;
  onStepOut?: () => void;
  onStepBack?: () => void;
  isSteppingOut?: boolean;
}

export default function PSContextCard({
  phase,
  peopleAhead,
  avgConsultMins,
  isCalled,
  confidence,
  enableStepOut = false,
  isSteppedOut = false,
  stepOutCount = 0,
  steppedOutAt = null,
  onStepOut,
  onStepBack,
  isSteppingOut = false,
}: PSContextCardProps) {
  const { t } = useTranslation();

  // No context cards for called (#0) or done
  if (isCalled || phase === 'done') return null;

  // ─── Stepped Out: Always show return card when patient is absent ───
  if (isSteppedOut && enableStepOut && onStepOut && onStepBack) {
    return (
      <div className="ps-info-area ps-fade-up-d3">
        <PSStepOutCard
          isSteppedOut={isSteppedOut}
          stepOutCount={stepOutCount}
          steppedOutAt={steppedOutAt}
          onStepOut={onStepOut}
          onStepBack={onStepBack}
          isLoading={isSteppingOut}
        />
      </div>
    );
  }

  // ─── Relax Phase (States 1-2: position ≥ 4) ───
  if (phase === 'relax') {
    const avgDisplay = avgConsultMins != null && avgConsultMins > 0 ? `~${avgConsultMins} min` : '~10 min';

    // Contextual tip varies by position
    const tipIcon = peopleAhead >= 5 ? 'coffee' : 'schedule';
    const tipText = peopleAhead >= 5
      ? t('status.alertCafe')
      : t('status.alertPatience');
    const tipClass = peopleAhead >= 5 ? 'tip-cafe' : 'tip-patience';

    return (
      <div className="ps-info-area ps-fade-up-d3">
        {/* Info Card */}
        <div className="ps-info-card phase-relax">
          <div className="ps-info-row">
            <span className="ps-info-label">{t('status.dureeMoyParPatient')}</span>
            <span className="ps-info-value phase-relax">{avgDisplay}</span>
          </div>
          <div className="ps-info-row">
            <span className="ps-info-label">{t('status.baseSur')}</span>
            <span className="ps-info-value" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {confidence === 'high' ? t('status.consultationsDuJour')
                : confidence === 'medium' ? t('status.historiqueRecent')
                : 'valeur par défaut'}
            </span>
          </div>
        </div>

        {/* Context Tip */}
        <div className={`ps-context-tip ${tipClass}`}>
          <span className="material-symbols-rounded">{tipIcon}</span>
          {tipText}
        </div>

        {/* Step-Out Button — only visible when enabled and position >= 3 */}
        {enableStepOut && onStepOut && onStepBack && (
          <PSStepOutCard
            isSteppedOut={isSteppedOut}
            stepOutCount={stepOutCount}
            steppedOutAt={steppedOutAt}
            onStepOut={onStepOut}
            onStepBack={onStepBack}
            isLoading={isSteppingOut}
          />
        )}
      </div>
    );
  }

  // ─── Ready Phase (States 3-4: position 2-3) ───
  if (phase === 'ready') {
    const avgDisplay = avgConsultMins ? `~${avgConsultMins} min` : '~17 min';

    // At position #2 vs #3
    const isUrgent = peopleAhead === 2;
    const tipIcon = isUrgent ? 'warning' : 'location_on';
    const tipText = isUrgent
      ? t('status.alertNePasEloigner')
      : t('status.alertSalle');
    const tipClass = isUrgent ? 'tip-warning' : 'tip-stay';

    return (
      <div className="ps-info-area ps-fade-up-d3">
        {/* Info Card — single row only (redundant rows removed per spec) */}
        <div className="ps-info-card phase-ready">
          <div className="ps-info-row">
            <span className="ps-info-label">{t('status.dureeMoyParPatient')}</span>
            <span className="ps-info-value phase-ready">{avgDisplay}</span>
          </div>
        </div>

        {/* Context Tip */}
        <div className={`ps-context-tip ${tipClass}`}>
          <span className="material-symbols-rounded">{tipIcon}</span>
          {tipText}
        </div>

      </div>
    );
  }

  // ─── Go Phase (position #1 only — #0 is handled by isCalled check above) ───
  if (phase === 'go') {
    return (
      <div className="ps-info-area ps-fade-up-d3" style={{ position: 'relative', zIndex: 2 }}>
        <div className="ps-context-tip tip-go">
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          {t('status.alertPorte')}
        </div>
      </div>
    );
  }

  return null;
}
