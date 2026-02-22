/**
 * Standalone preview wrapper for /receptionist demo route.
 * Passes mock data so the dashboard can be viewed without authentication.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockData } from './mockData';
import type { QueueScreenStatus } from './types';
import './receptionist.css';

import Header from './Header';
import QuickAddBar from './QuickAddBar';
import CurrentPatientCard from './CurrentPatientCard';
import QueueList from './QueueList';
import FloatingCTA from './FloatingCTA';
import SectionHeader from './SectionHeader';
import StatusSheet from './StatusSheet';
import MorningCard from './MorningCard';
import PreRegisteredList from './PreRegisteredList';
import ClosingBanner from './ClosingBanner';
import AllDoneCard from './AllDoneCard';
import SummaryCard from './SummaryCard';
import TimelineBar from './TimelineBar';
import SummaryActionBar from './SummaryActionBar';
import { closingCurrentPatient, closingQueue, closingNextPreview } from './mockData';

export default function ReceptionistPreview() {
  const { t } = useTranslation();
  const [queueStatus, setQueueStatus] = useState<QueueScreenStatus>('PRE_OPEN');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDoctorPresent, setIsDoctorPresent] = useState(mockData.isDoctorPresent);
  const [isAllDone, setIsAllDone] = useState(false);

  const showPreOpen = queueStatus === 'PRE_OPEN';
  const showOpen = queueStatus === 'OPEN';
  const showClosing = queueStatus === 'CLOSING' && !isAllDone;
  const showAllDone = queueStatus === 'CLOSING' && isAllDone;
  const showClosed = queueStatus === 'CLOSED';
  const showStats = showOpen || showClosing;

  const currentPatient = showClosing ? closingCurrentPatient : mockData.currentPatient;
  const activeQueue = showClosing ? closingQueue : mockData.queue;
  const nextPreview = showClosing ? closingNextPreview : mockData.nextPatientPreview;

  const chip1Value = showClosing ? mockData.closingStats.remainingCount : mockData.stats.waitingCount;
  const chip2Value = showClosing ? mockData.closingStats.seenCount : mockData.stats.seenCount;
  const chip3Value = showClosing ? mockData.closingStats.estimatedEndTime : mockData.stats.estimatedEndTime;

  const handleOpenQueue = () => { setQueueStatus('OPEN'); setIsAllDone(false); };
  const handleCloseQueue = () => { setQueueStatus('CLOSING'); setIsAllDone(false); };
  const handleReopenQueue = () => { setQueueStatus('OPEN'); setIsAllDone(false); };
  const handleEndDay = () => { setQueueStatus('CLOSED'); setIsAllDone(false); };
  const handleShowAllDone = () => { setIsAllDone(true); };
  const handleNewDay = () => { setQueueStatus('PRE_OPEN'); setIsAllDone(false); };
  const handleStatusPillClick = () => {
    if (queueStatus === 'OPEN' || queueStatus === 'CLOSING') setIsSheetOpen(true);
  };

  return (
    <div
      className="relative w-full max-w-[375px] mx-auto overflow-hidden"
      style={{
        background: '#F6F5F0',
        fontFamily: "'DM Sans', 'IBM Plex Sans Arabic', sans-serif",
        height: '100dvh',
      }}
    >
      <div className="bs-screen h-full overflow-y-auto overflow-x-hidden pb-[100px]">
        <Header
          clinicName={mockData.clinicName}
          status={queueStatus}
          isAllDone={isAllDone}
          onStatusPillClick={handleStatusPillClick}
          isDoctorPresent={isDoctorPresent}
          showStats={showStats}
          chip1Value={chip1Value}
          chip2Value={chip2Value}
          chip3Value={chip3Value}
          className={showPreOpen ? 'animate-bs-slide-in bs-anim-d1' : ''}
        />

        {showPreOpen && (
          <>
            <div className="animate-bs-slide-in bs-anim-d2">
              <MorningCard
                doctorLastName={mockData.doctorLastName}
                preRegisteredCount={mockData.preRegisteredPatients.length}
              />
            </div>
            {mockData.preRegisteredPatients.length > 0 && (
              <>
                <div className="animate-bs-slide-in bs-anim-d3">
                  <SectionHeader title={t('receptionist.sections.preRegistered')} />
                </div>
                <div className="animate-bs-slide-in bs-anim-d4">
                  <PreRegisteredList patients={mockData.preRegisteredPatients} />
                </div>
              </>
            )}
          </>
        )}

        {showOpen && (
          <>
            <QuickAddBar />
            <SectionHeader title={t('receptionist.sections.inConsultation')} />
            {currentPatient && (
              <CurrentPatientCard patient={currentPatient} onNext={handleCloseQueue} />
            )}
            <SectionHeader title={t('receptionist.sections.waitingList')} />
            <QueueList patients={activeQueue} />
          </>
        )}

        {showClosing && (
          <>
            <ClosingBanner />
            <SectionHeader title={t('receptionist.sections.inConsultation')} />
            {currentPatient && <CurrentPatientCard patient={currentPatient} />}
            <SectionHeader title={t('receptionist.sections.remaining')} />
            <QueueList patients={activeQueue} />
          </>
        )}

        {showAllDone && (
          <AllDoneCard
            summary={mockData.daySummaryBrief}
            onEndDay={handleEndDay}
            onReopen={handleReopenQueue}
          />
        )}

        {showClosed && (
          <>
            <SummaryCard summary={mockData.summary} />
            <TimelineBar summary={mockData.summary} />
            <SummaryActionBar onNewDay={handleNewDay} />
          </>
        )}
      </div>

      {showPreOpen && (
        <FloatingCTA variant="green" icon="play_arrow" label={t('receptionist.cta.openQueue')} onClick={handleOpenQueue} />
      )}
      {(showOpen || showClosing) && (
        <FloatingCTA
          variant="accent"
          icon="arrow_forward"
          label={t('receptionist.cta.callNext')}
          nextName={nextPreview}
          onClick={showClosing ? handleShowAllDone : undefined}
        />
      )}

      <StatusSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        status={queueStatus}
        dayOpenedAt={mockData.dayOpenedAt}
        totalAdded={mockData.totalAddedToday}
        remainingCount={mockData.closingStats.remainingCount}
        isDoctorPresent={isDoctorPresent}
        onToggleDoctorPresent={() => setIsDoctorPresent(!isDoctorPresent)}
        onCloseQueue={handleCloseQueue}
        onReopenQueue={handleReopenQueue}
      />
    </div>
  );
}
