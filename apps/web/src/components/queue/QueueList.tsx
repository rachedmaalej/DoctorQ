import { useTranslation } from 'react-i18next';
import type { QueueEntry } from '@/types';
import { QueueStatus } from '@/types';
import clsx from 'clsx';

interface QueueListProps {
  queue: QueueEntry[];
  onRemove: (id: string) => void;
  exitingPatientId?: string | null;
}

// Calculate display position: IN_CONSULTATION shows badge, others show position - 1
function getDisplayPosition(entry: QueueEntry): number | null {
  if (entry.status === QueueStatus.IN_CONSULTATION) {
    return null; // Will show badge instead of position
  }
  return entry.position - 1; // NOTIFIED becomes #1, first WAITING becomes #2, etc.
}

export default function QueueList({ queue, onRemove, exitingPatientId }: QueueListProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING:
        return 'bg-blue-100 text-blue-800';
      case QueueStatus.NOTIFIED:
        return 'bg-yellow-100 text-yellow-800';
      case QueueStatus.IN_CONSULTATION:
        return 'bg-green-100 text-green-800';
      case QueueStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case QueueStatus.NO_SHOW:
        return 'bg-red-100 text-red-800';
      case QueueStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusTranslationKey = (status: QueueStatus): string => {
    // Convert enum value (e.g., "IN_CONSULTATION") to translation key (e.g., "inConsultation")
    return status
      .toLowerCase()
      .split('_')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-gray-500 text-base sm:text-lg">{t('queue.noPatients')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.position')}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.patientName')}
              </th>
              {/* Hide phone column on mobile */}
              <th className="hidden md:table-cell px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.patientPhone')}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.status')}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.arrivedAt')}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queue.map((entry) => (
              <tr
                key={entry.id}
                className={clsx(
                  'transition-all duration-300',
                  entry.id === exitingPatientId && 'queue-row-exit',
                  entry.status === QueueStatus.IN_CONSULTATION && 'bg-green-50',
                  entry.status === QueueStatus.NOTIFIED && 'bg-yellow-50'
                )}
              >
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  {entry.status === QueueStatus.IN_CONSULTATION ? (
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700"
                      title={t('queue.inConsultation')}
                      aria-label={t('queue.inConsultation')}
                    >
                      <span className="material-symbols-outlined text-xl">medical_services</span>
                    </span>
                  ) : (
                    <div className="text-sm sm:text-lg font-bold text-gray-900">#{getDisplayPosition(entry)}</div>
                  )}
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                    {entry.patientName || '-'}
                  </div>
                </td>
                {/* Hide phone column on mobile */}
                <td className="hidden md:table-cell px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.patientPhone}</div>
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <span className={clsx(
                    'px-2 sm:px-3 py-0.5 sm:py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full',
                    getStatusColor(entry.status)
                  )}>
                    {t(`queue.${getStatusTranslationKey(entry.status)}`)}
                  </span>
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {formatTime(entry.arrivedAt)}
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <a
                    href={`/patient/${entry.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-900 hover:bg-primary-50 p-1.5 sm:p-2 rounded-full transition-colors inline-flex items-center justify-center"
                    title={t('queue.viewPatientStatus') || 'View patient status'}
                    aria-label={t('queue.viewPatientStatus') || 'View patient status'}
                  >
                    <span className="material-symbols-outlined text-xl">open_in_new</span>
                  </a>
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 sm:p-2 rounded-full transition-colors inline-flex items-center justify-center"
                    title={t('common.delete')}
                    aria-label={t('common.delete')}
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
