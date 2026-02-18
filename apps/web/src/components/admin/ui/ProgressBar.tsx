import React from 'react';

interface ProgressBarProps {
  label: React.ReactNode;
  value: number;
  displayValue?: string;
  color?: string;
  height?: number;
  note?: React.ReactNode;
  rightBadge?: React.ReactNode;
}

export default function ProgressBar({
  label,
  value,
  displayValue,
  color = 'var(--brand-light)',
  height = 8,
  note,
  rightBadge,
}: ProgressBarProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
        }}
      >
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {displayValue && <span>{displayValue}</span>}
          {rightBadge}
        </span>
      </div>

      <div
        style={{
          height,
          borderRadius: 99,
          background: 'var(--surface-2)',
          overflow: 'hidden',
          marginTop: 6,
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            background: color,
            width: `${value}%`,
          }}
        />
      </div>

      {note && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}
