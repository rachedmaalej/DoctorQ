import type { QueueStats } from '@/types';

interface ASDailyKPIStripProps {
  stats: QueueStats | null;
  waitingCount: number;
}

export default function ASDailyKPIStrip({ stats, waitingCount }: ASDailyKPIStripProps) {
  const seen = stats?.seen ?? 0;
  const avgWait = stats?.avgWait;
  const noShows = stats?.noShows ?? 0;

  return (
    <div style={{ padding: '0 18px 14px' }}>
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 18px',
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Left column */}
        <div style={{ paddingRight: 14 }}>
          <StatBlock label="En attente" value={waitingCount} highlight={waitingCount > 0} showLiveDot />
          <div style={{ height: 10 }} />
          <StatBlock label="Vus aujourd'hui" value={seen} />
        </div>

        {/* Divider */}
        <div style={{ background: 'var(--color-border-subtle)' }} />

        {/* Right column */}
        <div style={{ paddingLeft: 14 }}>
          <StatBlock label="Attente moy." value={avgWait != null ? `${avgWait} min` : '\u2014'} />
          <div style={{ height: 10 }} />
          <StatBlock label="Absents" value={noShows} warn={noShows > 0} />
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  highlight,
  warn,
  showLiveDot,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
  warn?: boolean;
  showLiveDot?: boolean;
}) {
  let color = 'var(--color-text-primary)';
  if (highlight) color = 'var(--color-primary)';
  if (warn) color = 'var(--color-warning)';

  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 34,
            fontWeight: 700,
            color,
            lineHeight: 1,
            letterSpacing: '-1px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {showLiveDot && (
          <span
            className="as-pulse-session"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'inline-block',
            }}
          />
        )}
      </div>
    </div>
  );
}
