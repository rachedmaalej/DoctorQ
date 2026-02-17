import clsx from 'clsx';

interface FloatingCTAProps {
  variant: 'green' | 'accent';
  icon: string;
  label: string;
  nextName?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function FloatingCTA({ variant, icon, label, nextName, disabled, onClick }: FloatingCTAProps) {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-[375px]"
      style={{
        padding: '12px 20px 32px',
        background: 'linear-gradient(to top, #F6F5F0 60%, transparent)',
      }}
    >
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={clsx(
          'pointer-events-auto w-full h-14 border-none rounded-2xl text-white font-bold flex items-center justify-center gap-2.5 transition-all duration-150 relative overflow-hidden',
          !disabled && 'active:scale-[0.97]',
          disabled && 'opacity-50',
          variant === 'green' && 'bs-cta-green',
          variant === 'accent' && !disabled && 'bs-cta-accent',
        )}
        style={{
          fontSize: 16,
          fontFamily: 'inherit',
          backgroundColor: variant === 'green' ? '#2D8B4E' : '#0F7B6C',
          boxShadow: disabled ? 'none' : variant === 'green'
            ? '0 6px 28px rgba(45,139,78,0.45), 0 2px 8px rgba(45,139,78,0.3)'
            : '0 6px 28px rgba(15,123,108,0.45), 0 2px 8px rgba(15,123,108,0.3)',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{icon}</span>
        {label}
        {nextName && (
          <span className="font-normal opacity-80" style={{ fontSize: 14 }}>
            {'· '}{nextName}
          </span>
        )}
      </button>
    </div>
  );
}
