import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useUILabels } from '@/hooks/useUILabels';
import { useAuthStore } from '@/stores/authStore';
import QueueList from '@/components/queue/QueueList';
import QueueStats from '@/components/queue/QueueStats';
import QRCodeCard from '@/components/queue/QRCodeCard';
import QRCodeModal from '@/components/queue/QRCodeModal';
import MobileDashboard from '@/components/queue/MobileDashboard';
import AddPatientModal from '@/components/queue/AddPatientModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import { MD3Button } from '@/components/md3/button';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { labels, isMedical } = useUILabels();
  const { isImpersonating, impersonatedClinicName, stopImpersonation } = useAuthStore();
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

    // Loading states
    isRemoving,
    isClearing,
    isCallingNext,
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
    handleReorderPatient,
    handleCompleteConsultation,
    resetStats,

    // Toast state
    toast,
    hideToast,
  } = useDashboard();

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">
              Viewing as: <strong>{impersonatedClinicName}</strong>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 text-sm bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            Exit to Admin
          </button>
        </div>
      )}

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
          onCompleteConsultation={handleCompleteConsultation}
          isCallingNext={isCallingNext}
          isDoctorPresent={isDoctorPresent}
          onToggleDoctorPresent={handleToggleDoctorPresent}
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
                {/* Add Patient/Client Button */}
                <MD3Button
                  variant="tonal"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<span className="material-symbols-outlined text-xl">person_add</span>}
                >
                  {labels.addCustomer}
                </MD3Button>

                {/* Presence Toggle (Doctor/Store) */}
                <button
                  onClick={handleToggleDoctorPresent}
                  disabled={isTogglingPresence}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all disabled:opacity-70 ${
                    isDoctorPresent
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                  title={isDoctorPresent ? labels.presenceOn : labels.presenceOff}
                  aria-label={isDoctorPresent ? labels.presenceOn : labels.presenceOff}
                  aria-pressed={isDoctorPresent}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${isDoctorPresent ? 'text-green-600' : 'text-gray-400'}`}
                    style={{ fontVariationSettings: isDoctorPresent ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {isMedical ? 'stethoscope' : 'storefront'}
                  </span>
                  <span className="text-sm">
                    {isDoctorPresent ? labels.presenceOn : labels.presenceOff}
                  </span>
                  {/* Toggle indicator - RTL aware */}
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {/* Right side: Call Next Button */}
              <button
                onClick={handleCallNext}
                disabled={waitingCount === 0 || isCallingNext || !isDoctorPresent}
                title={isDoctorPresent ? t('queue.callNext') : t('queue.waitingForDoctor')}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-xl">directions_walk</span>
                {t('queue.callNext')}
              </button>
            </div>

            {/* Queue List */}
            <QueueList
              queue={queue}
              onRemove={handleRemovePatient}
              onReorder={handleReorderPatient}
              onEmergency={(id) => handleReorderPatient(id, 1)}
              onCompleteConsultation={handleCompleteConsultation}
              exitingPatientId={exitingPatientId}
              isDoctorPresent={isDoctorPresent}
            />
          </div>
        </div>
      </main>

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
