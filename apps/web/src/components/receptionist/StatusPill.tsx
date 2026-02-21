import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { QueueScreenStatus } from './types';

interface StatusPillProps {
  status: QueueScreenStatus;
  isAllDone?: boolean;
  onClick?: () => void;
}

const config: Record<QueueScreenStatus, {
  bg: string;
  text: string;
  border: string;
  dotColor: string;
  dotClass?: string;
  showDot: boolean;
}> = {
  PRE_OPEN: {
    bg: '',
    text: 'text-bs-text-tertiary',
    border: '',
    dotColor: '',
    showDot: true,
  },
  OPEN: {
    bg: 'bg-bs-green-light',
    text: 'text-bs-green',
    border: '',
    dotColor: 'bg-bs-green',
    showDot: true,
  },
  CLOSING: {
    bg: 'bg-bs-amber-light',
    text: 'text-bs-amber',
    border: '',
    dotColor: 'bg-bs-amber animate-bs-pulse-dot',
    showDot: true,
  },
  CLOSED: {
    bg: 'bg-bs-surface-alt',
    text: 'text-bs-text-tertiary',
    border: 'border-bs-border',
    dotColor: '',
    showDot: false,
  },
};

export default function StatusPill({ status, isAllDone, onClick }: StatusPillProps) {
  const { t } = useTranslation();
  const effectiveStatus = isAllDone ? 'CLOSING' : status;
  const c = config[effectiveStatus];

  const labels: Record<QueueScreenStatus, string> = {
    PRE_OPEN: t('receptionist.statusPill.preOpen'),
    OPEN: t('receptionist.statusPill.open'),
    CLOSING: t('receptionist.statusPill.closing'),
    CLOSED: t('receptionist.statusPill.closed'),
  };

  const isClickable = status === 'OPEN' || status === 'CLOSING';

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 rounded-full py-[5px] pr-3 pl-[9px]',
        'text-xs font-semibold border transition-all duration-200',
        c.bg, c.text, c.border || 'border-transparent',
        isClickable && 'cursor-pointer',
      )}
      style={{
        borderColor:
          effectiveStatus === 'OPEN' ? 'rgba(45,139,78,0.15)' :
          effectiveStatus === 'CLOSING' ? 'rgba(212,146,11,0.15)' :
          undefined,
      }}
      onClick={isClickable ? onClick : undefined}
    >
      {c.showDot && (
        <div
          className={clsx('w-2 h-2 rounded-full shrink-0', c.dotColor)}
          style={effectiveStatus === 'PRE_OPEN' ? { backgroundColor: '#E8E6DF' } : undefined}
        />
      )}
      <span>{labels[effectiveStatus]}</span>
    </div>
  );
}
