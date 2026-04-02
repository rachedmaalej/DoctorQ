import { useTranslation } from 'react-i18next';

interface PSGoogleReviewCTAProps {
  googleReviewUrl: string;
  entryId: string;
  onDismiss: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function PSGoogleReviewCTA({ googleReviewUrl, entryId, onDismiss }: PSGoogleReviewCTAProps) {
  const { t } = useTranslation();

  const trackClick = () => {
    // Fire-and-forget — don't block the redirect
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/queue/feedback/${entryId}/google-clicked`, { method: 'POST' }).catch(() => {});
  };

  return (
    <div
      className="ps-fade-up"
      style={{
        background: 'var(--surface, #FFFFFF)',
        border: '1px solid var(--border, #D4DAD6)',
        borderRadius: 14,
        padding: 20,
        textAlign: 'center',
        marginTop: 12,
      }}
    >
      {/* Star decoration */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="material-symbols-rounded"
            style={{
              fontSize: 22,
              color: '#F5A623',
              fontVariationSettings: "'FILL' 1, 'wght' 400",
            }}
          >
            star
          </span>
        ))}
      </div>

      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
        {t('feedback.googleHeading')}
      </p>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
        {t('feedback.googleBody')}
      </p>

      <a
        href={googleReviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          background: 'var(--text-primary, #1B2D25)',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: 15,
          textDecoration: 'none',
          border: 'none',
          fontFamily: 'inherit',
        }}
        aria-label={t('feedback.ariaGoogleButton')}
      >
        <GoogleIcon />
        {t('feedback.googleButton')}
      </a>

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
        {t('feedback.googleSubtext')}
      </p>

      <button
        onClick={onDismiss}
        style={{
          marginTop: 12,
          fontSize: 13,
          color: 'var(--text-tertiary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        aria-label={t('feedback.ariaSkipGoogle')}
      >
        {t('feedback.skipGoogle')}
      </button>
    </div>
  );
}
