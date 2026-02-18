import React from 'react';

interface BadgePillProps {
  variant: 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'yellow';
  children: React.ReactNode;
}

const variantStyles: Record<BadgePillProps['variant'], { background: string; color: string }> = {
  green: { background: 'var(--success-pale)', color: 'var(--success)' },
  red: { background: 'var(--danger-pale)', color: 'var(--danger)' },
  orange: { background: 'var(--warning-pale)', color: 'var(--warning)' },
  blue: { background: 'var(--info-pale)', color: 'var(--info)' },
  gray: { background: 'var(--surface-2)', color: 'var(--text-secondary)' },
  yellow: { background: 'var(--accent-pale)', color: '#92400E' },
};

export default function BadgePill({ variant, children }: BadgePillProps) {
  const { background, color } = variantStyles[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--mono)',
        background,
        color,
      }}
    >
      {children}
    </span>
  );
}
