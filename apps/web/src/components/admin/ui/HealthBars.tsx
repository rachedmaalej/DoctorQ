interface HealthBarsProps {
  level: 1 | 2 | 3 | 4;
  color: 'green' | 'orange' | 'red';
  label: string;
}

const colorMap: Record<HealthBarsProps['color'], string> = {
  green: 'var(--success)',
  orange: 'var(--warning)',
  red: 'var(--danger)',
};

export default function HealthBars({ level, color, label }: HealthBarsProps) {
  const fillColor = colorMap[color];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 16,
              borderRadius: 2,
              background: i <= level ? fillColor : 'var(--border)',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: fillColor }}>{label}</span>
    </div>
  );
}
