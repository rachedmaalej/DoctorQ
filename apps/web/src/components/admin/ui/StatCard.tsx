import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'danger' | 'warning' | 'accent';
  dotColor?: string;
  valueColor?: string;
}

const variantStyles: Record<string, { borderColor: string; background: string }> = {
  highlight: {
    borderColor: '#3D8A6E',
    background: 'linear-gradient(135deg, var(--brand-pale) 0%, #fff 100%)',
  },
  danger: {
    borderColor: '#E8AAAA',
    background: 'linear-gradient(135deg, var(--danger-pale) 0%, #fff 100%)',
  },
  warning: {
    borderColor: '#F0C080',
    background: 'linear-gradient(135deg, var(--warning-pale) 0%, #fff 100%)',
  },
  accent: {
    borderColor: '#E8C878',
    background: 'linear-gradient(135deg, var(--accent-pale) 0%, #fff 100%)',
  },
};

const namedColors: Record<string, string> = {
  brand: '#1C4A3B',
  danger: '#C0392B',
  warning: '#E67E22',
  success: '#27AE60',
  muted: '#9E9C95',
  'accent-dark': '#B45309',
};

function resolveValueColor(valueColor?: string): string {
  if (!valueColor) return '#1A1A18';
  return namedColors[valueColor] || valueColor;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  variant = 'default',
  dotColor,
  valueColor,
}) => {
  const vStyle = variantStyles[variant];

  const containerStyle: React.CSSProperties = {
    background: vStyle ? vStyle.background : 'var(--surface)',
    border: `1px solid ${vStyle ? vStyle.borderColor : 'var(--border)'}`,
    borderRadius: 12,
    padding: '18px 20px',
    transition: 'box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: 'var(--text-muted)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const dotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: dotColor || 'transparent',
    flexShrink: 0,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -1,
    fontFamily: 'var(--mono)',
    lineHeight: 1,
    marginBottom: 8,
    color: resolveValueColor(valueColor),
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
  };

  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...containerStyle,
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.06)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={labelStyle}>
        {dotColor && <span style={dotStyle} />}
        {label}
      </div>
      <div style={valueStyle}>{value}</div>
      {subtext && <div style={subtextStyle}>{subtext}</div>}
    </div>
  );
};

export default StatCard;
