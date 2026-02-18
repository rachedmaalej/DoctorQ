import React from 'react';

interface PipelineCardProps {
  icon: string;
  iconBg: string;
  title: string;
  meta: string;
  intentLabel: string;
  intentColor: string;
  badge: React.ReactNode;
  accentBorderColor: string;
}

const PipelineCard: React.FC<PipelineCardProps> = ({
  icon,
  iconBg,
  title,
  meta,
  intentLabel,
  intentColor,
  badge,
  accentBorderColor,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: `3px solid ${accentBorderColor}`,
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    transition: 'box-shadow 0.15s',
    cursor: 'pointer',
    boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.07)' : undefined,
  };

  const iconBlockStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
    background: iconBg,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: -0.2,
    color: 'var(--text-primary)',
  };

  const metaStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
  };

  const intentStyle: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    color: intentColor,
  };

  const badgeStyle: React.CSSProperties = {
    alignSelf: 'center',
    flexShrink: 0,
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={iconBlockStyle}>{icon}</div>
      <div style={contentStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={metaStyle}>{meta}</div>
        <div style={intentStyle}>{intentLabel}</div>
      </div>
      <div style={badgeStyle}>{badge}</div>
    </div>
  );
};

export default PipelineCard;
