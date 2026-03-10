import { useTranslation } from 'react-i18next';

interface DropdownHeaderProps {
  clinicName: string;
  isDoctorPresent: boolean;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialDaysRemaining?: number;
}

export default function DropdownHeader({
  clinicName,
  isDoctorPresent,
  subscriptionStatus,
  trialDaysRemaining,
}: DropdownHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="px-[18px] py-4 bg-[#1B2D25] flex items-center gap-3">
      <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 bg-[#7BC4A8]/20 flex items-center justify-center text-[#7BC4A8]">
        <span className="material-symbols-outlined text-[20px]">medical_services</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-[13.5px] truncate">{clinicName}</div>
        <div className="text-white/50 text-[12px] mt-0.5">
          {subscriptionStatus === 'trial'
            ? t('desktop_menu.trial_label', { days: trialDaysRemaining ?? 0 })
            : t('desktop_menu.active_label')}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[#7BC4A8] text-[11.5px] font-medium shrink-0">
        <span className={`w-[6px] h-[6px] rounded-full ${isDoctorPresent ? 'bg-[#7BC4A8]' : 'bg-red-400'}`} />
        {isDoctorPresent ? t('desktop_menu.control_doctor_present') : t('desktop_menu.control_doctor_absent')}
      </div>
    </div>
  );
}
