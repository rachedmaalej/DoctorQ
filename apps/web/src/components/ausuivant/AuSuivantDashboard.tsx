import { useState, useMemo } from 'react';
import type { QueueEntry, QueueStats, QueueStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import './ausuivant.css';

import ASTopbar from './ASTopbar';
import ASHeroMetrics from './ASHeroMetrics';
import ASSessionControls from './ASSessionControls';
import ASCallNextButton from './ASCallNextButton';
import ASConsultationBar from './ASConsultationBar';
import ASQueueSection from './ASQueueSection';
import ASSummaryCard from './ASSummaryCard';
import ASFAB from './ASFAB';
import ASAddPatientSheet from './ASAddPatientSheet';
import ASSettingsPanel from './ASSettingsPanel';
import { formatDisplayName, calculateEstimatedEndTime, getConsultationDuration } from './utils';

interface AuSuivantDashboardProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  onCallNext: () => void;
  onRemovePatient: (id: string) => void;
  onReorder: (id: string, newPosition: number) => void;
  onEmergency: (id: string) => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
  isTogglingPresence?: boolean;
}

export default function AuSuivantDashboard({
  queue,
  stats,
  onCallNext,
  onRemovePatient,
  onReorder,
  isCallingNext,
  isDoctorPresent,
  onToggleDoctorPresent,
  isTogglingPresence = false,
}: AuSuivantDashboardProps) {
  const { clinic } = useAuthStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derived data
  const inConsultation = useMemo(
    () => queue.find((e) => e.status === ('IN_CONSULTATION' as QueueStatus)),
    [queue]
  );

  const waitingQueue = useMemo(
    () => queue.filter((e) => e.status === ('WAITING' as QueueStatus) || e.status === ('NOTIFIED' as QueueStatus)),
    [queue]
  );

  const nextPatient = waitingQueue[0] || null;
  const waitingCount = stats?.waiting ?? waitingQueue.length;

  // Avg consultation mins from backend or clinic setting
  const avgMins = (stats as any)?.effectiveAvgMins || clinic?.avgConsultationMins || 15;

  // Estimated end time
  const estimatedEndTime = useMemo(
    () => calculateEstimatedEndTime(waitingCount, avgMins),
    [waitingCount, avgMins]
  );

  // Consultation duration
  const consultationDuration = inConsultation?.calledAt
    ? getConsultationDuration(inConsultation.calledAt)
    : 0;

  const consultationName = inConsultation
    ? formatDisplayName(inConsultation.patientName)
    : '';

  // Priority handler (move to position 1)
  const handlePriority = (id: string) => {
    onReorder(id, 1);
  };

  return (
    <div className="as-dashboard">
      {/* Topbar */}
      <ASTopbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSessionActive={isDoctorPresent}
      />

      {/* Hero Metrics */}
      <ASHeroMetrics
        waitingCount={waitingCount}
        avgWaitMinutes={stats?.avgWait ?? null}
        estimatedEndTime={estimatedEndTime}
      />

      {/* Session Controls */}
      <ASSessionControls
        isDoctorPresent={isDoctorPresent}
        onToggle={onToggleDoctorPresent}
        isToggling={isTogglingPresence}
      />

      {/* Call Next Button */}
      <ASCallNextButton
        nextPatient={nextPatient}
        onCallNext={onCallNext}
        isCallingNext={isCallingNext}
        disabled={waitingCount === 0 || !isDoctorPresent}
      />

      {/* Active Consultation Bar */}
      {inConsultation && (
        <ASConsultationBar
          patientName={consultationName}
          durationMinutes={consultationDuration}
        />
      )}

      {/* Queue Section */}
      <ASQueueSection
        queue={queue}
        isDoctorPresent={isDoctorPresent}
        onPriority={handlePriority}
        onRemove={onRemovePatient}
        avgConsultationMins={avgMins}
      />

      {/* Summary Card (Bilan) */}
      <ASSummaryCard />

      {/* FAB */}
      <ASFAB
        isOpen={isAddSheetOpen}
        onToggle={() => setIsAddSheetOpen(!isAddSheetOpen)}
      />

      {/* Add Patient Bottom Sheet */}
      <ASAddPatientSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />

      {/* Settings Panel */}
      <ASSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clinic={clinic}
      />
    </div>
  );
}
