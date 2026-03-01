import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

interface QrCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeSheet({ isOpen, onClose }: QrCodeSheetProps) {
  const { t } = useTranslation();
  const [qrData, setQrData] = useState<{ url: string; qrCode: string; clinicName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load QR data when sheet opens
  useEffect(() => {
    if (isOpen && !qrData && !loading) {
      setLoading(true);
      api.getQRCode()
        .then(data => setQrData(data))
        .catch(err => logger.error('QrCodeSheet: failed to load QR code', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleWhatsApp = () => {
    if (!qrData) return;
    const msg = encodeURIComponent(`${t('drawer.qr.whatsappMessage')} ${qrData.url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
  };

  const handleView = () => {
    if (qrData) window.open(qrData.url, '_blank', 'noopener');
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: '0 0 0 0',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderRadius: '16px 16px 0 0',
        background: '#FFFFFF',
        padding: '10px 14px 20px',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 360ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease',
        willChange: 'transform, opacity',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="qr_code_2" size={16} style={{ color: '#356B58' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1C1B' }}>
            {t('drawer.qr.title')}
          </span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label={t('drawer.qr.close')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#F2F4F3',
            border: 'none',
            cursor: 'pointer',
            color: '#8E9693',
          }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* QR code display */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        {loading && (
          <div style={{
            width: 88, height: 88, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F2F4F3', borderRadius: 12,
          }}>
            <div
              className="animate-spin"
              style={{ width: 24, height: 24, borderRadius: '50%', borderBottom: '2px solid #356B58' }}
            />
          </div>
        )}
        {qrData && !loading && (
          <>
            <div style={{
              display: 'inline-block',
              borderRadius: 12,
              border: '1px solid #DDE2E0',
              background: '#FFFFFF',
              padding: 10,
            }}>
              <img
                src={qrData.qrCode}
                alt={t('drawer.qr.imageAlt')}
                style={{ width: 88, height: 88, display: 'block', borderRadius: 6 }}
              />
            </div>
            <p style={{ marginTop: 6, fontSize: 10, color: '#8E9693' }}>{qrData.url}</p>
          </>
        )}
        {!qrData && !loading && (
          <div style={{
            width: 88, height: 88, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F2F4F3', borderRadius: 12,
          }}>
            <Icon name="qr_code_2" size={40} style={{ color: '#356B58' }} />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleView}
          type="button"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 4px', borderRadius: 12,
            border: '1px solid #DDE2E0', background: '#F2F4F3',
            fontSize: 10, fontWeight: 600, color: '#4A5250',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name="open_in_new" size={16} style={{ color: '#4A5250' }} />
          {t('drawer.qr.view')}
        </button>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 4px', borderRadius: 12,
            border: `1px solid ${copied ? 'rgba(45,139,78,0.3)' : '#DDE2E0'}`,
            background: copied ? '#EDF7F0' : '#F2F4F3',
            fontSize: 10, fontWeight: 600,
            color: copied ? '#2D7A4F' : '#4A5250',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms',
          }}
        >
          <Icon name="content_copy" size={16} style={{ color: copied ? '#2D7A4F' : '#4A5250' }} />
          {copied ? t('drawer.qr.copied') : t('drawer.qr.copy')}
        </button>
        <button
          onClick={handleWhatsApp}
          type="button"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 4px', borderRadius: 12,
            border: '1px solid rgba(45,122,79,0.25)', background: '#F0FBF4',
            fontSize: 10, fontWeight: 600, color: '#2D7A4F',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name="send" size={16} style={{ color: '#2D7A4F' }} />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
