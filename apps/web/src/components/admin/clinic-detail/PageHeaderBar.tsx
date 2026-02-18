import type { ClinicDetailEnriched } from '@/types';

interface PageHeaderBarProps {
  clinic: ClinicDetailEnriched;
  onBack: () => void;
  onLoginAs: () => void;
  onPause: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

const tagStyles: Record<string, React.CSSProperties> = {
  TRIAL: { background: 'var(--accent-pale)', color: '#92400E', border: '1px solid #F0C080' },
  PAID: { background: 'var(--success-pale)', color: 'var(--success)', border: '1px solid #A8DFB8' },
  CHURNED: { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
};

export default function PageHeaderBar({
  clinic, onBack, onLoginAs, onPause, onResetPassword, onDelete, actionLoading,
}: PageHeaderBarProps) {
  const planTag = tagStyles[clinic.plan] || tagStyles.TRIAL;
  const isActiveTag = clinic.isActive
    ? { background: 'var(--success-pale)', color: 'var(--success)', border: '1px solid #A8DFB8', label: 'ACTIVE' }
    : { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', label: 'PAUSED' };

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer', background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s',
            }}
          >
            ← Clinics
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, marginLeft: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{clinic.name}</div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
              borderRadius: 5, fontSize: 11.5, fontWeight: 600, ...planTag,
            }}>
              {clinic.plan}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
              borderRadius: 5, fontSize: 11.5, fontWeight: 600, ...isActiveTag,
            }}>
              {isActiveTag.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn brand" onClick={onLoginAs} disabled={actionLoading === 'impersonate'}
            style={btnStyle('brand')}>
            {actionLoading === 'impersonate' ? '...' : 'Login as Clinic'}
          </button>
          <button onClick={onPause} disabled={actionLoading === 'status'}
            style={btnStyle('warning-outline')}>
            {actionLoading === 'status' ? '...' : (clinic.isActive ? 'Pause' : 'Unpause')}
          </button>
          <button onClick={onResetPassword} disabled={actionLoading === 'password'}
            style={btnStyle('outline')}>
            Reset Password
          </button>
          <button onClick={onDelete} style={btnStyle('danger-ghost')}>
            Delete
          </button>
        </div>
      </div>
      <div style={{
        fontSize: 13, color: 'var(--text-muted)', marginLeft: 16, marginBottom: 20, marginTop: -12,
      }}>
        {clinic.doctorName} &nbsp;·&nbsp; {clinic.doctorEmail} &nbsp;·&nbsp; {clinic.address || '—'}
        &nbsp;·&nbsp; Joined {new Date(clinic.joinedAt).toLocaleDateString('en-GB')}
      </div>
    </>
  );
}

function btnStyle(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 550,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
    whiteSpace: 'nowrap', border: '1px solid',
  };
  switch (variant) {
    case 'brand':
      return { ...base, background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' };
    case 'warning-outline':
      return { ...base, background: '#fff', color: 'var(--warning)', borderColor: '#F0C080' };
    case 'outline':
      return { ...base, background: '#fff', color: 'var(--text-primary)', borderColor: 'var(--border)' };
    case 'danger-ghost':
      return { ...base, background: 'none', color: 'var(--danger)', borderColor: 'transparent' };
    default:
      return base;
  }
}
