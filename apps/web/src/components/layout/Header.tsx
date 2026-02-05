import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useUILabels } from '@/hooks/useUILabels';
import Logo from '@/components/ui/Logo';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic, logout } = useAuthStore();
  const { isMedical } = useUILabels();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo only */}
          <div>
            <Logo size="md" />
          </div>

          {/* Center: Clinic/Store name */}
          {clinic && (
            <div className="text-center">
              {isMedical && <p className="text-sm text-gray-500 font-medium">Cabinet</p>}
              <h1 className="text-xl font-bold text-gray-900">{clinic.doctorName || clinic.name}</h1>
            </div>
          )}

          {/* Right: Settings, language toggle and logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('settings.title')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={toggleLanguage}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {i18n.language === 'fr' ? 'عربي' : 'Français'}
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
