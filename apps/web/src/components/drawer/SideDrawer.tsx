import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { webBrand } from '@/lib/brand';
import type { Clinic } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { DrawerItem } from './DrawerItem';
import { DrawerSection } from './DrawerSection';
import { QrCodeSheet } from './QrCodeSheet';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  waitingCount: number;
  isDoctorPresent: boolean;
  onCloseQueue: () => void;
}

export function SideDrawer({
  isOpen,
  onClose,
  clinic,
  waitingCount,
  isDoctorPresent,
  onCloseQueue,
}: SideDrawerProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);

  // Focus the close button when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let transition start
      const id = setTimeout(() => closeButtonRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Close QR sub-panel when drawer closes
  useEffect(() => {
    if (!isOpen) setQrSheetOpen(false);
  }, [isOpen]);

  const currentLang = i18n.language;

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleCloseQueue = () => {
    onClose();
    // TODO: show confirm dialog before calling onCloseQueue
    onCloseQueue();
  };

  const handleSettings = () => {
    onClose();
    navigate('/settings');
  };

  const handleSupport = () => {
    window.open(`mailto:${webBrand.supportEmail}`, '_blank');
  };

  // RTL-aware: drawer slides from right in LTR, left in RTL
  const isRtl = i18n.dir() === 'rtl';

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
                {isDoctorPresent ? t('drawer.header.present') : t('receptionist.header.absent')}
                {' · '}
                {waitingCount} {t('drawer.header.patients')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ─────────────────────── */}
        <div style={{ position: 'relative', display: 'flex', flex: 1, flexDirection: 'column', overflowY: 'auto' }}>

          {/* QR Code section */}
          <DrawerSection iconName="qr_code_2" label={t('drawer.sections.qr')}>
            <DrawerItem
              iconName="qr_code_2"
              iconBg="#EAF3EF"
              iconColor="#356B58"
              label={t('drawer.qr.view')}
              sublabel={t('drawer.qr.viewSub')}
              rightElement={<Icon name="open_in_new" size={15} style={{ color: '#8E9693' }} />}
              onClick={() => setQrSheetOpen(true)}
            />
          </DrawerSection>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* Actions section */}
          <DrawerSection iconName="bolt" label={t('drawer.sections.actions')}>
            <DrawerItem
              iconName="block"
              iconBg="#FFF4EE"
              iconColor="#B95F30"
              label={t('drawer.actions.closeQueue')}
              sublabel={t('drawer.actions.closeQueueSub')}
              rightElement={<Icon name="chevron_right" size={15} style={{ color: '#8E9693' }} />}
              onClick={handleCloseQueue}
            />
          </DrawerSection>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* Preferences section */}
          <DrawerSection iconName="tune" label={t('drawer.sections.preferences')}>

            {/* Language toggle — inline row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 12, padding: '8px 8px',
            }}>
              <span style={{
                display: 'flex', height: 30, width: 30, flexShrink: 0,
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, background: '#F0EFEA',
              }}>
                <Icon name="language" size={17} style={{ color: '#4A5250' }} />
              </span>
              <span style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1C1B' }}>
                  {t('drawer.preferences.language')}
                </span>
              </span>
              {webBrand.supportedLanguages.length > 1 && (
                <div style={{
                  display: 'flex', gap: 2, borderRadius: 999,
                  border: '1px solid #DDE2E0', background: '#F2F4F3', padding: 2,
                }}>
                  {(['fr', 'ar'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => i18n.changeLanguage(lang)}
                      type="button"
                      aria-label={lang === 'fr' ? 'Français' : 'العربية'}
                      aria-pressed={currentLang === lang}
                      style={{
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 9,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        background: currentLang === lang ? '#356B58' : 'transparent',
                        color: currentLang === lang ? '#FFFFFF' : '#8E9693',
                        fontFamily: 'inherit',
                      }}
                    >
                      {lang === 'fr' ? 'FR' : 'AR'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DrawerItem
              iconName="settings"
              iconBg="#F0EFEA"
              iconColor="#4A5250"
              label={t('drawer.preferences.settings')}
              sublabel={t('drawer.preferences.settingsSub')}
              rightElement={<Icon name="chevron_right" size={15} style={{ color: '#8E9693' }} />}
              onClick={handleSettings}
            />
          </DrawerSection>

          <div style={{ height: 1, background: '#EEF1F0', margin: '6px 10px' }} />

          {/* Account section */}
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

        {/* QR sub-panel — absolutely positioned inside drawer */}
        <QrCodeSheet
          isOpen={qrSheetOpen}
          onClose={() => setQrSheetOpen(false)}
        />

      </div>
    </>
  );
}
