import { useTranslation } from 'react-i18next';
import type { QueueEntry } from '@/types';
import { QueueStatus } from '@/types';
import clsx from 'clsx';

interface QueueListProps {
  queue: QueueEntry[];
  onRemove: (id: string) => void;
  onReorder?: (id: string, newPosition: number) => void;
  onEmergency?: (id: string) => void;
  exitingPatientId?: string | null;
  isDoctorPresent?: boolean;
}

// Calculate display position based on doctor presence
// When doctor is present: IN_CONSULTATION shows badge, others show position - 1
// When doctor is absent: everyone shows their position number (first = #1)
function getDisplayPosition(entry: QueueEntry, isDoctorPresent: boolean): number | null {
  if (isDoctorPresent && entry.status === QueueStatus.IN_CONSULTATION) {
    return null; // Will show badge instead of position
  }
  if (isDoctorPresent) {
    return entry.position - 1; // NOTIFIED becomes #1, first WAITING becomes #2, etc.
  }
  // Doctor not present: show actual position (first patient = #1)
  return entry.position;
}

export default function QueueList({ queue, onRemove, onReorder, onEmergency, exitingPatientId, isDoctorPresent = false }: QueueListProps) {
  const { t } = useTranslation();

  // Format appointment time for display
  const formatAppointmentTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Get display status - when doctor is absent, IN_CONSULTATION shows as NOTIFIED
  const getDisplayStatus = (status: QueueStatus): QueueStatus => {
    if (!isDoctorPresent && status === QueueStatus.IN_CONSULTATION) {
      return QueueStatus.NOTIFIED;
    }
    return status;
  };

  const getStatusColor = (status: QueueStatus) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
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
    const displayStatus = getDisplayStatus(status);
    // Convert enum value (e.g., "IN_CONSULTATION") to translation key (e.g., "inConsultation")
    return displayStatus
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
                {t('queue.appointmentTime') || 'RDV'}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.arrivedAt')}
              </th>
              <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('queue.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queue.map((entry) => {
              const displayStatus = getDisplayStatus(entry.status);
              return (
              <tr
                key={entry.id}
                className={clsx(
                  entry.id === exitingPatientId && 'queue-row-exit',
                  exitingPatientId && entry.id !== exitingPatientId && 'queue-row-shift',
                  displayStatus === QueueStatus.IN_CONSULTATION && 'bg-green-50',
                  displayStatus === QueueStatus.NOTIFIED && 'bg-yellow-50'
                )}
              >
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  {isDoctorPresent && entry.status === QueueStatus.IN_CONSULTATION ? (
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700"
                      title={t('queue.inConsultation')}
                      aria-label={t('queue.inConsultation')}
                    >
                      <span className="material-symbols-outlined text-xl">medical_services</span>
                    </span>
                  ) : (
                    <div className="text-sm sm:text-lg font-bold text-gray-900">#{getDisplayPosition(entry, isDoctorPresent)}</div>
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
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                  {entry.appointmentTime ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatAppointmentTime(entry.appointmentTime)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">{t('queue.walkIn') || 'Sans RDV'}</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {formatTime(entry.arrivedAt)}
                </td>
                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {/* Emergency button - move patient to see doctor immediately */}
                    {onEmergency && entry.status !== QueueStatus.IN_CONSULTATION && entry.position > 1 && (
                      <button
                        onClick={() => onEmergency(entry.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-full transition-colors inline-flex items-center justify-center"
                        title={t('queue.emergency')}
                        aria-label={t('queue.emergency')}
                      >
                        <span className="material-symbols-outlined text-lg">e911_emergency</span>
                      </button>
                    )}
                    {/* Reorder controls */}
                    {onReorder && entry.position > 1 && (
                      <button
                        onClick={() => onReorder(entry.id, entry.position - 1)}
                        className="text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-1 rounded-full transition-colors inline-flex items-center justify-center"
                        title={t('queue.moveUp') || 'Move up'}
                        aria-label={t('queue.moveUp') || 'Move up'}
                      >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                    )}
                    {onReorder && entry.position < queue.length && (
                      <button
                        onClick={() => onReorder(entry.id, entry.position + 1)}
                        className="text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-1 rounded-full transition-colors inline-flex items-center justify-center"
                        title={t('queue.moveDown') || 'Move down'}
                        aria-label={t('queue.moveDown') || 'Move down'}
                      >
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 sm:p-2 rounded-full transition-colors inline-flex items-center justify-center"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
