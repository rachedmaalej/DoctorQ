import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  MD3Card,
  MD3CardHeader,
  MD3CardTitle,
  MD3CardDescription,
  MD3CardContent,
  MD3CardFooter,
} from '@/components/md3/card';
import { MD3Button } from '@/components/md3/button';

interface QRCodeCardProps {
  compact?: boolean;
}

export default function QRCodeCard({ compact = false }: QRCodeCardProps) {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [qrData, setQrData] = useState<{
    url: string;
    qrCode: string;
    clinicName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getQRCode();
      setQrData(data);
    } catch (err: any) {
      console.error('Failed to fetch QR code:', err);
      setError(err.message || 'Failed to load QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!qrData) return;
    const message = `${qrData.clinicName} - ${t('qrCode.whatsappMessage') || 'Rejoignez la file d\'attente'}: ${qrData.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (qrData) {
      try {
        await navigator.clipboard.writeText(qrData.url);
        showToast(t('qrCode.linkCopied') || 'Link copied to clipboard!', 'success');
      } catch (err) {
        showToast(t('qrCode.copyFailed') || 'Failed to copy link', 'error');
      }
    }
  };

  return (
    <>
      <MD3Card variant="outlined" shape="large" className="w-full">
        <MD3CardHeader className={compact ? 'p-4 pb-2' : 'p-6 pb-3'}>
          <MD3CardTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">qr_code_2</span>
            {t('qrCode.title') || 'Patient Check-in'}
          </MD3CardTitle>
          {!compact && (
            <MD3CardDescription>
              {t('qrCode.scanInstructions') || 'Patients can scan this QR code to check in'}
            </MD3CardDescription>
          )}
        </MD3CardHeader>

        <MD3CardContent className={`flex flex-col items-center ${compact ? 'p-4 pt-0' : 'p-6 pt-0'}`}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              <p className="mt-3 text-sm text-gray-500">{t('common.loading')}</p>
            </div>
          )}

          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
              <button
                onClick={fetchQRCode}
                className="ml-2 underline hover:no-underline"
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          )}

          {qrData && !isLoading && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <img
                src={qrData.qrCode}
                alt="QR Code"
                className={compact ? 'w-40 h-40' : 'w-56 h-56'}
              />
            </div>
          )}
        </MD3CardContent>

        {qrData && !isLoading && (
          <MD3CardFooter className={`justify-center gap-2 flex-wrap ${compact ? 'p-4 pt-0' : 'p-6 pt-4'}`}>
            <MD3Button
              variant="tonal"
              size="sm"
              onClick={handleCopyLink}
              icon={<span className="material-symbols-outlined text-lg">content_copy</span>}
            >
              {!compact && (t('qrCode.copy') || 'Copy Link')}
            </MD3Button>
            <MD3Button
              variant="tonal"
              size="sm"
              onClick={handleShareWhatsApp}
              icon={<span className="material-symbols-outlined text-lg">share</span>}
            >
              {!compact && (t('qrCode.share') || 'Share')}
            </MD3Button>
          </MD3CardFooter>
        )}
      </MD3Card>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}
