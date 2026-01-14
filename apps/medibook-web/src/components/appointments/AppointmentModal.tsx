import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Appointment, Doctor, Patient, ApiResponse } from '../../types';

interface AppointmentModalProps {
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  doctors: Doctor[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AppointmentModal({
  appointment,
  defaultDate,
  defaultTime,
  doctors,
  onClose,
  onSaved,
}: AppointmentModalProps) {
  const { t } = useTranslation();
  const isEdit = !!appointment;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [doctorId, setDoctorId] = useState(appointment?.doctorId || doctors[0]?.id || '');
  const [patientId, setPatientId] = useState(appointment?.patientId || '');
  const [date, setDate] = useState(
    appointment?.date?.split('T')[0] || defaultDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    appointment?.startTime?.split('T')[1]?.substring(0, 5) || defaultTime || '09:00'
  );
  const [duration, setDuration] = useState(appointment?.duration || 30);
  const [reason, setReason] = useState(appointment?.reason || '');
  const [notes, setNotes] = useState(appointment?.notes || '');

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(appointment?.patient || null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (patientSearch.length < 2) {
        setPatients([]);
        return;
      }

      try {
        const response = await api.getPatients(patientSearch) as ApiResponse<Patient[]>;
        setPatients(response.data);
      } catch (error) {
        console.error('Error searching patients:', error);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientId(patient.id);
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientId) {
      setError(t('errors.patientRequired') || 'Patient is required');
      return;
    }

    setLoading(true);

    try {
      if (isEdit && appointment) {
        await api.updateAppointment(appointment.id, {
          date,
          startTime,
          duration,
          reason,
          notes,
        });
      } else {
        await api.createAppointment({
          doctorId,
          patientId,
          date,
          startTime,
          duration,
          reason,
          notes,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? t('appointment.edit') : t('calendar.newAppointment')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Patient search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointment.patient')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientDropdown(true);
                if (!e.target.value) {
                  setSelectedPatient(null);
                  setPatientId('');
                }
              }}
              onFocus={() => setShowPatientDropdown(true)}
              placeholder={t('patient.search')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isEdit}
            />
            {selectedPatient && (
              <div className="mt-1 text-sm text-gray-500">
                {selectedPatient.phone}
              </div>
            )}

            {/* Patient dropdown */}
            {showPatientDropdown && patients.length > 0 && !isEdit && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-800">{patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointment.doctor')} <span className="text-red-500">*</span>
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isEdit}
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} {doctor.specialty && `- ${doctor.specialty}`}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('appointment.date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('appointment.time')} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointment.duration')}
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={15}>{t('appointment.duration_options.15')}</option>
              <option value={30}>{t('appointment.duration_options.30')}</option>
              <option value={45}>{t('appointment.duration_options.45')}</option>
              <option value={60}>{t('appointment.duration_options.60')}</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointment.reason')}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('appointment.reason')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointment.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('appointment.notes')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
