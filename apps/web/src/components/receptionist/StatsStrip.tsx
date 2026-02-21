import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { QueueScreenStatus } from './types';

interface StatsStripProps {
  status: QueueScreenStatus;
  chip1Value: number;
  chip2Value: number;
  chip3Value: string;
}

export default function StatsStrip({ status, chip1Value, chip2Value, chip3Value }: StatsStripProps) {
  const { t } = useTranslation();
  const chip1Label = status === 'CLOSING' ? t('receptionist.statsStrip.remaining') : t('receptionist.statsStrip.waiting');

  return (
    <div className="flex gap-2">
      {/* Chip 1 — highlighted */}
      <div
        className="flex-1 bg-bs-accent-light text-center rounded-bs-sm py-1.5 px-2"
        style={{ border: '1px solid rgba(15,123,108,0.15)' }}
      >
        <div
          className="text-bs-accent font-bold leading-none"
          style={{ fontSize: 20, letterSpacing: '-0.03em' }}
        >
          {chip1Value}
        </div>
        <div
          className="text-bs-text-tertiary font-medium mt-[2px] uppercase"
          style={{ fontSize: 9, letterSpacing: '0.04em' }}
        >
          {chip1Label}
        </div>
      </div>

      {/* Chip 2 */}
      <StatChip value={String(chip2Value)} label={t('receptionist.statsStrip.seen')} />

      {/* Chip 3 */}
      <StatChip value={chip3Value} label={t('receptionist.statsStrip.estimatedEnd')} />
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className={clsx(
      'flex-1 bg-bs-surface border border-bs-border text-center rounded-bs-sm py-1.5 px-2',
    )}>
      <div
        className="text-bs-text-primary font-bold leading-none"
        style={{ fontSize: 20, letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      <div
        className="text-bs-text-tertiary font-medium mt-[2px] uppercase"
        style={{ fontSize: 9, letterSpacing: '0.04em' }}
      >
        {label}
      </div>
    </div>
  );
}
