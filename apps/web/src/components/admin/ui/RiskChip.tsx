interface RiskChipProps {
  level: 'high' | 'medium' | 'low' | 'none' | 'internal';
}

const levelConfig: Record<
  RiskChipProps['level'],
  { background: string; color: string; label: string }
> = {
  high: {
    background: 'var(--danger-pale)',
    color: 'var(--danger)',
    label: '\uD83D\uDD34 High',
  },
  medium: {
    background: 'var(--warning-pale)',
    color: 'var(--warning)',
    label: '\u26A1 Medium',
  },
  low: {
    background: 'var(--success-pale)',
    color: 'var(--success)',
    label: '\u2713 Low',
  },
  none: {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    label: '\u2014',
  },
  internal: {
    background: 'var(--surface-2)',
    color: 'var(--text-secondary)',
    label: 'Internal',
  },
};

export default function RiskChip({ level }: RiskChipProps) {
  const { background, color, label } = levelConfig[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}
