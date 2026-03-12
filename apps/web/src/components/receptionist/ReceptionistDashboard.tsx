import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QueueStatus } from '@/types';
import { api } from '@/lib/api';
import { useQueueStore } from '@/stores/queueStore';
import type { ReceptionistDashboardProps, QueuePatient } from './types';
import { useQueueLifecycle } from './useQueueLifecycle';
import {
  toQueuePatient,
  toCurrentPatient,
  toClosingStatsData,
  toDaySummaryBrief,
  toSummaryData,
  getNextPatientPreview,
  getTotalAddedToday,
} from './adapters';
import './receptionist.css';
import '@/components/shared/shared.css';
import { useDrawer } from '@/hooks/useDrawer';
import { SideDrawer } from '@/components/drawer/SideDrawer';

import Header from './Header';
import DashboardKpiStrip from '@/components/dashboard/DashboardKpiStrip';
import QuickAddBar from './QuickAddBar';
import CurrentPatientCard from './CurrentPatientCard';
import QueueList from './QueueList';
import FloatingCTA from './FloatingCTA';
import SectionHeader from './SectionHeader';
import StatusSheet from './StatusSheet';
import PatientContextSheet from './PatientContextSheet';
import WelcomeScreenMobile from '@/components/queue/WelcomeScreenMobile';
import ClosingBanner from './ClosingBanner';
import AllDoneCard from './AllDoneCard';
import SummaryCard from './SummaryCard';
import TimelineBar from './TimelineBar';
import SummaryActionBar from './SummaryActionBar';
import BSAddPatientSheet from '@/components/shared/BSAddPatientSheet';
import BSWhatsAppSheet from '@/components/shared/BSWhatsAppSheet';
import GuidedTour from '@/features/tour/GuidedTour';
import { useTourStore } from '@/features/tour/tourStore';

