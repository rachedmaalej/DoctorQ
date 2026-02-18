import type { ClinicDetailEnriched } from '@/types';
import { Card } from '@/components/admin/ui';

interface Props {
  clinic: ClinicDetailEnriched;
}

export default function OperationalProfileCard({ clinic }: Props) {
  const joinedFormatted = new Date(clinic.joinedAt).toLocaleDateString('en-GB');
  const lastLoginFormatted = clinic.lastLoginAt
    ? new Date(clinic.lastLoginAt).toLocaleDateString('en-GB') : '—';
  const lastLoginAgo = clinic.lastActiveDaysAgo !== null
    ? (clinic.lastActiveDaysAgo === 0 ? 'Today' : `${clinic.lastActiveDaysAgo} days ago`)
    : 'Never';

  const qrGrowingLabel = clinic.qrAdoptionRate > 0 ? 'Growing ↑' : 'Flat';

  const cells = [
    { label: 'Total Patients (all time)', value: String(clinic.patientsAllTime), mono: true, sub: `Since ${joinedFormatted}` },
    { label: 'Avg Consultation', value: `${clinic.avgConsultationConfigured} min`, mono: true, sub: 'Doctor-configured' },
    { label: 'Actual Avg Wait', value: `${clinic.avgWaitTimeMinutes} min`, mono: true, color: 'var(--warning)', sub: 'Based on queue data' },
    { label: 'Notify at Position', value: `#${clinic.notifyAtPosition}`, mono: true, sub: `Patient notified when ${clinic.notifyAtPosition}${clinic.notifyAtPosition === 1 ? 'st' : clinic.notifyAtPosition === 2 ? 'nd' : 'th'} in line` },
    { label: 'Peak Hours', value: clinic.peakHourRange, mono: true, sub: 'Historical average' },
    { label: 'QR Adoption', value: `${clinic.qrAdoptionRate}%`, mono: true, color: clinic.qrAdoptionRate >= 40 ? 'var(--success)' : 'var(--warning)', sub: qrGrowingLabel },
    { label: 'Language', value: clinic.language === 'fr' ? 'French' : clinic.language === 'ar' ? 'Arabic' : clinic.language, sub: 'Interface language' },
    { label: 'Last Login', value: lastLoginFormatted, mono: true, sub: lastLoginAgo },
  ];

  const qrActive = clinic.qrCodeActive;
  const lastScanRelative = clinic.qrCodeLastScannedAt
    ? getRelativeTime(new Date(clinic.qrCodeLastScannedAt)) : 'Never';

  return (
    <Card title="Operational Profile" subtitle="Performance metrics & configuration">
      {/* 4x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
        {cells.map((cell, i) => (
          <div key={i} style={{
            padding: '16px 20px',
            borderRight: (i % 4 === 3) ? 'none' : '1px solid var(--border-subtle)',
            borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 0.6, color: 'var(--text-muted)', marginBottom: 6,
            }}>{cell.label}</div>
            <div style={{
              fontSize: 14, fontWeight: 500, color: cell.color || 'var(--text-primary)',
              ...(cell.mono ? { fontFamily: 'var(--mono)', fontSize: 13.5 } : {}),
            }}>{cell.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{cell.sub}</div>
          </div>
        ))}
      </div>

      {/* QR Code status box */}
      <div style={{ padding: 16 }}>
        <div style={{
          background: qrActive ? 'var(--brand-pale)' : 'var(--warning-pale)',
          border: `1px solid ${qrActive ? 'var(--brand-pale-2)' : '#F0C080'}`,
          borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 13.5, fontWeight: 600,
              color: qrActive ? 'var(--brand)' : 'var(--warning)', marginBottom: 3,
            }}>
              {qrActive ? 'QR Code is active' : 'QR Code not yet used'}
            </div>
            <div style={{ fontSize: 12.5, color: qrActive ? 'var(--brand-mid)' : '#B45309' }}>
              {qrActive
                ? `Patients can scan to self-check-in · Last scan: ${lastScanRelative}`
                : 'This clinic has not received any QR check-ins yet'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button style={qrBtnStyle}>Download QR</button>
            <button style={qrBtnStyle}>Regenerate</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

const qrBtnStyle: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 550,
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
  background: '#fff', color: 'var(--text-primary)', border: '1px solid var(--border)',
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
