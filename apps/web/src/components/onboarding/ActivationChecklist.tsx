import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { downloadQrCodePdf } from '@/utils/qrCodePdf';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';

interface ActivationProgress {
  qrDownloaded: boolean;
  firstPatientAdded: boolean;
  dismissed: boolean;
}

/**
 * Contextual empty state — replaces the queue's empty state area.
 * Shows guidance based on the doctor's activation progress:
 *   - QR not downloaded → prompt to download/share QR
 *   - QR downloaded, no patients → gentle waiting message
 *   - Activation complete → standard empty state
 */
export default function ActivationChecklist() {
  const { t } = useTranslation();
  const authClinic = useAuthStore((s) => s.clinic);
  const [progress, setProgress] = useState<ActivationProgress | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const clinicId = authClinic?.id;
  const clinicName = authClinic?.name || '';
  const checkinUrl = clinicId ? `https://${webBrand.domain}/checkin/${clinicId}` : '';

  const fetchProgress = useCallback(async () => {
    try {
      const data = await api.getActivationProgress();
      setProgress(data);
    } catch {
      // Don't block dashboard
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Generate QR data URL for PDF download
  useEffect(() => {
    if (!checkinUrl) return;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(checkinUrl, {
        width: 440,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      }).then(setQrDataUrl).catch(() => {});
    });
  }, [checkinUrl]);

  const handleDownloadQr = useCallback(async () => {
    if (!qrDataUrl) return;
    await downloadQrCodePdf(qrDataUrl, clinicName);
    try {
      await api.updateActivationProgress({ qrDownloaded: true });
      setProgress((prev) => prev ? { ...prev, qrDownloaded: true } : prev);
    } catch { /* ignore */ }
  }, [qrDataUrl, clinicName]);

  const handleShareWhatsApp = useCallback(() => {
    const message = t('onboarding.welcome.shareMessage', {
      clinicName,
      defaultValue: `Scannez ce QR code pour rejoindre la file d'attente de ${clinicName} :`,
    });
    const fullMessage = `${message}\n${checkinUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
  }, [t, clinicName, checkinUrl]);

  // Default empty state (used when fully activated or data not loaded)
  if (!progress || (progress.qrDownloaded && progress.firstPatientAdded) || progress.dismissed) {
    return (
      <div className="bs-empty-state">
        <div className="bs-empty-icon">
          <span className="material-symbols-rounded">groups</span>
        </div>
        <div className="bs-empty-text">
          {t('onboarding.emptyState.noPatients', 'Aucun patient dans la file')}
        </div>
      </div>
    );
  }

  // State: QR not downloaded → prompt to download/share
  if (!progress.qrDownloaded) {
    return (
      <div className="bs-empty-state">
        <div className="bs-empty-icon">
          <span className="material-symbols-rounded">groups</span>
        </div>
        <div className="bs-empty-text" style={{ marginBottom: '4px' }}>
          {t('onboarding.emptyState.noPatients', 'Aucun patient dans la file')}
        </div>
        <p className="text-sm mt-2 px-4 text-center" style={{ color: '#555566', lineHeight: '1.5' }}>
          {t('onboarding.emptyState.noQr', "Imprimez votre QR code et affichez-le à l'accueil.")}
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#1B7A4A' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>picture_as_pdf</span>
            {t('onboarding.emptyState.downloadQr', 'Télécharger QR')}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1.5px solid #1B7A4A', color: '#1B7A4A' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B7A4A">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('onboarding.emptyState.shareWhatsApp', 'WhatsApp')}
          </button>
        </div>
      </div>
    );
  }

  // State: QR downloaded, waiting for first patient
  return (
    <div className="bs-empty-state">
      <div className="bs-empty-icon">
        <span className="material-symbols-rounded">groups</span>
      </div>
      <div className="bs-empty-text">
        {t('onboarding.emptyState.waitingFirst', 'En attente de votre premier patient...')}
      </div>
      <p className="text-sm mt-2 px-4 text-center" style={{ color: '#888899', lineHeight: '1.5' }}>
        {t('onboarding.emptyState.qrHint', 'Votre QR code est affiché ? Les patients scanneront pour rejoindre la file.')}
      </p>
    </div>
  );
}
