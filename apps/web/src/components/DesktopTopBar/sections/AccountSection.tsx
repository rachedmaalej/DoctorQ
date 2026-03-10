import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AccountSectionProps {
  onSelectSubPane: (pane: string) => void;
  onLogout: () => void;
  avgConsultationMins?: number;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A9A92] px-[18px] pt-2.5 pb-1.5">
      {label}
    </p>
  );
}

function NavItem({
  icon,
  iconBg,
  iconColor,
  label,
  sublabel,
  rightText,
  onClick,
  variant = 'default',
}: {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  rightText?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-[14px] py-[8px] mx-1 rounded transition-colors text-left',
        variant === 'danger'
          ? 'hover:bg-red-50 text-red-600'
          : 'hover:bg-[#EAECE6] text-[#1B2D25]'
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <div
        className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: variant === 'danger' ? '#FDF0F0' : (iconBg || '#E8F2EE') }}
      >
        <span
          className="material-symbols-outlined text-[16px]"
          style={{ color: variant === 'danger' ? '#B94040' : (iconColor || '#356B58') }}
        >
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-tight">{label}</div>
        {sublabel && (
          <div className="text-[11px] text-[#8A9A92] leading-tight mt-0.5">{sublabel}</div>
        )}
      </div>
      {rightText && (
        <span className="text-[11.5px] font-semibold text-[#356B58] shrink-0">{rightText}</span>
      )}
      {variant !== 'danger' && (
        <span className="material-symbols-outlined text-[14px] text-[#D4DDD8] shrink-0">chevron_right</span>
      )}
    </button>
  );
}

export default function AccountSection({
  onSelectSubPane,
  onLogout,
  avgConsultationMins,
}: AccountSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="py-1">
      {/* ── Mon Cabinet ── */}
      <SectionLabel label={t('desktop_menu.section_cabinet')} />
      <NavItem
        icon="local_hospital"
        iconBg="#EAF3EF"
        iconColor="#356B58"
        label={t('desktop_menu.item_profile')}
        sublabel={t('desktop_menu.item_profile_sub')}
        onClick={() => onSelectSubPane('profil')}
      />
      <NavItem
        icon="timer"
        iconBg="#E8F5F1"
        iconColor="#0F7B6C"
        label={t('desktop_menu.item_duration')}
        sublabel={t('desktop_menu.item_duration_sub')}
        rightText={avgConsultationMins ? `${avgConsultationMins} min` : undefined}
        onClick={() => onSelectSubPane('duree')}
      />

      {/* ── Abonnement ── */}
      <SectionLabel label={t('desktop_menu.section_subscription')} />
      <NavItem
        icon="receipt_long"
        iconBg="#E8F5F1"
        iconColor="#0F7B6C"
        label={t('desktop_menu.item_subscription')}
        sublabel={t('desktop_menu.item_subscription_sub')}
        onClick={() => onSelectSubPane('abonnement')}
      />

      {/* ── Divider ── */}
      <div className="border-t border-[#E8EDE9] my-1.5 mx-[14px]" />

      {/* ── Help & Logout ── */}
      <NavItem
        icon="help_outline"
        iconBg="#F0EFEA"
        iconColor="#8A9A92"
        label={t('desktop_menu.account_support')}
        onClick={() => onSelectSubPane('support')}
      />
      <NavItem
        icon="logout"
        label={t('desktop_menu.account_logout')}
        sublabel={t('desktop_menu.logout_subtitle')}
        onClick={onLogout}
        variant="danger"
      />
    </div>
  );
}
