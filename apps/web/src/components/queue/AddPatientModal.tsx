import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueueStore } from '@/stores/queueStore';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const { t } = useTranslation();
  const { addPatient } = useQueueStore();
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [patientName, setPatientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneNumber = (value: string): string => {
    // Always start with +216
    const prefix = '+216 ';

    // If user tries to delete the prefix, restore it
    if (!value.startsWith('+216')) {
      return prefix;
    }

    // Remove all non-digit characters except + at the start
    const digitsOnly = value.slice(4).replace(/\D/g, '');

    // Limit to 8 digits (Tunisian phone numbers)
    const limitedDigits = digitsOnly.slice(0, 8);

    // Format: +216 XX XXX XXX
    let formatted = prefix;

    if (limitedDigits.length > 0) {
      formatted += limitedDigits.slice(0, 2); // First 2 digits
    }
    if (limitedDigits.length > 2) {
      formatted += ' ' + limitedDigits.slice(2, 5); // Next 3 digits
    }
    if (limitedDigits.length > 5) {
      formatted += ' ' + limitedDigits.slice(5, 8); // Last 3 digits
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPatientPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number has exactly 8 digits
    const digitsOnly = patientPhone.slice(4).replace(/\D/g, '');
    if (digitsOnly.length !== 8) {
      setError(t('checkin.invalidPhone'));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting patient:', { patientPhone, patientName });
      await addPatient({
        patientPhone,
        patientName: patientName || undefined,
      });

      // Reset form and close modal
      setPatientPhone('+216 ');
      setPatientName('');
      onClose();
    } catch (err: any) {
      console.error('Add patient error:', err);
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
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            />
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
