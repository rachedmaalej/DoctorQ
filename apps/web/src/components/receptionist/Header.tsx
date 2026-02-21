import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { QueueScreenStatus } from './types';
import StatusPill from './StatusPill';
import StatsStrip from './StatsStrip';
import { useAuthStore } from '@/stores/authStore';
import BSClinicProfilePanel from '@/components/blesaf/BSClinicProfilePanel';
import BSTeamAccessPanel from '@/components/blesaf/BSTeamAccessPanel';
import BSSubscriptionPanel from '@/components/blesaf/BSSubscriptionPanel';
import BSConsultationDurationPanel from '@/components/blesaf/BSConsultationDurationPanel';
import BSLanguagePanel from '@/components/blesaf/BSLanguagePanel';

type PanelKey = 'qr' | 'whatsapp' | 'duration' | 'settings' | 'clinic-profile' | 'team-access' | 'subscription' | 'consultation-duration' | 'language' | null;

interface HeaderProps {
  clinicName: string;
  avgConsultMins?: number;
  status: QueueScreenStatus;
  isAllDone?: boolean;
  onStatusPillClick?: () => void;
  isDoctorPresent?: boolean;
  onToggleDoctorPresent?: () => void;
  isTogglingPresence?: boolean;
  showStats?: boolean;
  chip1Value?: number;
  chip2Value?: number;
  chip3Value?: string;
  className?: string;
  onWhatsAppClick?: () => void;
}

