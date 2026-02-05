import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorCode('NO_TOKEN');
      return;
    }

    api.verifyEmail(token)
      .then(() => {
        setStatus('success');
      })
      .catch((err: { code?: string }) => {
        setStatus('error');
        setErrorCode(err.code || 'UNKNOWN');
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      await api.resendVerification(resendEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verify.loading')}</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verify.successTitle')}</h1>
            <p className="text-gray-600 mb-6">{t('verify.successMessage')}</p>
            <Link
              to="/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('verify.loginButton')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verify.errorTitle')}</h1>
            <p className="text-gray-600 mb-6">
              {errorCode === 'ALREADY_VERIFIED'
                ? t('verify.alreadyVerified')
                : errorCode === 'TOKEN_EXPIRED'
                  ? t('verify.tokenExpired')
                  : errorCode === 'NO_TOKEN'
                    ? t('verify.noToken')
                    : t('verify.errorMessage')}
            </p>

            {errorCode !== 'ALREADY_VERIFIED' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-500">{t('verify.resendPrompt')}</p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder={t('verify.emailPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleResend}
                  disabled={resendStatus === 'sending' || !resendEmail}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {resendStatus === 'sending' ? t('verify.resending') : t('verify.resendButton')}
                </button>
                {resendStatus === 'sent' && (
                  <p className="text-sm text-green-600">{t('verify.resendSuccess')}</p>
                )}
                {resendStatus === 'error' && (
                  <p className="text-sm text-red-600">{t('verify.resendError')}</p>
                )}
              </div>
            )}

            <Link
              to="/login"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('verify.backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
