import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import StepDots from '../components/StepDots';
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
   Mobile sub-components
   ════════════════════════════════════════════════════════════ */

function InscritToast() {
  const { t } = useTranslation();
  return (
    <div
      className="absolute top-[38px] right-[18px] rtl:right-auto rtl:left-[18px] z-10
                  flex items-center gap-[6px]
                  bg-[#111] text-white
                  text-[13px] font-bold tracking-[-0.01em]
                  px-[13px] py-[7px] rounded-[10px]
                  shadow-[0_4px_14px_rgba(0,0,0,0.22)]
                  animate-ob-toast-pop"
      style={{ fontFamily: 'var(--ob-font)' }}
    >
      <span
        className="w-[17px] h-[17px] flex-shrink-0 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--ob-brand-primary)' }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {t('onboarding.step4.inscritToast')}
    </div>
  );
}

function MobileStatusBadge() {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex items-center gap-[6px] text-[10.5px] font-bold tracking-[0.04em] mb-[10px]"
      style={{ color: 'var(--ob-brand-primary)' }}
    >
      <span
        className="w-[7px] h-[7px] rounded-full flex-shrink-0 animate-ob-pulse-dot"
        style={{ backgroundColor: 'var(--ob-brand-primary)' }}
      />
      {t('onboarding.step4.statusBadge')}
    </div>
  );
}

function MobileHeading() {
  const { t } = useTranslation();
  return (
    <h1
      className="text-[24px] font-bold leading-[1.18] tracking-[-0.035em] mb-2"
      style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
    >
      {t('onboarding.step4.headingLine1')}
      <br />
      <em className="not-italic" style={{ color: 'var(--ob-brand-primary)' }}>
        {t('onboarding.step4.headingLine2')}
      </em>
    </h1>
  );
}

function MobileBodyCopy() {
  const { t } = useTranslation();
  return (
    <p
      className="text-[13px] leading-[1.6] mb-4"
      style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
    >
      {t('onboarding.step4.bodyCopyMobile')}
    </p>
  );
}

