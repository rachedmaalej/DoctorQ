import type { ClinicDetailEnriched } from '@/types';
import { Card, BadgePill } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
  onExtend: () => void;
  onUpgrade: () => void;
}

export default function SubscriptionCard({ clinic, onExtend, onUpgrade }: Props) {
  const trialEndFormatted = clinic.trialEndsAt
    ? new Date(clinic.trialEndsAt).toLocaleDateString('en-GB') : '—';

  return (
    <Card
      title="Subscription"
      subtitle={`${clinic.plan} plan · ${clinic.trialEndsAt ? 'Expires ' + trialEndFormatted : 'Active'}`}
      headerRight={
        <BadgePill variant={clinic.plan === 'TRIAL' ? 'yellow' : clinic.plan === 'PAID' ? 'green' : 'gray'}>
          {clinic.plan}
        </BadgePill>
      }
    >
      <div style={{ padding: 20 }}>
        {/* Status row */}
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Status</span>
          <span style={{
            fontWeight: 600,
            color: clinic.plan === 'TRIAL' ? 'var(--warning)' : clinic.plan === 'PAID' ? 'var(--success)' : 'var(--danger)',
          }}>
            {clinic.plan}
          </span>
        </div>

        {/* Trial progress */}
        {clinic.plan === 'TRIAL' && (
          <div style={{ padding: '12px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>Trial period</span>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                {clinic.daysUntilTrialExpires !== null ? `${clinic.daysUntilTrialExpires} days left` : '—'}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, background: 'var(--brand-light)',
                width: `${clinic.trialProgressPercent}%`, transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )}

        {/* Info rows */}
        {clinic.plan === 'TRIAL' && (
          <div style={rowStyle}>
            <span style={rowLabelStyle}>Trial ends</span>
            <span style={{ fontWeight: 500, fontFamily: 'var(--mono)' }}>{trialEndFormatted}</span>
          </div>
        )}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={rowLabelStyle}>Admin extensions given</span>
          <span style={{ fontWeight: 500 }}>{clinic.adminExtensionsGiven}</span>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <button onClick={onExtend} style={{
            padding: 11, borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff',
            fontSize: 14, fontWeight: 550, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            color: 'var(--text-primary)', transition: 'all 0.15s',
          }}>
            Extend Trial
          </button>
          <button onClick={onUpgrade} style={{
            padding: 11, borderRadius: 8, border: 'none', background: 'var(--brand)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            color: '#fff', transition: 'all 0.15s',
          }}>
            Upgrade to Paid →
          </button>
        </div>
      </div>
    </Card>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13.5,
};

const rowLabelStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
};
