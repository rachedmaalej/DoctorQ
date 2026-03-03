import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webBrand } from '@/lib/brand';
import type { QueueScreenStatus } from './types';

interface HeaderProps {
  clinicName: string;
  status: QueueScreenStatus;
  isDoctorPresent?: boolean;
  onToggleDoctorPresent?: () => void;
  isTogglingPresence?: boolean;
  className?: string;
  onOpenDrawer?: () => void;
}

export default function Header({
  clinicName,
  status,
  isDoctorPresent,
  onToggleDoctorPresent,
  isTogglingPresence = false,
  className,
  onOpenDrawer,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [presenceMenuOpen, setPresenceMenuOpen] = useState(false);
  const presenceRef = useRef<HTMLDivElement>(null);

  const showPresence = status === 'OPEN' || status === 'CLOSING';
  const showMenuBtn = status === 'OPEN' || status === 'CLOSING' || status === 'PRE_OPEN';

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  // Close presence menu on outside tap
  useEffect(() => {
    if (!presenceMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (presenceRef.current && !presenceRef.current.contains(e.target as Node)) {
        setPresenceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [presenceMenuOpen]);

  return (
    <div className={className ?? ''}>
      {/* ── Main Row ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-1.5 bg-bs-surface border-b border-bs-border">
        <span
          className="text-bs-text-primary font-bold truncate mr-2"
          style={{ fontSize: 16, letterSpacing: '-0.02em' }}
        >
          {clinicName}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {webBrand.supportedLanguages.length > 1 && (
            <button
              onClick={toggleLanguage}
              className="rounded-full font-semibold"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                backgroundColor: '#FFFFFF',
                color: '#6B6960',
                border: '1px solid #E8E6DF',
              }}
            >
              {i18n.language === 'fr' ? 'عربي' : 'FR'}
            </button>
          )}

          {/* Presence dot — dropdown with Présent / Absent */}
          {showPresence && isDoctorPresent !== undefined && (
            <div ref={presenceRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setPresenceMenuOpen(v => !v)}
                disabled={isTogglingPresence}
                className="flex items-center gap-1 rounded-full"
                style={{
                  padding: '4px 7px',
                  backgroundColor: isDoctorPresent ? '#EDF7F0' : '#FDF0ED',
                  color: isDoctorPresent ? '#2D8B4E' : '#D94F3B',
                  border: isDoctorPresent
                    ? '1px solid rgba(45,139,78,0.15)'
                    : '1px solid rgba(217,79,59,0.15)',
                  cursor: isTogglingPresence ? 'wait' : 'pointer',
                }}
              >
                <div
                  className="rounded-full"
                  style={{ width: 6, height: 6, backgroundColor: isDoctorPresent ? '#2D8B4E' : '#D94F3B', flexShrink: 0 }}
                />
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 14, transition: 'transform 0.2s', transform: presenceMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                >
                  expand_more
                </span>
              </button>

              {presenceMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #E8E6DF',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 160,
                  zIndex: 60,
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => {
                      if (!isDoctorPresent && !isTogglingPresence) onToggleDoctorPresent?.();
                      setPresenceMenuOpen(false);
                    }}
                    disabled={isTogglingPresence}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px', fontSize: 13,
                      fontWeight: isDoctorPresent ? 600 : 400,
                      color: '#2D8B4E',
                      background: isDoctorPresent ? '#EDF7F0' : 'transparent',
                      border: 'none', borderBottom: '1px solid #F0EFEA',
                      cursor: isTogglingPresence ? 'wait' : 'pointer', textAlign: 'left',
                    }}
                  >
                    <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#2D8B4E', flexShrink: 0 }} />
                    {t('receptionist.header.present')}
                    {isDoctorPresent && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16, marginLeft: 'auto' }}>check</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (isDoctorPresent && !isTogglingPresence) onToggleDoctorPresent?.();
                      setPresenceMenuOpen(false);
                    }}
                    disabled={isTogglingPresence}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px', fontSize: 13,
                      fontWeight: !isDoctorPresent ? 600 : 400,
                      color: '#D94F3B',
                      background: !isDoctorPresent ? '#FDF0ED' : 'transparent',
                      border: 'none',
                      cursor: isTogglingPresence ? 'wait' : 'pointer', textAlign: 'left',
                    }}
                  >
                    <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#D94F3B', flexShrink: 0 }} />
                    {t('receptionist.header.absent')}
                    {!isDoctorPresent && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16, marginLeft: 'auto' }}>check</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Menu button — opens SideDrawer */}
          {showMenuBtn && (
            <button
              onClick={onOpenDrawer}
              aria-label={t('drawer.ariaLabel')}
              aria-haspopup="dialog"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8,
                border: 'none', background: 'transparent',
                color: '#6B6960', cursor: 'pointer',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>menu</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
