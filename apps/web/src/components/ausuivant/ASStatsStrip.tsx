import type { QueueStats } from '@/types';
import { calculateEstimatedEndTime } from './utils';

interface ASStatsStripProps {
  stats: QueueStats | null;
  waitingCount: number;
  avgMins: number;
}

/**
 * 3-chip stats bar: En attente (active/green) · Vus · Fin est.
 * The first chip is highlighted to anchor the receptionist's attention
 * on the primary "what's happening right now" metric.
 */
export default function ASStatsStrip({ stats, waitingCount, avgMins }: ASStatsStripProps) {
  const seenCount = stats?.seen ?? 0;
  const endTime = calculateEstimatedEndTime(waitingCount, avgMins);

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '10px 16px',
        background: 'var(--color-surface, #fff)',
        borderBottom: '1px solid var(--color-border-subtle, #E8E6DF)',
      }}
    >
      <StatChip value={String(waitingCount)} label="En attente" active />
      <StatChip value={String(seenCount)} label="Vus" />
      <StatChip value={endTime ?? '—'} label="Fin est." />
    </div>
  );
}

function StatChip({
  value,
  label,
  active = false,
}: {
  value: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 4px',
        borderRadius: 8,
        gap: 2,
        background: active ? '#E8F5EE' : '#F4F1EC',
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 16.8,
          fontWeight: 700,
          color: active ? '#1a3c34' : '#1a1a2e',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 9.9,
          fontWeight: 500,
          color: active ? '#2a6b4a' : '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
    </div>
  );
}
