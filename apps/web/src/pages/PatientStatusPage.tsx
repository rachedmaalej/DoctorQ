import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useSocket } from '@/hooks/useSocket';
import { initAudioContext, playSoftChime, playMedicalChime, playBrightAlert, playPriorityAlarm } from '@/lib/sounds';

import type { PatientStatusResponse } from '@/types';
import { QueueStatus } from '@/types';

// Patient Status redesign components
import '@/components/patient-status/patient-status.css';
import { derivePhase, deriveToastMessage, smoothEstimate } from '@/components/patient-status/utils';
import type { Phase } from '@/components/patient-status/utils';
import PSHeader from '@/components/patient-status/PSHeader';
import PSAlertBanner from '@/components/patient-status/PSAlertBanner';
import PSRdvContext from '@/components/patient-status/PSRdvContext';
import PSHeroEstimate from '@/components/patient-status/PSHeroEstimate';
import PSCalledHero from '@/components/patient-status/PSCalledHero';
import PSDoneHero from '@/components/patient-status/PSDoneHero';
import PSContextCard from '@/components/patient-status/PSContextCard';
import PSVisitSummary from '@/components/patient-status/PSVisitSummary';
import PSManageFooter from '@/components/patient-status/PSManageFooter';
import PSBrandFooter from '@/components/patient-status/PSBrandFooter';
import PSProgressToast from '@/components/patient-status/PSProgressToast';
import PSQuitModal from '@/components/patient-status/PSQuitModal';

// Vibration helper
function vibrate(pattern: number | number[] = 200): void {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      logger.log('[Vibration] Not supported or failed:', e);
    }
  }
}

