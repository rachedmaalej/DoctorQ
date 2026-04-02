import type { QueueStats } from '@/types';
import { calculateEstimatedEndTime } from './utils';

interface ASStatsStripProps {
  stats: QueueStats | null;
  waitingCount: number;
  avgMins: number;
}

export default function ASStatsStrip({ stats, waitingCount, avgMins }: ASStatsStripProps) {
  const seenCount = stats?.seen ?? 0;
  const avgWait = stats?.avgWait ?? 0;
  const endTime = calculateEstimatedEndTime(waitingCount, avgMins);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 6,
      padding: '10px 16px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
    }}>
      <StatCell value={String(waitingCount)} label="En attente" color="var(--color-accent)" />
      <StatCell value={`${avgWait}`} suffix="min" label="Attente moy." color="var(--color-accent)" />
      <StatCell value={String(seenCount)} label="Vus ce jour" color="var(--color-success)" />
      <StatCell
        value={endTime ?? '—'}
        label="Fin estimée"
        color="var(--color-primary)"
        sub={endTime ? 'Dernier patient' : undefined}
      />
    </div>
  );
}

function StatCell({ value, suffix, label, color, sub }: {
  value: string;
  suffix?: string;
  label: string;
  color: string;
  sub?: string;
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 2px',
      background: 'var(--color-primary-subtle)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 20,
        fontWeight: 500,
        color,
        lineHeight: 1.1,
      }}>
        {value}
        {suffix && <span style={{ fontSize: 11 }}>{suffix}</span>}
      </div>
      <div style={{
        fontSize: 9,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginTop: 2,
      }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
