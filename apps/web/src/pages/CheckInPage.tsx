import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { webBrand } from '@/lib/brand';
import { formatPhone, extractPhoneDigits, isValidPhone, DEFAULT_PHONE_VALUE } from '@/lib/phone';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface ClinicDoctor {
  id: string;
  name: string;
  specialty: string | null;
  colorToken: string;
}

const TOKEN_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#D8ECF4', fg: '#4A6E8F' },
  teal: { bg: '#D5F0EB', fg: '#60B8AA' },
  emerald: { bg: '#D5F0EB', fg: '#60B8AA' },
  amber: { bg: '#F5E6CB', fg: '#D4923A' },
  plum: { bg: '#E8D8E8', fg: '#8E618F' },
  rose: { bg: '#F0D8E8', fg: '#A12B98' },
  slate: { bg: '#E8EDE9', fg: '#9AAD9F' },
};

function getTokenColor(token: string) {
  return TOKEN_COLORS[token] || TOKEN_COLORS.slate;
}

export default function CheckInPage() {
  const { t } = useTranslation();
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const [patientPhone, setPatientPhone] = useState(DEFAULT_PHONE_VALUE);
  const [patientName, setPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
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
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [multiDoctorEnabled, setMultiDoctorEnabled] = useState(false);

  const brandColor = webBrand.theme.colors.primary;
  const brandName = webBrand.name;

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
          setMultiDoctorEnabled(info.multiDoctorEnabled);
          setDoctors(info.doctors || []);
          setClinicStatus('active');
        })
        .catch((err: any) => {
          if (err.code === 'CLINIC_INACTIVE') {
            setClinicStatus('inactive');
          } else if (err.code === 'CLINIC_NOT_FOUND') {
            setClinicStatus('not_found');
          } else {
            setClinicStatus('active');
          }
        });
    }
  }, [clinicId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue.length < webBrand.phone.countryCode.length + 1) {
      setPatientPhone(DEFAULT_PHONE_VALUE);
      return;
    }
    const formatted = formatPhone(inputValue);
    setPatientPhone(formatted);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const prefixLen = webBrand.phone.countryCode.length + 1;
    if (e.key === 'Backspace' && input.selectionStart !== null && input.selectionStart <= prefixLen) {
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

      if (!isValidPhone(patientPhone)) {
        throw new Error(t('checkin.invalidPhone'));
      }

      const result = await api.checkIn(clinicId, {
        patientPhone: extractPhoneDigits(patientPhone),
        patientName: patientName || undefined,
        doctorId: selectedDoctorId || undefined,
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
      <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: webBrand.theme.colors.surface }}>
        <div className="flex justify-between items-center px-6 pt-4 pb-1">
          <span className="text-xs font-medium" style={{ color: '#999' }}>
            {t('checkin.virtualQueue')}
          </span>
          {webBrand.supportedLanguages.length > 1 && <LanguageSwitcher />}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-3xl text-red-400">
              {clinicStatus === 'inactive' ? 'pause_circle' : 'search_off'}
            </span>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
            {clinicStatus === 'inactive' ? t('checkin.clinicInactive') : t('checkin.clinicNotFound')}
          </h1>
          <p className="text-sm max-w-[280px]" style={{ color: '#666' }}>
            {clinicStatus === 'inactive' ? t('checkin.clinicInactiveDesc') : t('checkin.clinicNotFoundDesc')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 py-4 pb-9">
          <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: '#999' }}>
            {brandName[0]}
          </div>
          <span className="text-xs font-medium" style={{ color: '#999' }}>{brandName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: webBrand.theme.colors.surface }}>
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-xs font-medium" style={{ color: '#999' }}>
          {t('checkin.virtualQueue')}
        </span>
        {webBrand.supportedLanguages.length > 1 && <LanguageSwitcher />}
      </div>

      {/* Doctor hero — oversized, centered */}
      <div className="text-center pt-6 pb-4 px-6">
        {/* Avatar */}
        <div
          className="w-[104px] h-[104px] rounded-full border-[3px] flex items-center justify-center mx-auto mb-3"
          style={{
            background: `${brandColor}15`,
            borderColor: brandColor,
            boxShadow: `0 4px 20px ${brandColor}25`,
          }}
        >
          <span className="material-symbols-rounded text-5xl" style={{ color: brandColor }}>stethoscope</span>
        </div>

        {/* Clinic / Doctor name */}
        <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight break-words" style={{ color: '#1a1a1a' }}>
          {displayName}
        </h1>

        {/* Specialty badge */}
        {specialty && (
          <div className="mt-2.5">
            <span
              className="inline-flex px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide max-w-full text-center"
              style={{ background: `${brandColor}15`, color: brandColor }}
            >
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

      {/* Social proof bar */}
      <div
        className="mx-5 flex rounded-xl overflow-hidden border"
        style={{ background: `${brandColor}10`, borderColor: `${brandColor}15` }}
      >
        <div className="flex-1 min-w-0 text-center py-2.5 px-2">
          <div className="text-base font-extrabold" style={{ color: brandColor }}>{waitingCount}</div>
          <div className="text-[10px] mt-0.5 truncate" style={{ color: '#666' }}>{t('checkin.waitingInQueue')}</div>
        </div>
        <div className="w-px flex-shrink-0" style={{ background: `${brandColor}20` }} />
        <div className="flex-1 min-w-0 text-center py-2.5 px-2">
          <div className="text-base font-extrabold truncate" style={{ color: brandColor }}>~{avgConsultationMins} min</div>
          <div className="text-[10px] mt-0.5 truncate" style={{ color: '#666' }}>{t('checkin.avgConsultationTime')}</div>
        </div>
      </div>

      {/* Join card */}
      <div
        className="mx-5 mt-4 px-6 py-5 border-[1.5px] rounded-2xl text-center"
        style={{ background: `${brandColor}08`, borderColor: `${brandColor}20` }}
      >
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: brandColor }}>
          {t('checkin.title')}
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto my-2" style={{ background: brandColor }}>
          <span className="material-symbols-rounded text-[26px] text-white">how_to_reg</span>
        </div>
        <div className="text-lg font-extrabold tracking-tight" style={{ color: brandColor }}>
          {t('checkin.takeYourPlace')}
        </div>
      </div>

      {/* Dashed divider */}
      <div className="mx-6 my-4 border-t border-dashed" style={{ borderColor: '#e0e0e0' }} />

      {/* Form section */}
      <form onSubmit={handleSubmit} className="px-6 flex-1">
        {/* Section header */}
        <div className="text-xs font-bold tracking-[0.1em] uppercase text-center mb-3.5" style={{ color: '#999' }}>
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
          placeholder={webBrand.phone.placeholder}
          className="w-full h-[52px] px-4 text-[17px] font-semibold bg-white border-[1.5px] rounded-xl outline-none transition-all"
          style={{ color: '#1a1a1a', borderColor: '#e0e0e0' }}
          onFocusCapture={(e) => {
            (e.target as HTMLElement).style.borderColor = brandColor;
            (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${brandColor}15`;
          }}
          onBlurCapture={(e) => {
            (e.target as HTMLElement).style.borderColor = '#e0e0e0';
            (e.target as HTMLElement).style.boxShadow = 'none';
          }}
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
          className="w-full h-12 px-4 mt-2 text-[15px] font-medium bg-white border-[1.5px] border-dashed rounded-xl outline-none transition-all"
          style={{ color: '#1a1a1a', borderColor: '#e0e0e0' }}
          onFocusCapture={(e) => {
            (e.target as HTMLElement).style.borderColor = brandColor;
            (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${brandColor}15`;
          }}
          onBlurCapture={(e) => {
            (e.target as HTMLElement).style.borderColor = '#e0e0e0';
            (e.target as HTMLElement).style.boxShadow = 'none';
          }}
          disabled={isLoading}
          autoComplete="name"
        />

        {/* Doctor selection (multi-doctor clinics) */}
        {multiDoctorEnabled && doctors.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-bold tracking-[0.05em] uppercase mb-2" style={{ color: '#999' }}>
              {t('checkin.selectDoctor') || 'Votre médecin'}
            </div>
            <div className="flex flex-col gap-1.5">
              {doctors.map((doc) => {
                const color = getTokenColor(doc.colorToken);
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(isSelected ? null : doc.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all text-left"
                    style={{
                      background: isSelected ? color.bg : 'white',
                      borderColor: isSelected ? color.fg : '#e0e0e0',
                      boxShadow: isSelected ? `0 0 0 3px ${color.fg}20` : 'none',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: color.fg }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                        {doc.name}
                      </div>
                      {doc.specialty && (
                        <div className="text-[11px]" style={{ color: '#888' }}>
                          {doc.specialty}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-rounded text-lg" style={{ color: color.fg }}>check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          className="w-full h-14 mt-5 disabled:cursor-not-allowed text-white font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            background: isLoading ? '#999' : brandColor,
            boxShadow: isLoading ? 'none' : `0 6px 24px ${brandColor}40`,
          }}
        >
          {isLoading ? t('common.loading') : t('checkin.joinSaf')}
          {!isLoading && <span className="material-symbols-rounded text-xl">arrow_forward</span>}
        </button>

        {/* Trust row */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3.5">
          <span className="flex items-center gap-1 text-xs font-medium whitespace-nowrap" style={{ color: '#999' }}>
            <span className="material-symbols-rounded text-sm flex-shrink-0">lock</span>
            {t('checkin.dataProtected')}
          </span>
          <div className="w-[3px] h-[3px] rounded-full flex-shrink-0" style={{ background: '#ddd' }} />
          <span className="flex items-center gap-1 text-xs font-medium whitespace-nowrap" style={{ color: '#999' }}>
            <span className="material-symbols-rounded text-sm flex-shrink-0">update</span>
            {t('checkin.realTimeTracking')}
          </span>
        </div>
      </form>

      {/* Brand footer */}
      <div className="flex items-center justify-center gap-1.5 py-4 pb-9">
        <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: '#999' }}>
          {brandName[0]}
        </div>
        <span className="text-xs font-medium" style={{ color: '#999' }}>{brandName}</span>
      </div>
    </div>
  );
}
