import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import Logo from '../ui/Logo';

export default function LandingHeader() {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="text-gray-600 hover:text-gray-900 font-medium text-sm hidden sm:inline"
          >
            {t('landing.nav.login')}
          </Link>
          <Link
            to="/signup"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors hover:scale-105 transition-transform duration-200"
          >
            {t('landing.nav.signup')}
          </Link>
        </div>
      </nav>
    </header>
  );
}
