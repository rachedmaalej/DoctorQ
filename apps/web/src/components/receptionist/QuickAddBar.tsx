import { useState } from 'react';

interface QuickAddBarProps {
  onSubmit?: (name: string) => void;
}

export default function QuickAddBar({ onSubmit }: QuickAddBarProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim() && onSubmit) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleButtonClick = () => {
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
        placeholder="Nom du patient..."
        className="flex-1 h-12 bg-bs-surface rounded-bs px-4 text-bs-text-primary outline-none transition-colors duration-200 placeholder:text-bs-text-tertiary focus:border-bs-accent"
        style={{ fontSize: 15, border: '1.5px solid #E8E6DF', fontFamily: 'inherit' }}
      />
      <button
        onClick={handleButtonClick}
        className="w-12 h-12 rounded-bs text-white flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.94]"
        style={{ backgroundColor: '#0F7B6C' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>person_add</span>
      </button>
    </div>
  );
}
