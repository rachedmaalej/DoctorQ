import { Settings } from 'lucide-react';

interface ASTopbarProps {
  onOpenSettings: () => void;
  isSessionActive: boolean;
}

export default function ASTopbar({ onOpenSettings, isSessionActive }: ASTopbarProps) {
  return (
    <header
      className="sticky top-0 z-[100] flex items-center justify-between"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '12px 20px',
      }}
    >
      {/* Left: Brand + session status */}
      <div className="flex items-center gap-3">
        <span
          className="font-fraunces"
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '-0.3px',
          }}
        >
          AuSuivant
        </span>

        {isSessionActive && (
          <div className="flex items-center gap-2">
            <span
              className="as-pulse-session"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
              }}
            />
            <span
              className="font-dm"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              En consultation
            </span>
          </div>
        )}
      </div>

      {/* Right: Settings gear */}
      <button
        onClick={onOpenSettings}
        aria-label="Paramètres"
        className="flex items-center justify-center transition-colors"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Settings size={20} />
      </button>
    </header>
  );
}
