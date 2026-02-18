import type { ClinicDetailEnriched } from '@/types';
import { Card, BadgePill } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
}

export default function TodayActivityCard({ clinic }: Props) {
  const { todayActivity: today, typicalActivity: typical } = clinic;

  const columns = [
    { label: 'Waiting', today: today.waiting, typical: typical.waiting, colorFn: () => 'var(--text-muted)' },
    { label: 'In Consult', today: today.inConsultation, typical: typical.inConsultation, colorFn: () => 'var(--text-muted)' },
    {
      label: 'Completed', today: today.completed, typical: typical.completed,
      colorFn: (t: number, typ: number) => t >= typ ? 'var(--success)' : (typ > 0 && t < typ * 0.7) ? 'var(--warning)' : 'var(--text-muted)',
    },
    {
      label: 'No Shows', today: today.noShows, typical: typical.noShows,
      colorFn: (t: number) => t > 0 ? 'var(--warning)' : 'var(--text-muted)',
    },
    { label: 'Cancelled', today: today.cancelled, typical: typical.cancelled, colorFn: () => 'var(--text-muted)' },
  ];

  const qrPct = today.totalCheckInsToday > 0
    ? Math.round((today.qrCheckInsToday / today.totalCheckInsToday) * 100) : 0;

  return (
    <Card
      title="Today's Activity"
      subtitle={`${today.dayLabel} · Compared to typical ${today.dayLabel.split(' ')[0]}`}
      headerRight={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live</span>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
        {columns.map((col, i) => (
          <div key={i} style={{
            padding: '16px 12px', textAlign: 'center',
            borderRight: '1px solid var(--border-subtle)',
          }}>
            <div style={actLabelStyle}>{col.label}</div>
            <div style={{ ...actValueStyle, color: col.colorFn(col.today, col.typical) }}>
              {col.today}
            </div>
            <div style={actBenchStyle}>avg: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{col.typical}</span></div>
          </div>
        ))}

        {/* 6th column: Avg Wait Time (special) */}
        <div style={{
          padding: '16px 12px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--brand-pale) 0%, #fff 100%)',
          borderLeft: '2px solid var(--brand-pale-2)', borderRight: 'none',
        }}>
          <div style={{ ...actLabelStyle, color: 'var(--brand-mid)' }}>Avg Wait</div>
          <div style={{
            fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)',
            letterSpacing: -0.5, color: 'var(--brand)', lineHeight: 1, marginBottom: 6,
          }}>
            {today.avgWaitMinutesToday !== null ? today.avgWaitMinutesToday : '—'}
            <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: 0 }}>
              {today.avgWaitMinutesToday !== null ? 'min' : ''}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--brand-mid)' }}>
            avg: <span style={{ color: 'var(--brand)' }}>
              {typical.avgWaitMinutes !== null ? `${typical.avgWaitMinutes}m` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Peak hours strip */}
      <div style={{
        padding: '12px 16px', background: 'var(--surface-2)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>⏱ Peak hours today:</span>
        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>
          {today.peakHourToday || '—'}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>QR check-ins today:</span>
        <BadgePill variant="green">
          {today.qrCheckInsToday} of {today.totalCheckInsToday} ({qrPct}%)
        </BadgePill>
      </div>
    </Card>
  );
}

const actLabelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: 0.6, color: 'var(--text-muted)', marginBottom: 8,
};

const actValueStyle: React.CSSProperties = {
  fontSize: 26, fontWeight: 700, fontFamily: 'var(--mono)',
  letterSpacing: -1, lineHeight: 1, marginBottom: 6,
};

const actBenchStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-muted)',
};
