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

          {/* Right: Language toggle and logout */}
          <div className="flex items-center gap-4">
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
