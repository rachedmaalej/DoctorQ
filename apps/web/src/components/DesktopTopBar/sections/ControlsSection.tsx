import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ControlsSectionProps {
  currentLang: 'fr' | 'ar';
  isDoctorPresent: boolean;
  isQueueOpen: boolean;
  onToggleLanguage: () => void;
  onToggleDoctorPresence: () => void;
  onToggleQueue: () => void;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'w-[44px] h-[26px] rounded-full relative transition-colors duration-200 shrink-0',
        checked ? 'bg-[#356B58]' : 'bg-[#D4DDD8]'
      )}
    >
      <span className={cn(
        'absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-0'
      )} />
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  valueLabel,
  onRowClick,
  children,
}: {
  icon: string;
  label: string;
  valueLabel: string;
  onRowClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onRowClick}
      className="flex items-center gap-3 px-[14px] py-[9px] mx-1 rounded hover:bg-[#EAECE6] cursor-pointer transition-colors"
    >
      <div className="w-8 h-8 rounded-lg shrink-0 bg-[#E8F2EE] flex items-center justify-center text-[#356B58]">
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
      </div>
      <span className="flex-1 text-[13.5px] font-medium text-[#1B2D25]">{label}</span>
      <span className="text-[12px] font-semibold text-[#356B58] mr-2">{valueLabel}</span>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export default function ControlsSection({
  currentLang,
  isDoctorPresent,
  isQueueOpen,
  onToggleLanguage,
  onToggleDoctorPresence,
  onToggleQueue,
}: ControlsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="py-2 border-b border-[#E8EDE9]">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A9A92] px-[18px] pt-1 pb-2">
        {t('desktop_menu.section_controls')}
      </p>

      <ToggleRow
        icon="translate"
        label={t('desktop_menu.control_language')}
        valueLabel={currentLang.toUpperCase()}
        onRowClick={onToggleLanguage}
      >
        <div className="flex overflow-hidden rounded-md border border-[#E8EDE9] text-[10.5px] font-bold">
          <span className={cn(
            'px-2 py-1 transition-colors',
            currentLang === 'fr' ? 'bg-[#356B58] text-white' : 'text-[#8A9A92]'
          )}>FR</span>
          <span className={cn(
            'px-2 py-1 transition-colors',
            currentLang === 'ar' ? 'bg-[#356B58] text-white' : 'text-[#8A9A92]'
          )}>AR</span>
        </div>
      </ToggleRow>

      <ToggleRow
        icon="stethoscope"
        label={t('desktop_menu.control_doctor')}
        valueLabel={isDoctorPresent ? t('desktop_menu.control_doctor_present') : t('desktop_menu.control_doctor_absent')}
        onRowClick={onToggleDoctorPresence}
      >
        <ToggleSwitch checked={isDoctorPresent} onChange={onToggleDoctorPresence} />
      </ToggleRow>

      <ToggleRow
        icon="queue"
        label={t('desktop_menu.control_queue')}
        valueLabel={isQueueOpen ? t('desktop_menu.control_queue_open') : t('desktop_menu.control_queue_closed')}
        onRowClick={onToggleQueue}
      >
        <ToggleSwitch checked={isQueueOpen} onChange={onToggleQueue} />
      </ToggleRow>
    </div>
  );
}
