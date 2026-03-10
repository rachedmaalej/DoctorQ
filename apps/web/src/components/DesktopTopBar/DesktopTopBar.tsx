import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDropdown } from './hooks/useDropdown';
import SettingsDropdown from './SettingsDropdown';
import type { DesktopTopBarProps } from './types';

// ─── Sub-components ──────────────────────────────────────────────────────────

function Logo() {
  return (
    <span className="text-white font-bold text-[17px] tracking-tight shrink-0">
      Ble<span className="text-[#7BC4A8]">Saf</span>
    </span>
  );
}

function ClinicNameChip({ clinicName }: { clinicName: string }) {
  return (
    <div className="text-white/85 text-[13.5px] font-medium px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/[0.12] truncate max-w-[220px]">
      {clinicName}
    </div>
  );
}

function DoctorStatusPill({ isDoctorPresent, waitingCount }: { isDoctorPresent: boolean; waitingCount: number }) {
  const { t } = useTranslation();
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-[12.5px] font-medium px-2.5 py-1 rounded-full border',
      isDoctorPresent
        ? 'text-[#7BC4A8] bg-[#7BC4A8]/10 border-[#7BC4A8]/20'
        : 'text-red-300 bg-red-400/10 border-red-400/20'
    )}>
      <span className={cn(
        'w-[7px] h-[7px] rounded-full animate-pulse',
        isDoctorPresent ? 'bg-[#7BC4A8]' : 'bg-red-400'
      )} />
      {isDoctorPresent ? t('desktop_menu.control_doctor_present') : t('desktop_menu.control_doctor_absent')}
      {' · '}{waitingCount} {t('queue.patients', { count: waitingCount })}
    </div>
  );
}

function LanguageToggle({ currentLang, onToggle }: { currentLang: 'fr' | 'ar'; onToggle: () => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg bg-white/[0.08] border border-white/[0.12] text-[12px] font-semibold">
      {(['fr', 'ar'] as const).map(lang => (
        <button
          key={lang}
          onClick={onToggle}
          className={cn(
            'px-2.5 py-1.5 transition-colors',
            currentLang === lang
              ? 'bg-white/[0.15] text-white'
              : 'text-white/50 hover:text-white/80'
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function HelpIconButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      aria-label={t('desktop_menu.account_support')}
      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.08] border border-white/[0.12] text-white/75 hover:text-white hover:bg-white/[0.15] transition-colors"
    >
      <span className="material-symbols-outlined text-[18px]">help_outline</span>
    </button>
  );
}

const SettingsTriggerButton = forwardRef<HTMLButtonElement, { isOpen: boolean; onClick: () => void }>(
  function SettingsTriggerButton({ isOpen, onClick }, ref) {
    const { t } = useTranslation();
    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="settings-dropdown-panel"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/[0.10] border border-white/[0.15] text-white text-[13px] font-medium hover:bg-white/[0.18] transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">tune</span>
        {t('desktop_menu.settings_button')}
        <span
          className="material-symbols-outlined text-[15px] opacity-60 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
    );
  }
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DesktopTopBar(props: DesktopTopBarProps) {
  const { isOpen, toggle, triggerRef, panelRef, close } = useDropdown();

  return (
    <header className="hidden lg:flex sticky top-0 z-50 h-[60px] items-center px-6 gap-4 bg-[#1B2D25] relative">
      <Logo />
      <ClinicNameChip clinicName={props.clinicName} />
      <DoctorStatusPill isDoctorPresent={props.isDoctorPresent} waitingCount={props.waitingCount} />

      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle currentLang={props.currentLang} onToggle={props.onToggleLanguage} />
        <HelpIconButton onClick={props.onNavigateToSupport} />
        <SettingsTriggerButton ref={triggerRef} isOpen={isOpen} onClick={toggle} />
      </div>

      {isOpen && (
        <SettingsDropdown
          ref={panelRef}
          clinicName={props.clinicName}
          isDoctorPresent={props.isDoctorPresent}
          isQueueOpen={props.isQueueOpen}
          currentLang={props.currentLang}
          subscriptionStatus={props.subscriptionStatus}
          trialDaysRemaining={props.trialDaysRemaining}
          avgConsultationMins={props.avgConsultationMins}
          clinic={props.clinic}
          onClinicUpdated={props.onClinicUpdated}
          onToggleDoctorPresence={props.onToggleDoctorPresence}
          onToggleQueue={props.onToggleQueue}
          onToggleLanguage={props.onToggleLanguage}
          onOpenSettingsPane={props.onOpenSettingsPane}
          onNavigateToSupport={props.onNavigateToSupport}
          onLogout={props.onLogout}
          onQrDisplay={props.onQrDisplay}
          onQrCopy={props.onQrCopy}
          onQrWhatsApp={props.onQrWhatsApp}
          onClose={close}
        />
      )}
    </header>
  );
}
