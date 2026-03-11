import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useTourStore } from '@/features/tour/tourStore';

interface QuickAddBarProps {
  onSubmit?: (name: string) => void;
  /** Ref forwarded from ReceptionistDashboard for the tour spotlight */
  tourAddBtnRef?: RefObject<HTMLButtonElement>;
}

export default function QuickAddBar({ onSubmit, tourAddBtnRef }: QuickAddBarProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const tourState = useTourStore(s => s.state);

  const handleSubmit = () => {
    if (name.trim() && onSubmit) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleButtonClick = () => {
    // Tour intercept: delegate to store action (guards state internally)
    if (tourState === 'SPOTLIGHT_ADD') {
      useTourStore.getState().onAddClick();
      return;
    }
    if (onSubmit) {
      onSubmit(name.trim());
      setName('');
    }
  };

  return (
    <div className="mx-5 flex gap-2 items-center">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={t('receptionist.quickAdd.placeholder')}
        className="flex-1 h-12 bg-bs-surface rounded-bs px-4 text-bs-text-primary outline-none transition-colors duration-200 placeholder:text-bs-text-tertiary focus:border-bs-accent"
        style={{ fontSize: 15, border: '1.5px solid #E8E6DF', fontFamily: 'inherit' }}
      />
      <button
        ref={tourAddBtnRef}
        onClick={handleButtonClick}
        className="w-12 h-12 rounded-bs text-white flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.94]"
        style={{ backgroundColor: '#0F7B6C' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>person_add</span>
      </button>
    </div>
  );
}
