import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, headerRight, children, className }) => {
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-subtle)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: -0.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 1,
  };

  return (
    <div style={cardStyle} className={className}>
      {title && (
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>{title}</div>
            {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
