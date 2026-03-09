import ASIcon from './ASIcon';

interface ASTopbarProps {
  onOpenSettings: () => void;
  isSessionActive: boolean;
  /** Desktop-only: render search + action buttons between brand and settings */
  desktopSlot?: React.ReactNode;
}

export default function ASTopbar({ onOpenSettings, isSessionActive, desktopSlot }: ASTopbarProps) {
  return (
    <>
      {/* Tricolor accent bar */}
      <div className="as-tricolor-bar" />

      <header
        className="sticky top-0 z-[100] flex items-center justify-between"
        style={{
          background: 'var(--color-primary)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-navbar)',
        }}
      >
        {/* Left: Brand title */}
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text-on-primary)',
            flexShrink: 0,
          }}
        >
          AuSuivant
        </span>

        {/* Desktop slot: search + actions (inserted between brand and right controls) */}
        {desktopSlot}

        {/* Right: Present badge + hamburger */}
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {isSessionActive && (
            <div
              className="flex items-center gap-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-on-primary)',
                border: 'none',
              }}
            >
              <span
                className="as-pulse-session"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4ADE80',
                  display: 'inline-block',
                }}
              />
              Présent
            </div>
          )}

          <button
            onClick={onOpenSettings}
            aria-label="Menu"
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius)',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-on-primary)',
            }}
          >
            <ASIcon name="menu" size={20} />
          </button>
        </div>
      </header>
    </>
  );
}
