import { useRef, useEffect, useState } from 'react';
import type { ContextCardContent } from './utils';

interface PSContextCardProps {
  content: ContextCardContent | null;
  notifyEnabled: boolean;
  onNotifyToggle: () => void;
}

// ─── SVG Icons ───

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const iconMap = {
  exit: ExitIcon,
  location: LocationIcon,
  check: CheckIcon,
} as const;

// ─── Bold text helper ───
function renderBodyWithBold(body: string, boldText?: string) {
  if (!boldText || !body.includes(boldText)) {
    return <span>{body}</span>;
  }
  const idx = body.indexOf(boldText);
  return (
    <span>
      {body.slice(0, idx)}
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{boldText}</strong>
      {body.slice(idx + boldText.length)}
    </span>
  );
}

export default function PSContextCard({ content, notifyEnabled, onNotifyToggle }: PSContextCardProps) {
  const [animate, setAnimate] = useState(false);
  const prevVariantRef = useRef(content?.variant);

  // Trigger slide-down animation when variant changes
  useEffect(() => {
    if (content?.variant !== prevVariantRef.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      prevVariantRef.current = content?.variant;
      return () => clearTimeout(timer);
    }
  }, [content?.variant]);

  if (!content) return null;

  const IconComponent = iconMap[content.iconType];

  return (
    <div className={`ps-ctx-card ctx-${content.variant} ps-fade-up-d3 ${animate ? 'ps-slide-down' : ''}`}>
      {/* Icon row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div className="ps-ctx-icon-box">
          <IconComponent />
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
          {content.title}
        </div>
      </div>

      {/* Body */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {renderBodyWithBold(content.body, content.bodyStrong)}
      </div>

      {/* Notification toggle */}
      {content.showNotify && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Me prévenir avant mon tour
          </span>
          <button
            className="ps-toggle"
            role="switch"
            aria-checked={notifyEnabled}
            onClick={onNotifyToggle}
          >
            <span className="ps-toggle-knob" />
          </button>
        </div>
      )}
    </div>
  );
}