export default function Header({
  clinicName,
  avgConsultMins = 13,
  status,
  isAllDone,
  onStatusPillClick,
  isDoctorPresent,
  onToggleDoctorPresent,
  isTogglingPresence = false,
  showStats,
  chip1Value = 0,
  chip2Value = 0,
  chip3Value = '',
  className,
  onWhatsAppClick,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey>(null);
  const [presenceMenuOpen, setPresenceMenuOpen] = useState(false);
  const presenceRef = useRef<HTMLDivElement>(null);

  // QR code data
  const [qrData, setQrData] = useState<{ url: string; qrCode: string; clinicName: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const showPresence = status === 'OPEN' || status === 'CLOSING';
  const showDrawerToggle = status === 'OPEN' || status === 'CLOSING' || status === 'PRE_OPEN';

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  // Fetch QR code when the QR panel opens
  useEffect(() => {
    if (activePanel === 'qr' && !qrData && !qrLoading) {
      setQrLoading(true);
      api.getQRCode()
        .then(data => setQrData(data))
        .catch(err => logger.error('Failed to fetch QR code:', err))
        .finally(() => setQrLoading(false));
    }
  }, [activePanel, qrData, qrLoading]);

  const openPanel = (key: PanelKey) => {
    setActivePanel(key);
    setDrawerOpen(false);
  };

  const closePanel = () => setActivePanel(null);

  const handleCopyLink = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      /* clipboard failed */
    }
  };

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

          {showPresence && isDoctorPresent !== undefined && (
            <div ref={presenceRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setPresenceMenuOpen(!presenceMenuOpen)}
                className="flex items-center gap-1.5 rounded-full"
                style={{
                  padding: '4px 10px 4px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: isDoctorPresent ? '#EDF7F0' : '#FDF0ED',
                  color: isDoctorPresent ? '#2D8B4E' : '#D94F3B',
                  border: isDoctorPresent
                    ? '1px solid rgba(45,139,78,0.15)'
                    : '1px solid rgba(217,79,59,0.15)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isDoctorPresent ? '#2D8B4E' : '#D94F3B' }}
                />
                <span>{isDoctorPresent ? t('receptionist.header.present') : t('receptionist.header.absent')}</span>
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: 14,
                    marginLeft: 1,
                    transition: 'transform 0.2s',
                    transform: presenceMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                >
                  expand_more
                </span>
              </button>

              {/* Presence dropdown */}
              {presenceMenuOpen && (
                <div
                  style={{
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
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {/* Présent option */}
                  <button
                    onClick={() => {
                      if (!isDoctorPresent && !isTogglingPresence) onToggleDoctorPresent?.();
                      setPresenceMenuOpen(false);
                    }}
                    disabled={isTogglingPresence}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px',
                      fontSize: 13,
                      fontWeight: isDoctorPresent ? 600 : 400,
                      color: '#2D8B4E',
                      background: isDoctorPresent ? '#EDF7F0' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #F0EFEA',
                      cursor: isTogglingPresence ? 'wait' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{ width: 8, height: 8, backgroundColor: '#2D8B4E', flexShrink: 0 }}
                    />
                    {t('receptionist.header.present')}
                    {isDoctorPresent && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16, marginLeft: 'auto' }}>check</span>
                    )}
                  </button>

                  {/* Absent option */}
                  <button
                    onClick={() => {
                      if (isDoctorPresent && !isTogglingPresence) onToggleDoctorPresent?.();
                      setPresenceMenuOpen(false);
                    }}
                    disabled={isTogglingPresence}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px',
                      fontSize: 13,
                      fontWeight: !isDoctorPresent ? 600 : 400,
                      color: '#D94F3B',
                      background: !isDoctorPresent ? '#FDF0ED' : 'transparent',
                      border: 'none',
                      cursor: isTogglingPresence ? 'wait' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{ width: 8, height: 8, backgroundColor: '#D94F3B', flexShrink: 0 }}
                    />
                    {t('receptionist.header.absent')}
                    {!isDoctorPresent && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16, marginLeft: 'auto' }}>check</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {!showPresence && (
            <StatusPill
              status={status}
              isAllDone={isAllDone}
              onClick={onStatusPillClick}
            />
          )}

          {showDrawerToggle && (
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="flex items-center justify-center"
              aria-label={drawerOpen ? t('receptionist.header.closeTools') : t('receptionist.header.openTools')}
              aria-expanded={drawerOpen}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: drawerOpen ? '#0F7B6C' : '#6B6960',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                expand_more
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable Drawer (4 buttons in 2×2 grid) ── */}
      <div
        className="overflow-hidden border-b border-bs-border bg-bs-surface"
        style={{
          maxHeight: drawerOpen ? 200 : 0,
          opacity: drawerOpen ? 1 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
          borderBottomWidth: drawerOpen ? 1 : 0,
        }}
      >
        <div className="px-5 pt-1.5 pb-3.5">
          <div
            className="text-bs-text-tertiary font-semibold mb-2 uppercase"
            style={{ fontSize: 10, letterSpacing: '1px' }}
          >
            {t('receptionist.header.quickTools')}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* QR Code */}
            <button
              onClick={() => openPanel('qr')}
              className="bs-tool-chip flex items-center gap-2"
              style={{
                padding: '10px 12px',
                background: '#F6F5F0',
                border: '1px solid #E8E6DF',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#0F7B6C' }}>
                qr_code_2
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{t('receptionist.header.qrCode')}</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => onWhatsAppClick?.()}
              className="bs-tool-chip flex items-center gap-2"
              style={{
                padding: '10px 12px',
                background: '#F6F5F0',
                border: '1px solid #E8E6DF',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#0F7B6C' }}>
                share
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{t('receptionist.header.whatsapp')}</span>
            </button>

            {/* Durée consultation */}
            <button
              onClick={() => openPanel('duration')}
              className="bs-tool-chip flex items-center gap-2"
              style={{
                padding: '10px 12px',
                background: '#F6F5F0',
                border: '1px solid #E8E6DF',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#D4920B' }}>
                timer
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{t('receptionist.header.consultDuration')}</span>
            </button>

            {/* Paramètres */}
            <button
              onClick={() => openPanel('settings')}
              className="bs-tool-chip flex items-center gap-2"
              style={{
                padding: '10px 12px',
                background: '#F6F5F0',
                border: '1px solid #E8E6DF',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#6B6960' }}>
                settings
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{t('receptionist.header.settings')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ───────────────────────────────── */}
      {showStats && (
        <div className="px-5 pt-1.5 pb-2">
          <StatsStrip
            status={status}
            chip1Value={chip1Value}
            chip2Value={chip2Value}
            chip3Value={chip3Value}
          />
        </div>
      )}

      {/* ═══ Right Slide Panels ═══ */}
      {/* Backdrop */}
      {activePanel && (
        <div
          className="bs-panel-backdrop"
          onClick={closePanel}
        />
      )}

      {/* QR Code Panel */}
      <div className={`bs-right-panel ${activePanel === 'qr' ? 'open' : ''}`}>
        <div className="bs-panel-header">
          <button onClick={closePanel} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">{t('receptionist.header.qrCode')}</span>
        </div>
        <div className="bs-panel-body" style={{ textAlign: 'center' }}>
          {qrLoading && (
            <div style={{ padding: '40px 0' }}>
              <div
                className="animate-spin rounded-full mx-auto"
                style={{ width: 40, height: 40, borderBottom: '2px solid #0F7B6C' }}
              />
            </div>
          )}
          {qrData && !qrLoading && (
            <>
              <img
                src={qrData.qrCode}
                alt="QR Code"
                style={{
                  width: 220,
                  height: 220,
                  margin: '0 auto',
                  borderRadius: 12,
                  border: '1px solid #E8E6DF',
                }}
              />
              <p style={{ fontSize: 14, color: '#6B6960', marginTop: 16 }}>
                {t('receptionist.header.scanToJoin')}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '10px 20px',
                    background: linkCopied ? '#EDF7F0' : '#F0EFEA',
                    border: linkCopied ? '1px solid rgba(45,139,78,0.2)' : '1px solid #E8E6DF',
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 600,
                    color: linkCopied ? '#2D8B4E' : '#6B6960',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    {linkCopied ? 'check' : 'content_copy'}
                  </span>
                  {linkCopied ? t('receptionist.header.copied') : t('receptionist.header.copyLink')}
                </button>
                <button
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '10px 20px',
                    background: '#0F7B6C',
                    border: 'none',
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (qrData?.qrCode) {
                      const link = document.createElement('a');
                      link.href = qrData.qrCode;
                      link.download = 'qrcode-blesaf.png';
                      link.click();
                    }
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
                  {t('receptionist.header.download')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Duration Panel */}
      <div className={`bs-right-panel ${activePanel === 'duration' ? 'open' : ''}`}>
        <div className="bs-panel-header">
          <button onClick={closePanel} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">{t('receptionist.header.consultDuration')}</span>
        </div>
        <div className="bs-panel-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 64, color: '#D4920B' }}>
            timer
          </span>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
              {avgConsultMins}
            </span>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#6B6960', marginLeft: 4 }}>{t('receptionist.header.min')}</span>
          </div>
          <p style={{ fontSize: 14, color: '#6B6960', marginTop: 12 }}>
            {t('receptionist.header.avgConsultDuration')}
          </p>
          <div
            className="inline-flex items-center gap-1"
            style={{
              background: '#FEF7E6',
              color: '#D4920B',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 100,
              marginTop: 12,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 12 }}>schedule</span>
            {t('receptionist.header.soonConfigurable')}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className={`bs-right-panel ${activePanel === 'settings' ? 'open' : ''}`}>
        <div className="bs-panel-header">
          <button onClick={closePanel} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">{t('receptionist.header.settings')}</span>
        </div>
        <div className="bs-panel-body">
          {/* Cabinet section */}
          <div className="bs-settings-label">{t('receptionist.header.cabinetSection')}</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => setActivePanel('clinic-profile')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>domain</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('receptionist.header.clinicProfile')}</div>
                <div className="bs-settings-desc">{t('receptionist.header.clinicProfileDesc')}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <button className="bs-settings-item" onClick={() => setActivePanel('team-access')}>
              <div className="bs-settings-ico" style={{ background: '#EDF3FC', color: '#3B7DD9' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>group</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('receptionist.header.teamAccess')}</div>
                <div className="bs-settings-desc">{t('receptionist.header.teamAccessDesc')}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <button className="bs-settings-item" onClick={() => setActivePanel('subscription')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>card_membership</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('receptionist.header.subscription')}</div>
                <div className="bs-settings-desc">{t('receptionist.header.subscriptionDesc')}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
          </div>

          {/* File d'attente section */}
          <div className="bs-settings-label">{t('receptionist.header.queueSection')}</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => setActivePanel('consultation-duration')}>
              <div className="bs-settings-ico" style={{ background: '#FEF7E6', color: '#D4920B' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>timer</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('receptionist.header.consultDuration')}</div>
                <div className="bs-settings-desc">{t('receptionist.header.consultDurationDesc', { mins: avgConsultMins })}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <button className="bs-settings-item" onClick={() => setActivePanel('language')}>
              <div className="bs-settings-ico" style={{ background: '#F0EFEA', color: '#6B6960' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>translate</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('receptionist.header.language')}</div>
                <div className="bs-settings-desc">{i18n.language === 'fr' ? 'Français' : 'العربية'}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
          </div>

          {/* Compte section */}
          <div className="bs-settings-label">{t('receptionist.header.accountSection')}</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => { closePanel(); logout(); }}>
              <div className="bs-settings-ico" style={{ background: '#FDF0ED', color: '#D94F3B' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>logout</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name" style={{ color: '#D94F3B' }}>{t('receptionist.header.logout')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-panels (slide over settings panel) */}
      <BSClinicProfilePanel
        isOpen={activePanel === 'clinic-profile'}
        onClose={() => setActivePanel('settings')}
      />
      <BSTeamAccessPanel
        isOpen={activePanel === 'team-access'}
        onClose={() => setActivePanel('settings')}
      />
      <BSSubscriptionPanel
        isOpen={activePanel === 'subscription'}
        onClose={() => setActivePanel('settings')}
      />
      <BSConsultationDurationPanel
        isOpen={activePanel === 'consultation-duration'}
        onClose={() => setActivePanel('settings')}
      />
      <BSLanguagePanel
        isOpen={activePanel === 'language'}
        onClose={() => setActivePanel('settings')}
      />
    </div>
  );
}
