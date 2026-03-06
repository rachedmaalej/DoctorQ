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
                    fontSize: '16px',
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
                      fontSize: '16px',
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
                    fontSize: '16px',
                  }}
                />
                <p className="mt-1.5" style={{ color: '#888899', fontSize: '12px' }}>
                  {t('onboarding.signup.clinicNameHelper', 'Ce nom apparaîtra sur votre QR code.')}
                </p>
                {errors.clinicName && (
                  <p className="mt-1 text-sm" style={{ color: '#D94040' }}>{errors.clinicName}</p>
                )}
              </div>

              {/* Trial badge */}
              <p className="text-center mb-3 text-sm" style={{ color: '#888899' }}>
                {t('onboarding.signup.trialBadge', '30 jours gratuits · sans engagement')}
              </p>

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

          {/* Trust signals below card */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-xs" style={{ color: '#888899' }}>
              {t('onboarding.signup.socialProof', 'Utilisé par des cabinets en Tunisie')}
            </p>
            <a
              href="https://wa.me/21658000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: '#1B7A4A' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B7A4A">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('onboarding.signup.whatsappHelp', 'Une question ? Contactez-nous sur WhatsApp')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
