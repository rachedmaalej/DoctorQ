import ASIcon from './ASIcon';
import { useEffect, useState } from 'react';
import type { Clinic } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import BSClinicProfilePanel from '@/components/shared/BSClinicProfilePanel';
import BSTeamAccessPanel from '@/components/shared/BSTeamAccessPanel';
import BSSubscriptionPanel from '@/components/shared/BSSubscriptionPanel';
import BSConsultationDurationPanel from '@/components/shared/BSConsultationDurationPanel';
import BSLanguagePanel from '@/components/shared/BSLanguagePanel';
import BSClinicHoursPanel from '@/components/shared/BSClinicHoursPanel';
import BSCheckInMethodsPanel from '@/components/shared/BSCheckInMethodsPanel';
import BSNotificationsPanel from '@/components/shared/BSNotificationsPanel';
import BSWaitingRoomDisplayPanel from '@/components/shared/BSWaitingRoomDisplayPanel';

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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      className="as-toggle"
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(); } }}
    >
      <div className="as-toggle-knob" />
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
  const [showConsultationDuration, setShowConsultationDuration] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showClinicHours, setShowClinicHours] = useState(false);
  const [showCheckInMethods, setShowCheckInMethods] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWaitingRoomDisplay, setShowWaitingRoomDisplay] = useState(false);

  // Reset sub-panels when main panel closes
  useEffect(() => {
    if (!isOpen) {
      setShowClinicProfile(false);
      setShowTeamAccess(false);
      setShowSubscription(false);
      setShowConsultationDuration(false);
      setShowLanguage(false);
      setShowClinicHours(false);
      setShowCheckInMethods(false);
      setShowNotifications(false);
      setShowWaitingRoomDisplay(false);
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

        {/* ─── MON CABINET ─── */}
        <SettingsSection label="MON CABINET">
          <SettingsItem
            icon={<ASIcon name="home" size={18} />}
            iconColor="green"
            title="Profil du cabinet"
            description="Nom, adresse, spécialité"
            right={<ValueChevron />}
            onClick={() => setShowClinicProfile(true)}
          />
          <SettingsItem
            icon={<ASIcon name="schedule" size={18} />}
            iconColor="warm"
            title="Horaires du cabinet"
            description="Planning hebdomadaire, pauses"
            right={<ValueChevron />}
            onClick={() => setShowClinicHours(true)}
          />
          <SettingsItem
            icon={<ASIcon name="group" size={18} />}
            iconColor="blue"
            title="Accès"
            description="Gérer les secrétaires et collaborateurs"
            right={<ValueChevron />}
            onClick={() => setShowTeamAccess(true)}
          />
          <SettingsItem
            icon={<ASIcon name="credit_card" size={18} />}
            iconColor="green"
            title="Abonnement"
            description="Gérer votre abonnement"
            right={<ValueChevron />}
            onClick={() => setShowSubscription(true)}
          />
          <SettingsItem
            icon={<ASIcon name="desktop_windows" size={18} />}
            iconColor="green"
            title="Affichage salle d'attente"
            description="Personnaliser la page patient"
            right={<ValueChevron />}
            onClick={() => setShowWaitingRoomDisplay(true)}
            isLast
          />
        </SettingsSection>

        {/* ─── FILE D'ATTENTE ─── */}
        <SettingsSection label="FILE D'ATTENTE">
          <SettingsItem
            icon={<ASIcon name="schedule" size={18} />}
            iconColor="warm"
            title="Durée moy. consultation"
            description="Utilisée pour estimer l'attente"
            right={<ValueChevron value={`${clinic?.avgConsultationMins || 15} min`} />}
            onClick={() => setShowConsultationDuration(true)}
          />
          <SettingsItem
            icon={<ASIcon name="notifications" size={18} />}
            iconColor="blue"
            title="Notifications patients"
            description="Alertes, sons, heures silencieuses"
            right={<ValueChevron />}
            onClick={() => setShowNotifications(true)}
          />
          <SettingsItem
            icon={<ASIcon name="smartphone" size={18} />}
            iconColor="gray"
            title="Méthodes d'enregistrement"
            description="QR code, saisie manuelle, WhatsApp"
            right={<ValueChevron />}
            onClick={() => setShowCheckInMethods(true)}
          />
          <SettingsItem
            icon={<ASIcon name="language" size={18} />}
            iconColor="gray"
            title="Langue"
            description={clinic?.language === 'ar' ? 'العربية' : 'Français'}
            right={<ValueChevron value={clinic?.language === 'ar' ? 'AR' : 'FR'} />}
            onClick={() => setShowLanguage(true)}
            isLast
          />
        </SettingsSection>

        {/* ─── BILAN & RAPPORTS ─── */}
        <SettingsSection label="BILAN & RAPPORTS">
          <SettingsItem
            icon={<ASIcon name="bar_chart" size={18} />}
            iconColor="green"
            title="Bilan de fin de journée"
            description="Résumé quotidien sur le tableau de bord"
            right={<ToggleSwitch checked={true} onChange={() => {}} />}
          />
          <SettingsItem
            icon={<ASIcon name="mail" size={18} />}
            iconColor="blue"
            title="Rapport hebdomadaire"
            description="E-mail chaque lundi avec vos statistiques"
            right={<ToggleSwitch checked={true} onChange={() => {}} />}
            isLast
          />
        </SettingsSection>

        {/* ─── COMPTE ─── */}
        <SettingsSection label="COMPTE">
          <SettingsItem
            icon={<ASIcon name="help" size={18} />}
            iconColor="gray"
            title="Aide & support"
            description="FAQ, contact, tutoriels"
            right={<ValueChevron />}
          />
          <SettingsItem
            icon={<ASIcon name="shield" size={18} />}
            iconColor="gray"
            title="Confidentialité & RGPD"
            description="Politique de données, droits patients"
            right={<ValueChevron />}
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
      />
      <BSSubscriptionPanel
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
      />
      <BSConsultationDurationPanel
        isOpen={showConsultationDuration}
        onClose={() => setShowConsultationDuration(false)}
      />
      <BSLanguagePanel
        isOpen={showLanguage}
        onClose={() => setShowLanguage(false)}
      />
      <BSClinicHoursPanel
        isOpen={showClinicHours}
        onClose={() => setShowClinicHours(false)}
      />
      <BSCheckInMethodsPanel
        isOpen={showCheckInMethods}
        onClose={() => setShowCheckInMethods(false)}
      />
      <BSNotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <BSWaitingRoomDisplayPanel
        isOpen={showWaitingRoomDisplay}
        onClose={() => setShowWaitingRoomDisplay(false)}
      />
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
