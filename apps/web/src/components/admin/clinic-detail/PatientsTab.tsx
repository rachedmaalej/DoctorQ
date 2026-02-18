import type { ClinicDetailEnriched } from '@/types';
import { StatCard, Card, BadgePill } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
}

export default function PatientsTab({ clinic }: Props) {
  const joinedFormatted = new Date(clinic.joinedAt).toLocaleDateString('en-GB');

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard
          label="Total Patients"
          value={clinic.patientsAllTime}
          valueColor="brand"
          subtext={`All time · Since ${joinedFormatted}`}
        />
        <StatCard
          label="Avg Wait Time"
          value={`${clinic.avgWaitTimeMinutes} min`}
          valueColor="brand"
          subtext="Last 30 days average"
        />
        <StatCard
          label="Avg Consultation"
          value={`${clinic.avgConsultationMinutes} min`}
          subtext={`Actual vs ${clinic.avgConsultationConfigured}min configured`}
        />
        <StatCard
          label="No-Show Rate"
          value={`${clinic.noShowRate}%`}
          valueColor={clinic.noShowRate > 5 ? 'warning' : undefined}
          subtext={`${Math.round(clinic.patientsAllTime * clinic.noShowRate / 100)} of ${clinic.patientsAllTime} patients`}
        />
      </div>

      {/* Recent Patients Table */}
      <Card
        title="Recent Patients"
        subtitle="Last 30 days · Showing most recent sessions"
        headerRight={
          <button style={{
            padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 550,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            background: '#fff', color: 'var(--text-primary)', border: '1px solid var(--border)',
          }}>
            Export CSV
          </button>
        }
      >
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px',
          background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
          fontSize: 11, fontWeight: 650, textTransform: 'uppercase', letterSpacing: 0.6,
          color: 'var(--text-muted)',
        }}>
          <div style={{ minWidth: 24 }}>#</div>
          <div style={{ minWidth: 80 }}>Date</div>
          <div style={{ minWidth: 60 }}>Arrived</div>
          <div style={{ minWidth: 60 }}>Wait</div>
          <div style={{ minWidth: 70 }}>Consult</div>
          <div style={{ minWidth: 90 }}>Method</div>
          <div style={{ minWidth: 80 }}>Status</div>
          <div style={{ flex: 1 }}>Notes</div>
        </div>

        {/* Table rows */}
        {clinic.recentPatients.slice(0, 20).map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', minWidth: 24 }}>
              {p.sequenceNumber}
            </div>
            <div style={{ fontSize: 12.5, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', minWidth: 80 }}>
              {p.date.split('/').slice(0, 2).join('/')}
            </div>
            <div style={{ fontSize: 12.5, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', minWidth: 60 }}>
              {p.arrivedAt}
            </div>
            <div style={{
              fontSize: 12.5, fontFamily: 'var(--mono)', minWidth: 60,
              color: p.waitMinutes === null ? 'var(--text-muted)'
                : p.waitMinutes < 15 ? 'var(--success)'
                : p.waitMinutes < 30 ? 'var(--warning)'
                : 'var(--danger)',
            }}>
              {p.waitMinutes !== null ? `${p.waitMinutes} min` : '—'}
            </div>
            <div style={{ fontSize: 12.5, fontFamily: 'var(--mono)', minWidth: 70 }}>
              {p.consultMinutes !== null ? `${p.consultMinutes} min` : '—'}
            </div>
            <div style={{ minWidth: 90 }}>
              <BadgePill variant={p.checkInMethod === 'QR' ? 'green' : p.checkInMethod === 'WHATSAPP' ? 'blue' : 'gray'}>
                {p.checkInMethod === 'QR' ? '📱 QR' : p.checkInMethod === 'WHATSAPP' ? '💬 WA' : 'Manual'}
              </BadgePill>
            </div>
            <div style={{ minWidth: 80 }}>
              <BadgePill variant={
                p.status === 'COMPLETED' ? 'gray'
                : p.status === 'NO_SHOW' ? 'orange'
                : p.status === 'CANCELLED' ? 'red'
                : 'blue'
              }>
                {p.status === 'COMPLETED' ? 'Done'
                  : p.status === 'NO_SHOW' ? 'No Show'
                  : p.status === 'CANCELLED' ? 'Cancelled'
                  : 'In Progress'}
              </BadgePill>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
              {p.notes || '—'}
            </div>
          </div>
        ))}

        {/* Pagination footer */}
        <div style={{
          padding: '12px 20px', background: 'var(--surface-2)',
          borderTop: '1px solid var(--border-subtle)', textAlign: 'center',
          fontSize: 12.5, color: 'var(--text-secondary)',
        }}>
          Showing {Math.min(20, clinic.recentPatients.length)} of {clinic.patientsAllTime} patients
          · <span style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}>View all →</span>
        </div>
      </Card>
    </div>
  );
}
