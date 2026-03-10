import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { FilterTab } from '@/hooks/useQueueFilter';

interface QueueTableHeaderProps {
  activeFilter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: Record<FilterTab, number>;
}

const FILTER_TABS: { key: FilterTab; labelKey: string }[] = [
  { key: 'all', labelKey: 'queue.filter.all' },
  { key: 'waiting', labelKey: 'queue.filter.waiting' },
  { key: 'notified', labelKey: 'queue.filter.notified' },
  { key: 'no-phone', labelKey: 'queue.filter.noPhone' },
];

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function QueueTableHeader({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}: QueueTableHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={clsx(
              'text-[13px] font-medium px-3.5 py-1.5 rounded-full border-[1.5px] transition-all duration-150',
              activeFilter === tab.key
                ? 'bg-[#1B2D25] text-white border-[#1B2D25]'
                : 'bg-white text-[#5C6B62] border-[#DDE2DC] hover:border-[#356B58] hover:text-[#356B58]'
            )}
          >
            {t(tab.labelKey)} <span className="opacity-60">{counts[tab.key]}</span>
          </button>
        ))}
        <div className="flex-1" />
        {/* Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-[#94A49A] pointer-events-none">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('queue.search.placeholder')}
            className="pl-9 pr-3 py-1.5 text-[13px] w-52 border-[1.5px] border-[#DDE2DC] rounded-[10px] bg-white text-[#1B2D25] outline-none focus:border-[#356B58] transition-colors font-dm"
          />
        </div>
      </div>

      {/* Urgency legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-[#94A49A]">
        <span className="font-semibold text-[#5C6B62]">{t('queue.legend.label')}</span>
        <LegendItem color="#2D7A5A" label={t('queue.legend.ok')} />
        <LegendItem color="#E07B39" label={t('queue.legend.high')} />
        <LegendItem color="#C0392B" label={t('queue.legend.critical')} />
      </div>
    </div>
  );
}
