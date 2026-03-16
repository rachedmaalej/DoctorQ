import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Clinic } from '@/types';
import { ProfilPane, AbonnementPane, DureePane } from '@/components/dashboard/DesktopSettingsDrawer';
import DropdownHeader from './sections/DropdownHeader';
import QrCodeSection from './sections/QrCodeSection';
import ControlsSection from './sections/ControlsSection';
import AccountSection from './sections/AccountSection';

// ─── Support Pane (inline) ──────────────────────────────────────────────────

function SupportPane() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8E6DF',
        borderRadius: 16, padding: '20px 18px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 14 }}>
          {t('desktop_menu.support_contact_title', { defaultValue: 'Contactez-nous' })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href="mailto:support@blesaf.tn"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: '#E8F5F1', borderRadius: 10, textDecoration: 'none',
              color: '#0F7B6C', fontSize: 13, fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
            support@blesaf.tn
          </a>
          <a
            href="https://wa.me/21600000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: '#E8F5F1', borderRadius: 10, textDecoration: 'none',
              color: '#0F7B6C', fontSize: 13, fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-pane back header ───────────────────────────────────────────────────

function SubPaneHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E8EDE9] bg-white sticky top-0 z-10">
      <button
        onClick={onBack}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EAECE6] transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[18px] text-[#356B58]">arrow_back</span>
      </button>
      <span className="text-[14px] font-semibold text-[#1B2D25] tracking-tight">{title}</span>
    </div>
  );
}

// ─── Main SettingsDropdown ──────────────────────────────────────────────────

interface SettingsDropdownProps {
  clinicName: string;
  isDoctorPresent: boolean;
  isQueueOpen: boolean;
  currentLang: 'fr' | 'ar';
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialDaysRemaining?: number;
  avgConsultationMins?: number;
  clinic: Clinic | null;
  onClinicUpdated: () => Promise<void>;
  onToggleDoctorPresence: () => void;
  onToggleQueue: () => void;
  onToggleLanguage: () => void;
  onOpenSettingsPane: (pane: string) => void;
  onNavigateToSupport: () => void;
  onLogout: () => void;
  onQrDisplay: () => void;
  onQrCopy: () => void;
  onQrWhatsApp: () => void;
  onClose: () => void;
}

const PANE_TITLES: Record<string, string> = {
  profil: 'desktop_menu.item_profile',
  duree: 'desktop_menu.item_duration',
  abonnement: 'desktop_menu.item_subscription',
  support: 'desktop_menu.account_support',
};

const SettingsDropdown = forwardRef<HTMLDivElement, SettingsDropdownProps>(
  function SettingsDropdown(props, ref) {
    const { t } = useTranslation();
    const [activePane, setActivePane] = useState<string | null>(null);

    const goBack = () => setActivePane(null);

    const paneTitle = activePane ? t(PANE_TITLES[activePane] ?? '') : '';

    return (
      <div
        ref={ref}
        id="settings-dropdown-panel"
        role="dialog"
        aria-label={t('desktop_menu.aria_dropdown_label')}
        className={cn(
          'absolute top-[calc(100%+8px)] right-6 bg-white rounded-2xl border border-[#D4DDD8] shadow-[0_20px_60px_rgba(27,45,37,0.22)] z-[200] animate-dropdown-in',
          'transition-[width] duration-200 ease-out overflow-hidden',
          activePane ? 'w-[400px]' : 'w-[320px]',
        )}
      >
        <div className="overflow-hidden max-h-[calc(100vh-120px)]">
          <div
            className="flex transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0,0.15,1)]"
            style={{
              width: '200%',
              transform: activePane ? 'translateX(-50%)' : 'translateX(0)',
            }}
          >
            {/* ── Main menu panel ── */}
            <div className="w-1/2 shrink-0 max-h-[calc(100vh-120px)] overflow-y-auto">
              <DropdownHeader
                clinicName={props.clinicName}
                isDoctorPresent={props.isDoctorPresent}
                subscriptionStatus={props.subscriptionStatus}
                trialDaysRemaining={props.trialDaysRemaining}
              />
              <QrCodeSection
                onQrDisplay={props.onQrDisplay}
                onQrCopy={props.onQrCopy}
                onQrWhatsApp={props.onQrWhatsApp}
              />
              <ControlsSection
                currentLang={props.currentLang}
                isDoctorPresent={props.isDoctorPresent}
                isQueueOpen={props.isQueueOpen}
                onToggleLanguage={props.onToggleLanguage}
                onToggleDoctorPresence={props.onToggleDoctorPresence}
                onToggleQueue={props.onToggleQueue}
              />
              <AccountSection
                onSelectSubPane={setActivePane}
                onLogout={props.onLogout}
                avgConsultationMins={props.avgConsultationMins}
              />
            </div>

            {/* ── Sub-pane panel ── */}
            <div className="w-1/2 shrink-0 max-h-[calc(100vh-120px)] overflow-y-auto">
              {activePane && (
                <>
                  <SubPaneHeader title={paneTitle} onBack={goBack} />
                  {activePane === 'profil' && (
                    <ProfilPane clinic={props.clinic} onSaved={props.onClinicUpdated} />
                  )}
                  {activePane === 'duree' && (
                    <DureePane clinic={props.clinic} onSaved={props.onClinicUpdated} />
                  )}
                  {activePane === 'abonnement' && (
                    <AbonnementPane />
                  )}
                  {activePane === 'support' && (
                    <SupportPane />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default SettingsDropdown;
