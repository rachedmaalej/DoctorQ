import { Clock, X } from 'lucide-react';

interface ASHeroMetricsProps {
  waitingCount: number;
  avgWaitMinutes: number | null;
  estimatedEndTime: string | null;
}

export default function ASHeroMetrics({ waitingCount, avgWaitMinutes, estimatedEndTime }: ASHeroMetricsProps) {
  return (
    <div
      className="as-fade-up as-fade-up-1"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '20px 20px 16px',
      }}
    >
      {/* Primary row */}
      <div className="flex items-baseline gap-2" style={{ marginBottom: 12 }}>
        <span
          className="font-fraunces"
          style={{
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1,
            color: 'var(--text-primary)',
            letterSpacing: '-2px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {waitingCount}
        </span>
        <span
          className="font-dm"
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: 'var(--text-secondary)',
          }}
        >
          {waitingCount === 1 ? 'patient en attente' : 'patients en attente'}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex gap-5">
        {/* Average wait */}
        <div className="flex items-center gap-1.5">
          <Clock size={15} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Attente moy.{' '}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {avgWaitMinutes != null ? `${avgWaitMinutes} min` : '—'}
          </span>
        </div>

        {/* Estimated end */}
        <div className="flex items-center gap-1.5">
          <X size={15} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Fin estimée{' '}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {estimatedEndTime || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
