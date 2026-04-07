import ASIcon from './ASIcon';
import { useEffect, useState } from 'react';
import type { Clinic } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import BSClinicProfilePanel from '@/components/shared/BSClinicProfilePanel';
import BSTeamAccessPanel from '@/components/shared/BSTeamAccessPanel';
import BSSubscriptionPanel from '@/components/shared/BSSubscriptionPanel';
import BSClinicHoursPanel from '@/components/shared/BSClinicHoursPanel';
import BSNotificationsPanel from '@/components/shared/BSNotificationsPanel';
import BSWaitingRoomDisplayPanel from '@/components/shared/BSWaitingRoomDisplayPanel';
import BSSecurityPanel from '@/components/shared/BSSecurityPanel';
import BSHelpSupportPanel from '@/components/shared/BSHelpSupportPanel';
import { api } from '@/lib/api';

interface ASSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
}

// Icon box color variants
type IconColor = 'green' | 'blue' | 'warm' | 'gray' | 'red';
const iconColors: Record<IconColor, { bg: string; fg: string }> = {
  green: { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)' },
  blue: { bg: 'var(--color-info-bg)', fg: 'var(--color-info)' },
  warm: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
  gray: { bg: 'var(--color-surface-alt)', fg: 'var(--color-text-secondary)' },
  red: { bg: 'var(--color-error-bg)', fg: 'var(--color-error)' },
};

interface SettingsItemProps {
  icon: React.ReactNode;
  iconColor: IconColor;
  title: string;
  description: string;
  right?: React.ReactNode;
  onClick?: () => void;
  isLast?: boolean;
}

