import { useState, useMemo, useCallback } from 'react';
import { QueueStatus } from '@/types';
import type { ReceptionistDashboardProps, QueuePatient } from './types';
import { useQueueLifecycle } from './useQueueLifecycle';
import {
  toQueuePatient,
  toCurrentPatient,
  toPreRegisteredPatients,
  toStatsData,
  toClosingStatsData,
  toDaySummaryBrief,
  toSummaryData,
  extractLastName,
  getNextPatientPreview,
  getTotalAddedToday,
} from './adapters';
import './receptionist.css';
import '@/components/blesaf/blesaf.css';

import Header from './Header';
import QuickAddBar from './QuickAddBar';
import CurrentPatientCard from './CurrentPatientCard';
import QueueList from './QueueList';
import FloatingCTA from './FloatingCTA';
import SectionHeader from './SectionHeader';
import StatusSheet from './StatusSheet';
import PatientContextSheet from './PatientContextSheet';
import MorningCard from './MorningCard';
import PreRegisteredList from './PreRegisteredList';
import ClosingBanner from './ClosingBanner';
import AllDoneCard from './AllDoneCard';
import SummaryCard from './SummaryCard';
import TimelineBar from './TimelineBar';
import SummaryActionBar from './SummaryActionBar';
import BSAddPatientSheet from '@/components/blesaf/BSAddPatientSheet';
import BSWhatsAppSheet from '@/components/blesaf/BSWhatsAppSheet';

