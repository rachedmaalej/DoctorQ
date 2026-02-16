import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TrendData } from '../../shared/types';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: TrendData | null;
  animationDelay?: number;
}

export default function KpiCard({ label, value, delta, animationDelay = 0 }: KpiCardProps) {
  return (
    <div
      role="status"
      className="animate-fade-in-up"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e0d8',
        padding: '1.3rem 1.4rem',
        borderRadius: 14,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div
        className="font-dm font-medium uppercase"
        style={{ color: '#999999', fontSize: '0.7rem', letterSpacing: '0.06em', marginBottom: '0.4rem' }}
      >
        {label}
      </div>
      <div className="font-playfair font-bold" style={{ fontSize: '1.7rem', color: '#1a1a2e' }}>
        {value}
      </div>
      {delta && (
        <div
          className="flex items-center gap-1 font-dm"
          style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '0.2rem' }}
        >
          {delta.direction === 'up' ? (
            <TrendingUp size={12} />
          ) : delta.direction === 'down' ? (
            <TrendingDown size={12} />
          ) : null}
          <span>
            <span className="sr-only">{delta.direction === 'up' ? 'augmentation de' : delta.direction === 'down' ? 'diminution de' : 'stable a'}</span>
            {delta.value}%
          </span>
        </div>
      )}
    </div>
  );
}
