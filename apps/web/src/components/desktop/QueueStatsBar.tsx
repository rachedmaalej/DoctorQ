import { useTranslation } from 'react-i18next';

interface QueueStatsBarProps {
  totalWaiting: number;
  maxWaitMinutes: number;
  notifiedCount: number;
  noPhoneCount: number;
}

const CARDS = [
  { icon: 'groups', valueKey: 'totalWaiting', labelKey: 'queue.stats.waiting', iconBg: 'bg-[#EBF2EE]', iconColor: 'text-[#356B58]' },
  { icon: 'schedule', valueKey: 'maxWaitMinutes', labelKey: 'queue.stats.maxWait', iconBg: 'bg-[#FDF1E8]', iconColor: 'text-[#E07B39]', suffix: ' min' },
  { icon: 'mark_chat_read', valueKey: 'notifiedCount', labelKey: 'queue.stats.notified', iconBg: 'bg-[#F0ECFB]', iconColor: 'text-[#7C5CBF]' },
  { icon: 'phone_missed', valueKey: 'noPhoneCount', labelKey: 'queue.stats.noPhone', iconBg: 'bg-[#FDEEEC]', iconColor: 'text-[#C0392B]' },
] as const;

export default function QueueStatsBar({ totalWaiting, maxWaitMinutes, notifiedCount, noPhoneCount }: QueueStatsBarProps) {
  const { t } = useTranslation();

  const values: Record<string, number> = {
    totalWaiting,
    maxWaitMinutes,
    notifiedCount,
    noPhoneCount,
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {CARDS.map(card => (
        <div
          key={card.valueKey}
          className="bg-white border border-[#DDE2DC] rounded-[10px] p-4 flex items-center gap-3 shadow-sm"
        >
          <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
            <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>{card.icon}</span>
          </div>
          <div>
            <div className="text-[22px] font-bold text-[#1B2D25] leading-none font-dm">
              {values[card.valueKey]}{'suffix' in card ? card.suffix : ''}
            </div>
            <div className="text-xs text-[#94A49A] mt-0.5">{t(card.labelKey)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
