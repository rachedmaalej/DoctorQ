interface SparklineProps {
  data: number[];
  height?: number;
}

export default function Sparkline({ data, height = 28 }: SparklineProps) {
  const max = Math.max(...data, 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height,
      }}
    >
      {data.map((value, i) => {
        const proportion = value / max;
        const barHeight = Math.max(proportion * height, height * 0.05);

        return (
          <div
            key={i}
            style={{
              width: 6,
              borderRadius: '2px 2px 0 0',
              height: barHeight,
              background: value > 0 ? 'var(--brand-light)' : 'var(--brand-pale-2)',
            }}
          />
        );
      })}
    </div>
  );
}
