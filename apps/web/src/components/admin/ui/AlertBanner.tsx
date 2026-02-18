import React, { useState } from 'react';

interface AlertBannerProps {
  variant: 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  body: React.ReactNode;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onDismiss?: () => void;
}

const variantStyles: Record<
  string,
  {
    background: string;
    borderColor: string;
    titleColor: string;
    bodyColor: string;
    ctaBackground: string;
  }
> = {
  warning: {
    background: 'var(--warning-pale)',
    borderColor: '#F0C080',
    titleColor: '#92400E',
    bodyColor: '#B45309',
    ctaBackground: '#92400E',
  },
  danger: {
    background: 'var(--danger-pale)',
    borderColor: '#E8AAAA',
    titleColor: '#991B1B',
    bodyColor: '#B91C1C',
    ctaBackground: '#991B1B',
  },
  info: {
    background: 'var(--info-pale)',
    borderColor: '#A8D4EF',
    titleColor: '#1E40AF',
    bodyColor: '#1D4ED8',
    ctaBackground: '#1E40AF',
  },
};

const AlertBanner: React.FC<AlertBannerProps> = ({
  variant,
  icon,
  title,
  body,
  ctaLabel,
  onCtaClick,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const vStyle = variantStyles[variant];

  const containerStyle: React.CSSProperties = {
    borderRadius: 10,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    animation: 'admin-slideDown 0.3s ease',
    background: vStyle.background,
    border: `1px solid ${vStyle.borderColor}`,
    position: 'relative',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 16,
    flexShrink: 0,
    lineHeight: 1,
    paddingTop: 1,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13.5,
    fontWeight: 600,
    color: vStyle.titleColor,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: 13,
    color: vStyle.bodyColor,
    marginTop: 2,
  };

  const ctaStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: 5,
    color: '#fff',
    alignSelf: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    border: 'none',
    background: vStyle.ctaBackground,
  };

  const dismissStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 10,
    background: 'none',
    border: 'none',
    fontSize: 16,
    opacity: 0.5,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  };

  return (
    <div style={containerStyle}>
      <span style={iconStyle}>{icon}</span>
      <div style={contentStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={bodyStyle}>{body}</div>
      </div>
      {ctaLabel && onCtaClick && (
        <button style={ctaStyle} onClick={onCtaClick}>
          {ctaLabel}
        </button>
      )}
      {onDismiss && (
        <button
          style={dismissStyle}
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
