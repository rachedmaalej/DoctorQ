import ASIcon from './ASIcon';
import type { QueueEntry } from '@/types';

interface ASCheckInBadgesProps {
  patients: QueueEntry[];
}

export default function ASCheckInBadges({ patients }: ASCheckInBadgesProps) {
  const active = patients.filter(p =>
    p.status === 'WAITING' || p.status === 'NOTIFIED' || p.status === 'IN_CONSULTATION'
  );

  const qrCount = active.filter(p => p.checkInMethod === 'QR_CODE').length;
  const manualCount = active.filter(p => p.checkInMethod === 'MANUAL').length;
  const whatsappCount = active.filter(p => p.checkInMethod === 'WHATSAPP').length;

  if (qrCount === 0 && manualCount === 0 && whatsappCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '6px 16px 10px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
    }}>
      {qrCount > 0 && (
        <Badge icon="qr_code_2" count={qrCount} label="VIA QR" variant="qr" />
      )}
      {manualCount > 0 && (
        <Badge icon="person_add" count={manualCount} label="MANUEL" variant="manual" />
      )}
      {whatsappCount > 0 && (
        <Badge icon="chat" count={whatsappCount} label="WHATSAPP" variant="manual" />
      )}
    </div>
  );
}

const BADGE_STYLES = {
  qr: { background: '#3EAA6D', color: '#fff' },
  manual: { background: '#E8ECF4', color: '#8A94A6' },
};

function Badge({ icon, count, label, variant }: {
  icon: string;
  count: number;
  label: string;
  variant: 'qr' | 'manual';
}) {
  const style = BADGE_STYLES[variant];
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      padding: '0 9px',
      height: 20,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      <ASIcon name={icon} size={12} />
      {count} {label}
    </span>
  );
}
