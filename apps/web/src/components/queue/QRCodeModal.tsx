import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Toast, useToast } from '@/components/ui/Toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [qrData, setQrData] = useState<{
    url: string;
    qrCode: string;
    clinicName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    }
  }, [isOpen]);

  const fetchQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getQRCode();
      setQrData(data);
    } catch (err: any) {
      logger.error('Failed to fetch QR code:', err);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('qrCode.title') || 'Patient Check-in QR Code'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('common.loading')}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {qrData && !isLoading && (
              <>
                <div className="bg-gray-50 rounded-xl p-8 text-center mb-6">
                  <img
                    src={qrData.qrCode}
                    alt="QR Code"
                    className="mx-auto max-w-sm w-full"
                  />
                  <p className="mt-4 text-gray-600">
                    {t('qrCode.scanInstructions') ||
                      'Patients can scan this QR code to check in to the queue'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      {t('qrCode.shareLink') || 'Or share this link:'}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={qrData.url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('qrCode.copy') || 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {/* WhatsApp icon */}
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t('qrCode.shareWhatsApp') || 'Partager sur WhatsApp'}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
