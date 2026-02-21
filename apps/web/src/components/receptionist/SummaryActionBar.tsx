import { useTranslation } from 'react-i18next';

interface SummaryActionBarProps {
  onExport?: () => void;
  onNewDay?: () => void;
}

export default function SummaryActionBar({ onExport, onNewDay }: SummaryActionBarProps) {
  const { t } = useTranslation();

  return (
    <div className="px-5 pb-9 flex gap-2.5">
      {/* Export */}
      <button
        onClick={onExport}
        className="flex-1 h-12 rounded-bs text-bs-text-secondary font-semibold flex items-center justify-center gap-2 transition-all duration-150"
        style={{ fontSize: 14, backgroundColor: '#FFFFFF', border: '1.5px solid #E8E6DF' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>download</span>
        {t('receptionist.summaryActions.export')}
      </button>

      {/* New Day */}
      <button
        onClick={onNewDay}
        className="flex-1 h-12 rounded-bs text-white font-semibold flex items-center justify-center gap-2 transition-all duration-150"
        style={{ fontSize: 14, backgroundColor: '#0F7B6C', border: '1.5px solid #0F7B6C' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_forward</span>
        {t('receptionist.summaryActions.newDay')}
      </button>
    </div>
  );
}
