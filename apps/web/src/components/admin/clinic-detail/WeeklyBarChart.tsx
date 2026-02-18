import type { ClinicDetailEnriched } from '@/types';

interface Props {
  data: ClinicDetailEnriched['weeklyChartData'];
}

export default function WeeklyBarChart({ data }: Props) {
  const maxVal = Math.max(...data.days.flatMap(d => [d.thisWeek, d.lastWeek]), 1);
  // Round up to nearest 5 for y-axis
  const yMax = Math.ceil(maxVal / 5) * 5 || 15;
  const yLabels = [yMax, Math.round(yMax * 2 / 3), Math.round(yMax / 3), 0];

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* Bar chart */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 6, height: 120,
          paddingLeft: 40, position: 'relative',
        }}>
          {/* Y axis */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 36,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            pointerEvents: 'none',
          }}>
            {yLabels.map((v, i) => (
              <span key={i} style={{
                fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
                textAlign: 'right', paddingRight: 6,
              }}>{v}</span>
            ))}
          </div>

          {/* Bar groups */}
          {data.days.map((day, i) => {
            const lwPct = (day.lastWeek / yMax) * 100;
            const twPct = day.thisWeek > 0 ? (day.thisWeek / yMax) * 100 : 4;
            const isZero = day.thisWeek === 0 && !day.isToday;

            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <div style={{
                  flex: 1, borderRadius: '4px 4px 0 0', height: `${Math.max(lwPct, 4)}%`,
                  background: 'var(--brand-pale-2)', transition: 'opacity 0.15s',
                }} />
                <div style={{
                  flex: 1, borderRadius: '4px 4px 0 0', height: `${twPct}%`,
                  background: isZero ? 'var(--surface-2)' : 'var(--brand-light)',
                  transition: 'opacity 0.15s',
                }} />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: 'flex', gap: 6, paddingLeft: 40, marginTop: 6 }}>
          {data.days.map((day, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'var(--mono)',
              color: day.isToday ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: day.isToday ? 600 : 400,
            }}>
              {day.label}{day.isToday ? '★' : ''}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, paddingLeft: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--brand-light)' }} />
            This week
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--brand-pale-2)' }} />
            Last week
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>★ = today</span>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px',
        display: 'flex', gap: 24, alignItems: 'center', marginTop: 12, flexWrap: 'wrap',
      }}>
        <SummaryItem label="Best day" value={data.bestDayLabel || '—'} />
        <SummaryItem label="This week so far" value={`${data.thisWeekTotal} patients`} />
        <SummaryItem label="Last week total" value={`${data.lastWeekTotal} patients`} />
        <SummaryItem
          label="Week-on-week"
          value={`${data.weekOnWeekChangePct > 0 ? '+' : ''}${data.weekOnWeekChangePct}%`}
          valueColor={data.weekOnWeekChangePct < 0 ? 'var(--danger)' : data.weekOnWeekChangePct > 0 ? 'var(--success)' : undefined}
        />
        <SummaryItem label="Avg wait this week" value={data.avgWaitThisWeek !== null ? `${data.avgWaitThisWeek} min` : '—'} />
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
