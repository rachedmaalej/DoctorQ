import React from 'react';

interface TagProps {
  variant: 'trial' | 'paid' | 'churned' | 'expiring';
  children: React.ReactNode;
}

const variantStyles: Record<
  TagProps['variant'],
  { background: string; color: string; border: string; animation?: string }
> = {
  trial: {
    background: 'var(--accent-pale)',
    color: '#92400E',
    border: '#F0C080',
  },
  paid: {
    background: 'var(--success-pale)',
    color: 'var(--success)',
    border: '#A8DFB8',
  },
  churned: {
    background: 'var(--danger-pale)',
    color: 'var(--danger)',
    border: '#E8AAAA',
  },
  expiring: {
    background: '#FEF3E6',
    color: '#C05307',
    border: '#F6C77B',
    animation: 'admin-pulse 2s infinite',
  },
};

export default function Tag({ variant, children }: TagProps) {
  const { background, color, border, animation } = variantStyles[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 5,
        fontSize: 11.5,
        fontWeight: 600,
        background,
        color,
        border: `1px solid ${border}`,
        animation,
      }}
    >
      {children}
    </span>
  );
}
