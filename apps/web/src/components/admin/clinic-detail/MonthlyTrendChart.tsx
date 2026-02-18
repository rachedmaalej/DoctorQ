import type { ClinicDetailEnriched } from '@/types';

interface Props {
  data: ClinicDetailEnriched['monthlyChartData'];
  patientsLast30Days: number;
}

export default function MonthlyTrendChart({ data, patientsLast30Days }: Props) {
  const maxVal = Math.max(...data.days.map(d => d.count), 1);
  const yMax = Math.ceil(maxVal / 5) * 5 || 15;
  const yLabels = [yMax, Math.round(yMax * 2 / 3), Math.round(yMax / 3), 0];

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* Y axis */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 20, width: 36,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {yLabels.map((v, i) => (
            <span key={i} style={{
              fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
              textAlign: 'right', paddingRight: 6,
            }}>{v}</span>
          ))}
        </div>

        {/* Bars */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 3, height: 80,
          paddingLeft: 40, position: 'relative',
        }}>
          {data.days.map((day, i) => {
            const isLast = i === data.days.length - 1;
            const isEmpty = day.count === 0;
            const pct = isEmpty ? 5 : (day.count / yMax) * 100;

            return (
              <div key={i} style={{
                flex: 1, borderRadius: '3px 3px 0 0', height: `${pct}%`,
                background: isEmpty ? 'var(--surface-2)' : isLast ? 'var(--brand)' : 'var(--brand-light)',
                opacity: isEmpty ? 1 : isLast ? 1 : 0.75,
                cursor: 'pointer', transition: 'opacity 0.15s',
              }} title={`${day.date}: ${day.count} patients`} />
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px',
        display: 'flex', gap: 24, alignItems: 'center', marginTop: 16, flexWrap: 'wrap',
      }}>
        <SummaryItem label="Total (30d)" value={`${patientsLast30Days} patients`} />
        <SummaryItem label="Peak day" value={data.peakDayLabel || '—'} />
        <SummaryItem label="Active days" value={`${data.activeDays} of 30`} />
        <SummaryItem label="Avg per active day" value={String(data.avgPerActiveDay)} />
        <SummaryItem
          label="Zero-patient days"
          value={String(data.zeroDays)}
          valueColor={data.zeroDays > 10 ? 'var(--warning)' : undefined}
        />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
      {label}: <strong style={{ color: valueColor || 'var(--text-primary)', fontWeight: 600 }}>{value}</strong>
    </div>
  );
}
