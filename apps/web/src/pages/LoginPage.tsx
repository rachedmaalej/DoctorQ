import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import Logo from '@/components/ui/Logo';

// Dev credentials per brand
const DEV_CREDS = {
  blesaf: {
    admin: { email: 'admin@doctorq.tn', password: 'BlesafAdmin2024!' },
    clinic: { email: 'dr.skander@example.tn', password: 'password123' },
  },
  france: {
    admin: { email: 'admin@filosoin.fr', password: 'FiloSoinAdmin2024!' },
    clinic: { email: 'dr.perrin@example.fr', password: 'password123' },
  },
} as const;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // Redirect: admins → /admin, new clinics → /signup/setup, others → /dashboard
      const { clinic } = useAuthStore.getState();
      if (clinic?.isAdmin) {
        navigate('/admin');
      } else if (!clinic?.onboardingCompleted) {
        navigate('/signup/setup');
      } else {
        navigate('/dashboard');
      }
    } catch {
      // Error is already set in auth store
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo size="xl" className="mb-2 justify-center flex" />
          <p className="text-gray-600">{t('auth.login')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Dev Quick Login - only in development */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 mb-2 font-medium">⚡ Dev Quick Login</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const creds = DEV_CREDS[webBrand.id] || DEV_CREDS.blesaf;
                    setEmail(creds.admin.email);
                    setPassword(creds.admin.password);
                  }}
                  className="flex-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1.5 px-2 rounded transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const creds = DEV_CREDS[webBrand.id] || DEV_CREDS.blesaf;
                    setEmail(creds.clinic.email);
                    setPassword(creds.clinic.password);
                  }}
                  className="flex-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1.5 px-2 rounded transition-colors"
                >
                  Clinic
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                {t('auth.forgotPassword')}
              </Link>
              <Link to="/signup" className="text-sm text-primary-600 hover:text-primary-700">
                {t('auth.createAccount')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
