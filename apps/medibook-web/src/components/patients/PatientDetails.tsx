import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Patient, Appointment, ApiResponse } from '../../types';

interface PatientDetailsProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

export default function PatientDetails({
  patient,
  onClose,
  onEdit,
  onDeleted,
}: PatientDetailsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [patient.id]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.getPatientHistory(patient.id) as ApiResponse<Appointment[]>;
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('patient.confirmDelete') || 'Delete this patient?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/patients/${patient.id}`);
      onDeleted();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{patient.name}</h2>
              <p className="text-sm text-gray-500">{patient.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Contact Info */}
          <div className="space-y-2">
            {patient.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <span className="material-symbols-outlined text-gray-400">email</span>
                <span>{patient.email}</span>
              </div>
            )}
            {patient.dateOfBirth && (
              <div className="flex items-center gap-3 text-gray-600">
                <span className="material-symbols-outlined text-gray-400">cake</span>
                <span>{formatDate(patient.dateOfBirth)}</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-3 text-gray-600">
                <span className="material-symbols-outlined text-gray-400">person</span>
                <span>{t(`patient.gender_options.${patient.gender.toLowerCase()}`)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600">
              <span className="material-symbols-outlined text-gray-400">notifications</span>
              <span>{t(`patient.reminder_preference.${patient.reminderPreference.toLowerCase()}`)}</span>
            </div>
          </div>

          {/* Notes */}
          {patient.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">{t('patient.notes')}</div>
              <div className="text-gray-700">{patient.notes}</div>
            </div>
          )}

          {/* Appointment History */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">history</span>
              {t('patient.history')}
            </h3>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-primary-500">
                  progress_activity
                </span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('calendar.noAppointments')}
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 10).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {formatDate(apt.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {apt.doctor?.name} {apt.reason && `- ${apt.reason}`}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        apt.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : apt.status === 'NO_SHOW'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {t(`appointment.status.${apt.status.toLowerCase()}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {t('common.delete')}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  );
}
