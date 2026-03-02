import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { formatTunisianPhone, extractPhoneDigits, isValidTunisianPhone, DEFAULT_PHONE_VALUE } from '@/lib/phone';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function CheckInPage() {
  const { t } = useTranslation();
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const [patientPhone, setPatientPhone] = useState(DEFAULT_PHONE_VALUE);
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clinic info state
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [isDoctorPresent, setIsDoctorPresent] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [avgConsultationMins, setAvgConsultationMins] = useState(0);
  const [clinicStatus, setClinicStatus] = useState<'loading' | 'active' | 'inactive' | 'not_found'>('loading');

  useEffect(() => {
    if (clinicId) {
      api.getClinicInfo(clinicId)
        .then((info) => {
          if (info.name) setClinicName(info.name);
          setDoctorName(info.doctorName);
          setSpecialty(info.specialty);
          setIsDoctorPresent(info.isDoctorPresent);
          setWaitingCount(info.waitingCount);
          setAvgConsultationMins(info.avgConsultationMins);
          setClinicStatus('active');
        })
        .catch((err: any) => {
          if (err.code === 'CLINIC_INACTIVE') {
            setClinicStatus('inactive');
          } else if (err.code === 'CLINIC_NOT_FOUND') {
            setClinicStatus('not_found');
          } else {
            setClinicStatus('active'); // Fallback: let them try
          }
        });
    }
  }, [clinicId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue.length < 5) {
      setPatientPhone(DEFAULT_PHONE_VALUE);
      return;
    }
    const formatted = formatTunisianPhone(inputValue);
    setPatientPhone(formatted);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && input.selectionStart !== null && input.selectionStart <= 5) {
      e.preventDefault();
    }
  };

  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
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

      if (!isValidTunisianPhone(patientPhone)) {
        throw new Error(t('checkin.invalidPhone'));
      }

      const result = await api.checkIn(clinicId, {
        patientPhone: extractPhoneDigits(patientPhone),
        patientName: patientName || undefined,
      });

      navigate(`/patient/${result.id}`);
    } catch (err: any) {
      logger.error('Check-in error:', err);

      if (err.code === 'ALREADY_CHECKED_IN' && err.data?.id) {
        navigate(`/patient/${err.data.id}`);
        return;
      } else if (err.code === 'ALREADY_CHECKED_IN') {
        setError(t('checkin.alreadyCheckedIn') || 'You are already checked in');
      } else if (err.code === 'CLINIC_INACTIVE') {
        setClinicStatus('inactive');
        return;
      } else if (err.code === 'CLINIC_NOT_FOUND') {
        setError(t('checkin.clinicNotFound') || 'Clinic not found');
      } else {
        setError(err.message || t('checkin.error') || 'Failed to check in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = doctorName || clinicName;

  // Show error screen for inactive or not-found clinics
  if (clinicStatus === 'inactive' || clinicStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col overflow-x-hidden">
        <div className="flex justify-between items-center px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-bs-text-tertiary">
            {t('checkin.virtualQueue')}
          </span>
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-3xl text-red-400">
              {clinicStatus === 'inactive' ? 'pause_circle' : 'search_off'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-bs-text-primary mb-2">
            {clinicStatus === 'inactive' ? t('checkin.clinicInactive') : t('checkin.clinicNotFound')}
          </h1>
          <p className="text-sm text-bs-text-secondary max-w-[280px]">
            {clinicStatus === 'inactive' ? t('checkin.clinicInactiveDesc') : t('checkin.clinicNotFoundDesc')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 py-4 pb-9">
          <div className="w-4 h-4 bg-bs-text-tertiary rounded flex items-center justify-center text-white text-[9px] font-extrabold">
            B
          </div>
          <span className="text-xs text-bs-text-tertiary font-medium">BleSaf</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-xs font-medium text-bs-text-tertiary">
          {t('checkin.virtualQueue')}
        </span>
        <LanguageSwitcher />
      </div>

      {/* Doctor hero — oversized, centered */}
      <div className="text-center pt-6 pb-4 px-6">
        {/* Avatar */}
        <div
          className="w-[104px] h-[104px] rounded-full bg-bs-accent-light border-[3px] border-bs-accent flex items-center justify-center mx-auto mb-3"
          style={{ boxShadow: '0 4px 20px rgba(15,123,108,0.15)' }}
        >
          <span className="material-symbols-rounded text-5xl text-bs-accent">stethoscope</span>
        </div>

        {/* Doctor name */}
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-bs-text-primary tracking-tight break-words">
          {displayName}
        </h1>

        {/* Specialty badge */}
        {specialty && (
          <div className="mt-2.5">
            <span className="inline-flex px-5 py-1.5 bg-bs-accent-light text-bs-accent rounded-full text-xs font-bold uppercase tracking-wide max-w-full text-center">
              {specialty}
            </span>
          </div>
        )}

        {/* Presence indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className={`w-2 h-2 rounded-full ${isDoctorPresent ? 'bg-green-500' : 'bg-red-400'}`} />
          <span className={`text-[13px] font-semibold ${isDoctorPresent ? 'text-green-700' : 'text-red-500'}`}>
            {isDoctorPresent ? t('checkin.available') : t('checkin.unavailable')}
          </span>
        </div>
      </div>

      {/* Social proof bar — smaller, secondary */}
      <div className="mx-5 flex bg-bs-accent-light border border-bs-accent/10 rounded-xl overflow-hidden">
        <div className="flex-1 min-w-0 text-center py-2.5 px-2">
          <div className="text-base font-extrabold text-bs-accent">{waitingCount}</div>
          <div className="text-[10px] text-bs-text-secondary mt-0.5 truncate">{t('checkin.waitingInQueue')}</div>
        </div>
        <div className="w-px bg-bs-accent/15 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-center py-2.5 px-2">
          <div className="text-base font-extrabold text-bs-accent truncate">~{avgConsultationMins} min</div>
          <div className="text-[10px] text-bs-text-secondary mt-0.5 truncate">{t('checkin.avgConsultationTime')}</div>
        </div>
      </div>

      {/* Join card — elevated, teal background */}
      <div className="mx-5 mt-4 px-6 py-5 bg-bs-accent-light border-[1.5px] border-bs-accent/15 rounded-2xl text-center">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-bs-accent">
          {t('checkin.title')}
        </div>
        <div className="w-14 h-14 rounded-full bg-bs-accent flex items-center justify-center mx-auto my-2">
          <span className="material-symbols-rounded text-[26px] text-white">how_to_reg</span>
        </div>
        <div className="text-lg font-extrabold text-bs-accent tracking-tight">
          {t('checkin.takeYourPlace')}
        </div>
      </div>

      {/* Dashed divider */}
      <div className="mx-6 my-4 border-t border-dashed border-bs-border" />

      {/* Form section */}
      <form onSubmit={handleSubmit} className="px-6 flex-1">
        {/* Section header */}
        <div className="text-xs font-bold tracking-[0.1em] uppercase text-bs-text-tertiary text-center mb-3.5">
          {t('checkin.yourInfo')}
        </div>

        {/* Phone input */}
        <input
          type="tel"
          inputMode="tel"
          value={patientPhone}
          onChange={handlePhoneChange}
          onKeyDown={handlePhoneKeyDown}
          onFocus={handlePhoneFocus}
          placeholder={t('checkin.phonePlaceholder')}
          className="w-full h-[52px] px-4 text-[17px] font-semibold text-bs-text-primary bg-white border-[1.5px] border-bs-border rounded-xl outline-none transition-all focus:border-bs-accent focus:ring-[3px] focus:ring-bs-accent/10"
          required
          disabled={isLoading}
          autoComplete="tel"
        />

        {/* Name input */}
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder={t('checkin.namePlaceholder')}
          className="w-full h-12 px-4 mt-2 text-[15px] font-medium text-bs-text-primary bg-white border-[1.5px] border-dashed border-bs-border rounded-xl outline-none transition-all focus:border-bs-accent focus:ring-[3px] focus:ring-bs-accent/10"
          disabled={isLoading}
          autoComplete="name"
        />

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 mt-3 rounded-xl">
            <span className="material-symbols-rounded text-lg flex-shrink-0">error</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 mt-5 bg-bs-accent hover:bg-bs-accent-dark disabled:bg-bs-text-tertiary disabled:cursor-not-allowed text-white font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{ boxShadow: '0 6px 24px rgba(15,123,108,0.25)' }}
        >
          {isLoading ? t('common.loading') : t('checkin.joinSaf')}
          {!isLoading && <span className="material-symbols-rounded text-xl">arrow_forward</span>}
        </button>

        {/* Trust row */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3.5">
          <span className="flex items-center gap-1 text-xs text-bs-text-tertiary font-medium whitespace-nowrap">
            <span className="material-symbols-rounded text-sm flex-shrink-0">lock</span>
            {t('checkin.dataProtected')}
          </span>
          <div className="w-[3px] h-[3px] rounded-full bg-bs-border flex-shrink-0" />
          <span className="flex items-center gap-1 text-xs text-bs-text-tertiary font-medium whitespace-nowrap">
            <span className="material-symbols-rounded text-sm flex-shrink-0">update</span>
            {t('checkin.realTimeTracking')}
          </span>
        </div>
      </form>

      {/* Brand footer */}
      <div className="flex items-center justify-center gap-1.5 py-4 pb-9">
        <div className="w-4 h-4 bg-bs-text-tertiary rounded flex items-center justify-center text-white text-[9px] font-extrabold">
          B
        </div>
        <span className="text-xs text-bs-text-tertiary font-medium">BleSaf</span>
      </div>
    </div>
  );
}
