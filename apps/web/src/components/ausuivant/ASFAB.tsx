import { Plus } from 'lucide-react';

interface ASFABProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ASFAB({ isOpen, onToggle }: ASFABProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? 'Fermer' : 'Ajouter un patient'}
      className="fixed flex items-center justify-center"
      style={{
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--text-primary)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 90,
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease',
      }}
    >
      <Plus
        size={24}
        strokeWidth={2.2}
        style={{
          color: 'white',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      />
    </button>
  );
}
