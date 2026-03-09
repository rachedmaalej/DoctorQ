import ASIcon from './ASIcon';

interface ASQuickActionBarProps {
  onAddPatient: () => void;
  onCallNext: () => void;
  isCallingNext: boolean;
  disabled: boolean;
  waitingCount: number;
}

export default function ASQuickActionBar({
  onAddPatient,
  onCallNext,
  isCallingNext,
  disabled,
  waitingCount,
}: ASQuickActionBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center gap-3"
      style={{
        padding: '12px 18px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'var(--color-primary)',
        zIndex: 30,
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Add Patient button */}
      <button
        onClick={onAddPatient}
        className="flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'var(--color-accent)',
          color: 'var(--color-text-on-accent)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <ASIcon name="add" size={22} />
      </button>

      {/* Suivant CTA */}
      <button
        onClick={onCallNext}
        disabled={disabled || isCallingNext}
        className="flex items-center justify-center gap-2 flex-1"
        style={{
          padding: '10px 16px',
          border: 'none',
          borderRadius: 'var(--radius)',
          background: disabled ? 'rgba(255,255,255,0.15)' : 'white',
          color: disabled ? 'rgba(255,255,255,0.4)' : 'var(--color-primary)',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: isCallingNext ? 0.7 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        Appeler Suivant
        {waitingCount > 0 && (
          <span style={{
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: 'var(--radius-pill)',
          }}>
            {waitingCount}
          </span>
        )}
      </button>
    </div>
  );
}
