import type { ClinicDetailEnriched } from '@/types';
import { RiskChip } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
}

const accentColors: Record<string, string> = {
  green: 'var(--success)',
  orange: 'var(--warning)',
  red: 'var(--danger)',
};

const urgencyStyles: Record<string, { bg: string; border: string; labelColor: string; textColor: string }> = {
  high: { bg: 'var(--warning-pale)', border: '#F0C080', labelColor: 'var(--warning)', textColor: '#92400E' },
  medium: { bg: 'var(--info-pale)', border: '#A8D4EF', labelColor: 'var(--info)', textColor: '#1E40AF' },
  low: { bg: 'var(--surface-2)', border: 'var(--border)', labelColor: 'var(--text-muted)', textColor: 'var(--text-secondary)' },
};

export default function ClinicHealthCard({ clinic }: Props) {
  const accent = accentColors[clinic.healthColor] || 'var(--warning)';
  const urg = urgencyStyles[clinic.suggestedAction.urgency] || urgencyStyles.low;

  const patientsColor = clinic.patientsLast30Days >= 20 ? 'var(--success)'
    : clinic.patientsLast30Days >= 5 ? 'var(--warning)' : 'var(--danger)';

  const qrColor = clinic.qrAdoptionRate === 0 ? 'var(--danger)'
    : clinic.qrAdoptionRate < 40 ? 'var(--warning)' : 'var(--success)';

  const waitDelta = clinic.avgWaitTimeChangeVsLastWeek;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '20px 24px', marginBottom: 16, display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 0,
      alignItems: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Left accent border */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent,
      }} />

      {/* Col 1: Health Score */}
      <div style={colStyle(true)}>
        <div style={labelStyle}>Health Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 7, height: 20, borderRadius: 3,
                background: i <= clinic.healthScore ? accent : 'var(--border)',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{clinic.healthLabel}</span>
        </div>
        <div style={{ ...subStyle, marginTop: 6 }}>Across 4 dimensions</div>
      </div>

      {/* Col 2: Patients (30d) */}
      <div style={colStyle()}>
        <div style={labelStyle}>Patients (30d)</div>
        <div style={{ ...valueStyle, color: patientsColor }}>{clinic.patientsLast30Days}</div>
        <div style={subStyle}>{clinic.avgPatientsPerDay} avg/day</div>
      </div>

      {/* Col 3: QR Adoption */}
      <div style={colStyle()}>
        <div style={labelStyle}>QR Adoption</div>
        <div style={{ ...valueStyle, color: qrColor }}>{clinic.qrAdoptionRate}%</div>
        <div style={subStyle}>{clinic.qrCheckInsLast30Days} of {clinic.patientsLast30Days} via QR scan</div>
      </div>

      {/* Col 4: Avg Wait Time */}
      <div style={colStyle()}>
        <div style={labelStyle}>Avg Wait Time</div>
        <div style={{ ...valueStyle, color: 'var(--brand)' }}>
          {clinic.avgWaitTimeMinutes}
          <span style={{ fontSize: 16, fontWeight: 400, letterSpacing: 0, color: 'var(--brand-mid)', marginLeft: 2 }}>min</span>
        </div>
        <div style={subStyle}>
          {waitDelta < 0 ? (
            <span style={{ color: 'var(--success)' }}>↓ vs {Math.abs(waitDelta)}min last week</span>
          ) : waitDelta > 0 ? (
            <span style={{ color: 'var(--warning)' }}>↑ vs {waitDelta}min last week</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No change vs last week</span>
          )}
        </div>
      </div>

      {/* Col 5: Churn Risk */}
      <div style={colStyle()}>
        <div style={labelStyle}>Churn Risk</div>
        <div style={{ marginTop: 8 }}>
          <RiskChip level={clinic.churnRisk} />
        </div>
        <div style={{ ...subStyle, marginTop: 6 }}>
          {clinic.plan === 'TRIAL' && clinic.daysUntilTrialExpires !== null
            ? `Trial ends in ${clinic.daysUntilTrialExpires}d`
            : clinic.plan === 'PAID' ? 'Active plan' : 'Expired'}
        </div>
      </div>

      {/* Col 6: Suggested Action */}
      <div style={{ padding: '0 0 0 20px', borderRight: 'none' }}>
        <div style={{
          background: urg.bg, border: `1px solid ${urg.border}`, borderRadius: 8,
          padding: '10px 14px', minWidth: 160, transition: 'all 0.15s',
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: 0.6, color: urg.labelColor, marginBottom: 4,
          }}>
            Suggested Action
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: urg.textColor, lineHeight: 1.3 }}>
            {clinic.suggestedAction.label}<br />{clinic.suggestedAction.sublabel}
          </div>
          <div style={{ fontSize: 11, color: urg.labelColor, marginTop: 4 }}>
            {clinic.suggestedAction.cta}
          </div>
        </div>
      </div>
    </div>
  );
}

function colStyle(isFirst = false): React.CSSProperties {
  return {
    padding: '0 20px',
    borderRight: '1px solid var(--border-subtle)',
    ...(isFirst ? { paddingLeft: 16 } : {}),
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: 0.6, color: 'var(--text-muted)', marginBottom: 6,
};

const valueStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)',
  letterSpacing: -0.8, lineHeight: 1,
};

const subStyle: React.CSSProperties = {
  fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4,
};
