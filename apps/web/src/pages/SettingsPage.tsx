import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
import BSClinicProfilePanel from '@/components/shared/BSClinicProfilePanel';
import BSConsultationDurationPanel from '@/components/shared/BSConsultationDurationPanel';
import BSSubscriptionPanel from '@/components/shared/BSSubscriptionPanel';
import BSQueueRulesPanel from '@/components/shared/BSQueueRulesPanel';

type PanelKey = 'profile' | 'duration' | 'queue-rules' | 'subscription';

interface SubInfo {
  status: string;
  plan: string | null;
  daysRemaining: number | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

/* ── Reusable row ───────────────────────────────────────────── */
function SettingsRow({
  icon, iconBg, iconColor, label, sublabel, rightText, rightBadge, isLast, onClick,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  sublabel: string;
  rightText?: string;
  rightBadge?: { text: string; bg: string; color: string };
  isLast?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #F0EFEA',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'flex',
          width: 40,
          height: 40,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: iconBg,
        }}
      >
        <Icon name={icon} size={20} style={{ color: iconColor }} />
      </span>

      {/* Text */}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#8E9693', lineHeight: 1.3 }}>{sublabel}</span>
      </span>

      {/* Right side */}
      {rightText && (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6960', flexShrink: 0 }}>{rightText}</span>
      )}
      {rightBadge && (
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: rightBadge.color,
          background: rightBadge.bg,
          borderRadius: 999,
          padding: '3px 10px',
          flexShrink: 0,
          letterSpacing: '0.03em',
        }}>
          {rightBadge.text}
        </span>
      )}
      <Icon name="chevron_right" size={16} style={{ color: '#C5C3BC', flexShrink: 0 }} />
    </button>
  );
}

/* ── Section label ──────────────────────────────────────────── */
function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 4px',
      marginBottom: 8,
    }}>
      <Icon name={icon} size={13} style={{ color: '#8E9693' }} />
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#8E9693',
      }}>
        {label}
      </span>
    </div>
  );
}

/* ── White card wrapper ─────────────────────────────────────── */
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

