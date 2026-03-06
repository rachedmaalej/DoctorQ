import { useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight,
  House, Users, Monitor,
  Clock, Bell, Smartphone, Globe,
  BarChart3, Mail,
  CreditCard, HelpCircle, Shield,
} from 'lucide-react';
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
  green: { bg: 'var(--accent-light)', fg: 'var(--accent)' },
  blue: { bg: 'var(--blue-light)', fg: 'var(--blue)' },
  warm: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
  gray: { bg: 'var(--surface-alt)', fg: 'var(--text-secondary)' },
  red: { bg: 'var(--danger-light)', fg: 'var(--danger)' },
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
        borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
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
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
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
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {value}
        </span>
      )}
      <ChevronRight size={16} style={{ color: 'var(--border)' }} />
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
          background: isOpen ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
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
          background: 'var(--bg)',
          zIndex: 210,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          transition: 'right 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Topbar */}
        <div
          className="sticky top-0 flex items-center gap-3"
          style={{
            padding: '14px 20px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-light)',
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
              color: 'var(--text-primary)',
            }}
          >
            <ChevronLeft size={20} />
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
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0 font-fraunces"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {initials || 'Dr'}
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }}>
              {doctorName || 'Dr.'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
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
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              {planLabel}
            </span>
          </div>
        </div>

        {/* ─── MON CABINET ─── */}
        <SettingsSection label="MON CABINET">
          <SettingsItem
            icon={<House size={18} />}
            iconColor="green"
            title="Profil du cabinet"
            description="Nom, adresse, spécialité"
            right={<ValueChevron />}
            onClick={() => setShowClinicProfile(true)}
          />
          <SettingsItem
            icon={<Clock size={18} />}
            iconColor="warm"
            title="Horaires du cabinet"
            description="Planning hebdomadaire, pauses"
            right={<ValueChevron />}
            onClick={() => setShowClinicHours(true)}
          />
          <SettingsItem
            icon={<Users size={18} />}
            iconColor="blue"
            title="Accès"
            description="Gérer les secrétaires et collaborateurs"
            right={<ValueChevron />}
            onClick={() => setShowTeamAccess(true)}
          />
          <SettingsItem
            icon={<CreditCard size={18} />}
            iconColor="green"
            title="Abonnement"
            description="Gérer votre abonnement"
            right={<ValueChevron />}
            onClick={() => setShowSubscription(true)}
          />
          <SettingsItem
            icon={<Monitor size={18} />}
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
            icon={<Clock size={18} />}
            iconColor="warm"
            title="Durée moy. consultation"
            description="Utilisée pour estimer l'attente"
            right={<ValueChevron value={`${clinic?.avgConsultationMins || 15} min`} />}
            onClick={() => setShowConsultationDuration(true)}
          />
          <SettingsItem
            icon={<Bell size={18} />}
            iconColor="blue"
            title="Notifications patients"
            description="Alertes, sons, heures silencieuses"
            right={<ValueChevron />}
            onClick={() => setShowNotifications(true)}
          />
          <SettingsItem
            icon={<Smartphone size={18} />}
            iconColor="gray"
            title="Méthodes d'enregistrement"
            description="QR code, saisie manuelle, WhatsApp"
            right={<ValueChevron />}
            onClick={() => setShowCheckInMethods(true)}
          />
          <SettingsItem
            icon={<Globe size={18} />}
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
            icon={<BarChart3 size={18} />}
            iconColor="green"
            title="Bilan de fin de journée"
            description="Résumé quotidien sur le tableau de bord"
            right={<ToggleSwitch checked={true} onChange={() => {}} />}
          />
          <SettingsItem
            icon={<Mail size={18} />}
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
            icon={<HelpCircle size={18} />}
            iconColor="gray"
            title="Aide & support"
            description="FAQ, contact, tutoriels"
            right={<ValueChevron />}
          />
          <SettingsItem
            icon={<Shield size={18} />}
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
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Se déconnecter
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>
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
          color: 'var(--text-tertiary)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
