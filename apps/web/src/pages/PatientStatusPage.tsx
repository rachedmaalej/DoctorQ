import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Confetti from '@/components/ui/Confetti';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TicketCard, { type TicketColorScheme } from '@/components/patient/TicketCard';
import PatientJourneyVisual from '@/components/patient/PatientJourneyVisual';
import type { QueueEntry } from '@/types';

// Queue state types based on patient's journey
type QueueState = 'far' | 'closer' | 'almost' | 'next' | 'yourTurn' | 'completed' | 'cancelled';

// Calculate display position (backend position - 1, since IN_CONSULTATION is position 0)
function getDisplayPosition(backendPosition: number, status: string): number {
  if (status === 'IN_CONSULTATION') return 0; // Not really in queue anymore
  return backendPosition - 1; // NOTIFIED (backend #2) becomes display #1, etc.
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

// Calculate patients waiting ahead (based on display position)
// Display position 1 = next (0 waiting ahead)
// Display position 2 = 1 waiting ahead
// Display position 3+ = displayPosition - 1 waiting ahead
function getPatientsWaitingAhead(displayPosition: number): number {
  if (displayPosition <= 1) return 0;
  return displayPosition - 1;
}

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

  // Helper to get personalized translation (uses Named variant if name exists)
  // Supports passing additional interpolation params
  const tPersonal = (key: string, params: Record<string, any> = {}) => {
    const name = entry?.patientName;
    if (name) {
      // Try the Named version first (e.g., "patient.yourTurnNowNamed")
      const namedKey = `${key}Named`;
      const namedResult = t(namedKey, { name, ...params });
      // If the Named key exists and was translated, use it
      if (namedResult !== namedKey) {
        return namedResult;
      }
    }
    // Fall back to regular key
    return t(key, params);
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
        return { ...prev, position: data.newPosition };
      }
      return prev;
    });
  }, []);

  const { joinPatientRoom } = useSocket({
    onPatientCalled: handlePatientCalled,
    onPositionChanged: handlePositionChanged,
  });

  // Fetch patient status only once when entryId changes
  useEffect(() => {
    const fetchPatientStatus = async () => {
      if (!entryId) return;

      setIsLoading(true);
      try {
        const data = await api.getPatientStatus(entryId);
        setEntry(data);
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
      console.error('Failed to leave queue:', err);
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
  const displayPosition = getDisplayPosition(entry.position, entry.status);
  const waitingAhead = getPatientsWaitingAhead(displayPosition);

  // Determine if we should show the ticket card
  const showTicket = ['far', 'closer', 'almost', 'next'].includes(queueState);

  return (
    <div className={`min-h-screen ${config.bg} flex items-center justify-center p-4 relative`}>
      {/* Confetti animation for "Your Turn" */}
      {showConfetti && queueState === 'yourTurn' && <Confetti duration={4000} pieces={60} />}

      {/* Language Switcher - Fixed position top corner */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-40">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full space-y-4">

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
                <p className="text-green-700 text-lg font-medium mb-2">
                  {tPersonal('patient.doctorWaiting')}
                </p>
                <p className="text-green-600">
                  {tPersonal('patient.enterOffice')}
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

        {/* Message Card - contextual guidance */}
        {queueState === 'next' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
              <span className="material-symbols-outlined">arrow_forward</span>
              {t('patient.goToReception')}
            </div>
          </div>
        )}

        {queueState === 'almost' && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-medium mb-1">
              <span className="material-symbols-outlined">warning</span>
              {t('patient.onlyOnePerson')}
            </div>
            <p className="text-amber-700 text-sm">
              {t('patient.headToClinic')}
            </p>
          </div>
        )}

        {queueState === 'closer' && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
            <p className="text-teal-700">
              {t('patient.stayNearby')}
            </p>
          </div>
        )}

        {queueState === 'far' && (
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-gray-600">
              {tPersonal('patient.watchingYourTurn')}
            </p>
          </div>
        )}

        {/* Progress Indicator */}
        {queueState !== 'completed' && queueState !== 'cancelled' && queueState !== 'yourTurn' && (
          <div className="bg-white/60 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{t('patient.waitingInQueue')}</span>
              <span>#{displayPosition}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  queueState === 'almost' ? 'bg-amber-500' :
                  queueState === 'next' ? 'bg-green-500' :
                  queueState === 'closer' ? 'bg-teal-500' :
                  'bg-primary-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(10, 100 - (displayPosition - 1) * 15))}%`
                }}
              />
            </div>
          </div>
        )}

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
    </div>
  );
}
