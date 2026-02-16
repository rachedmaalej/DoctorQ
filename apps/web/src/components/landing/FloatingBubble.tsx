import { useTranslation } from 'react-i18next';

interface FloatingBubbleProps {
  className?: string;
}

export default function FloatingBubble({ className = '' }: FloatingBubbleProps) {
  const { t } = useTranslation();
  return (
    <div className={`hidden lg:flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-lg border border-gray-100 ${className}`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-green-50">
        ✓
      </div>
      <div>
        <div className="text-[11px] font-semibold text-gray-900">{t('landing.mockup.patientBubble')}</div>
        <div className="text-[9px] text-gray-500">{t('landing.mockup.bubbleMessage')}</div>
      </div>
    </div>
  );
}
