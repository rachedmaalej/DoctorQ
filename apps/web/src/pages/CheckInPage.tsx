import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

// Format phone number as "+216 XX XXX XXX"
function formatTunisianPhone(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // If user cleared everything, return the prefix
  if (digits.length === 0) {
    return '+216 ';
  }

  // Handle case where digits start with 216
  let phoneDigits = digits;
  if (digits.startsWith('216')) {
    phoneDigits = digits.slice(3);
  }

  // Build formatted string: +216 XX XXX XXX
  let formatted = '+216 ';

  if (phoneDigits.length > 0) {
    // First 2 digits (XX)
    formatted += phoneDigits.slice(0, 2);
  }

  if (phoneDigits.length > 2) {
    // Next 3 digits (XXX)
    formatted += ' ' + phoneDigits.slice(2, 5);
  }

  if (phoneDigits.length > 5) {
    // Last 3 digits (XXX)
    formatted += ' ' + phoneDigits.slice(5, 8);
  }

  return formatted;
}

// Extract raw phone number for API submission
function extractPhoneDigits(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '');
  if (digits.startsWith('216')) {
    return '+' + digits;
  }
  return '+216' + digits;
}

export default function CheckInPage() {
  const { t } = useTranslation();
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  // Initialize with prefilled "+216 "
  const [patientPhone, setPatientPhone] = useState('+216 ');
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');

  // Fetch clinic info
  useEffect(() => {
    if (clinicId) {
      api.getClinicInfo(clinicId)
        .then((info) => {
          if (info.name) setClinicName(info.name);
        })
        .catch(() => {
          // Silently fail - clinic name is optional display
        });
    }
  }, [clinicId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Don't allow removing the "+216 " prefix
    if (inputValue.length < 5) {
      setPatientPhone('+216 ');
      return;
    }

    // Format the phone number
    const formatted = formatTunisianPhone(inputValue);
    setPatientPhone(formatted);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent backspace from deleting the "+216 " prefix
    const input = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && input.selectionStart !== null && input.selectionStart <= 5) {
      e.preventDefault();
    }
  };

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Move cursor to end on focus (only on desktop, skip on mobile to avoid refresh issues)
    const input = e.target;
    // Check if not a touch device to avoid mobile browser issues
    if (!('ontouchstart' in window)) {
      setTimeout(() => {
        input.selectionStart = input.value.length;
        input.selectionEnd = input.value.length;
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!clinicId) {
        throw new Error('Invalid clinic ID');
      }

      // Extract digits and validate
      const phoneDigits = patientPhone.replace(/\D/g, '');
      const localDigits = phoneDigits.startsWith('216') ? phoneDigits.slice(3) : phoneDigits;

      if (localDigits.length !== 8) {
        throw new Error(t('checkin.invalidPhone'));
      }

      const result = await api.checkIn(clinicId, {
        patientPhone: extractPhoneDigits(patientPhone),
        patientName: patientName || undefined,
      });

      // Redirect to patient status page
      navigate(`/patient/${result.id}`);
    } catch (err: any) {
      console.error('Check-in error:', err);

      if (err.code === 'ALREADY_CHECKED_IN') {
        setError(t('checkin.alreadyCheckedIn') || 'You are already checked in');
      } else if (err.code === 'CLINIC_NOT_FOUND') {
        setError(t('checkin.clinicNotFound') || 'Clinic not found');
      } else {
        setError(err.message || t('checkin.error') || 'Failed to check in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-3 relative overflow-hidden">
      {/* Language Switcher - Top corner */}
      <div className="absolute top-3 ltr:right-3 rtl:left-3 z-10">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full">
        {/* Clinic Name Header */}
        {clinicName && (
          <div className="flex items-center justify-center gap-2 mb-3 text-gray-600">
            <span className="material-symbols-outlined text-xl text-primary-500">medical_services</span>
            <span className="text-sm font-medium">{clinicName}</span>
          </div>
        )}
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-primary-500 to-teal-500 px-5 py-4 text-white text-center">
            {/* Clinic Icon Badge */}
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-2xl text-white">local_hospital</span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold">
              {t('checkin.title')}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">

            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="patientPhone"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"
              >
                <span className="material-symbols-outlined text-base text-gray-500">phone</span>
                {t('checkin.phoneNumber')} *
              </label>
              <input
                type="tel"
                id="patientPhone"
                inputMode="tel"
                value={patientPhone}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                onFocus={handlePhoneFocus}
                placeholder={t('checkin.phonePlaceholder')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base tracking-wide"
                required
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor="patientName"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"
              >
                <span className="material-symbols-outlined text-base text-gray-500">person</span>
                {t('checkin.name')} <span className="text-gray-400 font-normal">{t('checkin.nameOptional')}</span>
              </label>
              <input
                type="text"
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t('checkin.namePlaceholder')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
              {isLoading ? t('common.loading') : t('checkin.submitButton')}
            </button>

            {/* Privacy & Notification combined */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                {t('checkin.privacy')}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary-500">notifications_active</span>
                {t('checkin.notificationPromise')}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
