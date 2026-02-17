import clsx from 'clsx';
import type { QueueScreenStatus } from './types';

interface StatsStripProps {
  status: QueueScreenStatus;
  chip1Value: number;
  chip2Value: number;
  chip3Value: string;
}

export default function StatsStrip({ status, chip1Value, chip2Value, chip3Value }: StatsStripProps) {
  const chip1Label = status === 'CLOSING' ? 'Restants' : 'En attente';

  return (
    <div className="flex gap-2">
      {/* Chip 1 — highlighted */}
      <div
        className="flex-1 bg-bs-accent-light text-center rounded-bs-sm py-2.5 px-3"
        style={{ border: '1px solid rgba(15,123,108,0.15)' }}
      >
        <div
          className="text-bs-accent font-bold leading-none"
          style={{ fontSize: 22, letterSpacing: '-0.03em' }}
        >
          {chip1Value}
        </div>
        <div
          className="text-bs-text-tertiary font-medium mt-[3px] uppercase"
          style={{ fontSize: 11, letterSpacing: '0.04em' }}
        >
          {chip1Label}
        </div>
      </div>

      {/* Chip 2 */}
      <StatChip value={String(chip2Value)} label="Vus" />

      {/* Chip 3 */}
      <StatChip value={chip3Value} label="Fin estimée" />
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className={clsx(
      'flex-1 bg-bs-surface border border-bs-border text-center rounded-bs-sm py-2.5 px-3',
    )}>
      <div
        className="text-bs-text-primary font-bold leading-none"
        style={{ fontSize: 22, letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      <div
        className="text-bs-text-tertiary font-medium mt-[3px] uppercase"
        style={{ fontSize: 11, letterSpacing: '0.04em' }}
      >
        {label}
      </div>
    </div>
  );
}
