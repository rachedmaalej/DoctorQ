import clsx from 'clsx';
import type { QueuePatient } from './types';

interface QueueItemProps {
  patient: QueuePatient;
  isFirst: boolean;
  isLast: boolean;
  onContextOpen?: (patient: QueuePatient) => void;
  whatsappSent?: boolean;
}

function getWaitDotColor(minutes: number): string {
  if (minutes <= 20) return 'bg-bs-green';
  if (minutes <= 45) return 'bg-bs-amber';
  return 'bg-bs-red';
}

function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export default function QueueItem({ patient, isFirst, isLast, onContextOpen, whatsappSent }: QueueItemProps) {
  const handlePhone = () => {
    if (patient.hasPhone && patient.phone) {
      window.open(`tel:${patient.phone}`, '_self');
    }
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 py-3 relative',
        !isLast && 'border-b border-bs-border',
      )}
    >
      {/* Position circle */}
      <div
        className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold',
          isFirst ? 'bg-bs-accent-light text-bs-accent' : 'bg-bs-surface-alt text-bs-text-secondary',
        )}
        style={{ fontSize: 13 }}
      >
        {patient.position}
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0">
        <div
          className="text-bs-text-primary font-semibold truncate"
          style={{ fontSize: 15 }}
        >
          {patient.name}
          {whatsappSent && (
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 13,
                color: '#25D366',
                marginLeft: 4,
                verticalAlign: 'middle',
                fontVariationSettings: "'FILL' 1",
              }}
              title="Lien WhatsApp envoyé"
            >
              check_circle
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-px" style={{ fontSize: 12, color: '#9E9B90' }}>
          <span className={clsx('w-[7px] h-[7px] rounded-full shrink-0', getWaitDotColor(patient.waitMinutes))} />
          <span>
            {formatWaitTime(patient.waitMinutes)}
            {patient.hasPhone && ' · 📱'}
          </span>
        </div>
      </div>

      {/* Badge */}
      {patient.badge && <Badge type={patient.badge} />}

      {/* Action buttons */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={handlePhone}
          className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center text-bs-text-tertiary transition-all duration-150',
            !patient.hasPhone && 'opacity-20 pointer-events-none',
          )}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>phone</span>
        </button>
        <button
          onClick={() => onContextOpen?.(patient)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-bs-text-tertiary transition-all duration-150"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>more_vert</span>
        </button>
      </div>
    </div>
  );
}

function Badge({ type }: { type: 'priority' | 'stepped-out' | 'no-phone' }) {
  const styles: Record<string, { bg: string; text: string; label: string; fontWeight: string }> = {
    priority: { bg: 'bg-bs-amber-light', text: 'text-bs-amber', label: 'Prioritaire', fontWeight: '700' },
    'stepped-out': { bg: 'bg-bs-blue-light', text: 'text-bs-blue', label: 'Sorti', fontWeight: '700' },
    'no-phone': { bg: 'bg-bs-surface-alt', text: 'text-bs-text-tertiary', label: 'Sans tél.', fontWeight: '600' },
  };
  const s = styles[type];

  return (
    <span
      className={clsx('shrink-0 rounded-full px-2 py-[3px] uppercase', s.bg, s.text)}
      style={{ fontSize: 10, fontWeight: s.fontWeight, letterSpacing: '0.05em' }}
    >
      {s.label}
    </span>
  );
}
