import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { DrawerSectionLabel } from './components/DrawerSectionLabel';
import { SupportBanner } from './components/SupportBanner';
import { FaqSection } from './components/FaqSection';
import { TutorialSection } from './components/TutorialSection';
import type { HelpSupportDrawerProps } from './HelpSupportDrawer.types';

const WHATSAPP_NUMBER = '21600000000';

/* ── White card wrapper (matches SettingsPage Card) ────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #EEEDEA',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

export default function HelpSupportDrawer({
  isOpen,
  onClose,
  onFaqSelect,
  onTutorialSelect,
}: HelpSupportDrawerProps) {
  const { t, i18n } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isRtl = i18n.language === 'ar';

  // Escape key — capture phase to prevent SideDrawer from also closing
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', trap);
    first.focus();
    return () => drawer.removeEventListener('keydown', trap);
  }, [isOpen]);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  return createPortal(
    <>
      {/* Transparent backdrop — matches Settings pattern */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1002,
          background: 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel — inline styles matching Settings */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('helpSupport.title')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isRtl ? 'left' : 'right']: 0,
          zIndex: 1003,
          width: '88%',
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F5F0',
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
          fontFamily: isRtl ? "'IBM Plex Sans Arabic', sans-serif" : "'DM Sans', sans-serif",
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 56,
            padding: '0 16px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E8E6DF',
          }}
        >
          {/* Back button — rounded square matching Settings */}
          <button
            onClick={onClose}
            type="button"
            aria-label={t('common.back')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 12,
              border: 'none',
              background: '#F0EFEA',
              cursor: 'pointer',
              color: '#1A1A1A',
            }}
          >
            <Icon name={isRtl ? 'arrow_forward' : 'arrow_back'} size={18} />
          </button>

          {/* Title */}
          <span style={{ flex: 1, fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            {t('helpSupport.title')}
          </span>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            type="button"
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: '#F6F5F0',
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              color: '#6B6960',
              cursor: 'pointer',
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            }}
          >
            {i18n.language === 'fr' ? 'عربي' : 'FR'}
          </button>
        </header>

        {/* ── Body (scrollable) ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 14px 32px',
          }}
          className="help-drawer-body"
        >
          {/* Section 1: Contact support */}
          <DrawerSectionLabel icon="support_agent" label={t('helpSupport.sections.support')} />
          <SupportBanner whatsappNumber={WHATSAPP_NUMBER} />

          <div style={{ height: 20 }} />

          {/* Section 2: FAQ */}
          <DrawerSectionLabel icon="help_outline" label={t('helpSupport.sections.faq')} />
          <Card>
            <FaqSection onFaqSelect={onFaqSelect} />
          </Card>

          <div style={{ height: 20 }} />

          {/* Section 3: Tutorials */}
          <DrawerSectionLabel icon="play_circle" label={t('helpSupport.sections.tutorials')} />
          <Card>
            <TutorialSection onTutorialSelect={onTutorialSelect} />
          </Card>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '10px 16px 14px',
            borderTop: '1px solid #E8E6DF',
            textAlign: 'center',
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 400,
            color: '#9E9B90',
          }}
        >
          {t('helpSupport.footer.version', {
            version: import.meta.env.VITE_APP_VERSION ?? '2.0.0',
            year: new Date().getFullYear(),
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
