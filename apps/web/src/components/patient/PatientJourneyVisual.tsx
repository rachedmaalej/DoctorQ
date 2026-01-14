import { useTranslation } from 'react-i18next';

interface PatientJourneyVisualProps {
  /**
   * Display position in queue (1 = next, 2+ = waiting)
   */
  displayPosition: number;
  /**
   * Queue state: 'far' | 'closer' | 'almost' | 'next' | 'yourTurn'
   */
  queueState: 'far' | 'closer' | 'almost' | 'next' | 'yourTurn';
  /**
   * Patient name for personalization
   */
  patientName?: string;
}

/**
 * MD3-compliant visual representation of patient's journey through the queue.
 * Shows chairs representing people ahead, and highlights the patient's current position.
 *
 * Visual metaphor:
 * - Occupied chairs = people ahead in queue
 * - Highlighted chair = current patient's position
 * - Door icon = doctor's office (destination)
 *
 * Uses Material Symbols icons only (no emojis).
 */
export default function PatientJourneyVisual({
  displayPosition,
  queueState,
  patientName,
}: PatientJourneyVisualProps) {
  const { t } = useTranslation();

  // Calculate how many chairs to show (people ahead)
  // On mobile, show fewer chairs to prevent overflow
  const peopleAhead = Math.max(0, displayPosition - 1);
  const maxChairsToShow = 3; // Reduced from 4 to fit mobile screens
  const visibleChairs = Math.min(peopleAhead, maxChairsToShow);
  const hasOverflow = peopleAhead > maxChairsToShow;

  // State-based styling
  const stateStyles = {
    far: {
      containerBg: 'bg-white/80',
      patientBg: 'bg-primary-100',
      patientIcon: 'text-primary-600',
      patientRing: 'ring-primary-300',
      chairColor: 'text-primary-400',
      doorColor: 'text-gray-400',
      pathColor: 'border-gray-200',
      textColor: 'text-gray-600',
    },
    closer: {
      containerBg: 'bg-white/80',
      patientBg: 'bg-teal-100',
      patientIcon: 'text-teal-600',
      patientRing: 'ring-teal-300',
      chairColor: 'text-teal-400',
      doorColor: 'text-gray-400',
      pathColor: 'border-teal-200',
      textColor: 'text-teal-700',
    },
    almost: {
      containerBg: 'bg-amber-50/80',
      patientBg: 'bg-amber-200',
      patientIcon: 'text-amber-700',
      patientRing: 'ring-amber-400',
      chairColor: 'text-amber-500',
      doorColor: 'text-amber-600',
      pathColor: 'border-amber-300',
      textColor: 'text-amber-700',
    },
    next: {
      containerBg: 'bg-green-50/80',
      patientBg: 'bg-green-200',
      patientIcon: 'text-green-700',
      patientRing: 'ring-green-400',
      chairColor: 'text-green-500',
      doorColor: 'text-green-600',
      pathColor: 'border-green-300',
      textColor: 'text-green-700',
    },
    yourTurn: {
      containerBg: 'bg-green-100/80',
      patientBg: 'bg-green-300',
      patientIcon: 'text-green-800',
      patientRing: 'ring-green-500',
      chairColor: 'text-green-500',
      doorColor: 'text-green-700',
      pathColor: 'border-green-400',
      textColor: 'text-green-800',
    },
  };

  const styles = stateStyles[queueState];
  const showPulse = queueState === 'almost' || queueState === 'next' || queueState === 'yourTurn';

  // Calculate gap between icons based on position (closer as position decreases)
  // Position 4+: full width, Position 3: 85%, Position 2: 65%, Position 1: 45%
  const getContainerWidth = () => {
    if (displayPosition >= 4) return '100%';
    if (displayPosition === 3) return '85%';
    if (displayPosition === 2) return '65%';
    return '45%'; // Position 1 or yourTurn
  };

  return (
    <div className={`${styles.containerBg} backdrop-blur rounded-2xl p-4 sm:p-6 overflow-hidden`}>
      {/* Journey visualization - centered with dynamic width */}
      <div className="flex flex-col items-center mb-4">
        <div
          className="flex items-start justify-between transition-all duration-500 ease-out"
          style={{ width: getContainerWidth() }}
        >
          {/* Left: Patient's position (highlighted) */}
          <div className="relative flex flex-col items-center flex-shrink-0">
            {/* Pulsing effect for urgent states */}
            {showPulse && (
              <div
                className={`absolute inset-0 rounded-xl ${styles.patientRing} ring-2 animate-ping opacity-30`}
                style={{ animationDuration: '1.5s' }}
              />
            )}
            <div
              className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${styles.patientBg} ring-2 ${styles.patientRing}`}
            >
              <span
                className={`material-symbols-outlined text-2xl sm:text-3xl ${styles.patientIcon}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                person
              </span>
            </div>
            <span className={`text-xs mt-1 font-medium ${styles.textColor}`}>
              {patientName ? patientName.split(' ')[0] : t('checkin.yourSpotLabel')}
            </span>
          </div>

          {/* Center: Chairs (people ahead) - aligned with icon boxes */}
          {visibleChairs > 0 && (
            <div className="flex items-center h-12 sm:h-14">
              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: visibleChairs }).map((_, index) => (
                  <span
                    key={`chair-${index}`}
                    className={`material-symbols-outlined text-2xl sm:text-3xl ${styles.chairColor}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    event_seat
                  </span>
                ))}
              </div>

              {/* Overflow indicator */}
              {hasOverflow && (
                <span className={`text-base font-semibold ${styles.chairColor} ml-2`}>
                  +{peopleAhead - maxChairsToShow}
                </span>
              )}
            </div>
          )}

          {/* Right: Doctor's door (destination) */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl ${queueState === 'yourTurn' ? 'bg-green-200' : 'bg-gray-100'}`}>
              <span
                className={`material-symbols-outlined text-2xl sm:text-3xl ${styles.doorColor}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {queueState === 'yourTurn' ? 'door_open' : 'door_front'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend/Status text */}
      <div className={`text-center text-sm ${styles.textColor}`}>
        {queueState === 'far' && peopleAhead > 0 && (
          <span>{t('patient.patientsWaitingAhead', { count: peopleAhead })}</span>
        )}
        {queueState === 'closer' && (
          <span>{t('patient.patientsAhead', { count: peopleAhead })}</span>
        )}
        {queueState === 'almost' && (
          <span className="font-semibold">{t('patient.onlyOnePerson')}</span>
        )}
        {queueState === 'next' && (
          <span className="font-semibold">{t('patient.goToReception')}</span>
        )}
        {queueState === 'yourTurn' && (
          <span className="font-bold">{t('patient.enterOffice')}</span>
        )}
      </div>
    </div>
  );
}
