import { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import { webBrand } from '../lib/brand';
import { api } from '../lib/api';
import { downloadQrCodePdf } from '../utils/qrCodePdf';
import ProgressBar from '../components/onboarding/ProgressBar';
import QRCodeDisplay from '../components/onboarding/QRCodeDisplay';

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    clinicName: onboardingName,
    clinicId: onboardingClinicId,
    qrCodeDataUrl,
    qrCodeUrl,
    setQrCode,
  } = useOnboardingStore();
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authClinic = useAuthStore((s) => s.clinic);

  const clinicId = onboardingClinicId || authClinic?.id || null;
  const clinicName = onboardingName || authClinic?.name || '';

  const [linkCopied, setLinkCopied] = useState(false);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);

  // Guard: must be authenticated
  if (!isAuthenticated || !clinicId) {
    return <Navigate to="/signup" replace />;
  }

  // If onboarding already completed, go to dashboard
  if (authClinic?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const checkinUrl = qrCodeUrl || `https://${webBrand.domain}/checkin/${clinicId}`;

  // Regenerate QR if missing (e.g. page refresh)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const regenerateQr = useCallback(async () => {
    if (qrCodeDataUrl) return;
    setIsRegeneratingQr(true);
    try {
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 440,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      });
      setQrCode(dataUrl, checkinUrl);
    } catch {
      // Will show fallback
    } finally {
      setIsRegeneratingQr(false);
    }
  }, [qrCodeDataUrl, checkinUrl, setQrCode]);

  // Auto-regenerate on mount if missing
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useState(() => { regenerateQr(); });

  const handleDownloadPdf = useCallback(async () => {
    if (!qrCodeDataUrl) return;
    await downloadQrCodePdf(qrCodeDataUrl, clinicName);
    try {
      await api.updateActivationProgress({ qrDownloaded: true });
    } catch { /* ignore */ }
  }, [qrCodeDataUrl, clinicName]);

  const handleShareWhatsApp = useCallback(() => {
    const message = t('onboarding.welcome.shareMessage', {
      clinicName,
      defaultValue: `Scannez ce QR code pour rejoindre la file d'attente de ${clinicName} :`,
    });
    const fullMessage = `${message}\n${checkinUrl}`;

    // Try Web Share API first (mobile)
    if (navigator.share) {
      navigator.share({
        title: clinicName,
        text: fullMessage,
        url: checkinUrl,
      }).catch(() => {
        // Fallback to WhatsApp deep link
        window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
      });
    } else {
      // Desktop: WhatsApp deep link
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
    }
  }, [t, clinicName, checkinUrl]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(checkinUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {});
  }, [checkinUrl]);

  const handleStart = useCallback(async () => {
    try {
      await api.updateOnboarding(3, true);
    } catch { /* ignore */ }
    await checkAuth();
    navigate('/dashboard', { replace: true });
  }, [checkAuth, navigate]);

  const playbook = [
    {
      title: t('onboarding.playbookStep1Title', 'Ouvrez votre tableau de bord'),
      hint: t('onboarding.playbookStep1Hint', 'Ce tableau de bord — en temps réel'),
    },
    {
      title: t('onboarding.playbookStep2Title', "Partagez le lien avec l'accueil"),
      hint: t('onboarding.playbookStep2Hint', "L'accueil peut ajouter des patients manuellement"),
    },
    {
      title: t('onboarding.playbookStep3Title', 'Affichez votre QR code'),
      hint: t('onboarding.playbookStep3Hint', "Imprimez-le et placez-le à l'entrée"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7F5' }}>
      <ProgressBar currentStep={3} />

      <main className="flex-1 flex flex-col items-center px-5 py-8 pt-10">
        <div className="w-full" style={{ maxWidth: '420px' }}>

          {/* Section 1: QR Code */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center"
            style={{ borderRadius: '12px', animation: 'welcome-fade-in 500ms ease-out' }}
          >
            <h2 className="text-xl font-bold mb-5 text-center" style={{ color: '#1A1A2E', fontSize: '22px' }}>
              {t('onboarding.welcome.qrTitle', 'Votre QR Code est prêt.')}
            </h2>

            {isRegeneratingQr ? (
              <div className="flex items-center justify-center py-12">
                <span className="animate-spin inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full" />
              </div>
            ) : qrCodeUrl ? (
              <QRCodeDisplay url={checkinUrl} clinicName={clinicName} size={200} />
            ) : null}

            <p className="text-sm text-center mt-4 mb-6" style={{ color: '#555566', lineHeight: '1.5' }}>
              {t('onboarding.welcome.qrInstruction', "Imprimez-le et affichez-le à l'accueil de votre cabinet.")}
            </p>

            {/* Action buttons */}
            <div className="w-full space-y-3">
              {/* Primary: Download PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={!qrCodeDataUrl}
                className="w-full font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#1B7A4A',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#165f3a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1B7A4A')}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                {t('onboarding.welcome.downloadPdf', 'Télécharger le PDF')}
              </button>

              {/* Secondary: WhatsApp share */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full font-semibold flex items-center justify-center gap-2"
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  border: '2px solid #1B7A4A',
                  color: '#1B7A4A',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1B7A4A">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('onboarding.welcome.shareWhatsApp', 'Envoyer par WhatsApp')}
              </button>

              {/* Tertiary: Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full text-sm flex items-center justify-center gap-1.5"
                style={{ color: '#888899', height: '36px' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                  {linkCopied ? 'check' : 'content_copy'}
                </span>
                {linkCopied
                  ? t('onboarding.welcome.linkCopied', 'Lien copié !')
                  : t('onboarding.welcome.copyLink', 'Copier le lien')
                }
              </button>
            </div>
          </div>

          {/* Section 2: First Morning Playbook */}
          <div className="mt-8" style={{ animation: 'welcome-fade-in 500ms ease-out 200ms both' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>
              {t('onboarding.playbookTitle', 'Votre premier matin avec BléSaf')}
            </h3>

            <div className="space-y-4">
              {playbook.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: '#1B7A4A' }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{step.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#888899' }}>{step.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-8 mb-4" style={{ animation: 'welcome-fade-in 500ms ease-out 400ms both' }}>
            <button
              onClick={handleStart}
              className="w-full font-semibold text-white flex items-center justify-center gap-2"
              style={{
                height: '52px',
                borderRadius: '8px',
                backgroundColor: '#1B7A4A',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#165f3a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1B7A4A')}
            >
              {t('onboarding.welcome.startCta', 'Commencer')} →
            </button>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes welcome-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
