import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useSocket } from '@/hooks/useSocket';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Confetti from '@/components/ui/Confetti';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import TicketCard, { type TicketColorScheme } from '@/components/patient/TicketCard';
import PatientJourneyVisual from '@/components/patient/PatientJourneyVisual';
import FunFactCard from '@/components/patient/FunFactCard';
import type { QueueEntry } from '@/types';

// Queue state types based on patient's journey
type QueueState = 'far' | 'closer' | 'almost' | 'next' | 'yourTurn' | 'completed' | 'cancelled';

// Calculate display position (backend position - 1, since IN_CONSULTATION is position 0)
// When doctor is absent, the IN_CONSULTATION slot is "empty" so everyone moves up
function getDisplayPosition(backendPosition: number, status: string, isDoctorPresent: boolean = true): number {
  if (status === 'IN_CONSULTATION') return 0; // Not really in queue anymore
  // When doctor is present: NOTIFIED (backend #2) becomes display #1
  // When doctor is absent: No one is in consultation, so backend position = display position
  if (isDoctorPresent) {
    return backendPosition - 1;
  }
  // Doctor absent - display the actual queue position
  return backendPosition;
}

// Determine queue state based on position and status
// Note: position here is backend position (1 = IN_CONSULTATION, 2 = NOTIFIED, 3+ = WAITING)
function getQueueState(position: number, status: string): QueueState {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'cancelled';
  if (status === 'IN_CONSULTATION') return 'yourTurn';
  if (status === 'NOTIFIED') return 'next';  // Display position #1
  if (position === 3) return 'almost';       // Display position #2 - only 1 waiting ahead
  if (position === 4) return 'closer';       // Display position #3
  return 'far';
}

// Map queue state to ticket color scheme
function getTicketColorScheme(state: QueueState): TicketColorScheme {
  switch (state) {
    case 'almost': return 'amber';
    case 'next': return 'green';
    case 'closer': return 'teal';
    default: return 'calm';
  }
}

// State-based styling configuration
const stateConfig: Record<QueueState, {
  bg: string;
  card: string;
  accent: string;
  icon: string;
  animate: string;
}> = {
  far: {
    bg: 'bg-gradient-to-br from-primary-50 to-teal-50',
    card: 'bg-white border border-gray-200',
    accent: 'text-primary-600',
    icon: 'schedule',
    animate: ''
  },
  closer: {
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    card: 'bg-white border border-teal-200',
    accent: 'text-teal-600',
    icon: 'directions_walk',
    animate: ''
  },
  almost: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    card: 'bg-amber-100 border-2 border-amber-400',
    accent: 'text-amber-700',
    icon: 'priority_high',
    animate: ''
  },
  next: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    card: 'bg-green-100 border-2 border-green-400',
    accent: 'text-green-700',
    icon: 'arrow_forward',
    animate: ''
  },
  yourTurn: {
    bg: 'bg-gradient-to-br from-green-100 to-emerald-100',
    card: 'bg-green-200 border-2 border-green-500',
    accent: 'text-green-800',
    icon: 'celebration',
    animate: 'animate-celebrate'
  },
  completed: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    card: 'bg-white border border-gray-200',
    accent: 'text-gray-600',
    icon: 'check_circle',
    animate: ''
  },
  cancelled: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    card: 'bg-gray-100 border border-gray-300',
    accent: 'text-gray-500',
    icon: 'cancel',
    animate: ''
  }
};

