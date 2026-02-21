import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';
import AuSuivantDashboard from '@/components/ausuivant/AuSuivantDashboard';
import DesktopDashboard from '@/components/dashboard/DesktopDashboard';
import AddPatientModal from '@/components/queue/AddPatientModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AnnouncementModal from '@/components/queue/AnnouncementModal';
import { Toast } from '@/components/ui/Toast';
import TrialBanner from '@/components/ui/TrialBanner';
import DevStatsTooltip from '@/components/dashboard/DevStatsTooltip';
import { QueueStatus } from '@/types';
export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic, isImpersonating, impersonatedClinicName, stopImpersonation } = useAuthStore();
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Check subscription status
  useEffect(() => {
    api.getSubscription()
      .then(sub => {
        setSubscriptionExpired(!sub.canUseApp);
      })
      .catch(() => {});
  }, []);

  const {
    // Store data
    queue,
    stats,
    waitingCount,

    // Modal state
    isAddModalOpen,
    setIsAddModalOpen,
    isConfirmModalOpen,
    isClearQueueModalOpen,

    // Loading states
    isInitialLoading,
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

    // Toast state
    toast,
    hideToast,
  } = useDashboard();

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>
      {/* Trial Expiration Banner */}
      <TrialBanner />

      {/* Impersonation Banner */}
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
            <span className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: t('common.viewingAs', { name: impersonatedClinicName }) }} />
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 text-sm bg-white rounded-lg font-medium hover:bg-white/90 transition-colors"
            style={{ color: webBrand.id === 'france' ? '#002395' : '#E70013' }}
          >
            {t('common.exitToAdmin')}
          </button>
        </div>
      )}

      {/* Mobile Dashboard - visible only on small screens */}
      {isInitialLoading ? (
        <div className="flex items-center justify-center" style={{ height: 'calc(100dvh - 48px)' }}>
          <span className="material-symbols-rounded animate-spin" style={{ fontSize: 32, color: '#9E9B90' }}>progress_activity</span>
        </div>
      ) : (
      <>
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
            isTogglingPresence={isTogglingPresence}
            isCallingNext={isCallingNext}
          />
        )}
      </div>

      {/* Desktop Dashboard - hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopDashboard
          queue={queue}
          stats={stats}
          waitingCount={waitingCount}
          isDoctorPresent={isDoctorPresent}
          isCallingNext={isCallingNext}
          isTogglingPresence={isTogglingPresence}
          exitingPatientId={exitingPatientId}
          announcement={announcement}
          subscriptionExpired={subscriptionExpired}
          onCallNext={handleCallNext}
          onRemovePatient={handleRemovePatient}
          onReorderPatient={handleReorderPatient}
          onEmergency={(id) => handleReorderPatient(id, 1)}
          onCompleteConsultation={handleCompleteConsultation}
          onToggleDoctorPresent={handleToggleDoctorPresent}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
        />
      </div>
      </>
      )}

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

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Dev Stats Tooltip */}
      {import.meta.env.DEV && (
        <DevStatsTooltip
          stats={stats}
          currentConsultStartedAt={queue.find(p => p.status === QueueStatus.IN_CONSULTATION)?.calledAt}
        />
      )}

    </div>
  );
}
