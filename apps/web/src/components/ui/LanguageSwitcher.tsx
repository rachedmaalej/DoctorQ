import { useTranslation } from 'react-i18next';
import { webBrand } from '@/lib/brand';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  // Hide when brand only supports one language (e.g. FiloSoin = fr only)
  if (webBrand.supportedLanguages.length < 2) return null;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`px-3 py-2 text-sm font-medium bg-white/80 backdrop-blur
                  hover:bg-white rounded-lg shadow-sm border border-gray-200
                  transition-colors ${className}`}
      aria-label={i18n.language === 'fr' ? 'Switch to Arabic' : 'Basculer vers le français'}
    >
      {i18n.language === 'fr' ? 'عربي' : 'Français'}
    </button>
  );
}
