import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QueueStatus } from '@/types';
import { api } from '@/lib/api';
import { useQueueStore } from '@/stores/queueStore';
import type { ReceptionistDashboardProps, QueuePatient } from './types';
import { useQueueLifecycle } from './useQueueLifecycle';
import {
  toQueuePatient,
  toCurrentPatient,
  toStatsData,
  toClosingStatsData,
  toDaySummaryBrief,
  toSummaryData,
  getNextPatientPreview,
  getTotalAddedToday,
} from './adapters';
import './receptionist.css';
import '@/components/blesaf/blesaf.css';
import { useDrawer } from '@/hooks/useDrawer';
import { SideDrawer } from '@/components/drawer/SideDrawer';

import Header from './Header';
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
import BSAddPatientSheet from '@/components/blesaf/BSAddPatientSheet';
import BSWhatsAppSheet from '@/components/blesaf/BSWhatsAppSheet';

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
  const avgConsultMins = clinic?.avgConsultationMins ?? 10;
  const drawerControls = useDrawer();

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
      await api.toggleEmergency(id);
      fetchQueue();
    } catch { /* handled by API layer */ }
  }, [fetchQueue]);

  const handleMarkSteppedOut = useCallback(async (id: string) => {
    try {
      await api.toggleSteppedOut(id);
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
          status={queueStatus}
          isDoctorPresent={isDoctorPresent}
          onToggleDoctorPresent={onToggleDoctorPresent}
          isTogglingPresence={isTogglingPresence}
          showStats={showStats}
          chip1Value={chip1Value}
          chip2Value={chip2Value}
          chip3Value={chip3Value}
          className={showPreOpen ? 'animate-bs-slide-in bs-anim-d1' : ''}
          onOpenDrawer={drawerControls.open}
        />

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
            <QuickAddBar onSubmit={handleQuickAdd} />
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
        onMarkSteppedOut={handleMarkSteppedOut}
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
    </div>
  );
}
