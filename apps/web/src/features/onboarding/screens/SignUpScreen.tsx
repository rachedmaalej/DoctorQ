import { useState, useCallback } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/OnboardingLayout';
import PillButton from '../components/PillButton';
import { SCREEN_COPY, ILLUSTRATION_PATHS, type SpecialtyId } from '../constants/onboardingConfig';
import { trackOnboarding, EVENTS } from '../hooks/useOnboardingAnalytics';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface SignUpScreenProps {
  step: number;
  specialty: SpecialtyId | null;
  onAdvance: (clinicId: string, clinicName: string) => void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const inputStyle = (valid?: boolean, invalid?: boolean): React.CSSProperties => ({
  fontFamily: 'var(--ob-font)',
  borderColor: invalid ? '#D94040' : valid ? 'var(--ob-brand-primary)' : '#E5E7EB',
  color: 'var(--ob-brand-text)',
});

/* ── SSO icon SVGs ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

/**
 * Screen 3: Sign-up.
 * Mobile: SSO-first with toggle to email form.
 * Desktop: SSO row (horizontal) + email form always visible below.
 */
export default function SignUpScreen({ step, specialty, onAdvance }: SignUpScreenProps) {
  const navigate = useNavigate();
  const copy = SCREEN_COPY.signup;
  // checkAuth deliberately NOT called here — see OnboardingFlow.handleComplete
  const { setClinicInfo } = useOnboardingStore();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ssoAvailable = !!supabase;

  const handleOAuthSignIn = useCallback(async (provider: 'google' | 'apple' | 'facebook') => {
    if (!supabase) return;

    // Require clinic name before OAuth redirect
    if (!clinicName.trim()) {
      setError('Entrez le nom du cabinet avant de continuer.');
      setShowEmailForm(false); // show SSO view with name field visible
      return;
    }

    // Save context for after redirect
    sessionStorage.setItem('oauth_provider', provider);
    sessionStorage.setItem('oauth_clinic_name', clinicName.trim());
    sessionStorage.setItem('oauth_language', 'fr');
    sessionStorage.setItem('oauth_source', 'signup');
    if (specialty) sessionStorage.setItem('oauth_specialty', specialty);

    trackOnboarding(EVENTS.SIGNUP_SUBMITTED, { method: provider });

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }, [clinicName, specialty]);

  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;
  const clinicValid = clinicName.trim().length > 0;
  const canSubmit = emailValid && passwordValid && clinicValid && !loading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      trackOnboarding(EVENTS.SIGNUP_SUBMITTED);

      const result = await api.signup({
        name: clinicName.trim(),
        email: email.trim().toLowerCase(),
        password,
        language: 'fr',
      });

      setClinicInfo(result.clinicId, result.clinicName);
      // Don't call checkAuth() here — it remounts OnboardingFlow via route guards
      // and resets step to 0. Auth is refreshed in handleComplete after QR reveal.
      onAdvance(result.clinicId, result.clinicName);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(message);
      trackOnboarding(EVENTS.SIGNUP_FAILED, { error: message });
    } finally {
      setLoading(false);
    }
  }, [canSubmit, email, password, clinicName, specialty, setClinicInfo, onAdvance]);

  /* Shared email form fields */
  const emailFormFields = (
    <>
      <div className="space-y-[8px] mb-[8px] md:mb-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            autoComplete="email"
            className="w-full rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors"
            style={inputStyle(email ? emailValid : undefined, email ? !emailValid : undefined)}
          />
          {email && emailValid && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-[13px]">
              &#10003;
            </span>
          )}
        </div>

        {/* Desktop: password + clinic side-by-side */}
        <div className="hidden md:flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.passwordPlaceholder}
            autoComplete="new-password"
            className="flex-1 rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors"
            style={inputStyle(password ? passwordValid : undefined, password ? !passwordValid : undefined)}
          />
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder={copy.clinicPlaceholder}
            autoComplete="organization"
            className="flex-1 rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors"
            style={{ fontFamily: 'var(--ob-font)', borderColor: '#E5E7EB', color: 'var(--ob-brand-text)' }}
          />
        </div>

        {/* Mobile: stacked fields */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={copy.passwordPlaceholder}
          autoComplete="new-password"
          className="md:hidden w-full rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors"
          style={inputStyle(password ? passwordValid : undefined, password ? !passwordValid : undefined)}
        />
        <input
          type="text"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder={copy.clinicPlaceholder}
          autoComplete="organization"
          className="md:hidden w-full rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors"
          style={{ fontFamily: 'var(--ob-font)', borderColor: '#E5E7EB', color: 'var(--ob-brand-text)' }}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600 mb-2 text-center" style={{ fontFamily: 'var(--ob-font)' }}>
          {error}
        </p>
      )}

      <PillButton onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
        {loading ? copy.loading : <>{copy.cta} <span aria-hidden="true">&rarr;</span></>}
      </PillButton>
    </>
  );

  return (
    <OnboardingLayout
      step={step}
      illustrationSrc={ILLUSTRATION_PATHS.signup}
      illustrationAlt="Admin creating account"
      illustrationHeight={showEmailForm ? '58dvh' : '54dvh'}
      cardOverlap={showEmailForm ? '-70px' : '-29px'}
      alignTop={showEmailForm}
    >
      <div className="flex flex-col overflow-y-auto">
        {/* Desktop step label */}
        <span
          className="hidden md:block text-[12px] font-medium mb-1"
          style={{ color: 'var(--ob-brand-subtle)' }}
        >
          Étape 3 / 4
        </span>

        <h1
          className="text-[20px] font-bold leading-tight mb-[2px] md:text-[28px] md:mb-[5px]"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
        >
          {copy.headline}
        </h1>
        <p
          className="text-[11px] leading-relaxed mb-[5px] md:text-[14px] md:mb-3"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
        >
          {copy.subtitle}
        </p>

        {/* ── Desktop: SSO row (horizontal) + email form always visible ── */}
        <div className="hidden md:block">
          {ssoAvailable && (
            <>
              {/* Clinic name for SSO (desktop) */}
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder={copy.clinicPlaceholder}
                autoComplete="organization"
                className="w-full rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors mb-2"
                style={{ fontFamily: 'var(--ob-font)', borderColor: '#E5E7EB', color: 'var(--ob-brand-text)' }}
              />
              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  className="flex-1 flex items-center justify-center gap-[8px] rounded-[14px] border-2 py-[10px] px-3 text-[13px] font-semibold transition-colors hover:bg-gray-50"
                  style={{ fontFamily: 'var(--ob-font)', borderColor: '#DADCE0', backgroundColor: '#fff', color: 'var(--ob-brand-text)' }}
                >
                  <GoogleIcon /> Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  className="flex-1 flex items-center justify-center gap-[8px] rounded-[14px] border-2 py-[10px] px-3 text-[13px] font-semibold transition-opacity hover:opacity-90"
                  style={{ fontFamily: 'var(--ob-font)', borderColor: '#000', backgroundColor: '#000', color: '#fff' }}
                >
                  <AppleIcon /> Apple
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('facebook')}
                  className="flex-1 flex items-center justify-center gap-[8px] rounded-[14px] border-2 py-[10px] px-3 text-[13px] font-semibold transition-opacity hover:opacity-90"
                  style={{ fontFamily: 'var(--ob-font)', borderColor: '#1877F2', backgroundColor: '#1877F2', color: '#fff' }}
                >
                  <FacebookIcon /> Facebook
                </button>
              </div>
            </>
          )}

          <div
            className="flex items-center gap-[10px] my-3 text-[12px] font-medium"
            style={{ color: '#B0B7C3' }}
          >
            <span className="flex-1 h-px bg-[#E5E7EB]" />
            ou créer avec email
            <span className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {emailFormFields}
        </div>

        {/* ── Mobile: SSO-first with toggle to email form ── */}
        <div className="md:hidden">
          {!showEmailForm ? (
            <>
              {/* Clinic name input (before SSO buttons) */}
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder={copy.clinicPlaceholder}
                autoComplete="organization"
                className="w-full rounded-xl border-2 px-4 py-2 text-[14px] outline-none transition-colors mb-[8px]"
                style={{ fontFamily: 'var(--ob-font)', borderColor: '#E5E7EB', color: 'var(--ob-brand-text)' }}
              />

              {ssoAvailable && (
                <>
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('google')}
                    className="w-full flex items-center justify-center gap-[10px] rounded-[14px] border-2 py-[9px] px-5 text-[14px] font-semibold transition-colors hover:bg-gray-50"
                    style={{ fontFamily: 'var(--ob-font)', borderColor: '#DADCE0', backgroundColor: '#fff', color: 'var(--ob-brand-text)' }}
                  >
                    <GoogleIcon /> Continuer avec Google
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('apple')}
                    className="w-full flex items-center justify-center gap-[10px] rounded-[14px] border-2 py-[9px] px-5 text-[14px] font-semibold mt-[7px] transition-opacity hover:opacity-90"
                    style={{ fontFamily: 'var(--ob-font)', borderColor: '#000', backgroundColor: '#000', color: '#fff' }}
                  >
                    <AppleIcon /> Continuer avec Apple
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('facebook')}
                    className="w-full flex items-center justify-center gap-[10px] rounded-[14px] border-2 py-[9px] px-5 text-[14px] font-semibold mt-[7px] transition-opacity hover:opacity-90"
                    style={{ fontFamily: 'var(--ob-font)', borderColor: '#1877F2', backgroundColor: '#1877F2', color: '#fff' }}
                  >
                    <FacebookIcon /> Continuer avec Facebook
                  </button>
                </>
              )}

              {/* Divider */}
              <div
                className="flex items-center gap-[10px] my-[10px] text-[12px] font-medium"
                style={{ color: '#B0B7C3' }}
              >
                <span className="flex-1 h-px bg-[#E5E7EB]" />
                ou créer avec email
                <span className="flex-1 h-px bg-[#E5E7EB]" />
              </div>

              {/* Email toggle */}
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-[14px] border-2 py-[9px] px-5 text-[14px] font-semibold transition-colors hover:opacity-90"
                style={{
                  fontFamily: 'var(--ob-font)',
                  borderColor: 'var(--ob-brand-primary)',
                  backgroundColor: 'var(--ob-brand-bg)',
                  color: 'var(--ob-brand-primary)',
                }}
              >
                ✉ Créer avec email &rarr;
              </button>

              {error && (
                <p className="text-[12px] text-red-600 mt-2 text-center" style={{ fontFamily: 'var(--ob-font)' }}>
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Back link */}
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setError(null); }}
                className="flex items-center gap-1 text-[12px] mb-[8px] w-fit"
                style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
              >
                &#8592; Retour
              </button>
              {emailFormFields}
            </>
          )}
        </div>

        {/* Trust signal */}
        <p
          className="text-center text-[11px] mt-[8px] flex items-center justify-center gap-1 md:mt-3 md:justify-start"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
        >
          {copy.trust}
        </p>

        {/* Login link */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="block mx-auto mt-[5px] text-[12px] underline hover:no-underline transition-all md:mx-0 md:text-left"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-primary)' }}
        >
          {copy.loginLink}
        </button>
      </div>
    </OnboardingLayout>
  );
}
