import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface BSQuickAddProps {
  onSubmit: (name: string) => void;
}

export default function BSQuickAdd({ onSubmit }: BSQuickAddProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = () => {
    onSubmit(name.trim());
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="bs-quick-add bs-animate-in bs-delay-2">
      <input
        type="text"
        className="bs-quick-add-input"
        placeholder={t('blesaf.quickAdd.placeholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="bs-quick-add-btn"
        onClick={handleSubmit}
        aria-label={t('queue.addPatient')}
      >
        <span className="material-symbols-rounded">person_add</span>
      </button>
    </div>
  );
}
