import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Appointment, CheckInResponse, ApiResponse } from '../../types';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  CONFIRMED: { bg: 'bg-teal-100', text: 'text-teal-700' },
  CHECKED_IN: { bg: 'bg-amber-100', text: 'text-amber-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function AppointmentDetails({
  appointment,
  onClose,
  onEdit,
  onStatusChange,
}: AppointmentDetailsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await api.updateAppointment(appointment.id, { status: newStatus });
      onStatusChange();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await api.checkInAppointment(appointment.id) as ApiResponse<CheckInResponse>;
      setCheckInResult(response.data);
      onStatusChange();
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('appointment.confirmCancel') || 'Cancel this appointment?')) {
      return;
    }
    setLoading(true);
    try {
      await api.cancelAppointment(appointment.id);
      onStatusChange();
    } catch (error) {
      console.error('Error cancelling:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = statusColors[appointment.status] || statusColors.SCHEDULED;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-500">event</span>
            <h2 className="text-lg font-semibold text-gray-800">
              {t('appointment.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {t(`appointment.status.${appointment.status.toLowerCase()}`)}
            </span>
            {appointment.queueEntryId && (
              <span className="text-sm text-gray-500">
                Queue: #{checkInResult?.position || '...'}
              </span>
            )}
          </div>

          {/* Check-in result */}
          {checkInResult && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="font-medium">Patient checked in</span>
              </div>
              <div className="mt-2 text-sm text-green-600">
                Position: #{checkInResult.position} | Wait: ~{checkInResult.estimatedWait} min
              </div>
            </div>
          )}

          {/* Patient info */}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-gray-400">person</span>
            <div>
              <div className="font-medium text-gray-800">
                {appointment.patient?.name}
              </div>
              <div className="text-sm text-gray-500">
                {appointment.patient?.phone}
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-gray-400">medical_services</span>
            <div>
              <div className="font-medium text-gray-800">
                {appointment.doctor?.name}
              </div>
              {appointment.doctor?.specialty && (
                <div className="text-sm text-gray-500">
                  {appointment.doctor.specialty}
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-gray-400">schedule</span>
            <div>
              <div className="font-medium text-gray-800">
                {formatDate(appointment.date)}
              </div>
              <div className="text-sm text-gray-500">
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                ({appointment.duration} min)
              </div>
            </div>
          </div>

          {/* Reason */}
          {appointment.reason && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-gray-400">description</span>
              <div>
                <div className="text-sm text-gray-500">{t('appointment.reason')}</div>
                <div className="text-gray-800">{appointment.reason}</div>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-gray-400">note</span>
              <div>
                <div className="text-sm text-gray-500">{t('appointment.notes')}</div>
                <div className="text-gray-800">{appointment.notes}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* Primary actions based on status */}
          {appointment.status === 'SCHEDULED' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                {t('appointment.actions.confirm')}
              </button>
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                {t('appointment.actions.checkIn')}
              </button>
            </div>
          )}

          {appointment.status === 'CONFIRMED' && (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              {t('appointment.actions.checkIn')}
            </button>
          )}

          {appointment.status === 'CHECKED_IN' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start Consultation
            </button>
          )}

          {appointment.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Complete
            </button>
          )}

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t('common.edit')}
            </button>
            {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                {t('appointment.cancel')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
