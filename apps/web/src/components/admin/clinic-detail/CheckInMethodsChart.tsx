import type { ClinicDetailEnriched } from '@/types';

interface Props {
  data: ClinicDetailEnriched['methodChartData'];
  qrAdoptionRate: number;
}

export default function CheckInMethodsChart({ data, qrAdoptionRate }: Props) {
  const total = data.totalLast30Days || 1;
  const manualPct = Math.round((data.manual / total) * 100);
  const qrPct = Math.round((data.qr / total) * 100);
  const whatsappPct = Math.round((data.whatsapp / total) * 100);

  const methods = [
    { label: '👩‍💼 Manual (Receptionist)', count: data.manual, pct: manualPct, color: 'var(--text-muted)', opacity: 0.5 },
    { label: '📱 QR Code (Self-service)', count: data.qr, pct: qrPct, color: 'var(--success)', opacity: 1 },
    { label: '💬 WhatsApp', count: data.whatsapp, pct: whatsappPct, color: 'var(--info)', opacity: 1 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Check-in method breakdown · Last 30 days · {data.totalLast30Days} total
      </div>

      {methods.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 13, minWidth: 160 }}>{m.label}</span>
          <div style={{
            flex: 1, height: 10, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${m.pct}%`,
              background: m.color, opacity: m.opacity, transition: 'width 0.8s ease',
            }} />
          </div>
          <span style={{
            fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--mono)', minWidth: 50,
            textAlign: 'right', color: m.count > 0 ? m.color : 'var(--text-muted)',
          }}>
            {m.count} ({m.pct}%)
          </span>
        </div>
      ))}

      {/* Conditional insight box */}
      {data.qrGrowing && (
        <div style={{
          background: 'var(--success-pale)', border: '1px solid #A8DFB8', borderRadius: 8,
          padding: '12px 14px', marginTop: 16, fontSize: 13, color: 'var(--success)',
        }}>
          <strong>📈 QR adoption is growing.</strong> {data.qrGrowthNote} If the trend continues, they could hit 50%+ next month — at which point they'll feel the full value of the product.
        </div>
      )}

      {qrAdoptionRate === 0 && !data.qrGrowing && (
        <div style={{
          background: 'var(--danger-pale)', border: '1px solid #E8AAAA', borderRadius: 8,
          padding: '12px 14px', marginTop: 16, fontSize: 13, color: 'var(--danger)',
        }}>
          🚨 No QR scans yet. This clinic is 100% manual. Send them the QR setup guide to unlock self-service check-in.
        </div>
      )}
    </div>
  );
}