export default function ReceptionistDashboard({
  queue,
  stats,
  clinic,
  isDoctorPresent,
  onCallNext,
  onRemovePatient,
  onCompleteConsultation,
  onToggleDoctorPresent,
  isTogglingPresence,
  onOpenSettings,
  closeDrawerTrigger,
}: ReceptionistDashboardProps) {
  const { t } = useTranslation();
  const drawerControls = useDrawer();

  // ── Tour refs ──────────────────────────────────────────────────────────────
  const tourScreenRef    = useRef<HTMLDivElement>(null);
  const tourAddBtnRef    = useRef<HTMLButtonElement>(null);
  const tourPresenceRef  = useRef<HTMLButtonElement>(null);
  const tourState        = useTourStore(s => s.state);

  // Close drawer when triggered from parent (e.g. settings backdrop dismiss)
  useEffect(() => {
    if (closeDrawerTrigger && closeDrawerTrigger > 0) {
      drawerControls.close();
    }
  }, [closeDrawerTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
  } = useQueueLifecycle(clinic?.id, queue, stats, isDoctorPresent);

  // ── Add-patient sheet state ───────────────────────────────
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addSheetName, setAddSheetName] = useState('');

  // ── Status sheet state ────────────────────────────────────
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Patient context sheet state ─────────────────────────
  const [contextPatient, setContextPatient] = useState<QueuePatient | null>(null);

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
    () => waitingEntries.map(toQueuePatient),
    [waitingEntries],
  );
  const nextPreview = getNextPatientPreview(queue);
  const totalAdded = getTotalAddedToday(stats, queue.length);

  const closingStatsData = stats ? toClosingStatsData(stats) : null;
  const summaryBrief = stats
    ? toDaySummaryBrief(stats)
    : { totalPatients: 0, avgWaitMinutes: 0, avgConsultMinutes: 0 };
  const summaryData = toSummaryData(clinic, closedSummary);

  // ── Screen derivation ─────────────────────────────────────
  // When the tour has ever run (active or just finished), bypass PRE_OPEN.
  // This ensures the user lands on the open dashboard after tour completion,
  // not the welcome screen (which would show because the real API queue is still PRE_OPEN).
  const tourHasRun = tourState !== 'IDLE'; // includes DONE
  const showPreOpen = queueStatus === 'PRE_OPEN' && !tourHasRun;
  const showOpen = queueStatus === 'OPEN' || (tourHasRun && queueStatus === 'PRE_OPEN');
  const showClosing = queueStatus === 'CLOSING' && !isAllDone;
  const showAllDone = queueStatus === 'CLOSING' && isAllDone;
  const showClosed = queueStatus === 'CLOSED';
  const showKpi = showOpen || showClosing;

  // ── Handlers ──────────────────────────────────────────────
  const handleQuickAdd = (name: string) => {
    setAddSheetName(name);
    setIsAddSheetOpen(true);
  };

  const handleCallNextFromCard = () => {
    if (showClosing && waitingEntries.length === 0 && inConsultationEntry) {
      onCompleteConsultation();
    } else {
      onCallNext();
    }
  };

  // ── Context sheet actions ───────────────────────────────
  const { fetchQueue } = useQueueStore();
  const handleMarkEmergency = useCallback(async (id: string) => {
    try {
      await api.toggleUrgent(id);
      fetchQueue();
    } catch { /* handled by API layer */ }
  }, [fetchQueue]);


  const handleShare = useCallback(async () => {
    const text = t('receptionist.share.text', { count: summaryData.totalPatientsSeen });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('receptionist.share.title', { name: clinic?.name ?? '' }), text });
      } catch { /* user cancelled */ }
    }
  }, [summaryData.totalPatientsSeen, clinic?.name]);

  return (
    <div
      ref={tourScreenRef}
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
          status={showOpen && queueStatus === 'PRE_OPEN' ? 'OPEN' : queueStatus}
          isDoctorPresent={isDoctorPresent}
          onToggleDoctorPresent={onToggleDoctorPresent}
          isTogglingPresence={isTogglingPresence}
          className={showPreOpen ? 'animate-bs-slide-in bs-anim-d1 mb-3' : 'mb-3'}
          onOpenDrawer={drawerControls.open}
          tourPresencePillRef={tourPresenceRef}
        />

        {/* ═══ KPI Strip (OPEN + CLOSING) ═══ */}
        {showKpi && stats && (
          <DashboardKpiStrip
            waitingCount={stats.waiting}
            seenCount={stats.seen}
            maxWait={stats.maxWait}
            mode={showClosing ? 'remaining' : 'waiting'}
          />
        )}

        {/* ═══ PRE_OPEN Screen ═══ */}
        {showPreOpen && (
          <WelcomeScreenMobile
            doctorName={clinic?.doctorName ?? clinic?.name ?? ''}
            onOpenQueue={openQueue}
            isOpening={false}
          />
        )}

        {/* ═══ OPEN Screen ═══ */}
        {showOpen && (
          <>
            <QuickAddBar onSubmit={handleQuickAdd} tourAddBtnRef={tourAddBtnRef} />
            {currentPatient && (
              <>
                <SectionHeader title={t('receptionist.sections.inConsultation')} />
                <CurrentPatientCard patient={currentPatient} onNext={handleCallNextFromCard} />
              </>
            )}
            {queuePatients.length > 0 && (
              <>
                <SectionHeader title={t('receptionist.sections.waitingList')} />
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
                <SectionHeader title={t('receptionist.sections.inConsultation')} />
                <CurrentPatientCard patient={currentPatient} onNext={handleCallNextFromCard} />
              </>
            )}
            {queuePatients.length > 0 && (
              <>
                <SectionHeader title={t('receptionist.sections.remaining')} />
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
      {(showOpen || showClosing) && (
        <FloatingCTA
          variant="accent"
          icon="arrow_forward"
          label={t('receptionist.cta.callNext')}
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
        onMarkEmergency={handleMarkEmergency}
        onRemove={onRemovePatient}
        onPhoneUpdated={() => setContextPatient(null)}
      />

      {/* ═══ Add Patient Sheet ═══ */}
      <BSAddPatientSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        prefilledName={addSheetName}
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

      {/* ═══ Side Drawer ═══ */}
      <SideDrawer
        isOpen={drawerControls.isOpen}
        onClose={drawerControls.close}
        clinic={clinic ?? null}
        waitingCount={waitingEntries.length}
        isDoctorPresent={isDoctorPresent ?? false}
        onCloseQueue={closeQueue}
        onOpenSettings={onOpenSettings}
        onToggleDoctorPresent={onToggleDoctorPresent}
        isTogglingPresence={isTogglingPresence}
        queueStatus={queueStatus}
        onOpenQueue={openQueue}
        onReopenQueue={reopenQueue}
      />

      {/* ═══ Guided Onboarding Tour ═══ */}
      {tourState !== 'IDLE' && (
        <GuidedTour
          screenRef={tourScreenRef}
          addBtnRef={tourAddBtnRef}
          presencePillRef={tourPresenceRef}
          onOpenQueue={openQueue}
        />
      )}
    </div>
  );
}
