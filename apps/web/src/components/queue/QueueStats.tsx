import { useTranslation } from 'react-i18next';
import type { QueueStats as QueueStatsType, QueueEntry } from '@/types';
import { QueueStatus } from '@/types';

interface QueueStatsProps {
  stats: QueueStatsType;
  onResetStats?: () => Promise<void>;
  isDoctorPresent?: boolean;
  queue?: QueueEntry[];
}

export default function QueueStats({ stats, isDoctorPresent = false, queue = [] }: QueueStatsProps) {
  const { t } = useTranslation();

  // When doctor is absent, add the IN_CONSULTATION patient to waiting count
  const hasInConsultationPatient = queue.some(p => p.status === QueueStatus.IN_CONSULTATION);
  const waitingCount = stats.waiting + (!isDoctorPresent && hasInConsultationPatient ? 1 : 0);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
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

        {/* Attente moyenne (displayed but inactive for demo) */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 opacity-60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('queue.avgWaitLabel')}</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-400 mt-1 sm:mt-2">
                -
              </p>
            </div>
            <div className="order-1 sm:order-2 bg-gray-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
              <span
                className="material-symbols-outlined w-5 h-5 sm:w-8 sm:h-8 text-gray-400 text-xl sm:text-3xl"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                schedule
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
