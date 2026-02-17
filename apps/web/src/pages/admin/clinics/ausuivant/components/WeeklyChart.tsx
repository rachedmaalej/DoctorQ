import type { WeeklyDay } from '../../shared/types';
import { useIsMobile } from '../../useIsMobile';

interface WeeklyChartProps {
  data: WeeklyDay[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const isMobile = useIsMobile();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e0d8',
        padding: '1.1rem',
        marginBottom: '1.2rem',
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          marginBottom: '0.8rem',
        }}
      >
        Cette Semaine
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          height: 60,
          gap: '0.4rem',
        }}
      >
        {data.map((d, i) => {
          const barHeight = d.count > 0 ? Math.max(3, (d.count / maxCount) * 60) : 3;
          const dayLabel = isMobile ? d.dayShort : d.day;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span style={{ fontSize: '0.62rem', color: '#999' }}>{d.count > 0 ? d.count : ''}</span>
              <div
                aria-label={`${d.day} : ${d.count} patients`}
                style={{
                  width: '100%',
                  maxWidth: 32,
                  borderRadius: '3px 3px 0 0',
                  minHeight: 3,
                  height: barHeight,
                  background: d.count > 0 ? '#c0392b' : '#fde8e6',
                  transition: 'height 400ms ease-out',
                }}
              />
              <span style={{ fontSize: '0.62rem', color: '#999' }}>{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
