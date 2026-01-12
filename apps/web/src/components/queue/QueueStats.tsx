import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueueStats as QueueStatsType } from '@/types';

interface QueueStatsProps {
  stats: QueueStatsType;
  onResetStats?: () => Promise<void>;
}

export default function QueueStats({ stats, onResetStats }: QueueStatsProps) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetStats = async () => {
    if (!onResetStats || isResetting) return;

    if (!confirm(t('queue.confirmResetStats'))) return;

    setIsResetting(true);
    try {
      await onResetStats();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {/* En Attente */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.waiting')}</p>
            <p className="text-xl sm:text-3xl font-bold text-primary-700 mt-1 sm:mt-2">{stats.waiting}</p>
          </div>
          <div className="order-1 sm:order-2 bg-primary-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
            <svg className="w-5 h-5 sm:w-8 sm:h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dernière consultation */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.lastConsultation')}</p>
            <p className="text-xl sm:text-3xl font-bold text-green-700 mt-1 sm:mt-2">
              {stats.lastConsultationMins !== null ? `${stats.lastConsultationMins}min` : '-'}
            </p>
          </div>
          <div className="order-1 sm:order-2 bg-green-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
            <span className="material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-green-600 text-xl sm:text-3xl">
              stethoscope
            </span>
          </div>
        </div>
      </div>

      {/* Attente moyenne */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 sm:order-1">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.avgWaitLabel')}</p>
              {onResetStats && stats.avgWait !== null && (
                <button
                  onClick={handleResetStats}
                  disabled={isResetting}
                  className="text-gray-400 hover:text-accent-600 transition-colors disabled:opacity-50"
                  title={t('queue.resetStats')}
                  aria-label={t('queue.resetStats')}
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">
                    {isResetting ? 'sync' : 'restart_alt'}
                  </span>
                </button>
              )}
            </div>
            <p className="text-xl sm:text-3xl font-bold text-accent-700 mt-1 sm:mt-2">
              {stats.avgWait ? `${stats.avgWait}min` : '-'}
            </p>
          </div>
          <div className="order-1 sm:order-2 bg-accent-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
            <svg className="w-5 h-5 sm:w-8 sm:h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
