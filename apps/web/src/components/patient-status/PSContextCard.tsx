import type { Phase } from './utils';
import PSNotifPrompt from './PSNotifPrompt';
import PSAbsentButton from './PSAbsentButton';

interface PSContextCardProps {
  phase: Phase;
  peopleAhead: number;
  avgConsultMins?: number;
  estimatedMins: number;
  notifEnabled: boolean;
  onNotifClick: () => void;
  isAbsent: boolean;
  onAbsentClick: () => void;
  isCalled: boolean;
}

export default function PSContextCard({
  phase,
  peopleAhead,
  avgConsultMins,
  estimatedMins,
  notifEnabled,
  onNotifClick,
  isAbsent,
  onAbsentClick,
  isCalled,
}: PSContextCardProps) {
  // No context cards for called (#0) or done
  if (isCalled || phase === 'done') return null;

  // ─── Relax Phase ───
  if (phase === 'relax') {
    const avgDisplay = avgConsultMins ? `~${avgConsultMins} min` : '~20 min';

    // Contextual tip varies by position
    const tipIcon = peopleAhead >= 5 ? 'coffee' : 'schedule';
    const tipText = peopleAhead >= 5
      ? 'Vous avez le temps pour un café \u2615'
      : 'Encore un peu de patience...';
    const tipClass = peopleAhead >= 5 ? 'tip-cafe' : 'tip-patience';

    return (
      <div className="ps-info-area ps-fade-up-d3">
        {/* Info Card */}
        <div className="ps-info-card phase-relax">
          <div className="ps-info-row">
            <span className="ps-info-label">Durée moy. par patient</span>
            <span className="ps-info-value phase-relax">{avgDisplay}</span>
          </div>
          <div className="ps-info-row">
            <span className="ps-info-label">Basé sur</span>
            <span className="ps-info-value" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              les consultations du jour
            </span>
          </div>
        </div>

        {/* Context Tip */}
        <div className={`ps-context-tip ${tipClass}`}>
          <span className="material-symbols-rounded">{tipIcon}</span>
          {tipText}
        </div>

        {/* Notification Prompt */}
        {!notifEnabled && (
          <PSNotifPrompt phase={phase} isEnabled={notifEnabled} onClick={onNotifClick} />
        )}

        {/* Absent Button */}
        <PSAbsentButton isAbsent={isAbsent} onToggle={onAbsentClick} />
      </div>
    );
  }

  // ─── Ready Phase ───
  if (phase === 'ready') {
    const avgDisplay = avgConsultMins ? `~${avgConsultMins} min` : '~17 min';
    const estimateDisplay = estimatedMins >= 60
      ? `~${Math.floor(estimatedMins / 60)}h${(estimatedMins % 60).toString().padStart(2, '0')}`
      : `~${estimatedMins} min`;

    // At position #2 vs #3
    const isUrgent = peopleAhead === 2;
    const tipIcon = isUrgent ? 'warning' : 'location_on';
    const tipText = isUrgent
      ? "Ne vous éloignez pas — c'est bientôt à vous"
      : "Restez dans la salle d'attente";
    const tipClass = isUrgent ? 'tip-warning' : 'tip-stay';

    return (
      <div className="ps-info-area ps-fade-up-d3">
        {/* Info Card */}
        <div className="ps-info-card phase-ready">
          <div className="ps-info-row">
            <span className="ps-info-label">
              {isUrgent ? 'Encore' : 'Personnes devant vous'}
            </span>
            <span className="ps-info-value phase-ready">
              {isUrgent ? `${peopleAhead} patients` : String(peopleAhead)}
            </span>
          </div>
          <div className="ps-info-row">
            <span className="ps-info-label">
              {isUrgent ? 'Estimation' : 'Durée moy. par patient'}
            </span>
            <span className="ps-info-value phase-ready">
              {isUrgent ? estimateDisplay : avgDisplay}
            </span>
          </div>
        </div>

        {/* Context Tip */}
        <div className={`ps-context-tip ${tipClass}`}>
          <span className="material-symbols-rounded">{tipIcon}</span>
          {tipText}
        </div>

        {/* Notification confirmed state */}
        {notifEnabled && (
          <PSNotifPrompt phase={phase} isEnabled={notifEnabled} onClick={onNotifClick} />
        )}
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
          Restez devant la porte du cabinet
        </div>
      </div>
    );
  }

  return null;
}
