import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueueStore } from '@/stores/queueStore';
import { logger } from '@/lib/logger';
import { formatTunisianPhone, isValidTunisianPhone, extractPhoneDigits, DEFAULT_PHONE_VALUE } from '@/lib/phone';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const { t } = useTranslation();
  const { addPatient } = useQueueStore();
  const [patientPhone, setPatientPhone] = useState(DEFAULT_PHONE_VALUE);
  const [patientName, setPatientName] = useState('');
  const [appointmentHour, setAppointmentHour] = useState('');
  const [appointmentMinute, setAppointmentMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate hours 08-19 (typical clinic hours) and minutes in 15-min increments (00, 15, 30, 45)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 8).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  // Combine hour and minute into HH:MM format for submission
  const getAppointmentTime = () => {
    if (appointmentHour && appointmentMinute) {
      return `${appointmentHour}:${appointmentMinute}`;
    }
    return undefined;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTunisianPhone(e.target.value);
    setPatientPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number has exactly 8 digits
    if (!isValidTunisianPhone(patientPhone)) {
      setError(t('checkin.invalidPhone'));
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentTime = getAppointmentTime();
      const normalizedPhone = extractPhoneDigits(patientPhone);
      logger.log('Submitting patient:', { patientPhone: normalizedPhone, patientName, appointmentTime });
      await addPatient({
        patientPhone: normalizedPhone,
        patientName: patientName || undefined,
        appointmentTime: appointmentTime,
      });

      // Reset form and close modal
      setPatientPhone(DEFAULT_PHONE_VALUE);
      setPatientName('');
      setAppointmentHour('');
      setAppointmentMinute('');
      onClose();
    } catch (err: any) {
      logger.error('Add patient error:', err);
      if (err.code === 'ALREADY_CHECKED_IN') {
        setError(t('queue.patientAlreadyInQueue'));
      } else {
        setError(err.message || 'Failed to add patient');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('queue.addPatient')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('queue.patientPhone')} *
            </label>
            <input
              id="patientPhone"
              type="tel"
              value={patientPhone}
              onChange={handlePhoneChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+216 XX XXX XXX"
              aria-describedby="phone-format-hint"
            />
            <p id="phone-format-hint" className="mt-1 text-sm text-gray-500">
              {t('checkin.phoneHelp')}
            </p>
          </div>

          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('queue.patientName')} ({t('checkin.name')})
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('checkin.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('queue.appointmentTime')}
            </label>
            <div className="flex gap-2 items-center">
              {/* Hours select (00-23) */}
              <select
                value={appointmentHour}
                onChange={(e) => setAppointmentHour(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">--</option>
                {hours.map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
              <span className="text-xl font-bold text-gray-500">:</span>
              {/* Minutes select (00-59) */}
              <select
                value={appointmentMinute}
                onChange={(e) => setAppointmentMinute(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">--</option>
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t('queue.appointmentTimeHint')}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
