import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueueStats as QueueStatsType, QueueEntry } from '@/types';
import { QueueStatus } from '@/types';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface QueueStatsProps {
  stats: QueueStatsType;
  onResetStats?: () => Promise<void>;
  isDoctorPresent?: boolean;
  queue?: QueueEntry[];
}

export default function QueueStats({ stats, onResetStats, isDoctorPresent = false, queue = [] }: QueueStatsProps) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // When doctor is absent, add the IN_CONSULTATION patient to waiting count
  const hasInConsultationPatient = queue.some(p => p.status === QueueStatus.IN_CONSULTATION);
  const waitingCount = stats.waiting + (!isDoctorPresent && hasInConsultationPatient ? 1 : 0);

  const handleConfirmReset = async () => {
    if (!onResetStats) return;

    setIsResetting(true);
    try {
      await onResetStats();
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* En Attente */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.waiting')}</p>
              <p className="text-xl sm:text-3xl font-bold text-primary-700 mt-1 sm:mt-2">
                {waitingCount}
              </p>
            </div>
            <div className="order-1 sm:order-2 bg-primary-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
              <span
                className="material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-primary-600 text-xl sm:text-3xl"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                groups
              </span>
            </div>
          </div>
        </div>

        {/* Vus Aujourd'hui */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.seenToday')}</p>
              <p className="text-xl sm:text-3xl font-bold text-green-700 mt-1 sm:mt-2">
                {stats.seen}
              </p>
            </div>
            <div className="order-1 sm:order-2 bg-green-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
              <span
                className="material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-green-600 text-xl sm:text-3xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                check_circle
              </span>
            </div>
          </div>
        </div>

        {/* Attente moyenne (now filtered to today only) */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.avgWaitLabel')}</p>
                {onResetStats && stats.avgWait !== null && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isResetting}
                    className="text-gray-400 hover:text-accent-600 transition-colors disabled:opacity-50"
                    title={t('queue.resetStats')}
                    aria-label={t('queue.resetStats')}
                  >
                    <span
                      className="material-symbols-outlined text-base sm:text-lg"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      {isResetting ? 'sync' : 'restart_alt'}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xl sm:text-3xl font-bold text-accent-700 mt-1 sm:mt-2">
                {stats.avgWait !== null ? `${stats.avgWait}min` : '-'}
              </p>
            </div>
            <div className="order-1 sm:order-2 bg-accent-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
              <span
                className="material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-accent-600 text-xl sm:text-3xl"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                schedule
              </span>
            </div>
          </div>
        </div>

        {/* Non-présentés */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.noShows')}</p>
              <p className={`text-xl sm:text-3xl font-bold mt-1 sm:mt-2 ${stats.noShows > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {stats.noShows}
              </p>
            </div>
            <div className={`order-1 sm:order-2 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0 ${stats.noShows > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <span
                className={`material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-xl sm:text-3xl ${stats.noShows > 0 ? 'text-red-600' : 'text-gray-400'}`}
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                person_off
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Stats Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title={t('queue.resetStats')}
        message={t('queue.confirmResetStats')}
        confirmText={t('queue.resetStats')}
        variant="warning"
        isLoading={isResetting}
      />
    </>
  );
}
