import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import OnboardingLayout from '../components/OnboardingLayout';
import PillButton from '../components/PillButton';
import { ILLUSTRATION_PATHS } from '../constants/onboardingConfig';
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

const STATS = [
  { value: '0 app', labelKey: 'onboarding.step4.stat2Label' },
  { value: '90 s', labelKey: 'onboarding.step4.stat1Label' },
  { value: '30 j', labelKey: 'onboarding.step4.stat3Label' },
] as const;

/* ════════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════════ */

function StatusBadge() {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex items-center gap-[6px] text-[11px] font-bold tracking-[0.04em] mb-2"
      style={{ color: 'var(--ob-brand-primary)' }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 animate-ob-pulse-dot"
        style={{ backgroundColor: 'var(--ob-brand-primary)' }}
      />
      {t('onboarding.step4.statusBadge')}
    </div>
  );
}

function QrActionButton({
  icon,
  label,
  onClick,
}: {
  icon: 'download' | 'whatsapp';
  label: string;
  onClick: () => void;
}) {
  const icons = {
    download: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    whatsapp: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.68-1.227A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.697-6.042-1.884l-.424-.299-2.772.727.742-2.71-.328-.468A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1
                 text-[11px] font-medium whitespace-nowrap
                 px-[10px] py-1 rounded-[7px]
                 border bg-white
                 transition-all duration-150 ease-in-out
                 active:scale-[0.97] md:hover:-translate-y-px
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                 rtl:flex-row-reverse"
      style={{
        WebkitTapHighlightColor: 'transparent',
        borderColor: 'color-mix(in srgb, var(--ob-brand-primary) 20%, transparent)',
        color: 'var(--ob-brand-primary)',
      }}
    >
      {icons[icon]}
      {label}
    </button>
  );
}

function QrBlock({
  checkinUrl,
  clinicName,
  onWhatsApp,
  onDownload,
}: {
  checkinUrl: string;
  clinicName: string;
  onWhatsApp: () => void;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const displayUrl = `${webBrand.domain}/checkin/...`;

  return (
    <div
      className="flex items-center gap-[14px] rounded-[14px] px-4 py-[14px] mb-3"
      style={{
        backgroundColor: 'var(--ob-brand-bg)',
        border: '1px solid color-mix(in srgb, var(--ob-brand-primary) 13%, transparent)',
      }}
    >
      <motion.div
        className="w-[66px] h-[66px] md:w-[74px] md:h-[74px] flex-shrink-0 bg-white rounded-[9px] border border-black/[0.07] flex items-center justify-center overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <QRCodeSVG
          value={checkinUrl}
          size={54}
          level="M"
          fgColor="#1A1A2E"
          bgColor="#FFFFFF"
          className="md:!w-[62px] md:!h-[62px]"
        />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div
          className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.04em] rounded-full px-2 py-[2px] mb-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--ob-brand-primary) 11%, transparent)',
            color: 'var(--ob-brand-primary)',
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'var(--ob-brand-primary)' }} />
          {t('onboarding.step4.qrStatusMobile')}
        </div>

        <p className="text-[12.5px] font-semibold mb-[1px] truncate" style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}>
          {clinicName}
        </p>

        <p className="text-[11px] text-[#9aa49f] mb-2">{displayUrl}</p>

        <div className="flex gap-[5px] flex-wrap">
          <QrActionButton icon="download" label={t('onboarding.step4.btnDownload')} onClick={onDownload} />
          <QrActionButton icon="whatsapp" label={t('onboarding.step4.btnWhatsApp')} onClick={onWhatsApp} />
        </div>
      </div>
    </div>
  );
}

function StatsRow() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-[7px] mb-4">
      {STATS.map((s) => (
        <div key={s.labelKey} className="flex-1 bg-white border rounded-[10px] px-[10px] py-[9px] text-center" style={{ borderColor: '#e6ebe4' }}>
          <div className="text-[15px] font-bold tracking-[-0.03em] leading-none mb-[3px]" style={{ color: 'var(--ob-brand-text)' }}>
            {s.value}
          </div>
          <div className="text-[9px] text-[#9aa49f] font-medium uppercase tracking-[0.05em]">
            {t(s.labelKey)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════ */

export default function QRRevealScreen({
  step,
  clinicId,
  clinicName,
  onComplete,
}: QRRevealScreenProps) {
  const { t } = useTranslation();
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
    const message = t('onboarding.step4.whatsappMessage');
    const text = encodeURIComponent(`${message} ${checkinUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [t, checkinUrl]);

  const handleDownloadPdf = useCallback(async () => {
    if (!qrDataUrl) return;
    trackOnboarding(EVENTS.QR_DOWNLOADED_PDF);
    await downloadQrCodePdf(qrDataUrl, clinicName);
  }, [qrDataUrl, clinicName]);

  return (
    <OnboardingLayout
      step={step}
      illustrationSrc={ILLUSTRATION_PATHS['qr-reveal']}
      illustrationAlt="QR code reveal celebration"
      illustrationHeight="65dvh"
    >
      <div className="flex flex-col">
        {/* Desktop step label */}
        <span
          className="hidden md:block text-[12px] font-medium mb-1"
          style={{ color: 'var(--ob-brand-subtle)' }}
        >
          Étape 3 / 3
        </span>

        <StatusBadge />

        <h1
          className="text-[22px] font-bold leading-tight mb-[2px] md:text-[28px] md:mb-[5px]"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
        >
          {t('onboarding.step4.headingLine1')}
          <br />
          <em className="not-italic" style={{ color: 'var(--ob-brand-primary)' }}>
            {t('onboarding.step4.headingLine2')}
          </em>
        </h1>

        <p
          className="text-[13px] leading-relaxed mb-3 md:text-[14px] md:mb-4"
          style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
        >
          {t('onboarding.step4.bodyCopy')}
        </p>

        <QrBlock
          checkinUrl={checkinUrl}
          clinicName={clinicName}
          onWhatsApp={handleWhatsApp}
          onDownload={handleDownloadPdf}
        />

        <StatsRow />

        <PillButton onClick={onComplete}>
          {t('onboarding.step4.cta')} <span aria-hidden="true">&rarr;</span>
        </PillButton>
      </div>
    </OnboardingLayout>
  );
}
