import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { Icon } from '@/components/ui/Icon';
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

          {/* Signup */}
          <div className="bs-login-signup">
            {t('auth.noAccountPrompt')}{' '}
            <Link to="/signup">{t('auth.trialCta')}</Link>
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
