import { useState, useMemo } from 'react';
import type { QueueEntry, QueueStats } from '@/types';
import { QueueStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { calculateEndEstimate } from './utils';
import './blesaf.css';

import BSHeader from './BSHeader';
import BSQuickAdd from './BSQuickAdd';
import BSCurrentPatient from './BSCurrentPatient';
import BSQueueList from './BSQueueList';
import BSFloatingCTA from './BSFloatingCTA';
import BSAddPatientSheet from './BSAddPatientSheet';

interface BlesafDashboardProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  onCallNext: () => void;
  onRemovePatient: (id: string) => void;
  onReorder: (id: string, newPosition: number) => void;
  onEmergency: (id: string) => void;
  onCompleteConsultation?: () => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
  announcement?: string | null;
  onAnnouncementClick?: () => void;
  onAnnouncementClear?: () => void;
}

export default function BlesafDashboard({
  queue,
  stats,
  onCallNext,
  onRemovePatient,
  isCallingNext,
  isDoctorPresent,
  onToggleDoctorPresent,
}: BlesafDashboardProps) {
  const { clinic } = useAuthStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  // ── Derived data ──

  // When doctor is absent, treat IN_CONSULTATION as just waiting
  const inConsultation = useMemo(
    () => isDoctorPresent ? queue.find(p => p.status === QueueStatus.IN_CONSULTATION) : null,
    [queue, isDoctorPresent]
  );

  const waitingQueue = useMemo(
    () => isDoctorPresent
      ? queue.filter(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED)
      : queue.filter(p =>
          p.status === QueueStatus.WAITING ||
          p.status === QueueStatus.NOTIFIED ||
          p.status === QueueStatus.IN_CONSULTATION
        ),
    [queue, isDoctorPresent]
  );

  const nextPatient = waitingQueue[0] || null;
  const waitingCount = waitingQueue.length;
  const seenCount = stats?.seen || 0;
  const canCallNext = isDoctorPresent && queue.some(
    p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED
  );

  // Avg consultation time from backend
  const avgConsultMins = stats?.effectiveAvgMins ?? clinic?.avgConsultationMins ?? 10;

  // Remaining time for current consultation
  const elapsedConsultMins = inConsultation?.calledAt
    ? (Date.now() - new Date(inConsultation.calledAt).getTime()) / 60000
    : 0;
  const remainingCurrentMins = inConsultation
    ? Math.max(0, avgConsultMins - elapsedConsultMins)
    : 0;

  // End estimate
  const endEstimate = useMemo(
    () => waitingCount > 0
      ? calculateEndEstimate(waitingCount, avgConsultMins, remainingCurrentMins)
      : '—',
    [waitingCount, avgConsultMins, remainingCurrentMins]
  );

  // Estimated wait for next added patient
  const estimatedWaitForNew = useMemo(() => {
    const totalMins = Math.round(remainingCurrentMins + waitingCount * avgConsultMins);
    if (totalMins >= 60) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `~${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
    }
    return `~${totalMins} min`;
  }, [remainingCurrentMins, waitingCount, avgConsultMins]);

  // ── Handlers ──

  const handleQuickAdd = (name: string) => {
    setQuickAddName(name);
    setIsAddSheetOpen(true);
  };

  return (
    <div className="bs-dashboard">
      {/* Header */}
      <BSHeader
        waitingCount={waitingCount}
        seenCount={seenCount}
        endEstimate={endEstimate}
        isDoctorPresent={isDoctorPresent}
        onToggleDoctorPresent={onToggleDoctorPresent}
      />

      {/* Quick-Add Bar */}
      <BSQuickAdd onSubmit={handleQuickAdd} />

      {/* Current Patient Card */}
      {inConsultation && (
        <BSCurrentPatient
          patient={inConsultation}
          onCallNext={onCallNext}
          isCallingNext={isCallingNext}
          canCallNext={canCallNext}
        />
      )}

      {/* Queue List */}
      <BSQueueList
        queue={waitingQueue}
        isDoctorPresent={isDoctorPresent}
        onRemovePatient={onRemovePatient}
      />

      {/* Empty State */}
      {queue.length === 0 && (
        <div className="bs-empty-state">
          <div className="bs-empty-icon">
            <span className="material-symbols-rounded">groups</span>
          </div>
          <div className="bs-empty-text">Aucun patient dans la file</div>
        </div>
      )}

      {/* Floating CTA */}
      {waitingCount > 0 && (
        <BSFloatingCTA
          nextPatient={nextPatient}
          onCallNext={onCallNext}
          isCallingNext={isCallingNext}
          disabled={!canCallNext}
        />
      )}

      {/* Add Patient Bottom Sheet */}
      <BSAddPatientSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        prefilledName={quickAddName}
        estimatedPosition={waitingCount + (inConsultation ? 1 : 0) + 1}
        estimatedWait={estimatedWaitForNew}
        clinicName=""
      />
    </div>
  );
}
