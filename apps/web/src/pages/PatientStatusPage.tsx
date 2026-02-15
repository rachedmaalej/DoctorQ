import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useSocket } from '@/hooks/useSocket';
import { formatTime } from '@/lib/time';
import { initAudioContext, playSoftChime, playMedicalChime, playBrightAlert, playPriorityAlarm } from '@/lib/sounds';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import { webBrand } from '@/lib/brand';
import JourneyTimeline from '@/components/patient/JourneyTimeline';
import type { PatientStatusResponse } from '@/types';
import { QueueStatus } from '@/types';

// Vibration helper - vibrates the device if supported
// pattern: single number (ms) or array for pattern [vibrate, pause, vibrate, ...]
function vibrate(pattern: number | number[] = 200): void {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Vibration not supported or failed - silently ignore
      logger.log('[Vibration] Not supported or failed:', e);
    }
  }
}

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

// Background color based on queue state
function getPageBg(state: QueueState): string {
  if (state === 'yourTurn') return 'bg-gradient-to-b from-green-50 to-white';
  if (state === 'completed') return 'bg-gray-50';
  if (state === 'cancelled') return 'bg-gray-50';
  return 'bg-white';
}

export default function PatientStatusPage() {
  const { t } = useTranslation();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<PatientStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDoctorPresent, setIsDoctorPresent] = useState(true); // Default to true until we know
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const lastAnnouncementRef = useRef<string | null>(null);
  const [doctorGender, setDoctorGender] = useState<string | null>(null);
  const [positionToast, setPositionToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const previousPositionRef = useRef<number | null>(null);
  const audioInitRef = useRef(false);

  // Initialize audio context on first user interaction (required for iOS)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioInitRef.current) {
        initAudioContext();
        audioInitRef.current = true;
      }
    };
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Gender context for i18next (undefined = default/masculine fallback)
  const genderContext = doctorGender === 'F' ? 'female' : undefined;

  // Helper to get personalized translation (uses Named variant if name exists)
  // Supports passing additional interpolation params + gender context
  const tPersonal = (key: string, params: Record<string, unknown> = {}): string => {
    const name = entry?.patientName;
    const allParams = { ...params, context: genderContext };
    if (name) {
      // Try the Named version first (e.g., "patient.yourTurnNowNamed")
      const namedKey = `${key}Named`;
      const namedResult = t(namedKey, { name, ...allParams });
      // If the Named key exists and was translated, use it
      if (namedResult !== namedKey) {
        return String(namedResult);
      }
    }
    // Fall back to regular key
    return String(t(key, allParams));
  };

  // Format wait time for hero display
  const formatWaitTime = (mins: number): string => {
    const m = Math.max(0, Math.round(mins));
    if (m < 5) return '< 5 min';
    if (m < 60) return `~${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `~${h}h` : `~${h}h ${rem}min`;
  };

  // Memoize callbacks to prevent re-renders
  const handlePatientCalled = useCallback((data: { position: number; status: string; estimatedWaitMins?: number }) => {
    logger.log('[PatientStatus] handlePatientCalled received:', data);
    setEntry((prev) => {
      if (!prev) return null;

      const status = data.status as QueueStatus;
      const newPosition = data.position;
      const oldPosition = previousPositionRef.current;

      logger.log('[PatientStatus] Updating entry - old position:', oldPosition, 'new position:', newPosition, 'status:', status);

      // Show toast notification if position improved (lower number = better)
      if (oldPosition !== null && newPosition < oldPosition && status !== QueueStatus.IN_CONSULTATION) {
        const positionsMoved = oldPosition - newPosition;
        const message = positionsMoved === 1
          ? t('patient.movedUpOne')
          : t('patient.movedUpMultiple', { count: positionsMoved });
        setPositionToast({ visible: true, message });

        // Sound + vibration based on new position
        if (status === QueueStatus.NOTIFIED) {
          // Position #1: Bright Alert + Firm Buzz vibration
          playBrightAlert();
          vibrate(400);
        } else if (newPosition === 3) {
          // Position #2 (backend 3): Medical Chime, no vibration
          playMedicalChime();
        } else {
          // Position >= 3 (backend >= 4): Soft Chime, no vibration
          playSoftChime();
        }
      }

      // Update ref for next comparison
      previousPositionRef.current = newPosition;

      // Patient's turn — play Priority Alarm + Priority Triple Buzz, twice
      if (status === QueueStatus.IN_CONSULTATION && prev.status !== QueueStatus.IN_CONSULTATION) {
        playPriorityAlarm();
        vibrate([300, 100, 300, 100, 400]);
        // Second round after 1.2 seconds
        setTimeout(() => {
          playPriorityAlarm();
          vibrate([300, 100, 300, 100, 400]);
        }, 1200);
      }

      return {
        ...prev,
        status,
        position: newPosition,
        ...(data.estimatedWaitMins !== undefined && { estimatedWaitMins: data.estimatedWaitMins }),
      };
    });
  }, [t]);

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

          // Sound + vibration based on new position
          if (newPosition <= 2) {
            // Position #1 (backend 2): Bright Alert + Firm Buzz
            playBrightAlert();
            vibrate(400);
          } else if (newPosition === 3) {
            // Position #2 (backend 3): Medical Chime, no vibration
            playMedicalChime();
          } else {
            // Position >= 3 (backend >= 4): Soft Chime, no vibration
            playSoftChime();
          }
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

  const handleAnnouncement = useCallback((data: { clinicId: string; announcement: string | null; announcementAt: string | null }) => {
    if (entry?.clinicId === data.clinicId || !entry) {
      // Reset dismissed state when a new/different announcement arrives
      if (data.announcement && data.announcement !== lastAnnouncementRef.current) {
        setAnnouncementDismissed(false);
      }
      lastAnnouncementRef.current = data.announcement;
      setAnnouncement(data.announcement);
    }
  }, [entry?.clinicId]);

  // Refetch patient status when room is (re)joined to sync state after reconnection
  const handlePatientRoomJoined = useCallback(async (data: { entryId: string; success: boolean }) => {
    if (!data.success || !data.entryId) return;
    logger.log('[PatientStatus] Room joined, refetching status for:', data.entryId);
    try {
      const freshData = await api.getPatientStatus(data.entryId);
      setEntry(freshData);
      previousPositionRef.current = freshData.position;
      if (freshData.isDoctorPresent !== undefined) {
        setIsDoctorPresent(freshData.isDoctorPresent);
      }
      if (freshData.doctorGender !== undefined) {
        setDoctorGender(freshData.doctorGender);
      }
      if (freshData.announcement !== undefined) {
        setAnnouncement(freshData.announcement);
      }
    } catch (err) {
      logger.error('[PatientStatus] Failed to refetch status on room join:', err);
    }
  }, []);

  const { joinPatientRoom } = useSocket({
    onPatientCalled: handlePatientCalled,
    onPositionChanged: handlePositionChanged,
    onDoctorPresence: handleDoctorPresence,
    onAnnouncement: handleAnnouncement,
    onPatientRoomJoined: handlePatientRoomJoined,
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
        if (data.isDoctorPresent !== undefined) {
          setIsDoctorPresent(data.isDoctorPresent);
        }
        if (data.doctorGender !== undefined) {
          setDoctorGender(data.doctorGender);
        }
        // Set announcement from the response
        if (data.announcement !== undefined) {
          setAnnouncement(data.announcement);
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
    if (!entryId || !entry?.clinicId) return;

    setIsLeaving(true);
    try {
      await api.leaveQueue(entryId);
      setIsLeaveModalOpen(false);
      // Redirect to check-in page so patient can rejoin if needed
      navigate(`/checkin/${entry.clinicId}`);
    } catch (err: any) {
      logger.error('Failed to leave queue:', err);
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
  const displayPosition = getDisplayPosition(entry.position, entry.status, isDoctorPresent);
  // Use backend position so peopleAhead includes the in-consultation patient
  // This keeps the count consistent with the wait estimate
  const peopleAhead = Math.max(0, entry.position - 1);
  const isActiveQueue = ['far', 'closer', 'almost', 'next'].includes(queueState);

  // Split-screen announcement overlay
  const showAnnouncementOverlay = !!announcement && !announcementDismissed
    && queueState !== 'completed' && queueState !== 'cancelled';

  return (
    <div className={`min-h-screen ${getPageBg(queueState)} flex flex-col relative`}>
      {/* Language Switcher - Fixed position top corner */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-40">
        <LanguageSwitcher />
      </div>

      {/* ═══ Header Bar ═══ */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          {entry.clinicName && (
            <h2 className="text-sm font-bold text-gray-800">{entry.clinicName}</h2>
          )}
          {entry.doctorName && (
            <p className="text-xs text-gray-500">{entry.doctorName}</p>
          )}
        </div>
        {isActiveQueue && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600">{t('patient.liveIndicator', 'En direct')}</span>
          </div>
        )}
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 px-5 pb-4">
        <div className="max-w-md mx-auto space-y-5">

          {/* Announcement Banners — preserved from original */}
          {showAnnouncementOverlay && !isDoctorPresent && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-[fadeIn_0.3s_ease-out_both]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span
                    className="material-symbols-outlined text-lg text-amber-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    schedule
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">
                    {entry.doctorName
                      ? t('patient.doctorAbsent', { doctorName: entry.doctorName, context: genderContext })
                      : t('patient.doctorNotYetArrived')}
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">{announcement}</p>
                </div>
                <button
                  onClick={() => setAnnouncementDismissed(true)}
                  className="flex-shrink-0 p-1 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
                  aria-label={t('announcement.dismiss', 'Compris')}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          )}

          {showAnnouncementOverlay && isDoctorPresent && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 animate-[fadeIn_0.3s_ease-out_both]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span
                    className="material-symbols-outlined text-lg text-teal-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    campaign
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-0.5">
                    {t('announcement.overlayTitle', 'Annonce du cabinet')}
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed">{announcement}</p>
                </div>
                <button
                  onClick={() => setAnnouncementDismissed(true)}
                  className="flex-shrink-0 p-1 rounded-lg text-teal-400 hover:text-teal-600 hover:bg-teal-100 transition-colors"
                  aria-label={t('announcement.dismiss', 'Compris')}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          )}

          {!isDoctorPresent && !showAnnouncementOverlay && queueState !== 'completed' && queueState !== 'cancelled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-800">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm font-medium">
                  {entry.doctorName
                    ? t('patient.doctorAbsent', { doctorName: entry.doctorName, context: genderContext })
                    : t('patient.doctorNotYetArrived')}
                </span>
              </div>
            </div>
          )}

          {/* ═══ Hero Section: Wait Time + People Ahead ═══ */}
          {isActiveQueue && (
            <div className="text-center py-4">
              {queueState !== 'next' && (
                <>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
                    {t('patient.estimatedWait')}
                  </p>
                  <p className="text-5xl font-black text-gray-900 leading-none">
                    {formatWaitTime(entry.estimatedWaitMins ?? 0)}
                  </p>
                </>
              )}
              {queueState === 'next' && (
                <h1 className="text-2xl font-bold text-green-700">
                  {tPersonal('patient.youAreNext')}
                </h1>
              )}
              {peopleAhead > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('patient.peopleAhead', { count: peopleAhead })}
                </p>
              )}
            </div>
          )}

          {/* yourTurn hero */}
          {queueState === 'yourTurn' && (
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold text-green-800">
                {tPersonal('patient.yourTurnNow')}
              </h1>
            </div>
          )}

          {/* completed hero */}
          {queueState === 'completed' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                <span className="material-symbols-outlined text-4xl text-gray-500">check_circle</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-700">
                {tPersonal('patient.thankYou')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {tPersonal('patient.consultationComplete')}
              </p>
            </div>
          )}

          {/* cancelled hero */}
          {queueState === 'cancelled' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-3">
                <span className="material-symbols-outlined text-4xl text-gray-500">
                  {entry.status === 'NO_SHOW' ? 'cancel' : 'exit_to_app'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-600">
                {entry.status === 'NO_SHOW'
                  ? tPersonal('patient.noShow')
                  : tPersonal('patient.leftQueue')
                }
              </h1>
            </div>
          )}

          {/* Appointment Time - shown above timeline if scheduled */}
          {isActiveQueue && entry.appointmentTime && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-purple-800">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="font-medium">{t('patient.yourAppointment') || 'Your appointment'}:</span>
                <span className="font-bold">{formatTime(entry.appointmentTime)}</span>
              </div>
            </div>
          )}

          {/* ═══ Journey Timeline ═══ */}
          <JourneyTimeline
            queueState={queueState}
            displayPosition={displayPosition}
            estimatedWaitMins={entry.estimatedWaitMins ?? 0}
            arrivedAt={entry.arrivedAt}
            isDoctorPresent={isDoctorPresent}
            patientName={entry.patientName || undefined}
            avgConsultationMins={entry.avgConsultationMins}
            appointmentTime={entry.appointmentTime}
            doctorName={entry.doctorName}
            genderContext={genderContext}
          />

          {/* Rejoin button for cancelled patients */}
          {queueState === 'cancelled' && entry.clinicId && (
            <div className="text-center">
              <button
                onClick={() => navigate(`/checkin/${entry.clinicId}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined">refresh</span>
                {t('patient.rejoinQueue')}
              </button>
            </div>
          )}

          {/* Leave Queue - understated link */}
          {canLeaveQueue && (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
              >
                {t('patient.leaveQueue')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom Bar ═══ */}
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {entry.clinicName || webBrand.name}
        </span>
        <span className="text-xs text-gray-300">
          {webBrand.name}
        </span>
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
