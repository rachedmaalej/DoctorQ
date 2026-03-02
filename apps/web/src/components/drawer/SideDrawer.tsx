import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { Clinic } from '@/types';
import type { QueueScreenStatus } from '@/components/receptionist/types';
import { Icon } from '@/components/ui/Icon';
import { DrawerItem } from './DrawerItem';
import { DrawerSection } from './DrawerSection';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  waitingCount: number;
  isDoctorPresent: boolean;
  onCloseQueue: () => void;
  onOpenSettings?: () => void;
  onToggleDoctorPresent: () => void;
  isTogglingPresence?: boolean;
  queueStatus: QueueScreenStatus;
  onOpenQueue: () => void;
  onReopenQueue: () => void;
}

/* ── Reusable pill toggle row ─────────────────────────── */
function ToggleRow({
  icon, label, options, activeIndex, onToggle, disabled, warnWhenRight,
}: {
  icon: string;
  label: string;
  options: [string, string];
  activeIndex: 0 | 1;
  onToggle: (index: 0 | 1) => void;
  disabled?: boolean;
  /** Use amber highlight when the right (index 1) option is active */
  warnWhenRight?: boolean;
}) {
  const activeBg = (warnWhenRight && activeIndex === 1) ? '#B95F30' : '#356B58';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      borderRadius: 12, padding: '8px 8px',
    }}>
      <span style={{
        display: 'flex', height: 30, width: 30, flexShrink: 0,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, background: '#F0EFEA',
      }}>
        <Icon name={icon} size={17} style={{ color: '#4A5250' }} />
      </span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1A1C1B' }}>
        {label}
      </span>
      <div style={{
        display: 'flex', gap: 2, borderRadius: 999,
        border: '1px solid #DDE2E0', background: '#F2F4F3', padding: 2,
      }}>
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => !disabled && onToggle(i as 0 | 1)}
            type="button"
            aria-pressed={activeIndex === i}
            style={{
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 700,
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 150ms',
              background: activeIndex === i ? activeBg : 'transparent',
              color: activeIndex === i ? '#FFFFFF' : '#8E9693',
              opacity: disabled ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SideDrawer({
  isOpen,
  onClose,
  clinic,
  waitingCount,
  isDoctorPresent,
  onCloseQueue,
  onOpenSettings,
  onToggleDoctorPresent,
  isTogglingPresence,
  queueStatus,
  onOpenQueue,
  onReopenQueue,
}: SideDrawerProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // QR state
  const [qrData, setQrData] = useState<{ url: string; qrCode: string; clinicName: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrFullScreen, setShowQrFullScreen] = useState(false);

  const currentLang = i18n.language;
  const isRtl = i18n.dir() === 'rtl';

  // Focus close button when drawer opens
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => closeButtonRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Fetch QR data when drawer opens
  useEffect(() => {
    if (isOpen && !qrData && !qrLoading) {
      setQrLoading(true);
      api.getQRCode()
        .then(data => setQrData(data))
        .catch(err => logger.error('SideDrawer: failed to load QR', err))
        .finally(() => setQrLoading(false));
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset overlay states when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setShowQrFullScreen(false);
      setCopied(false);
    }
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────
  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleSettings = () => {
    onOpenSettings?.();
  };

  const handleSupport = () => {
    window.open(`mailto:${webBrand.supportEmail}`, '_blank');
  };

  const handleCopy = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const handleWhatsApp = () => {
    if (!qrData) return;
    const msg = encodeURIComponent(`${t('drawer.qr.whatsappMessage')} ${qrData.url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
  };

  const handleQueueToggle = (index: 0 | 1) => {
    if (index === 0) {
      if (queueStatus === 'PRE_OPEN') onOpenQueue();
      else if (queueStatus === 'CLOSING') onReopenQueue();
    } else {
      if (queueStatus === 'OPEN') onCloseQueue();
    }
  };

  const isQueueOpen = queueStatus === 'OPEN';
  const isQueueDisabled = queueStatus === 'CLOSED';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.30)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 350ms ease',
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.ariaLabel')}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isRtl ? 'left' : 'right']: 0,
          zIndex: 1001,
          width: '88%',
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: isRtl
            ? '8px 0 32px rgba(0,0,0,0.14)'
            : '-8px 0 32px rgba(0,0,0,0.14)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? 'translateX(0)'
            : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease',
          willChange: 'transform, opacity',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >

        {/* ── Header ─────────────────────────────────── */}
        <div style={{
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #3D7367 0%, #2C5748 100%)',
          padding: '18px 14px 16px',
        }}>
          {/* Decorative circles */}
          <div style={{
            pointerEvents: 'none',
            position: 'absolute',
            right: -16, top: -16,
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            pointerEvents: 'none',
            position: 'absolute',
            bottom: -10, left: '50%',
            transform: 'translateX(-50%)',
            width: 40, height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <div style={{ position: 'relative' }}>
            {/* Top row: avatar + close button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
              }}>
                <Icon name="local_hospital" size={20} style={{ color: 'rgba(255,255,255,0.9)' }} />
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                type="button"
                aria-label={t('drawer.close')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  transition: 'background 150ms',
                }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Clinic name & doctor */}
            <div style={{
              fontSize: 13, fontWeight: 800, lineHeight: 1.3,
              color: '#FFFFFF', letterSpacing: '-0.02em',
            }}>
              {clinic?.name ?? t('drawer.header.clinicFallback')}
            </div>
            {clinic?.doctorName && (
              <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>
                {clinic.doctorName}
              </div>
            )}

            {/* Status badge */}
            <div style={{
              marginTop: 8,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.12)',
              padding: '4px 10px',
            }}>
              <span style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                <span style={{
                  display: 'block', width: 6, height: 6, borderRadius: '50%',
                  background: isDoctorPresent ? '#5EB990' : '#E87070',
                }} />
                {isDoctorPresent && (
                  <span
                    className="animate-ping"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: '#5EB990', opacity: 0.4,
                    }}
                  />
                )}
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {isDoctorPresent ? t('drawer.header.present') : t('drawer.header.absent')}
                {' · '}
                {waitingCount} {t('drawer.header.patients')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ─────────────────────── */}
        <div style={{ position: 'relative', display: 'flex', flex: 1, flexDirection: 'column', overflowY: 'auto' }}>

          {/* ── QR Code section ── */}
          <DrawerSection iconName="qr_code_2" label={t('drawer.sections.qr')}>
            <div style={{ display: 'flex', gap: 6, padding: '0 4px 4px' }}>
              {/* Display full-screen */}
              <button
                onClick={() => setShowQrFullScreen(true)}
                type="button"
                disabled={!qrData && !qrLoading}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  border: '1px solid #DDE2E0', background: '#F2F4F3',
                  fontSize: 9, fontWeight: 600, color: '#4A5250',
                  cursor: 'pointer', fontFamily: 'inherit',
                  opacity: (!qrData && !qrLoading) ? 0.5 : 1,
                }}
              >
                <Icon name="fullscreen" size={17} style={{ color: '#356B58' }} />
                {t('drawer.qr.display', 'Afficher')}
              </button>
              {/* Copy URL */}
              <button
                onClick={handleCopy}
                type="button"
                disabled={!qrData}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  border: `1px solid ${copied ? 'rgba(45,139,78,0.3)' : '#DDE2E0'}`,
                  background: copied ? '#EDF7F0' : '#F2F4F3',
                  fontSize: 9, fontWeight: 600,
                  color: copied ? '#2D7A4F' : '#4A5250',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms',
                  opacity: !qrData ? 0.5 : 1,
                }}
              >
                <Icon name="content_copy" size={17} style={{ color: copied ? '#2D7A4F' : '#356B58' }} />
                {copied ? t('drawer.qr.copied') : t('drawer.qr.copy')}
              </button>
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                type="button"
                disabled={!qrData}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  border: '1px solid rgba(45,122,79,0.25)', background: '#F0FBF4',
                  fontSize: 9, fontWeight: 600, color: '#2D7A4F',
                  cursor: 'pointer', fontFamily: 'inherit',
                  opacity: !qrData ? 0.5 : 1,
                }}
              >
                <Icon name="send" size={17} style={{ color: '#2D7A4F' }} />
                WhatsApp
              </button>
            </div>
          </DrawerSection>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* ── Controls section (3 toggles) ── */}
          <DrawerSection iconName="tune" label={t('drawer.sections.controls', 'Contrôles')}>
            {webBrand.supportedLanguages.length > 1 && (
              <ToggleRow
                icon="language"
                label={t('drawer.preferences.language')}
                options={['FR', 'AR']}
                activeIndex={currentLang === 'ar' ? 1 : 0}
                onToggle={(i) => i18n.changeLanguage(i === 0 ? 'fr' : 'ar')}
              />
            )}
            <ToggleRow
              icon="person"
              label={t('drawer.toggles.doctor', 'Médecin')}
              options={[t('drawer.header.present'), t('drawer.header.absent')]}
              activeIndex={isDoctorPresent ? 0 : 1}
              onToggle={() => onToggleDoctorPresent()}
              disabled={isTogglingPresence}
              warnWhenRight
            />
            <ToggleRow
              icon="event_available"
              label={t('drawer.toggles.queue', "File d'attente")}
              options={[t('drawer.toggles.queueOpen', 'Ouverte'), t('drawer.toggles.queueClosed', 'Fermée')]}
              activeIndex={isQueueOpen ? 0 : 1}
              onToggle={handleQueueToggle}
              disabled={isQueueDisabled}
              warnWhenRight
            />
          </DrawerSection>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* ── Paramètres ── */}
          <div style={{ padding: '6px 10px' }}>
            <DrawerItem
              iconName="settings"
              iconBg="#F0EFEA"
              iconColor="#4A5250"
              label={t('drawer.preferences.settings')}
              sublabel={t('drawer.preferences.settingsSub')}
              rightElement={<Icon name="chevron_right" size={15} style={{ color: '#8E9693' }} />}
              onClick={handleSettings}
            />
          </div>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* ── Account section ── */}
          <DrawerSection iconName="manage_accounts" label={t('drawer.sections.account')}>
            <DrawerItem
              iconName="help_outline"
              iconBg="#F0EFEA"
              iconColor="#4A5250"
              label={t('drawer.account.help')}
              rightElement={<Icon name="chevron_right" size={15} style={{ color: '#8E9693' }} />}
              onClick={handleSupport}
            />
            <DrawerItem
              iconName="logout"
              iconBg="#FDF0F0"
              iconColor="#B94040"
              label={t('drawer.account.logout')}
              sublabel={t('drawer.account.logoutSub')}
              rightElement={<Icon name="chevron_right" size={15} style={{ color: '#B94040' }} />}
              danger
              onClick={handleLogout}
            />
          </DrawerSection>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #EEF1F0',
            padding: '12px 14px',
          }}>
            <p style={{ textAlign: 'center', fontSize: 9, color: '#8E9693' }}>
              BleSaf v{import.meta.env.VITE_APP_VERSION ?? '2.0.0'} · © {new Date().getFullYear()} BleSaf SARL
            </p>
          </div>
        </div>

      </div>

      {/* ── Full-screen QR overlay ──────────────────── */}
      {showQrFullScreen && (
        <div
          onClick={() => setShowQrFullScreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'linear-gradient(135deg, #2C5748 0%, #1A3D30 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowQrFullScreen(false); }}
            type="button"
            aria-label={t('drawer.qr.close')}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Icon name="close" size={22} />
          </button>

          {/* Clinic name */}
          <div style={{ marginBottom: 24, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
              {clinic?.name ?? ''}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
              {t('drawer.qr.scanMessage', 'Scannez pour rejoindre la file')}
            </div>
          </div>

          {/* QR code */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            {qrData ? (
              <img
                src={qrData.qrCode}
                alt={t('drawer.qr.imageAlt', 'QR Code')}
                style={{ width: 240, height: 240, display: 'block' }}
              />
            ) : (
              <div style={{
                width: 240, height: 240,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div
                  className="animate-spin"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    borderBottom: '3px solid #356B58',
                  }}
                />
              </div>
            )}
          </div>

          {/* URL */}
          {qrData && (
            <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '0 24px' }}>
              {qrData.url}
            </div>
          )}

          {/* Tap to close hint */}
          <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {t('drawer.qr.tapToClose', 'Appuyez pour fermer')}
          </div>
        </div>
      )}
    </>
  );
}
