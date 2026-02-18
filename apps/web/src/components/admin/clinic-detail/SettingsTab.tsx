import type { ClinicDetailEnriched } from '@/types';
import { Card } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
  onLoginAs: () => void;
  onResetPassword: () => void;
  onExtendTrial: () => void;
  onPause: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
  color: 'var(--text-muted)', marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
};

const monoValueStyle: React.CSSProperties = {
  ...valueStyle, fontFamily: "var(--mono, 'DM Mono', monospace)", fontSize: 12.5,
};

const rowStyle: React.CSSProperties = {
  padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
};

export default function SettingsTab({
  clinic, onLoginAs, onResetPassword, onExtendTrial, onPause, onDelete, actionLoading,
}: Props) {
  const configRows = [
    { label: 'Clinic Name', value: clinic.name },
    { label: 'Doctor Name', value: clinic.doctorName },
    { label: 'Email', value: clinic.doctorEmail, mono: true },
    { label: 'Phone', value: clinic.phone || '—' },
    { label: 'Address', value: clinic.address || '—' },
    { label: 'Language', value: clinic.language },
    { label: 'Specialty', value: clinic.specialty || '—' },
    { label: 'Avg Consultation (configured)', value: `${clinic.avgConsultationConfigured} min` },
    { label: 'Notify at Position', value: `#${clinic.notifyAtPosition}` },
  ];

  // Find last admin action from timeline
  const lastAdminAction = clinic.timeline.find(e => e.isAdminAction);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      {/* Left: Clinic Configuration */}
      <Card title="Clinic Configuration" subtitle="Read-only view of doctor's settings">
        <div>
          {configRows.map((row, i) => (
            <div key={i} style={{
              ...rowStyle,
              ...(i === configRows.length - 1 ? { borderBottom: 'none' } : {}),
            }}>
              <div style={labelStyle}>{row.label}</div>
              <div style={row.mono ? monoValueStyle : valueStyle}>{row.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Right: Admin Controls */}
      <Card title="Admin Controls" subtitle="Actions that affect this clinic's account">
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ActionButton
            label="Login as Clinic"
            description="impersonate account"
            variant="brand"
            onClick={onLoginAs}
            loading={actionLoading === 'impersonate'}
          />
          <ActionButton
            label="Reset Password"
            description="send reset email"
            variant="outline"
            onClick={onResetPassword}
            loading={actionLoading === 'password'}
          />
          {clinic.plan === 'TRIAL' && (
            <ActionButton
              label="Extend Trial"
              description="add days manually"
              variant="outline"
              onClick={onExtendTrial}
            />
          )}
          <ActionButton
            label={clinic.isActive ? 'Pause Account' : 'Unpause Account'}
            description={clinic.isActive ? 'disable queue temporarily' : 'resume queue access'}
            variant="warning-outline"
            onClick={onPause}
            loading={actionLoading === 'status'}
          />
          <ActionButton
            label="Delete Clinic"
            description="permanently remove all data"
            variant="danger"
            onClick={onDelete}
            loading={actionLoading === 'delete'}
          />

          {/* Last admin action info box */}
          <div style={{
            marginTop: 16, padding: '12px 14px', background: 'var(--surface-2)',
            borderRadius: 8, fontSize: 12.5, color: 'var(--text-secondary)',
          }}>
            {lastAdminAction
              ? `Last admin action: ${lastAdminAction.title} on ${new Date(lastAdminAction.timestamp).toLocaleDateString('en-GB')} at ${new Date(lastAdminAction.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
              : 'No admin actions recorded for this clinic.'
            }
          </div>
        </div>
      </Card>
    </div>
  );
}

function ActionButton({ label, description, variant, onClick, loading }: {
  label: string;
  description: string;
  variant: 'brand' | 'outline' | 'warning-outline' | 'danger';
  onClick: () => void;
  loading?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 550,
    cursor: loading ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
    gap: 8, transition: 'all 0.15s', border: '1px solid',
  };

  const variants: Record<string, React.CSSProperties> = {
    brand: { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' },
    outline: { background: '#fff', color: 'var(--text-primary)', borderColor: 'var(--border)' },
    'warning-outline': { background: '#fff', color: 'var(--warning)', borderColor: '#F0C080' },
    danger: { background: 'var(--danger-pale)', color: 'var(--danger)', borderColor: '#E8AAAA' },
  };

  return (
    <button onClick={onClick} disabled={loading} style={{ ...base, ...variants[variant] }}>
      <span style={{ fontWeight: 600 }}>{loading ? '...' : label}</span>
      <span style={{ fontSize: 12, color: 'inherit', opacity: 0.7 }}>— {description}</span>
    </button>
  );
}
