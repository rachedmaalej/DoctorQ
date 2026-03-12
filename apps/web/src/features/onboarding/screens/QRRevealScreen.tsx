import { useEffect, useCallback, useState } from 'react';
import type React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import ProgressBar from '../components/ProgressBar';
import IllustrationPanel from '../components/IllustrationPanel';
import ContentCard from '../components/ContentCard';
import PillButton from '../components/PillButton';
import { SCREEN_COPY, ILLUSTRATION_PATHS } from '../constants/onboardingConfig';
import { trackOnboarding, EVENTS } from '../hooks/useOnboardingAnalytics';
import { downloadQrCodePdf } from '@/utils/qrCodePdf';
import { webBrand } from '@/lib/brand';
import QRCode from 'qrcode';

interface QRRevealScreenProps {
  step: number;
  clinicId: string;
  clinicName: string;
  onComplete: () => void;
}

/**
 * Screen 4: QR Code reveal with confetti, WhatsApp share, PDF download.
 */
export default function QRRevealScreen({
  step,
  clinicId,
  clinicName,
  onComplete,
}: QRRevealScreenProps) {
  const copy = SCREEN_COPY.qrReveal;
  const checkinUrl = `https://${webBrand.domain}/checkin/${clinicId}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Fire confetti on mount
  useEffect(() => {
    trackOnboarding(EVENTS.QR_VIEWED);

    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#1B6B45', '#F4A261', '#A8D5C2', '#FFFFFF'],
        scalar: 0.9,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Generate QR data URL for PDF download
  useEffect(() => {
    QRCode.toDataURL(checkinUrl, {
      width: 440,
      margin: 2,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    }).then(setQrDataUrl).catch(() => {});
  }, [checkinUrl]);

  const handleWhatsApp = useCallback(() => {
    trackOnboarding(EVENTS.QR_SHARED_WHATSAPP);
    const text = encodeURIComponent(
      `Scannez ce QR code pour rejoindre la file d'attente de ${clinicName}: ${checkinUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [clinicName, checkinUrl]);

  const handleDownloadPdf = useCallback(async () => {
    if (!qrDataUrl) return;
    trackOnboarding(EVENTS.QR_DOWNLOADED_PDF);
    await downloadQrCodePdf(qrDataUrl, clinicName);
  }, [qrDataUrl, clinicName]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ '--ob-illustration-h': '55dvh' } as React.CSSProperties}
    >
      <div className="relative">
        <ProgressBar step={step} />
        <IllustrationPanel
          src={ILLUSTRATION_PATHS['qr-reveal']}
          alt="Patient scanning QR code"
        />
      </div>

      <ContentCard>
        <div className="flex flex-col items-center justify-center h-full text-center gap-2">
        <h1
          className="text-[24px] font-bold leading-tight"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
        >
          {copy.headline} <span role="img" aria-label="party">🎉</span>
        </h1>
        <p
          className="text-[14px] leading-relaxed"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
        >
          {copy.subtitle}
        </p>

        {/* QR Code with spring entrance */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
            <QRCodeSVG
              value={checkinUrl}
              size={180}
              level="M"
              fgColor="#1A1A2E"
              bgColor="#FFFFFF"
            />
          </div>
          <p
            className="mt-3 text-[14px] font-medium"
            style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
          >
            {clinicName}
          </p>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-3">
          <PillButton onClick={handleWhatsApp}>
            {copy.whatsapp}
          </PillButton>
          <PillButton variant="outlined" onClick={handleDownloadPdf}>
            {copy.download}
          </PillButton>
        </div>

        {/* Go to dashboard link */}
        <button
          type="button"
          onClick={onComplete}
          className="text-[14px] font-medium hover:underline transition-all"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-primary)' }}
        >
          {copy.dashboard} <span aria-hidden="true">&rarr;</span>
        </button>
        </div>
      </ContentCard>
    </div>
  );
}
