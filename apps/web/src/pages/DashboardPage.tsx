import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useQueueStore } from '@/stores/queueStore';
import { useSocket } from '@/hooks/useSocket';
import QueueList from '@/components/queue/QueueList';
import QueueStats from '@/components/queue/QueueStats';
import QRCodeCard from '@/components/queue/QRCodeCard';
import QRCodeModal from '@/components/queue/QRCodeModal';
import MobileDashboard from '@/components/queue/MobileDashboard';
import AddPatientModal from '@/components/queue/AddPatientModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Header from '@/components/layout/Header';
import { MD3FAB } from '@/components/md3/fab';
import { MD3Button } from '@/components/md3/button';
import type { AddPatientData } from '@/types';

// Sample patients for demo
const SAMPLE_PATIENTS: AddPatientData[] = [
  { patientName: 'Rached M', patientPhone: '+21626387742', appointmentTime: '10:00' },
  { patientName: 'Hela B', patientPhone: '+21655234567', appointmentTime: '10:15' },
  { patientName: 'Jalila F', patientPhone: '+21622222567', appointmentTime: '10:30' },
  { patientName: 'Samira K', patientPhone: '+21621999888', appointmentTime: '10:45' },
  { patientName: 'Mouna C', patientPhone: '+21620222111' },
  { patientName: 'Amin K', patientPhone: '+21623555000', appointmentTime: '11:00' },
  { patientName: 'Hejer K', patientPhone: '+21654414141', appointmentTime: '11:30' },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { clinic } = useAuthStore();
  const { queue, stats, fetchQueue, addPatient, callNext, removePatient, reorderPatient, clearQueue, resetStats } = useQueueStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);
  const [patientToRemove, setPatientToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [exitingPatientId, setExitingPatientId] = useState<string | null>(null);
  const [isDoctorPresent, setIsDoctorPresent] = useState(false);
  const [isFillingQueue, setIsFillingQueue] = useState(false);

  // Count waiting patients for FAB disabled state
  const waitingCount = queue.filter(p => p.status === 'WAITING' || p.status === 'NOTIFIED').length;

  // Set up Socket.io connection for real-time updates
  const { joinClinicRoom } = useSocket({
    onQueueUpdated: (data) => {
      console.log('Dashboard received queue:updated event, refreshing queue');
      useQueueStore.getState().setQueue(data.queue, data.stats);
    },
  });

  useEffect(() => {
    // Fetch initial queue data
    fetchQueue();
  }, []); // Only run once on mount

  useEffect(() => {
    // Join clinic room for real-time updates
    console.log('[Dashboard] useEffect - clinic?.id:', clinic?.id, 'typeof joinClinicRoom:', typeof joinClinicRoom);
    if (clinic?.id) {
      const token = localStorage.getItem('auth_token');
      console.log('[Dashboard] Token from localStorage:', token ? 'present' : 'missing');
      if (token) {
        console.log('[Dashboard] Calling joinClinicRoom with:', clinic.id);
        joinClinicRoom(clinic.id, token);
        console.log('[Dashboard] joinClinicRoom call completed');
      }
    }
  }, [clinic?.id, joinClinicRoom]); // Re-run when clinic ID or joinClinicRoom changes

  const handleCallNext = async () => {
    if (isCallingNext) return; // Prevent rapid clicks

    try {
      setIsCallingNext(true);

      // Find current IN_CONSULTATION patient for exit animation
      const currentPatient = queue.find(p => p.status === 'IN_CONSULTATION');

      if (currentPatient) {
        // Start exit animation
        setExitingPatientId(currentPatient.id);

        // Wait for animation to complete (400ms)
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Call API (this will trigger real state update via Socket.io)
      await callNext();

      // Clear exiting state
      setExitingPatientId(null);
    } catch (error) {
      setExitingPatientId(null);
      console.error('Failed to call next patient:', error);
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleRemovePatient = (id: string) => {
    setPatientToRemove(id);
    setIsConfirmModalOpen(true);
  };

  const confirmRemovePatient = async () => {
    if (!patientToRemove) return;

    setIsRemoving(true);
    try {
      await removePatient(patientToRemove);
      setIsConfirmModalOpen(false);
      setPatientToRemove(null);
    } catch (error) {
      console.error('Failed to remove patient:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemovePatient = () => {
    setIsConfirmModalOpen(false);
    setPatientToRemove(null);
  };

  const confirmClearQueue = async () => {
    setIsClearing(true);
    try {
      await clearQueue();
      setIsClearQueueModalOpen(false);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const cancelClearQueue = () => {
    setIsClearQueueModalOpen(false);
  };

  // Fill queue with sample patients for demo
  const handleFillQueue = async () => {
    if (isFillingQueue) return;
    setIsFillingQueue(true);
    try {
      for (const patient of SAMPLE_PATIENTS) {
        try {
          await addPatient(patient);
        } catch (error) {
          // Skip if patient already in queue
          console.log(`Skipped ${patient.patientName}: already in queue or error`);
        }
      }
    } finally {
      setIsFillingQueue(false);
    }
  };

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
          onReorder={reorderPatient}
          onEmergency={(id) => reorderPatient(id, 1)}
          onShowQR={() => setIsQRModalOpen(true)}
          onFillQueue={handleFillQueue}
          isCallingNext={isCallingNext}
          isDoctorPresent={isDoctorPresent}
          onToggleDoctorPresent={() => setIsDoctorPresent(!isDoctorPresent)}
          isFillingQueue={isFillingQueue}
        />
      </div>

      {/* Desktop Layout - hidden on mobile */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('queue.title')}</h1>
          <p className="mt-1 sm:mt-2 text-gray-600">
            {clinic?.name} - {clinic?.doctorName}
          </p>
        </div>

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
                  onClick={() => setIsDoctorPresent(!isDoctorPresent)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${
                    isDoctorPresent
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                  title={isDoctorPresent ? t('queue.doctorArrived') : t('queue.waitingForDoctor')}
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
                  {/* Toggle indicator */}
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'translate-x-4' : 'translate-x-0'}`} />
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
                <span className="hidden sm:inline">{isFillingQueue ? 'Filling...' : 'Fill Queue (Demo)'}</span>
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
              onReorder={reorderPatient}
              onEmergency={(id) => reorderPatient(id, 1)}
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
    </div>
  );
}
