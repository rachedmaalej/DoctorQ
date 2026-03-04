import { useTranslation } from 'react-i18next';
import { webBrand } from '@/lib/brand';
import { getSpecialtyLabel } from '@/lib/utils';

interface PSHeaderProps {
  clinicName?: string;
  specialty?: string;
  isDoctorPresent?: boolean;
}

export default function PSHeader({ clinicName, specialty, isDoctorPresent = true }: PSHeaderProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'fr' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="ps-clinic-header ps-fade-up">
      <div>
        {clinicName && (
          <div className="ps-clinic-name">{clinicName}</div>
        )}
        {specialty && (
          <div className="ps-clinic-doc">{getSpecialtyLabel(specialty)}</div>
        )}
      </div>
      <div className="ps-header-right">
        <div className={`ps-doctor-dot ${isDoctorPresent ? '' : 'absent'}`} />
        {webBrand.supportedLanguages.length > 1 && (
          <button className="ps-lang-btn" onClick={toggleLanguage}>
            {i18n.language === 'ar' ? 'Français' : 'عربي'}
          </button>
        )}
      </div>
    </div>
  );
}
