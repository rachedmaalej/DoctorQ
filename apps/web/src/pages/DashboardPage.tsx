import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useUILabels } from '@/hooks/useUILabels';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import QueueList from '@/components/queue/QueueList';
import QueueStats from '@/components/queue/QueueStats';
import QRCodeCard from '@/components/queue/QRCodeCard';
import QRCodeModal from '@/components/queue/QRCodeModal';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';
import AuSuivantDashboard from '@/components/ausuivant/AuSuivantDashboard';
import AddPatientModal from '@/components/queue/AddPatientModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AnnouncementModal from '@/components/queue/AnnouncementModal';
import { Toast } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import TrialBanner from '@/components/ui/TrialBanner';
import { MD3Button } from '@/components/md3/button';
import DailyRecapOverlay from '@/components/dashboard/DailyRecapOverlay';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { labels, isMedical } = useUILabels();
  const { clinic, isImpersonating, impersonatedClinicName, stopImpersonation } = useAuthStore();
  const [showDailyRecap, setShowDailyRecap] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Check subscription status
  useEffect(() => {
    api.getSubscription()
      .then(sub => {
        setSubscriptionExpired(!sub.canUseApp);
      })
      .catch(() => {});
  }, []);

  // Show daily recap on first visit of the day
  useEffect(() => {
    if (!clinic?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = localStorage.getItem(`dailyRecap_shown_${clinic.id}`);
    if (lastShown !== today) {
      setShowDailyRecap(true);
    }
  }, [clinic?.id]);
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

    // Announcement
    announcement,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    isSendingAnnouncement,
    handleSetAnnouncement,

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
      {/* Trial Expiration Banner */}
      <TrialBanner />

      {/* Impersonation Banner — Tunisian red for BleSaf, French blue for FiloSoin */}
      {isImpersonating && (
        <div
          className="text-white px-4 py-2 flex items-center justify-between"
          style={{ backgroundColor: webBrand.id === 'france' ? '#002395' : '#E70013' }}
        >
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
            className="px-3 py-1 text-sm bg-white rounded-lg font-medium hover:bg-white/90 transition-colors"
            style={{ color: webBrand.id === 'france' ? '#002395' : '#E70013' }}
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
        {webBrand.id === 'france' ? (
          <AuSuivantDashboard
            queue={queue}
            stats={stats}
            onCallNext={handleCallNext}
            onRemovePatient={handleRemovePatient}
            onReorder={handleReorderPatient}
            onEmergency={(id) => handleReorderPatient(id, 1)}
            isCallingNext={isCallingNext}
            isDoctorPresent={isDoctorPresent}
            onToggleDoctorPresent={handleToggleDoctorPresent}
            isTogglingPresence={isTogglingPresence}
          />
        ) : (
          <ReceptionistDashboard
            queue={queue}
            stats={stats}
            clinic={clinic}
            isDoctorPresent={isDoctorPresent}
            onCallNext={handleCallNext}
            onRemovePatient={handleRemovePatient}
            onReorderPatient={handleReorderPatient}
            onCompleteConsultation={handleCompleteConsultation}
            onToggleDoctorPresent={handleToggleDoctorPresent}
            isCallingNext={isCallingNext}
          />
        )}
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
                  disabled={subscriptionExpired}
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

                {/* Announcement Button */}
                <button
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${
                    announcement
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                  title={t('announcement.buttonLabel')}
                  aria-label={t('announcement.buttonLabel')}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${announcement ? 'text-blue-600' : 'text-gray-400'}`}
                    style={{ fontVariationSettings: announcement ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    campaign
                  </span>
                  <span className="text-sm">{t('announcement.buttonLabel')}</span>
                  {announcement && (
                    <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                  )}
                </button>
              </div>

              {/* Right side: Call Next Button */}
              <button
                onClick={handleCallNext}
                disabled={waitingCount === 0 || isCallingNext || !isDoctorPresent || subscriptionExpired}
                title={subscriptionExpired ? t('trial.expired') : isDoctorPresent ? t('queue.callNext') : t('queue.waitingForDoctor')}
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

      {/* Announcement modal */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onSend={handleSetAnnouncement}
        currentAnnouncement={announcement}
        isLoading={isSendingAnnouncement}
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

      {/* First-patient celebration toast */}
      {/* Daily Recap Overlay - shown once per day on first visit */}
      {showDailyRecap && (
        <DailyRecapOverlay
          doctorName={clinic?.doctorName || clinic?.name || ''}
          onDismiss={() => {
            if (clinic?.id) {
              const today = new Date().toISOString().slice(0, 10);
              localStorage.setItem(`dailyRecap_shown_${clinic.id}`, today);
            }
            setShowDailyRecap(false);
          }}
        />
      )}
    </div>
  );
}
