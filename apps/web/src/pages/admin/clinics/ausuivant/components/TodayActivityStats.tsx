import type { ClinicDetail } from '@/types';
import { useIsMobile } from '../../useIsMobile';

interface TodayActivityStatsProps {
  stats: ClinicDetail['todayStats'];
}

const STATS_CONFIG = [
  { key: 'waiting', label: 'En Attente', color: undefined },
  { key: 'inConsultation', label: 'En Consultation', mobileLabel: 'En Consult.', color: undefined },
  { key: 'completed', label: 'Terminés', color: '#16a34a' },
  { key: 'noShows', label: 'Absents', color: '#dc2626' },
  { key: 'cancelled', label: 'Annulés', color: undefined },
] as const;

export default function TodayActivityStats({ stats }: TodayActivityStatsProps) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e0d8',
        padding: '1.3rem',
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
        Activité du Jour
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: '0.6rem',
        }}
      >
        {STATS_CONFIG.map((s, i) => {
          const value = stats[s.key as keyof typeof stats];
          const label = isMobile && 'mobileLabel' in s && s.mobileLabel ? s.mobileLabel : s.label;
          const isLast = i === STATS_CONFIG.length - 1;
          return (
            <div
              key={s.key}
              role="status"
              style={{
                background: '#fff',
                padding: '0.8rem',
                borderRadius: 10,
                border: '1px solid #e5e0d8',
                textAlign: 'center',
                gridColumn: isMobile && isLast ? '1 / -1' : undefined,
              }}
            >
              <div
                style={{
                  fontSize: '0.62rem',
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.2rem',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: s.color || '#1a1a2e',
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
