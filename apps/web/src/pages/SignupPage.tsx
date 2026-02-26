import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import ProgressBar from '../components/onboarding/ProgressBar';
import PasswordStrengthBar from '../components/onboarding/PasswordStrengthBar';

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setClinicInfo = useOnboardingStore((s) => s.setClinicInfo);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = t('onboarding.signup.errors.emailRequired', 'Veuillez entrer votre email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('onboarding.signup.errors.emailInvalid', "Format d'email invalide.");
    }

    if (!password) {
      newErrors.password = t('onboarding.signup.errors.passwordRequired', 'Veuillez choisir un mot de passe.');
    } else if (password.length < 8) {
      newErrors.password = t('onboarding.signup.errors.passwordShort', 'Le mot de passe doit contenir au moins 8 caractères.');
    }

    if (!clinicName.trim()) {
      newErrors.clinicName = t('onboarding.signup.errors.clinicNameRequired', 'Veuillez entrer le nom de votre cabinet.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await api.signup({
        name: clinicName.trim(),
        email: email.trim().toLowerCase(),
        password,
        language: 'fr',
      });

      // Store clinic info for the onboarding flow
      setClinicInfo(result.clinicId, result.clinicName);

      // Refresh auth state so guards work
      await checkAuth();

      // Navigate to setup animation
      navigate('/signup/setup');
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === 'EMAIL_EXISTS') {
        setErrors({
          email: t('onboarding.signup.errors.emailExists', 'Cet email est déjà utilisé.'),
        });
      } else {
        setErrors({
          form: t('onboarding.signup.errors.generic', 'Une erreur est survenue. Veuillez réessayer.'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7F5' }}>
      <ProgressBar currentStep={1} />

      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-8">
        <div className="w-full" style={{ maxWidth: '480px' }}>
          {/* Logo / wordmark */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1B7A4A' }}>BleSaf</h2>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm" style={{ borderRadius: '12px' }}>
            {/* Title */}
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A1A2E', fontSize: '28px' }}>
              {t('onboarding.signup.title', 'Votre cabinet numérique')}
            </h1>
            <h1 className="text-2xl font-bold mb-3" style={{ color: '#1A1A2E', fontSize: '28px' }}>
              {t('onboarding.signup.titleLine2', 'est à 2 minutes.')}
            </h1>
            <p className="mb-6" style={{ color: '#888899', fontSize: '15px' }}>
              {t('onboarding.signup.subtitle', 'Aucune carte bancaire requise.')}
            </p>

            {/* Form error */}
            {errors.form && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#D94040' }}>
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>
                  {t('onboarding.signup.emailLabel', 'Email professionnel')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setErrors((prev) => ({ ...prev, email: t('onboarding.signup.errors.emailInvalid', "Format d'email invalide.") }));
                    } else {
                      setErrors((prev) => { const { email: _, ...rest } = prev; return rest; });
                    }
                  }}
                  placeholder="dr.prenom.nom@gmail.com"
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.email ? '#D94040' : '#D0DDD6',
                    borderRadius: '6px',
                    fontSize: '15px',
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-sm" style={{ color: '#D94040' }}>
                    {errors.email}{' '}
                    {errors.email.includes('déjà utilisé') && (
                      <Link to="/login" className="underline font-medium" style={{ color: '#1B7A4A' }}>
                        Se connecter ?
                      </Link>
                    )}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>
                  {t('onboarding.signup.passwordLabel', 'Mot de passe')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 pr-12"
                    style={{
                      borderColor: errors.password ? '#D94040' : '#D0DDD6',
                      borderRadius: '6px',
                      fontSize: '15px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg cursor-pointer"
                    style={{ color: '#888899' }}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
                {errors.password && (
                  <p className="mt-1 text-sm" style={{ color: '#D94040' }}>{errors.password}</p>
                )}
              </div>

              {/* Clinic name */}
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>
                  {t('onboarding.signup.clinicNameLabel', 'Nom de votre cabinet')}
                </label>
                <input
                  id="clinicName"
                  type="text"
                  maxLength={80}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Clinique Dr. [Votre nom]"
                  className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.clinicName ? '#D94040' : '#D0DDD6',
                    borderRadius: '6px',
                    fontSize: '15px',
                  }}
                />
                <p className="mt-1.5" style={{ color: '#888899', fontSize: '12px' }}>
                  {t('onboarding.signup.clinicNameHelper', 'Ce nom apparaîtra sur votre QR code.')}
                </p>
                {errors.clinicName && (
                  <p className="mt-1 text-sm" style={{ color: '#D94040' }}>{errors.clinicName}</p>
                )}
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  height: '52px',
                  borderRadius: '8px',
                  backgroundColor: '#1B7A4A',
                  fontSize: '16px',
                  fontWeight: 600,
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#165f3a')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#1B7A4A')}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    {t('onboarding.signup.creating', 'Création en cours...')}
                  </>
                ) : (
                  <>
                    {t('onboarding.signup.cta', 'Créer mon compte')} →
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center mt-5 text-sm" style={{ color: '#555566' }}>
              {t('onboarding.signup.alreadyRegistered', 'Déjà inscrit ?')}{' '}
              <Link to="/login" className="font-medium" style={{ color: '#1B7A4A' }}>
                {t('onboarding.signup.loginLink', 'Se connecter')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