function MobileQrActionButton({
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
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
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
                 active:text-white select-none
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

function MobileQrBlock({
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
      {/* QR image frame */}
      <motion.div
        className="w-[70px] h-[70px] flex-shrink-0 bg-white rounded-[9px] border border-black/[0.07] flex items-center justify-center overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <QRCodeSVG
          value={checkinUrl}
          size={58}
          level="M"
          fgColor="#1A1A2E"
          bgColor="#FFFFFF"
        />
      </motion.div>

      {/* Meta */}
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
          <MobileQrActionButton icon="download" label={t('onboarding.step4.btnDownload')} onClick={onDownload} />
          <MobileQrActionButton icon="whatsapp" label={t('onboarding.step4.btnWhatsApp')} onClick={onWhatsApp} />
        </div>
      </div>
    </div>
  );
}

function MobileStatsRow() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-[7px] mb-[18px]">
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

function MobileCtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto w-full flex items-center justify-center gap-2
                 px-5 py-[15px] rounded-[13px]
                 text-white text-[15px] font-semibold tracking-[-0.02em]
                 border-none cursor-pointer
                 transition-all duration-[180ms] ease-in-out
                 active:scale-[0.98]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                 select-none group rtl:flex-row-reverse"
      style={{
        fontFamily: 'var(--ob-font)',
        backgroundColor: 'var(--ob-brand-text)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {t('onboarding.step4.cta')}
      <svg
        width="15" height="15"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        className="transition-transform duration-[180ms] group-active:translate-x-[3px] rtl:rotate-180 rtl:group-active:-translate-x-[3px]"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   Desktop sub-components
   ════════════════════════════════════════════════════════════ */

function StatusBadge() {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[0.04em] mb-[14px]"
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

function Heading() {
  const { t } = useTranslation();
  return (
    <h1
      className="text-[30px] font-bold leading-[1.16] tracking-[-0.035em] mb-3"
      style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}
    >
      {t('onboarding.step4.headingLine1')}
      <br />
      <em className="not-italic" style={{ color: 'var(--ob-brand-primary)' }}>
        {t('onboarding.step4.headingLine2')}
      </em>
    </h1>
  );
}

function BodyCopy() {
  const { t } = useTranslation();
  return (
    <p
      className="text-[13.5px] leading-[1.65] mb-[22px] max-w-[370px]"
      style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-subtle)' }}
    >
      {t('onboarding.step4.bodyCopy')}
    </p>
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
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    whatsapp: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.68-1.227A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.697-6.042-1.884l-.424-.299-2.772.727.742-2.71-.328-.468A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-[5px]
                 text-[11.5px] font-medium whitespace-nowrap
                 px-3 py-[5px] rounded-[8px]
                 border bg-white
                 transition-all duration-[160ms] ease-in-out
                 hover:-translate-y-px
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                 rtl:flex-row-reverse"
      style={{
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
      className="flex items-center gap-[18px] rounded-[14px] px-5 py-4 mb-[14px]"
      style={{
        backgroundColor: 'var(--ob-brand-bg)',
        border: '1px solid color-mix(in srgb, var(--ob-brand-primary) 13%, transparent)',
      }}
    >
      <motion.div
        className="w-[78px] h-[78px] flex-shrink-0 bg-white rounded-[10px] border border-black/[0.07] flex items-center justify-center overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <QRCodeSVG value={checkinUrl} size={66} level="M" fgColor="#1A1A2E" bgColor="#FFFFFF" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div
          className="inline-flex items-center gap-[5px] text-[11px] font-bold tracking-[0.04em] rounded-full px-[10px] py-[3px] mb-[5px]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--ob-brand-primary) 11%, transparent)',
            color: 'var(--ob-brand-primary)',
          }}
        >
          <span className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: 'var(--ob-brand-primary)' }} />
          {t('onboarding.step4.qrStatus')}
        </div>

        <p className="text-[13px] font-semibold mb-[2px] truncate" style={{ fontFamily: 'var(--ob-font)', color: 'var(--ob-brand-text)' }}>
          {clinicName}
        </p>
        <p className="text-[11.5px] text-[#9aa49f] mb-[9px]">{displayUrl}</p>

        <div className="flex gap-[6px]">
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
    <div className="flex gap-2 mb-[22px]">
      {STATS.map((s) => (
        <div key={s.labelKey} className="flex-1 bg-white border rounded-[11px] px-[14px] py-[10px] text-center" style={{ borderColor: '#e6ebe4' }}>
          <div className="text-[16px] font-bold tracking-[-0.03em] leading-none mb-1" style={{ color: 'var(--ob-brand-text)' }}>
            {s.value}
          </div>
          <div className="text-[10px] text-[#9aa49f] font-medium uppercase tracking-[0.05em]">
            {t(s.labelKey)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto w-full flex items-center justify-center gap-[9px]
                 px-6 py-[15px] rounded-[13px]
                 text-white text-[15px] font-semibold tracking-[-0.02em]
                 border-none cursor-pointer
                 transition-all duration-200 ease-in-out
                 hover:-translate-y-0.5
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                 group rtl:flex-row-reverse"
      style={{ fontFamily: 'var(--ob-font)', backgroundColor: 'var(--ob-brand-text)' }}
    >
      {t('onboarding.step4.cta')}
      <svg
        width="16" height="16"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        className="transition-transform duration-200 group-hover:translate-x-[3px] rtl:rotate-180 rtl:group-hover:-translate-x-[3px]"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════ */

/**
 * Screen 4: QR Code reveal with confetti, WhatsApp share, PDF download.
 * Mobile: full-viewport with illustration panel, toast, drag-handle card.
 * Desktop: standalone two-panel card with glass badge overlay.
 */
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
    <>
      {/* ── Mobile layout ── */}
      <div className="md:hidden relative flex flex-col w-full min-h-screen bg-white animate-ob-screen-in">
        {/* Illustration panel */}
        <div className="relative w-full h-[310px] flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--ob-brand-bg)' }}>
          <img
            src={ILLUSTRATION_PATHS['qr-reveal']}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-[center_15%] block"
          />
          {/* Bottom gradient fade into white card */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-b from-transparent to-white pointer-events-none" />
          {/* Floating toast */}
          <InscritToast />
        </div>

        {/* White content card */}
        <div
          className="relative z-[5] flex-1 flex flex-col bg-white rounded-t-[28px] -mt-7 px-[22px] pt-[22px] pb-[28px]"
          style={{ fontFamily: 'var(--ob-font)' }}
        >
          {/* Drag handle */}
          <div className="w-9 h-1 rounded-full bg-[#dde0da] mx-auto mb-[18px]" />

          <MobileStatusBadge />
          <MobileHeading />
          <MobileBodyCopy />
          <MobileQrBlock
            checkinUrl={checkinUrl}
            clinicName={clinicName}
            onWhatsApp={handleWhatsApp}
            onDownload={handleDownloadPdf}
          />
          <MobileStatsRow />
          <MobileCtaButton onClick={onComplete} />
        </div>
      </div>

      {/* ── Desktop layout (standalone two-panel card) ── */}
      <div className="hidden md:flex md:items-center md:justify-center h-full" style={{ fontFamily: 'var(--ob-font)' }}>
        <div className="flex w-full max-w-[940px] min-h-[570px] rounded-[22px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.20),0_4px_18px_rgba(0,0,0,0.10)] animate-ob-card-in">

          {/* Left panel: illustration + glass badge */}
          <div className="relative w-[44%] flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--ob-brand-bg)' }}>
            <img
              src={ILLUSTRATION_PATHS['qr-reveal']}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center block transition-transform duration-[600ms] ease-in-out hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(27,45,37,0.72)] pointer-events-none" />
            <div className="absolute bottom-[26px] left-[22px] right-[22px] z-10
                            bg-white/[0.13] backdrop-blur-[14px]
                            border border-white/[0.22] rounded-[13px]
                            px-4 py-[13px] text-white">
              <strong className="block text-[14px] font-semibold mb-1 tracking-tight leading-snug">
                {t('onboarding.step4.badgeTitle')}
              </strong>
              <span className="text-[12.5px] opacity-[0.82] leading-[1.45]">
                {t('onboarding.step4.badgeSubtitle')}
              </span>
            </div>
          </div>

          {/* Right panel: content */}
          <div className="flex-1 bg-[#fafafa] flex flex-col px-10 py-[38px]">
            <StepDots step={step} />
            <StatusBadge />
            <Heading />
            <BodyCopy />
            <QrBlock
              checkinUrl={checkinUrl}
              clinicName={clinicName}
              onWhatsApp={handleWhatsApp}
              onDownload={handleDownloadPdf}
            />
            <StatsRow />
            <CtaButton onClick={onComplete} />
          </div>

        </div>
      </div>
    </>
  );
}