function SettingsItem({ icon, iconColor, title, description, right, onClick, isLast }: SettingsItemProps) {
  const colors = iconColors[iconColor];
  return (
    <div
      className="flex items-center gap-3.5 cursor-pointer transition-colors"
      style={{
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.015)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icon box */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: colors.bg,
          color: colors.fg,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
          {description}
        </div>
      </div>

      {/* Right */}
      {right && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}

function ValueChevron({ value }: { value?: string }) {
  return (
    <>
      {value && (
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {value}
        </span>
      )}
      <ASIcon name="chevron_right" size={16} style={{ color: 'var(--color-border)' }} />
    </>
  );
}

export default function ASSettingsPanel({ isOpen, onClose, clinic }: ASSettingsPanelProps) {
  const { logout } = useAuthStore();
  const [showClinicProfile, setShowClinicProfile] = useState(false);
  const [showTeamAccess, setShowTeamAccess] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showClinicHours, setShowClinicHours] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWaitingRoomDisplay, setShowWaitingRoomDisplay] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // Phase 1 placeholders — real panels land in later phases
  const [showPlaceholder, setShowPlaceholder] = useState<string | null>(null);

  // Reset sub-panels when main panel closes
  useEffect(() => {
    if (!isOpen) {
      setShowClinicProfile(false);
      setShowTeamAccess(false);
      setShowSubscription(false);
      setShowClinicHours(false);
      setShowNotifications(false);
      setShowWaitingRoomDisplay(false);
      setShowQrCode(false);
      setShowSecurity(false);
      setShowHelp(false);
      setShowPlaceholder(null);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Compute initials
  const doctorName = clinic?.doctorName || clinic?.name || '';
  const initials = doctorName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  // Trial days remaining (Clinic type doesn't expose subscriptionEndsAt directly, estimate from context)
  const trialDaysLeft: number | null = null;

  const planLabel = trialDaysLeft != null
    ? `Essai gratuit · ${trialDaysLeft} jours restants`
    : 'Essai gratuit';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: isOpen ? 'rgba(44,74,62,0.4)' : 'rgba(44,74,62,0)',
          zIndex: 200,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'background 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0"
        style={{
          right: isOpen ? 0 : '-100%',
          width: '100%',
          maxWidth: 430,
          height: '100dvh',
          background: 'var(--color-bg)',
          zIndex: 210,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          transition: 'right 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Tricolor bar */}
        <div className="as-tricolor-bar" />

        {/* Topbar */}
        <div
          className="sticky top-0 flex items-center gap-3"
          style={{
            padding: '14px 20px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border-subtle)',
            zIndex: 5,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Retour"
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            <ASIcon name="chevron_left" size={20} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Paramètres
          </span>
        </div>

        {/* Clinic Profile Card */}
        <div
          className="flex items-center gap-3.5"
          style={{
            margin: '12px 20px',
            padding: 16,
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {initials || 'Dr'}
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }}>
              {doctorName || 'Dr.'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Médecin généraliste
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--color-primary-light)',
                color: '#3A7A5E',
              }}
            >
              {planLabel}
            </span>
          </div>
        </div>

        {/* ─── PRATICIENS & FILE D'ATTENTE ─── */}
        <SettingsSection label="PRATICIENS & FILE D'ATTENTE">
          <SettingsItem
            icon={<ASIcon name="group" size={18} />}
            iconColor="blue"
            title="Praticiens"
            description="Gérer votre équipe médicale"
            right={<ValueChevron />}
            onClick={() => setShowTeamAccess(true)}
          />
          <SettingsItem
            icon={<ASIcon name="notifications" size={18} />}
            iconColor="green"
            title="Notifications patients"
            description="Alertes, messages prédéfinis"
            right={<ValueChevron />}
            onClick={() => setShowNotifications(true)}
          />
          <SettingsItem
            icon={<ASIcon name="schedule" size={18} />}
            iconColor="warm"
            title="Horaires du cabinet"
            description="Jours, créneaux, jours fériés"
            right={<ValueChevron />}
            onClick={() => setShowClinicHours(true)}
          />
          <SettingsItem
            icon={<ASIcon name="local_hospital" size={18} />}
            iconColor="green"
            title="Expérience salle d'attente"
            description="Ce que vos patients voient"
            right={<ValueChevron />}
            onClick={() => setShowWaitingRoomDisplay(true)}
            isLast
          />
        </SettingsSection>

        {/* ─── MON CABINET ─── */}
        <SettingsSection label="MON CABINET">
          <SettingsItem
            icon={<ASIcon name="home" size={18} />}
            iconColor="green"
            title="Profil du cabinet"
            description="Nom, SIRET, adresse, téléphone"
            right={<ValueChevron />}
            onClick={() => setShowClinicProfile(true)}
          />
          <SettingsItem
            icon={<ASIcon name="qr_code_2" size={18} />}
            iconColor="blue"
            title="Code QR & affichage"
            description="Imprimer et partager votre QR code"
            right={<ValueChevron />}
            onClick={() => setShowQrCode(true)}
            isLast
          />
        </SettingsSection>

        {/* ─── ABONNEMENT & FACTURATION ─── */}
        <SettingsSection label="ABONNEMENT & FACTURATION">
          <SettingsItem
            icon={<ASIcon name="credit_card" size={18} />}
            iconColor="green"
            title="Mon abonnement"
            description="Gérer votre formule"
            right={<ValueChevron />}
            onClick={() => setShowSubscription(true)}
          />
          <SettingsItem
            icon={<ASIcon name="receipt_long" size={18} />}
            iconColor="blue"
            title="Factures"
            description="Historique et téléchargement"
            right={
              <>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Bientôt
                </span>
                <ASIcon name="chevron_right" size={16} style={{ color: 'var(--color-border)' }} />
              </>
            }
            onClick={() => setShowPlaceholder('invoices')}
            isLast
          />
        </SettingsSection>

        {/* ─── COMPTE & CONFIDENTIALITÉ ─── */}
        <SettingsSection label="COMPTE & CONFIDENTIALITÉ">
          <SettingsItem
            icon={<ASIcon name="lock" size={18} />}
            iconColor="gray"
            title="Sécurité"
            description="Mot de passe"
            right={<ValueChevron />}
            onClick={() => setShowSecurity(true)}
          />
          <SettingsItem
            icon={<ASIcon name="shield" size={18} />}
            iconColor="gray"
            title="Données & RGPD"
            description="Confidentialité et droits"
            right={
              <>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Bientôt
                </span>
                <ASIcon name="chevron_right" size={16} style={{ color: 'var(--color-border)' }} />
              </>
            }
            onClick={() => setShowPlaceholder('privacy')}
          />
          <SettingsItem
            icon={<ASIcon name="help" size={18} />}
            iconColor="gray"
            title="Aide & support"
            description="FAQ, contact, tutoriels"
            right={<ValueChevron />}
            onClick={() => setShowHelp(true)}
            isLast
          />
        </SettingsSection>

        {/* Footer */}
        <div style={{ padding: 20, textAlign: 'center' }}>
          <button
            onClick={() => logout()}
            className="w-full transition-colors"
            style={{
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Se déconnecter
          </button>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}>
            AuSuivant v1.0.0 · © 2026
          </div>
        </div>
      </div>

      {/* Sub-panels (slide over settings) */}
      <BSClinicProfilePanel
        isOpen={showClinicProfile}
        onClose={() => setShowClinicProfile(false)}
      />
      <BSTeamAccessPanel
        isOpen={showTeamAccess}
        onClose={() => setShowTeamAccess(false)}
        zIndex={220}
      />
      <BSSubscriptionPanel
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
      />
      <BSClinicHoursPanel
        isOpen={showClinicHours}
        onClose={() => setShowClinicHours(false)}
      />
      <BSNotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <BSWaitingRoomDisplayPanel
        isOpen={showWaitingRoomDisplay}
        onClose={() => setShowWaitingRoomDisplay(false)}
      />
      <BSSecurityPanel
        isOpen={showSecurity}
        onClose={() => setShowSecurity(false)}
      />
      <BSHelpSupportPanel
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
      {showQrCode && <ASQrCodeOverlay onClose={() => setShowQrCode(false)} />}
      {showPlaceholder && (
        <PlaceholderPanel
          id={showPlaceholder}
          onClose={() => setShowPlaceholder(null)}
        />
      )}
    </>
  );
}

function ASQrCodeOverlay({ onClose }: { onClose: () => void }) {
  const [qrData, setQrData] = useState<{ url: string; qrCode: string; clinicName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getQRCode()
      .then(data => setQrData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleWhatsApp = () => {
    if (!qrData) return;
    const msg = encodeURIComponent(`Rejoignez notre file d'attente : ${qrData.url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed"
        style={{
          zIndex: 301,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 340,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '32px 24px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--color-surface-alt, #F0EDE9)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <ASIcon name="close" size={18} />
        </button>

        {/* QR code */}
        <div style={{ textAlign: 'center' }}>
          {loading && (
            <div style={{ width: 180, height: 180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EAECE6', borderRadius: 16 }}>
              <div className="animate-spin" style={{ width: 28, height: 28, borderRadius: '50%', borderBottom: '2.5px solid var(--color-primary)' }} />
            </div>
          )}
          {qrData && !loading && (
            <>
              <div style={{ display: 'inline-block', borderRadius: 16, border: '1px solid var(--color-border)', padding: 12, background: '#FFFFFF' }}>
                <img
                  src={qrData.qrCode}
                  alt="QR Code"
                  style={{ width: 180, height: 180, display: 'block', borderRadius: 8 }}
                />
              </div>
              <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {qrData.clinicName}
              </p>
              <p style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                {qrData.url}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2" style={{ marginTop: 20 }}>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5"
            style={{
              padding: '12px 8px', borderRadius: 'var(--radius)',
              border: `1.5px solid ${copied ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: copied ? 'var(--color-primary-light)' : 'var(--color-surface)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              color: copied ? 'var(--color-primary)' : 'var(--color-text-primary)',
              transition: 'all 0.2s ease',
            }}
          >
            <ASIcon name={copied ? 'check' : 'content_copy'} size={16} />
            {copied ? 'Copié !' : 'Copier le lien'}
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5"
            style={{
              padding: '12px 8px', borderRadius: 'var(--radius)',
              border: 'none',
              background: '#25D366', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>
      </div>
    </>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          padding: '8px 20px 6px',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border-subtle)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const PLACEHOLDER_LABELS: Record<string, { title: string; message: string }> = {
  invoices: {
    title: 'Factures',
    message:
      'La génération de factures conformes (SIRET, TVA, numérotation séquentielle) sera disponible prochainement.',
  },
  privacy: {
    title: 'Données & RGPD',
    message:
      "L'export de vos données et la suppression de compte (conformément au RGPD) seront disponibles prochainement.",
  },
};

function PlaceholderPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const content = PLACEHOLDER_LABELS[id] ?? { title: '', message: '' };
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 220, background: 'rgba(44,74,62,0.4)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0"
        style={{
          right: 0,
          width: '100%',
          maxWidth: 430,
          height: '100dvh',
          background: 'var(--color-bg)',
          zIndex: 221,
          overflowY: 'auto',
        }}
      >
        {/* Tricolor bar */}
        <div className="as-tricolor-bar" />
        {/* Topbar */}
        <div
          className="sticky top-0 flex items-center gap-3"
          style={{
            padding: '14px 20px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border-subtle)',
            zIndex: 5,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Retour"
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            <ASIcon name="chevron_left" size={20} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
            {content.title}
          </span>
        </div>
        {/* Empty state */}
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-surface-alt)',
              margin: '0 auto 16px',
              color: 'var(--color-text-muted)',
            }}
          >
            <ASIcon name="hourglass_empty" size={28} />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
            }}
          >
            Bientôt disponible
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              maxWidth: 300,
              margin: '0 auto',
            }}
          >
            {content.message}
          </div>
        </div>
      </div>
    </>
  );
}
