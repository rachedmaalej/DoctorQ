import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';

interface BSHeaderProps {
  waitingCount: number;
  seenCount: number;
  endEstimate: string;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
}

export default function BSHeader({
  waitingCount,
  seenCount,
  endEstimate,
  isDoctorPresent,
  onToggleDoctorPresent,
}: BSHeaderProps) {
  const { t, i18n } = useTranslation();
  const { clinic } = useAuthStore();
  const [activationComplete, setActivationComplete] = useState(true);

  // Check activation status (subtle dot indicator)
  useEffect(() => {
    api.getActivationProgress()
      .then((data) => {
        setActivationComplete(
          (data.qrDownloaded && data.firstPatientAdded) || data.dismissed
        );
      })
      .catch(() => {});
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="bs-header bs-animate-in bs-delay-1">
      {/* Top row: clinic name + actions */}
      <div className="bs-header-top">
        <span className="bs-clinic-name">
          {clinic?.name || t('blesaf.header.defaultClinic')}
          {!activationComplete && (
            <span
              className="inline-block rounded-full"
              style={{
                width: '7px',
                height: '7px',
                backgroundColor: '#E6A817',
                marginLeft: '6px',
                marginBottom: '1px',
                verticalAlign: 'middle',
                animation: 'header-dot-pulse 2s ease-in-out infinite',
              }}
              title={t('onboarding.emptyState.noQr')}
            />
          )}
        </span>
        <div className="bs-header-actions">
          {/* Language toggle */}
          {webBrand.supportedLanguages.length > 1 && (
            <button
              className="bs-lang-toggle"
              onClick={toggleLanguage}
              aria-label={t('blesaf.header.switchLangAria')}
            >
              {i18n.language === 'fr' ? 'عربي' : 'FR'}
            </button>
          )}

          {/* Doctor presence toggle */}
          <button
            className={`bs-doctor-toggle ${isDoctorPresent ? 'present' : 'absent'}`}
            onClick={onToggleDoctorPresent}
          >
            <div className="bs-toggle-dot" />
            <span className="bs-toggle-text">
              {isDoctorPresent ? t('blesaf.header.present') : t('blesaf.header.absent')}
            </span>
          </button>
        </div>
      </div>

      {/* Stats strip: 3 chips */}
      <div className="bs-stats-strip">
        <div className="bs-stat-chip highlight">
          <div className="bs-stat-value">{waitingCount}</div>
          <div className="bs-stat-label">{t('queue.waiting')}</div>
        </div>
        <div className="bs-stat-chip">
          <div className="bs-stat-value">{seenCount}</div>
          <div className="bs-stat-label">{t('blesaf.header.seen')}</div>
        </div>
        <div className="bs-stat-chip">
          <div className="bs-stat-value">{endEstimate}</div>
          <div className="bs-stat-label">{t('queue.endEstimate')}</div>
        </div>
      </div>
    </div>
  );
}
