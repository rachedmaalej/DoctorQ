import { useTranslation } from 'react-i18next';

interface CallNextBarProps {
  nextPatientName: string | null;
  onCallNext: () => void;
  disabled?: boolean;
}

export default function CallNextBar({ nextPatientName, onCallNext, disabled }: CallNextBarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1B2D25] rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(27,45,37,0.30)]">
      <span className="text-[14px] font-medium text-white/70">
        {t('queue.callNext.label')}
      </span>
      <span className="text-[15px] font-semibold text-white ml-1">
        {nextPatientName ?? '—'}
      </span>
      <button
        onClick={onCallNext}
        disabled={disabled}
        className="flex items-center gap-2 bg-[#356B58] text-white rounded-full px-5 py-2 text-[14px] font-semibold transition-all duration-150 hover:bg-[#2a5a49] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        {t('queue.callNext.button')}
      </button>
    </div>
  );
}