export default function PatientStatusPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();

  // ─── Core State ───
  const [entry, setEntry] = useState<PatientStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── UI State ───
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDoctorPresent, setIsDoctorPresent] = useState(true);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isAbsent, setIsAbsent] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // ─── Refs ───
  const previousPositionRef = useRef<number | null>(null);
  const displayedEstimateRef = useRef<number | null>(null);
  const initialPeopleAheadRef = useRef<number>(0);
  const audioInitRef = useRef(false);
  const lastAnnouncementRef = useRef<string | null>(null);

  // ─── Stable Callbacks ───
  const hideToast = useCallback(() => setToast({ visible: false, message: '' }), []);

  // ─── Audio Context Init (iOS) ───
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

  // ─── Screen Wake Lock (keeps screen on while patient waits) ───
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let active = true;

    const requestWakeLock = async () => {
      if (!active || !('wakeLock' in navigator)) return;
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
        logger.log('[WakeLock] Acquired');
      } catch {
        // Silently fail — low battery or unsupported
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        // Re-fetch queue position in case we missed Socket.io events while backgrounded
        if (entryId) {
          api.getPatientStatus(entryId).then((data) => {
            setEntry(data);
            previousPositionRef.current = data.position;
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestWakeLock();

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLock?.release().catch(() => {});
    };
  }, [entryId]);

  // ─── Socket Handlers ───

  const handlePatientCalled = useCallback((data: { position: number; status: string; estimatedWaitMins?: number }) => {
    logger.log('[PatientStatus] handlePatientCalled received:', data);
    setEntry((prev) => {
      if (!prev) return null;

      const status = data.status as QueueStatus;
      const newPosition = data.position;
      const oldPosition = previousPositionRef.current;
      const peopleAhead = Math.max(0, newPosition - 1);

      // Show toast + sound if position improved
      if (oldPosition !== null && newPosition < oldPosition && status !== QueueStatus.IN_CONSULTATION) {
        const toastMsg = deriveToastMessage(peopleAhead);
        if (toastMsg) {
          setToast({ visible: true, message: toastMsg });
        }

        // Sound + vibration based on new position
        if (status === QueueStatus.NOTIFIED) {
          playBrightAlert();
          vibrate(400);
        } else if (newPosition === 3) {
          playMedicalChime();
        } else {
          playSoftChime();
        }
      }

      previousPositionRef.current = newPosition;

      // Patient called — Priority Alarm × 2
      if (status === QueueStatus.IN_CONSULTATION && prev.status !== QueueStatus.IN_CONSULTATION) {
        playPriorityAlarm();
        vibrate([300, 100, 300, 100, 400]);
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
  }, []);

  const handlePositionChanged = useCallback((data: { entryId: string; newPosition: number; estimatedWait: number }) => {
    setEntry((prev) => {
      if (prev && data.entryId === prev.id) {
        const oldPosition = previousPositionRef.current;
        const newPosition = data.newPosition;
        const peopleAhead = Math.max(0, newPosition - 1);

        if (oldPosition !== null && newPosition < oldPosition) {
          const toastMsg = deriveToastMessage(peopleAhead);
          if (toastMsg) {
            setToast({ visible: true, message: toastMsg });
          }

          if (newPosition <= 2) {
            playBrightAlert();
            vibrate(400);
          } else if (newPosition === 3) {
            playMedicalChime();
          } else {
            playSoftChime();
          }
        }

        previousPositionRef.current = newPosition;
        return { ...prev, position: newPosition };
      }
      return prev;
    });
  }, []);

  const handleDoctorPresence = useCallback((data: { clinicId: string; isDoctorPresent: boolean }) => {
    if (entry?.clinicId === data.clinicId || !entry) {
      setIsDoctorPresent(data.isDoctorPresent);
    }
  }, [entry?.clinicId]);

  const handleAnnouncement = useCallback((data: { clinicId: string; announcement: string | null; announcementAt: string | null }) => {
    if (entry?.clinicId === data.clinicId || !entry) {
      lastAnnouncementRef.current = data.announcement;
      setAnnouncement(data.announcement);
    }
  }, [entry?.clinicId]);

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

  // ─── Initial Fetch ───
  useEffect(() => {
    const fetchPatientStatus = async () => {
      if (!entryId) return;
      setIsLoading(true);
      try {
        const data = await api.getPatientStatus(entryId);
        setEntry(data);
        previousPositionRef.current = data.position;
        displayedEstimateRef.current = data.estimatedWaitMins ?? null;
        // Capture initial position for ring progress calculation
        const initialAhead = Math.max(0, data.position - 1);
        if (initialPeopleAheadRef.current === 0 && initialAhead > 0) {
          initialPeopleAheadRef.current = initialAhead;
        }
        if (data.isDoctorPresent !== undefined) setIsDoctorPresent(data.isDoctorPresent);
        if (data.announcement !== undefined) setAnnouncement(data.announcement);
      } catch (err: any) {
        setError(err.message || 'Failed to load patient status');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatientStatus();
  }, [entryId]);

  // ─── Join Socket Room ───
  useEffect(() => {
    if (entryId) joinPatientRoom(entryId);
  }, [entryId, joinPatientRoom]);

  // ─── Leave Queue ───
  const handleLeaveQueue = async () => {
    if (!entryId || !entry?.clinicId) return;
    setIsLeaving(true);
    try {
      await api.leaveQueue(entryId);
      setIsQuitModalOpen(false);
      navigate(`/checkin/${entry.clinicId}`);
    } catch (err: any) {
      logger.error('Failed to leave queue:', err);
      setIsQuitModalOpen(false);
    } finally {
      setIsLeaving(false);
    }
  };

  // ─── "J'arrive!" handler ───
  const handleArrive = () => {
    // Future: POST /api/patient/:entryId/arrive
    logger.log('[PatientStatus] Patient confirmed arrival');
  };

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="ps-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--border, #E8E6DF)',
              borderTopColor: 'var(--relax-accent, #2B8A7A)',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !entry) {
    return (
      <div className="ps-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--red)', fontSize: 15 }}>{error || 'Patient introuvable'}</p>
        </div>
      </div>
    );
  }

  // ─── Derived State ───
  const peopleAhead = Math.max(0, entry.position - 1);
  const phase: Phase = derivePhase(entry.status, peopleAhead);
  const isCalled = entry.status === QueueStatus.IN_CONSULTATION;
  const isWaiting = phase === 'relax' || phase === 'ready';
  const isGo = phase === 'go';

  // Estimate smoothing
  const rawEstimate = entry.estimatedWaitMins ?? 0;
  const smoothedEstimate = smoothEstimate(rawEstimate, displayedEstimateRef.current);
  displayedEstimateRef.current = smoothedEstimate;

  // Initial people ahead (for ring progress)
  const initialPeopleAhead = initialPeopleAheadRef.current || peopleAhead;

  // RDV context: visible in relax phase when patient has appointment
  const showRdv = !!entry.appointmentTime && phase === 'relax';
  const appointmentDelayMins = entry.estimatedWaitMins ? Math.round(entry.estimatedWaitMins) : undefined;

  // Alert banner: visible when doctor is absent and patient is waiting
  const showAlert = !isDoctorPresent && (isWaiting || isGo);

  // Cancelled state (NO_SHOW, CANCELLED)
  const isCancelled = entry.status === 'CANCELLED' || entry.status === 'NO_SHOW';

  return (
    <div className="ps-page">
      {/* Layer 1: Mood Background */}
      <div className={`ps-mood-bg phase-${phase}`} />

      {/* Layer 2: Content */}
      <div className="ps-content">
        {/* Header */}
        <PSHeader
          clinicName={entry.clinicName}
          specialty={entry.specialty || undefined}
          isDoctorPresent={isDoctorPresent}
        />

        {/* Alert Banner (doctor absence) */}
        <PSAlertBanner
          visible={showAlert}
          announcement={announcement}
          isDoctorPresent={isDoctorPresent}
        />

        {/* RDV Context Bar */}
        <PSRdvContext
          visible={showRdv}
          appointmentTime={entry.appointmentTime}
          delayMinutes={appointmentDelayMins}
        />

        {/* Hero Section — mutually exclusive */}

        {/* Relax/Ready: time estimate + progress ring */}
        {isWaiting && !isCancelled && (
          <PSHeroEstimate
            phase={phase}
            estimatedMins={smoothedEstimate}
            peopleAhead={peopleAhead}
            initialPeopleAhead={initialPeopleAhead}
            status={entry.status}
            isDoctorPresent={isDoctorPresent}
          />
        )}

        {/* Go: next (#1) or called (#0) */}
        {isGo && !isCancelled && (
          <PSCalledHero
            patientName={entry.patientName || undefined}
            doctorGender={entry.doctorGender}
            isCalled={isCalled}
            calledAt={entry.calledAt}
            onArrive={handleArrive}
          />
        )}

        {/* Done */}
        {phase === 'done' && (
          <PSDoneHero doctorName={entry.doctorName} />
        )}

        {/* Cancelled state — simple message + rejoin */}
        {isCancelled && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 20px',
            minHeight: 280,
          }}>
            <div className="ps-done-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              marginBottom: 8,
            }}>
              {entry.status === 'NO_SHOW' ? 'Absence signalée' : 'Place annulée'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Vous avez quitté la file d'attente.
            </div>
            <button
              onClick={() => navigate(`/checkin/${entry.clinicId}`)}
              style={{
                padding: '12px 24px',
                background: 'var(--relax-accent)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reprendre une place
            </button>
          </div>
        )}

        {/* Context Cards (phase-specific) */}
        {!isCancelled && phase !== 'done' && (
          <PSContextCard
            phase={phase}
            peopleAhead={peopleAhead}
            avgConsultMins={entry.avgConsultationMins}
            estimatedMins={smoothedEstimate}
            isAbsent={isAbsent}
            onAbsentClick={() => setIsAbsent(!isAbsent)}
            isCalled={isCalled}
          />
        )}

        {/* Visit Summary (done state) */}
        {phase === 'done' && (
          <PSVisitSummary
            arrivedAt={entry.arrivedAt}
            calledAt={entry.calledAt}
            doctorName={entry.doctorName}
          />
        )}

        {/* ⋯ Options footer (hidden on called/done) */}
        <PSManageFooter
          visible={!isCancelled && phase !== 'done' && !isCalled}
          onManageClick={() => setIsQuitModalOpen(true)}
        />

        {/* Brand Footer */}
        <PSBrandFooter />
      </div>

      {/* Floating: Progress Toast */}
      <PSProgressToast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* Floating: Quit Confirmation Modal */}
      <PSQuitModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirm={handleLeaveQueue}
        isLoading={isLeaving}
        doctorName={entry.doctorName}
      />
    </div>
  );
}
