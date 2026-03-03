import { useTranslation } from 'react-i18next';
import type { Phase } from './utils';

import PSAbsentButton from './PSAbsentButton';

interface PSContextCardProps {
  phase: Phase;
  peopleAhead: number;
  avgConsultMins?: number;
  isAbsent: boolean;
  onAbsentClick: () => void;
  isCalled: boolean;
  confidence?: 'high' | 'medium' | 'low';
}

export default function PSContextCard({
  phase,
  peopleAhead,
  avgConsultMins,
  isAbsent,
  onAbsentClick,
  isCalled,
  confidence,
}: PSContextCardProps) {
  const { t } = useTranslation();

  // No context cards for called (#0) or done
  if (isCalled || phase === 'done') return null;

  // ─── Relax Phase (States 1-2: position ≥ 4) ───
  if (phase === 'relax') {
    const avgDisplay = avgConsultMins ? `~${avgConsultMins} min` : '~20 min';

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

        {/* Absent Button — only visible on states 1-2 (position ≥ 4) */}
        <PSAbsentButton isAbsent={isAbsent} onToggle={onAbsentClick} />
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