export default function ReceptionistDashboard({
  queue,
  stats,
  clinic,
  isDoctorPresent,
  onCallNext,
  onRemovePatient,
  onReorderPatient,
  onCompleteConsultation,
  onToggleDoctorPresent,
}: ReceptionistDashboardProps) {
  const avgConsultMins = clinic?.avgConsultationMins ?? 10;

  // ── Lifecycle state machine ───────────────────────────────
  const {
    queueStatus,
    isAllDone,
    dayOpenedAt,
    closedSummary,
    openQueue,
    closeQueue,
    reopenQueue,
    endDay,
    newDay,
  } = useQueueLifecycle(clinic?.id, queue, stats);

  // ── Add-patient sheet state ───────────────────────────────
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addSheetName, setAddSheetName] = useState('');

  // ── Status sheet state ────────────────────────────────────
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Patient context sheet state ─────────────────────────
  const [contextPatient, setContextPatient] = useState<QueuePatient | null>(null);

  // ── Stepped-out badges (client-side only) ───────────────
  const [steppedOutIds, setSteppedOutIds] = useState<Set<string>>(new Set());

  // ── WhatsApp tracking (client-side only) ───────────────
  const [whatsappSentIds, setWhatsappSentIds] = useState<Set<string>>(new Set());
  const [isWhatsAppSheetOpen, setIsWhatsAppSheetOpen] = useState(false);

  const handleWhatsAppSent = useCallback((id: string) => {
    setWhatsappSentIds(prev => new Set(prev).add(id));
  }, []);

  // ── Derive data from real queue ───────────────────────────
  const inConsultationEntry = queue.find(e => e.status === QueueStatus.IN_CONSULTATION);
  const waitingEntries = queue.filter(
    e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED,
  );

  const currentPatient = inConsultationEntry ? toCurrentPatient(inConsultationEntry) : null;
  const queuePatients = useMemo(
    () => waitingEntries.map(toQueuePatient).map(p =>
      steppedOutIds.has(p.id) ? { ...p, badge: 'stepped-out' as const } : p,
    ),
    [waitingEntries, steppedOutIds],
  );
  const preRegistered = useMemo(
    () => toPreRegisteredPatients(queue),
    [queue],
  );
  const nextPreview = getNextPatientPreview(queue);
  const totalAdded = getTotalAddedToday(stats, queue.length);

  const statsData = stats ? toStatsData(stats, queue, avgConsultMins) : null;
  const closingStatsData = stats ? toClosingStatsData(stats, queue, avgConsultMins) : null;
  const summaryBrief = stats
    ? toDaySummaryBrief(stats)
    : { totalPatients: 0, avgWaitMinutes: 0, avgConsultMinutes: 0 };
  const summaryData = toSummaryData(clinic, closedSummary);

  // ── Screen derivation ─────────────────────────────────────
  const showPreOpen = queueStatus === 'PRE_OPEN';
  const showOpen = queueStatus === 'OPEN';
  const showClosing = queueStatus === 'CLOSING' && !isAllDone;
  const showAllDone = queueStatus === 'CLOSING' && isAllDone;
  const showClosed = queueStatus === 'CLOSED';
  const showStats = showOpen || showClosing;

  // Stats chip values
  const chip1Value = showClosing
    ? (closingStatsData?.remainingCount ?? 0)
    : (statsData?.waitingCount ?? 0);
  const chip2Value = showClosing
    ? (closingStatsData?.seenCount ?? 0)
    : (statsData?.seenCount ?? 0);
  const chip3Value = showClosing
    ? (closingStatsData?.estimatedEndTime ?? '')
    : (statsData?.estimatedEndTime ?? '');

  // ── Handlers ──────────────────────────────────────────────
  const handleQuickAdd = (name: string) => {
    setAddSheetName(name);
    setIsAddSheetOpen(true);
  };

  const handleStatusPillClick = () => {
    if (queueStatus === 'OPEN' || queueStatus === 'CLOSING') {
      setIsSheetOpen(true);
    }
  };

  const handleCallNextFromCard = () => {
    if (showClosing && waitingEntries.length === 0 && inConsultationEntry) {
      onCompleteConsultation();
    } else {
      onCallNext();
    }
  };

  // ── Context sheet actions ───────────────────────────────
  const handleMarkPriority = useCallback((id: string) => {
    onReorderPatient(id, 1);
  }, [onReorderPatient]);

  const handleMarkSteppedOut = useCallback((id: string) => {
    setSteppedOutIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleShare = useCallback(async () => {
    const text = `${summaryData.totalPatientsSeen} patients vus aujourd'hui`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Résumé - ${clinic?.name ?? ''}`, text });
      } catch { /* user cancelled */ }
    }
  }, [summaryData.totalPatientsSeen, clinic?.name]);

  // Estimated values for the add-patient sheet
  const estimatedPosition = waitingEntries.length + 1 + (inConsultationEntry ? 1 : 0);
  const estimatedWaitMins = estimatedPosition * avgConsultMins;
  const estimatedWait = estimatedWaitMins >= 60
    ? `${Math.floor(estimatedWaitMins / 60)}h${String(estimatedWaitMins % 60).padStart(2, '0')}`
    : `${estimatedWaitMins} min`;

  return (
    <div
      className="bs-dashboard relative w-full max-w-[375px] mx-auto overflow-hidden"
      style={{
        background: '#F6F5F0',
        fontFamily: "'DM Sans', 'IBM Plex Sans Arabic', sans-serif",
        height: '100dvh',
      }}
    >
      <div className="bs-screen h-full overflow-y-auto overflow-x-hidden pb-[100px]">
        {/* ═══ Header (all screens) ═══ */}
        <Header
          clinicName={clinic?.name ?? ''}
          avgConsultMins={avgConsultMins}
          status={queueStatus}
          isAllDone={isAllDone}
          onStatusPillClick={handleStatusPillClick}
          isDoctorPresent={isDoctorPresent}
          showStats={showStats}
          chip1Value={chip1Value}
          chip2Value={chip2Value}
          chip3Value={chip3Value}
          className={showPreOpen ? 'animate-bs-slide-in bs-anim-d1' : ''}
          onWhatsAppClick={() => setIsWhatsAppSheetOpen(true)}
        />

        {/* ═══ PRE_OPEN Screen ═══ */}
        {showPreOpen && (
          <>
            <div className="animate-bs-slide-in bs-anim-d2">
              <MorningCard
                doctorLastName={extractLastName(clinic?.doctorName ?? null)}
                preRegisteredCount={preRegistered.length}
              />
            </div>
            {preRegistered.length > 0 && (
              <>
                <div className="animate-bs-slide-in bs-anim-d3">
                  <SectionHeader title="Pré-inscrits" />
                </div>
                <div className="animate-bs-slide-in bs-anim-d4">
                  <PreRegisteredList patients={preRegistered} />
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ OPEN Screen ═══ */}
        {showOpen && (
          <>
            <QuickAddBar onSubmit={handleQuickAdd} />
            {currentPatient && (
              <>
                <SectionHeader title="En consultation" />
                <CurrentPatientCard patient={currentPatient} onNext={handleCallNextFromCard} />
              </>
            )}
            {queuePatients.length > 0 && (
              <>
                <SectionHeader title="File d'attente" />
                <QueueList patients={queuePatients} onContextOpen={setContextPatient} whatsappSentIds={whatsappSentIds} />
              </>
            )}
          </>
        )}

        {/* ═══ CLOSING Screen ═══ */}
        {showClosing && (
          <>
            <ClosingBanner />
            {currentPatient && (
              <>
                <SectionHeader title="En consultation" />
                <CurrentPatientCard patient={currentPatient} onNext={handleCallNextFromCard} />
              </>
            )}
            {queuePatients.length > 0 && (
              <>
                <SectionHeader title="Restants" />
                <QueueList patients={queuePatients} onContextOpen={setContextPatient} whatsappSentIds={whatsappSentIds} />
              </>
            )}
          </>
        )}

        {/* ═══ ALL_DONE Screen ═══ */}
        {showAllDone && (
          <AllDoneCard
            summary={summaryBrief}
            onEndDay={endDay}
            onReopen={reopenQueue}
          />
        )}

        {/* ═══ CLOSED Screen ═══ */}
        {showClosed && (
          <>
            <SummaryCard summary={summaryData} onShare={handleShare} />
            <TimelineBar summary={summaryData} />
            <SummaryActionBar onNewDay={newDay} />
          </>
        )}
      </div>

      {/* ═══ Floating CTA ═══ */}
      {showPreOpen && (
        <FloatingCTA
          variant="green"
          icon="play_arrow"
          label="Ouvrir la file"
          onClick={openQueue}
        />
      )}
      {(showOpen || showClosing) && (
        <FloatingCTA
          variant="accent"
          icon="arrow_forward"
          label="Appeler Suivant"
          nextName={nextPreview}
          disabled={waitingEntries.length === 0 || !isDoctorPresent}
          onClick={onCallNext}
        />
      )}

      {/* ═══ Status Sheet ═══ */}
      <StatusSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        status={queueStatus}
        dayOpenedAt={dayOpenedAt ?? ''}
        totalAdded={totalAdded}
        remainingCount={closingStatsData?.remainingCount ?? 0}
        isDoctorPresent={isDoctorPresent}
        onToggleDoctorPresent={onToggleDoctorPresent}
        onCloseQueue={closeQueue}
        onReopenQueue={reopenQueue}
      />

      {/* ═══ Patient Context Sheet ═══ */}
      <PatientContextSheet
        isOpen={contextPatient !== null}
        patient={contextPatient}
        onClose={() => setContextPatient(null)}
        onMarkPriority={handleMarkPriority}
        onMarkSteppedOut={handleMarkSteppedOut}
        onRemove={onRemovePatient}
        onWhatsAppSend={handleWhatsAppSent}
        onPhoneUpdated={() => setContextPatient(null)}
        clinicName={clinic?.name ?? ''}
      />

      {/* ═══ Add Patient Sheet ═══ */}
      <BSAddPatientSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        prefilledName={addSheetName}
        estimatedPosition={estimatedPosition}
        estimatedWait={estimatedWait}
        clinicName={clinic?.name ?? ''}
        onWhatsAppSent={handleWhatsAppSent}
      />

      {/* ═══ WhatsApp Sheet ═══ */}
      <BSWhatsAppSheet
        isOpen={isWhatsAppSheetOpen}
        onClose={() => setIsWhatsAppSheetOpen(false)}
        patients={queuePatients}
        clinicName={clinic?.name ?? ''}
        whatsappSentIds={whatsappSentIds}
        onWhatsAppSent={handleWhatsAppSent}
      />
    </div>
  );
}
