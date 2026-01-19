import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import QueueList from '@/components/queue/QueueList';
import QueueStats from '@/components/queue/QueueStats';
import QRCodeCard from '@/components/queue/QRCodeCard';
import QRCodeModal from '@/components/queue/QRCodeModal';
import MobileDashboard from '@/components/queue/MobileDashboard';
import AddPatientModal from '@/components/queue/AddPatientModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import { MD3FAB } from '@/components/md3/fab';
import { MD3Button } from '@/components/md3/button';

export default function DashboardPage() {
  const { t } = useTranslation();
  const {
    // Store data
    queue,
    stats,
    waitingCount,

    // Modal state
    isAddModalOpen,
    setIsAddModalOpen,
    isQRModalOpen,
    setIsQRModalOpen,
    isConfirmModalOpen,
    isClearQueueModalOpen,
    setIsClearQueueModalOpen,

    // Loading states
    isRemoving,
    isClearing,
    isCallingNext,
    isFillingQueue,
    isTogglingPresence,

    // Animation state
    exitingPatientId,

    // Doctor presence
    isDoctorPresent,

    // Actions
    handleCallNext,
    handleRemovePatient,
    confirmRemovePatient,
    cancelRemovePatient,
    confirmClearQueue,
    cancelClearQueue,
    handleToggleDoctorPresent,
    handleFillQueue,
    handleReorderPatient,
    handleCompleteConsultation,
    resetStats,

    // Toast state
    toast,
    hideToast,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-gray-50 pb-32 lg:pb-8">
      {/* Desktop Header - hidden on mobile since MobileDashboard has its own stats bar */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile Dashboard - visible only on small screens */}
      <div className="lg:hidden">
        <MobileDashboard
          queue={queue}
          stats={stats}
          onCallNext={handleCallNext}
          onAddPatient={() => setIsAddModalOpen(true)}
          onRemovePatient={handleRemovePatient}
          onReorder={handleReorderPatient}
          onEmergency={(id) => handleReorderPatient(id, 1)}
          onShowQR={() => setIsQRModalOpen(true)}
          onFillQueue={handleFillQueue}
          onCompleteConsultation={handleCompleteConsultation}
          isCallingNext={isCallingNext}
          isDoctorPresent={isDoctorPresent}
          onToggleDoctorPresent={handleToggleDoctorPresent}
          isFillingQueue={isFillingQueue}
        />
      </div>

      {/* Desktop Layout - hidden on mobile */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Column - QR Code Card */}
          <aside className="lg:sticky lg:top-6 self-start">
            <QRCodeCard />
          </aside>

          {/* Right Column - Stats, Actions, Queue */}
          <div className="space-y-6">
            {/* Stats */}
            {stats && <QueueStats stats={stats} onResetStats={resetStats} isDoctorPresent={isDoctorPresent} queue={queue} />}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              {/* Left side: Add Patient + Doctor Toggle */}
              <div className="flex items-center gap-4">
                {/* Add Patient Button */}
                <MD3Button
                  variant="tonal"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<span className="material-symbols-outlined text-xl">person_add</span>}
                >
                  {t('queue.addPatient')}
                </MD3Button>

                {/* Doctor Present Toggle */}
                <button
                  onClick={handleToggleDoctorPresent}
                  disabled={isTogglingPresence}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all disabled:opacity-70 ${
                    isDoctorPresent
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                  title={isDoctorPresent ? t('queue.doctorArrived') : t('queue.waitingForDoctor')}
                  aria-label={isDoctorPresent ? t('queue.doctorPresent') : t('queue.doctorNotPresent')}
                  aria-pressed={isDoctorPresent}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${isDoctorPresent ? 'text-green-600' : 'text-gray-400'}`}
                    style={{ fontVariationSettings: isDoctorPresent ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    stethoscope
                  </span>
                  <span className="text-sm">
                    {isDoctorPresent ? t('queue.doctorPresent') : t('queue.doctorNotPresent')}
                  </span>
                  {/* Toggle indicator - RTL aware */}
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {/* Fill Queue Button (Demo) */}
              <MD3Button
                variant="text"
                onClick={handleFillQueue}
                disabled={isFillingQueue}
                className="text-purple-600 hover:bg-purple-50 active:bg-purple-100"
                icon={<span className="material-symbols-outlined text-xl">{isFillingQueue ? 'hourglass_empty' : 'group_add'}</span>}
              >
                <span className="hidden sm:inline">{isFillingQueue ? t('queue.fillingQueue') : t('queue.fillQueue')}</span>
              </MD3Button>

              {/* Clear Queue Button */}
              <MD3Button
                variant="text"
                onClick={() => setIsClearQueueModalOpen(true)}
                disabled={queue.length === 0}
                className="text-red-600 hover:bg-red-50 active:bg-red-100"
                icon={<span className="material-symbols-outlined text-xl">delete_sweep</span>}
              >
                <span className="hidden sm:inline">{t('queue.clearQueue') || 'Clear Queue'}</span>
              </MD3Button>
            </div>

            {/* Queue List */}
            <QueueList
              queue={queue}
              onRemove={handleRemovePatient}
              onReorder={handleReorderPatient}
              onEmergency={(id) => handleReorderPatient(id, 1)}
              exitingPatientId={exitingPatientId}
              isDoctorPresent={isDoctorPresent}
            />
          </div>
        </div>
      </main>

      {/* Call Next FAB - Primary Action (Fixed Position) - Desktop only */}
      <div className="hidden lg:block">
        <MD3FAB
          variant="primary"
          size="large"
          icon={<span className="material-symbols-outlined">directions_walk</span>}
          onClick={handleCallNext}
          disabled={waitingCount === 0 || isCallingNext || !isDoctorPresent}
          className="fixed bottom-6 end-6 z-50 lg:bottom-8 lg:end-8"
          title={isDoctorPresent ? t('queue.callNext') : t('queue.waitingForDoctor')}
          aria-label={t('queue.callNext')}
        />
      </div>

      {/* Add patient modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Confirm remove patient modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={cancelRemovePatient}
        onConfirm={confirmRemovePatient}
        title={t('queue.confirmRemoveTitle')}
        message={t('queue.confirmRemove')}
        variant="danger"
        isLoading={isRemoving}
      />

      {/* Confirm clear queue modal */}
      <ConfirmModal
        isOpen={isClearQueueModalOpen}
        onClose={cancelClearQueue}
        onConfirm={confirmClearQueue}
        title={t('queue.confirmClearTitle') || 'Clear Queue'}
        message={t('queue.confirmClear') || 'Are you sure you want to remove all patients from the queue? This action cannot be undone.'}
        variant="danger"
        isLoading={isClearing}
      />

      {/* QR Code modal for mobile */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Reorder confirmation toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
