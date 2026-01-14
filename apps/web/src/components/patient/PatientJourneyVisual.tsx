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
  const peopleAhead = Math.max(0, displayPosition - 1);
  const maxChairsToShow = 4;
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

  return (
    <div className={`${styles.containerBg} backdrop-blur rounded-2xl p-4 sm:p-6`}>
      {/* Journey visualization */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
        {/* Patient's position (highlighted) */}
        <div className="relative flex flex-col items-center">
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

        {/* Path to chairs/door */}
        {(visibleChairs > 0 || queueState === 'next' || queueState === 'yourTurn') && (
          <div className={`w-4 sm:w-6 border-t-2 border-dashed ${styles.pathColor}`} />
        )}

        {/* Chairs (people ahead) */}
        {visibleChairs > 0 && (
          <>
            {Array.from({ length: visibleChairs }).map((_, index) => (
              <div key={`chair-${index}`} className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white/50">
                  <span
                    className={`material-symbols-outlined text-xl sm:text-2xl ${styles.chairColor}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    event_seat
                  </span>
                </div>
              </div>
            ))}

            {/* Overflow indicator */}
            {hasOverflow && (
              <div className={`flex items-center justify-center text-sm font-medium ${styles.chairColor}`}>
                +{peopleAhead - maxChairsToShow}
              </div>
            )}

            {/* Path to door */}
            <div className={`w-4 sm:w-6 border-t-2 border-dashed ${styles.pathColor}`} />
          </>
        )}

        {/* Doctor's door (destination) */}
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl ${queueState === 'yourTurn' ? 'bg-green-200' : 'bg-gray-100'}`}>
            <span
              className={`material-symbols-outlined text-2xl sm:text-3xl ${styles.doorColor}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              {queueState === 'yourTurn' ? 'door_open' : 'door_front'}
            </span>
          </div>
          <span className={`text-xs mt-1 ${styles.textColor} opacity-70`}>
            {queueState === 'yourTurn' ? '' : ''}
          </span>
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
