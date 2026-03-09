import ASIcon from './ASIcon';


export type DashboardView = 'queue' | 'schedule';

interface ASSessionControlsProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  waitingCount: number;
}

export default function ASSessionControls({
  activeView,
  onViewChange,
  waitingCount,
}: ASSessionControlsProps) {
  return (
    <div
      className="as-fade-up as-fade-up-2"
      style={{ padding: '0 18px 14px' }}
    >
      <div
        className="flex gap-1"
        style={{
          padding: 3,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-alt)',
        }}
      >
        <button
          onClick={() => onViewChange('queue')}
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: '7px 10px',
            borderRadius: 8,
            border: 'none',
            background: activeView === 'queue' ? 'var(--color-surface)' : 'transparent',
            boxShadow: activeView === 'queue' ? 'var(--shadow-card)' : 'none',
            color: activeView === 'queue' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ASIcon name="list" size={14} />
          Salle
          {waitingCount > 0 && (
            <span
              style={{
                background: activeView === 'queue' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 10,
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {waitingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onViewChange('schedule')}
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: '7px 10px',
            borderRadius: 8,
            border: 'none',
            background: activeView === 'schedule' ? 'var(--color-surface)' : 'transparent',
            boxShadow: activeView === 'schedule' ? 'var(--shadow-card)' : 'none',
            color: activeView === 'schedule' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ASIcon name="calendar_today" size={14} />
          Agenda
        </button>
      </div>
    </div>
  );
}
