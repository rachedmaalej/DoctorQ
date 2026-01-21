import { useTranslation } from 'react-i18next';
import type { QueueEntry } from '@/types';
import { QueueStatus } from '@/types';
import clsx from 'clsx';
import { formatTime } from '@/lib/time';

interface QueueListProps {
  queue: QueueEntry[];
  onRemove: (id: string) => void;
  onReorder?: (id: string, newPosition: number) => void;
  onEmergency?: (id: string) => void;
  onCompleteConsultation?: () => void;
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

// Calculate wait time in minutes from arrival time
function getWaitTimeMinutes(arrivedAt: string): number {
  const arrived = new Date(arrivedAt);
  const now = new Date();
  return Math.floor((now.getTime() - arrived.getTime()) / 60000);
}

// Format wait time for display
function formatWaitTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}min`;
}

export default function QueueList({ queue, onRemove, onReorder, onEmergency, onCompleteConsultation, exitingPatientId, isDoctorPresent = false }: QueueListProps) {
  const { t } = useTranslation();

  // Format appointment time for display
  const formatAppointmentTime = (dateString: string | null) => {
    if (!dateString) return null;
    return formatTime(dateString);
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

  // Render action button with consistent styling for mobile
  const renderActionButton = (
    onClick: () => void,
    icon: string,
    label: string,
    colorClass: string,
    filled: boolean = false
  ) => (
    <button
      onClick={onClick}
      className={clsx(
        'w-11 h-11 rounded-xl transition-colors inline-flex items-center justify-center',
        colorClass
      )}
      title={label}
      aria-label={label}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    </button>
  );

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {queue.map((entry) => {
          const displayStatus = getDisplayStatus(entry.status);
          const displayPosition = getDisplayPosition(entry, isDoctorPresent);
          const waitMinutes = getWaitTimeMinutes(entry.arrivedAt);
          const isInConsultation = entry.status === QueueStatus.IN_CONSULTATION;
          const isLastPatient = isInConsultation &&
            queue.filter(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED).length === 0;

          return (
            <div
              key={entry.id}
              className={clsx(
                'bg-white rounded-xl shadow-sm border overflow-hidden',
                entry.id === exitingPatientId && 'queue-row-exit',
                exitingPatientId && entry.id !== exitingPatientId && 'queue-row-shift',
                displayStatus === QueueStatus.IN_CONSULTATION && 'border-green-300 bg-green-50',
                displayStatus === QueueStatus.NOTIFIED && 'border-yellow-300 bg-yellow-50',
                displayStatus === QueueStatus.WAITING && 'border-gray-200'
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Position badge */}
                  <div className="flex-shrink-0">
                    {isDoctorPresent && isInConsultation ? (
                      <span
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-700"
                        title={t('queue.inConsultation')}
                      >
                        <span className="material-symbols-outlined text-2xl">medical_services</span>
                      </span>
                    ) : (
                      <span className={clsx(
                        'inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold',
                        displayStatus === QueueStatus.NOTIFIED
                          ? 'bg-green-500 text-white'
                          : 'bg-primary-100 text-primary-700'
                      )}>
                        #{displayPosition}
                      </span>
                    )}
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="font-semibold text-gray-900 text-base truncate">
                      {entry.patientName || t('queue.anonymous')}
                    </div>

                    {/* Info rows stacked vertically */}
                    <div className="mt-2 space-y-1">
                      {/* Arrival time */}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span className="material-symbols-outlined text-base text-gray-400">login</span>
                        <span>{formatTime(entry.arrivedAt)}</span>
                      </div>

                      {/* Appointment time */}
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-base text-purple-400">event</span>
                        {entry.appointmentTime ? (
                          <span className="text-purple-700 font-medium">{formatAppointmentTime(entry.appointmentTime)}</span>
                        ) : (
                          <span className="text-gray-400">{t('queue.walkIn') || 'Sans RDV'}</span>
                        )}
                      </div>

                      {/* Wait time */}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span className="material-symbols-outlined text-base text-gray-400">hourglass_empty</span>
                        <span>{formatWaitTime(waitMinutes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - 2x2 grid for big fingers */}
                  <div className="flex-shrink-0 grid grid-cols-2 gap-1.5">
                    {/* Move up */}
                    {onReorder && entry.position > 1 ? (
                      renderActionButton(
                        () => onReorder(entry.id, entry.position - 1),
                        'arrow_upward',
                        t('queue.moveUp') || 'Move up',
                        'text-gray-500 hover:text-primary-600 hover:bg-primary-50 bg-gray-100'
                      )
                    ) : (
                      <div className="w-11 h-11" /> // Placeholder for alignment
                    )}

                    {/* Move down */}
                    {onReorder && entry.position < queue.length ? (
                      renderActionButton(
                        () => onReorder(entry.id, entry.position + 1),
                        'arrow_downward',
                        t('queue.moveDown') || 'Move down',
                        'text-gray-500 hover:text-primary-600 hover:bg-primary-50 bg-gray-100'
                      )
                    ) : (
                      <div className="w-11 h-11" /> // Placeholder for alignment
                    )}

                    {/* Emergency */}
                    {onEmergency && !isInConsultation && entry.position > 1 ? (
                      renderActionButton(
                        () => onEmergency(entry.id),
                        'emergency',
                        t('queue.emergency'),
                        'text-amber-600 hover:text-amber-700 hover:bg-amber-100 bg-amber-50'
                      )
                    ) : (
                      <div className="w-11 h-11" /> // Placeholder for alignment
                    )}

                    {/* Delete or Complete */}
                    {isLastPatient && onCompleteConsultation ? (
                      renderActionButton(
                        onCompleteConsultation,
                        'check_circle',
                        t('queue.completeConsultation'),
                        'text-green-600 hover:text-green-700 hover:bg-green-100 bg-green-50',
                        true
                      )
                    ) : (
                      renderActionButton(
                        () => onRemove(entry.id),
                        'close',
                        t('common.delete'),
                        'text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50'
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.position')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.patientName')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.patientPhone')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.status')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.appointmentTime') || 'RDV'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('queue.arrivedAt')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-3 py-4 whitespace-nowrap">
                    {isDoctorPresent && entry.status === QueueStatus.IN_CONSULTATION ? (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700"
                        title={t('queue.inConsultation')}
                        aria-label={t('queue.inConsultation')}
                      >
                        <span className="material-symbols-outlined text-xl">medical_services</span>
                      </span>
                    ) : (
                      <div className="text-lg font-bold text-gray-900">#{getDisplayPosition(entry, isDoctorPresent)}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.patientName || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.patientPhone}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={clsx(
                        'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                        getStatusColor(entry.status)
                      )}>
                        {t(`queue.${getStatusTranslationKey(entry.status)}`)}
                      </span>
                      {entry.status === QueueStatus.IN_CONSULTATION &&
                       queue.filter(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED).length === 0 && (
                        <span className="text-xs text-gray-500">
                          ({t('queue.lastPatient')})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {entry.appointmentTime ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatAppointmentTime(entry.appointmentTime)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">{t('queue.walkIn') || 'Sans RDV'}</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(entry.arrivedAt)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {onEmergency && entry.status !== QueueStatus.IN_CONSULTATION && entry.position > 1 && (
                        <button
                          onClick={() => onEmergency(entry.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                          title={t('queue.emergency')}
                          aria-label={t('queue.emergency')}
                        >
                          <span className="material-symbols-outlined text-lg">e911_emergency</span>
                        </button>
                      )}
                      {onReorder && entry.position > 1 && (
                        <button
                          onClick={() => onReorder(entry.id, entry.position - 1)}
                          className="text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                          title={t('queue.moveUp') || 'Move up'}
                          aria-label={t('queue.moveUp') || 'Move up'}
                        >
                          <span className="material-symbols-outlined text-lg">arrow_upward</span>
                        </button>
                      )}
                      {onReorder && entry.position < queue.length && (
                        <button
                          onClick={() => onReorder(entry.id, entry.position + 1)}
                          className="text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                          title={t('queue.moveDown') || 'Move down'}
                          aria-label={t('queue.moveDown') || 'Move down'}
                        >
                          <span className="material-symbols-outlined text-lg">arrow_downward</span>
                        </button>
                      )}
                      {entry.status === QueueStatus.IN_CONSULTATION &&
                       queue.filter(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED).length === 0 &&
                       onCompleteConsultation ? (
                        <button
                          onClick={onCompleteConsultation}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                          title={t('queue.completeConsultation')}
                          aria-label={t('queue.completeConsultation')}
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onRemove(entry.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