export default function PatientStatusPage() {
  const { t } = useTranslation();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDoctorPresent, setIsDoctorPresent] = useState(true); // Default to true until we know
  const [positionToast, setPositionToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const previousPositionRef = useRef<number | null>(null);

  // Helper to get personalized translation (uses Named variant if name exists)
  // Supports passing additional interpolation params
  const tPersonal = (key: string, params: Record<string, unknown> = {}): string => {
    const name = entry?.patientName;
    if (name) {
      // Try the Named version first (e.g., "patient.yourTurnNowNamed")
      const namedKey = `${key}Named`;
      const namedResult = t(namedKey, { name, ...params });
      // If the Named key exists and was translated, use it
      if (namedResult !== namedKey) {
        return String(namedResult);
      }
    }
    // Fall back to regular key
    return String(t(key, params));
  };

  // Memoize callbacks to prevent re-renders
  const handlePatientCalled = useCallback((data: { position: number; status: string }) => {
    setEntry((prev) => {
      const newEntry = prev ? { ...prev, status: data.status as any, position: data.position } : null;
      // Trigger confetti when status changes to IN_CONSULTATION
      if (data.status === 'IN_CONSULTATION' && prev?.status !== 'IN_CONSULTATION') {
        setShowConfetti(true);
      }
      return newEntry;
    });
  }, []);

  const handlePositionChanged = useCallback((data: { entryId: string; newPosition: number; estimatedWait: number }) => {
    setEntry((prev) => {
      if (prev && data.entryId === prev.id) {
        const oldPosition = previousPositionRef.current;
        const newPosition = data.newPosition;

        // Show toast notification if position improved (lower number = better)
        if (oldPosition !== null && newPosition < oldPosition) {
          const positionsMoved = oldPosition - newPosition;
          const message = positionsMoved === 1
            ? t('patient.movedUpOne')
            : t('patient.movedUpMultiple', { count: positionsMoved });
          setPositionToast({ visible: true, message });
        }

        // Update ref for next comparison
        previousPositionRef.current = newPosition;

        return { ...prev, position: newPosition };
      }
      return prev;
    });
  }, [t]);

  const handleDoctorPresence = useCallback((data: { clinicId: string; isDoctorPresent: boolean }) => {
    // Only update if it's for our clinic
    if (entry?.clinicId === data.clinicId || !entry) {
      setIsDoctorPresent(data.isDoctorPresent);
    }
  }, [entry?.clinicId]);

  const { joinPatientRoom } = useSocket({
    onPatientCalled: handlePatientCalled,
    onPositionChanged: handlePositionChanged,
    onDoctorPresence: handleDoctorPresence,
  });

  // Fetch patient status only once when entryId changes
  useEffect(() => {
    const fetchPatientStatus = async () => {
      if (!entryId) return;

      setIsLoading(true);
      try {
        const data = await api.getPatientStatus(entryId);
        setEntry(data);
        // Initialize previous position ref for tracking changes
        previousPositionRef.current = data.position;
        // Set doctor presence from the response
        if ((data as any).isDoctorPresent !== undefined) {
          setIsDoctorPresent((data as any).isDoctorPresent);
        }
        // Show confetti if already in consultation when page loads
        if (data.status === 'IN_CONSULTATION') {
          setShowConfetti(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load patient status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientStatus();
  }, [entryId]);

  // Join patient room separately after socket is ready
  useEffect(() => {
    if (entryId) {
      joinPatientRoom(entryId);
    }
  }, [entryId, joinPatientRoom]);

  // Handle leaving the queue
  const handleLeaveQueue = async () => {
    if (!entryId) return;

    setIsLeaving(true);
    try {
      await api.leaveQueue(entryId);
      // The socket will update the status, but we can also force a refresh
      setIsLeaveModalOpen(false);
    } catch (err: any) {
      logger.error('Failed to leave queue:', err);
      // Still close modal - socket update will show correct state
      setIsLeaveModalOpen(false);
    } finally {
      setIsLeaving(false);
    }
  };

  // Can leave queue in these states
  const canLeaveQueue = entry && ['far', 'closer', 'almost', 'next', 'yourTurn'].includes(
    getQueueState(entry.position, entry.status)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">error_outline</span>
          <p className="text-red-600">{error || 'Patient not found'}</p>
        </div>
      </div>
    );
  }

  const queueState = getQueueState(entry.position, entry.status);
  const config = stateConfig[queueState];
  const displayPosition = getDisplayPosition(entry.position, entry.status, isDoctorPresent);
  // waitingAhead available for future use: getPatientsWaitingAhead(displayPosition)

  // Determine if we should show the ticket card
  const showTicket = ['far', 'closer', 'almost', 'next'].includes(queueState);

  return (
    <div className={`min-h-screen ${config.bg} flex items-center justify-center px-6 py-4 sm:p-4 relative`}>
      {/* Confetti animation for "Your Turn" */}
      {showConfetti && queueState === 'yourTurn' && <Confetti duration={4000} pieces={60} />}

      {/* Language Switcher - Fixed position top corner */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-40">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full space-y-4">

        {/* Doctor Absent Banner */}
        {!isDoctorPresent && queueState !== 'completed' && queueState !== 'cancelled' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-800">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span className="text-sm font-medium">
                {t('patient.doctorNotYetArrived') || 'Le médecin n\'est pas encore arrivé'}
              </span>
            </div>
          </div>
        )}

        {/* Title/Status Header */}
        <div className="text-center mb-2">
          {queueState === 'yourTurn' && (
            <h1 className={`text-2xl font-bold ${config.accent} mb-1`}>
              {tPersonal('patient.yourTurnNow')}
            </h1>
          )}
          {queueState === 'next' && (
            <h1 className={`text-2xl font-bold ${config.accent} mb-1`}>
              {tPersonal('patient.youAreNext')}
            </h1>
          )}
          {queueState === 'almost' && (
            <h1 className={`text-xl font-bold ${config.accent} mb-1`}>
              {tPersonal('patient.urgentAlmost')}
            </h1>
          )}
          {queueState === 'closer' && (
            <h1 className={`text-xl font-bold ${config.accent} mb-1`}>
              {tPersonal('patient.gettingCloser')}
            </h1>
          )}
          {queueState === 'far' && (
            <h1 className={`text-xl font-bold text-gray-800 mb-1`}>
              {tPersonal('patient.inTheSaf')}
            </h1>
          )}
          {queueState === 'completed' && (
            <h1 className={`text-2xl font-bold ${config.accent} mb-1`}>
              {tPersonal('patient.thankYou')}
            </h1>
          )}
          {queueState === 'cancelled' && (
            <h1 className={`text-xl font-bold ${config.accent} mb-1`}>
              {entry.status === 'NO_SHOW'
                ? tPersonal('patient.noShow')
                : tPersonal('patient.leftQueue')
              }
            </h1>
          )}
        </div>

        {/* Visual Journey - shows patient's progress through queue */}
        {showTicket && (
          <PatientJourneyVisual
            displayPosition={displayPosition}
            queueState={queueState as 'far' | 'closer' | 'almost' | 'next' | 'yourTurn'}
            patientName={entry.patientName || undefined}
          />
        )}

        {/* Ticket Card - for active queue states */}
        {showTicket && (
          <TicketCard
            position={displayPosition}
            colorScheme={getTicketColorScheme(queueState)}
            animate={queueState === 'almost'}
          />
        )}

        {/* Appointment Time Indicator - if patient has scheduled appointment */}
        {showTicket && (entry as any).appointmentTime && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-800">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span className="font-medium">{t('patient.yourAppointment') || 'Your appointment'}:</span>
              <span className="font-bold">
                {new Date((entry as any).appointmentTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Your Turn Card */}
        {queueState === 'yourTurn' && (
          <>
            {/* Visual Journey for yourTurn - patient at door */}
            <PatientJourneyVisual
              displayPosition={0}
              queueState="yourTurn"
              patientName={entry.patientName || undefined}
            />

            <div className={`${config.card} rounded-2xl shadow-lg p-8 ${config.animate}`}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-300 mb-4">
                  <span
                    className="material-symbols-outlined text-5xl text-green-800"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
                  >
                    celebration
                  </span>
                </div>
                <p className="text-green-700 text-lg font-medium">
                  {tPersonal('patient.doctorWaiting')}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Completed Card */}
        {queueState === 'completed' && (
          <div className={`${config.card} rounded-2xl shadow-lg p-8`}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-600">check_circle</span>
              </div>
              <p className="text-gray-600">
                {tPersonal('patient.consultationComplete')}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled / Left Queue Card */}
        {queueState === 'cancelled' && (
          <div className={`${config.card} rounded-2xl shadow-lg p-8`}>
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-2">
                <span className="material-symbols-outlined text-4xl text-gray-500">
                  {entry.status === 'NO_SHOW' ? 'cancel' : 'exit_to_app'}
                </span>
              </div>

              {/* Message */}
              <p className="text-gray-600">
                {entry.status === 'NO_SHOW'
                  ? t('patient.noShow')
                  : t('patient.leftQueueMessage')
                }
              </p>

              {/* Rejoin Button - link to check-in page */}
              {(entry as any).clinicId && (
                <button
                  onClick={() => navigate(`/checkin/${(entry as any).clinicId}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  {t('patient.rejoinQueue')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Urgency Card for position #1 (next state) */}
        {queueState === 'next' && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-2xl text-green-600 flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                directions_run
              </span>
              <div>
                <p className="text-sm font-medium text-green-800 leading-relaxed">
                  {tPersonal('patient.urgentNextMessage')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fun Fact Card - eye-related fun facts for waiting patients (not shown when next) */}
        {showTicket && queueState !== 'next' && <FunFactCard />}

        {/* Leave Queue Button - only show in active queue states */}
        {canLeaveQueue && (
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-full py-3 px-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {t('patient.leaveQueue')}
          </button>
        )}

        {/* Auto-refresh indicator */}
        <p className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">sync</span>
          {t('patient.autoRefresh')}
        </p>
      </div>

      {/* Leave Queue Confirmation Modal */}
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveQueue}
        title={t('patient.confirmLeaveTitle')}
        message={t('patient.confirmLeaveMessage')}
        confirmText={t('patient.confirmLeaveButton')}
        cancelText={t('patient.cancelLeaveButton')}
        variant="danger"
        isLoading={isLeaving}
      />

      {/* Position Change Toast */}
      <Toast
        message={positionToast.message}
        type="success"
        isVisible={positionToast.visible}
        onClose={() => setPositionToast({ visible: false, message: '' })}
        duration={3000}
      />
    </div>
  );
}
