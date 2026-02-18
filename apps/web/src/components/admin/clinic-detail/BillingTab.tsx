import type { ClinicDetailEnriched } from '@/types';
import { Card } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
  onUpgrade: () => void;
}

export default function BillingTab({ clinic, onUpgrade }: Props) {
  // For now, show empty state for trial clinics
  if (clinic.plan === 'TRIAL') {
    return (
      <Card title="Billing History">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            No billing history yet
          </div>
          <div style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>
            This clinic is on a free trial. Billing history will appear here once they convert to a paid plan.
          </div>
          <button onClick={onUpgrade} style={{
            marginTop: 16, padding: '7px 14px', borderRadius: 7, fontSize: 13,
            fontWeight: 550, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            background: 'var(--brand)', color: '#fff', border: 'none',
          }}>
            Upgrade to Paid →
          </button>
        </div>
      </Card>
    );
  }

  // Paid state placeholder — structure accepts invoices but shows empty for now
  return (
    <Card title="Billing History">
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Active subscription
        </div>
        <div style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>
          Detailed invoice history will appear here. The clinic is currently on a paid plan.
        </div>
      </div>
    </Card>
  );
}