/* ── Main Component ─────────────────────────────────────────── */
export default function SettingsDrawer({ isOpen, onClose, onBack }: SettingsDrawerProps) {
  const { t, i18n } = useTranslation();
  const { clinic } = useAuthStore();
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);

  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    if (isOpen) {
      api.getSubscription().then(setSubInfo).catch(() => {});
    }
  }, [isOpen]);

  // Close open panel when settings drawer closes
  useEffect(() => {
    if (!isOpen) setOpenPanel(null);
  }, [isOpen]);

  // Escape key closes settings (capture phase to prevent SideDrawer from also closing)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        if (openPanel) {
          setOpenPanel(null);
        } else {
          (onBack ?? onClose)();
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, openPanel, onBack, onClose]);

  const closePanel = () => setOpenPanel(null);

  const avgMins = clinic?.avgConsultationMins ?? 10;
  const isTrial = subInfo?.status === 'TRIAL';
  const isActive = subInfo?.status === 'ACTIVE';
  const daysLeft = subInfo?.daysRemaining ?? 0;
  const trialEndDate = subInfo?.trialEndsAt
    ? new Date(subInfo.trialEndsAt).toLocaleDateString('fr-TN', { day: 'numeric', month: 'long' })
    : '';

  return (
    <>
      {/* Transparent backdrop — catches clicks above SideDrawer's backdrop */}
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

      {/* Settings panel — same dimensions as SideDrawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title', 'Paramètres')}
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
          fontFamily: "'DM Sans', sans-serif",
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* ── Header ──────────────────────────── */}
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
          <button
            onClick={onBack ?? onClose}
            type="button"
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
            <Icon name="arrow_back" size={18} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            {t('settings.title', 'Paramètres')}
          </span>
        </header>

        {/* ── Scrollable body ─────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 32px' }}>

          {/* ── Trial / Subscription Banner ──── */}
          {subInfo && (isTrial || isActive) && (
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #3D7367 0%, #2C5748 100%)',
              borderRadius: 16,
              padding: '18px 18px 16px',
              marginBottom: 20,
            }}>
              {/* Decorative circle */}
              <div style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
                  {isTrial ? t('settings.banner.trial', 'Essai gratuit') : (subInfo.plan === 'YEARLY' ? 'Annuel' : 'Mensuel')}
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#FFFFFF',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  marginBottom: 12,
                }}>
                  {subInfo.status}
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    {daysLeft} {t('settings.banner.daysLeft', 'jours restants')}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    {isTrial && trialEndDate
                      ? `${t('settings.banner.expires', 'Expire le')} ${trialEndDate}`
                      : ''}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 999,
                    background: '#FFFFFF',
                    width: `${Math.max(3, isTrial ? 100 - (daysLeft / 30) * 100 : 100 - (daysLeft / 365) * 100)}%`,
                    transition: 'width 600ms',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* ── MON CABINET ────────────────────── */}
          <SectionLabel icon="domain" label={t('settings.section.cabinet', 'Mon cabinet')} />
          <Card>
            <SettingsRow
              icon="local_hospital"
              iconBg="#EAF3EF"
              iconColor="#356B58"
              label={t('settings.item.profile', 'Profil du cabinet')}
              sublabel={t('settings.item.profileSub', 'Nom, médecin, coordonnées')}
              onClick={() => setOpenPanel('profile')}
            />
            <SettingsRow
              icon="timer"
              iconBg="#E8F5F1"
              iconColor="#0F7B6C"
              label={t('settings.item.duration', 'Consultation')}
              sublabel={t('settings.item.durationSub', 'Estime l\'attente patient')}
              rightText={`${avgMins} min`}
              onClick={() => setOpenPanel('duration')}
            />
            <SettingsRow
              icon="sort"
              iconBg="#FEF7E6"
              iconColor="#D4920B"
              label={t('settings.item.queueRules', "Règles de la file")}
              sublabel={t('settings.item.queueRulesSub', "Priorité RDV, urgences")}
              isLast
              onClick={() => setOpenPanel('queue-rules')}
            />
          </Card>

          <div style={{ height: 20 }} />

          {/* ── ABONNEMENT ─────────────────────── */}
          <SectionLabel icon="payments" label={t('settings.section.subscription', 'Abonnement')} />
          <Card>
            <SettingsRow
              icon="receipt_long"
              iconBg="#E8F5F1"
              iconColor="#0F7B6C"
              label={t('settings.item.subscription', 'Abonnement')}
              sublabel={
                isTrial
                  ? `${t('settings.banner.trial', 'Essai gratuit')} · ${daysLeft} ${t('settings.banner.daysLeft', 'jours restants')}`
                  : isActive
                    ? (subInfo?.plan === 'YEARLY' ? 'Annuel' : 'Mensuel')
                    : t('settings.item.subscriptionSub', 'Plan, facturation, paiements')
              }
              rightBadge={isTrial ? { text: 'ESSAI', bg: '#E8F5F1', color: '#0F7B6C' } : undefined}
              isLast
              onClick={() => setOpenPanel('subscription')}
            />
          </Card>
        </div>
      </div>

      {/* ── Panels — wrapped in elevated stacking context so they paint above
           the Settings drawer (z-1003). The BS panels use z-index 80/90 in CSS,
           which would otherwise be behind the drawer. ──────────── */}
      <div style={{ position: 'relative', zIndex: 1004 }}>
        <BSClinicProfilePanel isOpen={openPanel === 'profile'} onClose={closePanel} />
        <BSConsultationDurationPanel isOpen={openPanel === 'duration'} onClose={closePanel} />
        <BSQueueRulesPanel isOpen={openPanel === 'queue-rules'} onClose={closePanel} />
        <BSSubscriptionPanel isOpen={openPanel === 'subscription'} onClose={closePanel} />
      </div>
    </>
  );
}
