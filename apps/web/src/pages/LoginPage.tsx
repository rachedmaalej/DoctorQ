import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { Icon } from '@/components/ui/Icon';
import { supabase } from '@/lib/supabase';
import '@/components/shared/shared.css';

// Dev credentials per brand
const DEV_CREDS = {
  blesaf: {
    admin: { email: 'admin@doctorq.tn', password: 'BlesafAdmin2024!' },
    clinic: { email: 'dr.skander@example.tn', password: 'password123' },
  },
  france: {
    admin: { email: 'admin@ausuivant.fr', password: 'AuSuivantAdmin2024!' },
    clinic: { email: 'dr.perrin@example.fr', password: 'password123' },
  },
} as const;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // Redirect: admins → /admin, new clinics → /onboarding, others → /dashboard
      const { clinic } = useAuthStore.getState();
      if (clinic?.isAdmin) {
        navigate('/admin');
      } else if (!clinic?.onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch {
      // Error is already set in auth store
    } finally {
      setIsSubmitting(false);
    }
  };

  const ssoAvailable = !!supabase;

  const handleOAuthLogin = useCallback(async (provider: 'google' | 'apple' | 'facebook') => {
    if (!supabase) return;
    sessionStorage.setItem('oauth_provider', provider);
    sessionStorage.setItem('oauth_source', 'login');

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const [first, second] = webBrand.theme.logo.parts;
  const brandName = <><span>{first.text}</span><span style={{ opacity: 0.62 }}>{second.text}</span></>;

  return (
    <div className="bs-login">
      <div className="bs-login-wrapper">

        {/* ─── Hero ─── */}
        <div className="bs-login-hero">
          <div className="bs-login-hero-shadow" />

          <div className="bs-login-logo">
            <div className="bs-login-logo-icon">
              <Icon name="stacks" size={22} />
            </div>
            <div className="bs-login-logo-text">{brandName}</div>
          </div>

          <div className="bs-login-eyebrow">{t('auth.loginEyebrow')}</div>

          <h1 className="bs-login-headline">
            {t('auth.loginHeadline').split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line.includes('Docteur') || line.includes('دكتور')
                  ? <em>{line}</em>
                  : line
                }
              </span>
            ))}
          </h1>

          <p className="bs-login-subline">{t('auth.loginSubline')}</p>
        </div>

        {/* ─── Card ─── */}
        <div className="bs-login-card">
          <div className="bs-login-handle" />

          <h2 className="bs-login-title">{t('auth.login')}</h2>
          <p className="bs-login-subtitle">{t('auth.loginCardSubtitle')}</p>

          {/* Dev Quick Login */}
          {import.meta.env.DEV && (
            <div className="bs-login-dev">
              <div className="bs-login-dev-label">Dev Quick Login</div>
              <div className="bs-login-dev-btns">
                <button
                  type="button"
                  className="bs-login-dev-btn"
                  onClick={() => {
                    const creds = DEV_CREDS[webBrand.id] || DEV_CREDS.blesaf;
                    setEmail(creds.admin.email);
                    setPassword(creds.admin.password);
                  }}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="bs-login-dev-btn"
                  onClick={() => {
                    const creds = DEV_CREDS[webBrand.id] || DEV_CREDS.blesaf;
                    setEmail(creds.clinic.email);
                    setPassword(creds.clinic.password);
                  }}
                >
                  Clinic
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="bs-login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="bs-login-field">
              <label htmlFor="login-email">{t('auth.email')}</label>
              <div className="bs-login-input-wrap">
                <div className="bs-login-input-icon">
                  <Icon name="mail" size={20} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  className="bs-login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.nom@cabinet.tn"
                  inputMode="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="bs-login-field">
              <label htmlFor="login-password">{t('auth.password')}</label>
              <div className="bs-login-input-wrap">
                <div className="bs-login-input-icon">
                  <Icon name="lock" size={20} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="bs-login-input"
                  style={{ paddingRight: '48px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="bs-login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={21} />
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="bs-login-options">
              <label className="bs-login-remember">
                <input type="checkbox" />
                {t('auth.rememberMe')}
              </label>
              <Link to="/forgot-password" className="bs-login-forgot">
                {t('auth.forgotPasswordShort')}
              </Link>
            </div>

            {/* Spacer */}
            <div className="bs-login-spacer" />

            {/* Submit */}
            <button
              type="submit"
              className="bs-login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('auth.loginButton')}
              {!isSubmitting && <Icon name="arrow_forward" size={20} />}
            </button>
          </form>

          {/* SSO buttons */}
          {ssoAvailable && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0', fontSize: '12px', color: '#B0B7C3', fontWeight: 500 }}>
                <span style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                {t('auth.orContinueWith', 'ou continuer avec')}
                <span style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              </div>
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="bs-login-sso-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: '2px solid #DADCE0', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuer avec Google
              </button>
            </div>
          )}

          {/* Signup */}
          <div className="bs-login-signup">
            {t('auth.noAccountPrompt')}{' '}
            <Link to="/onboarding">{t('auth.trialCta')}</Link>
          </div>

          {/* Trust signals */}
          <div className="bs-login-trust">
            <span className="bs-login-trust-item">
              <Icon name="verified_user" size={14} fill />
              {t('auth.trustSsl')}
            </span>
            <span className="bs-login-trust-item">
              <Icon name="encrypted" size={14} fill />
              {t('auth.trustEncrypted')}
            </span>
            <span className="bs-login-trust-item">
              <Icon name="gpp_good" size={14} fill />
              {t('auth.trustCompliant')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
